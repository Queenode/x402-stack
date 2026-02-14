/**
 * x402-stacks integration for PartyStacker
 *
 * This module adapts the x402-stacks SDK for use in a Next.js application.
 * The x402 protocol uses HTTP 402 Payment Required for native web payments.
 *
 * Architecture:
 *   - Server: Adapts the x402-stacks paymentMiddleware pattern for Next.js
 *     API route handlers. Returns HTTP 402 with payment requirements when
 *     no payment-signature header is present. When payment-signature is
 *     provided, verifies and creates the ticket.
 *
 *   - Client: Uses @stacks/connect to sign & broadcast real STX transactions
 *     via the Leather wallet, then sends the txId back to the server as proof
 *     of payment in the payment-signature header.
 *
 * x402 V2 Protocol Headers:
 *   - payment-required: Base64-encoded payment requirements (402 response)
 *   - payment-signature: Base64-encoded payment payload with signed tx
 *   - payment-response: Base64-encoded settlement confirmation
 *
 * @see https://github.com/x402Stacks/x402-stacks-sdk
 */

import {
  STXtoMicroSTX,
  microSTXtoSTX,
  formatPaymentAmount,
  getExplorerURL,
  networkToCAIP2,
} from 'x402-stacks';

// Re-export x402-stacks utilities for use throughout the app
export { STXtoMicroSTX, microSTXtoSTX, formatPaymentAmount, getExplorerURL, networkToCAIP2 };

// The default facilitator URL from x402-stacks documentation
export const FACILITATOR_URL =
  process.env.NEXT_PUBLIC_X402_FACILITATOR_URL ||
  'https://x402-backend-7eby.onrender.com';

// x402 V2 standard header names (matching X402_HEADERS from x402-stacks)
export const X402_HEADERS = {
  PAYMENT_REQUIRED: 'payment-required',
  PAYMENT_SIGNATURE: 'payment-signature',
  PAYMENT_RESPONSE: 'payment-response',
} as const;

/**
 * x402 V2 PaymentRequirements schema
 */
export interface PaymentRequirements {
  scheme: string;
  network: string;       // CAIP-2 format: "stacks:1" or "stacks:2147483648"
  amount: string;        // In microSTX (atomic units)
  asset: string;         // "STX" or "sBTC"
  payTo: string;         // Recipient Stacks address
  maxTimeoutSeconds: number;
}

/**
 * x402 V2 PaymentRequired response (returned with HTTP 402)
 */
export interface PaymentRequired {
  x402Version: 2;
  resource: {
    url: string;
    description?: string;
  };
  accepts: PaymentRequirements[];
}

/**
 * x402 V2 PaymentPayload (sent in payment-signature header)
 */
export interface PaymentPayload {
  x402Version: 2;
  resource: { url: string };
  accepted: PaymentRequirements;
  payload: {
    transaction: string;  // The txId or signed tx hex
    txRaw?: string;       // Optional raw transaction hex
  };
}

/**
 * Build a V2 x402 payment-required response body.
 * This matches the structure from x402-stacks middleware:
 * {
 *   x402Version: 2,
 *   resource: { url, description },
 *   accepts: [{ scheme, network, amount, asset, payTo, maxTimeoutSeconds }]
 * }
 */
export function buildPaymentRequired(opts: {
  amount: number; // In STX (will be converted to microSTX)
  payTo: string;  // Recipient Stacks address
  network: 'testnet' | 'mainnet';
  description?: string;
  resource?: string;
}): PaymentRequired {
  const microSTX = STXtoMicroSTX(opts.amount);

  return {
    x402Version: 2,
    resource: {
      url: opts.resource || 'partystacker://ticket',
      description: opts.description || 'PartyStacker ticket purchase',
    },
    accepts: [
      {
        scheme: 'exact',
        network: networkToCAIP2(opts.network),
        amount: microSTX.toString(),
        asset: 'STX',
        payTo: opts.payTo,
        maxTimeoutSeconds: 300,
      },
    ],
  };
}

/**
 * Build a V2 x402 payment payload.
 * This is what the client sends back after paying.
 */
export function buildPaymentPayload(
  paymentRequired: PaymentRequired,
  txId: string,
  txRaw?: string
): PaymentPayload {
  return {
    x402Version: 2,
    resource: paymentRequired.resource,
    accepted: paymentRequired.accepts[0],
    payload: {
      transaction: txId,
      ...(txRaw ? { txRaw } : {}),
    },
  };
}

/**
 * Encode a payment object as a base64 header value
 * (per x402 V2 spec, headers are base64-encoded JSON)
 */
export function encodePaymentHeader(data: object): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Decode a base64-encoded payment header back to an object
 */
export function decodePaymentHeader<T = any>(header: string): T | null {
  try {
    return JSON.parse(Buffer.from(header, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

/**
 * Format a STX amount for display (thin wrapper for consistency)
 */
export function formatSTX(amount: number): string {
  return `${amount} STX`;
}
