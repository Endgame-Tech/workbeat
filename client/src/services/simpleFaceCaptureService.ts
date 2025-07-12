/**
 * Simple Face Capture Service
 * This service provides basic image capture functionality without face recognition
 */

/**
 * Initialize the camera
 * @param videoElement The video element to display the camera feed
 * @returns Promise resolving to true when camera is initialized
 */
export const initializeCamera = async (videoElement: HTMLVideoElement): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Use front camera on mobile devices
        }
      });
      
      videoElement.srcObject = stream;
      
      // Wait for video to be ready
      return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          resolve(true);
        };
      });
    } catch (error) {
      console.error('Error initializing camera:', error);
      return false;
    }
  };
  
  /**
   * Capture an image from the video feed
   * @param videoElement The video element with camera feed
   * @returns Base64 encoded image data
   */
  export const captureImage = (videoElement: HTMLVideoElement): string => {
    try {
      // Create a canvas element to capture the frame
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      // Draw the current video frame to the canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to base64 image
      return canvas.toDataURL('image/jpeg', 0.8); // 0.8 quality to reduce size
    } catch (error) {
      console.error('Error capturing image:', error);
      return '';
    }
  };
  
  /**
   * Stop the camera stream
   * @param videoElement The video element to stop
   */
  export const stopCamera = (videoElement: HTMLVideoElement): void => {
    try {
      const stream = videoElement.srcObject as MediaStream;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoElement.srcObject = null;
      }
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  };
  
  export const simpleFaceCaptureService = {
    initializeCamera,
    captureImage,
    stopCamera
  };
  
  export default simpleFaceCaptureService;