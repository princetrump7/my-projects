const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Item } = require('../models/item');
const validate = require('../middleware/validate');

const router = express.Router();

const items = [];

router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const start = (page - 1) * limit;
  const end = start + limit;

  res.json({
    data: items.slice(start, end),
    total: items.length,
    page,
    limit,
  });
});

router.get('/:id', (req, res, next) => {
  const item = items.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json(item);
});

router.post('/', validate, (req, res) => {
  const item = new Item({
    id: uuidv4(),
    name: req.body.name,
    description: req.body.description,
  });
  items.push(item);
  res.status(201).json(item);
});

router.put('/:id', validate, (req, res, next) => {
  const index = items.findIndex((i) => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  items[index] = { ...items[index], name: req.body.name, description: req.body.description };
  res.json(items[index]);
});

router.delete('/:id', (req, res, next) => {
  const index = items.findIndex((i) => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  const deleted = items.splice(index, 1);
  res.json(deleted[0]);
});

module.exports = router;
