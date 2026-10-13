const pdfParse = require('pdf-parse');
const { parseReceiptText } = require('./receiptParser');

/**
 * Handles text-based PDF receipt/bill uploads
 */
async function processPdfReceipt(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    const rawText = data.text || '';
    if (!rawText.trim()) {
      throw new Error('No readable text layer found in PDF document');
    }
    const parsedData = parseReceiptText(rawText, 98);
    return parsedData;
  } catch (error) {
    console.warn('PDF text extraction warning:', error.message);
    const { ECOMMERCE_COLUMNS } = require('./multiFormatParsers');
    return {
      retailerName: 'PDF Invoice',
      retailerAddress: '',
      invoiceNumber: '',
      billDate: new Date(),
      billTime: null,
      printedTotal: null,
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      additionalCharges: 0,
      calculatedTotal: 0,
      paymentMethod: 'Cash',
      suggestedCategory: 'Shopping',
      billFormat: 'ecommerce',
      columns: ECOMMERCE_COLUMNS,
      items: [],
      rawText: '',
      confidenceScore: 70,
      hasDiscrepancy: false,
      discrepancyNote: 'PDF text could not be directly read. You can enter and edit the items below.',
    };
  }
}

module.exports = {
  processPdfReceipt,
};
