import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase (side-effect: connects to Firestore)
import './config/firebase.js';

import articlesRouter from './routes/articles.js';
import scraperTriggerRouter, { registerScraper } from './routes/scraper-trigger.js';
import { RadioDosScraper } from './scrapers/radio-dos.js';
import { RadioSudamericanaScraper } from './scrapers/radio-sudamericana.js';

// Register scrapers
registerScraper(new RadioDosScraper());
registerScraper(new RadioSudamericanaScraper());

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'alineados-backend' });
});

// Routes
app.use('/api/articles', articlesRouter);
app.use('/api/scrape', scraperTriggerRouter);

app.listen(PORT, () => {
  console.log(`Alineados backend running on port ${PORT}`);
});
