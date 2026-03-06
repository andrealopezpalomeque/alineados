import { Router, Request, Response } from 'express';
import { db } from '../config/firebase.js';
import { generateNarrativeReport, getNarrativeGenerationStatus } from '../processors/narrative-generator.js';

const router = Router();

// GET /api/narrative/latest — most recent narrative report
router.get('/latest', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('narrativeAnalysis')
      .orderBy('generatedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: 'No narrative reports found' });
      return;
    }

    const doc = snapshot.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('[narrative] Error fetching latest report:', error);
    res.status(500).json({ error: 'Failed to fetch narrative report' });
  }
});

// GET /api/narrative/generate-status — last generation attempt info
router.get('/generate-status', (_req: Request, res: Response) => {
  const status = getNarrativeGenerationStatus();
  if (!status) {
    res.json({ message: 'No generation attempts since server started.' });
    return;
  }
  res.json(status);
});

// GET /api/narrative/history?weeks=8 — last N weeks of reports
router.get('/history', async (req: Request, res: Response) => {
  try {
    const weeksParam = parseInt(req.query.weeks as string, 10) || 8;
    const weeks = Math.min(Math.max(weeksParam, 1), 52);

    const snapshot = await db.collection('narrativeAnalysis')
      .orderBy('generatedAt', 'desc')
      .limit(weeks)
      .get();

    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ reports, count: reports.length });
  } catch (error) {
    console.error('[narrative] Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch narrative history' });
  }
});

// POST /api/narrative/generate — trigger narrative generation
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { weekId } = req.body || {};

    const report = await generateNarrativeReport(weekId);

    res.json({
      success: true,
      report: {
        id: report.id,
        executiveSummary: report.executiveSummary,
        themesCount: report.themes.length,
        timelineCount: report.timeline.length,
      },
    });
  } catch (error) {
    console.error('[narrative] Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate narrative report' });
  }
});

// GET /api/narrative/:weekId — get specific week's report (MUST be last)
router.get('/:weekId', async (req: Request, res: Response) => {
  try {
    const weekId = Array.isArray(req.params.weekId) ? req.params.weekId[0] : req.params.weekId;

    if (!/^\d{4}-W\d{2}$/.test(weekId)) {
      res.status(400).json({ error: 'Invalid weekId format. Use YYYY-WXX.' });
      return;
    }

    const doc = await db.collection('narrativeAnalysis').doc(weekId).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Narrative report not found for this week' });
      return;
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('[narrative] Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch narrative report' });
  }
});

export default router;
