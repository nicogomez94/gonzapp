const express = require('express');
const bcrypt = require('bcryptjs');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const prisma = require('../db');

const router = express.Router();

// GET /api/users — admin only
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { search, planId, page = 1, limit = 20 } = req.query;
    const where = {};
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
    if (planId) where.planId = parseInt(planId);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' }, select: { id: true, email: true, name: true, phone: true, role: true, approvalStatus: true, planId: true, createdAt: true, plan: true, _count: { select: { listings: true } } } }),
      prisma.user.count({ where })
    ]);
    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/users/:id
router.get('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { id: true, email: true, name: true, phone: true, role: true, approvalStatus: true, planId: true, createdAt: true, plan: true, listings: true }
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/users — admin only
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { email, password, name, phone, role, planId, approvalStatus } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Datos requeridos' });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email ya registrado' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        phone: phone || null,
        role: role || 'USER',
        planId: planId ? parseInt(planId) : null,
        approvalStatus: role === 'ADMIN' ? 'APPROVED' : (approvalStatus || (planId ? 'PENDING_APPROVAL' : 'PENDING_PLAN'))
      },
      select: { id: true, email: true, name: true, phone: true, role: true, approvalStatus: true, planId: true, createdAt: true }
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/users/:id — admin only
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, phone, role, planId, password, approvalStatus } = req.body;
    const data = {};
    if (name) data.name = name;
    if (phone !== undefined) data.phone = phone || null;
    if (role) data.role = role;
    if (planId !== undefined) data.planId = planId ? parseInt(planId) : null;
    if (approvalStatus) data.approvalStatus = approvalStatus;
    if (role === 'ADMIN') data.approvalStatus = 'APPROVED';
    if (password) data.password = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data,
      select: { id: true, email: true, name: true, phone: true, role: true, approvalStatus: true, planId: true, createdAt: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/users/:id — admin only
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
