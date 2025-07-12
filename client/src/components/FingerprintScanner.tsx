import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Fingerprint } from 'lucide-react';
import Button from './ui/Button';
import { fingerprintService } from '../services/fingerprintService';
import { toast } from 'react-hot-toast';

interface FingerprintScannerProps {
  onSuccess: (employeeId: string) => void;
  onError: (error?: Error) => void;
  onCancel: () => void;
}

const FingerprintScanner: React.FC<FingerprintScannerProps> = ({ onSuccess, onError, onCancel }) => {
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const scanFingerprint = async () => {
      setIsScanning(true);
      try {
        const result = await fingerprintService.verifyFingerprint();
        if (result.verified && result.employeeId) {
          onSuccess(result.employeeId);
        } else {
          throw new Error('Fingerprint not recognized');
        }
      } catch (error) {
        console.error('Fingerprint scan error:', error);
        toast.error((error as Error).message || 'Fingerprint scan failed');
        onError(error as Error);
      } finally {
        setIsScanning(false);
      }
    };

    scanFingerprint();
  }, [onSuccess, onError]);

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6 text-center">
        <Fingerprint size={48} className="mx-auto mb-4 text-gray-500" />
        <h2 className="text-xl font-bold mb-2">Scan Your Fingerprint</h2>
        {isScanning ? (
          <p>Scanning... please hold your finger steady.</p>
        ) : (
          <p>Initializing scanner...</p>
        )}
        <div className="mt-4">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FingerprintScanner;