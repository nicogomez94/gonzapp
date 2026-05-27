const express = require('express');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const prisma = require('../db');
const { sendListingActiveEmail } = require('../mailer');

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

const uploadStorage = () => (process.env.UPLOAD_STORAGE || 'local').toLowerCase();
const localUploadDir = () => process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

const cloudinaryReady = () => {
  const config = cloudinary.config();
  return !!(config.cloud_name && config.api_key && config.api_secret);
};

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  try {
    req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    req.user = null;
  }
  return next();
}

async function getApprovedUser(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, approvalStatus: true, planId: true, plan: true }
  });
}

function listingPayload(body) {
  return {
    title: body.title,
    brand: body.brand,
    model: body.model,
    engine: body.engine || '',
    year: parseInt(body.year),
    mileage: parseInt(body.mileage),
    fuel: body.fuel,
    transmission: body.transmission,
    description: body.description || '',
    equipment: body.equipment || [],
    priceArs: parseFloat(body.priceArs),
    priceUsd: body.priceUsd ? parseFloat(body.priceUsd) : null,
    images: body.images || [],
    location: body.location,
    phone: body.phone,
  };
}

function validateListingPayload(body) {
  const required = ['title', 'brand', 'model', 'year', 'mileage', 'fuel', 'transmission', 'priceArs', 'location', 'phone'];
  const missing = required.filter(field => body[field] === undefined || body[field] === null || body[field] === '');
  if (missing.length) return 'Completá los datos requeridos de la publicación';
  if (Number.isNaN(parseInt(body.year)) || Number.isNaN(parseInt(body.mileage)) || Number.isNaN(parseFloat(body.priceArs))) {
    return 'Año, kilometraje y precio deben ser valores numéricos';
  }
  return null;
}

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

const extensionByMime = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
};

const publicUrlForRequest = (req, relativePath) => {
  const baseUrl = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl.replace(/\/$/, '')}${relativePath}`;
};

const uploadBufferToLocal = async (req, file) => {
  const uploadDir = localUploadDir();
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = extensionByMime[file.mimetype] || path.extname(file.originalname || '').toLowerCase() || '.jpg';
  const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, file.buffer, { flag: 'wx' });

  const url = publicUrlForRequest(req, `/uploads/${encodeURIComponent(filename)}`);
  return {
    publicId: filename,
    url,
    secure_url: url,
    width: null,
    height: null,
    format: ext.replace('.', ''),
    bytes: file.size
  };
};

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

const localFilenameFromUrl = (imageUrl) => {
  try {
    const url = new URL(imageUrl);
    if (url.pathname.startsWith('/uploads/')) return decodeURIComponent(path.basename(url.pathname));
  } catch {
    if (typeof imageUrl === 'string' && imageUrl.startsWith('/uploads/')) {
      return decodeURIComponent(path.basename(imageUrl));
    }
  }
  return null;
};

const deleteLocalImages = async (imageUrls = []) => {
  const uploadDir = localUploadDir();
  const filenames = imageUrls.map(localFilenameFromUrl).filter(Boolean);
  const results = await Promise.allSettled(filenames.map(filename => fs.unlink(path.join(uploadDir, filename))));
  results.forEach(result => {
    if (result.status === 'rejected' && result.reason?.code !== 'ENOENT') {
      console.warn('No se pudo eliminar una imagen local:', result.reason?.message || result.reason);
    }
  });
};

const deleteStoredImages = async (imageUrls = []) => {
  await Promise.all([
    deleteLocalImages(imageUrls),
    deleteCloudinaryImages(imageUrls)
  ]);
};

// GET /api/listings — public active listings; admins see all listings
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { brand, fuel, transmission, yearFrom, yearTo, priceMin, priceMax, kmMax, search, location, featured, page = 1, limit = 9, sort = 'newest' } = req.query;
    const where = req.user?.role === 'ADMIN' ? {} : { status: 'ACTIVE' };
    if (brand) where.brand = { equals: brand, mode: 'insensitive' };
    if (fuel) where.fuel = { equals: fuel, mode: 'insensitive' };
    if (transmission) where.transmission = { equals: transmission, mode: 'insensitive' };
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (featured !== undefined) where.featured = ['true', '1', true].includes(featured);
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
      : sort === 'featured' ? [{ featured: 'desc' }, { createdAt: 'desc' }]
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

// GET /api/listings/mine — authenticated user listings, including pending
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ listings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/listings/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { user: { select: { name: true, phone: true, email: true } } }
    });
    if (!listing) return res.status(404).json({ error: 'Publicación no encontrada' });
    const canView = listing.status === 'ACTIVE' || req.user?.role === 'ADMIN' || req.user?.id === listing.userId;
    if (!canView) return res.status(404).json({ error: 'Publicación no encontrada' });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/listings/images — approved users and admins can upload multiple images
router.post('/images', authMiddleware, async (req, res) => {
  uploadImages(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || 'No se pudieron cargar las imágenes' });

    try {
      const currentUser = await getApprovedUser(req.user.id);
      if (!currentUser) return res.status(404).json({ error: 'Usuario no encontrado' });
      if (currentUser.role !== 'ADMIN' && currentUser.approvalStatus !== 'APPROVED') {
        return res.status(403).json({ error: 'Tu cuenta debe estar aprobada para cargar imágenes' });
      }

      if (uploadStorage() === 'cloudinary' && !cloudinaryReady()) {
        return res.status(500).json({ error: 'Cloudinary no está configurado en el servidor' });
      }

      const files = req.files || [];
      const uploaded = uploadStorage() === 'cloudinary'
        ? await Promise.all(files.map(uploadBufferToCloudinary))
        : await Promise.all(files.map(file => uploadBufferToLocal(req, file)));
      res.status(201).json({
        images: uploaded.map(file => file.secure_url),
        assets: uploaded.map(file => ({
          publicId: file.public_id || file.publicId,
          url: file.secure_url,
          width: file.width,
          height: file.height,
          format: file.format,
          bytes: file.bytes
        }))
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'No se pudieron cargar las imágenes' });
    }
  });
});

// POST /api/listings — approved users create pending listings; admins can publish directly
router.post('/', authMiddleware, async (req, res) => {
  try {
    const validationError = validateListingPayload(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const currentUser = await getApprovedUser(req.user.id);
    if (!currentUser) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (currentUser.role !== 'ADMIN') {
      if (currentUser.approvalStatus !== 'APPROVED') {
        return res.status(403).json({ error: 'Tu cuenta debe estar aprobada para publicar' });
      }
      if (!currentUser.planId) {
        return res.status(403).json({ error: 'Necesitás tener un plan aprobado para publicar' });
      }
    }

    const isAdmin = currentUser.role === 'ADMIN';
    const listing = await prisma.listing.create({
      data: {
        ...listingPayload(req.body),
        status: isAdmin ? (req.body.status || 'ACTIVE') : 'PENDING',
        featured: isAdmin ? !!req.body.featured : false,
        verified: isAdmin ? !!req.body.verified : false,
        userId: isAdmin ? parseInt(req.body.userId || req.user.id) : req.user.id
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
    const previousListing = await prisma.listing.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { status: true, images: true, user: { select: { email: true, name: true } } }
    });
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
      deleteStoredImages(removedImages).catch(error => console.warn('No se pudieron limpiar imágenes removidas:', error.message));
    }

    if (status === 'ACTIVE' && previousListing?.status !== 'ACTIVE' && previousListing?.user?.email) {
      sendListingActiveEmail({
        to: previousListing.user.email,
        userName: previousListing.user.name || 'Usuario',
        listingTitle: listing.title,
        listingId: listing.id,
      }).catch(err => console.warn('[mailer] No se pudo enviar email de activación:', err.message));
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
    deleteStoredImages(listing?.images || []).catch(error => console.warn('No se pudieron limpiar imágenes eliminadas:', error.message));
    res.json({ message: 'Publicación eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
