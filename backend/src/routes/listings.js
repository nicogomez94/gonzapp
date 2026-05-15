const express = require('express');
const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const prisma = require('../db');

const router = express.Router();

const cloudinaryConfig = { secure: true };
if (process.env.CLOUDINARY_CLOUD_NAME) cloudinaryConfig.cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
if (process.env.CLOUDINARY_API_KEY) cloudinaryConfig.api_key = process.env.CLOUDINARY_API_KEY;
if (process.env.CLOUDINARY_API_SECRET) cloudinaryConfig.api_secret = process.env.CLOUDINARY_API_SECRET;
cloudinary.config(cloudinaryConfig);

const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { files: 20, fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) return cb(null, true);
    return cb(new Error('Solo se permiten archivos de imagen'));
  }
}).array('images', 20);

const cloudinaryReady = () => {
  const config = cloudinary.config();
  return !!(config.cloud_name && config.api_key && config.api_secret);
};

const uploadBufferToCloudinary = (file) => new Promise((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream({
    folder: process.env.CLOUDINARY_FOLDER || 'gonzapp/listings',
    resource_type: 'image',
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    transformation: [
      { width: 2200, height: 2200, crop: 'limit' }
    ]
  }, (error, result) => {
    if (error) return reject(error);
    return resolve(result);
  });

  Readable.from(file.buffer).pipe(uploadStream);
});

const cloudinaryPublicIdFromUrl = (imageUrl) => {
  try {
    const url = new URL(imageUrl);
    if (!url.hostname.includes('res.cloudinary.com')) return null;

    const parts = url.pathname.split('/').filter(Boolean);
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;

    const publicPath = parts.slice(uploadIndex + 1).filter(part => !/^v\d+$/.test(part)).join('/');
    return decodeURIComponent(publicPath.replace(/\.[^/.]+$/, '')) || null;
  } catch {
    return null;
  }
};

const deleteCloudinaryImages = async (imageUrls = []) => {
  if (!cloudinaryReady()) return;

  const publicIds = imageUrls.map(cloudinaryPublicIdFromUrl).filter(Boolean);
  const results = await Promise.allSettled(publicIds.map(publicId => cloudinary.uploader.destroy(publicId, { resource_type: 'image' })));
  results.forEach(result => {
    if (result.status === 'rejected') console.warn('No se pudo eliminar una imagen de Cloudinary:', result.reason?.message || result.reason);
  });
};

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

// POST /api/listings/images — admin only, upload multiple images
router.post('/images', authMiddleware, adminMiddleware, (req, res) => {
  uploadImages(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || 'No se pudieron cargar las imágenes' });
    if (!cloudinaryReady()) return res.status(500).json({ error: 'Cloudinary no está configurado en el servidor' });

    try {
      const uploaded = await Promise.all((req.files || []).map(uploadBufferToCloudinary));
      res.status(201).json({
        images: uploaded.map(file => file.secure_url),
        assets: uploaded.map(file => ({
          publicId: file.public_id,
          url: file.secure_url,
          width: file.width,
          height: file.height,
          format: file.format,
          bytes: file.bytes
        }))
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Cloudinary no pudo cargar las imágenes' });
    }
  });
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
    const previousListing = images !== undefined
      ? await prisma.listing.findUnique({ where: { id: parseInt(req.params.id) }, select: { images: true } })
      : null;
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

    if (previousListing && images !== undefined) {
      const nextImages = new Set(images || []);
      const removedImages = (previousListing.images || []).filter(image => !nextImages.has(image));
      deleteCloudinaryImages(removedImages).catch(error => console.warn('No se pudieron limpiar imágenes removidas:', error.message));
    }

    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/listings/:id — admin only
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: parseInt(req.params.id) }, select: { images: true } });
    await prisma.listing.delete({ where: { id: parseInt(req.params.id) } });
    deleteCloudinaryImages(listing?.images || []).catch(error => console.warn('No se pudieron limpiar imágenes eliminadas:', error.message));
    res.json({ message: 'Publicación eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
