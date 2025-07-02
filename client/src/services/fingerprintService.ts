// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Fingerprint Service
 * This service provides functionality for fingerprint enrollment and verification
 * using WebAuthn for browser-based fingerprint scanner access, with fallbacks for testing
 */

import api from './api';
// Type for credential entries from server
interface ServerCredential { rawId: string; }

// WebAuthn options for fingerprint authentication
const FINGERPRINT_OPTIONS = {
  publicKey: {
    challenge: new Uint8Array(32), // Will be updated with a proper challenge
    rp: {
      name: "WorkBeat Attendance System",
      id: window.location.hostname
    },
    userVerification: "required" as UserVerificationRequirement,
    authenticatorSelection: {
      authenticatorAttachment: "platform" as AuthenticatorAttachment,
      requireResidentKey: false,
      userVerification: "required" as UserVerificationRequirement
    },
    attestation: "direct" as AttestationConveyancePreference,
    pubKeyCredParams: [
      { type: "public-key", alg: -7 }, // ES256
      { type: "public-key", alg: -257 } // RS256
    ]
  }
};

// Removed mock data - using real fingerprint authentication only

/**
 * Check if the device has fingerprint authentication capabilities
 * @returns Promise resolving to boolean indicating support
 */
const checkFingerprintSupport = async (): Promise<boolean> => {
  try {
    // Check if WebAuthn is supported in this browser
    if (!window.PublicKeyCredential) {
      console.log('WebAuthn is not supported in this browser');
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
    
    // Get a challenge from the server
    const { data } = await api.get(`/api/biometrics/fingerprint/challenge/${employeeId}`);
    const challenge = Uint8Array.from(atob(data.challenge), c => c.charCodeAt(0));
    
    // Update options with the challenge and user info
    const options = {
      ...FINGERPRINT_OPTIONS,
      publicKey: {
        ...FINGERPRINT_OPTIONS.publicKey,
        challenge,
        user: {
          id: Uint8Array.from(employeeId, c => c.charCodeAt(0)),
          name: employeeName,
          displayName: employeeName
        }
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
 * Verify fingerprint for attendance
 * @param employeeId Optional employee ID (can be omitted for testing)
 * @returns Promise resolving to verification result
 */
const verifyFingerprint = async (
  employeeId?: string
): Promise<{ verified: boolean; employeeId?: string }> => {
  try {
    // Check if fingerprint is supported
    const isSupported = await checkFingerprintSupport();
    
    if (!isSupported) {
      console.error('Fingerprint not supported');
      return { verified: false };
    }
    
    // If no employee ID is provided, we can't verify with the server
    if (!employeeId) {
      throw new Error('Employee ID required for fingerprint verification');
    }
    
    // Get challenge and credential info from server
    const { data } = await api.get(`/api/biometrics/fingerprint/verify-challenge/${employeeId}`);
    const challenge = Uint8Array.from(atob(data.challenge), c => c.charCodeAt(0));
    
    // Update options with the challenge
    const requestOptions: CredentialRequestOptions = {
      publicKey: {
        challenge,
        allowCredentials: (data.credentials as ServerCredential[]).map(cred => ({
          id: base64ToArrayBuffer(cred.rawId),
          type: 'public-key',
          transports: ['internal']
        })),
        timeout: 60000,
        userVerification: 'required' as UserVerificationRequirement
      }
    };
    
    // Verify fingerprint
    const credential = await navigator.credentials.get(requestOptions);
    
    if (!credential) {
      throw new Error('Failed to get credential');
    }
    
    // Convert credential to a format that can be sent to the server
    const publicKeyCredential = credential as PublicKeyCredential;
    const assertionResponse = publicKeyCredential.response as AuthenticatorAssertionResponse;
    
    // Verify with the server
    const response = await api.post(`/api/biometrics/fingerprint/verify/${employeeId}`, {
      id: publicKeyCredential.id,
      rawId: arrayBufferToBase64(publicKeyCredential.rawId),
      response: {
        clientDataJSON: arrayBufferToBase64(assertionResponse.clientDataJSON),
        authenticatorData: arrayBufferToBase64(assertionResponse.authenticatorData),
        signature: arrayBufferToBase64(assertionResponse.signature),
        userHandle: assertionResponse.userHandle 
          ? arrayBufferToBase64(assertionResponse.userHandle) 
          : null
      },
      type: publicKeyCredential.type
    });
    
    return { verified: response.data.success, employeeId };
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
  deleteFingerprint
};

export default fingerprintService;