import { Router } from 'express';
import { db } from '../config/firebase.js';

const router = Router();

// GET /api/articles — list articles with optional filters
router.get('/', async (req, res) => {
  try {
    const { source, category, limit = '20', offset = '0' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100);
    const offsetNum = parseInt(offset as string, 10) || 0;

    let query: FirebaseFirestore.Query = db.collection('articles')
      .orderBy('scrapedAt', 'desc');

    if (source) {
      query = query.where('source', '==', source);
    }
    if (category) {
      query = query.where('category', '==', category);
    }

    query = query.offset(offsetNum).limit(limitNum);

    const snapshot = await query.get();
    const articles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ articles, count: articles.length });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// GET /api/articles/:id — get single article
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('articles').doc(req.params.id).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

export default router;
