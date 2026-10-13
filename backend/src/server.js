const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route files
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const billRoutes = require('./routes/billRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const reportRoutes = require('./routes/reportRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const demoRoutes = require('./routes/demoRoutes');

const app = express();

// Body parser
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Enable CORS with dynamic origin support (mobile Safari / Chrome compatibility)
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile native, curl, postman) or any origin in development/production
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
}));

// HTTP Request Logger
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded receipt files statically
app.use('/uploads', express.static(env.UPLOAD_DIR));

// Health check endpoint (both /api/health and /health)
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SpendWise Backend API',
    ocrProvider: env.OCR_PROVIDER,
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Mount API routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/demo', demoRoutes);

// Also mount routes without /api prefix for resiliency (if client omits /api)
app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);
app.use('/bills', billRoutes);
app.use('/budgets', budgetRoutes);
app.use('/reports', reportRoutes);
app.use('/categories', categoryRoutes);
app.use('/demo', demoRoutes);

// Catch 404 for unhandled API endpoints
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Serve compiled frontend in production or if dist exists (Unified Full-Stack Deployment)
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(frontendDist, 'index.html'));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    });
  });
}

// Central error handler
app.use(errorHandler);

let server;

// Start server
const startServer = async () => {
  await connectDB();
  server = app.listen(env.PORT, () => {
    console.log(`===============================================`);
    console.log(` SpendWise Backend running in ${env.NODE_ENV} mode`);
    console.log(` Server URL: http://localhost:${env.PORT}`);
    console.log(` Health Check: http://localhost:${env.PORT}/api/health`);
    console.log(`===============================================`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
