const pdfParse = require('pdf-parse');
const { parseReceiptText } = require('./receiptParser');

/**
 * Handles text-based PDF receipt/bill uploads
 */
async function processPdfReceipt(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    const rawText = data.text || '';
    // Digital PDFs have virtually 100% character recognition accuracy
    const parsedData = parseReceiptText(rawText, 98);
    return parsedData;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`PDF bill parsing failed: ${error.message}`);
  }
}

module.exports = {
  processPdfReceipt,
};
