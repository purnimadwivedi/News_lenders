const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    aliases: { type: [String], default: [] },
    sector: { type: String, default: '' },
    relationship: {
      type: String,
      enum: ['Self', 'Customer', 'Competitor', 'Lender Partner', 'Partner', 'Vendor', 'Watchlist'],
      default: 'Watchlist'
    },
    // Topic filter (an article must also mention one of these); used when topicMode is 'custom'.
    searchKeywords: { type: [String], default: [] },
    // 'default' = shared topics from Configuration, 'custom' = searchKeywords, 'none' = no topic filter.
    // Left unset on older lenders; see resolveTopicMode in utils/newsQuery.js.
    topicMode: { type: String, enum: ['default', 'custom', 'none'] },
    active: { type: Boolean, default: true },
    // Newest publishedAt seen in a complete NewsAPI fetch; the next fetch resumes from here.
    newsCursor: { type: Date, default: null },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

CompanySchema.index({ active: 1 });

CompanySchema.virtual('queryString').get(function () {
  const terms = [this.name, ...(this.aliases || []), ...(this.searchKeywords || [])]
    .filter(Boolean)
    .map((t) => `"${t}"`);
  return terms.join(' OR ');
});

module.exports = mongoose.model('Company', CompanySchema);
