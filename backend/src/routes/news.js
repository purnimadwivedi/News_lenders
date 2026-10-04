const express = require('express');
const mongoose = require('mongoose');
const NewsArticle = require('../models/NewsArticle');
const { getDateRange, getPeriodStartDate, parseDateParam } = require('../utils/datePeriod');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { company, impactLevel, riskType, status, limit = 50, skip = 0, search, period, startDate, endDate } = req.query;
    const conditions = [];

    if (company) conditions.push({ company });

    if (impactLevel) {
      conditions.push({
        $or: [
          { 'userOverride.impactLevel': impactLevel },
          {
            $and: [
              { $or: [{ 'userOverride.impactLevel': { $exists: false } }, { 'userOverride.impactLevel': null }, { 'userOverride.impactLevel': '' }] },
              { 'classification.impactLevel': impactLevel }
            ]
          }
        ]
      });
    }

    if (riskType) {
      conditions.push({
        $or: [
          { 'userOverride.riskType': riskType },
          {
            $and: [
              { $or: [{ 'userOverride.riskType': { $exists: false } }, { 'userOverride.riskType': null }, { 'userOverride.riskType': '' }] },
              { 'classification.riskType': riskType }
            ]
          }
        ]
      });
    } else {
      conditions.push({
        $or: [
          { 'userOverride.riskType': { $exists: true, $ne: null, $ne: 'none' } },
          {
            $and: [
              { $or: [{ 'userOverride.riskType': { $exists: false } }, { 'userOverride.riskType': null }, { 'userOverride.riskType': '' }] },
              { 'classification.riskType': { $ne: 'none' } }
            ]
          }
        ]
      });
    }

    if (status) conditions.push({ classificationStatus: status });
    if (search) conditions.push({ title: { $regex: search, $options: 'i' } });

    if (startDate || endDate) {
      const dateCond = {};
      if (startDate) {
        const s = parseDateParam(startDate, false);
        if (s) dateCond.$gte = s;
      }
      if (endDate) {
        const e = parseDateParam(endDate, true);
        if (e) dateCond.$lte = e;
      }
      conditions.push({ publishedAt: dateCond });
    } else if (period) {
      conditions.push({ publishedAt: { $gte: getPeriodStartDate(period) } });
    }

    const filter = conditions.length > 0 ? { $and: conditions } : {};

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
    const { period = 'MTD', startDate, endDate, lenderId, company } = req.query;
    const range = getDateRange(period, startDate, endDate);
    const targetLender = lenderId || company;

    const baseMatch = {
      'classification.riskType': { $ne: 'none' },
      publishedAt: { $gte: range.startDateTime, $lte: range.endDateTime }
    };

    if (targetLender && targetLender.toUpperCase() !== 'ALL') {
      if (mongoose.Types.ObjectId.isValid(targetLender)) {
        baseMatch.$or = [
          { company: new mongoose.Types.ObjectId(targetLender) },
          { companyName: targetLender }
        ];
      } else {
        baseMatch.companyName = { $regex: new RegExp(`^${targetLender.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') };
      }
    }

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
      window: range.period,
      startDate: range.startDate,
      endDate: range.endDate,
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

// Dedicated Read-Only Audit History API endpoint
router.get('/:id/audit-history', async (req, res, next) => {
  try {
    const existing = await NewsArticle.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Article not found' });
    
    // Sort newest first
    const trail = (existing.auditTrail || []).slice().sort((a, b) => {
      const tA = new Date(a.changedAt || a.performedAt).getTime();
      const tB = new Date(b.changedAt || b.performedAt).getTime();
      return tB - tA;
    });
    res.json(trail);
  } catch (err) {
    next(err);
  }
});

// Update Classification / Apply Override with append-only immutable audit trail
router.patch('/:id/override', async (req, res, next) => {
  try {
    const existing = await NewsArticle.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Article not found' });

    // Determine current effective classification from database
    const prevImpact = existing.userOverride?.impactLevel || existing.classification?.impactLevel || 'Low';
    const prevRiskType = existing.userOverride?.riskType || existing.classification?.riskType || 'none';

    const allowed = ['riskType', 'riskLevel', 'impactLevel', 'sentiment', 'note', 'overriddenBy'];
    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }

    const newImpact = update.impactLevel || prevImpact;
    const newRiskType = update.riskType || prevRiskType;

    const isSameValues = (newImpact === prevImpact && String(newRiskType).toLowerCase() === String(prevRiskType).toLowerCase());
    const actor = req.user?.name || update.overriddenBy || 'Admin (Meera)';
    const serverTime = new Date();

    const auditEntry = {
      entityId: existing._id,
      fieldName: 'Classification',
      previousValue: `Impact: ${prevImpact}, Category: ${prevRiskType}`,
      newValue: `Impact: ${newImpact}, Category: ${newRiskType}`,
      previousImpact: prevImpact,
      newImpact: newImpact,
      previousRiskType: prevRiskType,
      newRiskType: newRiskType,
      changedBy: actor,
      changedAt: serverTime,
      performedBy: actor,
      performedAt: serverTime,
      action: 'override_applied',
      note: update.note || '',
      details: isSameValues ? `Classification confirmed with note: "${update.note || ''}"` : `Classification changed from ${prevImpact} (${prevRiskType}) to ${newImpact} (${newRiskType})`
    };

    update.overriddenAt = serverTime;
    update.overriddenBy = actor;
    existing.userOverride = {
      ...(existing.userOverride ? (existing.userOverride.toObject ? existing.userOverride.toObject() : existing.userOverride) : {}),
      ...update
    };

    if (!existing.auditTrail) existing.auditTrail = [];
    existing.auditTrail.push(auditEntry);

    await existing.save();
    return res.json(existing);
  } catch (err) {
    next(err);
  }
});

// Alias for PUT /api/news/:id/classification
router.put('/:id/classification', async (req, res, next) => {
  // Delegate directly to override handler
  req.url = `/${req.params.id}/override`;
  return router.handle(req, res, next);
});

// Clear classification override & record immutable reversion audit record
router.delete('/:id/override', async (req, res, next) => {
  try {
    const existing = await NewsArticle.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Article not found' });

    const prevImpact = existing.userOverride?.impactLevel || existing.classification?.impactLevel || 'Low';
    const prevRiskType = existing.userOverride?.riskType || existing.classification?.riskType || 'none';
    const aiImpact = existing.classification?.impactLevel || 'Low';
    const aiRiskType = existing.classification?.riskType || 'none';

    // Only create audit trail if the classification is actually changing on reversion
    if (prevImpact !== aiImpact || prevRiskType !== aiRiskType) {
      const actor = req.user?.name || req.body?.clearedBy || 'Admin (Meera)';
      const serverTime = new Date();

      const auditEntry = {
        entityId: existing._id,
        fieldName: 'Classification',
        previousValue: `Impact: ${prevImpact}, Category: ${prevRiskType}`,
        newValue: `Impact: ${aiImpact}, Category: ${aiRiskType}`,
        previousImpact: prevImpact,
        newImpact: aiImpact,
        previousRiskType: prevRiskType,
        newRiskType: aiRiskType,
        changedBy: actor,
        changedAt: serverTime,
        performedBy: actor,
        performedAt: serverTime,
        action: 'override_cleared',
        note: 'Reverted to original AI classification',
        details: `Classification override cleared by ${actor}`
      };

      if (!existing.auditTrail) existing.auditTrail = [];
      existing.auditTrail.push(auditEntry);
    }

    existing.userOverride = null;
    await existing.save();
    res.json(existing);
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
