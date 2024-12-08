'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
  qrboxSize?: number;
  fps?: number;
}

// Define our own error type based on the library's error structure
interface QrScanError {
  name?: string;
  message: string;
}

const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onError,
  qrboxSize = 250,
  fps = 10,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isScanning = useRef<boolean>(false);

  const handleScanSuccess = useCallback((decodedText: string) => {
    if (!isScanning.current) return;
    try {
      onScan(decodedText);
      // Stop scanning after successful scan
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
      // Redirect to home after successful scan
      window.location.href = '/';
    } catch (error) {
      console.error('Error handling scan result:', error);
    }
  }, [onScan]);
  const handleScanFailure = useCallback((errorMessage: string | QrScanError) => {
    // Ignore "NotFoundException" as it's expected when no QR code is in view
    if (typeof errorMessage === 'object' && errorMessage.name === 'NotFoundException') {
      return;
    }

    // For other errors, log them but don't treat them as fatal
    console.debug('Scan failed:', errorMessage);

    // Only call onError for unexpected errors
    if (typeof errorMessage === 'object' && errorMessage.name !== 'NotFoundException') {
      onError?.(new Error(errorMessage.message || 'QR scan failed'));
    }
  }, [onError]);

  const initializeScanner = useCallback(() => {
    if (!scannerRef.current && typeof window !== 'undefined') {
      try {
        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps,
            qrbox: { width: qrboxSize, height: qrboxSize },
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
            aspectRatio: 1.0,
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
          },
          false
        );

        scannerRef.current = scanner;
        isScanning.current = true;

        // The render method returns void, so we need to handle errors differently
        try {
          scanner.render(handleScanSuccess, handleScanFailure);
        } catch (error: unknown) {
          console.error('Failed to render scanner:', error);
          setErrorMessage('Failed to start camera. Please refresh and try again.');
          isScanning.current = false;
        }
      } catch (error: unknown) {
        console.error('Scanner initialization error:', error);
        setErrorMessage('Failed to initialize scanner. Please refresh the page.');
      }
    }
  }, [fps, qrboxSize, handleScanSuccess, handleScanFailure]);

  useEffect(() => {
    const checkAndRequestPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
      } catch (error: unknown) {
        console.error('Camera permission error:', error);
        setHasPermission(false);
        setErrorMessage(
          error instanceof Error && error.name === 'NotAllowedError'
            ? 'Please grant camera access to scan QR codes.'
            : 'Camera access failed. Please check your device settings.'
        );
      }
    };

    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
      checkAndRequestPermission();
    } else {
      setErrorMessage('Your browser doesn\'t support camera access');
    }
  }, []);

  useEffect(() => {
    if (hasPermission === true) {
      initializeScanner();
    }

    return () => {
      isScanning.current = false;
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (error: unknown) {
          console.error('Error cleaning up scanner:', error);
        }
        scannerRef.current = null;
      }
    };
  }, [hasPermission, initializeScanner]);

  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
        <div className="text-gray-600">Requesting camera access...</div>
      </div>
    );
  }

  if (hasPermission === false || errorMessage) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        {errorMessage || "Camera access denied"}
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div id="qr-reader" className="qr-scanner-container" />
      <style jsx>{`
        .qr-scanner-container {
          width: 100%;
          padding: 10px;
        }
        :global(#qr-reader) {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        :global(#qr-reader video) {
          width: 100% !important;
          border-radius: 8px;
          object-fit: cover;
        }
        :global(#qr-reader__scan_region) {
          background: white;
          border-radius: 8px;
        }
        :global(#qr-reader__dashboard) {
          padding: 10px;
          background: white;
          border-radius: 8px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;