const { createWorker } = require('tesseract.js');
const { parseReceiptText } = require('./receiptParser');

/**
 * Tesseract OCR Provider
 * Performs client/server-side OCR on receipt image buffers without external API dependencies.
 */
async function processImageWithTesseract(imageBuffer) {
  let worker = null;
  try {
    worker = await createWorker('eng');
    const ret = await worker.recognize(imageBuffer);
    const rawText = ret.data.text || '';
    const confidence = Math.round(ret.data.confidence || 80);

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
