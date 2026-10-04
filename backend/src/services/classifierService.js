const Anthropic = require('@anthropic-ai/sdk');
const env = require('../config/env');
const logger = require('../utils/logger');
const NewsArticle = require('../models/NewsArticle');
const Configuration = require('../models/Configuration');

const client = new Anthropic({ apiKey: env.anthropic.apiKey });

const FEW_SHOT_LIMIT = env.anthropic.fewShotLimit;

const DEFAULT_RISK_TYPES = {
  financial: 'credit, market, liquidity, capital, earnings, default, NPA, rating actions, fraud',
  operational: 'tech outages, supply chain, key-person, fraud-internal, process failures',
  reputational: 'scandals, leadership issues, customer trust events, social media storms',
  regulatory: 'RBI/SEBI/NHB/IRDAI action, new laws, compliance breaches, sanctions',
  competitive: 'new entrants, M&A, product launches that shift the competitive landscape',
  strategic: 'long-term industry trends, market shifts, partnership changes'
};

function getClassifierTool(cfg) {
  const catEnums = (cfg?.categories || []).map((c) => c.id).filter(Boolean);
  if (!catEnums.length) {
    catEnums.push('financial', 'operational', 'reputational', 'regulatory', 'competitive', 'strategic');
  }
  if (!catEnums.includes('none')) catEnums.push('none');

  return {
    name: 'record_risk_classification',
    description: 'Record the risk assessment of a news article for the user company.',
    input_schema: {
      type: 'object',
      required: ['riskType', 'impactLevel', 'sentiment', 'rationale', 'confidence'],
      properties: {
        riskType: {
          type: 'string',
          enum: catEnums,
          description: 'Primary category of this news.'
        },
        riskLevel: {
          type: 'string',
          enum: ['Low', 'Medium', 'High', 'Critical'],
          description: 'Severity of the underlying event itself.'
        },
        impactLevel: {
          type: 'string',
          enum: ['Low', 'Medium', 'High', 'Critical'],
          description: 'How materially this affects the user company specifically, adhering to IMGC Specific Definition and LLM Instructions.'
        },
        sentiment: {
          type: 'string',
          enum: ['Positive', 'Neutral', 'Negative'],
          description: 'Overall sentiment for the user company.'
        },
        rationale: {
          type: 'string',
          description: '1-2 sentence explanation of the assessment.'
        },
        keyEntities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Notable people, companies, regulators, products, or markets mentioned.'
        },
        suggestedActions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Concrete actions the user company should consider. Empty array if none.'
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Confidence in the assessment between 0 and 1.'
        }
      }
    }
  };
}

function impactSection(defs, overallLlmInstructions) {
  const levels = ['Low', 'Medium', 'High', 'Critical'];
  const lines = levels.map((l) => {
    const item = defs && defs[l];
    let imgc = '';
    let llm = '';
    if (typeof item === 'object' && item !== null) {
      imgc = (item.imgcDefinition || '').trim();
      llm = (item.llmInstructions || '').trim();
    } else if (typeof item === 'string') {
      imgc = item.trim();
    }

    let text = `- ${l}:`;
    if (imgc) text += `\n    IMGC Specific Definition: ${imgc}`;
    if (llm) text += `\n    LLM Instructions: ${llm}`;
    if (!imgc && !llm) text += ` (use general industry judgement)`;
    return text;
  });
  let sec = `Impact level definitions (how this organisation defines impact on itself):\n${lines.join('\n')}`;
  if (defs?.impactLlmInstructions || defs?.llmInstructions) {
    const inst = (defs.impactLlmInstructions || defs.llmInstructions).trim();
    if (inst) sec += `\n\nOverall LLM Instructions for Impact Configuration:\n${inst}`;
  }
  return sec;
}

function categorySection(cfg) {
  const cats = (cfg?.categories && cfg.categories.length > 0)
    ? cfg.categories
    : Object.keys(DEFAULT_RISK_TYPES).map((k) => ({
        id: k,
        name: k.charAt(0).toUpperCase() + k.slice(1),
        description: DEFAULT_RISK_TYPES[k]
      }));

  return cats
    .map((c) => {
      const id = c.id || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const desc = c.description || DEFAULT_RISK_TYPES[id] || '';
      const imgc = (c.imgcDefinition || '').trim();
      const llm = (c.llmInstructions || '').trim();
      let text = `- ${c.name} (id: "${id}"): ${desc || 'Relevant events in this category'}`;
      if (imgc) text += `
    IMGC Specific Definition: ${imgc}`;
      if (llm) text += `
    LLM Instructions: ${llm}`;
      return text;
    })
    .join('\n');
}

function buildSystemPrompt(cfg) {
  const impactDefs = cfg?.impactLevelDefinitions;
  const extra = (cfg?.extraGuidance || '').trim();

  return `You are a senior risk analyst working for ${env.company.name} (industry: ${env.company.industry}).

Company context:
${env.company.context || '(no additional context provided)'}

Your job is to analyze news articles about companies the user is monitoring and classify each item along several dimensions, specifically through the lens of how it could affect ${env.company.name}.

Category definitions:
${categorySection(cfg)}
- none: not actually relevant (puff pieces, irrelevant mentions, sponsored content)

${impactSection(impactDefs)}

${extra ? `Additional guidance from the team:\n${extra}\n\n` : ''}Be decisive. Pick exactly one category and one impact level. Confidence below 0.4 means the article is too vague to classify well — return riskType "none" and impactLevel "Low" in that case.

You may receive prior examples in the conversation showing how the user has corrected past classifications. Treat those as the ground-truth calibration for this organisation and weight your judgement accordingly.

Always call the record_risk_classification tool with your assessment. Never reply in plain text.`;
}

function articleToUserText(article) {
  return `Company being monitored: ${article.companyName}
Source: ${article.source || 'unknown'}
Published: ${article.publishedAt ? new Date(article.publishedAt).toISOString() : 'unknown'}
URL: ${article.url}

Title: ${article.title}

Description: ${article.description || '(none)'}

Content snippet:
${article.content || article.description || '(none)'}

Classify this article.`;
}

async function fetchFewShotExamples({ limit = FEW_SHOT_LIMIT } = {}) {
  if (!limit) return [];
  const corrected = await NewsArticle.find({
    'userOverride.overriddenAt': { $exists: true, $ne: null }
  })
    .sort({ 'userOverride.overriddenAt': -1 })
    .limit(limit)
    .lean();

  return corrected.filter((a) => {
    const u = a.userOverride || {};
    const c = a.classification || {};
    return (
      (u.impactLevel && u.impactLevel !== c.impactLevel) ||
      (u.riskLevel && u.riskLevel !== c.riskLevel) ||
      (u.riskType && u.riskType !== c.riskType) ||
      (u.sentiment && u.sentiment !== c.sentiment)
    );
  });
}

function buildExampleTurns(examples) {
  const messages = [];
  examples.forEach((ex, i) => {
    const toolUseId = `example_${i}_${ex._id}`;
    const u = ex.userOverride || {};
    const c = ex.classification || {};

    messages.push({ role: 'user', content: articleToUserText(ex) });
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: toolUseId,
          name: 'record_risk_classification',
          input: {
            riskType: u.riskType || c.riskType || 'none',
            riskLevel: u.riskLevel || c.riskLevel || 'Low',
            impactLevel: u.impactLevel || c.impactLevel || 'Low',
            sentiment: u.sentiment || c.sentiment || 'Neutral',
            rationale: u.note || c.rationale || 'Calibrated based on prior user correction.',
            keyEntities: c.keyEntities || [],
            suggestedActions: c.suggestedActions || [],
            confidence: 0.95
          }
        }
      ]
    });
    messages.push({
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: toolUseId,
          content: 'Recorded.'
        }
      ]
    });
  });
  return messages;
}

async function classifyArticle(article, { examples, config } = {}) {
  const fewShot = examples ?? (await fetchFewShotExamples());
  const cfg = config ?? (await Configuration.getSingleton());
  const classifyTool = getClassifierTool(cfg);

  const messages = [
    ...buildExampleTurns(fewShot),
    { role: 'user', content: articleToUserText(article) }
  ];

  const response = await client.messages.create({
    model: env.anthropic.model,
    max_tokens: env.anthropic.maxTokens,
    system: [
      {
        type: 'text',
        text: buildSystemPrompt(cfg),
        cache_control: { type: 'ephemeral' }
      }
    ],
    tools: [classifyTool],
    tool_choice: { type: 'tool', name: 'record_risk_classification' },
    messages
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse) {
    throw new Error('Classifier did not return a tool_use block');
  }
  const out = toolUse.input;
  return {
    riskType: out.riskType,
    riskLevel: out.riskLevel || 'Low',
    impactLevel: out.impactLevel,
    sentiment: out.sentiment,
    rationale: out.rationale || '',
    keyEntities: out.keyEntities || [],
    suggestedActions: out.suggestedActions || [],
    confidence: typeof out.confidence === 'number' ? out.confidence : 0,
    model: response.model,
    classifiedAt: new Date(),
    _usage: response.usage
  };
}

// Failed articles are retried until they have failed this many times for article-specific reasons.
const MAX_CLASSIFY_ATTEMPTS = 3;

// Errors that affect every request on the account (no credits, bad key, rate limited, overloaded).
// Retrying other articles in the same run is pointless, and they say nothing about the article itself.
function accountWideReason(err) {
  if (err instanceof Anthropic.AuthenticationError) return 'Anthropic API key rejected (401)';
  if (err instanceof Anthropic.PermissionDeniedError) return 'Anthropic API permission denied (403)';
  if (err instanceof Anthropic.RateLimitError) return 'Anthropic API rate limit hit (429)';
  if (err instanceof Anthropic.APIError && err.status === 529) return 'Anthropic API overloaded (529)';
  // Billing failures arrive as a generic 400 invalid_request_error, so the message is the only signal.
  if (err instanceof Anthropic.BadRequestError && /credit balance/i.test(err.message)) {
    return 'Anthropic API credit balance too low — top up in Plans & Billing';
  }
  return null;
}

function isTransient(err) {
  if (accountWideReason(err)) return true;
  if (err instanceof Anthropic.APIConnectionError) return true;
  return err instanceof Anthropic.APIError && typeof err.status === 'number' && err.status >= 500;
}

async function classifyPending({ limit = 50 } = {}) {
  const pending = await NewsArticle.find({ classificationStatus: 'pending' })
    .sort({ publishedAt: -1 })
    .limit(limit);
  if (pending.length < limit) {
    const retries = await NewsArticle.find({
      classificationStatus: 'failed',
      classificationAttempts: { $lt: MAX_CLASSIFY_ATTEMPTS }
    })
      .sort({ publishedAt: -1 })
      .limit(limit - pending.length);
    if (retries.length) logger.info(`  retrying ${retries.length} previously failed article(s)`);
    pending.push(...retries);
  }

  const fewShot = await fetchFewShotExamples();
  const cfg = await Configuration.getSingleton();
  if (fewShot.length) {
    logger.info(`  using ${fewShot.length} user-correction example(s) as few-shot calibration`);
  }
  if (cfg && (cfg.updatedAt || cfg.createdAt)) {
    logger.info(`  using impact definitions and categories last updated ${new Date(cfg.updatedAt || cfg.createdAt).toISOString()}`);
  }

  let classified = 0;
  let failed = 0;
  let abortReason = '';

  for (const article of pending) {
    try {
      const result = await classifyArticle(article, { examples: fewShot, config: cfg });

      const { _usage, ...persisted } = result;
      article.classification = persisted;
      article.classificationStatus = 'classified';
      article.classificationError = '';
      await article.save();
      classified += 1;
      logger.info(
        `  -> classified [${result.impactLevel} impact / ${result.riskType}] ${article.title.slice(0, 80)}`
      );
    } catch (err) {
      failed += 1;
      article.classificationStatus = 'failed';
      article.classificationError = err.message?.slice(0, 500) || 'unknown error';
      if (!isTransient(err)) article.classificationAttempts = (article.classificationAttempts || 0) + 1;
      await article.save();
      logger.error(`  -> classify failed: ${err.message}`);

      abortReason = accountWideReason(err) || '';
      if (abortReason) {
        logger.error(`  stopping classification for this run: ${abortReason}`);
        break;
      }
    }
  }

  return { classified, failed, total: pending.length, abortReason };
}

module.exports = {
  classifyArticle,
  classifyPending,
  fetchFewShotExamples,
  getClassifierTool,
  buildSystemPrompt
};
