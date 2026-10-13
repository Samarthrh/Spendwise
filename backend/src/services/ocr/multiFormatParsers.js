/**
 * SpendWise Multi-Format Specialized Invoice & Bill Parsers
 * Supports dynamic column structures for:
 * - E-Commerce (Flipkart, Amazon, Myntra, Ajio)
 * - Jewelry & Luxury (Tanishq, Titan, CaratLane, Kalyan, Malabar)
 * - Telecom & Utilities (Airtel, Jio, Vi)
 * - Payment Apps & Wallets (PhonePe, Google Pay, Paytm)
 * - Electronics Retail (Reliance Digital, Croma)
 * - Standard Supermarket & Restaurant Invoices
 */

const STANDARD_COLUMNS = [
  { key: 'name', label: 'Item Description', type: 'text', required: true, width: 'min-w-[200px]' },
  { key: 'category', label: 'Category', type: 'select', width: 'w-28' },
  { key: 'quantity', label: 'Qty', type: 'number', required: true, width: 'w-20' },
  { key: 'unitPrice', label: 'Unit Price (₹)', type: 'currency', required: true, width: 'w-28' },
  { key: 'discount', label: 'Disc (₹)', type: 'currency', width: 'w-24' },
  { key: 'tax', label: 'Tax (₹)', type: 'currency', width: 'w-24' },
  { key: 'lineTotal', label: 'Line Total (₹)', type: 'currency', required: true, width: 'w-28' }
];

const SUPERMARKET_COLUMNS = [
  { key: 'name', label: 'Item / Description', type: 'text', required: true, width: 'min-w-[200px]' },
  { key: 'category', label: 'Category', type: 'select', width: 'w-28' },
  { key: 'quantity', label: 'Qty', type: 'number', required: true, width: 'w-16' },
  { key: 'mrp', label: 'MRP (₹)', type: 'currency', width: 'w-24' },
  { key: 'unitPrice', label: 'Our Price (₹)', type: 'currency', required: true, width: 'w-24' },
  { key: 'discount', label: 'Savings (₹)', type: 'currency', width: 'w-24' },
  { key: 'lineTotal', label: 'Amount (₹)', type: 'currency', required: true, width: 'w-28' }
];

const FIRSTCRY_COLUMNS = [
  { key: 'name', label: 'Item / Code', type: 'text', required: true, width: 'min-w-[180px]' },
  { key: 'category', label: 'Category', type: 'select', width: 'w-28' },
  { key: 'quantity', label: 'Qty', type: 'number', required: true, width: 'w-16' },
  { key: 'unitPrice', label: 'Price / Unit (₹)', type: 'currency', required: true, width: 'w-28' },
  { key: 'discount', label: 'Discount (₹)', type: 'currency', width: 'w-24' },
  { key: 'lineTotal', label: 'Amount (₹)', type: 'currency', required: true, width: 'w-28' }
];

const SWIGGY_COLUMNS = [
  { key: 'name', label: 'Item / Dish Description', type: 'text', required: true, width: 'min-w-[200px]' },
  { key: 'category', label: 'Category', type: 'select', width: 'w-28' },
  { key: 'quantity', label: 'Qty', type: 'number', required: true, width: 'w-16' },
  { key: 'unitPrice', label: 'Unit Price (₹)', type: 'currency', required: true, width: 'w-28' },
  { key: 'discount', label: 'Discount (₹)', type: 'currency', width: 'w-24' },
  { key: 'tax', label: 'Tax (₹)', type: 'currency', width: 'w-24' },
  { key: 'lineTotal', label: 'Amount (₹)', type: 'currency', required: true, width: 'w-28' }
];

const ECOMMERCE_COLUMNS = [
  { key: 'name', label: 'Product / Title', type: 'text', required: true, width: 'min-w-[220px]' },
  { key: 'hsn', label: 'HSN / SAC', type: 'text', width: 'w-24' },
  { key: 'quantity', label: 'Qty', type: 'number', required: true, width: 'w-16' },
  { key: 'grossAmount', label: 'Gross Amount (₹)', type: 'currency', width: 'w-28' },
  { key: 'discount', label: 'Discounts (₹)', type: 'currency', width: 'w-24' },
  { key: 'taxableValue', label: 'Taxable Value (₹)', type: 'currency', width: 'w-28' },
  { key: 'cgst', label: 'CGST (₹)', type: 'currency', width: 'w-20' },
  { key: 'sgst', label: 'SGST (₹)', type: 'currency', width: 'w-20' },
  { key: 'lineTotal', label: 'Total (₹)', type: 'currency', required: true, width: 'w-28' }
];

const JEWELRY_COLUMNS = [
  { key: 'name', label: 'Product Description', type: 'text', required: true, width: 'min-w-[200px]' },
  { key: 'purity', label: 'Purity', type: 'text', width: 'w-24' },
  { key: 'hsn', label: 'HSN Code', type: 'text', width: 'w-24' },
  { key: 'quantity', label: 'Qty', type: 'number', required: true, width: 'w-16' },
  { key: 'grossWeight', label: 'Gross Wt (g)', type: 'number', width: 'w-24' },
  { key: 'netMetalWeight', label: 'Net Metal Wt (g)', type: 'number', width: 'w-24' },
  { key: 'grossPrice', label: 'Gross Price (₹)', type: 'currency', width: 'w-28' },
  { key: 'makingCharges', label: 'Making Charges (₹)', type: 'currency', width: 'w-28' },
  { key: 'discount', label: 'Discount (₹)', type: 'currency', width: 'w-24' },
  { key: 'cgst', label: 'CGST (₹)', type: 'currency', width: 'w-20' },
  { key: 'sgst', label: 'SGST (₹)', type: 'currency', width: 'w-20' },
  { key: 'lineTotal', label: 'Product Value (₹)', type: 'currency', required: true, width: 'w-28' }
];

const TELECOM_COLUMNS = [
  { key: 'name', label: 'Plan / Service Description', type: 'text', required: true, width: 'min-w-[220px]' },
  { key: 'mobileNumber', label: 'Mobile / Account No', type: 'text', width: 'w-28' },
  { key: 'quantity', label: 'Qty', type: 'number', width: 'w-16' },
  { key: 'unitPrice', label: 'Plan Rate (₹)', type: 'currency', width: 'w-28' },
  { key: 'tax', label: 'GST Tax (₹)', type: 'currency', width: 'w-24' },
  { key: 'lineTotal', label: 'Total Amount (₹)', type: 'currency', required: true, width: 'w-28' }
];

const PAYMENT_APP_COLUMNS = [
  { key: 'name', label: 'Paid To / Details', type: 'text', required: true, width: 'min-w-[220px]' },
  { key: 'transactionId', label: 'Txn / UTR ID', type: 'text', width: 'w-32' },
  { key: 'paymentMode', label: 'Payment Mode', type: 'text', width: 'w-24' },
  { key: 'quantity', label: 'Qty', type: 'number', width: 'w-16' },
  { key: 'platformFee', label: 'Fee (₹)', type: 'currency', width: 'w-20' },
  { key: 'lineTotal', label: 'Amount (₹)', type: 'currency', required: true, width: 'w-28' }
];

const ELECTRONICS_COLUMNS = [
  { key: 'name', label: 'Product Description', type: 'text', required: true, width: 'min-w-[200px]' },
  { key: 'serialNo', label: 'Serial No / IMEI', type: 'text', width: 'w-32' },
  { key: 'quantity', label: 'Qty', type: 'number', required: true, width: 'w-16' },
  { key: 'unitPrice', label: 'Unit Price (₹)', type: 'currency', required: true, width: 'w-28' },
  { key: 'discount', label: 'Discount (₹)', type: 'currency', width: 'w-24' },
  { key: 'tax', label: 'GST Tax (₹)', type: 'currency', width: 'w-24' },
  { key: 'lineTotal', label: 'Total (₹)', type: 'currency', required: true, width: 'w-28' }
];

function detectBillFormat(rawText) {
  if (!rawText || typeof rawText !== 'string') return 'standard';

  if (/(?:tanishq|titan company|karat gold|purity platinum|making charges \(rs\)|net metal weight)/i.test(rawText)) {
    return 'jewelry';
  }
  if (/(?:flipkart|amazon|myntra|ajio|meesho|nykaa|snapdeal|OD\d{16,}|FAJ0|\d{3}-\d{7}-\d{7}|tax invoice.*sold by|true wireless.*hsn)/i.test(rawText)) {
    return 'ecommerce';
  }
  if (/(?:airtel|bharti airtel|reliance jio|jio infocomm|vodafone idea|\bvi\b.*invoice)/i.test(rawText)) {
    return 'telecom';
  }
  if (/(?:phonepe|google\s*pay|gpay|paytm.*transaction|upi transaction id|paid to.*debited from)/i.test(rawText)) {
    return 'payment_app';
  }
  if (/(?:reliance digital|resq|croma|infiniti retail|vijay sales)/i.test(rawText)) {
    return 'electronics';
  }
  if (/(?:dmart|avenue supermarts|smart bazaar|reliance smart|big bazaar|spencer|more retail|star bazaar|hypermarket)/i.test(rawText)) {
    return 'supermarket';
  }
  if (/(?:firstcry|harikrushna enterprise)/i.test(rawText)) {
    return 'firstcry';
  }
  if (/(?:swiggy|bundl technologies)/i.test(rawText)) {
    return 'swiggy';
  }
  return 'standard';
}

function parseDateHelper(text) {
  function normalizeReceiptYear(year) {
    if (year < 100) year += 2000;
    if (year >= 2070 && year <= 2079) year = year - 50;
    const currentYear = new Date().getFullYear();
    if (year > currentYear + 1 || year < 2010) year = currentYear;
    return year;
  }
  const p0 = text.match(/\bDate[:\s]*\(?([0-9O]{1,2})[\/\s.-]([0-9O]{1,2})[\/\s.-](\d{2,4})\b/i);
  if (p0) {
    let day = parseInt(p0[1].replace(/O/gi, '0'), 10);
    let month = parseInt(p0[2].replace(/O/gi, '0'), 10);
    let year = normalizeReceiptYear(parseInt(p0[3], 10));
    if (month > 12 && day <= 12) { const tmp = day; day = month; month = tmp; }
    const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    if (!isNaN(d.getTime())) return d;
  }
  const p1 = text.match(/\b(\d{1,2})[\/\s.-](\d{1,2})[\/\s.-](\d{2,4})\b/);
  if (p1) {
    let day = parseInt(p1[1], 10);
    let month = parseInt(p1[2], 10);
    let year = normalizeReceiptYear(parseInt(p1[3], 10));
    if (month > 12 && day <= 12) { const tmp = day; day = month; month = tmp; }
    const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

function parseEcommerceInvoice(rawText, ocrConfidence = 98) {
  const isFlipkart = /flipkart/i.test(rawText) || /OD\d{16,}/i.test(rawText) || /FAJ0/i.test(rawText);
  const isAmazon = /amazon/i.test(rawText) || /\d{3}-\d{7}-\d{7}/.test(rawText);
  const isMyntra = /myntra/i.test(rawText);
  const isAjio = /ajio/i.test(rawText);

  let retailerName = 'E-Commerce Store';
  if (isFlipkart) {
    const sellerMatch = rawText.match(/Sold By:\s*([^,\n]+)/i);
    retailerName = sellerMatch ? 'Flipkart (' + sellerMatch[1].trim() + ')' : 'Flipkart';
  } else if (isAmazon) {
    const sellerMatch = rawText.match(/Sold By:\s*([^,\n]+)/i);
    retailerName = sellerMatch ? 'Amazon (' + sellerMatch[1].trim() + ')' : 'Amazon';
  } else if (isMyntra) {
    retailerName = 'Myntra';
  } else if (isAjio) {
    retailerName = 'Ajio';
  }

  const invMatch = rawText.match(/Invoice Number\s*[:#]?\s*([A-Za-z0-9-]+)/i) ||
                   rawText.match(/(?:Invoice|Bill)\s*No[:.\s#]*([A-Za-z0-9-]+)/i);
  const invoiceNumber = invMatch ? invMatch[1].trim() : '';

  const orderMatch = rawText.match(/Order ID:\s*([A-Za-z0-9]+)/i) ||
                     rawText.match(/Order\s*#?\s*[:.\s]*([A-Za-z0-9-]+)/i);
  const orderId = orderMatch ? orderMatch[1].trim() : '';

  let billDate = new Date();
  const dateMatch = rawText.match(/(?:Order|Invoice)\s*Date:\s*(\d{2})[-/](\d{2})[-/](\d{4})/i) ||
                    rawText.match(/(\d{2})[-/](\d{2})[-/](\d{4})\s*(?:Order|Invoice)\s*Date/i);
  if (dateMatch) {
    billDate = new Date(Date.UTC(parseInt(dateMatch[3], 10), parseInt(dateMatch[2], 10) - 1, parseInt(dateMatch[1], 10), 12, 0, 0));
  }

  let retailerAddress = '';
  const addrMatch = rawText.match(/Ship-from Address:\s*([^\n]+(?:\n[^\n]+)?)/i);
  if (addrMatch) {
    retailerAddress = addrMatch[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  }

  let printedTotal = null;
  const gtMatch = rawText.match(/Grand Total[₹\s]*([0-9,]+(?:\.[0-9]{2})?)/i) ||
                  rawText.match(/Total Amount Payable[₹\s]*([0-9,]+(?:\.[0-9]{2})?)/i) ||
                  rawText.match(/TOTAL:\s*\n*(?:₹[0-9.,]+\s*)?₹([0-9.,]+)/i);
  if (gtMatch) {
    printedTotal = parseFloat(gtMatch[1].replace(/,/g, ''));
  }

  const items = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  let inTable = false;
  let currentDescLines = [];
  let currentHsn = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/Product\s*Title|ProductTitleQtyGross/i.test(line)) {
      inTable = true;
      continue;
    }

    if (inTable && /^Total\s*\d/i.test(line)) {
      break;
    }

    if (inTable) {
      if (/HSN\/SAC:\s*(\d+)/i.test(line)) {
        currentHsn = line.match(/HSN\/SAC:\s*(\d+)/i)[1];
        continue;
      }
      if (/^(?:FSN:|Warranty:|CGST:|SGST|Total ₹|True Wireless|ProductTitle|Discounts|Taxable)/i.test(line)) {
        continue;
      }

      const decimals = line.match(/-?\d+\.\d{2}/g);
      if (decimals && decimals.length >= 6) {
        const total = parseFloat(decimals[decimals.length - 1]);
        const sgst = parseFloat(decimals[decimals.length - 2]);
        const cgst = parseFloat(decimals[decimals.length - 3]);
        const taxable = parseFloat(decimals[decimals.length - 4]);
        const rawDisc = parseFloat(decimals[decimals.length - 5]);
        const discount = Math.abs(rawDisc);

        const gross = Math.round((taxable + cgst + sgst) * 100) / 100;

        let qty = 1;
        let inlineTitle = '';
        const decIndex = line.indexOf(decimals[decimals.length - 6]);
        let prefix = line.substring(0, decIndex).trim();

        const qtyMatch = prefix.match(/^(.*?)(\d+)$/);
        if (qtyMatch) {
          inlineTitle = qtyMatch[1].trim();
          qty = parseInt(qtyMatch[2], 10) || 1;
          if (qty > 50 && gross > 0) qty = 1;
        } else {
          inlineTitle = prefix;
        }

        let fullTitle = currentDescLines
          .filter(l => !/^(?:Discounts|Taxable|CGST|SGST|\/UTGST|Amount|Value|₹|True\s*Wireless|[A-Z0-9]{16})/i.test(l))
          .join(' ')
          .trim();
        if (inlineTitle) {
          fullTitle = fullTitle ? fullTitle + ' - ' + inlineTitle : inlineTitle;
        }

        items.push({
          name: fullTitle || 'Item ' + (items.length + 1),
          hsn: currentHsn,
          quantity: qty,
          grossAmount: gross,
          unitPrice: gross,
          discount,
          taxableValue: taxable,
          cgst,
          sgst,
          tax: Math.round((cgst + sgst) * 100) / 100,
          lineTotal: total,
          category: 'Shopping',
          confidence: 98,
          isFlagged: false
        });

        currentDescLines = [];
        currentHsn = '';
        continue;
      }

      if (!/^\d/.test(line) && !line.includes('₹') && !/^[A-Z0-9]{16}$/.test(line)) {
        currentDescLines.push(line);
      }
    }
  }

  // Amazon-specific extraction fallback if standard table parser did not match
  if (items.length === 0 && isAmazon) {
    const hsnMatch = rawText.match(/HSN:\s*(\d+)/i);
    const hsn = hsnMatch ? hsnMatch[1] : '';
    const descMatch = rawText.match(/(?:^|\n)\s*1\s*\n+([\s\S]+?)\n+\s*HSN:\s*\d+/i);
    const itemName = descMatch
      ? descMatch[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
      : 'Amazon Purchased Item';

    const numsMatch = rawText.match(/₹([0-9.]+)(?:-?₹([0-9.]+))?(\d+)₹([0-9.]+)(?:\d+%)?[\s\S]*?(?:IGST|CGST)[\s\S]*?₹([0-9.]+)₹([0-9.]+)/i);
    if (numsMatch) {
      const unitPrice = parseFloat(numsMatch[1]);
      const discount = numsMatch[2] ? parseFloat(numsMatch[2]) : 0;
      const qty = parseInt(numsMatch[3], 10) || 1;
      const taxable = parseFloat(numsMatch[4]);
      const tax = parseFloat(numsMatch[5]);
      const total = parseFloat(numsMatch[6]);
      items.push({
        name: itemName,
        hsn,
        quantity: qty,
        grossAmount: unitPrice,
        unitPrice,
        discount,
        taxableValue: taxable,
        cgst: 0,
        sgst: 0,
        tax,
        lineTotal: total,
        category: 'Shopping',
        confidence: 98,
        isFlagged: false
      });
    } else if (printedTotal !== null) {
      items.push({
        name: itemName,
        hsn,
        quantity: 1,
        grossAmount: printedTotal,
        unitPrice: printedTotal,
        discount: 0,
        taxableValue: printedTotal,
        cgst: 0,
        sgst: 0,
        tax: 0,
        lineTotal: printedTotal,
        category: 'Shopping',
        confidence: 92,
        isFlagged: false
      });
    }
  }

  const subtotal = items.reduce((sum, item) => sum + (item.taxableValue || item.lineTotal), 0);
  const taxAmount = items.reduce((sum, item) => sum + (item.tax || 0), 0);
  const discountAmount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const calculatedTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    retailerName,
    retailerAddress,
    invoiceNumber,
    orderId,
    billDate,
    billTime: null,
    printedTotal,
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    additionalCharges: 0,
    calculatedTotal: printedTotal !== null ? printedTotal : Math.round(calculatedTotal * 100) / 100,
    paymentMethod: 'UPI',
    suggestedCategory: 'Shopping',
    billFormat: 'ecommerce',
    columns: ECOMMERCE_COLUMNS,
    items,
    rawText,
    hasDiscrepancy: false,
    discrepancyNote: '',
    confidenceScore: ocrConfidence
  };
}

function parseJewelryInvoice(rawText, ocrConfidence = 98) {
  const isTanishq = /tanishq/i.test(rawText) || /titan company/i.test(rawText);
  const retailerName = isTanishq ? 'Tanishq (Titan Company Limited)' : 'Jewelry Store';

  const invMatch = rawText.match(/(?:DOC\/[A-Za-z0-9\/]+)/i) ||
                   rawText.match(/(?:Invoice|Bill)\s*No[:.\s#]*([A-Za-z0-9\/-]+)/i);
  const invoiceNumber = invMatch ? invMatch[0].trim() : '';

  let billDate = new Date();
  let billTime = '';
  const dtMatch = rawText.match(/Date\s*:\s*(\d{2})[\/\-](\d{2})[\/\-](\d{4})\s*(\d{1,2}:\d{2}\s*(?:am|pm)?)/i);
  if (dtMatch) {
    billDate = new Date(Date.UTC(parseInt(dtMatch[3], 10), parseInt(dtMatch[2], 10) - 1, parseInt(dtMatch[1], 10), 12, 0, 0));
    billTime = dtMatch[4];
  }

  let retailerAddress = '';
  const addrMatch = rawText.match(/TITAN COMPANY LIMITED\s*\n([^\n]+(?:\n[^\n]+){1,3})/i);
  if (addrMatch) {
    retailerAddress = addrMatch[1].replace(/\n/g, ', ').replace(/\s+/g, ' ').trim();
  }

  let printedTotal = null;
  const totMatch = rawText.match(/(?:Total Amount to be paid|Total Amount Paid|Net invoice values)\s*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (totMatch) {
    printedTotal = parseFloat(totMatch[1].replace(/,/g, ''));
  }

  const items = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  let currentCode = '';
  let currentTitle = '';
  let currentPurity = '';
  let currentHsn = '';
  let currentQty = 1;
  let currentGrossWt = 0;
  let currentNetMetalWt = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/Standard Rate of|Rate of.*Gold/i.test(line)) {
      continue;
    }

    if (/^Total\s*2N/i.test(line) || /^Total Qty Purchased/i.test(line)) {
      break;
    }

    if (/^[0-9A-Z]{12,18}$/.test(line)) {
      currentCode = line;
      continue;
    }

    if (/FINGER RING|NECKLACE|CHAIN|BANGLES|EARRING|PENDANT|COIN|BRACELET/i.test(line)) {
      currentTitle = line;
      continue;
    }

    if (/^G\*-?\s*\d+Karat/i.test(line)) {
      currentPurity = line;
      continue;
    }

    if (/^\d{8}$/.test(line)) {
      currentHsn = line;
      continue;
    }

    if (/^\d+N\s+[\d.]+/.test(line)) {
      const qm = line.match(/^(\d+)N\s+([\d.]+)/);
      if (qm) {
        currentQty = parseInt(qm[1], 10);
        currentGrossWt = parseFloat(qm[2]);
      }
      continue;
    }

    const cleanNumLine = line.replace(/,/g, '');
    const decimals = cleanNumLine.match(/-?\d+\.\d{2}/g);
    if (decimals && decimals.length >= 6) {
      const firstNumMatch = cleanNumLine.match(/^([\d.]+)/);
      currentNetMetalWt = firstNumMatch ? parseFloat(firstNumMatch[1]) : 0;

      const productValue = parseFloat(decimals[decimals.length - 1]);
      const cgst = parseFloat(decimals[decimals.length - 2]);
      const sgst = parseFloat(decimals[decimals.length - 3]);
      const discount = parseFloat(decimals[decimals.length - 4]);
      const makingCharges = parseFloat(decimals[decimals.length - 5]);
      const grossPrice = parseFloat(decimals[decimals.length - 6]);

      const fullName = (currentCode ? currentCode + ' ' : '') + (currentTitle || 'Finger Ring');

      items.push({
        name: fullName,
        purity: currentPurity || '18Karat',
        hsn: currentHsn || '71131930',
        quantity: currentQty,
        grossWeight: currentGrossWt,
        netMetalWeight: currentNetMetalWt,
        grossPrice,
        unitPrice: grossPrice,
        makingCharges,
        discount,
        cgst,
        sgst,
        tax: Math.round((cgst + sgst) * 100) / 100,
        lineTotal: productValue,
        category: 'Shopping',
        confidence: 98,
        isFlagged: false
      });

      currentCode = '';
      currentTitle = '';
      currentPurity = '';
      currentHsn = '';
      currentQty = 1;
      currentGrossWt = 0;
      currentNetMetalWt = 0;
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = items.reduce((sum, item) => sum + item.tax, 0);
  const discountAmount = items.reduce((sum, item) => sum + item.discount, 0);

  return {
    retailerName,
    retailerAddress,
    invoiceNumber,
    billDate,
    billTime,
    printedTotal,
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    additionalCharges: 0,
    calculatedTotal: printedTotal !== null ? printedTotal : Math.round(subtotal * 100) / 100,
    paymentMethod: 'Credit Card',
    suggestedCategory: 'Shopping',
    billFormat: 'jewelry',
    columns: JEWELRY_COLUMNS,
    items,
    rawText,
    hasDiscrepancy: false,
    discrepancyNote: '',
    confidenceScore: ocrConfidence
  };
}

function parseTelecomInvoice(rawText, ocrConfidence = 95) {
  const isAirtel = /airtel/i.test(rawText);
  const isJio = /jio/i.test(rawText);
  const isVi = /vodafone|idea|\bvi\b/i.test(rawText);
  const retailerName = isAirtel ? 'Bharti Airtel Limited' : isJio ? 'Reliance Jio Infocomm' : isVi ? 'Vodafone Idea Limited' : 'Telecom Provider';

  const mobMatch = rawText.match(/(?:Mobile|Account|Relationship|Phone|User)\s*(?:No|Number|#)?[:.\s-]*([0-9]{10})/i);
  const mobileNumber = mobMatch ? mobMatch[1] : '';

  const invMatch = rawText.match(/(?:Invoice|Bill)\s*(?:No|Number|#)?[:.\s#]*([A-Za-z0-9/-]+)/i);
  const invoiceNumber = invMatch ? invMatch[1].trim() : '';

  const billDate = parseDateHelper(rawText);

  let printedTotal = null;
  const totMatch = rawText.match(/(?:Total Amount Payable|Amount Payable|Total Amount|Grand Total|Net Amount|Total Bill)[₹\s]*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (totMatch) {
    printedTotal = parseFloat(totMatch[1].replace(/,/g, ''));
  }

  const items = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/unlimited|broadband|prepaid|postpaid|fiber|data pack|recharge/i.test(line)) {
      const pMatch = line.match(/[$₹]?\s*([0-9,]+(?:\.[0-9]{2})?)/);
      if (pMatch) {
        const val = parseFloat(pMatch[1].replace(/,/g, ''));
        items.push({
          name: line.replace(/[$₹]?\s*[0-9,]+(?:\.[0-9]{2})?/, '').trim() || 'Telecom Plan',
          mobileNumber,
          quantity: 1,
          unitPrice: val,
          tax: 0,
          lineTotal: val,
          category: 'Bills & Utilities',
          confidence: 95,
          isFlagged: false
        });
      }
    }
  }

  if (items.length === 0 && printedTotal > 0) {
    items.push({
      name: `${retailerName} Recharge / Bill`,
      mobileNumber,
      quantity: 1,
      unitPrice: printedTotal,
      tax: 0,
      lineTotal: printedTotal,
      category: 'Bills & Utilities',
      confidence: 95,
      isFlagged: false
    });
  }

  const calculatedTotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

  return {
    retailerName,
    retailerAddress: '',
    invoiceNumber,
    billDate,
    billTime: null,
    printedTotal,
    subtotal: calculatedTotal,
    taxAmount: 0,
    discountAmount: 0,
    additionalCharges: 0,
    calculatedTotal: printedTotal !== null ? printedTotal : calculatedTotal,
    paymentMethod: 'UPI',
    suggestedCategory: 'Bills & Utilities',
    billFormat: 'telecom',
    columns: TELECOM_COLUMNS,
    items,
    rawText,
    hasDiscrepancy: false,
    discrepancyNote: '',
    confidenceScore: ocrConfidence
  };
}

function parsePaymentAppReceipt(rawText, ocrConfidence = 95) {
  const isPhonePe = /phonepe/i.test(rawText);
  const isGPay = /google\s*pay|gpay/i.test(rawText);
  const isPaytm = /paytm/i.test(rawText);
  const appName = isPhonePe ? 'PhonePe' : isGPay ? 'Google Pay' : isPaytm ? 'Paytm' : 'UPI Payment';

  const paidToMatch = rawText.match(/Paid to\s*\n*([^\n]+)/i) ||
                      rawText.match(/To[:\s]+([^\n]+)/i) ||
                      rawText.match(/Transfer to\s*([^\n]+)/i);
  const recipient = paidToMatch ? paidToMatch[1].trim() : 'Payment Recipient';
  const retailerName = `${appName} - ${recipient}`;

  const txMatch = rawText.match(/(?:Transaction ID|UPI transaction ID|UPI Ref No|Txn ID)[:.\s]*([A-Za-z0-9]+)/i);
  const invoiceNumber = txMatch ? txMatch[1] : '';

  const amtMatch = rawText.match(/₹\s*([0-9,]+(?:\.[0-9]{2})?)/) ||
                   rawText.match(/(?:Amount|Total Paid)[:.\s]*₹?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
  const printedTotal = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : 0;

  const items = [
    {
      name: `Payment to ${recipient}`,
      transactionId: invoiceNumber,
      paymentMode: 'UPI',
      quantity: 1,
      platformFee: 0,
      unitPrice: printedTotal,
      lineTotal: printedTotal,
      category: 'Shopping',
      confidence: 96,
      isFlagged: false
    }
  ];

  return {
    retailerName,
    retailerAddress: '',
    invoiceNumber,
    billDate: parseDateHelper(rawText),
    billTime: null,
    printedTotal,
    subtotal: printedTotal,
    taxAmount: 0,
    discountAmount: 0,
    additionalCharges: 0,
    calculatedTotal: printedTotal,
    paymentMethod: 'UPI',
    suggestedCategory: 'Shopping',
    billFormat: 'payment_app',
    columns: PAYMENT_APP_COLUMNS,
    items,
    rawText,
    hasDiscrepancy: false,
    discrepancyNote: '',
    confidenceScore: ocrConfidence
  };
}

function parseElectronicsInvoice(rawText, ocrConfidence = 95) {
  const isRD = /reliance digital|resq/i.test(rawText);
  const isCroma = /croma|infiniti retail/i.test(rawText);
  const retailerName = isRD ? 'Reliance Digital' : isCroma ? 'Croma Electronics' : 'Electronics Store';

  const invMatch = rawText.match(/(?:Invoice|Bill|Doc)\s*(?:No|Number|#)?[:.\s#]*([A-Za-z0-9/-]+)/i);
  const invoiceNumber = invMatch ? invMatch[1].trim() : '';

  const billDate = parseDateHelper(rawText);

  let printedTotal = null;
  const totMatch = rawText.match(/(?:Total Amount Payable|Amount Payable|Total Amount|Grand Total|Net Amount|Total Bill)[₹\s]*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (totMatch) {
    printedTotal = parseFloat(totMatch[1].replace(/,/g, ''));
  }

  const items = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const pMatch = line.match(/^([A-Za-z0-9\s.,&-]+?)\s+(\d+(?:\.\d+)?)\s+[$₹¥€£]?\s*(\d+[.,]\d{1,2})\s+[$₹¥€£]?\s*(\d+[.,]\d{1,2})/);
    if (pMatch) {
      const name = pMatch[1].trim();
      const qty = parseFloat(pMatch[2]);
      const price = parseFloat(pMatch[3].replace(/,/g, ''));
      const total = parseFloat(pMatch[4].replace(/,/g, ''));
      let serialNo = '';
      if (i + 1 < lines.length && /IMEI|Serial|SN|S\/N/i.test(lines[i + 1])) {
        serialNo = lines[i + 1].replace(/^(?:IMEI|Serial|SN|S\/N)[:.\s]*/i, '').trim();
      }
      items.push({
        name,
        serialNo,
        quantity: qty,
        unitPrice: price,
        discount: 0,
        tax: 0,
        lineTotal: total,
        category: 'Shopping',
        confidence: 95,
        isFlagged: false
      });
    }
  }

  if (items.length === 0 && printedTotal > 0) {
    items.push({
      name: `${retailerName} Purchase`,
      serialNo: '',
      quantity: 1,
      unitPrice: printedTotal,
      discount: 0,
      tax: 0,
      lineTotal: printedTotal,
      category: 'Shopping',
      confidence: 92,
      isFlagged: false
    });
  }

  const calculatedTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    retailerName,
    retailerAddress: '',
    invoiceNumber,
    billDate,
    billTime: null,
    printedTotal,
    subtotal: calculatedTotal,
    taxAmount: 0,
    discountAmount: 0,
    additionalCharges: 0,
    calculatedTotal: printedTotal !== null ? printedTotal : calculatedTotal,
    paymentMethod: 'Credit Card',
    suggestedCategory: 'Shopping',
    billFormat: 'electronics',
    columns: ELECTRONICS_COLUMNS,
    items,
    rawText,
    hasDiscrepancy: false,
    discrepancyNote: '',
    confidenceScore: ocrConfidence
  };
}

function parseSupermarketInvoice(rawText, ocrConfidence = 96) {
  const isDMart = /dmart|avenue supermarts/i.test(rawText);
  const isSmartBazaar = /smart bazaar|reliance smart/i.test(rawText);
  const isBigBazaar = /big bazaar/i.test(rawText);
  const isSpencers = /spencer/i.test(rawText);

  let retailerName = isDMart ? 'DMart Supermarket'
    : isSmartBazaar ? 'Smart Bazaar'
    : isBigBazaar ? 'Big Bazaar'
    : isSpencers ? "Spencer's Supermarket"
    : 'Supermarket';

  const invMatch = rawText.match(/(?:Invoice\s*No|Bill\s*No|Cash\s*Memo\s*No|Receipt\s*No)[:.\s#]*([A-Za-z0-9/-]+)/i);
  const invoiceNumber = invMatch ? invMatch[1].trim() : '';

  let retailerAddress = '';
  const addrMatch = rawText.match(/(?:DMART SUPERMARKET|SMART BAZAAR|RELIANCE SMART|AVENUE SUPERMARTS LTD\.?)\s*\n([^\n]+(?:\n[^\n]+)?)/i);
  if (addrMatch) {
    retailerAddress = addrMatch[1].replace(/\n/g, ', ').replace(/\s+/g, ' ').trim();
  }

  const billDate = parseDateHelper(rawText);
  const timeMatch = rawText.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\s*(AM|PM|am|pm)?\b/);
  const billTime = timeMatch ? timeMatch[0].trim() : null;

  let paymentMethod = 'Cash';
  if (/upi|gpay|phonepe|paytm/i.test(rawText)) paymentMethod = 'UPI';
  else if (/credit\s*card|mastercard|visa/i.test(rawText)) paymentMethod = 'Credit Card';
  else if (/debit\s*card/i.test(rawText)) paymentMethod = 'Debit Card';

  let printedTotal = null;
  const totMatch = rawText.match(/(?:Grand Total|Total Amount|Net Amount|Total Payable|Amount Payable)[₹\s:]*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (totMatch) {
    printedTotal = parseFloat(totMatch[1].replace(/,/g, ''));
  }

  let subtotal = 0;
  const subMatch = rawText.match(/(?:Sub Total|Subtotal|Taxable Value|Gross Amount)[₹\s:]*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (subMatch) subtotal = parseFloat(subMatch[1].replace(/,/g, ''));

  let taxAmount = 0;
  const taxMatch = rawText.match(/(?:GST Tax|Total Tax|Tax|GST)[₹\s:]*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (taxMatch) taxAmount = parseFloat(taxMatch[1].replace(/,/g, ''));

  let discountAmount = 0;
  const discMatch = rawText.match(/(?:Total Savings|Total Savings \/ Discount|Discount|Savings|You Saved)[₹\s:]*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (discMatch) discountAmount = parseFloat(discMatch[1].replace(/,/g, ''));

  const items = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  let inItems = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    if (/^(?:item|description|particulars)\s+/i.test(line) && (lower.includes('qty') || lower.includes('price') || lower.includes('total') || lower.includes('rate'))) {
      inItems = true;
      continue;
    }

    if (inItems && (lower.includes('sub total') || lower.includes('grand total') || lower.includes('total savings') || lower.includes('mode of payment') || lower.includes('thank you'))) {
      inItems = false;
      break;
    }

    // Pattern A: <Name> <Qty> <MRP> <Price> <Disc> <Total>
    const p6 = line.match(/^([A-Za-z0-9\s.,&/-]+?)\s+(\d+(?:\.\d+)?)\s+([0-9,]+(?:\.[0-9]{2})?)\s+([0-9,]+(?:\.[0-9]{2})?)\s+([0-9,]+(?:\.[0-9]{2})?)\s+([0-9,]+(?:\.[0-9]{2})?)$/);
    if (p6) {
      const name = p6[1].trim();
      const qty = parseFloat(p6[2]);
      const mrp = parseFloat(p6[3].replace(/,/g, ''));
      const price = parseFloat(p6[4].replace(/,/g, ''));
      const disc = parseFloat(p6[5].replace(/,/g, ''));
      const total = parseFloat(p6[6].replace(/,/g, ''));
      items.push({
        name,
        category: 'Groceries',
        quantity: qty,
        mrp,
        unitPrice: price,
        discount: disc,
        lineTotal: total,
        confidence: 96,
        isFlagged: false
      });
      continue;
    }

    // Pattern B: <Name> <Qty> <Price> <Total>
    const p4 = line.match(/^([A-Za-z0-9\s.,&/-]+?)\s+(\d+(?:\.\d+)?)\s+[$₹]?\s*([0-9,]+(?:\.[0-9]{2})?)\s+[$₹]?\s*([0-9,]+(?:\.[0-9]{2})?)$/);
    if (p4) {
      const name = p4[1].trim();
      const qty = parseFloat(p4[2]);
      const price = parseFloat(p4[3].replace(/,/g, ''));
      const total = parseFloat(p4[4].replace(/,/g, ''));
      if (!/(?:sub\s*total|grand\s*total|total\s*savings|tax)/i.test(name) && name.length >= 2) {
        items.push({
          name,
          category: 'Groceries',
          quantity: qty,
          mrp: price,
          unitPrice: price,
          discount: 0,
          lineTotal: total,
          confidence: 95,
          isFlagged: false
        });
        continue;
      }
    }
  }

  const itemsSum = items.reduce((s, it) => s + it.lineTotal, 0);
  if (subtotal === 0 && items.length > 0) subtotal = Math.round(itemsSum * 100) / 100;
  if (printedTotal === null && items.length > 0) printedTotal = Math.round((subtotal + taxAmount) * 100) / 100;

  let calculatedTotal = printedTotal !== null ? printedTotal : Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;
  if (printedTotal !== null && Math.abs((subtotal + taxAmount) - printedTotal) < 0.05) {
    calculatedTotal = printedTotal;
  }

  return {
    retailerName,
    retailerAddress,
    invoiceNumber,
    billDate,
    billTime,
    printedTotal,
    subtotal: subtotal || itemsSum,
    taxAmount,
    discountAmount,
    additionalCharges: 0,
    calculatedTotal,
    paymentMethod,
    suggestedCategory: 'Groceries',
    billFormat: 'supermarket',
    columns: SUPERMARKET_COLUMNS,
    items,
    rawText,
    hasDiscrepancy: false,
    discrepancyNote: '',
    confidenceScore: ocrConfidence
  };
}

function parseFirstCryInvoice(rawText, ocrConfidence = 98) {
  const storeMatch = rawText.match(/Tax Invoice\s*\n+([^\n]+)/i);
  const retailerName = storeMatch ? `FirstCry (${storeMatch[1].trim()})` : 'FirstCry Store';

  const invMatch = rawText.match(/Invoice No\.\s*:\s*([0-9A-Za-z]+)/i);
  const invoiceNumber = invMatch ? invMatch[1].trim() : '';

  let billDate = new Date();
  const dateMatch = rawText.match(/Date\s*:\s*(\d{2})[-/](\d{2})[-/](\d{4})/i);
  if (dateMatch) {
    billDate = new Date(Date.UTC(parseInt(dateMatch[3], 10), parseInt(dateMatch[2], 10) - 1, parseInt(dateMatch[1], 10), 12, 0, 0));
  }

  const addrMatch = rawText.match(/([0-9]+(?:\s*st|\s*nd|\s*rd|\s*th)?\s*floor[^\n]+)/i);
  const retailerAddress = addrMatch ? addrMatch[1].trim() : '';

  let printedTotal = null;
  const totalMatch = rawText.match(/Amounts[\s\S]*?\n\s*Total\s*₹?\s*([0-9,.]+)/i) ||
                    rawText.match(/\n\s*Total\s*₹\s*([0-9,.]+)/i) ||
                    rawText.match(/Total\s*₹\s*([0-9,.]+)/i);
  if (totalMatch) {
    printedTotal = parseFloat(totalMatch[1].replace(/,/g, ''));
  }

  const subtotalMatch = rawText.match(/Sub Total\s*₹?\s*([0-9,.]+)/i);
  const subtotalVal = subtotalMatch ? parseFloat(subtotalMatch[1].replace(/,/g, '')) : 0;

  const roundOffMatch = rawText.match(/Round off\s*₹?\s*([0-9,.]+)/i);
  const roundOff = roundOffMatch ? parseFloat(roundOffMatch[1].replace(/,/g, '')) : 0;

  const items = [];
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const l of lines) {
    const m = l.match(/^(\d+?)(?:(\d{5,}))(\d+)\s*₹\s*([0-9,.]+)\s*₹\s*([0-9,.]+)\s*\([^)]*\)\s*₹\s*([0-9,.]+)$/);
    if (m) {
      const code = m[2];
      const qty = parseFloat(m[3]) || 1;
      const unitPrice = parseFloat(m[4].replace(/,/g, ''));
      const discount = parseFloat(m[5].replace(/,/g, ''));
      const lineTotal = parseFloat(m[6].replace(/,/g, ''));
      items.push({
        name: `Item #${code}`,
        category: 'Shopping',
        quantity: qty,
        unitPrice,
        discount,
        tax: 0,
        lineTotal,
        confidence: 98,
        isFlagged: false,
      });
    }
  }

  const itemsSum = items.reduce((s, it) => s + it.lineTotal, 0);
  const calculatedTotal = printedTotal !== null ? printedTotal : Math.round((itemsSum + roundOff) * 100) / 100;

  return {
    retailerName,
    retailerAddress,
    invoiceNumber,
    billDate,
    billTime: null,
    printedTotal,
    subtotal: subtotalVal || Math.round(itemsSum * 100) / 100,
    taxAmount: 0,
    discountAmount: Math.round(items.reduce((s, it) => s + it.discount, 0) * 100) / 100,
    additionalCharges: 0,
    roundOff,
    calculatedTotal,
    paymentMethod: 'Cash',
    suggestedCategory: 'Shopping',
    billFormat: 'firstcry',
    columns: FIRSTCRY_COLUMNS,
    items,
    rawText,
    hasDiscrepancy: false,
    discrepancyNote: '',
    confidenceScore: ocrConfidence,
  };
}

function parseSwiggyInvoice(rawText, ocrConfidence = 98) {
  const restMatch = rawText.match(/Restaurant Name:\s*\n*([^\n]+)/i);
  const restaurant = restMatch ? restMatch[1].trim() : 'Restaurant';
  const retailerName = `Swiggy - ${restaurant}`;

  const invMatch = rawText.match(/Invoice No:\s*\n*([^\n]+)/i);
  const invoiceNumber = invMatch ? invMatch[1].trim() : '';

  const orderMatch = rawText.match(/Order ID:\s*\n*([^\n]+)/i);
  const orderId = orderMatch ? orderMatch[1].trim() : '';

  let billDate = new Date();
  const dateMatch = rawText.match(/Date of Invoice:\s*\n*(\d{2})[-/](\d{2})[-/](\d{4})/i);
  if (dateMatch) {
    billDate = new Date(Date.UTC(parseInt(dateMatch[3], 10), parseInt(dateMatch[2], 10) - 1, parseInt(dateMatch[1], 10), 12, 0, 0));
  }

  const addrMatch = rawText.match(/Customer Address:\s*\n*([^\n]+(?:\n[^\n]+)?)/i);
  const retailerAddress = addrMatch ? addrMatch[1].replace(/\n/g, ', ').replace(/\s+/g, ' ').trim() : '';

  let printedTotal = null;
  const totMatch = rawText.match(/Invoice Total\s*([0-9,.]+)/i);
  if (totMatch) {
    printedTotal = parseFloat(totMatch[1].replace(/,/g, ''));
  }

  const taxMatch = rawText.match(/Total taxes\s*([0-9,.]+)/i);
  const taxAmount = taxMatch ? parseFloat(taxMatch[1].replace(/,/g, '')) : 0;

  const subtotalMatch = rawText.match(/Subtotal\s*([0-9,.]+)/i);
  const subtotal = subtotalMatch ? parseFloat(subtotalMatch[1].replace(/,/g, '')) : 0;

  const items = [];
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const l of lines) {
    const m = l.match(/^(\d+)\.\s*(.+?)(?:OTH|NOS|PCS)\s*(\d+)(\d+\.\d{2})\s*(\d+\.\d{2})\s*(\d+\.\d{2})\s*(\d+\.\d{2})$/);
    if (m) {
      const fullQtyPrice = m[3] + m[4];
      const amount = parseFloat(m[5]);
      let qty = 1;
      let unitPrice = parseFloat(m[4]);
      for (let q = 1; q <= 20; q++) {
        const qStr = String(q);
        if (fullQtyPrice.startsWith(qStr)) {
          const candPrice = parseFloat(fullQtyPrice.slice(qStr.length));
          if (Math.abs(q * candPrice - amount) < 0.05 || (amount === 0 && candPrice === 0)) {
            qty = q;
            unitPrice = candPrice;
            break;
          }
        }
      }
      const disc = parseFloat(m[6]);
      const lineTot = parseFloat(m[7]);
      items.push({
        name: m[2].trim(),
        category: 'Food & Dining',
        quantity: qty,
        unitPrice,
        discount: disc,
        tax: 0,
        lineTotal: lineTot,
        confidence: 98,
        isFlagged: false,
      });
    }
  }

  const calculatedTotal = printedTotal !== null ? printedTotal : Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    retailerName,
    retailerAddress,
    invoiceNumber,
    orderId,
    billDate,
    billTime: null,
    printedTotal,
    subtotal: subtotal || items.reduce((s, it) => s + it.lineTotal, 0),
    taxAmount,
    discountAmount: 0,
    additionalCharges: 0,
    calculatedTotal,
    paymentMethod: 'UPI',
    suggestedCategory: 'Food & Dining',
    billFormat: 'swiggy',
    columns: SWIGGY_COLUMNS,
    items,
    rawText,
    hasDiscrepancy: false,
    discrepancyNote: '',
    confidenceScore: ocrConfidence,
  };
}

module.exports = {
  STANDARD_COLUMNS,
  SUPERMARKET_COLUMNS,
  FIRSTCRY_COLUMNS,
  SWIGGY_COLUMNS,
  ECOMMERCE_COLUMNS,
  JEWELRY_COLUMNS,
  TELECOM_COLUMNS,
  PAYMENT_APP_COLUMNS,
  ELECTRONICS_COLUMNS,
  detectBillFormat,
  parseEcommerceInvoice,
  parseJewelryInvoice,
  parseTelecomInvoice,
  parsePaymentAppReceipt,
  parseElectronicsInvoice,
  parseSupermarketInvoice,
  parseFirstCryInvoice,
  parseSwiggyInvoice,
};
