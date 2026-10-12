const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spendwise',
  JWT_SECRET: process.env.JWT_SECRET || 'spendwise_super_secret_jwt_key_2026_finance_secure',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  OCR_PROVIDER: process.env.OCR_PROVIDER || 'tesseract', // 'tesseract' or 'gemini'
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
};
