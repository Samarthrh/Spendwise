import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, AlertTriangle, SwitchCamera } from 'lucide-react';

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (rear) or 'user' (front)
  const [isLoading, setIsLoading] = useState(true);

  const startCamera = async (mode) => {
    setIsLoading(true);
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsLoading(false);
    } catch (err) {
      console.warn('Camera access failed:', err);
      let errorMsg = 'Could not access device camera. Please check permissions or upload an image file instead.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission was denied. Please allow camera access in browser settings or upload a bill image directly.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No camera found on this device. Please upload an image file or PDF bill.';
      }
      setCameraError(errorMsg);
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `bill-camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        setCapturedImage({ file, previewUrl });
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  const retakePhoto = () => {
    if (capturedImage?.previewUrl) {
      URL.revokeObjectURL(capturedImage.previewUrl);
    }
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const confirmPhoto = () => {
    if (capturedImage?.file) {
      onCapture(capturedImage.file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in">
      {/* Top Bar */}
      <div className="w-full max-w-lg flex items-center justify-between text-white z-10">
        <h4 className="font-semibold text-sm flex items-center space-x-2">
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>Scan Shopping Bill</span>
        </h4>
        <div className="flex items-center space-x-2">
          {!capturedImage && !cameraError && (
            <button
              onClick={toggleCameraFacing}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              title="Switch camera"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="relative w-full max-w-lg flex-1 flex items-center justify-center my-4 overflow-hidden rounded-2xl bg-black border border-white/10">
        {cameraError ? (
          <div className="p-6 text-center max-w-sm">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-white text-sm font-medium mb-2">Camera Unavailable</p>
            <p className="text-slate-400 text-xs mb-5 leading-relaxed">{cameraError}</p>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition"
            >
              Upload Bill File Instead
            </button>
          </div>
        ) : capturedImage ? (
          <img
            src={capturedImage.previewUrl}
            alt="Captured Bill Preview"
            className="w-full h-full object-contain rounded-xl"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover rounded-xl"
            />
            {/* Receipt alignment guide box */}
            <div className="absolute inset-x-8 inset-y-12 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-4 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
              <div className="flex justify-between text-[11px] font-semibold text-emerald-300 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs self-center">
                Align Bill Within Frame
              </div>
              <div className="text-center text-[10px] text-white/80 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs self-center">
                Ensure retailer, date & line items are well lit
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-lg flex items-center justify-center space-x-4 py-2 z-10">
        {capturedImage ? (
          <>
            <button
              onClick={retakePhoto}
              className="flex items-center space-x-2 py-3 px-5 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake</span>
            </button>
            <button
              onClick={confirmPhoto}
              className="flex items-center space-x-2 py-3 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition shadow-lg shadow-emerald-600/30"
            >
              <Check className="w-4 h-4" />
              <span>Use This Bill</span>
            </button>
          </>
        ) : !cameraError ? (
          <button
            onClick={takePhoto}
            disabled={isLoading}
            className="w-16 h-16 rounded-full border-4 border-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition flex items-center justify-center shadow-lg shadow-black/50"
            aria-label="Capture Receipt"
          >
            <div className="w-10 h-10 rounded-full bg-white/20" />
          </button>
        ) : null}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
