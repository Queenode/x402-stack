import QRCode from 'qrcode';
import type { QRPayload } from './types';

// Generate cryptographically signed QR code
export async function generateTicketQR(
  ticketId: string,
  eventId: string,
  ownerAddress: string,
  tier: string,
  privateKey: string
): Promise<string> {
  const payload: QRPayload = {
    ticketId,
    eventId,
    ownerAddress,
    tier: tier as any,
    timestamp: Date.now(),
    signature: '',
  };

  // Create signature using private key hash
  const dataToSign = `${ticketId}${eventId}${ownerAddress}${tier}${payload.timestamp}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToSign + privateKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  payload.signature = signature;

  // Encode as base64
  const encoded = btoa(JSON.stringify(payload));

  // Generate QR code image (data URL)
  const qrDataUrl = await QRCode.toDataURL(encoded, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  return qrDataUrl;
}

// Verify QR code signature
export async function verifyTicketQR(
  qrData: string,
  expectedPrivateKey: string
): Promise<{ valid: boolean; payload?: QRPayload; error?: string }> {
  try {
    const decoded = atob(qrData);
    const payload: QRPayload = JSON.parse(decoded);

    // Recreate signature
    const dataToSign = `${payload.ticketId}${payload.eventId}${payload.ownerAddress}${payload.tier}${payload.timestamp}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(dataToSign + expectedPrivateKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSignature = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (payload.signature !== expectedSignature) {
      return {
        valid: false,
        error: 'Invalid signature - ticket may be forged',
      };
    }

    // Check timestamp (not older than 24 hours for security)
    const age = Date.now() - payload.timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      return { valid: false, error: 'QR code expired' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'Invalid QR code format' };
  }
}

// Parse QR code data from scanner
export function parseQRData(data: string): { valid: boolean; payload?: QRPayload } {
  try {
    const decoded = atob(data);
    const payload: QRPayload = JSON.parse(decoded);
    return { valid: true, payload };
  } catch (error) {
    return { valid: false };
  }
}
