require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const authMiddleware = require('./middleware/auth');
const inputsRouter = require('./routes/inputs');
const itemsRouter = require('./routes/items');
const usersRouter = require('./routes/users');
const dashboardRouter = require('./routes/dashboard');
const { sendPendingReminders } = require('./services/scheduler');

const app = express();
const prisma = new PrismaClient();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Temporary debug endpoint — remove after diagnosis
app.get('/debug/openai', async (req, res) => {
  const { OpenAI } = require('openai');
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.json({ error: 'OPENAI_API_KEY not set', keyPresent: false });
  const openai = new OpenAI({ apiKey: key });
  try {
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "ok"' }],
      max_tokens: 5,
    });
    res.json({ ok: true, reply: r.choices[0].message.content, keyPrefix: key.substring(0, 12) });
  } catch (err) {
    res.json({ ok: false, error: err.message, status: err.status, keyPrefix: key.substring(0, 12) });
  }
});

// User sync endpoint called by NextAuth on login
app.post('/api/auth/sync', async (req, res) => {
  try {
    const { email, name, avatar, googleId } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await prisma.user.upsert({
      where: { email },
      update: { name: name || undefined, avatar: avatar || undefined, googleId: googleId || undefined },
      create: { email, name, avatar, googleId },
    });
    res.json(user);
  } catch (error) {
    console.error('Auth sync error:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

app.use('/api/inputs', authMiddleware, inputsRouter);
app.use('/api/items', authMiddleware, itemsRouter);
app.use('/api/users', authMiddleware, usersRouter);
app.use('/api/dashboard', authMiddleware, dashboardRouter);

// Cron: daily 8 AM reminders
cron.schedule('0 8 * * *', () => {
  console.log('Running daily reminders...');
  sendPendingReminders();
});

// Cron: hourly follow-up check
cron.schedule('0 * * * *', () => {
  console.log('Running hourly reminder check...');
  sendPendingReminders();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`WorkSphere backend running on port ${PORT}`);
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
