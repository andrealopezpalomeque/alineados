import { Router, Request, Response } from 'express';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { processArticle } from '../processors/article-processor.js';

const router = Router();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// POST /api/process/articles — process all unprocessed articles
router.post('/articles', async (_req: Request, res: Response) => {
  try {
    // Firestore can't query for missing fields, so fetch all and filter in-memory
    const allSnapshot = await db.collection('articles').get();
    const unprocessedDocs = allSnapshot.docs.filter(doc => {
      const data = doc.data();
      return !data.processed;
    });

    console.log(`[process] Found ${unprocessedDocs.length} unprocessed articles`);

    const results: { id: string; title: string; status: 'ok' | 'error'; error?: string }[] = [];

    for (const doc of unprocessedDocs) {
      const data = doc.data();

      try {
        console.log(`[process] Processing: ${(data.title as string).substring(0, 60)}...`);

        const fields = await processArticle({
          title: data.title as string,
          rawContent: data.rawContent as string,
          source: data.source as string,
          sourceUrl: data.sourceUrl as string,
        });

        await doc.ref.update({
          ...fields,
          processed: true,
          processedAt: Timestamp.now(),
        });

        results.push({ id: doc.id, title: data.title as string, status: 'ok' });
        console.log(`[process] Done: ${(data.title as string).substring(0, 60)}`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[process] Error processing "${data.title}": ${msg}`);
        results.push({ id: doc.id, title: data.title as string, status: 'error', error: msg });
      }

      // Rate limiting between API calls
      await delay(500);
    }

    const succeeded = results.filter(r => r.status === 'ok').length;
    const failed = results.filter(r => r.status === 'error').length;

    res.json({
      success: true,
      total: unprocessedDocs.length,
      processed: succeeded,
      errors: failed,
      results,
    });
  } catch (error) {
    console.error('[process] Fatal error:', error);
    res.status(500).json({ error: 'Processing pipeline failed' });
  }
});

// GET /api/process/test — process a sample article without saving
router.get('/test', async (_req: Request, res: Response) => {
  try {
    // Grab one article (preferably unprocessed)
    let snapshot = await db.collection('articles')
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: 'No articles found in Firestore' });
      return;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    console.log(`[process/test] Testing with: ${data.title}`);

    const fields = await processArticle({
      title: data.title as string,
      rawContent: data.rawContent as string,
      source: data.source as string,
      sourceUrl: data.sourceUrl as string,
    });

    res.json({
      articleId: doc.id,
      title: data.title,
      source: data.source,
      result: fields,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[process/test] Error:', msg);
    res.status(500).json({ error: msg });
  }
});

export default router;
