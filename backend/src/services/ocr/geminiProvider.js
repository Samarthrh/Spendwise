const env = require('../../config/env');
const { suggestCategory } = require('./receiptParser');

/**
 * Gemini Vision OCR Provider (Optional high-precision multimodal receipt understanding)
 */
async function processImageWithGemini(fileBuffer, mimeType) {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in backend environment');
  }

  const base64Data = fileBuffer.toString('base64');
  const prompt = `You are a receipt and financial bill parser. Analyze this receipt/bill image and extract the data in valid JSON only with no markdown formatting.
Schema:
{
  "retailerName": string,
  "retailerAddress": string,
  "invoiceNumber": string,
  "billDate": "YYYY-MM-DD",
  "billTime": "HH:MM",
  "printedTotal": number,
  "subtotal": number,
  "taxAmount": number,
  "discountAmount": number,
  "additionalCharges": number,
  "calculatedTotal": number,
  "paymentMethod": "Cash" | "Credit Card" | "Debit Card" | "UPI" | "Net Banking" | "Other",
  "suggestedCategory": string,
  "items": [
    {
      "name": string,
      "quantity": number,
      "unitPrice": number,
      "discount": number,
      "tax": number,
      "lineTotal": number,
      "category": string,
      "confidence": number,
      "isFlagged": boolean
    }
  ],
  "confidenceScore": number
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType || 'image/jpeg',
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.1,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const result = await response.json();
  const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) {
    throw new Error('Empty response received from Gemini API');
  }

  const parsed = JSON.parse(textContent);
  // Ensure billDate is a Date
  parsed.billDate = parsed.billDate ? new Date(parsed.billDate) : new Date();
  if (isNaN(parsed.billDate.getTime())) parsed.billDate = new Date();

  // Validate items
  if (Array.isArray(parsed.items)) {
    parsed.items = parsed.items.map((item) => ({
      name: item.name || 'Item',
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      discount: Number(item.discount) || 0,
      tax: Number(item.tax) || 0,
      lineTotal: Number(item.lineTotal) || Number(item.unitPrice) || 0,
      category: item.category || suggestCategory(item.name),
      confidence: item.confidence || 95,
      isFlagged: Boolean(item.isFlagged),
    }));
  } else {
    parsed.items = [];
  }

  return parsed;
}

module.exports = {
  processImageWithGemini,
};
