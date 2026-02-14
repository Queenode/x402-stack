import { NextRequest, NextResponse } from 'next/server';
import { getTicketsByOwner, getTicketsByEvent } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const owner = searchParams.get('owner');
    const eventId = searchParams.get('eventId');

    let tickets;
    if (owner) {
      tickets = await getTicketsByOwner(owner);
    } else if (eventId) {
      tickets = await getTicketsByEvent(eventId);
    } else {
      return NextResponse.json(
        { error: 'owner or eventId parameter required' },
        { status: 400 }
      );
    }

    return NextResponse.json(tickets, { status: 200 });
  } catch (error: any) {
    console.error('[v0] Get tickets error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
