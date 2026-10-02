const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');
const EmailLog = require('../models/EmailLog');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined
  });
  return transporter;
}

const IMPACT_COLORS = {
  Critical: '#b91c1c',
  High: '#c2410c',
  Medium: '#854d0e',
  Low: '#15803d'
};

const IMPACT_BG = {
  Critical: '#fee2e2',
  High: '#ffedd5',
  Medium: '#fef9c3',
  Low: '#dcfce7'
};

function effectiveClassification(article) {
  const c = article.classification || {};
  const u = article.userOverride;
  if (!u || !u.overriddenAt) return { ...(c.toObject ? c.toObject() : c), source: 'ai' };
  return {
    riskType: u.riskType || c.riskType || 'none',
    riskLevel: u.riskLevel || c.riskLevel || 'Low',
    impactLevel: u.impactLevel || c.impactLevel || 'Low',
    sentiment: u.sentiment || c.sentiment || 'Neutral',
    rationale: c.rationale,
    keyEntities: c.keyEntities,
    suggestedActions: c.suggestedActions,
    confidence: c.confidence,
    source: 'user'
  };
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Common Grid Formatter for Digest Mail and Alert Mail.
 * Structure:
 * 1. COUNT
 * 2. GRID (Title, Impact, Category, Name, Publisher)
 */
function renderEmailGrid(articles, title = 'DIGEST / ALERT SUMMARY') {
  const count = articles.length;

  const rows = articles.map((article) => {
    const eff = effectiveClassification(article);
    const impact = eff.impactLevel || 'Low';
    const category = eff.riskType || 'General';
    const entityName = article.companyName || (typeof article.company === 'object' ? article.company?.name : '') || env.company.name || 'IMGC';
    const publisher = article.source || 'General Press';

    const color = IMPACT_COLORS[impact] || '#374151';
    const bg = IMPACT_BG[impact] || '#f3f4f6';

    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 14px; font-size: 13.5px; line-height: 1.45; vertical-align: top;">
          <a href="${escapeHtml(article.url)}" style="color: #1d4ed8; text-decoration: none; font-weight: 600;" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(article.title)}
          </a>
        </td>
        <td style="padding: 12px 14px; vertical-align: top; white-space: nowrap;">
          <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; color: ${color}; background: ${bg};">
            ${escapeHtml(impact)}
          </span>
        </td>
        <td style="padding: 12px 14px; vertical-align: top; font-size: 12.5px; color: #4b5563; text-transform: capitalize; white-space: nowrap;">
          ${escapeHtml(category)}
        </td>
        <td style="padding: 12px 14px; vertical-align: top; font-size: 13px; font-weight: 600; color: #1f2937;">
          ${escapeHtml(entityName)}
        </td>
        <td style="padding: 12px 14px; vertical-align: top; font-size: 12.5px; color: #6b7280; white-space: nowrap;">
          ${escapeHtml(publisher)}
        </td>
      </tr>
    `;
  }).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px; color: #111827;">
  <div style="max-width: 820px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header Section -->
    <div style="background: #1e293b; color: #ffffff; padding: 22px 24px;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em;">${escapeHtml(title)}</h1>
      <div style="margin-top: 10px; font-size: 16px; font-weight: 700; color: #f97316;">
        Count: ${count}
      </div>
    </div>

    <!-- Grid Table Section -->
    <div style="padding: 0; overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px 14px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.03em;">Title</th>
            <th style="padding: 12px 14px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.03em; width: 80px;">Impact</th>
            <th style="padding: 12px 14px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.03em; width: 100px;">Category</th>
            <th style="padding: 12px 14px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.03em; width: 130px;">Name</th>
            <th style="padding: 12px 14px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.03em; width: 110px;">Publisher</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 14px 24px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
      ${escapeHtml(env.company.name)} • Automated News Monitor
    </div>
  </div>
</body>
</html>`;
}

async function sendImmediateAlert(article, recipients) {
  if (!recipients || !recipients.length) return null;
  const eff = effectiveClassification(article);
  const subject = `[${eff.impactLevel || 'Alert'}] ${article.companyName || 'IMGC'}: ${article.title.slice(0, 80)}`;
  const html = renderEmailGrid([article], `ALERT SUMMARY — ${article.companyName || 'IMGC'}`);

  try {
    const info = await getTransporter().sendMail({
      from: `"${env.smtp.fromName}" <${env.smtp.from}>`,
      to: recipients.join(', '),
      subject,
      html
    });
    await EmailLog.create({
      type: 'immediate',
      recipients,
      subject,
      articleCount: 1,
      articleIds: [article._id],
      status: 'sent',
      messageId: info.messageId
    });
    logger.info(`✓ immediate alert sent to ${recipients.length} recipient(s): ${subject}`);
    return info;
  } catch (err) {
    await EmailLog.create({
      type: 'immediate',
      recipients,
      subject,
      articleCount: 1,
      articleIds: [article._id],
      status: 'failed',
      error: err.message
    });
    logger.error(`✗ immediate alert FAILED: ${err.message}`);
    return null;
  }
}

async function sendDigest(articles, recipients, { label = 'DIGEST SUMMARY' } = {}) {
  if (!recipients || !recipients.length || !articles || !articles.length) return null;

  const subject = `${label}: Count ${articles.length} news items`;
  const html = renderEmailGrid(articles, label);

  try {
    const info = await getTransporter().sendMail({
      from: `"${env.smtp.fromName}" <${env.smtp.from}>`,
      to: recipients.join(', '),
      subject,
      html
    });
    await EmailLog.create({
      type: 'digest',
      recipients,
      subject,
      articleCount: articles.length,
      articleIds: articles.map((a) => a._id),
      status: 'sent',
      messageId: info.messageId
    });
    logger.info(`✓ digest sent to ${recipients.length} recipient(s): ${subject}`);
    return info;
  } catch (err) {
    await EmailLog.create({
      type: 'digest',
      recipients,
      subject,
      articleCount: articles.length,
      articleIds: articles.map((a) => a._id),
      status: 'failed',
      error: err.message
    });
    logger.error(`✗ digest FAILED: ${err.message}`);
    return null;
  }
}

async function sendTestEmail(toEmail) {
  const sampleArticle = {
    title: 'RBI issues updated guidance on mortgage guarantees and capital adequacy',
    companyName: 'IMGC',
    source: 'Times of India',
    url: 'https://example.com/sample',
    classification: {
      impactLevel: 'High',
      riskType: 'regulatory'
    }
  };

  const html = renderEmailGrid([sampleArticle], 'TEST EMAIL — DIGEST / ALERT FORMAT');
  const info = await getTransporter().sendMail({
    from: `"${env.smtp.fromName}" <${env.smtp.from}>`,
    to: toEmail,
    subject: `[Test] News Monitor Alert & Digest Format for ${env.company.name}`,
    html
  });
  await EmailLog.create({
    type: 'test',
    recipients: [toEmail],
    subject: `[Test] News Monitor Alert & Digest Format for ${env.company.name}`,
    status: 'sent',
    messageId: info.messageId
  });
  return info;
}

module.exports = {
  sendImmediateAlert,
  sendDigest,
  sendTestEmail,
  renderEmailGrid
};
