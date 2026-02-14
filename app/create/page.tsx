'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Wallet, Calendar, MapPin, Zap, Image as ImageIcon, Ticket } from 'lucide-react';
import { useStacksWallet } from '@/lib/useStacksWallet';
import type { CreateEventInput } from '@/lib/types';
import Image from 'next/image';
import { openContractCall } from '@stacks/connect';
import { uintCV, stringAsciiCV } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'ST1B27X06M4SF2TE46G3VBA7KSR4KBMJCTK862QET';
const CONTRACT_NAME = process.env.NEXT_PUBLIC_CONTRACT_NAME || 'party-stacker-contract';

export default function CreatePage() {
  const router = useRouter();
  const { address, connect, isConnected, error: walletError, loading: walletLoading } = useStacksWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'connect' | 'form'>(isConnected ? 'form' : 'connect');

  // Success Modal State
  const [success, setSuccess] = useState(false);
  const [txId, setTxId] = useState('');

  const [formData, setFormData] = useState<CreateEventInput>({
    title: '',
    description: '',
    location: '',
    date: Date.now(),
    imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14',
    nftImageUrl: 'https://images.unsplash.com/photo-1622737133809-d95047b9e673',
    tiers: {
      general: { price: 50, available: 500 },
      vip: { price: 150, available: 100 },
      backstage: { price: 500, available: 20 },
    },
  });

  const handleConnectWallet = async () => {
    setError('');
    try {
      await connect();
      setStep('form');
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    }
  };

  const handleInputChange = (field: keyof CreateEventInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTierChange = (
    tier: 'general' | 'vip' | 'backstage',
    field: 'price' | 'available',
    value: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        [tier]: {
          ...prev.tiers[tier],
          [field]: value,
        },
      },
    }));
  };

  const handleCreateEvent = async () => {
    setError('');
    setLoading(true);

    if (!formData.title || !formData.description || !formData.location || !formData.date || !formData.imageUrl) {
      setError('Please fill in all required fields (including Image URL)');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: formData,
          organizerAddress: address,
          organizerName: formData.title, // In real app, prompt for organizer name separately
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      // 2. Trigger Blockchain Transaction
      const metadataUri = data.event.metadataUri || `ipfs://simulated-${data.event.id}`;

      await openContractCall({
        network: new StacksTestnet(),
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'create-event',
        functionArgs: [
          stringAsciiCV(formData.title),
          stringAsciiCV(metadataUri),
          uintCV(formData.tiers.general.price * 1_000_000),
          uintCV(formData.tiers.general.available),
          uintCV(formData.tiers.vip.price * 1_000_000),
          uintCV(formData.tiers.vip.available),
          uintCV(formData.tiers.backstage.price * 1_000_000),
          uintCV(formData.tiers.backstage.available)
        ],
        onFinish: (txData) => {
          console.log('[PartyStacker] Contract Call Sent:', txData);
          setTxId(txData.txId);
          setLoading(false);
          setSuccess(true);
        },
        onCancel: () => {
          console.log('User cancelled contract call');
          setLoading(false);
          // Optional: Delete the off-chain event? Or leave it as "draft"?
        }
      });

    } catch (err: any) {
      console.error('[v0] Create event error:', err);
      setError(err.message || 'Failed to create event');
      setLoading(false);
    }
  };

  // Render Success Modal
  if (success) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none fixed">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[120px]" />
        </div>

        <Card className="shiny-card p-8 max-w-md w-full text-center space-y-6 border-green-500/30 bg-slate-900/90 backdrop-blur relative z-10">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-500">
            <Zap className="w-10 h-10 text-green-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Event Created!</h2>
            <p className="text-slate-400">
              Your transaction has been broadcast to the Stacks network.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-white/5 break-all">
            <p className="text-xs text-slate-500 mb-1">Transaction ID</p>
            <p className="text-xs font-mono text-orange-400 select-all">{txId}</p>
          </div>

          <p className="text-sm text-slate-500">
            Please allow a few minutes for the transaction to be confirmed on-chain.
            Your event will appear on the dashboard once confirmed.
          </p>

          <Link href="/">
            <Button className="w-full bg-green-500 hover:bg-green-600 font-bold h-12 shadow-lg shadow-green-500/20 transition-all hover:scale-[1.02]">
              Go to Dashboard
            </Button>
          </Link>
        </Card>
      </main>
    );
  }

  if (step === 'connect' || !isConnected) {
    return (
      <main className="min-h-screen bg-slate-950 relative flex items-center justify-center p-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <Link href="/" className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/30 mb-4 transition-transform hover:scale-105">
                <Wallet className="w-8 h-8 text-white" />
              </Link>
              <h1 className="text-4xl font-bold text-white tracking-tight">Create Event</h1>
              <p className="text-slate-400">
                Launch your blockchain-powered event on Stacks
              </p>
            </div>

            <Card className="shiny-card p-8 space-y-6 border-transparent">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Connect Wallet</h2>
                <p className="text-sm text-slate-400">
                  Connect your Leather Wallet to start creating events.
                </p>

                {walletError && (
                  <div className="bg-red-900/20 border border-red-800 text-red-300 p-3 rounded-lg text-sm">
                    {walletError}
                  </div>
                )}

                {error && (
                  <div className="bg-red-900/20 border border-red-800 text-red-300 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleConnectWallet}
                  disabled={walletLoading}
                  size="lg"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium h-12 shadow-lg shadow-orange-500/20"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  {walletLoading ? 'Connecting...' : 'Connect Wallet'}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  Need Leather Wallet? <a href="https://leather.io" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">Install here</a>
                </p>
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 border-white/5 bg-slate-900/40 text-center">
                <div className="text-2xl mb-2">🔐</div>
                <p className="text-xs text-slate-400 font-medium">Secure</p>
              </Card>
              <Card className="p-4 border-white/5 bg-slate-900/40 text-center">
                <div className="text-2xl mb-2">⚡</div>
                <p className="text-xs text-slate-400 font-medium">Zero Fees</p>
              </Card>
              <Card className="p-4 border-white/5 bg-slate-900/40 text-center">
                <div className="text-2xl mb-2">🎫</div>
                <p className="text-xs text-slate-400 font-medium">Verified</p>
              </Card>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 relative py-12 px-4 pt-32">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none fixed">
        <div className="absolute top-0 left-1/3 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto space-y-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="bg-transparent text-slate-400 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="space-y-2 mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">Create Your Event</h1>
          <p className="text-slate-400 text-lg">Set up your event with tiered ticket pricing on Stacks blockchain</p>
        </div>

        <Card className="shiny-card p-8 border-transparent space-y-8">
          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-8">
            {/* Basic Info Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2 space-y-3">
                <label className="text-sm font-medium text-slate-300">Event Title</label>
                <Input
                  placeholder="e.g., Winter Hackathon Demo"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Date & Time</label>
                <Input
                  type="datetime-local"
                  value={!isNaN(formData.date) ? new Date(formData.date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const dateObj = new Date(val);
                    if (!isNaN(dateObj.getTime())) {
                      handleInputChange('date', dateObj.getTime());
                    }
                  }}
                  className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Location</label>
                <Input
                  placeholder="City, Venue Name"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300">Description</label>
              <Textarea
                placeholder="Tell attendees about your event..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50 min-h-32"
              />
            </div>

            {/* Visuals Group */}
            <div className="space-y-6 pt-4 border-t border-white/5">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-orange-500" />
                Event Visuals
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">Event Banner URL</label>
                  <Input
                    placeholder="https://..."
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                    className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50"
                  />
                  {formData.imageUrl && (
                    <div className="relative h-32 w-full rounded-lg overflow-hidden border border-white/10 mt-2">
                      <Image
                        src={formData.imageUrl}
                        alt="Banner Preview"
                        fill
                        className="object-cover"
                        onError={(e) => {
                          // Fallback or error handling could go here
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">NFT Image URL</label>
                  <Input
                    placeholder="https://..."
                    value={formData.nftImageUrl}
                    onChange={(e) => handleInputChange('nftImageUrl', e.target.value)}
                    className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50"
                  />
                  {formData.nftImageUrl && (
                    <div className="relative h-32 w-32 rounded-lg overflow-hidden border border-white/10 mt-2">
                      <Image
                        src={formData.nftImageUrl}
                        alt="NFT Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tickets Group */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-orange-500" />
                Ticket Tiers
              </h3>

              {Object.entries(formData.tiers).map(([tier, data]) => (
                <div key={tier} className="p-4 rounded-xl bg-slate-900/40 border border-white/5 hover:border-orange-500/30 transition-colors space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white capitalize flex items-center gap-2">
                      {tier === 'vip' && <span className="text-yellow-500">★</span>}
                      {tier} Access
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-2 font-medium">Price (STX)</label>
                      <Input
                        type="number"
                        min="0"
                        value={isNaN(data.price) ? '' : data.price}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          handleTierChange(tier as any, 'price', isNaN(val) ? 0 : val);
                        }}
                        className="bg-slate-950/50 border-white/10 text-white h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-2 font-medium">Supply</label>
                      <Input
                        type="number"
                        min="1"
                        value={isNaN(data.available) ? '' : data.available}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          handleTierChange(tier as any, 'available', isNaN(val) ? 0 : val);
                        }}
                        className="bg-slate-950/50 border-white/10 text-white h-9"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleCreateEvent}
              disabled={loading || !isConnected}
              size="lg"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-14 shadow-lg shadow-orange-500/20 mt-6"
            >
              {loading ? 'Creating Event...' : 'Create Event'}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
