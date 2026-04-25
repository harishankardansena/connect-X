require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/db');
const { initializeSocket } = require('./src/socket/socketHandler');
const { startAutoDeleteJob } = require('./src/jobs/autoDeleteMedia');

// Routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const mediaRoutes = require('./src/routes/mediaRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const connectionRoutes = require('./src/routes/connectionRoutes');

const app = express();
const server = http.createServer(app);

// Track DB connection state
let isDbConnected = false;

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
});

// ✅ Health check — always works, even without DB
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    db: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Connect-X API Server is running',
    version: '1.0.0',
    docs: 'https://github.com/harishankardansena/connect-X'
  });
});

// 🔒 DB guard middleware — blocks API calls if DB is not ready
app.use('/api', (req, res, next) => {
  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      message: '⚠️ Database not connected. Please check your MongoDB connection.',
    });
  }
  next();
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', generalLimiter, userRoutes);
app.use('/api/messages', generalLimiter, messageRoutes);
app.use('/api/media', generalLimiter, mediaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/connections', generalLimiter, connectionRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Start server IMMEDIATELY — don't wait for DB
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

// Initialize Socket.io handlers
initializeSocket(io);

// Connect to DB in background
connectDB()
  .then(() => {
    isDbConnected = true;
    console.log('✅ Database ready — all API routes are now active');
    startAutoDeleteJob();
  })
  .catch((err) => {
    console.error('❌ Could not connect to MongoDB:', err.message);
    console.log('⚠️  Server is running but database routes will return 503');
    console.log('💡 Fix your MongoDB connection and restart the server');
  });

module.exports = { app, io };
