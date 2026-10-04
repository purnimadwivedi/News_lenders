import { Company, TopicMode } from '../models';

// Mirror of backend/src/utils/newsQuery.js, used for the live search preview on the Lenders page.
// Keep the two in sync so the preview shows exactly what the fetch job sends to NewsAPI.

export const MAX_QUERY_LENGTH = 500;

/** Aliases this short (often tickers or abbreviations) tend to match unrelated articles. */
export const SHORT_ALIAS_LENGTH = 4;

export function cleanTerms(terms: readonly (string | null | undefined)[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of terms || []) {
    const t = String(raw || '').replace(/"/g, '').trim();
    const k = t.toLowerCase();
    if (t && !seen.has(k)) {
      seen.add(k);
      out.push(t);
    }
  }
  return out;
}

// Lenders saved before topic modes existed have no topicMode: keep their own keywords if they had any.
export function resolveTopicMode(c: Partial<Company>): TopicMode {
  if (c.topicMode === 'default' || c.topicMode === 'custom' || c.topicMode === 'none') return c.topicMode;
  return (c.searchKeywords || []).length ? 'custom' : 'default';
}

function topicTerm(t: string): string {
  return /^[\p{L}\p{N}]+$/u.test(t) ? t : `"${t}"`;
}

function group(terms: string[]): string {
  return terms.length > 1 ? `(${terms.join(' OR ')})` : terms[0];
}

export function buildNewsQuery(c: Partial<Company>, defaultTopics: string[] = []): string {
  const names = cleanTerms([c.name, ...(c.aliases || [])]).map((n) => `"${n}"`);
  if (!names.length) return '';
  const mode = resolveTopicMode(c);
  const topics = mode === 'none' ? [] : cleanTerms(mode === 'custom' ? c.searchKeywords : defaultTopics).map(topicTerm);
  const namePart = group(names);
  return topics.length ? `${namePart} AND (${topics.join(' OR ')})` : namePart;
}
