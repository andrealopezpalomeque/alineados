import * as cheerio from 'cheerio';
import { BaseScraper, type RawArticle } from './base.js';

const CATEGORIES = ['politica', 'economia', 'sociedad', 'policiales', 'interior'];
const DELAY_MS = 750;
const MAX_AGE_HOURS = 48;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class RadioSudamericanaScraper extends BaseScraper {
  constructor() {
    super('RadioSudamericana', 'https://www.radiosudamericana.com');
  }

  async scrape(): Promise<RawArticle[]> {
    // Step 1: Collect article URLs from category listing pages
    const articleUrls = new Set<string>();

    for (const category of CATEGORIES) {
      try {
        const url = `${this.baseUrl}/noticias/1/${category}.htm`;
        this.log(`Fetching category: ${category}`);
        const $ = await this.fetchPage(url);

        // Article URLs follow: /nota/{category}/{id}-{slug}.htm
        $('a[href]').each((_i, el) => {
          const href = $(el).attr('href');
          if (href && /\/nota\/[^/]+\/\d+-[^/]+\.htm$/.test(href)) {
            articleUrls.add(href);
          }
        });

        await sleep(DELAY_MS);
      } catch (error) {
        this.logError(`Failed to fetch category "${category}"`, error);
      }
    }

    this.log(`Found ${articleUrls.size} unique article URLs across ${CATEGORIES.length} categories`);

    // Step 2: Fetch each article and extract content
    const articles: RawArticle[] = [];
    const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000);
    let skippedOld = 0;
    let failed = 0;

    for (const articleUrl of articleUrls) {
      try {
        const fullUrl = this.buildAbsoluteUrl(articleUrl);
        const article = await this.scrapeArticle(fullUrl);

        if (!article) {
          failed++;
          continue;
        }

        if (article.publishedAt < cutoff) {
          skippedOld++;
          continue;
        }

        articles.push(article);
        await sleep(DELAY_MS);
      } catch (error) {
        this.logError(`Failed to scrape article ${articleUrl}`, error);
        failed++;
      }
    }

    this.log(`Results: ${articles.length} recent, ${skippedOld} older than ${MAX_AGE_HOURS}h, ${failed} failed`);
    return articles;
  }

  private async scrapeArticle(url: string): Promise<RawArticle | null> {
    const $ = await this.fetchPage(url);

    // Try JSON-LD first (Radio Sudamericana has reliable NewsArticle schema)
    const jsonLd = this.extractJsonLd($);

    // Title
    const title = jsonLd?.headline
      || $('h1').first().text().trim()
      || null;

    if (!title) {
      this.logError(`No title found for ${url}`);
      return null;
    }

    // Date: JSON-LD datePublished format is "YYYY-MM-DD HH:MM:SS"
    const publishedAt = this.parseDate(jsonLd?.datePublished)
      || this.parseDateFromPage($)
      || null;

    if (!publishedAt) {
      this.logError(`No date found for ${url}`);
      return null;
    }

    // Body
    const rawContent = this.extractBody($);

    if (!rawContent || rawContent.length < 50) {
      this.logError(`No/insufficient body content for ${url}`);
      return null;
    }

    return {
      title: this.cleanText(title),
      sourceUrl: url,
      rawContent,
      publishedAt,
    };
  }

  private extractJsonLd($: cheerio.CheerioAPI): Record<string, string> | null {
    try {
      const scripts = $('script[type="application/ld+json"]');
      for (let i = 0; i < scripts.length; i++) {
        const text = $(scripts[i]).html();
        if (!text) continue;

        const data = JSON.parse(text);
        if (data['@type'] === 'NewsArticle' || data['@type'] === 'Article') {
          return data;
        }
      }
    } catch {
      // JSON-LD parsing failed, fall back to HTML
    }
    return null;
  }

  private parseDate(dateStr: string | undefined | null): Date | null {
    if (!dateStr) return null;

    try {
      // Radio Sudamericana format: "2026-03-04 10:07:20" (no timezone, assume Argentina -03:00)
      // Also handle standard ISO formats
      let date: Date;

      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
        // Append Argentina timezone offset
        date = new Date(`${dateStr.replace(' ', 'T')}-03:00`);
      } else {
        date = new Date(dateStr);
      }

      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  private parseDateFromPage($: cheerio.CheerioAPI): Date | null {
    // Visible date format: "Miércoles 04 de Marzo de 2026 - Actualizada a las: 15:16hs."
    const MONTHS: Record<string, number> = {
      enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
      julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
    };

    const datePattern = /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i;
    const bodyText = $('body').text();
    const match = bodyText.match(datePattern);

    if (match) {
      const day = parseInt(match[1], 10);
      const monthName = match[2].toLowerCase();
      const year = parseInt(match[3], 10);
      const month = MONTHS[monthName];

      if (month !== undefined) {
        // Noon ART (15:00 UTC) to safely land on the correct calendar day
        return new Date(Date.UTC(year, month, day, 15, 0, 0));
      }
    }

    return null;
  }

  private extractBody($: cheerio.CheerioAPI): string {
    // Remove unwanted elements
    $('script, style, nav, footer, header, aside, .relacionadas, .compartir').remove();

    // Get paragraphs from the article body
    let paragraphs: string[] = [];

    // Try common content selectors
    const contentSelectors = [
      '.nota-contenido p',
      '.nota-cuerpo p',
      '.article-body p',
      '#interior p',
      'article p',
      '.entry-content p',
      '.content p',
    ];

    for (const selector of contentSelectors) {
      const elements = $(selector);
      if (elements.length >= 2) {
        elements.each((_i, el) => {
          const text = $(el).text().trim();
          if (text.length > 20) {
            paragraphs.push(text);
          }
        });
        break;
      }
    }

    // Fallback: get all <p> tags after <h1>
    if (paragraphs.length === 0) {
      const h1 = $('h1').first();
      if (h1.length) {
        h1.parent().find('p').each((_i, el) => {
          const text = $(el).text().trim();
          if (text.length > 20) {
            paragraphs.push(text);
          }
        });
      }
    }

    // Second fallback: siblings and descendants after h1
    if (paragraphs.length === 0) {
      let foundH1 = false;
      $('h1, p').each((_i, el) => {
        if (el.tagName === 'h1') {
          foundH1 = true;
          return;
        }
        if (foundH1 && el.tagName === 'p') {
          const text = $(el).text().trim();
          if (text.length > 20) {
            paragraphs.push(text);
          }
        }
      });
    }

    // Last fallback: all meaningful <p> tags
    if (paragraphs.length === 0) {
      $('p').each((_i, el) => {
        const text = $(el).text().trim();
        if (text.length > 40) {
          paragraphs.push(text);
        }
      });
    }

    return paragraphs
      .map(p => this.cleanText(p))
      .join('\n\n');
  }
}
