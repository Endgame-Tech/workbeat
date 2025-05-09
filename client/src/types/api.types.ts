import { AxiosError } from 'axios';

export interface ApiError extends AxiosError {
  response?: {
    data: any;
    status: number;
    statusText: string;
  };
}

export interface AttendanceData {
  employeeId: string;
  type: 'sign-in' | 'sign-out';
  facialImage?: string;
  facialCapture?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  organizationId?: string;
  verificationMethod?: 'face-recognition' | 'fingerprint' | 'manual';
  timestamp?: string;
}

export interface FingerprintData {
  credentialId: string;
  credential: {
    id: string;
    rawId: ArrayBuffer;
    response: {
      authenticatorData: ArrayBuffer;
      clientDataJSON: ArrayBuffer;
      signature: ArrayBuffer;
    };
    type: 'public-key';
  };
  challenge: string;
}

export interface FingerprintEnrollData extends Omit<FingerprintData, 'challenge'> {
  employeeId: string;
}

export interface Window {
  _env_?: {
    VITE_APP_API_URL?: string;
  };
}
