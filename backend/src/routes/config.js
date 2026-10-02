const express = require('express');
const Configuration = require('../models/Configuration');

const router = express.Router();

const ALLOWED = ['impactLevelDefinitions', 'categories', 'extraGuidance', 'updatedBy', 'riskTypeDefinitions'];

router.get('/', async (req, res, next) => {
  try {
    const cfg = await Configuration.getSingleton();
    res.json(cfg);
  } catch (err) {
    next(err);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const update = {};
    for (const k of ALLOWED) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }
    const cfg = await Configuration.findOneAndUpdate(
      { key: 'global' },
      { $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json(cfg);
  } catch (err) {
    next(err);
  }
});

// Category Management Endpoints directly on config
router.post('/categories', async (req, res, next) => {
  try {
    const rawName = (req.body.name || '').trim();
    if (!rawName) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const cfg = await Configuration.getSingleton();
    const existing = (cfg.categories || []).find(
      (c) => c.name.toLowerCase() === rawName.toLowerCase()
    );
    if (existing) {
      return res.status(400).json({ error: `Category "${rawName}" already exists` });
    }

    const id = req.body.id || rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;
    const newCat = {
      id,
      name: rawName,
      description: (req.body.description || '').trim()
    };

    cfg.categories.push(newCat);
    await cfg.save();
    res.status(201).json(cfg);
  } catch (err) {
    next(err);
  }
});

router.put('/categories/:id', async (req, res, next) => {
  try {
    const rawName = (req.body.name || '').trim();
    if (!rawName) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const cfg = await Configuration.getSingleton();
    const cat = (cfg.categories || []).find((c) => c.id === req.params.id);
    if (!cat) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check duplicate name
    const duplicate = (cfg.categories || []).find(
      (c) => c.id !== req.params.id && c.name.toLowerCase() === rawName.toLowerCase()
    );
    if (duplicate) {
      return res.status(400).json({ error: `Category "${rawName}" already exists` });
    }

    cat.name = rawName;
    if (req.body.description !== undefined) {
      cat.description = (req.body.description || '').trim();
    }
    await cfg.save();
    res.json(cfg);
  } catch (err) {
    next(err);
  }
});

router.delete('/categories/:id', async (req, res, next) => {
  try {
    const cfg = await Configuration.getSingleton();
    cfg.categories = (cfg.categories || []).filter((c) => c.id !== req.params.id);
    await cfg.save();
    res.json(cfg);
  } catch (err) {
    next(err);
  }
});

router.post('/reset', async (req, res, next) => {
  try {
    const defaultCategories = [
      { id: 'financial', name: 'Financial', description: 'Credit, market, liquidity, capital, earnings, default, NPA, rating actions, fraud' },
      { id: 'operational', name: 'Operational', description: 'Tech outages, supply chain, key-person, fraud-internal, process failures' },
      { id: 'reputational', name: 'Reputational', description: 'Scandals, leadership issues, customer trust events, social media storms' },
      { id: 'regulatory', name: 'Regulatory', description: 'RBI/SEBI/NHB/IRDAI action, new laws, compliance breaches, sanctions' },
      { id: 'competitive', name: 'Competitive', description: 'New entrants, M&A, product launches that shift the competitive landscape' },
      { id: 'strategic', name: 'Strategic', description: 'Long-term industry trends, market shifts, partnership changes' }
    ];

    const cfg = await Configuration.findOneAndUpdate(
      { key: 'global' },
      {
        $set: {
          impactLevelDefinitions: {
            Low: { imgcDefinition: '', llmInstructions: '' },
            Medium: { imgcDefinition: '', llmInstructions: '' },
            High: { imgcDefinition: '', llmInstructions: '' },
            Critical: { imgcDefinition: '', llmInstructions: '' }
          },
          categories: defaultCategories,
          extraGuidance: ''
        }
      },
      { new: true, upsert: true }
    );
    res.json(cfg);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
