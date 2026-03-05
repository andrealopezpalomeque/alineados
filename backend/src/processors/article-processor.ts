import { geminiModel, geminiModelFast } from '../config/gemini.js';
import type { ProcessedFields, ArticleRelevance } from '../types/index.js';
import { keywordPreFilter, validatePoliticalActors } from '../utils/relevance-filter.js';

export interface RawArticleInput {
  title: string;
  rawContent: string;
  source: string;
  sourceUrl: string;
}

export interface FilterResult {
  filtered: true;
  stage: 'keyword' | 'ai-gate';
  reason: string;
  matchedKeywords?: string[];
}

export type ProcessArticleResult =
  | { filtered: false; fields: ProcessedFields }
  | FilterResult;

// ─── Layer 2: AI Relevance Gate ──────────────────────────────────────────────

interface RelevanceGateResponse {
  relevant: boolean;
  reason: string;
}

async function aiRelevanceGate(title: string, rawContent: string): Promise<RelevanceGateResponse> {
  const snippet = rawContent.substring(0, 300);
  const prompt = `Is this article relevant to the politics, government, public policy, or political actors of Corrientes Province, Argentina? National news counts ONLY if it directly names Corrientes or a Corrientes political figure. Sports, entertainment, crime blotter, celebrity news, and human interest stories are NOT relevant unless a political figure is directly involved. Answer ONLY with a JSON object: { "relevant": true/false, "reason": "one sentence" }

Title: ${title}
Content: ${snippet}`;

  const result = await geminiModelFast.generateContent(prompt);
  const text = result.response.text();

  try {
    const parsed = JSON.parse(text.replace(/```(?:json)?\s*([\s\S]*?)```/, '$1').trim());
    return {
      relevant: parsed.relevant === true,
      reason: typeof parsed.reason === 'string' ? parsed.reason : 'No reason provided',
    };
  } catch {
    // If we can't parse the response, let it through to avoid false negatives
    console.warn('[ai-gate] Could not parse response, allowing article through:', text.substring(0, 100));
    return { relevant: true, reason: 'Parse error — defaulting to relevant' };
  }
}

// ─── Layer 3: Full Processing Prompt ─────────────────────────────────────────

function buildPrompt(article: RawArticleInput): string {
  return `Sos un analista político del gobierno provincial de Corrientes, Argentina.
El gobernador actual es Juan Pablo Valdés (coalición Vamos Corrientes / UCR), que asumió el 10 de diciembre de 2025.
El vicegobernador es Néstor Pedro Braillard Poccard.
El ex gobernador Gustavo Valdés (hermano) ahora es senador provincial.

Analizá el siguiente artículo periodístico y devolvé ÚNICAMENTE un objeto JSON válido (sin markdown, sin backticks, sin texto adicional) con estos campos:

summary: resumen de 2-3 oraciones enfocado en la relevancia política
category: una de [governor, justice, opposition, ministry, national, general]
subcategory: subcategoría opcional (ej: "education", "health", "security")
relevance: "high" | "medium" | "low" | "none" — nivel de relevancia para la política provincial de Corrientes. Si es "none", los demás campos pueden quedar vacíos/default.
politicalActors: array de nombres de figuras políticas EXPLÍCITAMENTE MENCIONADAS en el texto. NO inferir ni agregar figuras políticas que no estén nombradas en el artículo.
ministryRelevance: array de {ministry, score} donde score es high/medium/low
sentiment: postura hacia el gobierno (positive/neutral/negative)
urgency: breaking/important/routine
keyQuotes: array de {speaker, quote} para declaraciones destacadas
topics: array de palabras clave temáticas en español

DEFINICIONES DE CATEGORÍA:
- governor: el gobernador es citado, nombrado, o el artículo trata sobre sus acciones específicas
- justice: relacionado al Ministerio de Justicia y DDHH o al poder judicial provincial
- opposition: acciones o declaraciones de partidos/figuras opositoras
- ministry: acciones de ministerios provinciales (que no sean justicia)
- national: noticias de nivel nacional, incluso si afectan a Corrientes
- general: no encaja en las categorías políticas provinciales

IMPORTANTE: Un artículo NUNCA debe categorizarse como "governor" solo porque podría interesarle al gobernador. Solo usar "governor" si el gobernador está directamente involucrado.

Artículo:
Título: ${article.title}
Fuente: ${article.source}
Contenido: ${article.rawContent}`;
}

// ─── Response Parsing ────────────────────────────────────────────────────────

function parseGeminiResponse(text: string): ProcessedFields {
  try {
    return JSON.parse(text) as ProcessedFields;
  } catch {
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim()) as ProcessedFields;
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ProcessedFields;
    }

    throw new Error(`Could not parse JSON from Gemini response: ${text.substring(0, 200)}`);
  }
}

const VALID_CATEGORIES = ['governor', 'justice', 'opposition', 'ministry', 'national', 'general'] as const;
const VALID_SENTIMENTS = ['positive', 'neutral', 'negative'] as const;
const VALID_URGENCIES = ['breaking', 'important', 'routine'] as const;
const VALID_RELEVANCES = ['high', 'medium', 'low', 'none'] as const;

function validateFields(fields: ProcessedFields): ProcessedFields {
  return {
    summary: typeof fields.summary === 'string' ? fields.summary : '',
    category: VALID_CATEGORIES.includes(fields.category as any) ? fields.category : 'general',
    subcategory: typeof fields.subcategory === 'string' ? fields.subcategory : undefined,
    relevance: VALID_RELEVANCES.includes(fields.relevance as any) ? fields.relevance : 'low',
    politicalActors: Array.isArray(fields.politicalActors) ? fields.politicalActors : [],
    ministryRelevance: Array.isArray(fields.ministryRelevance) ? fields.ministryRelevance : [],
    sentiment: VALID_SENTIMENTS.includes(fields.sentiment as any) ? fields.sentiment : 'neutral',
    urgency: VALID_URGENCIES.includes(fields.urgency as any) ? fields.urgency : 'routine',
    keyQuotes: Array.isArray(fields.keyQuotes) ? fields.keyQuotes : [],
    topics: Array.isArray(fields.topics) ? fields.topics : [],
  };
}

// ─── Main Pipeline ───────────────────────────────────────────────────────────

/**
 * Full 3-layer article processing pipeline:
 * Layer 1: Keyword pre-filter (no API call)
 * Layer 2: AI relevance gate (cheap Gemini call)
 * Layer 3: Full AI processing + post-validation
 */
export async function processArticleWithFiltering(article: RawArticleInput): Promise<ProcessArticleResult> {
  // Layer 1: Keyword pre-filter
  const keywordResult = keywordPreFilter(article.title, article.rawContent);
  if (!keywordResult.passes) {
    console.log(`[filter-L1] Keyword filter rejected: "${article.title.substring(0, 60)}..."`);
    return {
      filtered: true,
      stage: 'keyword',
      reason: 'No political keywords found in title or first 500 characters',
      matchedKeywords: [],
    };
  }
  console.log(`[filter-L1] Passed (${keywordResult.matchedKeywords.length} keywords): "${article.title.substring(0, 60)}..."`);

  // Layer 2: AI relevance gate
  const gateResult = await aiRelevanceGate(article.title, article.rawContent);
  if (!gateResult.relevant) {
    console.log(`[filter-L2] AI gate rejected: "${article.title.substring(0, 60)}..." — ${gateResult.reason}`);
    return {
      filtered: true,
      stage: 'ai-gate',
      reason: gateResult.reason,
      matchedKeywords: keywordResult.matchedKeywords,
    };
  }
  console.log(`[filter-L2] Passed: "${article.title.substring(0, 60)}..."`);

  // Layer 3: Full processing
  const prompt = buildPrompt(article);
  const result = await geminiModel.generateContent(prompt);
  const responseText = result.response.text();

  const parsed = parseGeminiResponse(responseText);
  const validated = validateFields(parsed);

  // Post-validation: remove political actors not actually mentioned in article
  validated.politicalActors = validatePoliticalActors(validated.politicalActors, article.rawContent);

  return { filtered: false, fields: validated };
}

/**
 * Legacy function for backward compatibility (used by /api/process/articles route).
 * Runs full processing without filtering layers.
 */
export async function processArticle(article: RawArticleInput): Promise<ProcessedFields> {
  const prompt = buildPrompt(article);
  const result = await geminiModel.generateContent(prompt);
  const responseText = result.response.text();

  const parsed = parseGeminiResponse(responseText);
  const validated = validateFields(parsed);

  // Post-validation: still validate political actors
  validated.politicalActors = validatePoliticalActors(validated.politicalActors, article.rawContent);

  return validated;
}
