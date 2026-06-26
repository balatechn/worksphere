const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { sendReminderEmail } = require('../services/email');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/items — list with optional filters
router.get('/', async (req, res) => {
  const { category, status, priority, search, limit = 50 } = req.query;

  const where = { userId: req.user.id };
  if (category) where.category = category;
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { assignee: { contains: search, mode: 'insensitive' } },
    ];
  }

  try {
    const items = await prisma.item.findMany({
      where,
      orderBy: [
        { isUrgent: 'desc' },
        { priority: 'desc' },
        { deadline: 'asc' },
        { createdAt: 'desc' },
      ],
      take: parseInt(limit),
    });
    res.json(items);
  } catch (err) {
    console.error('Fetch items error:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// POST /api/items — create item manually
router.post('/', async (req, res) => {
  const { category, title, description, assignee, deadline, priority, isUrgent } = req.body;
  if (!title || !category) {
    return res.status(400).json({ error: 'Title and category are required' });
  }

  try {
    const item = await prisma.item.create({
      data: {
        userId: req.user.id,
        category,
        title,
        description: description || null,
        assignee: assignee || null,
        deadline: deadline ? new Date(deadline) : null,
        priority: priority || 'MEDIUM',
        isUrgent: Boolean(isUrgent),
        status: 'PENDING',
      },
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PUT /api/items/:id — update item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, deadline, assignee, priority, isUrgent, title, description, category } = req.body;

  try {
    const item = await prisma.item.findFirst({ where: { id, userId: req.user.id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const updated = await prisma.item.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(assignee !== undefined && { assignee }),
        ...(priority !== undefined && { priority }),
        ...(isUrgent !== undefined && { isUrgent: Boolean(isUrgent) }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/items/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const item = await prisma.item.findFirst({ where: { id, userId: req.user.id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    await prisma.reminder.deleteMany({ where: { itemId: id } });
    await prisma.item.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// POST /api/items/:id/remind — set reminder
router.post('/:id/remind', async (req, res) => {
  const { id } = req.params;
  const { scheduledAt, type = 'CUSTOM', sendNow = false } = req.body;

  try {
    const item = await prisma.item.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (sendNow) {
      await sendReminderEmail({
        to: req.user.email,
        itemTitle: item.title,
        itemDescription: item.description,
        category: item.category,
        deadline: item.deadline,
        assignee: item.assignee,
      });
      return res.json({ success: true, message: 'Reminder email sent immediately' });
    }

    if (!scheduledAt) {
      return res.status(400).json({ error: 'scheduledAt is required when sendNow is false' });
    }

    const reminder = await prisma.reminder.create({
      data: {
        itemId: id,
        userId: req.user.id,
        scheduledAt: new Date(scheduledAt),
        type,
      },
    });
    res.json(reminder);
  } catch (err) {
    console.error('Reminder error:', err);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// POST /api/items/:id/snooze — snooze by hours
router.post('/:id/snooze', async (req, res) => {
  const { id } = req.params;
  const { hours = 24 } = req.body;

  try {
    const item = await prisma.item.findFirst({ where: { id, userId: req.user.id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const snoozeUntil = new Date(Date.now() + hours * 60 * 60 * 1000);

    const updated = await prisma.item.update({
      where: { id },
      data: { status: 'SNOOZED' },
    });

    await prisma.reminder.create({
      data: {
        itemId: id,
        userId: req.user.id,
        scheduledAt: snoozeUntil,
        type: 'CUSTOM',
      },
    });

    res.json({ ...updated, snoozedUntil: snoozeUntil });
  } catch (err) {
    res.status(500).json({ error: 'Failed to snooze item' });
  }
});

module.exports = router;
