import { NextRequest, NextResponse } from 'next/server';
import { getTicketById, updateTicket, getEventById } from '@/lib/db';
import { mintAttendanceNFT } from '@/lib/stacks-nft';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketId, organizerAddress } = body;

    // Validate input - no longer requires private key
    if (!ticketId || !organizerAddress) {
      return NextResponse.json(
        { error: 'Missing ticket ID or organizer address' },
        { status: 400 }
      );
    }

    // Get ticket
    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Get event
    const event = await getEventById(ticket.eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Verify organizer
    if (event.organizerAddress !== organizerAddress) {
      return NextResponse.json(
        { error: 'Only the event organizer can check in tickets' },
        { status: 403 }
      );
    }

    // Check if already checked in
    if (ticket.checkedIn) {
      return NextResponse.json(
        {
          error: 'Ticket already checked in',
          checkinTime: ticket.checkinTime,
        },
        { status: 400 }
      );
    }

    // Mark as checked in
    await updateTicket(ticketId, {
      checkedIn: true,
      checkinTime: Date.now(),
    });

    // Mint attendance NFT
    let nftResult = { success: false, txId: undefined as string | undefined };
    try {
      nftResult = await mintAttendanceNFT(
        ticket.ownerAddress,
        event.title,
        new Date(event.date).toLocaleDateString(),
        ticket.tier,
        `x402-verified-${organizerAddress}`,
        'testnet'
      );

      if (nftResult.success) {
        await updateTicket(ticketId, {
          nftMinted: true,
          nftTokenId: nftResult.txId,
        });
      }
    } catch (nftError) {
      console.error('[PartyStacker] NFT minting error:', nftError);
      // Continue even if NFT minting fails
    }

    return NextResponse.json(
      {
        success: true,
        checkedIn: true,
        nftMinted: nftResult.success,
        nftTxId: nftResult.txId,
        ticket: {
          id: ticket.id,
          tier: ticket.tier,
          ownerAddress: ticket.ownerAddress,
        },
        event: {
          title: event.title,
          date: event.date,
        },
        message: `Welcome to ${event.title}!`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[PartyStacker] Check-in error:', error);
    return NextResponse.json(
      { error: error.message || 'Check-in failed' },
      { status: 500 }
    );
  }
}
