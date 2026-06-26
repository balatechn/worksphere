const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users/me
router.get('/me', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, avatar: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/users/stats
router.get('/stats', async (req, res) => {
  try {
    const [total, completed, pending, urgent] = await Promise.all([
      prisma.item.count({ where: { userId: req.user.id } }),
      prisma.item.count({ where: { userId: req.user.id, status: 'COMPLETED' } }),
      prisma.item.count({ where: { userId: req.user.id, status: 'PENDING' } }),
      prisma.item.count({ where: { userId: req.user.id, isUrgent: true, status: 'PENDING' } }),
    ]);

    res.json({ total, completed, pending, urgent });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
