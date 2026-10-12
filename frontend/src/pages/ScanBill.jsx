import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  FileText,
  RotateCw,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ScanLine,
  Image as ImageIcon,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import CameraCapture from '../components/CameraCapture';
import EditableBillForm from '../components/EditableBillForm';
import { useCurrency } from '../context/CurrencyContext';
import api from '../services/api';

const ScanBill = () => {
  const { symbol } = useCurrency();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // States
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('');
  const [error, setError] = useState('');
  const [extractedBill, setExtractedBill] = useState(null);

  // Handle file selection from local device
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    setError('');
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
      setError('Please select a valid image (JPEG, PNG, WEBP) or PDF receipt.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10 MB limit. Please select a smaller receipt.');
      return;
    }

    setSelectedFile(file);
    setRotation(0);
    setExtractedBill(null);

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setPreviewUrl('pdf');
    } else {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCameraCapture = (file) => {
    setIsCameraOpen(false);
    validateAndSetFile(file);
  };

  const rotatePreview = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const resetSelection = () => {
    if (previewUrl && previewUrl !== 'pdf') {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setRotation(0);
    setExtractedBill(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Run OCR Extraction
  const handleProcessBill = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setError('');
    setProcessStep('Uploading bill to secure processing pipeline...');

    try {
      const formData = new FormData();
      formData.append('billFile', selectedFile);

      setProcessStep('Running OCR document recognition...');
      const res = await api.post('/bills/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success && res.data.data) {
        setProcessStep('Parsing store details, line items, and totals...');
        setTimeout(() => {
          setExtractedBill(res.data.data);
          setProcessing(false);
        }, 600);
      } else {
        throw new Error(res.data.message || 'Could not parse bill data');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to process receipt. You can retry with a clearer photo or enter items manually.'
      );
      setProcessing(false);
    }
  };

  // Sample Receipt Fast-Track Helper (e.g. DMart / Reliance Trends)
  const handleLoadSampleReceipt = async (type = 'dmart') => {
    setProcessing(true);
    setError('');
    setProcessStep(`Generating authentic photographed ${type === 'dmart' ? 'DMart' : 'Reliance Trends'} receipt...`);

    try {
      // Create a canvas receipt image on the fly with real receipt text!
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1100;
      const ctx = canvas.getContext('2d');

      // Crisp receipt styling
      ctx.fillStyle = '#fafaf9';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#1c1917';
      ctx.font = 'bold 26px Courier, monospace';
      ctx.textAlign = 'center';

      if (type === 'dmart') {
        ctx.fillText('DMART SUPERMARKET', 400, 70);
        ctx.font = '16px Courier, monospace';
        ctx.fillText('Avenue Supermarts Ltd - Thane West', 400, 105);
        ctx.fillText('Tax Invoice #DM-2026-9814', 400, 135);
        ctx.fillText(`Date: ${new Date().toISOString().split('T')[0]}  Time: 14:32`, 400, 165);
        ctx.fillText('------------------------------------------------', 400, 195);

        ctx.textAlign = 'left';
        ctx.font = '16px Courier, monospace';
        const items = [
          ['Daawat Basmati Rice 5kg', '1', '18.50', '18.50'],
          ['Fortune Sunflower Oil 5L', '1', '22.00', '22.00'],
          ['California Raw Almonds 500g', '2', '14.00', '28.00'],
          ['Surf Excel Matic 3kg', '1', '15.00', '15.00'],
          ['Colgate MaxFresh Twin', '2', '6.00', '12.00'],
        ];

        let y = 230;
        ctx.fillText('ITEM                    QTY   RATE   TOTAL', 70, y);
        y += 30;
        ctx.fillText('------------------------------------------------', 70, y);
        y += 30;

        items.forEach((item) => {
          ctx.fillText(item[0], 70, y);
          ctx.fillText(`${item[1]} x ${item[2]}`, 450, y);
          ctx.fillText(`$${item[3]}`, 650, y);
          y += 40;
        });

        y += 20;
        ctx.fillText('------------------------------------------------', 70, y);
        y += 35;
        ctx.fillText('SUBTOTAL:                                $95.50', 70, y);
        y += 30;
        ctx.fillText('GST / TAX:                                $4.50', 70, y);
        y += 30;
        ctx.fillText('DISCOUNT SAVINGS:                        $10.00', 70, y);
        y += 35;
        ctx.font = 'bold 20px Courier, monospace';
        ctx.fillText('GRAND TOTAL:                            $100.00', 70, y);
        y += 45;
        ctx.font = '16px Courier, monospace';
        ctx.fillText('PAYMENT MODE: UPI', 70, y);
        ctx.fillText('THANK YOU FOR SHOPPING AT DMART!', 400, y + 60);
      } else {
        ctx.fillText('RELIANCE TRENDS', 400, 70);
        ctx.font = '16px Courier, monospace';
        ctx.fillText('Phoenix Marketcity Mall, Ground Floor', 400, 105);
        ctx.fillText('Invoice: RT-884102', 400, 135);
        ctx.fillText(`Date: ${new Date().toISOString().split('T')[0]}`, 400, 165);
        ctx.fillText('------------------------------------------------', 400, 195);

        ctx.textAlign = 'left';
        ctx.font = '16px Courier, monospace';
        let y = 240;
        ctx.fillText('DNMX Slim Cotton Chinos        1  $45.00  $45.00', 70, y);
        y += 40;
        ctx.fillText('Netplay Oxford Formal Shirt    2  $38.00  $76.00', 70, y);
        y += 40;
        ctx.fillText('Performax Running Shoes        1  $85.00  $85.00', 70, y);
        y += 40;
        ctx.fillText('------------------------------------------------', 70, y);
        y += 35;
        ctx.fillText('SUBTOTAL:                               $206.00', 70, y);
        y += 30;
        ctx.fillText('SPECIAL DISCOUNT:                        $40.00', 70, y);
        y += 30;
        ctx.fillText('TAX / GST:                               $10.00', 70, y);
        y += 35;
        ctx.font = 'bold 20px Courier, monospace';
        ctx.fillText('GRAND TOTAL:                            $176.00', 70, y);
        y += 45;
        ctx.font = '16px Courier, monospace';
        ctx.fillText('PAYMENT: Credit Card', 70, y);
      }

      canvas.toBlob(async (blob) => {
        const file = new File([blob], `${type}-receipt-${Date.now()}.png`, { type: 'image/png' });
        validateAndSetFile(file);

        // Upload and process immediately
        const formData = new FormData();
        formData.append('billFile', file);
        setProcessStep('Running OCR extraction on receipt...');

        const res = await api.post('/bills/scan', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data.success && res.data.data) {
          setExtractedBill(res.data.data);
        }
        setProcessing(false);
      }, 'image/png', 0.95);
    } catch (e) {
      console.error('Sample processing failed:', e);
      setError('Could not run sample OCR. Please try uploading an image.');
      setProcessing(false);
    }
  };

  const handleBillConfirmed = (data) => {
    // Successfully confirmed and created transaction
    navigate('/saved-bills', { state: { confirmedBillId: data.bill._id } });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
            <ScanLine className="w-4 h-4" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Smart Bill Scanning
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Scan shopping bills from DMart, Trends, grocery stores, restaurants, or pharmacies. The OCR engine extracts retailer details, line items, and taxes for your review.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center space-x-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* If Bill has been processed, display the Editable Bill Form */}
      {extractedBill ? (
        <EditableBillForm
          key={extractedBill._id || Date.now()}
          initialBill={extractedBill}
          onSaved={handleBillConfirmed}
          onCancel={resetSelection}
        />
      ) : (
        /* Bill Capture / Upload Area */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Upload / Camera Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
            {!selectedFile ? (
              <div className="flex-1 flex flex-col justify-center items-center py-10 px-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 ring-8 ring-emerald-50/50">
                  <ScanLine className="w-8 h-8" />
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  Upload or Capture Your Shopping Bill
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed">
                  Take a photo using your mobile camera or upload an image/PDF. Supported stores include DMart, Reliance Trends, restaurants, grocery shops, and pharmacies.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
                  {/* Camera Option */}
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm flex items-center justify-center space-x-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo with Camera</span>
                  </button>

                  {/* Device File Upload */}
                  <label className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition cursor-pointer flex items-center justify-center space-x-2">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span>Upload Image / PDF</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <p className="text-[11px] text-slate-400 mt-4">
                  Supports JPEG, PNG, WEBP, and PDF up to 10 MB
                </p>
              </div>
            ) : (
              /* Selected Document Preview Mode */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 truncate max-w-xs">
                      {selectedFile.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Ready for OCR analysis
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {previewUrl !== 'pdf' && (
                      <button
                        onClick={rotatePreview}
                        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                        title="Rotate 90 degrees"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={resetSelection}
                      className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition text-xs font-medium flex items-center space-x-1"
                      title="Replace file"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="hidden sm:inline">Replace</span>
                    </button>
                  </div>
                </div>

                {/* Bill Preview Window */}
                <div className="relative bg-slate-900 rounded-xl overflow-hidden min-h-[300px] max-h-[460px] flex items-center justify-center">
                  {previewUrl === 'pdf' ? (
                    <div className="p-10 text-center text-white">
                      <FileText className="w-16 h-16 text-emerald-400 mx-auto mb-3" />
                      <p className="font-semibold text-sm">PDF Digital Bill Ready</p>
                      <p className="text-xs text-slate-400 mt-1">
                        High accuracy text document will be parsed directly.
                      </p>
                    </div>
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Bill Document Preview"
                      style={{ transform: `rotate(${rotation}deg)` }}
                      className="w-full h-auto max-h-[440px] object-contain transition-transform duration-200"
                    />
                  )}

                  {/* Processing Radar Overlay */}
                  {processing && (
                    <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
                      <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-75" />
                        <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
                          <ScanLine className="w-6 h-6 text-white animate-pulse" />
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">Analyzing Document</h4>
                      <p className="text-xs text-emerald-300 font-mono animate-pulse">
                        {processStep}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleProcessBill}
                    disabled={processing}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs md:text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{processing ? 'Processing Receipt...' : 'Extract Bill with Smart OCR'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Tips & One-Click Sample Receipts */}
          <div className="space-y-4">
            {/* Quick Sample Receipts Card */}
            <div className="bg-gradient-to-br from-emerald-50 via-white to-slate-50 rounded-2xl border border-emerald-200/80 p-5 shadow-xs">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm mb-1">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Instant Sample Receipts</span>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Test the OCR extraction workflow immediately using representative shopping receipts:
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => handleLoadSampleReceipt('dmart')}
                  disabled={processing}
                  className="w-full p-3 bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition flex items-center justify-between group shadow-2xs"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">
                      DMart Supermarket Bill
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Rice, Sunflower Oil, Almonds (Total: $100.00)
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => handleLoadSampleReceipt('trends')}
                  disabled={processing}
                  className="w-full p-3 bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition flex items-center justify-between group shadow-2xs"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">
                      Reliance Trends Apparel Bill
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Chinos, Oxford Shirts, Shoes (Total: $176.00)
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* OCR Accuracy Guidelines Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs text-xs text-slate-600 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Tips for Highest OCR Accuracy</span>
              </h4>
              <ul className="space-y-2 list-disc pl-4 text-slate-600 leading-relaxed text-[11px]">
                <li>Place receipt on a dark, flat, non-reflective background.</li>
                <li>Ensure even lighting without heavy shadows or glare.</li>
                <li>Keep the camera parallel to avoid trapezoidal distortion.</li>
                <li>You can always edit any item, price, or tax in the form before saving.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {isCameraOpen && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  );
};

export default ScanBill;
