'use client';

import { useEffect, useState, useRef } from 'react';
import QRCode from 'react-qr-code';

interface QRGeneratorProps {
  schoolId: string;
  size?: number;
}

const QRGenerator: React.FC<QRGeneratorProps> = ({
  schoolId,
  size = 400 // Larger size for better distance scanning
}) => {
  const [qrValue, setQrValue] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate a simple QR code value
    const today = new Date().toISOString().split('T')[0];
    const simpleCode = `${schoolId}-${today}`;
    setQrValue(simpleCode);
  }, [schoolId]);

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;

      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Reload to restore original content and avoid issues
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-medium mb-4">Weekly Attendance QR Code</h3>
      <div className="flex flex-col items-center">
        {/* The print area */}
        <div ref={printRef} className="bg-white p-4 rounded-lg shadow">
          <QRCode
            size={size}
            value={qrValue}
            level="H" // High error correction for better distance scanning
            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
          />
        </div>
        <p className="mt-4 text-sm text-gray-600">Valid for a week</p>
        <button
          onClick={handlePrint}
          className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Print QR Code
        </button>
      </div>
    </div>
  );
};

export default QRGenerator;
