const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard — full dashboard data
router.get('/', async (req, res) => {
  const userId = req.user.id;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  try {
    const [
      todayItems,
      followUps,
      teamPending,
      meetings,
      urgent,
      waitingApproval,
      calls,
      procurement,
      notes,
      delegated,
      stats,
      completedToday,
    ] = await Promise.all([
      // Today's tasks (MY_TASKS + REMINDERS due today or created today)
      prisma.item.findMany({
        where: {
          userId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          category: { in: ['MY_TASKS', 'REMINDERS'] },
          OR: [
            { deadline: { gte: todayStart, lte: todayEnd } },
            { createdAt: { gte: todayStart } },
          ],
        },
        orderBy: [{ isUrgent: 'desc' }, { priority: 'desc' }],
        take: 10,
      }),
      // Follow-ups
      prisma.item.findMany({
        where: { userId, category: 'FOLLOW_UPS', status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
        take: 8,
      }),
      // Team pending
      prisma.item.findMany({
        where: { userId, category: 'TEAM_TASKS', status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
        take: 8,
      }),
      // Meetings
      prisma.item.findMany({
        where: { userId, category: 'MEETINGS', status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
        take: 5,
      }),
      // Urgent items across all categories
      prisma.item.findMany({
        where: { userId, isUrgent: true, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Waiting approval
      prisma.item.findMany({
        where: { userId, category: 'WAITING_APPROVAL', status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Calls
      prisma.item.findMany({
        where: { userId, category: 'CALLS', status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Procurement
      prisma.item.findMany({
        where: { userId, category: 'PROCUREMENT', status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Notes
      prisma.item.findMany({
        where: { userId, category: 'NOTES', status: { not: 'CANCELLED' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Delegated
      prisma.item.findMany({
        where: { userId, category: 'DELEGATED', status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      // Stats
      prisma.item.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true },
      }),
      // Completed today
      prisma.item.count({
        where: { userId, status: 'COMPLETED', updatedAt: { gte: todayStart } },
      }),
    ]);

    const statsMap = stats.reduce((acc, s) => ({ ...acc, [s.status]: s._count.status }), {});

    res.json({
      sections: {
        todayItems,
        followUps,
        teamPending,
        meetings,
        urgent,
        waitingApproval,
        calls,
        procurement,
        notes,
        delegated,
      },
      stats: {
        total: Object.values(statsMap).reduce((a, b) => a + b, 0),
        pending: statsMap.PENDING || 0,
        inProgress: statsMap.IN_PROGRESS || 0,
        completed: statsMap.COMPLETED || 0,
        snoozed: statsMap.SNOOZED || 0,
        completedToday,
        urgent: urgent.length,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

module.exports = router;
