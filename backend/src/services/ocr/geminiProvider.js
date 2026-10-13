const env = require('../../config/env');
const { suggestCategory } = require('./receiptParser');
const {
  STANDARD_COLUMNS,
  SUPERMARKET_COLUMNS,
  FIRSTCRY_COLUMNS,
  SWIGGY_COLUMNS,
  ECOMMERCE_COLUMNS,
  JEWELRY_COLUMNS,
  TELECOM_COLUMNS,
  PAYMENT_APP_COLUMNS,
  ELECTRONICS_COLUMNS,
} = require('./multiFormatParsers');

/**
 * SpendWise Gemini Vision OCR Provider — High-Precision Multimodal Bill Extraction
 *
 * Uses Google Gemini 3.8 Flash to natively understand bill images and PDFs
 * and return structured JSON with dynamic columns per bill format.
 *
 * Handles blurry thermal receipts, tilted photos, complex multi-page invoices, etc.
 */

const GEMINI_PROMPT = `You are an expert Indian bill and receipt parser. Analyze this bill/receipt/invoice image very carefully and extract ALL data into valid JSON.

CRITICAL RULES:
1. Read EVERY line item printed on the bill. Do NOT skip any item. Do NOT invent items not on the bill.
2. Match the EXACT item count — if the bill has 5 items, return exactly 5 items. If it has 46 items, return all 46 items.
3. Extract the EXACT item names as printed (fix minor OCR typos but keep the real name).
4. Extract EXACT quantities, unit prices, and line totals as printed. Do NOT guess or round.
5. Extract ALL taxes (CGST, SGST, IGST, GST, VAT, Service Tax) with exact amounts.
6. Extract ALL discounts with exact amounts.
7. The grand total / net amount must match what is printed on the bill.
8. If a field is not visible or not present on the bill, use null (not 0, not empty string).
9. For the date, use the format YYYY-MM-DD. If year shows 2 digits like "26", interpret as 2026.

BILL FORMAT DETECTION — detect which type of bill this is:
- "supermarket" — Supermarkets & Hypermarkets (DMart, Smart Bazaar, Reliance Smart, Big Bazaar, Spencer's, More Retail)
- "ecommerce" — Online shopping invoice (Flipkart, Amazon, Myntra, Ajio, Meesho, Nykaa, Snapdeal)
- "firstcry" — FirstCry or kids/baby store invoice
- "swiggy" — Swiggy, Zomato, food delivery or restaurant orders
- "jewelry" — Jewelry/luxury store (Tanishq, Kalyan, Malabar Gold, CaratLane, PC Jeweller)
- "telecom" — Telecom/utility bill (Airtel, Jio, Vi/Vodafone, BSNL, electricity, water)
- "payment_app" — Digital payment receipt (PhonePe, Google Pay, Paytm, CRED, BHIM UPI)
- "electronics" — Electronics retail (Reliance Digital, Croma, Vijay Sales, iStore)
- "standard" — Local general retail, cafe, bakery, pharmacy

DYNAMIC COLUMNS — Based on the bill format, return the appropriate columns array:

For "supermarket" bills, each item should have: name, quantity, mrp, unitPrice, discount, lineTotal
For "ecommerce" bills, each item should have: name, hsn, quantity, grossAmount, discount, taxableValue, cgst, sgst, lineTotal
For "firstcry" bills, each item should have: name, quantity, unitPrice, discount, lineTotal
For "swiggy" bills, each item should have: name, quantity, unitPrice, discount, tax, lineTotal
For "jewelry" bills, each item should have: name, purity, hsn, quantity, grossWeight, netMetalWeight, grossPrice, makingCharges, discount, cgst, sgst, lineTotal
For "telecom" bills, each item should have: name, mobileNumber, quantity, unitPrice, tax, lineTotal
For "payment_app" bills, each item should have: name, transactionId, paymentMode, quantity, platformFee, lineTotal
For "electronics" bills, each item should have: name, serialNo, quantity, unitPrice, discount, tax, lineTotal
For "standard" bills, each item should have: name, quantity, unitPrice, discount, tax, lineTotal

If the bill has additional columns not listed above (e.g. HSN code on a restaurant bill, or warranty info), include them as extra fields on each item.

Return ONLY valid JSON (no markdown, no code fences) with this exact schema:
{
  "billFormat": "supermarket" | "ecommerce" | "firstcry" | "swiggy" | "jewelry" | "telecom" | "payment_app" | "electronics" | "standard",
  "retailerName": "exact store/brand name as printed",
  "retailerAddress": "full address if visible, or null",
  "invoiceNumber": "bill/invoice number if visible, or null",
  "billDate": "YYYY-MM-DD",
  "billTime": "HH:MM" or null,
  "printedTotal": number (the grand total / net amount printed on bill),
  "subtotal": number (pre-tax subtotal if shown, or sum of line items before tax),
  "taxAmount": number (total tax amount — sum of all CGST+SGST+GST+VAT etc.),
  "taxBreakdown": [{"label": "CGST @9%", "amount": 12.50}, ...] or [],
  "discountAmount": number (total discount amount),
  "additionalCharges": number (delivery/service/packing charges, or 0),
  "roundOff": number (round-off adjustment, can be negative),
  "paymentMethod": "Cash" | "Credit Card" | "Debit Card" | "UPI" | "Net Banking" | "Other",
  "suggestedCategory": "Food & Dining" | "Groceries" | "Shopping" | "Healthcare" | "Transport" | "Bills & Utilities" | "Entertainment" | "Education" | "Other",
  "items": [
    {
      "name": "exact item name",
      "quantity": number,
      "unitPrice": number,
      "lineTotal": number,
      "confidence": 85-100
    }
  ],
  "confidenceScore": 70-99
}`;

/**
 * Column definitions mapped by bill format
 */
const FORMAT_COLUMNS = {
  standard: STANDARD_COLUMNS,
  supermarket: SUPERMARKET_COLUMNS,
  firstcry: FIRSTCRY_COLUMNS,
  swiggy: SWIGGY_COLUMNS,
  ecommerce: ECOMMERCE_COLUMNS,
  jewelry: JEWELRY_COLUMNS,
  telecom: TELECOM_COLUMNS,
  payment_app: PAYMENT_APP_COLUMNS,
  electronics: ELECTRONICS_COLUMNS,
};

const sharp = require('sharp');

// Prioritize highest-throughput, low-latency models to ensure response in seconds
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
];

/**
 * Execute Gemini generateContent with automatic model failover and fast timeout
 */
async function callGeminiCascade(makePayload, apiKey) {
  let lastError;

  for (const model of CANDIDATE_MODELS) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload = makePayload(model);

    // Dynamic timeout: 7s for primary flash-lite, 6s for secondary
    const timeoutMs = model === 'gemini-3.1-flash-lite' ? 7000 : 6000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[Gemini OCR] Dispatching bill analysis to model: ${model}...`);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textContent) {
          console.log(`[Gemini OCR] Analysis succeeded with model: ${model}`);
          return textContent;
        }
      }

      const status = response.status;
      const errText = await response.text();
      console.warn(`[Gemini OCR] Model ${model} returned status ${status}: ${errText.slice(0, 120)}`);

      // 503 (high demand), 429 (rate limit), 404 (deprecated model), 500 -> failover immediately to next model
      if (status === 503 || status === 429 || status === 404 || status === 500) {
        lastError = new Error(`Model ${model} unavailable (${status}): ${errText.slice(0, 100)}`);
        continue;
      }

      throw new Error(`Gemini API error (${status}): ${errText}`);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`[Gemini OCR] Error with model ${model}:`, err.message);
      lastError = err;
      // Try next candidate model
      continue;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed to respond.');
}

/**
 * Pre-optimize high-resolution images to accelerate upload & prevent timeouts
 */
async function optimizeImageForVision(fileBuffer, mimeType) {
  try {
    const meta = await sharp(fileBuffer).metadata();
    if ((meta.width && meta.width > 1200) || (meta.height && meta.height > 1600) || fileBuffer.length > 250 * 1024) {
      console.log(`[Gemini OCR] Fast-optimizing receipt image (${meta.width}x${meta.height}, ${(fileBuffer.length / 1024).toFixed(0)}KB)...`);
      const optimized = await sharp(fileBuffer)
        .resize({ width: 1200, height: 1600, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();
      console.log(`[Gemini OCR] Image optimized down to ${(optimized.length / 1024).toFixed(0)}KB.`);
      return { buffer: optimized, mime: 'image/jpeg' };
    }
  } catch (err) {
    console.warn('[Gemini OCR] Image optimization skipped:', err.message);
  }
  return { buffer: fileBuffer, mime: mimeType || 'image/jpeg' };
}

/**
 * Process an image buffer through Gemini Vision API
 */
async function processImageWithGemini(fileBuffer, mimeType, customApiKey = '') {
  const apiKey = (customApiKey && customApiKey.trim().length > 10)
    ? customApiKey.trim()
    : (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 10 ? env.GEMINI_API_KEY.trim() : '');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in backend environment');
  }

  const { buffer: readyBuffer, mime: readyMime } = await optimizeImageForVision(fileBuffer, mimeType);
  const base64Data = readyBuffer.toString('base64');

  const makePayload = () => ({
    contents: [
      {
        parts: [
          { text: GEMINI_PROMPT },
          {
            inline_data: {
              mime_type: readyMime,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0.05,
      maxOutputTokens: 8192,
    },
  });

  const textContent = await callGeminiCascade(makePayload, apiKey);

  let jsonStr = textContent.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }
  const parsed = JSON.parse(jsonStr);

  return normalizeGeminiResponse(parsed);
}

/**
 * Process a PDF buffer through Gemini Vision API (for scanned/image PDFs)
 */
async function processPdfWithGemini(fileBuffer, customApiKey = '') {
  const apiKey = (customApiKey && customApiKey.trim().length > 10)
    ? customApiKey.trim()
    : (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 10 ? env.GEMINI_API_KEY.trim() : '');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in backend environment');
  }

  const base64Data = fileBuffer.toString('base64');

  const makePayload = () => ({
    contents: [
      {
        parts: [
          { text: GEMINI_PROMPT },
          {
            inline_data: {
              mime_type: 'application/pdf',
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0.05,
      maxOutputTokens: 8192,
    },
  });

  const textContent = await callGeminiCascade(makePayload, apiKey);

  let jsonStr = textContent.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }
  const parsed = JSON.parse(jsonStr);

  return normalizeGeminiResponse(parsed);
}

/**
 * Normalize and validate the Gemini response into SpendWise's expected format
 */
function normalizeGeminiResponse(parsed) {
  const billFormat = parsed.billFormat || 'standard';
  const columns = FORMAT_COLUMNS[billFormat] || STANDARD_COLUMNS;

  // Normalize date
  let billDate = parsed.billDate ? new Date(parsed.billDate) : new Date();
  if (isNaN(billDate.getTime())) billDate = new Date();
  // Ensure date is not in the future
  if (billDate > new Date(Date.now() + 86400000)) billDate = new Date();

  // Validate and normalize items
  const items = Array.isArray(parsed.items) ? parsed.items.map((item, idx) => {
    const normalized = {
      name: (item.name || `Item ${idx + 1}`).trim(),
      quantity: Math.max(0.01, Number(item.quantity) || 1),
      unitPrice: Math.max(0, Number(item.unitPrice) || Number(item.grossAmount) || Number(item.grossPrice) || 0),
      discount: Math.max(0, Number(item.discount) || 0),
      tax: Math.max(0, Number(item.tax) || 0),
      lineTotal: Math.max(0, Number(item.lineTotal) || 0),
      category: item.category || suggestCategory(item.name || ''),
      confidence: Math.min(100, Math.max(50, Number(item.confidence) || 90)),
      isFlagged: Number(item.confidence) < 80,
    };

    // Copy all format-specific fields
    if (item.mrp !== undefined) normalized.mrp = Number(item.mrp) || 0;
    if (item.hsn !== undefined && item.hsn !== null) normalized.hsn = String(item.hsn);
    if (item.grossAmount !== undefined) normalized.grossAmount = Number(item.grossAmount) || 0;
    if (item.taxableValue !== undefined) normalized.taxableValue = Number(item.taxableValue) || 0;
    if (item.cgst !== undefined) normalized.cgst = Number(item.cgst) || 0;
    if (item.sgst !== undefined) normalized.sgst = Number(item.sgst) || 0;
    if (item.igst !== undefined) normalized.igst = Number(item.igst) || 0;
    if (item.purity !== undefined) normalized.purity = String(item.purity);
    if (item.grossWeight !== undefined) normalized.grossWeight = Number(item.grossWeight) || 0;
    if (item.netMetalWeight !== undefined) normalized.netMetalWeight = Number(item.netMetalWeight) || 0;
    if (item.grossPrice !== undefined) normalized.grossPrice = Number(item.grossPrice) || 0;
    if (item.makingCharges !== undefined) normalized.makingCharges = Number(item.makingCharges) || 0;
    if (item.mobileNumber !== undefined) normalized.mobileNumber = String(item.mobileNumber);
    if (item.transactionId !== undefined) normalized.transactionId = String(item.transactionId);
    if (item.paymentMode !== undefined) normalized.paymentMode = String(item.paymentMode);
    if (item.platformFee !== undefined) normalized.platformFee = Number(item.platformFee) || 0;
    if (item.serialNo !== undefined) normalized.serialNo = String(item.serialNo);

    // Compute tax from CGST+SGST if not set directly
    if (normalized.tax === 0 && (normalized.cgst > 0 || normalized.sgst > 0)) {
      normalized.tax = Math.round(((normalized.cgst || 0) + (normalized.sgst || 0) + (normalized.igst || 0)) * 100) / 100;
    }

    // If lineTotal is 0 but unitPrice exists, calculate it
    if (normalized.lineTotal === 0 && normalized.unitPrice > 0) {
      normalized.lineTotal = Math.round((normalized.quantity * normalized.unitPrice - normalized.discount + normalized.tax) * 100) / 100;
    }

    return normalized;
  }) : [];

  // Calculate totals from items
  const itemsSum = items.reduce((s, i) => s + (i.lineTotal || 0), 0);
  const totalTax = items.reduce((s, i) => s + (i.tax || 0), 0);
  const totalDiscount = items.reduce((s, i) => s + (i.discount || 0), 0);

  const printedTotal = parsed.printedTotal !== null && parsed.printedTotal !== undefined
    ? Number(parsed.printedTotal) : null;
  const subtotal = Number(parsed.subtotal) || Math.round(itemsSum * 100) / 100;
  const taxAmount = Number(parsed.taxAmount) || Math.round(totalTax * 100) / 100;
  const discountAmount = Number(parsed.discountAmount) || Math.round(totalDiscount * 100) / 100;
  const additionalCharges = Number(parsed.additionalCharges) || 0;
  const roundOff = Number(parsed.roundOff) || 0;

  // Smart calculated total
  let calculatedTotal;
  if (printedTotal !== null && printedTotal > 0) {
    calculatedTotal = printedTotal;
  } else {
    calculatedTotal = Math.round(itemsSum * 100) / 100;
  }

  // Check discrepancy accurately
  let hasDiscrepancy = false;
  let discrepancyNote = '';
  if (printedTotal !== null && printedTotal > 0) {
    const isTaxInclusive = Math.abs(itemsSum - printedTotal) <= 1.05;
    const expected = isTaxInclusive
      ? itemsSum
      : Math.round((itemsSum + taxAmount - discountAmount + additionalCharges + roundOff) * 100) / 100;
    const diff = Math.abs(printedTotal - expected);
    if (diff > 1.05 && Math.abs(printedTotal - itemsSum) > 1.05) {
      hasDiscrepancy = true;
      discrepancyNote = `Printed total (${printedTotal.toFixed(2)}) differs from calculated total (${expected.toFixed(2)}) by ${diff.toFixed(2)}.`;
    }
  }

  // Detect extra columns from items that aren't in the standard column set
  const extraColumnKeys = new Set();
  const columnKeys = new Set(columns.map(c => c.key));
  // Ignore internal/redundant keys
  const ignoredKeys = new Set(['category', 'confidence', 'isFlagged', 'tax', 'id', '_id']);
  if (columnKeys.has('grossAmount') || columnKeys.has('grossPrice')) {
    ignoredKeys.add('unitPrice');
  }

  for (const item of items) {
    for (const key of Object.keys(item)) {
      if (!columnKeys.has(key) && !ignoredKeys.has(key)) {
        extraColumnKeys.add(key);
      }
    }
  }

  // Build final columns — base columns + any extra dynamic columns Gemini detected
  const finalColumns = [...columns];
  for (const extraKey of extraColumnKeys) {
    const hasValue = items.some(i => i[extraKey] !== undefined && i[extraKey] !== null && i[extraKey] !== 0 && i[extraKey] !== '');
    if (hasValue) {
      const sampleVal = items.find(i => i[extraKey] !== undefined)?.[extraKey];
      const type = typeof sampleVal === 'number' ? 'currency' : 'text';
      const label = extraKey
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase())
        .trim();
      finalColumns.push({ key: extraKey, label, type, width: 'w-24' });
    }
  }

  return {
    retailerName: (parsed.retailerName || 'Retail Store').trim(),
    retailerAddress: (parsed.retailerAddress || '').trim(),
    invoiceNumber: (parsed.invoiceNumber || '').trim(),
    billDate,
    billTime: parsed.billTime || null,
    printedTotal,
    subtotal,
    taxAmount,
    discountAmount,
    additionalCharges,
    calculatedTotal,
    paymentMethod: parsed.paymentMethod || 'Cash',
    suggestedCategory: parsed.suggestedCategory || suggestCategory(parsed.retailerName || ''),
    billFormat,
    columns: finalColumns,
    items,
    rawText: '', // Gemini processes the image directly — no raw OCR text
    confidenceScore: Math.min(99, Math.max(70, Number(parsed.confidenceScore) || 92)),
    hasDiscrepancy,
    discrepancyNote,
  };
}

module.exports = {
  processImageWithGemini,
  processPdfWithGemini,
};
