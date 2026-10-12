const { createWorker } = require('tesseract.js');
const { preprocessReceiptImage } = require('./imagePreprocessor');
const { parseReceiptText } = require('./receiptParser');

/**
 * Enhanced Tesseract OCR Provider
 * Performs intelligent background-noise removal and contrast normalization prior to OCR.
 */
async function processImageWithTesseract(imageBuffer) {
  let worker = null;
  try {
    // 1. Preprocess receipt image
    const preprocessedBuffer = await preprocessReceiptImage(imageBuffer);

    // 2. Initialize Tesseract worker
    worker = await createWorker('eng');
    const ret = await worker.recognize(preprocessedBuffer);
    const rawText = ret.data.text || '';
    const confidence = Math.round(ret.data.confidence || 80);

    console.log('[Tesseract] OCR raw text length:', rawText.length, 'Confidence:', confidence);

    // 3. Parse receipt data
    const parsedData = parseReceiptText(rawText, confidence);
    return parsedData;
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    throw new Error(`OCR Processing failed: ${error.message}`);
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

module.exports = {
  processImageWithTesseract,
};
