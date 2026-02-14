'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Crown, Zap, User } from 'lucide-react';
import type { Event, TicketTier } from '@/lib/types';

interface TierSelectorProps {
  event: Event;
  onSelectTier: (tier: TicketTier) => void;
  isLoading?: boolean;
}

export function TierSelector({
  event,
  onSelectTier,
  isLoading = false,
}: TierSelectorProps) {
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);

  const tiers = [
    {
      id: 'general' as const,
      name: 'General',
      icon: User,
      description: 'Standard admission',
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'vip' as const,
      name: 'VIP',
      icon: Zap,
      description: 'Priority entry + lounge access',
      color: 'from-amber-500 to-amber-600',
      borderColor: 'border-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      id: 'backstage' as const,
      name: 'Backstage',
      icon: Crown,
      description: 'VIP + meet & greet',
      color: 'from-pink-500 to-pink-600',
      borderColor: 'border-pink-400',
      bgColor: 'bg-pink-500/10',
    },
  ];

  const handleSelect = (tier: TicketTier) => {
    setSelectedTier(tier);
  };

  const handleContinue = () => {
    if (selectedTier) {
      onSelectTier(selectedTier);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Select Your Ticket Tier</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map(({ id, name, icon: Icon, description, color, borderColor, bgColor }) => {
          const tierData = event.tiers[id];
          const isAvailable = tierData.sold < tierData.available;
          const isSelected = selectedTier === id;

          return (
            <Card
              key={id}
              className={`relative overflow-hidden cursor-pointer transition-all transform hover:scale-[1.02] ${isSelected ? `border-2 ${borderColor} shadow-lg` : 'border border-slate-200 dark:border-slate-700'
                } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''} bg-white dark:bg-slate-900/50`}
              onClick={() => isAvailable && handleSelect(id)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5`} />
              <div className="relative p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">{name}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${bgColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xl text-orange-600 dark:text-orange-400">{tierData.price} STX</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {tierData.available - tierData.sold} left
                    </span>
                  </div>

                  {!isAvailable && (
                    <div className="text-xs text-red-600 font-semibold">
                      Sold Out
                    </div>
                  )}
                </div>

                {isSelected && (
                  <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 py-2 px-3 rounded text-sm font-semibold text-center">
                    ✓ Selected
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Button
        onClick={handleContinue}
        disabled={!selectedTier || isLoading}
        size="lg"
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold h-12"
      >
        {isLoading ? 'Processing Payment...' : selectedTier ? `Purchase ${selectedTier.toUpperCase()} Ticket` : 'Select a Tier'}
      </Button>
    </div>
  );
}
