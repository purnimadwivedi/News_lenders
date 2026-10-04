const express = require('express');
const Company = require('../models/Company');
const Configuration = require('../models/Configuration');
const { buildNewsQuery, MAX_QUERY_LENGTH } = require('../utils/newsQuery');

const router = express.Router();

// newsCursor is maintained by the fetch job; a form that echoes back a stale copy must not rewind it.
function editableFields(body) {
  const { newsCursor, _id, createdAt, updatedAt, ...rest } = body || {};
  return rest;
}

async function queryTooLong(company) {
  const { defaultTopicKeywords = [] } = await Configuration.getSingleton();
  const q = buildNewsQuery(company, defaultTopicKeywords);
  return q.length > MAX_QUERY_LENGTH
    ? `The search query would be ${q.length} characters; NewsAPI allows ${MAX_QUERY_LENGTH}. Remove some aliases or topics.`
    : null;
}

router.get('/', async (req, res, next) => {
  try {
    const items = await Company.find().sort({ name: 1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const fields = editableFields(req.body);
    const tooLong = await queryTooLong(fields);
    if (tooLong) return res.status(400).json({ error: tooLong });
    const item = await Company.create(fields);
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Company name must be unique' });
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await Company.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await Company.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const fields = editableFields(req.body);
    const tooLong = await queryTooLong({ ...existing, ...fields });
    if (tooLong) return res.status(400).json({ error: tooLong });
    const item = await Company.findByIdAndUpdate(req.params.id, fields, { new: true, runValidators: true });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const item = await Company.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
