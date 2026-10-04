const mongoose = require('mongoose');

const ClassificationSchema = new mongoose.Schema(
  {
    riskType: {
      type: String,
      enum: ['financial', 'operational', 'reputational', 'regulatory', 'competitive', 'strategic', 'none'],
      default: 'none'
    },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
    impactLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
    sentiment: { type: String, enum: ['Positive', 'Neutral', 'Negative'], default: 'Neutral' },
    rationale: { type: String, default: '' },
    keyEntities: { type: [String], default: [] },
    suggestedActions: { type: [String], default: [] },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    model: { type: String },
    classifiedAt: { type: Date }
  },
  { _id: false }
);


const AuditEntrySchema = new mongoose.Schema(
  {
    entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'NewsArticle' },
    fieldName: { type: String, default: 'Classification' },
    previousValue: { type: String, default: '' },
    newValue: { type: String, default: '' },
    previousImpact: { type: String, default: '' },
    newImpact: { type: String, default: '' },
    previousRiskType: { type: String, default: '' },
    newRiskType: { type: String, default: '' },
    changedBy: { type: String, default: 'Admin (Meera)' },
    changedAt: { type: Date, default: Date.now },
    performedBy: { type: String, default: 'Admin (Meera)' },
    performedAt: { type: Date, default: Date.now },
    action: {
      type: String,
      enum: ['initial_classification', 'override_applied', 'override_cleared'],
      default: 'override_applied'
    },
    note: { type: String, default: '' },
    details: { type: String, default: '' }
  },
  { _id: true }
);

const UserOverrideSchema = new mongoose.Schema(
  {
    riskType: {
      type: String,
      enum: ['financial', 'operational', 'reputational', 'regulatory', 'competitive', 'strategic', 'none']
    },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] },
    impactLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] },
    sentiment: { type: String, enum: ['Positive', 'Neutral', 'Negative'] },
    note: { type: String, default: '' },
    overriddenAt: { type: Date },
    overriddenBy: { type: String, default: '' }
  },
  { _id: false }
);

const NewsArticleSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    companyName: { type: String, required: true },
    source: { type: String, default: '' },
    author: { type: String, default: '' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    content: { type: String, default: '' },
    url: { type: String, required: true },
    urlHash: { type: String, required: true, index: true },
    imageUrl: { type: String, default: '' },
    publishedAt: { type: Date, index: true },
    fetchedAt: { type: Date, default: Date.now },

    classification: { type: ClassificationSchema, default: () => ({}) },
    classificationStatus: {
      type: String,
      enum: ['pending', 'classified', 'failed', 'skipped'],
      default: 'pending',
      index: true
    },
    classificationError: { type: String, default: '' },
    // Failures caused by the article itself; account-wide errors (billing, auth, rate limits) don't count.
    classificationAttempts: { type: Number, default: 0 },

    userOverride: { type: UserOverrideSchema, default: null },
    auditTrail: { type: [AuditEntrySchema], default: [] },

    emailedImmediate: { type: Boolean, default: false, index: true },
    includedInDigest: { type: Boolean, default: false, index: true }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

NewsArticleSchema.index({ company: 1, urlHash: 1 }, { unique: true });
NewsArticleSchema.index({ publishedAt: -1 });
NewsArticleSchema.index({ 'classification.impactLevel': 1, publishedAt: -1 });
NewsArticleSchema.index({ 'userOverride.overriddenAt': -1 });

NewsArticleSchema.virtual('effectiveClassification').get(function () {
  const ai = this.classification || {};
  const u = this.userOverride;
  if (!u || !u.overriddenAt) return { ...ai.toObject?.() || ai, source: 'ai' };
  return {
    riskType: u.riskType || ai.riskType,
    riskLevel: u.riskLevel || ai.riskLevel,
    impactLevel: u.impactLevel || ai.impactLevel,
    sentiment: u.sentiment || ai.sentiment,
    rationale: ai.rationale,
    keyEntities: ai.keyEntities,
    suggestedActions: ai.suggestedActions,
    confidence: ai.confidence,
    source: 'user'
  };
});

module.exports = mongoose.model('NewsArticle', NewsArticleSchema);
