const axios = require('axios');
const crypto = require('crypto');
const env = require('../config/env');
const logger = require('../utils/logger');
const NewsArticle = require('../models/NewsArticle');

const NEWSAPI_URL = 'https://newsapi.org/v2/everything';

function hashUrl(url) {
  return crypto.createHash('sha256').update(url).digest('hex');
}

function buildQuery(company) {
  const terms = [company.name]//, ...(company.aliases || []), ...(company.searchKeywords || [])]
    .filter(Boolean)
    .map((t) => `"${t.trim()}"`);
  if (!terms.length) return company.name;
  return terms.join(' OR ');
}

// Errors that apply to every request on the key; the run should stop instead of trying each lender.
const ACCOUNT_WIDE_CODES = new Set(['apiKeyDisabled', 'apiKeyExhausted', 'apiKeyInvalid', 'apiKeyMissing', 'rateLimited']);

class NewsApiError extends Error {
  constructor(code, message) {
    super(`NewsAPI error: ${code} ${message}`);
    this.code = code;
    this.accountWide = ACCOUNT_WIDE_CODES.has(code);
  }
}

// NewsAPI wants UTC ISO 8601 without milliseconds.
function toNewsApiTime(date) {
  return date.toISOString().slice(0, 19);
}

// Where this lender's fetch should start: just before the newest article we already have
// (the overlap catches articles NewsAPI indexed late), or a fixed lookback for a new lender.
// Clamped so a long-idle lender never asks further back than the plan allows.
function resumeFrom(company, now = new Date()) {
  const { overlapHours, initialLookbackDays, maxLookbackDays } = env.newsapi;
  const from = company.newsCursor
    ? new Date(company.newsCursor.getTime() - overlapHours * 3600 * 1000)
    : new Date(now.getTime() - initialLookbackDays * 86400 * 1000);
  const earliest = new Date(now.getTime() - maxLookbackDays * 86400 * 1000);
  return from < earliest ? earliest : from;
}

async function requestPage(company, { from, to }) {
  const params = {
    q: buildQuery(company),
    language: env.newsapi.language,
    pageSize: env.newsapi.pageSize,
    sortBy: 'publishedAt',
    from: toNewsApiTime(from)
  };
  if (to) params.to = toNewsApiTime(to);

  let res;
  try {
    res = await axios.get(NEWSAPI_URL, {
      params,
      headers: { 'X-Api-Key': env.newsapi.key },
      timeout: 15000
    });
  } catch (err) {
    const data = err.response?.data;
    if (data?.code) throw new NewsApiError(data.code, data.message || '');
    throw err;
  }

  if (res.data.status !== 'ok') {
    throw new NewsApiError(res.data.code, res.data.message);
  }
  return res.data.articles || [];
}

// Fetches everything published since `from`, newest first. Results come back newest-first and a
// single query returns at most pageSize (and on the free plan at most 100 in total, so `page=2`
// is refused), so further pages are requested by moving the `to` bound back to the oldest article
// received so far. `complete` is false if maxPages ran out before reaching `from`.
async function fetchForCompany(company, { from }) {
  const all = [];
  let to = null;

  for (let page = 0; page < env.newsapi.maxPages; page++) {
    const batch = await requestPage(company, { from, to });
    all.push(...batch);
    if (batch.length < env.newsapi.pageSize) return { articles: all, complete: true };

    const oldest = batch.reduce((min, a) => {
      const t = a.publishedAt ? new Date(a.publishedAt) : null;
      return t && (!min || t < min) ? t : min;
    }, null);
    // No usable dates, or every article shares one timestamp: moving `to` would not make progress.
    if (!oldest || (to && oldest >= to)) return { articles: all, complete: false };
    to = oldest;
  }
  return { articles: all, complete: false };
}

async function persistArticles(company, rawArticles) {
  let newCount = 0;
  const inserted = [];

  for (const a of rawArticles) {
    if (!a.url || !a.title) continue;

    const urlHash = hashUrl(a.url);
    try {
      const existing = await NewsArticle.exists({ company: company._id, urlHash });
      if (existing) continue;

      const doc = await NewsArticle.create({
        company: company._id,
        companyName: company.name,
        source: a.source?.name || '',
        author: a.author || '',
        title: a.title,
        description: a.description || '',
        content: a.content || '',
        url: a.url,
        urlHash,
        imageUrl: a.urlToImage || '',
        publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
        fetchedAt: new Date(),
        classificationStatus: 'pending'
      });
      newCount += 1;
      inserted.push(doc);
    } catch (err) {
      if (err.code === 11000) continue;
      logger.error('persist article failed: %s', err.message);
    }
  }

  return { newCount, inserted };
}

async function fetchAndStoreForCompany(company) {
  const from = resumeFrom(company);
  logger.info(`Fetching news for: ${company.name} (since ${from.toISOString()})`);
  const { articles: raw, complete } = await fetchForCompany(company, { from });
  const result = await persistArticles(company, raw);

  // Advance only after the articles are stored, so a failed fetch retries from the same point.
  const newest = raw.reduce((max, a) => {
    const t = a.publishedAt ? new Date(a.publishedAt) : null;
    return t && !isNaN(t) && (!max || t > max) ? t : max;
  }, null);
  if (!complete) {
    logger.warn(
      `  ${company.name}: more articles than ${env.newsapi.maxPages} page(s) of ${env.newsapi.pageSize} since ${from.toISOString()}; ` +
        'the oldest ones were skipped (raise NEWSAPI_MAX_PAGES to fetch them)'
    );
  }
  if (newest && (!company.newsCursor || newest > company.newsCursor)) {
    await company.updateOne({ newsCursor: newest });
    company.newsCursor = newest;
  }

  logger.info(`  → fetched=${raw.length}, new=${result.newCount}`);
  return { fetched: raw.length, ...result };
}

module.exports = {
  fetchForCompany,
  fetchAndStoreForCompany,
  resumeFrom,
  hashUrl,
  NewsApiError
};
