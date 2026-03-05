import { Router, Request, Response } from 'express';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { processArticle, processArticleWithFiltering } from '../processors/article-processor.js';

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

// DELETE /api/process/reset — wipe all articles so next scrape starts fresh
router.delete('/reset', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('articles').get();
    const total = snapshot.size;

    if (total === 0) {
      res.json({ success: true, deleted: 0 });
      return;
    }

    // Firestore batch delete (max 500 per batch)
    const batchSize = 500;
    let deleted = 0;

    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
      const batch = db.batch();
      const chunk = snapshot.docs.slice(i, i + batchSize);
      chunk.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      deleted += chunk.length;
    }

    console.log(`[process/reset] Deleted ${deleted} articles`);
    res.json({ success: true, deleted });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[process/reset] Error:', msg);
    res.status(500).json({ error: msg });
  }
});

// GET /api/process/errors — show last processing errors for debugging
router.get('/errors', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('articles').get();
    const failed = snapshot.docs
      .filter(doc => doc.data().lastProcessingError)
      .map(doc => ({
        id: doc.id,
        title: (doc.data().title as string).substring(0, 60),
        failures: doc.data().processingFailures,
        error: doc.data().lastProcessingError,
      }))
      .slice(0, 10);
    res.json({ failed });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: msg });
  }
});

// GET /api/process/test-filter — test the full filtering pipeline on one article
router.get('/test-filter', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('articles').limit(1).get();
    if (snapshot.empty) {
      res.status(404).json({ error: 'No articles found' });
      return;
    }
    const doc = snapshot.docs[0];
    const data = doc.data();
    const result = await processArticleWithFiltering({
      title: data.title as string,
      rawContent: data.rawContent as string,
      source: data.source as string,
      sourceUrl: data.sourceUrl as string,
    });
    res.json({ title: data.title, result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: msg });
  }
});

// POST /api/process/retry — reset processingFailures so failed articles get retried
router.post('/retry', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('articles').get();
    const failedDocs = snapshot.docs.filter(doc => {
      const data = doc.data();
      return !data.processed && !data.filtered && (data.processingFailures || 0) > 0;
    });

    const batchSize = 500;
    let reset = 0;

    for (let i = 0; i < failedDocs.length; i += batchSize) {
      const batch = db.batch();
      const chunk = failedDocs.slice(i, i + batchSize);
      chunk.forEach(doc => batch.update(doc.ref, { processingFailures: 0, lastProcessingError: null }));
      await batch.commit();
      reset += chunk.length;
    }

    res.json({ success: true, reset });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[process/retry] Error:', msg);
    res.status(500).json({ error: msg });
  }
});

export default router;
