const mongoose = require('mongoose');

const DEFAULT_CATEGORIES = [
  { id: 'financial', name: 'Financial', description: 'Credit, market, liquidity, capital, earnings, default, NPA, rating actions, fraud' },
  { id: 'operational', name: 'Operational', description: 'Tech outages, supply chain, key-person, fraud-internal, process failures' },
  { id: 'reputational', name: 'Reputational', description: 'Scandals, leadership issues, customer trust events, social media storms' },
  { id: 'regulatory', name: 'Regulatory', description: 'RBI/SEBI/NHB/IRDAI action, new laws, compliance breaches, sanctions' },
  { id: 'competitive', name: 'Competitive', description: 'New entrants, M&A, product launches that shift the competitive landscape' },
  { id: 'strategic', name: 'Strategic', description: 'Long-term industry trends, market shifts, partnership changes' }
];

const CategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    imgcDefinition: { type: String, default: '' },
    llmInstructions: { type: String, default: '' }
  },
  { timestamps: true }
);

const ImpactLevelSchema = new mongoose.Schema(
  {
    imgcDefinition: { type: String, default: '' },
    llmInstructions: { type: String, default: '' }
  },
  { _id: false }
);

const ConfigurationSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    impactLevelDefinitions: {
      Low: { type: ImpactLevelSchema, default: () => ({ imgcDefinition: '', llmInstructions: '' }) },
      Medium: { type: ImpactLevelSchema, default: () => ({ imgcDefinition: '', llmInstructions: '' }) },
      High: { type: ImpactLevelSchema, default: () => ({ imgcDefinition: '', llmInstructions: '' }) },
      Critical: { type: ImpactLevelSchema, default: () => ({ imgcDefinition: '', llmInstructions: '' }) }
    },
    categories: {
      type: [CategorySchema],
      default: () => DEFAULT_CATEGORIES
    },
    riskTypeDefinitions: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    extraGuidance: { type: String, default: '' },
    // Shared topic filter for lenders whose topicMode is 'default'. Empty = no filter.
    defaultTopicKeywords: { type: [String], default: [] },
    updatedBy: { type: String, default: '' }
  },
  { timestamps: true }
);

ConfigurationSchema.statics.getSingleton = async function () {
  let cfg = await this.findOne({ key: 'global' });
  if (!cfg) {
    cfg = await this.create({
      key: 'global',
      impactLevelDefinitions: {
        Low: { imgcDefinition: '', llmInstructions: '' },
        Medium: { imgcDefinition: '', llmInstructions: '' },
        High: { imgcDefinition: '', llmInstructions: '' },
        Critical: { imgcDefinition: '', llmInstructions: '' }
      },
      categories: DEFAULT_CATEGORIES
    });
  } else {
    let modified = false;
    if (!cfg.impactLevelDefinitions) {
      cfg.impactLevelDefinitions = {
        Low: { imgcDefinition: '', llmInstructions: '' },
        Medium: { imgcDefinition: '', llmInstructions: '' },
        High: { imgcDefinition: '', llmInstructions: '' },
        Critical: { imgcDefinition: '', llmInstructions: '' }
      };
      modified = true;
    } else {
      ['Low', 'Medium', 'High', 'Critical'].forEach((lvl) => {
        const val = cfg.impactLevelDefinitions[lvl];
        if (!val || typeof val === 'string') {
          cfg.impactLevelDefinitions[lvl] = {
            imgcDefinition: typeof val === 'string' ? val : '',
            llmInstructions: ''
          };
          modified = true;
        }
      });
    }

    if (!cfg.categories || cfg.categories.length === 0) {
      cfg.categories = DEFAULT_CATEGORIES;
      modified = true;
    }

    if (modified) {
      await cfg.save();
    }
  }
  return cfg;
};

module.exports = mongoose.model('Configuration', ConfigurationSchema);
