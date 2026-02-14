import { NextRequest, NextResponse } from 'next/server';
import { createEvent, getAllEvents, getEventsByOrganizer } from '@/lib/db';
import { getAllEventsFromChain } from '@/lib/stacks-api';
import type { CreateEventInput } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizer = searchParams.get('organizer');

    let events;
    if (organizer) {
      // TODO: Filter on-chain events by organizer
      // For now, fetch all and filter in memory (inefficient but works for small scale)
      const allEvents = await getAllEventsFromChain();
      events = allEvents.filter(e => e.organizerAddress === organizer);
    } else {
      events = await getAllEventsFromChain();
    }
    
    // Fallback to local DB if chain returns nothing (e.g. during development/testing)
    if (!events || events.length === 0) {
        console.log('No events on chain, checking local DB...');
        if (organizer) {
            events = await getEventsByOrganizer(organizer);
        } else {
            events = await getAllEvents();
        }
    }

    return NextResponse.json(events, { status: 200 });
  } catch (error: any) {
    console.error('[v0] Get events error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input, organizerAddress, organizerName } = body;

    // Validate input
    if (!input || !organizerAddress || !organizerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate event data
    const eventInput: CreateEventInput = input;
    if (
      !eventInput.title ||
      !eventInput.description ||
      !eventInput.location ||
      !eventInput.date ||
      !eventInput.imageUrl ||
      !eventInput.nftImageUrl ||
      !eventInput.tiers
    ) {
      return NextResponse.json(
        { error: 'Invalid event data' },
        { status: 400 }
      );
    }

    // Validate tiers
    for (const tier of ['general', 'vip', 'backstage'] as const) {
      if (
        !eventInput.tiers[tier] ||
        typeof eventInput.tiers[tier].price !== 'number' ||
        typeof eventInput.tiers[tier].available !== 'number'
      ) {
        return NextResponse.json(
          { error: `Invalid ${tier} tier data` },
          { status: 400 }
        );
      }
    }

    const event = await createEvent(eventInput, organizerAddress, organizerName);

    return NextResponse.json(
      {
        success: true,
        event,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[v0] Create event error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    );
  }
}
