/**
 * Deduplication utilities for article scraping.
 *
 * Primary dedup: exact sourceUrl match (handled in Firestore query)
 * Secondary dedup: title similarity within same source and day
 */

/** Normalize a title for comparison: lowercase, strip punctuation, collapse spaces */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^\w\s]/g, '')         // strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate similarity ratio between two strings using bigram overlap.
 * Returns a value between 0 and 1.
 */
function bigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigramsA = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) {
    bigramsA.add(a.substring(i, i + 2));
  }

  const bigramsB = new Set<string>();
  for (let i = 0; i < b.length - 1; i++) {
    bigramsB.add(b.substring(i, i + 2));
  }

  let intersection = 0;
  for (const bigram of bigramsA) {
    if (bigramsB.has(bigram)) intersection++;
  }

  const union = bigramsA.size + bigramsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Check if two titles are similar enough to be considered duplicates.
 * Uses normalized comparison + bigram similarity with a 0.9 threshold.
 */
export function isTitleSimilar(titleA: string, titleB: string, threshold = 0.9): boolean {
  const normA = normalizeTitle(titleA);
  const normB = normalizeTitle(titleB);

  // Exact match after normalization
  if (normA === normB) return true;

  return bigramSimilarity(normA, normB) >= threshold;
}

/**
 * Check if an article title is a duplicate of any existing title.
 * Only compares titles from the same source and same day.
 */
export function isDuplicateByTitle(
  title: string,
  existingTitles: string[],
  threshold = 0.9,
): boolean {
  for (const existing of existingTitles) {
    if (isTitleSimilar(title, existing, threshold)) {
      return true;
    }
  }
  return false;
}
