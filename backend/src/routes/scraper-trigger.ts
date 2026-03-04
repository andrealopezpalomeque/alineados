import { Router } from 'express';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import type { BaseScraper, RawArticle } from '../scrapers/base.js';
import type { ScrapeResult } from '../types/index.js';

const router = Router();

// Registry of active scrapers — scrapers register themselves here
const scrapers: BaseScraper[] = [];

export function registerScraper(scraper: BaseScraper): void {
  scrapers.push(scraper);
}

// POST /api/scrape — trigger all registered scrapers
router.post('/', async (_req, res) => {
  const results: ScrapeResult[] = [];

  for (const scraper of scrapers) {
    const { source, articles, errors } = await scraper.run();
    let articlesStored = 0;

    for (const article of articles) {
      try {
        // Check for duplicate by sourceUrl
        const existing = await db.collection('articles')
          .where('sourceUrl', '==', article.sourceUrl)
          .limit(1)
          .get();

        if (existing.empty) {
          await db.collection('articles').add({
            source,
            sourceUrl: article.sourceUrl,
            title: article.title,
            rawContent: article.rawContent,
            publishedAt: Timestamp.fromDate(article.publishedAt),
            scrapedAt: Timestamp.now(),
          });
          articlesStored++;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to store article "${article.title}": ${msg}`);
      }
    }

    results.push({
      source,
      articlesFound: articles.length,
      articlesStored,
      errors,
    });
  }

  // Update scrape metadata
  await db.collection('meta').doc('scrapeStatus').set(
    { lastScrapeAt: Timestamp.now() },
    { merge: true },
  );

  res.json({
    success: true,
    scrapersRun: scrapers.length,
    results,
  });
});

// GET /api/scrape/status — last scrape time and counts per source
router.get('/status', async (_req, res) => {
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
    });
  } catch (error) {
    console.error('Error fetching scrape status:', error);
    res.status(500).json({ error: 'Failed to fetch scrape status' });
  }
});

export default router;
