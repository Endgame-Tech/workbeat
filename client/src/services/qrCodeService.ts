import api from './api';
import { QRCode } from '../types';

interface QRCodeResponse {
  success: boolean;
  data: QRCode;
}

interface QRCodeListResponse {
  success: boolean;
  count: number;
  data: QRCode[];
}

export const qrCodeService = {
  // Generate a new QR code
  async generateQRCode(location: string, expirationHours: number = 24): Promise<QRCode> {
    try {
      const response = await api.post<QRCodeResponse>('/qrcodes', {
        location,
        expirationHours
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  },
  
  // Get all active QR codes
  async getActiveQRCodes(): Promise<QRCode[]> {
    try {
      const response = await api.get<QRCodeListResponse>('/qrcodes');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      return [];
    }
  },
  
  // Verify a QR code
  async verifyQRCode(qrValue: string): Promise<{ valid: boolean; location: string; expiresAt: string } | null> {
    try {
      const response = await api.get<{ success: boolean; data: { valid: boolean; location: string; expiresAt: string } }>(`/qrcodes/verify/${qrValue}`);
      return response.data.data;
    } catch (error) {
      console.error('Error verifying QR code:', error);
      return null;
    }
  },
  
  // Deactivate a QR code
  async deactivateQRCode(id: string): Promise<void> {
    try {
      await api.delete(`/qrcodes/${id}`);
    } catch (error) {
      console.error(`Error deactivating QR code with ID ${id}:`, error);
      throw error;
    }
  }
};

export default qrCodeService;