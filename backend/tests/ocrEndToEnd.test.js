const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { parseReceiptText } = require('../src/services/ocr/receiptParser');

describe('SpendWise OCR & End-to-End Bill Workflow Verification', () => {
  it('should parse DMart grocery receipt lines with high accuracy', () => {
    const rawDMart = `
      AVENUE SUPERMARTS LTD.
      DMART SUPERMARKET
      Plot 42, Hiranandani Estate, Thane West
      GSTIN: 27AABCA1234F1Z5
      Invoice No: DM-2026-9814
      Date: 12/10/2026 Time: 14:35

      --------------------------------------------------
      ITEM                        QTY    PRICE    TOTAL
      --------------------------------------------------
      Daawat Basmati Rice 5kg       1    18.50    18.50
      Fortune Sunflower Oil 5L      1    22.00    22.00
      Raw California Almonds 500g   2    14.00    28.00
      Surf Excel Detergent 3kg      1    15.00    15.00
      Colgate Toothpaste Twin       2     6.00    12.00

      --------------------------------------------------
      Sub Total:                                  95.50
      GST Tax:                                     4.50
      Total Savings / Discount:                   10.00
      Grand Total:                               100.00
      --------------------------------------------------
      Mode of Payment: UPI
      Thank you for shopping at DMart!
    `;

    const parsed = parseReceiptText(rawDMart, 96);

    assert.strictEqual(parsed.retailerName, 'DMart Supermarket');
    assert.strictEqual(parsed.invoiceNumber, 'DM-2026-9814');
    assert.strictEqual(parsed.paymentMethod, 'UPI');
    assert.strictEqual(parsed.suggestedCategory, 'Groceries');
    assert.strictEqual(parsed.subtotal, 95.50);
    assert.strictEqual(parsed.taxAmount, 4.50);
    assert.strictEqual(parsed.discountAmount, 10.00);
    assert.strictEqual(parsed.calculatedTotal, 100.00);
    assert.strictEqual(parsed.items.length >= 4, true);
    assert.strictEqual(parsed.hasDiscrepancy, false);
  });

  it('should parse Reliance Trends apparel receipt lines correctly', () => {
    const rawTrends = `
      RELIANCE TRENDS
      Phoenix Marketcity Mall
      Invoice No: RT-884102
      Date: 10/10/2026

      DNMX Slim Fit Chinos          1    45.00    45.00
      Netplay Oxford Shirt          2    38.00    76.00
      Performax Running Shoes       1    85.00    85.00

      Sub Total:                                 206.00
      Discount Savings:                           40.00
      GST / Tax:                                  10.00
      Grand Total:                               176.00
      Payment: Credit Card
    `;

    const parsed = parseReceiptText(rawTrends, 94);

    assert.strictEqual(parsed.retailerName, 'Reliance Trends');
    assert.strictEqual(parsed.invoiceNumber, 'RT-884102');
    assert.strictEqual(parsed.paymentMethod, 'Credit Card');
    assert.strictEqual(parsed.suggestedCategory, 'Shopping');
    assert.strictEqual(parsed.subtotal, 206.00);
    assert.strictEqual(parsed.discountAmount, 40.00);
    assert.strictEqual(parsed.calculatedTotal, 176.00);
    assert.strictEqual(parsed.hasDiscrepancy, false);
  });

  it('should parse real restaurant thermal bill (Shreeji Restaurant) with itemized lines and zero discrepancy', () => {
    const rawRestaurant = `
      Shreeji Restuarant
      1st Floor Patidar Complex
      Bhaktinandan Circle 80 Feet Road
      Surendranagar Mo:9664747568
      Name:
      Date: 16/08/26  Dine In: 19
      14:39
      Cashier: ak     Bill No.: 13485
      Token No.: 97
      Item              Qty.  Price  Amount
      Punjabi Fix Thali   2   210.00 420.00
      (Monday To
      Saturday)
      Mineral Water       1    20.00  20.00
      Total Qty: 3    Sub Total      440.00
      Grand Total ₹ 440.00
      Thanks
    `;

    const parsed = parseReceiptText(rawRestaurant, 92);

    assert.strictEqual(parsed.retailerName, 'Shreeji Restaurant');
    assert.strictEqual(parsed.invoiceNumber, '13485');
    assert.strictEqual(parsed.paymentMethod, 'Cash');
    assert.strictEqual(parsed.suggestedCategory, 'Food & Dining');
    assert.strictEqual(parsed.subtotal, 440.00);
    assert.strictEqual(parsed.printedTotal, 440.00);
    assert.strictEqual(parsed.calculatedTotal, 440.00);
    assert.strictEqual(parsed.items.length, 2);
    assert.strictEqual(parsed.items[0].name.includes('Punjabi Fix Thali'), true);
    assert.strictEqual(parsed.items[0].quantity, 2);
    assert.strictEqual(parsed.items[0].unitPrice, 210.00);
    assert.strictEqual(parsed.items[0].lineTotal, 420.00);
    assert.strictEqual(parsed.items[1].name.includes('Mineral Water'), true);
    assert.strictEqual(parsed.items[1].quantity, 1);
    assert.strictEqual(parsed.items[1].unitPrice, 20.00);
    assert.strictEqual(parsed.items[1].lineTotal, 20.00);
    assert.strictEqual(parsed.hasDiscrepancy, false);
  });

  it('should parse real retail two-line POS bill (BF Mall) with 7 items and zero discrepancy', () => {
    const rawBFMall = `
      TAX INVOICE
      BF MALL
      SURENDRANAGAR: 364002
      GST No: 24HQJPK1607M1ZM
      Bill No: SR/1482/26-27 Date: 06-09-2026
      ITEM NAME   BarCode  HSN-GST
      Qty RATE DISC NET AMOUNT
      NEW BORN POOOZ1178 0111-10%
      1.00 3800.00 570.00 3230.00
      SOFT TOYS P0006380 95030010-18%
      1.00 900.00 135.00 765.00
      SOFT TOYS P00063990 95030010-18%
      1.00 520.00 0.00 520.00
      BABY TOWEL P0005511 61112000-5%
      1.00 250.00 125.00 125.00
      VIDHTA BOOK P00071321 49011010-5%
      1.00 360.00 54.00 306.00
      NEW BORN P00080111 6111-5%
      1.00 699.00 0.00 699.00
      BABY DOHAR P00095101 95030010-12%
      1.00 1100.00 136.00 964.00
      TOTAL QTY: 7.00 AMT.TOTAL: 6609.00
      PAYMENT SUMMARY
      Net Amount : 6609.00
    `;

    const parsed = parseReceiptText(rawBFMall, 95);

    assert.strictEqual(parsed.retailerName, 'BF MALL');
    assert.strictEqual(parsed.invoiceNumber, 'SR/1482/26-27');
    assert.strictEqual(parsed.printedTotal, 6609.00);
    assert.strictEqual(parsed.calculatedTotal, 6609.00);
    assert.strictEqual(parsed.items.length, 7);
    assert.strictEqual(parsed.hasDiscrepancy, false);
    assert.strictEqual(parsed.items[0].name.includes('NEW BORN'), true);
    assert.strictEqual(parsed.items[0].lineTotal, 3230.00);
    assert.strictEqual(parsed.items[1].name.includes('SOFT TOYS'), true);
    assert.strictEqual(parsed.items[1].lineTotal, 765.00);
    assert.strictEqual(parsed.items[2].name.includes('SOFT TOYS'), true);
    assert.strictEqual(parsed.items[2].lineTotal, 520.00);
    assert.strictEqual(parsed.items[3].name.includes('BABY TOWEL'), true);
    assert.strictEqual(parsed.items[3].lineTotal, 125.00);
    assert.strictEqual(parsed.items[4].name.includes('VIDHTA BOOK'), true);
    assert.strictEqual(parsed.items[4].lineTotal, 306.00);
    assert.strictEqual(parsed.items[5].name.includes('NEW BORN'), true);
    assert.strictEqual(parsed.items[5].lineTotal, 699.00);
    assert.strictEqual(parsed.items[6].name.includes('BABY DOHAR'), true);
    assert.strictEqual(parsed.items[6].lineTotal, 964.00);
  });

  it('should parse restaurant bill with Neat Amount and reject tax/summary lines from line items', () => {
    const rawDevRestaurant = `
      DEV RESTAURANT
      Table No. 14 Invoice No. R-4977
      09-08-2026 01:34 PM
      rc Lon Qby Rate Amount
      CI TER MILK Po 490.00
      DAL TADKA 290.00 290.00
      fF KAU CURRY 2 650.00 1300.00
      TANDORI BUTTER ROTI 7 30.00 210.00
      MINERAL WATER 2 19.00 38.00
      DAL BATI 2 490.00 980.00
      JEERARICE 1 280.00 280.00
      Iesmis: 7
      Gross Mnount 3588.00
      SUS fin ati 89.70
      SCST ip 2h 89.70
      PER Rbund Oey -0.40
      Neat Amount 2 3767.00
      Think ru Visit Again
    `;

    const parsed = parseReceiptText(rawDevRestaurant, 90);

    assert.strictEqual(parsed.retailerName, 'Dev Restaurant');
    assert.strictEqual(parsed.invoiceNumber, 'R-4977');
    assert.strictEqual(parsed.printedTotal, 3767.00);
    assert.strictEqual(parsed.calculatedTotal, 3767.00);
    assert.strictEqual(parsed.hasDiscrepancy, false);
    // Crucial check: summary lines like Neat Amount, SUS fin ati, SCST must NOT be items
    assert.strictEqual(parsed.items.some(i => /neat\s*amount/i.test(i.name)), false);
    assert.strictEqual(parsed.items.some(i => /scst/i.test(i.name)), false);
    assert.strictEqual(parsed.items.some(i => /sus\s*fin/i.test(i.name)), false);
    assert.strictEqual(parsed.items.some(i => /iesmis/i.test(i.name)), false);
  });

  it('should parse Shreeji receipt with OCR noise (Gr nd T Total, Total Oty) and match exact 2 items and 440 total', () => {
    const rawShreejiNoisy = `
      . Shreeji Restuarant p
      ’ Lst Floor Patidar «sm lex
      | Bhaktinandan Circle ou Feet Road
      ; Surendranagar Me: 9664747568
      | Name: |
      CTE
      Date: 16/08/26 Dine In: 19
      14:39
      Casnier: ak Bill No.: 13485
      Token No.: 97
      [tem Qty. Price Amount
      Punjabi Fix Thali 2 210.00 420.00
      (Monday To |
      Saturday)
      Mineral Water 1 20.00 20.00
      y i - : = : A - >
      Total Oty: des SUL Togs iL
      Te Gr nd T Total 440.00
      a Ar E_Man ks
    `;

    const parsed = parseReceiptText(rawShreejiNoisy, 65);

    assert.strictEqual(parsed.retailerName, 'Shreeji Restaurant');
    assert.strictEqual(parsed.invoiceNumber, '13485');
    assert.strictEqual(parsed.printedTotal, 440.00);
    assert.strictEqual(parsed.subtotal, 440.00);
    assert.strictEqual(parsed.calculatedTotal, 440.00);
    assert.strictEqual(parsed.hasDiscrepancy, false);
    // Crucial: Exact 2 food items, Gr nd T Total is NOT an item
    assert.strictEqual(parsed.items.length, 2);
    assert.strictEqual(parsed.items[0].name.includes('Punjabi Fix Thali'), true);
    assert.strictEqual(parsed.items[0].quantity, 2);
    assert.strictEqual(parsed.items[0].lineTotal, 420.00);
    assert.strictEqual(parsed.items[1].name.includes('Mineral Water'), true);
    assert.strictEqual(parsed.items[1].quantity, 1);
    assert.strictEqual(parsed.items[1].lineTotal, 20.00);
    assert.strictEqual(parsed.items.some(i => /total|gr\s*nd/i.test(i.name)), false);
  });

  it('should parse Dosa Hub thermal bill with taxes, correct items count, and zero discrepancy', () => {
    const rawDosaHub = `
      CR ER. be"
      .
      1
      h
      a
      Dosa Hub (Surendranagar) :
      Shop no 2, 3 Rockwood complex 3
      3 Upasang circle Surendranagar
      630 30Moly No :- 8320087051 GSI1IN
      - = 291A0PP1634K129
      Date: 22/09/26 pine In: 1
      21:16 |
      Cashier: bile Bill No.: 8272 a
      Itein -
      : Qty. Piice Amount *
      © Gotala Dosa 1 266.67 266.67 8
      MASALA OSA I 123.81 123.81 =
      Masala Chaas 1 38.10 38.10 H
      MINERAL WATER 20.00 20.00
      Total Qy: 4 Tota 448-58 :
      Re a.5% 10.71 §
      SIN2.5% 10.71
      e Grand Total ¥470.00
      Thanks visit again §
      we Accept Party Ord. |
    `;

    const parsed = parseReceiptText(rawDosaHub, 90);

    assert.strictEqual(parsed.retailerName, 'Dosa Hub');
    assert.strictEqual(parsed.invoiceNumber, '8272');
    assert.strictEqual(parsed.billTime, '21:16');
    assert.strictEqual(parsed.billDate.toISOString().startsWith('2026-09-22'), true);
    assert.strictEqual(parsed.subtotal, 448.58);
    assert.strictEqual(parsed.taxAmount, 21.42);
    assert.strictEqual(parsed.printedTotal, 470.00);
    assert.strictEqual(parsed.calculatedTotal, 470.00);
    assert.strictEqual(parsed.hasDiscrepancy, false);
    assert.strictEqual(parsed.suggestedCategory, 'Food & Dining');
    assert.strictEqual(parsed.items.length, 4);
    assert.strictEqual(parsed.items[0].name, 'Gotala Dosa');
    assert.strictEqual(parsed.items[0].lineTotal, 266.67);
    assert.strictEqual(parsed.items[1].name, 'MASALA DOSA');
    assert.strictEqual(parsed.items[1].lineTotal, 123.81);
    assert.strictEqual(parsed.items[2].name, 'Masala Chaas');
    assert.strictEqual(parsed.items[2].lineTotal, 38.10);
    assert.strictEqual(parsed.items[3].name, 'MINERAL WATER');
    assert.strictEqual(parsed.items[3].lineTotal, 20.00);
  });

  it('should parse real Flipkart PDF tax invoice with dynamic ecommerce columns and zero discrepancy', () => {
    const rawFlipkart = `
      Ship To SANDIP KHERALI RODE Surendranagar 363020 Gujarat
      Order ID: OD126295104357151000
      18-10-2022Order Date:
      18-10-2022Invoice Date:
      Invoice Number # FAJ0WW2300097336
      Tax Invoice
      Sold By: MPS Telecom Retail Private Limited,
      ProductTitleQtyGross
      Amount ₹
      Discounts
      /Coupons ₹
      Taxable
      Value ₹
      CGST ₹
      SGST /UTGST ₹
      Total ₹
      HSN/SAC: 85176290
      realme Buds Air 3 with Fast Charge & Active Noise Cancellation (ANC) Bluetooth Headset
      13999.000.003388.98305.01305.013999.00
      Shipping And Handling Charges145.00-40.004.240.380.385.00
      Total14044.00-40.003393.22305.39305.394004.00
      Grand Total₹ 4004.00
      Contact Flipkart: 1800 208 9898 || www.flipkart.com/helpcentre
    `;

    const parsed = parseReceiptText(rawFlipkart, 98);

    assert.strictEqual(parsed.retailerName.includes('Flipkart'), true);
    assert.strictEqual(parsed.invoiceNumber, 'FAJ0WW2300097336');
    assert.strictEqual(parsed.billFormat, 'ecommerce');
    assert.strictEqual(parsed.columns.length, 9);
    assert.strictEqual(parsed.printedTotal, 4004.00);
    assert.strictEqual(parsed.calculatedTotal, 4004.00);
    assert.strictEqual(parsed.hasDiscrepancy, false);
    assert.strictEqual(parsed.items.length, 2);
    assert.strictEqual(parsed.items[0].name.includes('realme Buds Air 3'), true);
    assert.strictEqual(parsed.items[0].lineTotal, 3999.00);
    assert.strictEqual(parsed.items[0].hsn, '85176290');
    assert.strictEqual(parsed.items[1].name.includes('Shipping And Handling'), true);
    assert.strictEqual(parsed.items[1].lineTotal, 5.00);
  });

  it('should parse real Tanishq jewelry tax invoice with dynamic jewelry columns and zero discrepancy', () => {
    const rawTanishq = `
      CUSTOMER COPY
      TAX INVOICE
      Date : 01/09/2026 7:04 pmDOC/I/RJK/865
      TITAN COMPANY LIMITED
      Ground Floor, 5-6, Wings Business Bay, Rajkot
      GSTIN : 24AAACT5131A1Z3
      Standard Rate of 24 Karat Gold Rs: 15594.42
      50D5H2FFRLAA02
      FINGER RING 750
      G*- 18Karat
      71131930
      1N 1.394
      0.111 0.022
      1.372 39145.85 7,115.003196.82 539.24 539.2437027.51
      513218FLTCAA00
      FINGER RING 916
      G*- 22Karat
      71131910
      1N 1.322
      0.000 0.000
      1.322 23150.04 4,252.05133.52 345.25 345.2523707.02
      Total Amount to be paid60,735.00
    `;

    const parsed = parseReceiptText(rawTanishq, 98);

    assert.strictEqual(parsed.retailerName.includes('Tanishq'), true);
    assert.strictEqual(parsed.invoiceNumber, 'DOC/I/RJK/865');
    assert.strictEqual(parsed.billFormat, 'jewelry');
    assert.strictEqual(parsed.columns.length, 12);
    assert.strictEqual(parsed.printedTotal, 60735.00);
    assert.strictEqual(parsed.calculatedTotal, 60735.00);
    assert.strictEqual(parsed.hasDiscrepancy, false);
    assert.strictEqual(parsed.items.length, 2);
    assert.strictEqual(parsed.items[0].name.includes('FINGER RING 750'), true);
    assert.strictEqual(parsed.items[0].purity.includes('18Karat'), true);
    assert.strictEqual(parsed.items[0].lineTotal, 37027.51);
    assert.strictEqual(parsed.items[1].name.includes('FINGER RING 916'), true);
    assert.strictEqual(parsed.items[1].purity.includes('22Karat'), true);
    assert.strictEqual(parsed.items[1].lineTotal, 23707.02);
  });

  it('should parse real Swiggy food delivery invoice with dishes and taxes', () => {
    const rawSwiggy = `
      TaxesRate
      IGST0%0.00
      CGST2.5%10.30
      SGST/UTGST2.5%10.30
      Total taxes20.60
      Invoice Total432.60
      TAX INVOICE
      Invoice issued by Swiggy Limited on behalf of:
      Restaurant Name:
      The Chocolate Room
      Order ID:
      250708800190783
      Invoice No:
      0168634101100013
      Date of Invoice:
      11-10-2026
      1.Veg Momos [6 Pieces]OTH2206.00412.000.00412.00
      2.Order Packing ChargesOTH10.000.000.000.00
      Subtotal412.00
    `;

    const parsed = parseReceiptText(rawSwiggy, 98);

    assert.strictEqual(parsed.retailerName.includes('The Chocolate Room'), true);
    assert.strictEqual(parsed.invoiceNumber, '0168634101100013');
    assert.strictEqual(parsed.billFormat, 'swiggy');
    assert.strictEqual(parsed.subtotal, 412.00);
    assert.strictEqual(parsed.taxAmount, 20.60);
    assert.strictEqual(parsed.printedTotal, 432.60);
    assert.strictEqual(parsed.calculatedTotal, 432.60);
    assert.strictEqual(parsed.items.length, 2);
    assert.strictEqual(parsed.items[0].name, 'Veg Momos [6 Pieces]');
    assert.strictEqual(parsed.items[0].quantity, 2);
    assert.strictEqual(parsed.items[0].unitPrice, 206.00);
    assert.strictEqual(parsed.items[0].lineTotal, 412.00);
  });

  it('should parse real FirstCry invoice with 46 items and roundoff', () => {
    const rawFirstCry = `
      Tax Invoice
      Harikrushna Enterprise
      1 st floor 106 mega mall -2 bus station road surendranagar
      GSTIN: 24ETNPB5108L1ZM
      Invoice Details
      Invoice No. : 1634
      Date : 06-09-2026
      112176551₹ 225.00₹ 81.00 (36%)₹ 144.00
      212059581₹ 189.00₹ 45.36 (24%)₹ 143.64
      Total46₹ 7650.27₹ 30699.73
      Amounts
      Sub Total₹ 30699.73
      Round off₹ 0.27
      Total₹ 30700.00
    `;

    const parsed = parseReceiptText(rawFirstCry, 98);

    assert.strictEqual(parsed.retailerName.includes('FirstCry'), true);
    assert.strictEqual(parsed.invoiceNumber, '1634');
    assert.strictEqual(parsed.billFormat, 'firstcry');
    assert.strictEqual(parsed.printedTotal, 30700.00);
    assert.strictEqual(parsed.calculatedTotal, 30700.00);
    assert.strictEqual(parsed.items.length, 2);
    assert.strictEqual(parsed.items[0].name, 'Item #1217655');
    assert.strictEqual(parsed.items[0].unitPrice, 225.00);
    assert.strictEqual(parsed.items[0].lineTotal, 144.00);
  });

  it('should parse real Amazon invoice with HSN, IGST and zero discrepancy', () => {
    const rawAmazon = `
      Tax Invoice/Bill of Supply/Cash Memo
      Sold By : PULKIT BHATIA
      Order Number:406-4126079-4502721
      Invoice Number :BOM5-4081
      Invoice Date :25.12.2023
      1
      TRUE HUMAN Emperor Anti-Theft Backpack
      HSN:42022990
      ₹550.00₹0.001₹550.0018%
      IGST
      ₹99.00₹649.00
      TOTAL:
      ₹99.00₹649.00
    `;

    const parsed = parseReceiptText(rawAmazon, 98);

    assert.strictEqual(parsed.retailerName.includes('Amazon'), true);
    assert.strictEqual(parsed.invoiceNumber, 'BOM5-4081');
    assert.strictEqual(parsed.billFormat, 'ecommerce');
    assert.strictEqual(parsed.printedTotal, 649.00);
    assert.strictEqual(parsed.calculatedTotal, 649.00);
    assert.strictEqual(parsed.items.length >= 1, true);
    assert.strictEqual(parsed.items[0].name.includes('TRUE HUMAN'), true);
    assert.strictEqual(parsed.items[0].hsn, '42022990');
    assert.strictEqual(parsed.items[0].tax, 99.00);
    assert.strictEqual(parsed.items[0].lineTotal, 649.00);
  });
});


