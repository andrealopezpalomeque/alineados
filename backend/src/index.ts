import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase (side-effect: connects to Firestore)
import './config/firebase.js';

import articlesRouter from './routes/articles.js';
import scraperTriggerRouter from './routes/scraper-trigger.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'alineados-backend' });
});

// Routes
app.use('/api/articles', articlesRouter);
app.use('/api/scrape', scraperTriggerRouter);

app.listen(PORT, () => {
  console.log(`Alineados backend running on port ${PORT}`);
});
