import { Router, Request, Response } from 'express';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import type { BaseScraper, RawArticle } from '../scrapers/base.js';
import { isDuplicateByTitle } from '../utils/deduplication.js';
import { processArticleWithFiltering } from '../processors/article-processor.js';

const router = Router();

// Registry of active scrapers — scrapers register themselves here
const scrapers: BaseScraper[] = [];

export function registerScraper(scraper: BaseScraper): void {
  scrapers.push(scraper);
}

interface ScraperSummary {
  found: number;
  new: number;
  duplicates: number;
  errors: number;
  errorMessages: string[];
}

// POST /api/scrape — trigger all registered scrapers
router.post('/', async (_req: Request, res: Response) => {
  const results: Record<string, ScraperSummary> = {};

  for (const scraper of scrapers) {
    const summary: ScraperSummary = { found: 0, new: 0, duplicates: 0, errors: 0, errorMessages: [] };

    try {
      const { source, articles, errors } = await scraper.run(120000);
      summary.found = articles.length;
      summary.errors = errors.length;
      summary.errorMessages = errors;

      // Fetch existing articles for this source (for dedup)
      // Try composite query (source + scrapedAt), fall back to source-only if index missing
      const existingTitles: string[] = [];
      const existingUrls = new Set<string>();

      try {
        // Use Argentina time (UTC-3) for "today" boundary
        const now = new Date();
        const artOffset = -3 * 60; // Argentina UTC-3 in minutes
        const artNow = new Date(now.getTime() + (artOffset + now.getTimezoneOffset()) * 60000);
        const todayStart = new Date(artNow.getFullYear(), artNow.getMonth(), artNow.getDate());
        // Convert back to UTC for Firestore query
        const todayStartUtc = new Date(todayStart.getTime() - (artOffset + now.getTimezoneOffset()) * 60000);
        const existingSnapshot = await db.collection('articles')
          .where('source', '==', source)
          .where('scrapedAt', '>=', Timestamp.fromDate(todayStartUtc))
          .get();
        existingSnapshot.forEach(doc => {
          const data = doc.data();
          existingTitles.push(data.title as string);
          existingUrls.add(data.sourceUrl as string);
        });
      } catch {
        // Composite index not yet created — fall back to source-only query
        console.log(`[${source}] Composite index not available, using source-only dedup`);
        const fallbackSnapshot = await db.collection('articles')
          .where('source', '==', source)
          .get();
        fallbackSnapshot.forEach(doc => {
          const data = doc.data();
          existingTitles.push(data.title as string);
          existingUrls.add(data.sourceUrl as string);
        });
      }

      for (const article of articles) {
        try {
          // Primary dedup: exact URL match
          if (existingUrls.has(article.sourceUrl)) {
            summary.duplicates++;
            console.log(`[${source}] Skipping (URL dup): ${article.title.substring(0, 60)}...`);
            continue;
          }

          // Secondary dedup: title similarity within same source/day
          if (isDuplicateByTitle(article.title, existingTitles)) {
            summary.duplicates++;
            console.log(`[${source}] Skipping (title dup): ${article.title.substring(0, 60)}...`);
            continue;
          }

          await db.collection('articles').add({
            source,
            sourceUrl: article.sourceUrl,
            title: article.title,
            rawContent: article.rawContent,
            publishedAt: Timestamp.fromDate(article.publishedAt),
            scrapedAt: Timestamp.now(),
          });

          // Track newly added for dedup within same batch
          existingUrls.add(article.sourceUrl);
          existingTitles.push(article.title);
          summary.new++;
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          summary.errors++;
          summary.errorMessages.push(`Failed to store "${article.title}": ${msg}`);
        }
      }

      results[source] = summary;
    } catch (error) {
      // Scraper failed entirely — other scrapers still run
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[scraper-trigger] Scraper failed entirely: ${msg}`);
      results[scraper['source'] || 'unknown'] = {
        found: 0,
        new: 0,
        duplicates: 0,
        errors: 1,
        errorMessages: [msg],
      };
    }
  }

  // Auto-process unprocessed articles with 3-layer filtering
  let articlesProcessed = 0;
  let articlesFiltered = 0;
  let processingErrors = 0;

  {
    const unprocessedSnapshot = await db.collection('articles').get();
    const unprocessedDocs = unprocessedSnapshot.docs.filter(doc => {
      const data = doc.data();
      // Skip already processed or filtered
      if (data.processed) return false;
      if (data.filtered) return false;
      // Skip articles that failed 3+ times (avoid infinite retries)
      if (data.processingFailures >= 3) return false;
      return true;
    });

    if (unprocessedDocs.length > 0) {
      console.log(`[scraper-trigger] Processing ${unprocessedDocs.length} unprocessed articles...`);

      for (const doc of unprocessedDocs) {
        const data = doc.data();
        try {
          const result = await processArticleWithFiltering({
            title: data.title as string,
            rawContent: data.rawContent as string,
            source: data.source as string,
            sourceUrl: data.sourceUrl as string,
          });

          if (result.filtered) {
            // Article was filtered out — mark it so we don't reprocess
            await doc.ref.update({
              filtered: true,
              filterStage: result.stage,
              filterReason: result.reason,
              matchedKeywords: result.matchedKeywords || [],
            });
            articlesFiltered++;
            console.log(`[scraper-trigger] Filtered (${result.stage}): ${(data.title as string).substring(0, 60)}`);
          } else {
            // Check if AI returned relevance "none" — treat as filtered
            if (result.fields.relevance === 'none') {
              await doc.ref.update({
                ...result.fields,
                processed: true,
                processedAt: Timestamp.now(),
                filtered: true,
                filterStage: 'relevance-none',
                filterReason: 'AI processing returned relevance: none',
              });
              articlesFiltered++;
              console.log(`[scraper-trigger] Filtered (relevance-none): ${(data.title as string).substring(0, 60)}`);
            } else {
              await doc.ref.update({
                ...result.fields,
                processed: true,
                processedAt: Timestamp.now(),
              });
              articlesProcessed++;
              console.log(`[scraper-trigger] Processed: ${(data.title as string).substring(0, 60)}`);
            }
          }
        } catch (error) {
          processingErrors++;
          const msg = error instanceof Error ? error.message : String(error);
          console.error(`[scraper-trigger] Processing error for "${data.title}": ${msg}`);

          // Track failure count so we don't retry indefinitely
          const failures = (data.processingFailures as number) || 0;
          await doc.ref.update({
            processingFailures: failures + 1,
            lastProcessingError: msg,
          });
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      console.log(`[scraper-trigger] Processing complete: ${articlesProcessed} ok, ${articlesFiltered} filtered, ${processingErrors} errors`);
    }
  }

  // Update scrape metadata
  const scrapeErrors: string[] = [];
  for (const [source, summary] of Object.entries(results)) {
    if (summary.errorMessages.length > 0) {
      scrapeErrors.push(...summary.errorMessages.map(e => `[${source}] ${e}`));
    }
  }

  await db.collection('meta').doc('scrapeStatus').set(
    {
      lastScrapeAt: Timestamp.now(),
      ...(scrapeErrors.length > 0 && { recentErrors: scrapeErrors.slice(-10) }),
    },
    { merge: true },
  );

  res.json({
    success: true,
    results,
    processing: {
      articlesProcessed,
      articlesFiltered,
      processingErrors,
    },
  });
});

// GET /api/scrape/status — last scrape time, counts per source, recent errors
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const metaDoc = await db.collection('meta').doc('scrapeStatus').get();
    const meta = metaDoc.exists ? metaDoc.data() : { lastScrapeAt: null };

    // Count articles per source
    const sourcesSnapshot = await db.collection('articles').get();
    const sourceCounts: Record<string, number> = {};
    sourcesSnapshot.forEach(doc => {
      const source = doc.data().source as string;
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    res.json({
      lastScrapeAt: meta?.lastScrapeAt ?? null,
      totalArticles: sourcesSnapshot.size,
      sources: sourceCounts,
      recentErrors: meta?.recentErrors ?? [],
    });
  } catch (error) {
    console.error('Error fetching scrape status:', error);
    res.status(500).json({ error: 'Failed to fetch scrape status' });
  }
});

export default router;
