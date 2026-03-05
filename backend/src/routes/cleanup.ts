import { Router, Request, Response } from 'express';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';

const router = Router();

const RETENTION_DAYS = 90;
const BATCH_SIZE = 100;

// DELETE /api/cleanup — remove articles older than 90 days
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

export default router;
