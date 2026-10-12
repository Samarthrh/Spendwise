const env = require('../../config/env');
const { processImageWithTesseract } = require('./tesseractProvider');
const { processImageWithGemini } = require('./geminiProvider');
const { processPdfReceipt } = require('./pdfHandler');

/**
 * Unified OCR Service
 * Dispatches file processing to the appropriate engine (PDF text extraction, Gemini Vision, or local Tesseract)
 */
async function processBillDocument(fileBuffer, mimeType, originalName = '') {
  const isPdf = mimeType === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    console.log('Processing bill via PDF Document Parser...');
    return await processPdfReceipt(fileBuffer);
  }

  // If Gemini provider is enabled and key is set, try Gemini first
  if (env.OCR_PROVIDER === 'gemini' && env.GEMINI_API_KEY) {
    try {
      console.log('Processing bill via Gemini Multimodal Vision API...');
      return await processImageWithGemini(fileBuffer, mimeType);
    } catch (geminiErr) {
      console.warn('Gemini OCR failed, falling back to local Tesseract OCR:', geminiErr.message);
      return await processImageWithTesseract(fileBuffer);
    }
  }

  // Default: Tesseract OCR (Local, offline, zero-dependency)
  console.log('Processing bill via local Tesseract OCR Engine...');
  return await processImageWithTesseract(fileBuffer);
}

module.exports = {
  processBillDocument,
};
