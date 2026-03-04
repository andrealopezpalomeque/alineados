import { geminiModel } from '../config/gemini.js';
import type { ProcessedFields } from '../types/index.js';

interface RawArticleInput {
  title: string;
  rawContent: string;
  source: string;
  sourceUrl: string;
}

function buildPrompt(article: RawArticleInput): string {
  return `Sos un analista político del gobierno provincial de Corrientes, Argentina.
El gobernador actual es Juan Pablo Valdés (coalición Vamos Corrientes / UCR), que asumió el 10 de diciembre de 2025.
El vicegobernador es Néstor Pedro Braillard Poccard.
El ex gobernador Gustavo Valdés (hermano) ahora es senador provincial.
Analizá el siguiente artículo periodístico y devolvé ÚNICAMENTE un objeto JSON válido (sin markdown, sin backticks, sin texto adicional) con estos campos:

summary: resumen de 2-3 oraciones enfocado en la relevancia política
category: una de [governor, justice, opposition, ministry, national, general]
subcategory: subcategoría opcional (ej: "education", "health", "security")
politicalActors: array de nombres de figuras políticas mencionadas
ministryRelevance: array de {ministry, score} donde score es high/medium/low
sentiment: postura hacia el gobierno (positive/neutral/negative)
urgency: breaking/important/routine
keyQuotes: array de {speaker, quote} para declaraciones destacadas
topics: array de palabras clave temáticas en español

Enfocate en lo que le importa a un ministro del gabinete: ¿Qué dijo el gobernador? ¿Qué posiciones se tomaron? ¿Hay algo que requiera atención o respuesta?

Artículo:
Título: ${article.title}
Fuente: ${article.source}
Contenido: ${article.rawContent}`;
}

function parseGeminiResponse(text: string): ProcessedFields {
  // Try direct JSON parse
  try {
    return JSON.parse(text) as ProcessedFields;
  } catch {
    // Try extracting JSON from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim()) as ProcessedFields;
    }

    // Try finding JSON object in the response
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

function validateFields(fields: ProcessedFields): ProcessedFields {
  return {
    summary: typeof fields.summary === 'string' ? fields.summary : '',
    category: VALID_CATEGORIES.includes(fields.category as any) ? fields.category : 'general',
    subcategory: typeof fields.subcategory === 'string' ? fields.subcategory : undefined,
    politicalActors: Array.isArray(fields.politicalActors) ? fields.politicalActors : [],
    ministryRelevance: Array.isArray(fields.ministryRelevance) ? fields.ministryRelevance : [],
    sentiment: VALID_SENTIMENTS.includes(fields.sentiment as any) ? fields.sentiment : 'neutral',
    urgency: VALID_URGENCIES.includes(fields.urgency as any) ? fields.urgency : 'routine',
    keyQuotes: Array.isArray(fields.keyQuotes) ? fields.keyQuotes : [],
    topics: Array.isArray(fields.topics) ? fields.topics : [],
  };
}

export async function processArticle(article: RawArticleInput): Promise<ProcessedFields> {
  const prompt = buildPrompt(article);

  const result = await geminiModel.generateContent(prompt);
  const responseText = result.response.text();

  const parsed = parseGeminiResponse(responseText);
  return validateFields(parsed);
}
