const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMiddleware } = require('../middleware/auth');
const prisma = require('../db');
const crypto = require('crypto');
const { sendRegistrationConfirmationEmail, sendPasswordResetEmail } = require('../mailer');

const router = express.Router();

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    approvalStatus: user.approvalStatus,
    planId: user.planId,
    plan: user.plan || null
  };
}

function signUserToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, approvalStatus: user.approvalStatus },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const { password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }
    const user = await prisma.user.findUnique({ where: { email }, include: { plan: true } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = signUserToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const { password } = req.body;
    const name = (req.body.name || '').trim();
    const phone = (req.body.phone || '').trim();
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Nombre, email y contraseña requeridos' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, phone: phone || null, approvalStatus: 'PENDING_PLAN' },
      include: { plan: true }
    });
    sendRegistrationConfirmationEmail({
      to: user.email,
      userName: user.name
    }).catch(err => console.warn('[mailer] No se pudo enviar email de confirmación:', err.message));

    const token = signUserToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { plan: true }
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/auth/me
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y email requeridos' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== req.user.id) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const data = { name, email, phone: phone || null };
    if (password) {
      if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      include: { plan: true }
    });

    res.json({ token: signUserToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/select-plan
router.post('/select-plan', authMiddleware, async (req, res) => {
  try {
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'Plan requerido' });
    }

    const plan = await prisma.plan.findUnique({ where: { id: parseInt(planId) } });
    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!currentUser) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (currentUser.role === 'ADMIN') {
      return res.status(400).json({ error: 'Los administradores no necesitan validación de plan' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { planId: plan.id, approvalStatus: 'PENDING_APPROVAL' },
      include: { plan: true }
    });

    res.json({ token: signUserToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    // Always respond with success to avoid user enumeration
    res.json({ message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpiry: expiry }
    });

    const frontendUrl = (process.env.FRONTEND_URL || '').split(',')[0].trim().replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    sendPasswordResetEmail({ to: user.email, userName: user.name, resetUrl })
      .catch(err => console.warn('[mailer] No se pudo enviar email de reset:', err.message));
  } catch (err) {
    console.error(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token y contraseña requeridos' });
    if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) return res.status(400).json({ error: 'El enlace es inválido o ya expiró' });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpiry: null }
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
