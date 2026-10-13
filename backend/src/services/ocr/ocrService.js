const env = require('../../config/env');
const { processImageWithTesseract } = require('./tesseractProvider');
const { processImageWithGemini, processPdfWithGemini } = require('./geminiProvider');
const { processPdfReceipt } = require('./pdfHandler');

/**
 * Unified OCR Service
 * Priority order:
 *   1. Gemini Vision API (best accuracy for images AND PDFs — handles blurry, tilted, complex bills)
 *   2. PDF text extraction + regex parser (for digital PDFs when Gemini is unavailable)
 *   3. Local Tesseract OCR (offline fallback for images)
 */
async function processBillDocument(fileBuffer, mimeType, originalName = '', customApiKey = '') {
  const isPdf = mimeType === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf');
  const apiKey = (customApiKey && customApiKey.trim().length > 10)
    ? customApiKey.trim()
    : (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 10 ? env.GEMINI_API_KEY.trim() : '');
  const hasGemini = Boolean(apiKey && apiKey.length > 10);

  // Strategy 1: Use Gemini Vision for maximum accuracy (images and PDFs)
  if (hasGemini && env.OCR_PROVIDER !== 'tesseract_only') {
    try {
      if (isPdf) {
        console.log('Processing bill via Gemini Vision API (PDF mode)...');
        return await processPdfWithGemini(fileBuffer, apiKey);
      } else {
        console.log('Processing bill via Gemini Vision API (image mode)...');
        return await processImageWithGemini(fileBuffer, mimeType, apiKey);
      }
    } catch (geminiErr) {
      console.warn('Gemini Vision failed, falling back to local processing:', geminiErr.message);
      // Fall through to local processing
    }
  }

  // Strategy 2: Local processing fallback
  if (isPdf) {
    console.log('Processing bill via PDF Document Parser (local)...');
    return await processPdfReceipt(fileBuffer);
  }

  // Strategy 3: Tesseract OCR for images (offline, less accurate)
  console.log('Processing bill via local Tesseract OCR Engine...');
  return await processImageWithTesseract(fileBuffer);
}

module.exports = {
  processBillDocument,
};
