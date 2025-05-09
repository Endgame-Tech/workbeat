import React, { useState, useEffect, useRef } from 'react';
import { scanQRCode } from '../utils/qrCodeUtils';
import { Card, CardContent, CardFooter } from './ui/Card';
import Button from './ui/Button';
import { ScanLine, QrCode, Camera, X } from 'lucide-react';

interface QRScannerProps {
  onScanComplete: (qrValue: string) => void;
  onCancel: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanComplete, onCancel }) => {
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Request camera permission and set up video stream
  const setupCamera = async () => {
    try {
      setCameraPermission('pending');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile devices
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraPermission('granted');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError(true);
      setCameraPermission('denied');
    }
  };

  // Clean up video stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Start scanning process
  const startScanning = async () => {
    setScanning(true);
    
    // Set up camera if not already done
    if (!streamRef.current) {
      await setupCamera();
    }
    
    // Start scanning interval
    if (videoRef.current && cameraPermission === 'granted') {
      // Attempt to scan QR code every 500ms
      intervalRef.current = window.setInterval(async () => {
        try {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const qrValue = await scanQRCode(videoRef.current);
            
            // QR code detected
            if (qrValue) {
              clearInterval(intervalRef.current as number);
              setScanComplete(true);
              onScanComplete(qrValue);
            }
          }
        } catch (error) {
          console.error('Error scanning QR code:', error);
        }
      }, 500);
    }
  };
  
  // Stop scanning and clean up
  const stopScanning = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setScanning(false);
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">QR Code Scanner</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {scanning 
              ? 'Scanning QR code...' 
              : 'Scan the QR code at your workplace entrance'}
          </p>
        </div>

        <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center mb-4">
          {cameraPermission === 'denied' ? (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <X size={40} className="text-red-500 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Camera permission denied
              </p>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={setupCamera}
              >
                Request Permission
              </Button>
            </div>
          ) : scanning ? (
            <>
              <video 
                ref={videoRef} 
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
              />
              <div className="absolute w-full h-0.5 bg-blue-500 animate-scan-line"></div>
              <div className="absolute inset-0 border-2 border-blue-500 opacity-50"></div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <QrCode size={80} className="text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {scanComplete ? 'QR code detected!' : 'Ready to scan'}
              </p>
            </div>
          )}
        </div>
        
        {cameraError && !scanning && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              Unable to access camera. Make sure you've granted permission or try using a different device.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between p-4 border-t border-gray-200 dark:border-gray-700">
        <Button 
          variant="ghost" 
          onClick={() => {
            stopScanning();
            onCancel();
          }}
        >
          Cancel
        </Button>
        
        <Button 
          variant="primary"
          onClick={startScanning}
          isLoading={scanning && !scanComplete}
          disabled={scanning || scanComplete}
          leftIcon={scanning ? <ScanLine size={18} /> : <Camera size={18} />}
        >
          {scanning ? 'Scanning...' : 'Start Scanning'}
        </Button>
      </CardFooter>
      
      {/* Add scan line animation */}
      <style jsx global>{`
        @keyframes scan {
          0% {
            top: 0;
          }
          50% {
            top: 100%;
          }
          100% {
            top: 0;
          }
        }
        .animate-scan-line {
          animation: scan 2s linear infinite;
          position: absolute;
        }
      `}</style>
    </Card>
  );
};

export default QRScanner;