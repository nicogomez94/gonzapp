const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const prisma = require('../db');

const router = express.Router();

// GET /api/plans — public
router.get('/', async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({ orderBy: { price: 'asc' } });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/plans — admin only
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, price, maxImages, daysActive, features } = req.body;
    const plan = await prisma.plan.create({
      data: { name, price: parseFloat(price), maxImages: parseInt(maxImages), daysActive: parseInt(daysActive), features: features || [] }
    });
    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/plans/:id — admin only
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, price, maxImages, daysActive, features } = req.body;
    const plan = await prisma.plan.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name && { name }),
        ...(price && { price: parseFloat(price) }),
        ...(maxImages && { maxImages: parseInt(maxImages) }),
        ...(daysActive && { daysActive: parseInt(daysActive) }),
        ...(features && { features })
      }
    });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/plans/:id — admin only
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.plan.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Plan eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
