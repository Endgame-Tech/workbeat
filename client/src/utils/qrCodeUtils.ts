// src/utils/qrCodeUtils.ts
import { createClient } from '@supabase/supabase-js';

// Update with your local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Generates a unique QR code value for employee check-ins
 * @param location The location identifier for the QR code
 * @returns A unique QR code value
 */
export const generateQRCodeValue = (location: string): string => {
  // Create a timestamp-based identifier
  const timestamp = Date.now();
  // Create a random string for additional uniqueness
  const randomString = Math.random().toString(36).substring(2, 10);
  
  // Combine location, timestamp, and random string to create a unique QR code value
  return `workbeat-${location.replace(/\s+/g, '-').toLowerCase()}-${timestamp}-${randomString}`;
};

/**
 * Calculates the expiration time for a QR code
 * @param durationHours How many hours the QR code should be valid (default: 24)
 * @returns ISO string representing the expiration date/time
 */
export const getQRCodeExpiration = (durationHours: number = 24): string => {
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + durationHours);
  return expirationDate.toISOString();
};

/**
 * Saves a generated QR code to the Supabase database
 * @param qrValue The QR code value
 * @param expiresAt ISO string when the QR code expires
 * @param location The location name
 * @returns Promise that resolves with the database record
 */
export const saveQrCodeToDatabase = async (
  qrValue: string,
  expiresAt: string,
  location: string
): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        code_value: qrValue,
        location,
        expiration: expiresAt,
        is_active: true
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error saving QR code to database:', error);
    throw error;
  }
};

/**
 * Retrieves active QR codes from the database
 * @param limit Number of records to return
 * @returns Promise that resolves with the QR code records
 */
export const getActiveQRCodes = async (limit: number = 5): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return [];
  }
};

/**
 * Validates if a QR code is valid and not expired
 * @param qrValue The QR code value to validate
 * @returns True if the QR code is valid and active
 */
export const validateQRCode = async (qrValue: string): Promise<boolean> => {
  try {
    // Check if the code exists and is active
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('code_value', qrValue)
      .eq('is_active', true)
      .single();
    
    if (error) return false;
    
    // Check if expired
    const expiration = new Date(data.expiration);
    const now = new Date();
    
    return now < expiration;
  } catch (error) {
    console.error('Error validating QR code:', error);
    return false;
  }
};

/**
 * Deactivates a QR code in the database
 * @param qrValue The QR code value to deactivate
 * @returns Promise that resolves when the code is deactivated
 */
export const deactivateQRCode = async (qrValue: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('qr_codes')
      .update({ is_active: false })
      .eq('code_value', qrValue);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deactivating QR code:', error);
    throw error;
  }
};

/**
 * Function to handle scanning a QR code using browser's BarcodeDetector API
 * Falls back to a mock implementation if the API is not available
 * @returns Promise that resolves with the scanned QR code value
 */
export const scanQRCode = async (videoElement: HTMLVideoElement): Promise<string> => {
  // Check if BarcodeDetector is available
  if ('BarcodeDetector' in window) {
    try {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['qr_code']
      });
      
      // Try to detect barcodes in the video frame
      const barcodes = await barcodeDetector.detect(videoElement);
      
      if (barcodes.length > 0) {
        return barcodes[0].rawValue;
      }
      
      // No QR code found
      throw new Error('No QR code detected');
    } catch (error) {
      console.error('Error using BarcodeDetector:', error);
      // Fall back to mock implementation
      return mockScanQRCode();
    }
  } else {
    // BarcodeDetector not supported, fall back to mock implementation
    console.warn('BarcodeDetector API not supported in this browser');
    return mockScanQRCode();
  }
};

/**
 * Utility functions for QR code operations
 * Note: Most QR code functionality now handled by the backend API,
 * but these utility functions are still useful for the frontend
 */

/**
 * Check if a QR code is valid (not expired)
 * @param {string} expiresAt - Expiration date string
 * @returns {boolean} True if QR code is valid, false otherwise
 */
export const isQRCodeValid = (expiresAt: string): boolean => {
  if (!expiresAt) return false;
  
  const expirationDate = new Date(expiresAt);
  const currentDate = new Date();
  
  return expirationDate > currentDate;
};

/**
 * Calculate remaining time until QR code expiration
 * @param {string} expiresAt - Expiration date string
 * @returns {Object} Remaining time in hours and minutes
 */
export const getQRCodeRemainingTime = (expiresAt: string): { hours: number; minutes: number } => {
  if (!expiresAt) return { hours: 0, minutes: 0 };
  
  const expirationDate = new Date(expiresAt);
  const currentDate = new Date();
  
  // Calculate remaining time in milliseconds
  const remainingTime = expirationDate.getTime() - currentDate.getTime();
  
  if (remainingTime <= 0) {
    return { hours: 0, minutes: 0 };
  }
  
  // Convert to hours and minutes
  const hours = Math.floor(remainingTime / (1000 * 60 * 60));
  const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes };
};

/**
 * Format remaining time as a string
 * @param {Object} remainingTime - Remaining time object with hours and minutes
 * @returns {string} Formatted remaining time (e.g., "2h 30m")
 */
export const formatRemainingTime = (remainingTime: { hours: number; minutes: number }): string => {
  const { hours, minutes } = remainingTime;
  
  if (hours === 0 && minutes === 0) {
    return 'Expired';
  }
  
  if (hours === 0) {
    return `${minutes}m`;
  }
  
  if (minutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${minutes}m`;
};

/**
 * Decode QR code parameter from URL
 * @param {string} url - URL with QR code parameter
 * @returns {string|null} QR code value or null if not found
 */
export const decodeQRCodeFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('code');
  } catch (error) {
    console.error('Error decoding QR code from URL:', error);
    return null;
  }
};