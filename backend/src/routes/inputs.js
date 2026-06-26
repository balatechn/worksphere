const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { analyzeInput } = require('../services/openai');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/inputs — analyze and save
router.post('/', async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const analyzedItems = await analyzeInput(text.trim());

    const input = await prisma.input.create({
      data: {
        rawText: text.trim(),
        userId: req.user.id,
        items: {
          create: analyzedItems.map(item => ({
            userId: req.user.id,
            category: item.category,
            title: item.title,
            description: item.description,
            assignee: item.assignee,
            deadline: item.deadline,
            isUrgent: item.isUrgent,
            priority: item.priority,
            status: 'PENDING',
          })),
        },
      },
      include: { items: true },
    });

    res.json({ input, items: input.items, count: input.items.length });
  } catch (err) {
    console.error('Input analysis error:', err);
    if (err.message?.includes('OpenAI') || err.status === 401) {
      return res.status(500).json({ error: 'AI analysis failed. Check your OpenAI API key.' });
    }
    res.status(500).json({ error: 'Failed to analyze input' });
  }
});

// POST /api/inputs/preview — analyze only, don't save
router.post('/preview', async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const items = await analyzeInput(text.trim());
    res.json({ items, count: items.length });
  } catch (err) {
    console.error('Preview analysis error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// GET /api/inputs — list user's inputs
router.get('/', async (req, res) => {
  try {
    const inputs = await prisma.input.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(inputs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inputs' });
  }
});

module.exports = router;
