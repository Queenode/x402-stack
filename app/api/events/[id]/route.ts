import { NextRequest, NextResponse } from 'next/server';
import { getEventById } from '@/lib/db';

import { fetchEventFromChain } from '@/lib/stacks-api';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    let event;
    if (id.startsWith('chain-')) {
       const chainId = parseInt(id.replace('chain-', ''), 10);
       if (!isNaN(chainId)) {
         event = await fetchEventFromChain(chainId);
       }
    } else {
       event = await getEventById(id);
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event, { status: 200 });
  } catch (error: any) {
    console.error('[v0] Get event error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch event' },
      { status: 500 }
    );
  }
}
