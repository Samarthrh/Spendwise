# SpendWise — Personal Finance & Smart Bill Scanning Application

SpendWise is a personal finance and expense management web application featuring **Smart Bill Scanning (OCR)**. It enables users to track daily expenses, manage category-specific budgets, monitor spending trends, and scan physical retail receipts (e.g., from DMart, Reliance Trends, restaurants, supermarkets, pharmacies) using their device camera or by uploading image/PDF bills. The extracted document information is normalized into an interactive, fully editable form before saving to the database and automatically recording linked expense transactions.

---

## Key Features

### 1. Smart Bill Scanning (Core Differentiating Feature)
- **Multi-Source Bill Input**:
  - Direct camera capture on mobile (automatically requesting rear-facing `environment` camera) and laptops/desktops.
  - Device image upload (JPEG, PNG, WEBP).
  - Digital PDF receipt parsing (`pdf-parse`).
  - Pre-processing controls: rotate, replace, or retake photos.
- **Intelligent Information Extraction**:
  - Retailer and store name identification (with specialized models for popular chains like DMart, Reliance Trends, Walmart, Target, Starbucks, Apollo Pharmacy).
  - Store address and tax/invoice number detection.
  - Bill date and time parsing.
  - Multi-line item recognition with quantities, unit prices, discounts, and line totals.
  - Taxes (GST / VAT / Sales Tax), promotional discounts, and payment methods (Cash, UPI, Credit Card, Debit Card).
  - Total discrepancy detection: Flags discrepancies if the printed bill total differs from calculated items + taxes.
  - Confidence scoring and visual highlighting of uncertain fields requiring user verification.
- **Fully Editable Review Form**:
  - Responsive table layout on desktop and card layout on mobile.
  - Real-time recalculation of line totals, subtotal, and grand total as quantities and prices are modified.
  - Duplicate-save protection: Prevents duplicate expenses if a bill is reviewed or confirmed again.
  - Instant synchronization with dashboard statistics and category totals.

### 2. Financial Dashboard
- **Real-Time Database Calculations**: No hardcoded statistics.
- Monthly total expenses and income.
- Remaining monthly budget and visual progress bar.
- Net balance / savings surplus or deficit.
- 6-month historical cash flow trend chart (Area Chart via Recharts).
- Category spending distribution (Donut chart).
- Recent transactions list with Smart Bill tags.
- Quick actions: *Scan Bill*, *New Expense*, *Add Income*, *View Reports*.

### 3. Expense & Income Ledger
- Add, edit, filter, search, and delete transactions.
- Filter by transaction type (Income/Expense), category, payment method, and date range.
- Sort by date or amount (ascending/descending).
- Instant CSV export of transactions.
- Recurring transaction options (weekly, monthly, yearly).

### 4. Dynamic Budgeting & Threshold Alerts
- Set monthly overall spending cap.
- Category-specific budget limits (e.g. Groceries, Shopping, Dining).
- Live utilization progress bars.
- Real-time in-app warnings when spending approaches (≥ 80%) or exceeds (≥ 100%) limits.

### 5. Financial Analytics & Reports
- Category expense ranking bar charts.
- 30-day daily spending trajectory lines.
- Payment method breakdown (Cash, UPI, Credit Card, Debit Card, Net Banking).
- Configurable time ranges: *This Week*, *This Month*, *This Year*, *All Time*.

### 6. Demo Mode & Sample Data
- One-click **"Instant Demo Login"** button on the sign-in page.
- One-click **"Load Sample Financial Data"** tool that seeds authentic DMart grocery receipts, Reliance Trends apparel bills, multi-month income and expenses, and budgets.
- "Reset All Records" button for starting completely fresh.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v7, Recharts, Lucide React, Axios |
| **Backend** | Node.js, Express.js, JWT, bcryptjs, Multer, Morgan, dotenv |
| **Database** | MongoDB with Mongoose ODM (includes embedded `mongodb-memory-server` fallback for zero-setup execution) |
| **OCR Engines** | Pure JavaScript/WASM Tesseract.js (offline, zero external API keys) + PDF Parser + optional Google Gemini Vision Multimodal API |

---

## Project Structure

```text
spendwise/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # MongoDB connection & embedded fallback
│   │   │   └── env.js                # Environment variables configuration
│   │   ├── controllers/
│   │   │   ├── authController.js     # User registration, login, profile, password
│   │   │   ├── billController.js     # Bill upload, OCR parsing, confirmation, review
│   │   │   ├── budgetController.js   # Overall and category budget calculations
│   │   │   ├── categoryController.js # Category management
│   │   │   ├── demoController.js     # Demo data seeding & database reset
│   │   │   ├── reportController.js   # Real-time dashboard summaries & analytics
│   │   │   └── transactionController.js # Transaction CRUD, filtering, CSV export
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT bearer verification
│   │   │   ├── errorHandler.js       # Centralized error handling
│   │   │   └── upload.js             # Multer file upload (images & PDFs)
│   │   ├── models/
│   │   │   ├── Bill.js               # Scanned bill schema with line items
│   │   │   ├── Budget.js             # Monthly budget schema
│   │   │   ├── Category.js           # Category taxonomies
│   │   │   ├── Transaction.js        # Financial transaction schema
│   │   │   └── User.js               # User authentication & preferences
│   │   ├── routes/                   # Express REST endpoints
│   │   ├── services/ocr/
│   │   │   ├── geminiProvider.js     # Cloud multimodal vision provider (optional)
│   │   │   ├── ocrService.js         # Unified OCR orchestrator
│   │   │   ├── pdfHandler.js         # PDF text receipt extraction
│   │   │   ├── receiptParser.js      # Line items, retailer, taxes, & math validation
│   │   │   └── tesseractProvider.js  # Local offline Tesseract.js OCR engine
│   │   └── server.js                 # Express server bootstrap
│   ├── tests/                        # Automated test suites
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddTransactionModal.jsx
│   │   │   ├── BottomNav.jsx         # Mobile navigation bar
│   │   │   ├── CameraCapture.jsx     # Device camera modal with framing guide
│   │   │   ├── EditableBillForm.jsx  # Interactive bill review & item editor
│   │   │   ├── Modal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx           # Desktop navigation sidebar
│   │   │   └── StatCard.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # User state & authentication
│   │   │   └── CurrencyContext.jsx   # Currency formatting & symbols
│   │   ├── pages/
│   │   │   ├── Budgets.jsx
│   │   │   ├── Categories.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ProfileSettings.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── SavedBills.jsx
│   │   │   ├── ScanBill.jsx
│   │   │   └── Transactions.jsx
│   │   ├── services/api.js           # Axios API client with interceptors
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: (Optional) A local MongoDB daemon running on `mongodb://127.0.0.1:27017/spendwise` or MongoDB Atlas. If none is detected, SpendWise automatically starts an embedded in-memory MongoDB instance for a seamless zero-configuration experience.

### 1. Installation

Clone or open the repository:
```bash
cd spendwise
```

Install backend dependencies:
```bash
cd backend
npm install
```

Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### 2. Environment Configuration

In `backend/`, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default `.env` values:
```ini
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/spendwise
JWT_SECRET=spendwise_super_secret_jwt_key_2026_finance_secure
JWT_EXPIRES_IN=7d

# OCR Provider: 'tesseract' (default, offline, zero-key) or 'gemini' (multimodal cloud vision)
OCR_PROVIDER=tesseract

# Optional: Gemini API Key if OCR_PROVIDER=gemini
GEMINI_API_KEY=
```

### 3. Running the Application

Open two terminal windows:

**Terminal 1 — Backend API Server (Port 5001):**
```bash
cd backend
npm run dev
# or
node src/server.js
```

**Terminal 2 — Frontend Application (Port 3000):**
```bash
cd frontend
npm run dev
```

Open your browser at **http://localhost:3000**.

---

## Testing & Quality Assurance

SpendWise includes automated test suites covering financial math integrity, line item calculations, receipt parsing accuracy, and discrepancy detection.

Run the test suite:
```bash
cd backend
npm test
```

Test coverage includes:
- Floating-point financial precision and line item rounding: `(qty * unitPrice) - discount + tax`.
- Receipt parser regex matching for DMart supermarket and Reliance Trends bills.
- Auto-categorization using keyword token matching.
- Discrepancy detection between printed receipt totals and calculated sums.
- Budget utilization threshold warnings (>80%, >100%).

---

## Deployment Instructions

### Production Frontend Build
```bash
cd frontend
npm run build
```
This generates the optimized static distribution in `frontend/dist/`.

### Hosting Options
- **Frontend**: Deploy `frontend/dist` to Vercel, Netlify, Cloudflare Pages, or serve directly via Express.
- **Backend**: Deploy `backend/` to Railway, Render, AWS Elastic Beanstalk, or Google Cloud Run. Set `NODE_ENV=production`, `PORT=5001`, `MONGODB_URI=<Your MongoDB Atlas Connection String>`, and `JWT_SECRET=<Strong Random Secret>`.
