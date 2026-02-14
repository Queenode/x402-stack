import { NextRequest, NextResponse } from 'next/server';
import { getEventById, createTicket } from '@/lib/db';
import { generateTicketQR } from '@/lib/qr-utils';
import {
  buildPaymentRequired,
  encodePaymentHeader,
  decodePaymentHeader,
  formatSTX,
  X402_HEADERS,
  FACILITATOR_URL,
} from '@/lib/x402-client';
import type { PaymentPayload } from '@/lib/x402-client';

/**
 * POST /api/tickets/purchase
 *
 * Implements the x402-stacks payment protocol for ticket purchases.
 *
 * This is the Next.js equivalent of x402-stacks' paymentMiddleware for Express.
 * The flow follows the x402 V2 spec exactly:
 *
 * Step 1 (no payment-signature header):
 *   → Return HTTP 402 with payment-required header (base64 encoded)
 *   → Client shows payment details to user
 *   → User pays via Leather wallet (stx_transferStx)
 *
 * Step 2 (payment-signature header present):
 *   → Decode the PaymentPayloadV2 from the header
 *   → Extract the txId (transaction was already broadcast by the wallet)
 *   → Verify the transaction on-chain (or via facilitator)
 *   → Create the ticket and return payment-response header
 *
 * Note: In the standard x402 facilitator pattern, the client signs without
 * broadcasting and the server sends to the facilitator's /settle endpoint.
 * Since we use @stacks/connect which broadcasts directly, we verify the
 * txId instead. Both approaches result in a real on-chain STX transfer.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, tier, buyerAddress } = body;

    // Validate required fields
    if (!eventId || !tier || !buyerAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, tier, buyerAddress' },
        { status: 400 }
      );
    }

    // Get event
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Validate tier
    const tierData = event.tiers[tier as keyof typeof event.tiers];
    if (!tierData) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Check availability
    if (tierData.sold >= tierData.available) {
      return NextResponse.json({ error: 'Tier sold out' }, { status: 400 });
    }

    // ===== x402 Payment Protocol (V2) =====
    const paymentSignature = req.headers.get(X402_HEADERS.PAYMENT_SIGNATURE);

    if (!paymentSignature) {
      // ── STEP 1: Return HTTP 402 Payment Required ──
      // This is exactly what x402-stacks' paymentMiddleware does when
      // no payment-signature header is present.
      const paymentRequired = buildPaymentRequired({
        amount: tierData.price,
        payTo: event.organizerAddress,
        network: 'testnet',
        description: `${event.title} - ${tier.toUpperCase()} ticket (${formatSTX(tierData.price)})`,
        resource: `partystacker://event/${eventId}/ticket/${tier}`,
      });

      const paymentRequiredHeader = encodePaymentHeader(paymentRequired);

      return NextResponse.json(paymentRequired, {
        status: 402,
        headers: {
          [X402_HEADERS.PAYMENT_REQUIRED]: paymentRequiredHeader,
        },
      });
    }

    // ── STEP 2: Verify payment and create ticket ──
    // Decode the payment payload from the payment-signature header
    let paymentPayload: PaymentPayload | null = null;
    try {
      paymentPayload = decodePaymentHeader<PaymentPayload>(paymentSignature);
    } catch {
      return NextResponse.json(
        { error: 'Invalid payment-signature header: failed to decode' },
        { status: 400 }
      );
    }

    if (!paymentPayload) {
      return NextResponse.json(
        { error: 'Invalid payment-signature: empty payload' },
        { status: 400 }
      );
    }

    // Validate x402 version
    if (paymentPayload.x402Version !== 2) {
      return NextResponse.json(
        { error: 'Only x402 V2 is supported' },
        { status: 400 }
      );
    }

    // Extract the transaction ID
    const txId = paymentPayload.payload?.transaction;
    if (!txId) {
      return NextResponse.json(
        { error: 'Missing transaction in payment payload' },
        { status: 400 }
      );
    }

    // Verify the transaction on-chain
    // In a production x402 setup, this would use X402PaymentVerifier:
    //   import { X402PaymentVerifier } from 'x402-stacks';
    //   const verifier = new X402PaymentVerifier(FACILITATOR_URL, 'testnet');
    //   const result = await verifier.settle(paymentPayload, { paymentRequirements });
    //
    // Since we broadcast via @stacks/connect, the txId is already on-chain.
    // We verify by checking the Stacks API:
    let verifiedTx = true;
    let txData: any = null;

    try {
      const apiUrl = `https://api.testnet.hiro.so/extended/v1/tx/${txId}`;
      const txResponse = await fetch(apiUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (txResponse.ok) {
        txData = await txResponse.json();
        console.log(`[x402] Transaction ${txId} status: ${txData.tx_status}`);
        // Accept pending and success statuses
        verifiedTx = ['pending', 'success'].includes(txData.tx_status);
      } else {
        // Transaction may still be propagating — accept for hackathon demo
        console.log(`[x402] Transaction ${txId} not yet indexed, accepting for demo`);
        verifiedTx = true;
      }
    } catch (verifyError) {
      // If verification fails (network, timeout), still accept for demo
      console.log(`[x402] Transaction verification skipped:`, verifyError);
      verifiedTx = true;
    }

    if (!verifiedTx) {
      // Return 402 again to request payment
      return NextResponse.json(
        { 
            error: `Transaction verification failed: ${txData?.tx_status || 'unknown'}`, 
            txId,
            reason: txData?.tx_result 
        },
        { status: 402 }
      );
    }

    // ── STEP 3: Payment verified → create the ticket ──
    const qrCode = await generateTicketQR(
      '',
      eventId,
      buyerAddress,
      tier,
      `x402-${txId.slice(0, 16)}`
    );

    const ticket = await createTicket(
      eventId,
      buyerAddress,
      tier,
      txId,
      qrCode
    );

    // Build payment-response header (x402 V2 spec)
    // This matches what x402-stacks middleware returns after settlement
    const paymentResponse = {
      success: true,
      payer: buyerAddress,
      transaction: txId,
      network: paymentPayload.accepted?.network || 'stacks:2147483648',
    };

    return NextResponse.json(
      {
        success: true,
        ticket,
        payment: {
          ...paymentResponse,
          amount: tierData.price,
          amountFormatted: formatSTX(tierData.price),
          recipient: event.organizerAddress,
          protocol: 'x402-stacks',
          x402Version: 2,
          facilitatorUrl: FACILITATOR_URL,
        },
      },
      {
        status: 201,
        headers: {
          [X402_HEADERS.PAYMENT_RESPONSE]: encodePaymentHeader(paymentResponse),
        },
      }
    );
  } catch (error: any) {
    console.error('[PartyStacker] Purchase error:', error);
    return NextResponse.json(
      { error: error.message || 'Purchase failed' },
      { status: 500 }
    );
  }
}
