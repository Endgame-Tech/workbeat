import React, { useRef, useState, useEffect } from 'react';
import { simpleFaceCaptureService } from '../services/simpleFaceCaptureService';
import Button from './ui/Button';
import { Camera, Check, X } from 'lucide-react';

interface FaceCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
  employeeName?: string;
}

const FaceCapture: React.FC<FaceCaptureProps> = ({ 
  onCapture, 
  onCancel,
  employeeName 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Initialize camera when component mounts
  useEffect(() => {
    const initCamera = async () => {
      if (videoRef.current) {
        const success = await simpleFaceCaptureService.initializeCamera(videoRef.current);
        setIsCameraReady(success);
        
        if (success) {
          videoRef.current.play();
        }
      }
    };
    
    initCamera();
    
    // Clean up camera when component unmounts
    const currentVideo = videoRef.current;
    return () => {
      if (currentVideo) {
        simpleFaceCaptureService.stopCamera(currentVideo);
      }
    };
  }, []);

  // Handle auto-capture with countdown
  const startAutoCapture = () => {
    setCountdown(3);
  };
  
  // Capture image from video
  const handleCapture = React.useCallback(() => {
    if (!videoRef.current || !isCameraReady) return;
    
    const imageData = simpleFaceCaptureService.captureImage(videoRef.current);
    setCapturedImage(imageData);
  }, [isCameraReady]);

  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // Capture image when countdown reaches 0
      handleCapture();
    }
  }, [countdown, handleCapture]);

  // Reset capture to try again
  const handleRetake = () => {
    setCapturedImage(null);
    setCountdown(null);
  };

  // Submit the captured image
  const handleSubmit = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-md mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {employeeName ? `Hello, ${employeeName}` : 'Face Capture'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {capturedImage 
            ? 'Review your photo' 
            : countdown !== null 
              ? `Taking photo in ${countdown}...` 
              : 'Please look at the camera'}
        </p>
      </div>

      <div className="aspect-square bg-black rounded-lg overflow-hidden mb-4 relative">
        {!capturedImage ? (
          <>
            <video 
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-6xl font-bold">
                  {countdown}
                </div>
              </div>
            )}
          </>
        ) : (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="w-full h-full object-cover" 
          />
        )}
      </div>

      <div className="flex justify-between gap-2">
        <Button
          variant="ghost"
          onClick={onCancel}
          leftIcon={<X size={18} />}
        >
          Cancel
        </Button>

        {capturedImage ? (
          <>
            <Button
              variant="ghost"
              onClick={handleRetake}
              leftIcon={<Camera size={18} />}
            >
              Retake
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              leftIcon={<Check size={18} />}
            >
              Submit
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            onClick={startAutoCapture}
            leftIcon={<Camera size={18} />}
            disabled={!isCameraReady || countdown !== null}
          >
            {countdown !== null ? `Taking photo in ${countdown}...` : 'Take Photo'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FaceCapture;