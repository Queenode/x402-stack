'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import type { Event } from '@/lib/types';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'live':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'ended':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalTickets = () => {
    return Object.values(event.tiers).reduce((sum, tier) => sum + tier.sold, 0);
  };

  const getTotalAvailable = () => {
    return Object.values(event.tiers).reduce((sum, tier) => sum + tier.available, 0);
  };

  const eventDate = new Date(event.date);
  const isUpcoming = eventDate > new Date();

  return (
    <Link href={`/event/${event.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
          <Image
            src={event.imageUrl || "/placeholder.svg"}
            alt={event.title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          <div className="absolute top-3 right-3">
            <Badge className={getStatusColor(event.status)}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-lg line-clamp-2">{event.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {event.description}
            </p>
          </div>

          {/* Event Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{eventDate.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          </div>

          {/* Tier Info */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Ticket className="w-4 h-4" />
                <span>
                  {getTotalTickets()}/{getTotalAvailable()} sold
                </span>
              </div>
              <span className="font-semibold text-primary">
                From ${Math.min(...Object.values(event.tiers).map((t) => t.price))}
              </span>
            </div>
          </div>

          {/* Tier Badges */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(event.tiers).map(([tier, data]) => (
              data.available - data.sold > 0 && (
                <Badge key={tier} variant="secondary" className="text-xs">
                  {tier === 'backstage' ? '🎭' : tier === 'vip' ? '⭐' : '🎟️'} {tier}
                </Badge>
              )
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}
