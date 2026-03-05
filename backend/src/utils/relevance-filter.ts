import { ALL_KEYWORDS } from '../config/relevance-keywords.js';

export interface KeywordFilterResult {
  passes: boolean;
  matchedKeywords: string[];
}

/**
 * Layer 1: Keyword pre-filter. Checks article title + first 500 chars of content
 * against the political relevance keyword list. No API call needed.
 */
export function keywordPreFilter(title: string, rawContent: string): KeywordFilterResult {
  const textToCheck = (title + ' ' + rawContent.substring(0, 500)).toLowerCase();
  const matchedKeywords: string[] = [];

  for (const keyword of ALL_KEYWORDS) {
    if (textToCheck.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
    }
  }

  return {
    passes: matchedKeywords.length > 0,
    matchedKeywords,
  };
}

/**
 * Post-processing validation: checks that each name in politicalActors
 * actually appears (by last name) in the raw article content.
 */
export function validatePoliticalActors(actors: string[], rawContent: string): string[] {
  const contentLower = rawContent.toLowerCase();

  return actors.filter(actor => {
    const parts = actor.trim().split(/\s+/);
    // Use last name for matching (handles "Juan Pablo Valdés" → "valdés")
    const lastName = parts[parts.length - 1].toLowerCase();
    return contentLower.includes(lastName);
  });
}
