const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const prisma = require('../db');

const router = express.Router();

// GET /api/listings — public, with filters
router.get('/', async (req, res) => {
  try {
    const { brand, fuel, transmission, yearFrom, yearTo, priceMin, priceMax, kmMax, search, page = 1, limit = 9, sort = 'newest' } = req.query;
    const where = { status: 'ACTIVE' };
    if (brand) where.brand = { equals: brand, mode: 'insensitive' };
    if (fuel) where.fuel = { equals: fuel, mode: 'insensitive' };
    if (transmission) where.transmission = { equals: transmission, mode: 'insensitive' };
    if (yearFrom || yearTo) where.year = { gte: yearFrom ? parseInt(yearFrom) : undefined, lte: yearTo ? parseInt(yearTo) : undefined };
    if (priceMin || priceMax) where.priceArs = { gte: priceMin ? parseFloat(priceMin) : undefined, lte: priceMax ? parseFloat(priceMax) : undefined };
    if (kmMax) where.mileage = { lte: parseInt(kmMax) };
    if (search) where.OR = [
      { brand: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } }
    ];

    const orderBy = sort === 'price_asc' ? { priceArs: 'asc' }
      : sort === 'price_desc' ? { priceArs: 'desc' }
      : sort === 'km_asc' ? { mileage: 'asc' }
      : { createdAt: 'desc' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({ where, orderBy, skip, take: parseInt(limit), include: { user: { select: { name: true, phone: true } } } }),
      prisma.listing.count({ where })
    ]);
    res.json({ listings, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/listings/:id
router.get('/:id', async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { user: { select: { name: true, phone: true, email: true } } }
    });
    if (!listing) return res.status(404).json({ error: 'Publicación no encontrada' });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/listings — admin only
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, brand, model, engine, year, mileage, fuel, transmission, description, equipment, priceArs, priceUsd, images, location, phone, featured, verified, userId } = req.body;
    const listing = await prisma.listing.create({
      data: {
        title, brand, model, engine, year: parseInt(year), mileage: parseInt(mileage),
        fuel, transmission, description, equipment: equipment || [],
        priceArs: parseFloat(priceArs), priceUsd: priceUsd ? parseFloat(priceUsd) : null,
        images: images || [], location, phone,
        featured: !!featured, verified: !!verified,
        userId: parseInt(userId || req.user.id)
      }
    });
    res.status(201).json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/listings/:id — admin only
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, brand, model, engine, year, mileage, fuel, transmission, description, equipment, priceArs, priceUsd, images, location, phone, status, featured, verified } = req.body;
    const listing = await prisma.listing.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title, brand, model, engine,
        ...(year && { year: parseInt(year) }),
        ...(mileage && { mileage: parseInt(mileage) }),
        fuel, transmission, description,
        ...(equipment && { equipment }),
        ...(priceArs && { priceArs: parseFloat(priceArs) }),
        ...(priceUsd !== undefined && { priceUsd: priceUsd ? parseFloat(priceUsd) : null }),
        ...(images && { images }),
        location, phone,
        ...(status && { status }),
        ...(featured !== undefined && { featured: !!featured }),
        ...(verified !== undefined && { verified: !!verified })
      }
    });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/listings/:id — admin only
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.listing.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Publicación eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
