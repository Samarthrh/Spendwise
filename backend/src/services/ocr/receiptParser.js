/**
 * SpendWise Advanced Intelligent Receipt Parser Engine
 * Handles real-world photographed thermal paper receipts, restaurant bills,
 * supermarket invoices, discounts, taxes, and multi-line items with maximum fault tolerance.
 */

// Categorization Keywords
const CATEGORY_KEYWORDS = {
  'Food & Dining': [
    'restaurant', 'restuarant', 'cafe', 'coffee', 'bistro', 'diner', 'kitchen', 'pizzeria',
    'mcdonald', 'starbucks', 'subway', 'domino', 'kfc', 'burger', 'pizza', 'sandwich', 'pasta',
    'taco', 'noodle', 'biryani', 'curry', 'bar', 'grill', 'dine', 'cheeseburger', 'thali',
    'punjabi', 'chinese', 'dosa', 'roti', 'paneer', 'water', 'tea', 'lassi', 'ice cream',
    'dhaba', 'hotel', 'sweets', 'farsan', 'bakers', 'bakery'
  ],
  Shopping: [
    'trends', 'zara', 'h&m', 'uniqlo', 'target', 'clothing', 'apparel', 'fashion', 'shoes',
    'jeans', 'shirt', 't-shirt', 'jacket', 'trousers', 'garment', 'retail', 'electronics',
    'croma', 'reliance digital', 'apple store', 'chinos', 'dress', 'kurta', 'saree'
  ],
  Healthcare: [
    'pharmacy', 'chemist', 'drug', 'apollo', 'medplus', 'hospital', 'clinic', 'tablet',
    'capsule', 'syrup', 'ointment', 'paracetamol', 'vitamin', 'bandage', 'medical'
  ],
  Transport: [
    'petrol', 'diesel', 'fuel', 'gas station', 'shell', 'hpcl', 'bpcl', 'ioc', 'uber',
    'ola', 'lyft', 'taxi', 'metro', 'toll', 'parking'
  ],
  'Bills & Utilities': [
    'electricity', 'power', 'water utility', 'gas utility', 'internet', 'broadband', 'telecom',
    'airtel', 'jio', 'verizon'
  ],
  Entertainment: [
    'cinema', 'movie', 'theater', 'pvr', 'inox', 'ticket', 'netflix', 'game', 'bowling'
  ],
  Groceries: [
    'dmart', 'supermarket', 'grocery', 'walmart', 'kroger', 'trader joe', 'whole foods',
    'spencers', 'bigbasket', 'milk', 'bread', 'butter', 'egg', 'cheese', 'yogurt', 'rice',
    'flour', 'atta', 'dal', 'oil', 'sugar', 'salt', 'fruit', 'vegetable', 'apple', 'banana',
    'potato', 'onion', 'tomato', 'cereal', 'biscuit', 'soap', 'shampoo', 'detergent',
    'toothpaste', 'snack', 'juice'
  ]
};

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

function parsePrice(str) {
  if (!str) return 0;
  let cleaned = str.toString().replace(/[^0-9.,-]/g, '');

  if (cleaned.includes(',') && cleaned.includes('.')) {
    // e.g. "1,499.00" -> remove thousands comma
    cleaned = cleaned.replace(/,/g, '');
  } else if (cleaned.includes(',')) {
    // If e.g. "20,00" or "440,00" (comma as decimal separator)
    const parts = cleaned.split(',');
    if (parts[parts.length - 1].length === 2) {
      cleaned = parts.join('.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : Math.round(val * 100) / 100;
}

function parseDate(text) {
  // Pattern 1: Date: 16/08/26 or 16/08/2026
  const p1 = text.match(/\b(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})\b/);
  if (p1) {
    let day = parseInt(p1[1], 10);
    let month = parseInt(p1[2], 10);
    let year = parseInt(p1[3], 10);
    if (year < 100) year += 2000;
    // Swap if day/month inverted
    if (month > 12 && day <= 12) {
      const tmp = day; day = month; month = tmp;
    }
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Pattern 2: 2026-10-12
  const p2 = text.match(/\b(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})\b/);
  if (p2) {
    const d = new Date(parseInt(p2[1], 10), parseInt(p2[2], 10) - 1, parseInt(p2[3], 10));
    if (!isNaN(d.getTime())) return d;
  }

  return new Date();
}

function parseTime(text) {
  const match = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\s*(AM|PM|am|pm)?\b/);
  return match ? match[0].trim() : null;
}

/**
 * Main OCR Text Parser
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

  // 1. Detect Retailer Name & Address
  const bizKeywords = [
    'restaurant', 'restuarant', 'cafe', 'hotel', 'bakers', 'dhaba', 'kitchen', 'pizzeria',
    'bistro', 'mart', 'supermarket', 'store', 'traders', 'jewellers', 'retail', 'ltd', 'pvt',
    'dmart', 'trends', 'starbucks', 'walmart', 'target', 'apollo', 'reliance'
  ];
  const addrKeywords = [
    'floor', 'complex', 'circle', 'road', 'street', 'nagar', 'feet', 'cross', 'mo:', 'phone:', 'tel:', 'near', 'opp', 'sector'
  ];

  const addressLines = [];

  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Check for business name
    if (!retailerName) {
      for (const kw of bizKeywords) {
        if (lower.includes(kw)) {
          let clean = line
            .replace(/^[^a-zA-Z0-9]+/, '')
            .replace(/[^a-zA-Z0-9\s&.-]+$/, '')
            .replace(/\s*\d+$/, '') // remove trailing standalone numbers like "7"
            .replace(/\s+/g, ' ')
            .trim();

          const cLower = clean.toLowerCase();
          if (cLower.includes('dmart') || cLower.includes('avenue supermarts')) {
            retailerName = 'DMart Supermarket';
          } else if (cLower.includes('trends') || cLower.includes('reliance trends')) {
            retailerName = 'Reliance Trends';
          } else if (cLower.includes('walmart')) {
            retailerName = 'Walmart';
          } else if (cLower.includes('target')) {
            retailerName = 'Target';
          } else if (cLower.includes('starbucks')) {
            retailerName = 'Starbucks';
          } else if (cLower.includes('apollo')) {
            retailerName = 'Apollo Pharmacy';
          } else {
            clean = clean.replace(/restuarant/i, 'Restaurant');
            // Title case
            clean = clean.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
            retailerName = clean;
          }
          break;
        }
      }
    }

    // Check address lines
    const isAddr = addrKeywords.some((kw) => lower.includes(kw));
    const isNotBill = !lower.includes('bill no') && !lower.includes('date:') && !lower.includes('sub total');
    if (isAddr && isNotBill) {
      let cleanAddr = line
        .replace(/^[^a-zA-Z0-9]+/, '')
        .replace(/[^a-zA-Z0-9\s,:.-]+$/, '')
        .replace(/\bLst\b/i, '1st')
        .replace(/[«»~#*^]/g, '')
        .trim();
      if (cleanAddr.length > 5) {
        addressLines.push(cleanAddr);
      }
    }
  }

  // Fallback retailer name if no keyword matched
  if (!retailerName) {
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      const clean = line.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9\s&.-]+$/, '').trim();
      if (clean.length >= 4 && !/^\d+$/.test(clean) && !clean.includes('@') && !clean.toLowerCase().includes('welcome')) {
        const cLower = clean.toLowerCase();
        if (cLower.includes('dmart') || cLower.includes('avenue supermarts')) {
          retailerName = 'DMart Supermarket';
        } else if (cLower.includes('trends') || cLower.includes('reliance trends')) {
          retailerName = 'Reliance Trends';
        } else {
          retailerName = clean.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        }
        break;
      }
    }
  }

  if (!retailerName) retailerName = 'Retail Store';
  retailerAddress = addressLines.join(', ');

  // 2. Detect Invoice / Bill Number
  const invoicePatterns = [
    /(?:bill\s*no|bill\s*#|bill)[:.\s-]*([A-Za-z0-9\-]+)/i,
    /(?:invoice|receipt|cash\s*memo)\s*(?:no|#|num|number)?[:.\s-]*([A-Za-z0-9\-\/]{3,25})/i,
    /(?:token\s*no)[:.\s-]*([0-9]+)/i,
  ];

  for (const pattern of invoicePatterns) {
    const match = rawText.match(pattern);
    if (match && match[1]) {
      invoiceNumber = match[1].trim();
      break;
    }
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
    /(?:total\s+)?(?:tax|gst|cgst\s*\+\s*sgst|vat|sales\s*tax)[:.\s=]*[$₹¥€£]?\s*([0-9]+[.,][0-9]{2})/i,
    /(?:cgst|sgst)[:.\s=]*[$₹¥€£]?\s*([0-9]+[.,][0-9]{2})/i,
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
  const discountMatch = rawText.match(/(?:discount|savings|you\s*saved|total\s*savings)[:.\s=]*[$₹¥€£]?\s*([0-9]+[.,][0-9]{2})/i);
  if (discountMatch) {
    discountAmount = parsePrice(discountMatch[1]);
  }

  // 7. Detect Subtotal
  const subtotalMatch = rawText.match(/(?:sub\s*total|subtotal|taxable\s*value)[:.\s=]*[$₹¥€£]?\s*([0-9]+[.,][0-9]{2})/i);
  if (subtotalMatch) {
    subtotal = parsePrice(subtotalMatch[1]);
  }

  // 8. Detect Grand Total (handling Indian thermal print ₹ misread as 2 or ¥)
  const totalPatterns = [
    /(?:grand\s*total|granatotal|net\s*total|net\s*payable|amount\s*payable|total\s*payable)[:.\s=]*[₹¥$€£2]?\s*([0-9]+[.,][0-9]{2})/i,
    /(?:grand\s*total|granatotal)[^\d]*(\d+[.,]\d{2})/i,
  ];

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    for (const pattern of totalPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        let val = parsePrice(match[1]);
        // Handle thermal print symbol misread: e.g. 2440.00 when subtotal is 440.00
        if (subtotal > 0 && val > subtotal * 3 && Math.abs((val % 1000) - subtotal) < 0.05) {
          val = subtotal;
        }
        if (val > 0) {
          printedTotal = val;
          break;
        }
      }
    }
    if (printedTotal !== null) break;
  }

  // 9. Extract Line Items
  const items = [];

  let inItemSection = false;
  const itemSectionLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Start header: contains Item/Description and Qty/Price/Amount/Rate
    const isHeader = (lower.includes('item') || lower.includes('itern') || lower.includes('desc')) &&
                     (lower.includes('qty') || lower.includes('price') || lower.includes('amount') || lower.includes('rate'));
    if (isHeader) {
      inItemSection = true;
      continue;
    }

    // End boundary: Sub Total, Total Qty, Grand Total
    const isEnd = lower.includes('sub total') || lower.includes('subtotal') ||
                  lower.includes('total qty') || lower.includes('grand total') || lower.includes('granatotal');
    if (inItemSection && isEnd) {
      inItemSection = false;
      break;
    }

    if (inItemSection) {
      itemSectionLines.push(line);
    }
  }

  const linesToParse = itemSectionLines.length > 0 ? itemSectionLines : lines;

  const skipKeywords = [
    'subtotal', 'sub total', 'grand total', 'granatotal', 'total', 'tax', 'gst', 'cgst', 'sgst', 'vat',
    'discount', 'savings', 'cash', 'change', 'card', 'visa', 'mastercard', 'upi', 'tendered',
    'invoice', 'date', 'time', 'phone', 'thank you', 'thanks', 'token', 'cashier', 'dine in', 'name:'
  ];

  for (let i = 0; i < linesToParse.length; i++) {
    const line = linesToParse[i];
    const lower = line.toLowerCase();

    // Skip summary or meta lines
    if (skipKeywords.some((kw) => lower.startsWith(kw) || lower === kw)) continue;

    // Clean leading noise symbols (e.g. "LJ ", "%, ", "d ", "1 ")
    const cleanLine = line
      .replace(/^[^a-zA-Z0-9]+/, '')
      .replace(/[^a-zA-Z0-9\s.,()]+$/, '')
      .trim();

    if (!cleanLine || cleanLine.length < 2 || cleanLine.startsWith('---') || cleanLine.startsWith('===')) continue;

    // Subtitle append: e.g. "(Monday To Saturday)" appended to previous item
    if (cleanLine.startsWith('(') && items.length > 0) {
      const sub = cleanLine.replace(/[^a-zA-Z0-9\s()]/g, '').trim();
      items[items.length - 1].name += ' ' + sub;
      continue;
    }

    // Pattern 1: <Name> <Qty> <UnitPrice> <LineTotal>
    // e.g. "Punjabi Fix Thali 2 210.00 420.00"
    const p1 = cleanLine.match(/^([A-Za-z0-9\s.,&-]+?)\s+(\d+(?:\.\d+)?)\s+[$₹¥€£]?\s*(\d+[.,]\d{2})\s+[$₹¥€£]?\s*(\d+[.,]\d{2})/);
    if (p1) {
      const name = p1[1].trim();
      const qty = parseFloat(p1[2]);
      const price = parsePrice(p1[3]);
      const total = parsePrice(p1[4]);

      if (name.length >= 2 && total > 0) {
        items.push({
          name,
          quantity: qty,
          unitPrice: price,
          discount: 0,
          tax: 0,
          lineTotal: total,
          category: suggestCategory(name),
          confidence: 95,
          isFlagged: false,
        });
        continue;
      }
    }

    // Pattern 2: Glued token: <Name> <Qty><UnitPrice> <LineTotal>
    // e.g. "Mineral Water 120.00 20.00" (where 1 was Qty and 20.00 was UnitPrice)
    const p2 = cleanLine.match(/^([A-Za-z\s]+?)\s*(\d+)(\d{2}\.\d{2})\s+[$₹¥€£]?\s*(\d+[.,]\d{2})/);
    if (p2) {
      const name = p2[1].trim();
      const qty = parseFloat(p2[2]);
      const price = parsePrice(p2[3]);
      const total = parsePrice(p2[4]);

      if (name.length >= 2 && total > 0) {
        items.push({
          name,
          quantity: qty,
          unitPrice: price,
          discount: 0,
          tax: 0,
          lineTotal: total,
          category: suggestCategory(name),
          confidence: 92,
          isFlagged: false,
        });
        continue;
      }
    }

    // Pattern 3: <Name> <UnitPrice> <LineTotal> or <Name> <LineTotal>
    const p3 = cleanLine.match(/^([A-Za-z0-9\s.,&-]{2,35})\s+[$₹¥€£]?\s*(\d+[.,]\d{2})$/);
    if (p3) {
      const name = p3[1].trim();
      const total = parsePrice(p3[2]);
      const isWordy = /[a-zA-Z]{2,}/.test(name);

      if (isWordy && total > 0 && total < 100000) {
        items.push({
          name,
          quantity: 1,
          unitPrice: total,
          discount: 0,
          tax: 0,
          lineTotal: total,
          category: suggestCategory(name),
          confidence: 90,
          isFlagged: false,
        });
        continue;
      }
    }
  }

  // Calculate items sum
  const itemsSum = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  const roundedItemsSum = Math.round(itemsSum * 100) / 100;

  if (subtotal === 0 && items.length > 0) {
    subtotal = roundedItemsSum;
  }

  // Calculated Grand Total
  let calculatedTotal = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;

  // If subtotal + taxAmount already matches printedTotal, discount is promotional/informational
  if (printedTotal !== null && Math.abs((subtotal + taxAmount) - printedTotal) < 0.05) {
    calculatedTotal = Math.round((subtotal + taxAmount) * 100) / 100;
  }

  // If items sum matches printedTotal exactly, set calculatedTotal to printedTotal
  if (printedTotal !== null && Math.abs(roundedItemsSum - printedTotal) < 0.05) {
    calculatedTotal = printedTotal;
    subtotal = printedTotal;
  }

  // Discrepancy check: Compare printed total vs calculated total
  let hasDiscrepancy = false;
  let discrepancyNote = '';
  if (printedTotal !== null && printedTotal > 0) {
    const diff = Math.abs(printedTotal - calculatedTotal);
    if (diff > 0.05) {
      hasDiscrepancy = true;
      discrepancyNote = `Printed bill total (${printedTotal.toFixed(2)}) differs from calculated total (${calculatedTotal.toFixed(2)}) by ${diff.toFixed(2)}.`;
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
    confidenceScore: Math.min(Math.max(ocrConfidence, items.length > 0 ? 92 : 60), 98),
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
