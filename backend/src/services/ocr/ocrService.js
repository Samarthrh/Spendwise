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

  // Strategy 1: Instant Local Parser for Digital PDFs (Flipkart, Amazon, Swiggy, etc. - takes ~30ms)
  if (isPdf) {
    try {
      console.log('Attempting instant digital PDF parse...');
      const localPdf = await processPdfReceipt(fileBuffer);
      if (localPdf && localPdf.items && localPdf.items.length > 0 && localPdf.calculatedTotal > 0) {
        console.log(`[PDF Parser] Instant extraction succeeded: ${localPdf.items.length} items found in ~30ms.`);
        return localPdf;
      }
    } catch (pdfErr) {
      console.log('[PDF Parser] Digital stream parse not available, routing to Vision OCR:', pdfErr.message);
    }
  }

  // Strategy 2: Google Gemini Vision API (Images & Scanned PDFs)
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
    }
  }

  // Strategy 3: Fast Local OCR Fallback (Takes ~1.5s with optimized C++ preprocessor)
  if (isPdf) {
    console.log('Processing bill via PDF Document Parser fallback...');
    return await processPdfReceipt(fileBuffer);
  }

  console.log('Processing bill via ultra-fast local Tesseract OCR Engine...');
  return await processImageWithTesseract(fileBuffer);
}

module.exports = {
  processBillDocument,
};
