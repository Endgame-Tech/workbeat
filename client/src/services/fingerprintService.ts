/**
 * Fingerprint Service
 * This service provides functionality for fingerprint enrollment and verification
 * using WebAuthn for browser-based fingerprint scanner access, with fallbacks for testing
 */

import api from './api';

// Type for credential entries from server
interface ServerCredential { 
  rawId: string; 
  employeeId: string; 
}

// Environment detection
const getEnvironment = (): 'development' | 'production' => {
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
};

/**
 * Get the appropriate relying party ID based on environment
 */
const getRelyingPartyId = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Handle localhost and development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'localhost';
    }
    
    // For production, use the actual domain
    return hostname;
  }
  
  return 'workbeat.app'; // Fallback
};

/**
 * Configuration for different environments and security settings
 * 
 * This configuration object handles:
 * 1. Environment-specific timeouts (development vs production)
 * 2. Security preferences for WebAuthn
 * 3. Supported cryptographic algorithms
 * 4. Application-specific settings
 * 
 * Key configuration decisions:
 * - Development has longer timeouts for easier testing
 * - Production has shorter timeouts for better UX
 * - Platform authenticators only (no roaming/external devices)
 * - Required user verification for maximum security
 * - ES256 algorithm prioritized for best compatibility
 * - Attestation set to 'none' for privacy
 */
const FINGERPRINT_CONFIG = {
  // Environment-specific timeouts
  timeouts: {
    development: {
      auth: 60000,      // 1 minute for testing
      enrollment: 120000 // 2 minutes for testing
    },
    production: {
      auth: 30000,      // 30 seconds for production
      enrollment: 60000  // 1 minute for production
    }
  },
  
  // Retry and rate limiting
  retries: {
    maxAttempts: 3,
    cooldownPeriod: 5000 // 5 seconds between retries
  },
  
  // Security preferences
  security: {
    userVerification: 'required' as UserVerificationRequirement,
    attestation: 'none' as AttestationConveyancePreference,
    requireResidentKey: true,
    authenticatorAttachment: 'platform' as AuthenticatorAttachment
  },
  
  // Supported algorithms (in order of preference)
  algorithms: [
    { type: "public-key" as const, alg: -7 },   // ES256 (most widely supported)
    { type: "public-key" as const, alg: -257 }, // RS256 (RSA)
    { type: "public-key" as const, alg: -8 }    // EdDSA (modern, efficient)
  ],
  
  // Application info
  app: {
    name: "WorkBeat Attendance System",
    relyingPartyId: getRelyingPartyId()
  }
};

/**
 * Get current configuration based on environment
 */
const getCurrentConfig = () => {
  const env = getEnvironment();
  return {
    authTimeout: FINGERPRINT_CONFIG.timeouts[env].auth,
    enrollTimeout: FINGERPRINT_CONFIG.timeouts[env].enrollment,
    maxRetries: FINGERPRINT_CONFIG.retries.maxAttempts,
    cooldownPeriod: FINGERPRINT_CONFIG.retries.cooldownPeriod,
    ...FINGERPRINT_CONFIG.security,
    algorithms: FINGERPRINT_CONFIG.algorithms,
    app: FINGERPRINT_CONFIG.app
  };
};

/**
 * Get current fingerprint service configuration
 * @returns The current configuration object
 */
const getConfig = () => getCurrentConfig();

/**
 * Check if the current environment is development
 * @returns boolean indicating if in development mode
 */
const isDevelopment = (): boolean => getEnvironment() === 'development';

/**
 * Get the current timeout for authentication operations
 * @returns timeout in milliseconds
 */
const getAuthTimeout = (): number => getCurrentConfig().authTimeout;

/**
 * Get the current timeout for enrollment operations
 * @returns timeout in milliseconds
 */
const getEnrollTimeout = (): number => getCurrentConfig().enrollTimeout;

/**
 * Check if the device has fingerprint authentication capabilities
 * @returns Promise resolving to boolean indicating support
 */
const checkFingerprintSupport = async (): Promise<boolean> => {
  try {
    // Check if WebAuthn is supported in this browser
    if (!window.PublicKeyCredential) {
      return false;
    }

    // Check if the device has a fingerprint sensor
    const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.error('Error checking fingerprint support:', error);
    return false;
  }
};

/**
 * Enroll a fingerprint for an employee
 * @param employeeId The ID of the employee
 * @param employeeName The name of the employee
 * @returns Promise resolving to the credential ID if successful
 */
const enrollFingerprint = async (employeeId: string, employeeName: string): Promise<string | null> => {
  try {
    // First check if fingerprint is supported
    const isSupported = await checkFingerprintSupport();
    
    if (!isSupported) {
      console.error('Fingerprint not supported');
      return null;
    }
    
    // Get current configuration
    const config = getCurrentConfig();
    
    // Get a challenge from the server
    const { data } = await api.get(`/api/biometrics/fingerprint/challenge/${employeeId}`);
    const challenge = Uint8Array.from(atob(data.challenge), c => c.charCodeAt(0));
    
    // Create enrollment options
    const options: CredentialCreationOptions = {
      publicKey: {
        challenge,
        rp: {
          name: config.app.name,
          id: config.app.relyingPartyId
        },
        user: {
          id: Uint8Array.from(employeeId, c => c.charCodeAt(0)),
          name: employeeName,
          displayName: employeeName
        },
        authenticatorSelection: {
          authenticatorAttachment: config.authenticatorAttachment,
          requireResidentKey: config.requireResidentKey,
          userVerification: config.userVerification
        },
        attestation: config.attestation,
        pubKeyCredParams: config.algorithms,
        timeout: config.enrollTimeout,
        excludeCredentials: []
      }
    };
    
    // Create credential (fingerprint enrollment)
    const credential = await navigator.credentials.create(options);
    
    if (!credential) {
      throw new Error('Failed to create credential');
    }
    
    // Convert credential to a format that can be sent to the server
    const publicKeyCredential = credential as PublicKeyCredential;
    const attestationResponse = publicKeyCredential.response as AuthenticatorAttestationResponse;
    
    // Send the credential to the server for storage
    const response = await api.post(`/api/biometrics/fingerprint/enroll/${employeeId}`, {
      id: publicKeyCredential.id,
      rawId: arrayBufferToBase64(publicKeyCredential.rawId),
      response: {
        clientDataJSON: arrayBufferToBase64(attestationResponse.clientDataJSON),
        attestationObject: arrayBufferToBase64(attestationResponse.attestationObject)
      },
      type: publicKeyCredential.type
    });
    
    return response.data.credentialId;
  } catch (error) {
    console.error('Error enrolling fingerprint:', error);
    return null;
  }
};

/**
 * Verify fingerprint for attendance across all enrolled employees
 * @returns Promise resolving to verification result with matched employeeId
 */
const verifyFingerprint = async (): Promise<{ verified: boolean; employeeId?: string }> => {
  try {
    // Check if fingerprint is supported
    const isSupported = await checkFingerprintSupport();

    if (!isSupported) {
      console.error('Fingerprint not supported');
      return { verified: false };
    }

    // Get current configuration
    const config = getCurrentConfig();

    // Get challenge and credential info for all employees
    const { data } = await api.get(`/api/biometrics/fingerprint/verify-challenge`);
    const challenge = Uint8Array.from(atob(data.challenge), c => c.charCodeAt(0));

    // Prepare allowed credentials list with proper typing
    const allowCredentials: PublicKeyCredentialDescriptor[] = (data.credentials as ServerCredential[]).map(cred => ({
      id: base64ToArrayBuffer(cred.rawId),
      type: 'public-key' as const,
      transports: ['internal'] as AuthenticatorTransport[]
    }));

    const requestOptions: CredentialRequestOptions = {
      publicKey: {
        challenge,
        allowCredentials,
        timeout: config.authTimeout,
        userVerification: config.userVerification
      }
    };

    // Perform WebAuthn assertion
    const credential = (await navigator.credentials.get(requestOptions)) as PublicKeyCredential;
    if (!credential) {
      throw new Error('Failed to get credential');
    }

    const assertionResponse = credential.response as AuthenticatorAssertionResponse;
    const rawId = arrayBufferToBase64(credential.rawId);

    // Verify with the server
    const response = await api.post(`/api/biometrics/fingerprint/verify`, {
      id: credential.id,
      rawId,
      response: {
        clientDataJSON: arrayBufferToBase64(assertionResponse.clientDataJSON),
        authenticatorData: arrayBufferToBase64(assertionResponse.authenticatorData),
        signature: arrayBufferToBase64(assertionResponse.signature),
        userHandle: assertionResponse.userHandle ? arrayBufferToBase64(assertionResponse.userHandle) : null
      },
      type: credential.type
    });

    return { verified: response.data.success, employeeId: response.data.employeeId };
  } catch (error) {
    console.error('Error verifying fingerprint:', error);
    return { verified: false };
  }
};

/**
 * Delete a fingerprint enrollment
 * @param employeeId The ID of the employee
 * @param credentialId The credential ID to delete
 * @returns Promise resolving to boolean indicating success
 */
const deleteFingerprint = async (employeeId: string, credentialId: string): Promise<boolean> => {
  try {
    // Check if fingerprint is supported
    const isSupported = await checkFingerprintSupport();
    
    if (!isSupported) {
      console.error('Fingerprint not supported');
      return false;
    }
    
    const response = await api.delete(`/api/biometrics/fingerprint/${employeeId}/${credentialId}`);
    return response.data.success;
  } catch (error) {
    console.error('Error deleting fingerprint:', error);
    return false;
  }
};

/**
 * Helper function to convert ArrayBuffer to Base64 string
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Helper function to convert Base64 string to ArrayBuffer
 */
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

export const fingerprintService = {
  checkFingerprintSupport,
  enrollFingerprint,
  verifyFingerprint,
  deleteFingerprint,
  // Configuration utilities
  getConfig,
  isDevelopment,
  getAuthTimeout,
  getEnrollTimeout
};

export default fingerprintService;