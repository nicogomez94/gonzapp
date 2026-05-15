const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const userRoutes = require('./routes/users');
const planRoutes = require('./routes/plans');

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.FRONTEND_URL || '').split(',').map(origin => origin.trim()).filter(Boolean),
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.set('trust proxy', 1);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`AutoZona backend running on http://localhost:${PORT}`);
});
