/**
 * SpendWise Intelligent Receipt Parser Engine
 * Parses OCR raw text and tokens into normalized, structured bill data.
 */

// Keyword dictionaries for auto-categorization
const CATEGORY_KEYWORDS = {
  'Food & Dining': [
    'restaurant', 'cafe', 'coffee', 'bistro', 'diner', 'kitchen', 'pizzeria', 'mcdonald', 'starbucks', 'subway', 'domino',
    'kfc', 'burger', 'pizza', 'sandwich', 'pasta', 'taco', 'noodle', 'biryani', 'curry', 'bar', 'grill', 'dine', 'cheeseburger'
  ],
  Shopping: [
    'trends', 'zara', 'h&m', 'uniqlo', 'target', 'clothing', 'apparel', 'fashion', 'shoes', 'jeans', 'shirt',
    't-shirt', 'jacket', 'trousers', 'garment', 'retail', 'electronics', 'croma', 'reliance digital', 'apple store'
  ],
  Healthcare: [
    'pharmacy', 'chemist', 'drug', 'apollo', 'medplus', 'hospital', 'clinic', 'tablet', 'capsule', 'syrup',
    'ointment', 'paracetamol', 'vitamin', 'bandage', 'medical'
  ],
  Transport: [
    'petrol', 'diesel', 'fuel', 'gas station', 'shell', 'hpcl', 'bpcl', 'ioc', 'uber', 'ola', 'lyft', 'taxi',
    'metro', 'toll', 'parking'
  ],
  'Bills & Utilities': [
    'electricity', 'power', 'water', 'gas utility', 'internet', 'broadband', 'telecom', 'airtel', 'jio', 'verizon'
  ],
  Entertainment: [
    'cinema', 'movie', 'theater', 'pvr', 'inox', 'ticket', 'netflix', 'game', 'bowling'
  ],
  Groceries: [
    'dmart', 'supermarket', 'grocery', 'walmart', 'kroger', 'trader joe', 'whole foods', 'spencers', 'bigbasket',
    'milk', 'bread', 'butter', 'egg', 'cheese', 'yogurt', 'rice', 'flour', 'atta', 'dal', 'oil', 'sugar',
    'salt', 'tea', 'fruit', 'vegetable', 'apple', 'banana', 'potato', 'onion', 'tomato', 'cereal',
    'biscuit', 'soap', 'shampoo', 'detergent', 'toothpaste', 'snack', 'water', 'juice'
  ]
};

/**
 * Suggest category based on text or item names
 */
function suggestCategory(text) {
  const lower = (text || '').toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(lower)) {
        return category;
      }
    }
  }
  return 'Groceries';
}

/**
 * Clean currency and numeric strings to float
 */
function parsePrice(str) {
  if (!str) return 0;
  // Replace commas with dots if followed by 2 digits, remove symbols like $, ₹, €, £
  const cleaned = str.toString().replace(/[^0-9.-]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : Math.round(val * 100) / 100;
}

/**
 * Parse date from strings
 */
function parseDate(text) {
  // Common receipt date formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY, DD-MMM-YYYY
  const datePatterns = [
    /\b(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})\b/,     // 12/10/2026 or 10-12-2026
    /\b(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})\b/,     // 2026-10-12
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{4})\b/i, // 12 Oct 2026
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})[\s,]+(\d{4})\b/i // Oct 12, 2026
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const parsed = new Date(match[0]);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  return new Date();
}

/**
 * Parse time from string
 */
function parseTime(text) {
  const match = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\s*(AM|PM|am|pm)?\b/);
  return match ? match[0] : null;
}

/**
 * Main parser function
 */
function parseReceiptText(rawText, ocrConfidence = 85) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      retailerName: 'Retail Store',
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
      suggestedCategory: 'Groceries',
      items: [],
      rawText: '',
      confidenceScore: ocrConfidence,
      hasDiscrepancy: false,
      discrepancyNote: '',
    };
  }

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let retailerName = '';
  let retailerAddress = '';
  let invoiceNumber = '';
  let printedTotal = null;
  let subtotal = 0;
  let taxAmount = 0;
  let discountAmount = 0;
  let paymentMethod = 'Cash';

  // 1. Detect Retailer Name from top 5 lines
  const ignoreHeaderWords = ['welcome', 'tax invoice', 'cash memo', 'invoice', 'receipt', 'bill of supply', 'original for recipient', 'duplicate copy'];
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    const isIgnore = ignoreHeaderWords.some((w) => lower === w || lower.startsWith(w + ':'));
    if (!isIgnore && line.length >= 3 && !/^\d+$/.test(line) && !line.includes('@')) {
      // Known popular brands
      if (lower.includes('dmart') || lower.includes('avenue supermarts')) {
        retailerName = 'DMart Supermarket';
        break;
      } else if (lower.includes('trends') || lower.includes('reliance trends')) {
        retailerName = 'Reliance Trends';
        break;
      } else if (lower.includes('walmart')) {
        retailerName = 'Walmart';
        break;
      } else if (lower.includes('target')) {
        retailerName = 'Target';
        break;
      } else if (lower.includes('starbucks')) {
        retailerName = 'Starbucks';
        break;
      } else if (lower.includes('apollo')) {
        retailerName = 'Apollo Pharmacy';
        break;
      } else if (!retailerName) {
        // Clean line of non-alphanumeric noise
        retailerName = line.replace(/[*#=~^]/g, '').trim();
      }
    }
  }

  if (!retailerName) {
    retailerName = 'Retail Store';
  }

  // 2. Detect Invoice Number
  const invoicePatterns = [
    /(?:invoice|bill|receipt|cash\s*memo|memo)\s*(?:no|#|num|number)?[:.\s-]*([A-Za-z0-9\-\/]{4,25})/i,
    /(?:inv|doc)\s*(?:no|#)?[:.\s-]*([A-Za-z0-9\-\/]{4,25})/i,
  ];

  for (const line of lines) {
    for (const pattern of invoicePatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        invoiceNumber = match[1].trim();
        break;
      }
    }
    if (invoiceNumber) break;
  }

  // 3. Detect Bill Date and Time
  const billDate = parseDate(rawText);
  const billTime = parseTime(rawText);

  // 4. Detect Payment Method
  const paymentRegexes = [
    { method: 'UPI', regex: /\b(upi|gpay|google\s*pay|phonepe|paytm|bhim)\b/i },
    { method: 'Credit Card', regex: /\b(credit\s*card|visa|mastercard|amex|card\s*ending)\b/i },
    { method: 'Debit Card', regex: /\b(debit\s*card)\b/i },
    { method: 'Net Banking', regex: /\b(net\s*banking|neft|rtgs|imps)\b/i },
    { method: 'Cash', regex: /\b(cash|tendered|change\s*due)\b/i },
  ];

  for (const { method, regex } of paymentRegexes) {
    if (regex.test(rawText)) {
      paymentMethod = method;
      break;
    }
  }

  // 5. Detect Tax / GST / VAT
  const taxPatterns = [
    /(?:total\s+)?(?:tax|gst|cgst\s*\+\s*sgst|vat|sales\s*tax)[:.\s]*[$₹€£]?\s*([0-9]+[.,][0-9]{2})/i,
    /(?:cgst|sgst)[:.\s]*[$₹€£]?\s*([0-9]+[.,][0-9]{2})/i,
  ];
  for (const line of lines) {
    for (const pattern of taxPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        taxAmount += parsePrice(match[1]);
      }
    }
  }
  taxAmount = Math.round(taxAmount * 100) / 100;

  // 6. Detect Discount
  const discountMatch = rawText.match(/(?:discount|savings|you\s*saved)[:.\s]*[$₹€£]?\s*([0-9]+[.,][0-9]{2})/i);
  if (discountMatch) {
    discountAmount = parsePrice(discountMatch[1]);
  }

  // 7. Detect Grand Total
  const totalPatterns = [
    /(?:grand\s*total|net\s*total|total\s*amount|total\s*payable|amount\s*payable|net\s*payable|total)[:.\s]*[$₹€£]?\s*([0-9]+[.,][0-9]{2})/i,
    /(?:balance\s*due)[:.\s]*[$₹€£]?\s*([0-9]+[.,][0-9]{2})/i,
  ];

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    for (const pattern of totalPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const val = parsePrice(match[1]);
        if (val > 0) {
          printedTotal = val;
          break;
        }
      }
    }
    if (printedTotal !== null) break;
  }

  // 8. Detect Subtotal
  const subtotalMatch = rawText.match(/(?:sub\s*total|subtotal|taxable\s*value)[:.\s]*[$₹€£]?\s*([0-9]+[.,][0-9]{2})/i);
  if (subtotalMatch) {
    subtotal = parsePrice(subtotalMatch[1]);
  }

  // 9. Extract Line Items
  // Look for lines containing an item description followed by numbers (price / qty / total)
  const items = [];
  const itemLineRegex = /^(.+?)\s+(?:(\d+(?:\.\d+)?)\s*(?:x|@|\*)\s*)?[$₹€£]?\s*(\d+(?:\.\d{2})?)\s+[$₹€£]?\s*(\d+(?:\.\d{2})?)$/i;
  // Alternative: Line with description and price at end
  const singlePriceRegex = /^([A-Za-z0-9\s.,&/\(\)-]{2,35})\s+[$₹€£]?\s*(\d+[.,]\d{2})$/;

  const skipKeywords = [
    'subtotal', 'sub total', 'grand total', 'total', 'tax', 'gst', 'cgst', 'sgst', 'vat', 'discount', 'savings',
    'cash', 'change', 'card', 'visa', 'mastercard', 'upi', 'phonepe', 'gpay', 'tendered', 'invoice', 'date',
    'time', 'phone', 'thank you', 'visit again', 'item', 'qty', 'rate', 'price', 'amount', 'hsn', 'code'
  ];

  for (const line of lines) {
    const lower = line.toLowerCase();
    const shouldSkip = skipKeywords.some((kw) => lower.startsWith(kw) || lower === kw);
    if (shouldSkip) continue;

    // Pattern 1: Description Qty Price Total (e.g., "Apple 2 1.50 3.00" or "Milk 1 x 2.40 2.40")
    const match1 = line.match(itemLineRegex);
    if (match1) {
      const name = match1[1].replace(/^\d+[\s.-]+/, '').trim();
      const qty = match1[2] ? parseFloat(match1[2]) : 1;
      const unitPrice = parsePrice(match1[3]);
      const lineTotal = parsePrice(match1[4]) || Math.round(qty * unitPrice * 100) / 100;

      if (name.length >= 2 && lineTotal > 0) {
        const itemCat = suggestCategory(name);
        const isMathMatch = Math.abs(qty * unitPrice - lineTotal) < 0.05;
        items.push({
          name,
          quantity: qty,
          unitPrice: unitPrice > 0 ? unitPrice : lineTotal,
          discount: 0,
          tax: 0,
          lineTotal,
          category: itemCat,
          confidence: isMathMatch ? Math.min(ocrConfidence, 95) : Math.max(ocrConfidence - 20, 60),
          isFlagged: !isMathMatch,
        });
        continue;
      }
    }

    // Pattern 2: Description Amount (e.g., "ORGANIC EGGS 12PK 4.99")
    const match2 = line.match(singlePriceRegex);
    if (match2) {
      const name = match2[1].replace(/^\d+[\s.-]+/, '').trim();
      const lineTotal = parsePrice(match2[2]);

      // Ensure it's not a header or summary
      const isWordy = /[a-zA-Z]{2,}/.test(name);
      if (isWordy && lineTotal > 0 && lineTotal < 100000) {
        const itemCat = suggestCategory(name);
        items.push({
          name,
          quantity: 1,
          unitPrice: lineTotal,
          discount: 0,
          tax: 0,
          lineTotal,
          category: itemCat,
          confidence: Math.min(ocrConfidence, 90),
          isFlagged: false,
        });
      }
    }
  }

  // Calculate items sum
  const itemsSum = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  const roundedItemsSum = Math.round(itemsSum * 100) / 100;

  if (subtotal === 0 && items.length > 0) {
    subtotal = roundedItemsSum;
  }

  let calculatedTotal = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;

  // If subtotal + taxAmount already matches printedTotal, discount is informational (already factored into items)
  if (printedTotal !== null && Math.abs((subtotal + taxAmount) - printedTotal) < 0.05) {
    calculatedTotal = Math.round((subtotal + taxAmount) * 100) / 100;
  }

  // Discrepancy check: Compare printed total vs calculated total
  let hasDiscrepancy = false;
  let discrepancyNote = '';
  if (printedTotal !== null && printedTotal > 0) {
    const diff = Math.abs(printedTotal - calculatedTotal);
    if (diff > 0.05) {
      hasDiscrepancy = true;
      discrepancyNote = `Printed bill total (${printedTotal}) differs from calculated total (${calculatedTotal}) by ${diff.toFixed(2)}. Please verify line items and taxes.`;
    }
  }

  const overallCategory = suggestCategory(retailerName + ' ' + items.map((i) => i.name).join(' '));

  return {
    retailerName,
    retailerAddress,
    invoiceNumber,
    billDate,
    billTime,
    printedTotal,
    subtotal,
    taxAmount,
    discountAmount,
    additionalCharges: 0,
    calculatedTotal: printedTotal !== null ? printedTotal : calculatedTotal,
    paymentMethod,
    suggestedCategory: overallCategory,
    items,
    rawText,
    confidenceScore: ocrConfidence,
    hasDiscrepancy,
    discrepancyNote,
  };
}

module.exports = {
  parseReceiptText,
  suggestCategory,
  parsePrice,
  parseDate,
};
