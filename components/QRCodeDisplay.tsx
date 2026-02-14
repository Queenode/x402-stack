'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Share2, Copy, CheckCircle2 } from 'lucide-react';
import type { Ticket, Event } from '@/lib/types';

interface QRCodeDisplayProps {
  ticket: Ticket;
  event: Event;
  qrCodeUrl: string;
}

export function QRCodeDisplay({
  ticket,
  event,
  qrCodeUrl,
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // Check navigator.share on client side only
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const handleDownload = async () => {
    try {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `ticket-${ticket.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('[PartyStacker] Download error:', error);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(ticket.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${event.title} Ticket`,
          text: `Check out my ticket for ${event.title}!`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('[PartyStacker] Share error:', error);
      }
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">{event.title}</h3>
          <p className="text-sm text-muted-foreground">
            {new Date(event.date).toLocaleDateString()} • {event.location}
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center bg-white p-6 rounded-lg border border-border">
          <Image
            src={qrCodeUrl || "/placeholder.svg"}
            alt="Ticket QR Code"
            width={300}
            height={300}
            className="max-w-xs"
          />
        </div>

        {/* Ticket Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Ticket ID</p>
            <p className="font-mono text-sm font-semibold break-all">{ticket.id}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Tier</p>
            <p className="font-semibold capitalize">{ticket.tier}</p>
          </div>
        </div>

        {/* x402 Protocol Badge */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3 rounded-lg text-sm">
          <p className="text-orange-700 dark:text-orange-300 text-xs font-mono">
            ⚡ Purchased via x402-stacks • TX: {ticket.purchaseTxHash?.slice(0, 16)}...
          </p>
        </div>

        {ticket.checkedIn && (
          <div className="bg-green-100 border border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-100 p-3 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Checked in on {new Date(ticket.checkinTime || 0).toLocaleString()}
          </div>
        )}

        {ticket.nftMinted && (
          <div className="bg-purple-100 border border-purple-300 text-purple-800 dark:bg-purple-900 dark:border-purple-700 dark:text-purple-100 p-3 rounded-lg text-sm">
            ✨ Attendance NFT minted: {ticket.nftTokenId}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 gap-2">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="w-full bg-transparent"
          >
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </Button>
          <Button
            onClick={handleCopyId}
            variant="outline"
            className="w-full bg-transparent"
          >
            {copied ? (
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copied ? 'Copied!' : 'Copy Ticket ID'}
          </Button>
          {canShare && (
            <Button
              onClick={handleShare}
              variant="outline"
              className="w-full bg-transparent"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Ticket
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
