import { Router, Request, Response } from 'express';
import { db } from '../config/firebase.js';
import { generateBriefing, getLastGenerationStatus } from '../processors/briefing-generator.js';
import type { BriefingType } from '../processors/briefing-generator.js';

const router = Router();

// GET /api/briefings/today — returns the most recent briefing regardless of type
router.get('/today', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('dailyBriefings')
      .orderBy('generatedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: 'No briefings found' });
      return;
    }

    const doc = snapshot.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('[briefings] Error fetching today\'s briefing:', error);
    res.status(500).json({ error: 'Failed to fetch briefing' });
  }
});

// GET /api/briefings/latest — smart: midday if available for today, otherwise most recent recap
router.get('/latest', async (_req: Request, res: Response) => {
  try {
    // Get today's date in ART
    const now = new Date();
    const artNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const y = artNow.getUTCFullYear();
    const m = String(artNow.getUTCMonth() + 1).padStart(2, '0');
    const d = String(artNow.getUTCDate()).padStart(2, '0');
    const todayId = `${y}-${m}-${d}`;

    // Try today's midday first
    const middayDoc = await db.collection('dailyBriefings').doc(`${todayId}-midday`).get();
    if (middayDoc.exists) {
      res.json({ id: middayDoc.id, ...middayDoc.data() });
      return;
    }

    // Fall back to most recent briefing
    const snapshot = await db.collection('dailyBriefings')
      .orderBy('generatedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: 'No briefings found' });
      return;
    }

    const doc = snapshot.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('[briefings] Error fetching latest briefing:', error);
    res.status(500).json({ error: 'Failed to fetch briefing' });
  }
});

// GET /api/briefings — list last 7 briefings (summary only)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('dailyBriefings')
      .orderBy('generatedAt', 'desc')
      .limit(14)
      .get();

    const briefings = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        generatedAt: data.generatedAt,
        executiveSummary: data.executiveSummary,
      };
    });

    res.json({ briefings });
  } catch (error) {
    console.error('[briefings] Error fetching briefings list:', error);
    res.status(500).json({ error: 'Failed to fetch briefings' });
  }
});

// POST /api/briefings/generate — manually trigger briefing generation
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { date, type } = req.body || {};

    const briefingType: BriefingType = type === 'midday' ? 'midday' : 'recap';

    const briefing = await generateBriefing({ date, type: briefingType });

    res.json({
      success: true,
      briefing: {
        id: briefing.id,
        type: briefing.type,
        executiveSummary: briefing.executiveSummary,
        sectionsCount: briefing.sections.length,
      },
    });
  } catch (error) {
    console.error('[briefings] Error generating briefing:', error);
    res.status(500).json({ error: 'Failed to generate briefing' });
  }
});

// GET /api/briefings/generate-status — last generation attempt info
router.get('/generate-status', (_req: Request, res: Response) => {
  const status = getLastGenerationStatus();
  if (!status) {
    res.json({ message: 'No generation attempts since server started.' });
    return;
  }
  res.json(status);
});

// GET /api/briefings/:date — returns both briefings (recap + midday) for a date
router.get('/:date', async (req: Request, res: Response) => {
  try {
    const dateParam = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
      return;
    }

    const [recapDoc, middayDoc] = await Promise.all([
      db.collection('dailyBriefings').doc(`${dateParam}-recap`).get(),
      db.collection('dailyBriefings').doc(`${dateParam}-midday`).get(),
    ]);

    // Also check legacy format (just date, no type suffix)
    let legacyDoc = null;
    if (!recapDoc.exists && !middayDoc.exists) {
      const legacy = await db.collection('dailyBriefings').doc(dateParam).get();
      if (legacy.exists) {
        legacyDoc = legacy;
      }
    }

    if (!recapDoc.exists && !middayDoc.exists && !legacyDoc) {
      res.status(404).json({ error: 'Briefing not found for this date' });
      return;
    }

    const result: Record<string, unknown> = {};

    if (recapDoc.exists) {
      result.recap = { id: recapDoc.id, ...recapDoc.data() };
    } else if (legacyDoc) {
      // Treat legacy briefings as recap
      result.recap = { id: legacyDoc.id, type: 'recap', ...legacyDoc.data() };
    }

    if (middayDoc.exists) {
      result.midday = { id: middayDoc.id, ...middayDoc.data() };
    }

    res.json(result);
  } catch (error) {
    console.error('[briefings] Error fetching briefing:', error);
    res.status(500).json({ error: 'Failed to fetch briefing' });
  }
});

export default router;
