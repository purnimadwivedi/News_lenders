const express = require('express');
const mongoose = require('mongoose');
const NewsArticle = require('../models/NewsArticle');
const Company = require('../models/Company');
const { getDateRange, formatDate } = require('../utils/datePeriod');

const router = express.Router();

function escapeRegex(str) {
  return String(str).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * GET /api/dashboard
 * Query parameters:
 *   - period: 'MTD' | 'QTD' | 'CFY' (default: 'MTD')
 *   - startDate: 'YYYY-MM-DD' (optional, calculated from period if omitted)
 *   - endDate: 'YYYY-MM-DD' (optional, defaults to today)
 *   - lenderId: 'ALL' or specific Company ID / Name (default: 'ALL')
 */
router.get('/', async (req, res, next) => {
  try {
    const { period = 'MTD', startDate: qStartDate, endDate: qEndDate, lenderId = 'ALL' } = req.query;

    const range = getDateRange(period, qStartDate, qEndDate);
    const isAllLenders = !lenderId || lenderId.toUpperCase() === 'ALL';

    const baseMatch = {
      publishedAt: { $gte: range.startDateTime, $lte: range.endDateTime }
    };

    if (!isAllLenders) {
      if (mongoose.Types.ObjectId.isValid(lenderId)) {
        baseMatch.$or = [
          { company: new mongoose.Types.ObjectId(lenderId) },
          { companyName: lenderId }
        ];
      } else {
        baseMatch.companyName = { $regex: new RegExp(`^${escapeRegex(lenderId)}$`, 'i') };
      }
    }

    const pipeline = [
      { $match: baseMatch },
      {
        $addFields: {
          effectiveImpact: {
            $ifNull: ['$userOverride.impactLevel', '$classification.impactLevel']
          },
          effectiveRiskType: {
            $toLower: {
              $ifNull: ['$userOverride.riskType', '$classification.riskType']
            }
          }
        }
      },
      {
        $match: {
          effectiveRiskType: { $nin: ['none', '', null] }
        }
      },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalArticles: { $sum: 1 },
                critical: {
                  $sum: { $cond: [{ $eq: ['$effectiveImpact', 'Critical'] }, 1, 0] }
                },
                high: {
                  $sum: { $cond: [{ $eq: ['$effectiveImpact', 'High'] }, 1, 0] }
                },
                medium: {
                  $sum: { $cond: [{ $eq: ['$effectiveImpact', 'Medium'] }, 1, 0] }
                },
                low: {
                  $sum: { $cond: [{ $eq: ['$effectiveImpact', 'Low'] }, 1, 0] }
                }
              }
            }
          ],
          categories: [
            {
              $group: {
                _id: '$effectiveRiskType',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],
          topMentionedLenders: [
            {
              $group: {
                _id: { $ifNull: ['$company', '$companyName'] },
                lenderName: { $first: '$companyName' },
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ];

    const [facetResult, totalLendersTracked] = await Promise.all([
      NewsArticle.aggregate(pipeline),
      isAllLenders ? Company.countDocuments({ active: { $ne: false } }) : Promise.resolve(1)
    ]);

    const result = facetResult[0] || {};
    const summaryDoc = (result.summary && result.summary[0]) || {
      totalArticles: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    const categoriesList = (result.categories || []).map((c) => ({
      _id: c._id,
      category: c._id,
      count: c.count
    }));

    let topLendersList = (result.topMentionedLenders || []).map((l) => ({
      _id: l.lenderName || String(l._id),
      name: l.lenderName || String(l._id),
      lenderId: String(l._id),
      lenderName: l.lenderName || String(l._id),
      count: l.count
    }));

    if (!isAllLenders && topLendersList.length === 0) {
      let companyName = lenderId;
      if (mongoose.Types.ObjectId.isValid(lenderId)) {
        const found = await Company.findById(lenderId);
        if (found) companyName = found.name;
      }
      topLendersList = [
        {
          _id: companyName,
          name: companyName,
          lenderId,
          lenderName: companyName,
          count: 0
        }
      ];
    }

    const response = {
      period: range.period,
      startDate: range.startDate,
      endDate: range.endDate,
      lenderId: isAllLenders ? 'ALL' : lenderId,
      summary: {
        totalArticles: summaryDoc.totalArticles,
        critical: summaryDoc.critical,
        high: summaryDoc.high,
        medium: summaryDoc.medium,
        low: summaryDoc.low,
        lendersTracked: totalLendersTracked
      },
      categories: categoriesList,
      topMentionedLenders: topLendersList,

      // Compatibility fields with existing stats contract
      window: range.period,
      total: summaryDoc.totalArticles,
      byImpact: [
        { _id: 'Critical', count: summaryDoc.critical },
        { _id: 'High', count: summaryDoc.high },
        { _id: 'Medium', count: summaryDoc.medium },
        { _id: 'Low', count: summaryDoc.low }
      ],
      byRisk: categoriesList.map((c) => ({ _id: c.category, count: c.count })),
      topCompanies: topLendersList.map((l) => ({
        _id: l.lenderName,
        name: l.lenderName,
        count: l.count
      }))
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
