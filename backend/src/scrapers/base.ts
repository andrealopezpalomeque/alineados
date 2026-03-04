import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Article } from '../types/index.js';

export interface RawArticle {
  title: string;
  sourceUrl: string;
  rawContent: string;
  publishedAt: Date;
}

export abstract class BaseScraper {
  protected source: string;
  protected baseUrl: string;

  constructor(source: string, baseUrl: string) {
    this.source = source;
    this.baseUrl = baseUrl;
  }

  abstract scrape(): Promise<RawArticle[]>;

  protected async fetchPage(url: string): Promise<cheerio.CheerioAPI> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Alineados/1.0)',
      },
      timeout: 10000,
    });
    return cheerio.load(response.data);
  }

  protected cleanText(text: string): string {
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  protected buildAbsoluteUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const base = this.baseUrl.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  }

  protected log(message: string): void {
    console.log(`[${this.source}] ${message}`);
  }

  protected logError(message: string, error?: unknown): void {
    console.error(`[${this.source}] ERROR: ${message}`, error instanceof Error ? error.message : error);
  }

  async run(timeoutMs = 30000): Promise<{ source: string; articles: RawArticle[]; errors: string[] }> {
    const errors: string[] = [];
    let articles: RawArticle[] = [];

    try {
      this.log('Starting scrape...');

      const scrapePromise = this.scrape();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Scraper timed out after ${timeoutMs}ms`)), timeoutMs),
      );

      articles = await Promise.race([scrapePromise, timeoutPromise]);
      this.log(`Found ${articles.length} articles`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logError('Scrape failed', error);
      errors.push(msg);
    }

    return { source: this.source, articles, errors };
  }
}
