import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { X, Camera, Loader2 } from 'lucide-react';

export default function BarcodeScanner({ isOpen, onClose, onBarcodeDetected }) {
  const videoRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const readerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const startScanner = async () => {
      try {
        setError(null);
        setIsScanning(true);

        const codeReader = new BrowserMultiFormatReader();
        readerRef.current = codeReader;

        const videoInputDevices = await codeReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          setError('No camera found');
          setIsScanning(false);
          return;
        }

        // Prefer back camera on mobile
        const backCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        );
        const selectedDevice = backCamera || videoInputDevices[0];

        await codeReader.decodeFromVideoDevice(
          selectedDevice.deviceId,
          videoRef.current,
          (result, err) => {
            if (result) {
              const barcode = result.getText();
              onBarcodeDetected(barcode);
              stopScanner();
            }
          }
        );

      } catch (err) {
        console.error('Scanner error:', err);
        setError('Failed to start camera. Please allow camera access.');
        setIsScanning(false);
      }
    };

    const stopScanner = () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
      setIsScanning(false);
      onClose();
    };

    startScanner();

    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, [isOpen, onBarcodeDetected, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">Scan Barcode</h3>
            <p className="text-sm text-slate-300">Point camera at product barcode</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Video Preview */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
        />
        
        {/* Scanning Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Scanning Frame */}
            <div className="w-64 h-64 border-4 border-emerald-500 rounded-2xl relative">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-2xl" />
              
              {/* Scanning Line Animation */}
              {isScanning && (
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  <div className="absolute w-full h-1 bg-emerald-400 animate-scan" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="absolute bottom-8 left-0 right-0 px-4">
          {error ? (
            <div className="bg-red-500 text-white px-4 py-3 rounded-xl text-center">
              {error}
            </div>
          ) : isScanning ? (
            <div className="bg-emerald-500 text-white px-4 py-3 rounded-xl text-center flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Scanning for barcode...
            </div>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}