'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus, BarChart3, Users, DollarSign, Ticket } from 'lucide-react';
import { useWalletStore } from '@/lib/store';
import type { Event, EventAnalytics } from '@/lib/types';

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [analytics, setAnalytics] = useState<Map<string, EventAnalytics>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  const { address } = useWalletStore();

  useEffect(() => {
    const fetchEvents = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/events?organizer=${address}`);
        const data = await response.json();
        setEvents(data);

        // Fetch analytics for each event
        const analyticsMap = new Map<string, EventAnalytics>();
        for (const event of data) {
          try {
            const analyticsResponse = await fetch(
              `/api/analytics/${event.id}`
            );
            const analyticsData = await analyticsResponse.json();
            analyticsMap.set(event.id, analyticsData);
          } catch (error) {
            console.error('[v0] Failed to fetch analytics:', error);
          }
        }
        setAnalytics(analyticsMap);
      } catch (error) {
        console.error('[v0] Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [address]);

  if (!address) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p>Please connect your wallet to view your dashboard.</p>
        <Link href="/create">
          <Button>Set Up Wallet</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navbar */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <Link href="/create">
            <Button size="sm" className="bg-gradient-to-r from-amber-400 to-pink-500 text-slate-900 font-bold">
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-10 h-10 text-primary" />
              Event Dashboard
            </h1>
            <p className="text-slate-300 mt-2">
              Manage your events and view analytics
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Loading your events...</p>
            </div>
          ) : events.length === 0 ? (
            <Card className="p-12 text-center space-y-4">
              <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
              <p className="text-slate-400 text-lg">No events yet</p>
              <p className="text-slate-500">
                Create your first event to get started.
              </p>
              <Link href="/create">
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {events.map((event) => {
                const eventAnalytics = analytics.get(event.id);

                return (
                  <Card
                    key={event.id}
                    className="p-6 space-y-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Event Info */}
                      <div>
                        <h3 className="text-2xl font-bold">{event.title}</h3>
                        <p className="text-muted-foreground mt-1">
                          {event.description}
                        </p>
                        <div className="mt-4 space-y-2">
                          <p className="text-sm">
                            <span className="font-semibold">Date:</span>{' '}
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Location:</span>{' '}
                            {event.location}
                          </p>
                          <p className="text-sm capitalize">
                            <span className="font-semibold">Status:</span>{' '}
                            {event.status}
                          </p>
                        </div>
                      </div>

                      {/* Analytics */}
                      {eventAnalytics && (
                        <div className="grid grid-cols-2 gap-3">
                          <Card className="p-4 bg-slate-700/50">
                            <div className="flex items-center gap-2">
                              <Ticket className="w-5 h-5 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Tickets Sold
                                </p>
                                <p className="text-2xl font-bold">
                                  {eventAnalytics.totalTicketsSold}
                                </p>
                              </div>
                            </div>
                          </Card>

                          <Card className="p-4 bg-slate-700/50">
                            <div className="flex items-center gap-2">
                              <Users className="w-5 h-5 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Checked In
                                </p>
                                <p className="text-2xl font-bold">
                                  {eventAnalytics.checkedInCount}
                                </p>
                              </div>
                            </div>
                          </Card>

                          <Card className="p-4 bg-slate-700/50">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-5 h-5 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Revenue
                                </p>
                                <p className="text-2xl font-bold">
                                  ${eventAnalytics.totalRevenue.toFixed(0)}
                                </p>
                              </div>
                            </div>
                          </Card>

                          <Card className="p-4 bg-slate-700/50">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 text-primary">
                                <div className="text-lg">✨</div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  NFTs Minted
                                </p>
                                <p className="text-2xl font-bold">
                                  {eventAnalytics.nftsMinted}
                                </p>
                              </div>
                            </div>
                          </Card>
                        </div>
                      )}
                    </div>

                    {/* Tier Breakdown */}
                    {eventAnalytics && (
                      <div className="border-t border-border pt-4">
                        <h4 className="font-semibold mb-3">Tier Breakdown</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-slate-700/30 rounded">
                            <p className="text-xs text-muted-foreground">
                              General
                            </p>
                            <p className="font-bold">
                              {eventAnalytics.tierBreakdown.general}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-slate-700/30 rounded">
                            <p className="text-xs text-muted-foreground">VIP</p>
                            <p className="font-bold">
                              {eventAnalytics.tierBreakdown.vip}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-slate-700/30 rounded">
                            <p className="text-xs text-muted-foreground">
                              Backstage
                            </p>
                            <p className="font-bold">
                              {eventAnalytics.tierBreakdown.backstage}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/event/${event.id}`} className="flex-1">
                        <Button variant="outline" className="w-full bg-transparent">
                          View Event
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
