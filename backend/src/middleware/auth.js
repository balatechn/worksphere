const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = async (req, res, next) => {
  const secret = req.headers['x-internal-secret'];
  const userEmail = req.headers['x-user-email'];

  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: invalid internal secret' });
  }

  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized: no user email' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
};
