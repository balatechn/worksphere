const { PrismaClient } = require('@prisma/client');
const { sendReminderEmail, sendDailySummaryEmail, sendMonthlyActivityReport } = require('./email');

const prisma = new PrismaClient();

async function sendPendingReminders() {
  try {
    const now = new Date();
    const reminders = await prisma.reminder.findMany({
      where: {
        sent: false,
        scheduledAt: { lte: now },
      },
      include: {
        item: true,
        user: true,
      },
    });

    for (const reminder of reminders) {
      try {
        await sendReminderEmail({
          to: reminder.user.email,
          itemTitle: reminder.item.title,
          itemDescription: reminder.item.description,
          category: reminder.item.category,
          deadline: reminder.item.deadline,
          assignee: reminder.item.assignee,
        });

        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { sent: true },
        });

        console.log(`Reminder sent for item: ${reminder.item.title}`);
      } catch (err) {
        console.error(`Failed to send reminder ${reminder.id}:`, err);
      }
    }
  } catch (err) {
    console.error('Scheduler error:', err);
  }
}

async function sendDailySummaries() {
  try {
    const users = await prisma.user.findMany({
      include: {
        items: {
          where: { status: 'PENDING' },
          orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    for (const user of users) {
      if (user.items.length === 0) continue;
      try {
        await sendDailySummaryEmail({
          to: user.email,
          userName: user.name,
          items: user.items,
        });
        console.log(`Daily summary sent to: ${user.email}`);
      } catch (err) {
        console.error(`Failed daily summary for ${user.email}:`, err);
      }
    }
  } catch (err) {
    console.error('Daily summary error:', err);
  }
}

async function sendWeeklyActivityReport() {
  const reportEmail = process.env.REPORT_EMAIL;
  if (!reportEmail) {
    console.log('[Weekly Report] REPORT_EMAIL not configured, skipping');
    return;
  }
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthName = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    const user = await prisma.user.findUnique({
      where: { email: reportEmail },
      include: {
        items: {
          where: { createdAt: { gte: startOfMonth } },
          orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!user) {
      console.log(`[Weekly Report] User ${reportEmail} not found`);
      return;
    }

    await sendMonthlyActivityReport({
      to: reportEmail,
      userName: user.name,
      items: user.items,
      monthName,
    });

    console.log(`[Weekly Report] Sent to ${reportEmail} — ${user.items.length} items for ${monthName}`);
  } catch (err) {
    console.error('[Weekly Report] Failed:', err.message);
  }
}

module.exports = { sendPendingReminders, sendDailySummaries, sendWeeklyActivityReport };
