// Builds the NewsAPI `q` for a lender. Mirrored in frontend/src/app/utils/news-query.util.ts for the
// live preview on the Lenders page — keep the two in sync.
//
//   ("Name" OR "Alias" ...) AND (topic OR "multi word topic" ...)
//
// Names are exact phrases and any one may match. The topic filter is optional; when present an article
// must also mention at least one topic, which narrows results instead of widening them.

const MAX_QUERY_LENGTH = 500; // NewsAPI rejects longer queries
const TOPIC_MODES = ['default', 'custom', 'none'];

function clean(terms) {
  const seen = new Set();
  const out = [];
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
function resolveTopicMode(company) {
  if (TOPIC_MODES.includes(company.topicMode)) return company.topicMode;
  return (company.searchKeywords || []).length ? 'custom' : 'default';
}

function topicsFor(company, defaultTopics) {
  const mode = resolveTopicMode(company);
  if (mode === 'none') return [];
  return clean(mode === 'custom' ? company.searchKeywords : defaultTopics);
}

function topicTerm(t) {
  return /^[\p{L}\p{N}]+$/u.test(t) ? t : `"${t}"`;
}

function group(terms) {
  return terms.length > 1 ? `(${terms.join(' OR ')})` : terms[0];
}

function buildNewsQuery(company, defaultTopics = []) {
  const names = clean([company.name, ...(company.aliases || [])]).map((n) => `"${n}"`);
  if (!names.length) return '';
  const topics = topicsFor(company, defaultTopics).map(topicTerm);
  const namePart = group(names);
  return topics.length ? `${namePart} AND (${topics.join(' OR ')})` : namePart;
}

module.exports = { buildNewsQuery, resolveTopicMode, MAX_QUERY_LENGTH, TOPIC_MODES };
