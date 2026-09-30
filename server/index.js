const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

const app = express();

// CORS
const configuredOrigins = (process.env.FRONTEND_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean);
const normalizedOrigins = [];
const invalidOrigins = [];
for (const origin of configuredOrigins) {
  try {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || !['', '/'].includes(parsed.pathname) || parsed.search || parsed.hash) invalidOrigins.push(origin);
    else normalizedOrigins.push(parsed.origin);
  } catch { invalidOrigins.push(origin); }
}
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [...new Set([...normalizedOrigins, 'http://localhost:3000', 'https://proje-dusky-two.vercel.app'])]
  : [...new Set([...normalizedOrigins, 'http://localhost:3000', 'http://localhost:3001', 'https://proje-dusky-two.vercel.app'])];
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));

// Body parser & request validation
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) {
    return res.status(400).json({ success: false, message: 'Request body must be a JSON object' });
  }
  next();
});

// Route mounts
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(require('mongoose').connection.readyState === 1 ? 200 : 503).json({
    status: require('mongoose').connection.readyState === 1 ? 'ok' : 'unavailable',
    app: 'RSS VNIT Shakha Portal Backend API',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Malformed JSON request body' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body is too large' });
  }
  console.error('[Server Error]', err.name || 'Error');
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  if (invalidOrigins.length) throw new Error('FRONTEND_ORIGIN must contain only comma-separated http(s) origins without paths or credentials');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET is required and must be at least 32 characters');
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be explicitly configured');
  }
  if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    throw new Error('FRONTEND_ORIGIN must be configured in production');
  }
  await connectDB();
  const server = app.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));
  const shutdown = (signal) => {
    console.log(`[Server] ${signal} received; shutting down`);
    server.close(async () => {
      try { await require('mongoose').disconnect(); }
      finally { process.exit(0); }
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
  return server;
};

if (require.main === module) {
  start().catch((error) => {
    console.error(`[Startup Error] ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { app, start };
