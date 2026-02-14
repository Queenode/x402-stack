'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Ticket, Calendar, MapPin, Search } from 'lucide-react';
import type { Event } from '@/lib/types';
import { Input } from '@/components/ui/input';

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch('/api/events');
                const data = await response.json();
                setEvents(data || []);
            } catch (error) {
                console.error('[PartyStacker] Failed to fetch events:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organizerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="min-h-screen bg-slate-950 pt-32 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Explore Events</h1>
                        <p className="text-slate-400">Discover and book tickets for the hottest parties on Stacks.</p>
                    </div>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                            placeholder="Search events, organizers..."
                            className="pl-10 bg-slate-900 border-white/10 text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Events Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-8 h-8 border-2 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-500">Loading events...</p>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <Card className="p-12 text-center bg-slate-900/50 border-white/5 space-y-4">
                        <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
                        <p className="text-slate-400 text-lg">No events found matching your search.</p>
                        {events.length === 0 && (
                            <Link href="/create">
                                <Button className="mt-4 bg-orange-500 hover:bg-orange-600">Create First Event</Button>
                            </Link>
                        )}
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((event, index) => (
                            <Link
                                key={event.id}
                                href={`/event/${event.id}`}
                                className="group"
                            >
                                <Card className="shiny-card group overflow-hidden h-full border-white/5 bg-slate-900/50 hover:bg-slate-900 transition-colors">
                                    <div className="relative h-56 bg-slate-950 overflow-hidden">
                                        {event.imageUrl ? (
                                            <Image
                                                src={event.imageUrl}
                                                alt={event.title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                                <Ticket className="w-12 h-12 text-slate-700" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <span className="inline-block px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full mb-2 shadow-lg shadow-orange-500/20">
                                                {event.tiers?.general?.price ?? '?'} STX
                                            </span>
                                            <h3 className="text-xl font-bold text-white leading-tight mt-1 line-clamp-1 group-hover:text-orange-400 transition-colors">
                                                {event.title}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Organizer</p>
                                                <p className="text-sm text-slate-300 font-medium line-clamp-1">{event.organizerName || 'Anonymous'}</p>
                                            </div>
                                            {event.tiers?.general && (
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Available</p>
                                                    <p className="text-sm font-bold text-white">
                                                        {event.tiers.general.available - event.tiers.general.sold} <span className="text-slate-500">/</span> {event.tiers.general.available}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-white/5 flex justify-between items-center text-sm text-slate-400">
                                            <span className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-orange-500" />
                                                {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-orange-500" />
                                                {event.location?.split(',')[0]}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
