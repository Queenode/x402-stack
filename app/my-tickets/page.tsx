'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { ArrowLeft, Ticket } from 'lucide-react';
import { useWalletStore } from '@/lib/store';
import type { Ticket as TicketType, Event } from '@/lib/types';

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [events, setEvents] = useState<Map<string, Event>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);

  const { address } = useWalletStore();

  useEffect(() => {
    const fetchTickets = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const ticketsResponse = await fetch(`/api/tickets?owner=${address}`);
        const ticketsData = await ticketsResponse.json();
        setTickets(ticketsData);

        // Fetch events for these tickets
        const eventsMap = new Map<string, Event>();
        for (const ticket of ticketsData) {
          if (!eventsMap.has(ticket.eventId)) {
            const eventResponse = await fetch(`/api/events/${ticket.eventId}`);
            const eventData = await eventResponse.json();
            eventsMap.set(ticket.eventId, eventData);
          }
        }
        setEvents(eventsMap);
      } catch (error) {
        console.error('[v0] Failed to fetch tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [address]);

  if (!address) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p>Please connect your wallet to view your tickets.</p>
        <Link href="/create">
          <Button>Set Up Wallet</Button>
        </Link>
      </div>
    );
  }

  if (selectedTicket) {
    const event = events.get(selectedTicket.eventId);
    if (!event) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading event...</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <div className="max-w-2xl mx-auto py-8">
          <Button
            variant="outline"
            onClick={() => setSelectedTicket(null)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Button>
          <QRCodeDisplay
            ticket={selectedTicket}
            event={event}
            qrCodeUrl={selectedTicket.qrCodeData}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navbar */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Ticket className="w-10 h-10 text-primary" />
              My Tickets
            </h1>
            <p className="text-slate-300 mt-2">
              View and manage your event tickets
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Loading your tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <Card className="p-12 text-center space-y-4">
              <Ticket className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
              <p className="text-slate-400 text-lg">No tickets yet</p>
              <p className="text-slate-500">
                Browse events and purchase tickets to see them here.
              </p>
              <Link href="/">
                <Button className="mt-4">Browse Events</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tickets.map((ticket) => {
                const event = events.get(ticket.eventId);
                // Check for valid event data (must have tiers)
                if (!event || !event.tiers || !event.tiers[ticket.tier]) return null;

                return (
                  <Card
                    key={ticket.id}
                    className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center justify-between py-3 border-y border-border">
                        <div>
                          <p className="text-xs text-muted-foreground">Tier</p>
                          <p className="font-semibold capitalize">{ticket.tier}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="font-semibold">
                            ${event.tiers[ticket.tier].price}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="font-semibold">
                            {ticket.checkedIn ? '✓ Checked In' : 'Active'}
                          </p>
                        </div>
                      </div>

                      {ticket.nftMinted && (
                        <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-100 p-2 rounded text-xs text-center font-semibold">
                          NFT Minted
                        </div>
                      )}

                      <Button className="w-full bg-transparent" variant="outline">
                        View QR Code
                      </Button>
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
