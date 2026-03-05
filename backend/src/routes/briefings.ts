import { Router, Request, Response } from 'express';
import { db } from '../config/firebase.js';
import { generateBriefing, getLastGenerationStatus } from '../processors/briefing-generator.js';

const router = Router();

// GET /api/briefings/today — returns today's briefing (or most recent)
router.get('/today', async (_req: Request, res: Response) => {
  try {
    // Try to get the most recent briefing
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

// GET /api/briefings — list last 7 briefings (summary only)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('dailyBriefings')
      .orderBy('generatedAt', 'desc')
      .limit(7)
      .get();

    const briefings = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
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
    const { date } = req.body || {};
    let targetDate: Date | undefined;

    if (date) {
      targetDate = new Date(date + 'T12:00:00-03:00');
      if (isNaN(targetDate.getTime())) {
        res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        return;
      }
    }

    const briefing = await generateBriefing(targetDate);

    res.json({
      success: true,
      briefing: {
        id: briefing.id,
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

// GET /api/briefings/:date — returns briefing for specific date
router.get('/:date', async (req: Request, res: Response) => {
  try {
    const dateParam = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
      return;
    }

    const doc = await db.collection('dailyBriefings').doc(dateParam).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Briefing not found for this date' });
      return;
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('[briefings] Error fetching briefing:', error);
    res.status(500).json({ error: 'Failed to fetch briefing' });
  }
});

export default router;
