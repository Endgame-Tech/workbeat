import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { QrCode, RefreshCw, Clock, Download, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react'; // Import the SVG version from qrcode.react
import { qrCodeService } from '../services/qrCodeService';
import { formatDate } from '../utils/attendanceUtils';

interface QRGeneratorProps {
  onGenerate?: (qrValue: string, expiresAt: string, location: string) => void;
}

const QRGenerator: React.FC<QRGeneratorProps> = ({ onGenerate }) => {
  const [location, setLocation] = useState('Main Office Entrance');
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [checkInUrl, setCheckInUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  
  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      // Generate QR code using the API service
      const newQrCode = await qrCodeService.generateQRCode(location, 24); // 24 hour expiration
      
      // Get the QR code value and expiration
      const newQrValue = newQrCode.value;
      const newExpiresAt = newQrCode.expiresAt;
      
      // Create the full check-in URL with the QR code as a parameter
      const newCheckInUrl = `${window.location.origin}?code=${encodeURIComponent(newQrValue)}&loc=${encodeURIComponent(location)}`;
      
      setQrValue(newQrValue);
      setCheckInUrl(newCheckInUrl);
      setExpiresAt(newExpiresAt);
      
      if (onGenerate) {
        onGenerate(newQrValue, newExpiresAt, location);
      }
      
      toast.success('QR code generated successfully');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setGenerating(false);
    }
  };
  
  const handleDownload = () => {
    if (!qrValue || !checkInUrl) return;
    
    // Create a SVG element using the QRCodeSVG component
    const svgElement = document.getElementById('qr-code-svg');
    if (!svgElement) return;
    
    // Create a canvas element to convert SVG to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Set canvas size (make it larger for better quality)
    canvas.width = 400;
    canvas.height = 400;
    
    // Get the SVG data URI
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // Convert to PNG
    img.onload = function() {
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Create download link
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `workbeat-qr-${location.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = pngUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(svgUrl);
        toast.success('QR code downloaded');
      }
    };
    
    img.src = svgUrl;
  };
  
  const handleCopyLink = () => {
    if (!checkInUrl) return;
    
    navigator.clipboard.writeText(checkInUrl)
      .then(() => {
        toast.success('Check-in link copied to clipboard');
      })
      .catch((err) => {
        console.error('Failed to copy link:', err);
        toast.error('Failed to copy link');
      });
  };
  
  const getExpirationTime = () => {
    if (!expiresAt) return null;
    
    const expiration = new Date(expiresAt);
    return expiration.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };
  
  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          QR Code Generator
        </h2>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Office Location"
        />
        
        {qrValue ? (
          <div className="mt-4">
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg flex flex-col items-center justify-center border border-gray-200 dark:border-gray-600">
              {/* Render actual QR code */}
              <div className="mb-4">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={checkInUrl || ''}
                  size={200}
                  level="H"
                  includeMargin={true}
                  bgColor={"#FFFFFF"}
                  fgColor={"#000000"}
                />
              </div>
              
              <div className="text-center mt-2">
                <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <Clock size={16} className="mr-1" />
                  <span>Expires at: {getExpirationTime()}</span>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-full">
                  {checkInUrl}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Instructions:
              </div>
              <ol className="text-sm text-gray-600 dark:text-gray-400 list-decimal pl-5 space-y-1">
                <li>Display this QR code at your office entrance</li>
                <li>Employees can scan it to check in/out</li>
                <li>No login required for employees</li>
                <li>Generate a new code periodically for security</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
            <div className="text-center">
              <QrCode size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Generate a QR code for employee check-in
              </p>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-wrap gap-3 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="primary"
          onClick={handleGenerate}
          leftIcon={<RefreshCw size={18} />}
          isLoading={generating}
          className="flex-1"
        >
          {qrValue ? 'Regenerate QR Code' : 'Generate QR Code'}
        </Button>
        
        {qrValue && (
          <>
            <Button
              variant="secondary"
              onClick={handleDownload}
              leftIcon={<Download size={18} />}
              className="flex-1"
            >
              Download QR
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleCopyLink}
              leftIcon={<Copy size={18} />}
              className="flex-1"
            >
              Copy Link
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default QRGenerator;