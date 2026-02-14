import { NextRequest, NextResponse } from 'next/server';
import { getEventAnalytics } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const analytics = await getEventAnalytics(eventId);

    return NextResponse.json(analytics, { status: 200 });
  } catch (error: any) {
    console.error('[v0] Get analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
