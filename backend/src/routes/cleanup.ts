import { Router, Request, Response } from 'express';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';

const router = Router();

const RETENTION_DAYS = 90;
const BATCH_SIZE = 100;

// DELETE /api/cleanup — remove articles older than 90 days
// NOTE: Only affects 'articles' collection. 'narrativeAnalysis' and 'dailyBriefings' are NEVER deleted.
router.delete('/', async (_req: Request, res: Response) => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
    const cutoffTimestamp = Timestamp.fromDate(cutoff);

    console.log(`[cleanup] Deleting articles older than ${cutoff.toISOString()}`);

    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const snapshot = await db.collection('articles')
        .where('publishedAt', '<', cutoffTimestamp)
        .limit(BATCH_SIZE)
        .get();

      if (snapshot.empty) {
        hasMore = false;
        break;
      }

      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      totalDeleted += snapshot.docs.length;
      console.log(`[cleanup] Deleted batch of ${snapshot.docs.length} (total: ${totalDeleted})`);
    }

    console.log(`[cleanup] Done. Deleted ${totalDeleted} articles.`);
    res.json({ success: true, deleted: totalDeleted, retentionDays: RETENTION_DAYS });
  } catch (error) {
    console.error('[cleanup] Error:', error);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

// POST /api/cleanup/archive-week — mark articles older than 30 days as archived
// NOTE: This route ONLY affects the 'articles' collection.
// The 'narrativeAnalysis' and 'dailyBriefings' collections are NEVER modified by cleanup.
router.post('/archive-week', async (_req: Request, res: Response) => {
  try {
    const ARCHIVE_DAYS = 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ARCHIVE_DAYS);
    const cutoffTimestamp = Timestamp.fromDate(cutoff);
    console.log(`[cleanup] Archiving articles older than ${ARCHIVE_DAYS} days (before ${cutoff.toISOString()})`);

    let totalArchived = 0;
    let hasMore = true;

    while (hasMore) {
      const snapshot = await db.collection('articles')
        .where('publishedAt', '<', cutoffTimestamp)
        .where('archived', '==', false)
        .limit(BATCH_SIZE)
        .get();

      if (snapshot.empty) {
        hasMore = false;
        break;
      }

      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.update(doc.ref, { archived: true }));
      await batch.commit();

      totalArchived += snapshot.docs.length;
      console.log(`[cleanup] Archived batch of ${snapshot.docs.length} (total: ${totalArchived})`);
    }

    // Also archive articles without the archived field (legacy articles)
    let legacyArchived = 0;
    hasMore = true;
    while (hasMore) {
      // Articles before cutoff that don't have archived field yet
      const snapshot = await db.collection('articles')
        .where('publishedAt', '<', cutoffTimestamp)
        .limit(BATCH_SIZE)
        .get();

      const docsToArchive = snapshot.docs.filter(doc => doc.data().archived === undefined);

      if (docsToArchive.length === 0) {
        hasMore = false;
        break;
      }

      const batch = db.batch();
      docsToArchive.forEach(doc => batch.update(doc.ref, { archived: true }));
      await batch.commit();

      legacyArchived += docsToArchive.length;
      console.log(`[cleanup] Archived ${docsToArchive.length} legacy articles (total legacy: ${legacyArchived})`);

      if (snapshot.docs.length < BATCH_SIZE) {
        hasMore = false;
      }
    }

    console.log(`[cleanup] Archive complete. ${totalArchived} archived, ${legacyArchived} legacy archived.`);
    res.json({ success: true, archived: totalArchived, legacyArchived });
  } catch (error) {
    console.error('[cleanup] Archive error:', error);
    res.status(500).json({ error: 'Archive failed' });
  }
});

export default router;
