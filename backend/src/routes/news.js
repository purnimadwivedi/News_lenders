const express = require('express');
const NewsArticle = require('../models/NewsArticle');

const router = express.Router();

function getPeriodStartDate(period = 'MTD') {
  const now = new Date();
  const p = (period || 'MTD').toUpperCase();
  if (p === 'MTD') {
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }
  if (p === 'QTD') {
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    return new Date(now.getFullYear(), qMonth, 1, 0, 0, 0, 0);
  }
  if (p === 'CFY') {
    // Current Financial Year (India: April 1 - March 31)
    const fyYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return new Date(fyYear, 3, 1, 0, 0, 0, 0);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

router.get('/', async (req, res, next) => {
  try {
    const { company, impactLevel, riskType, status, limit = 50, skip = 0, search, period } = req.query;
    const filter = {};
    if (company) filter.company = company;
    if (impactLevel) filter['classification.impactLevel'] = impactLevel;
    if (riskType) filter['classification.riskType'] = riskType;
    if (!riskType) filter['classification.riskType'] = { $ne: 'none' };
    if (status) filter.classificationStatus = status;
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (period) {
      filter.publishedAt = { $gte: getPeriodStartDate(period) };
    }

    const [items, total] = await Promise.all([
      NewsArticle.find(filter)
        .sort({ publishedAt: -1 })
        .skip(parseInt(skip, 10))
        .limit(Math.min(parseInt(limit, 10), 200))
        .populate('company', 'name relationship'),
      NewsArticle.countDocuments(filter)
    ]);

    res.json({ items, total });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const period = (req.query.period || 'MTD').toUpperCase();
    const startDate = getPeriodStartDate(period);

    const baseMatch = {
      'classification.riskType': { $ne: 'none' },
      publishedAt: { $gte: startDate }
    };
    const classifiedMatch = {
      classificationStatus: 'classified',
      ...baseMatch
    };

    const [byImpact, byRisk, byCompany, recentCount] = await Promise.all([
      NewsArticle.aggregate([
        { $match: classifiedMatch },
        { $group: { _id: '$classification.impactLevel', count: { $sum: 1 } } }
      ]),
      NewsArticle.aggregate([
        { $match: classifiedMatch },
        { $group: { _id: '$classification.riskType', count: { $sum: 1 } } }
      ]),
      NewsArticle.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$companyName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      NewsArticle.countDocuments(baseMatch)
    ]);

    res.json({
      window: period,
      total: recentCount,
      byImpact,
      byRisk,
      topCompanies: byCompany
    });
  } catch (err) {
    next(err);
  }
});

// Export Digest/Alert data in Excel/CSV format
router.get('/export/excel', async (req, res, next) => {
  try {
    const { period, limit = 500 } = req.query;
    const filter = { 'classification.riskType': { $ne: 'none' } };
    if (period) {
      filter.publishedAt = { $gte: getPeriodStartDate(period) };
    }

    const articles = await NewsArticle.find(filter)
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit, 10));

    const totalCount = articles.length;
    let csv = `DIGEST / ALERT SUMMARY\r\nCount: ${totalCount}\r\n\r\n`;
    csv += 'Count,Title,Impact,Category,Name,Publisher\r\n';

    articles.forEach((a, index) => {
      const eff = a.userOverride?.overriddenAt ? a.userOverride : (a.classification || {});
      const title = `"${(a.title || '').replace(/"/g, '""')}"`;
      const impact = `"${eff.impactLevel || 'Low'}"`;
      const category = `"${eff.riskType || 'none'}"`;
      const name = `"${(a.companyName || '').replace(/"/g, '""')}"`;
      const publisher = `"${(a.source || 'General Press').replace(/"/g, '""')}"`;
      csv += `${index + 1},${title},${impact},${category},${name},${publisher}\r\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="digest_alert_export_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// Export Digest/Alert data in PDF-ready HTML format
router.get('/export/pdf', async (req, res, next) => {
  try {
    const { period, limit = 500 } = req.query;
    const filter = { 'classification.riskType': { $ne: 'none' } };
    if (period) {
      filter.publishedAt = { $gte: getPeriodStartDate(period) };
    }

    const articles = await NewsArticle.find(filter)
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit, 10));

    const rows = articles.map((a, i) => {
      const eff = a.userOverride?.overriddenAt ? a.userOverride : (a.classification || {});
      const impact = eff.impactLevel || 'Low';
      const category = eff.riskType || 'none';
      const name = a.companyName || 'IMGC';
      const publisher = a.source || 'General Press';
      return `<tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${i + 1}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 500;">${a.title}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;"><span class="badge ${impact}">${impact}</span></td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-transform: capitalize;">${category}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${name}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">${publisher}</td>
      </tr>`;
    }).join('');

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Digest / Alert Summary</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; }
    h1 { font-size: 20px; margin: 0 0 4px 0; color: #0f172a; }
    .count-badge { font-size: 16px; font-weight: bold; color: #ea580c; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { text-align: left; padding: 10px; background: #f8fafc; font-size: 12px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge.Critical { background: #fee2e2; color: #b91c1c; }
    .badge.High { background: #ffedd5; color: #c2410c; }
    .badge.Medium { background: #fef9c3; color: #854d0e; }
    .badge.Low { background: #dcfce7; color: #15803d; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body onload="window.print()">
  <h1>DIGEST / ALERT SUMMARY</h1>
  <div class="count-badge">Count: ${articles.length}</div>
  <table>
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        <th>Title</th>
        <th style="width: 80px;">Impact</th>
        <th style="width: 100px;">Category</th>
        <th style="width: 140px;">Name</th>
        <th style="width: 120px;">Publisher</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await NewsArticle.findById(req.params.id).populate('company');
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/override', async (req, res, next) => {
  try {
    const allowed = ['riskType', 'riskLevel', 'impactLevel', 'sentiment', 'note', 'overriddenBy'];
    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }
    update.overriddenAt = new Date();

    const item = await NewsArticle.findByIdAndUpdate(
      req.params.id,
      { $set: { userOverride: update } },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/override', async (req, res, next) => {
  try {
    const item = await NewsArticle.findByIdAndUpdate(
      req.params.id,
      { $set: { userOverride: null } },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const item = await NewsArticle.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
