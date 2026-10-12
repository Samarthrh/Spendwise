const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
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

// Enable CORS
app.use(cors({
  origin: '*', // Allow frontend development requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// HTTP Request Logger
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded receipt files statically
app.use('/uploads', express.static(env.UPLOAD_DIR));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SpendWise Backend API',
    ocrProvider: env.OCR_PROVIDER,
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/demo', demoRoutes);

// Catch 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

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
