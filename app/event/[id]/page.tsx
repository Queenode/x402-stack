'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TierSelector } from '@/components/TierSelector';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { ArrowLeft, Calendar, MapPin, Users, Zap, CheckCircle2, ExternalLink } from 'lucide-react';
import { useWalletStore } from '@/lib/store';
import { useStacksWallet } from '@/lib/useStacksWallet';
import { formatSTX, getExplorerURL, X402_HEADERS, encodePaymentHeader } from '@/lib/x402-client';
import type { Event, Ticket, TicketTier } from '@/lib/types';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ConnectButton = dynamic(() => import('@/components/ConnectButton'), { ssr: false });
// Imports removed (dynamic imports used instead)

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'ST1B27X06M4SF2TE46G3VBA7KSR4KBMJCTK862QET';
const CONTRACT_NAME = process.env.NEXT_PUBLIC_CONTRACT_NAME || 'party-stacker-contract';

export default function EventPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingTier, setPendingTier] = useState<TicketTier | null>(null);

  const { address } = useWalletStore();
  const { connect, isConnected, loading: walletLoading, error: walletError } = useStacksWallet();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch event');
        }

        setEvent(data);
      } catch (err) {
        console.error('[PartyStacker] Failed to fetch event:', err);
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleTierSelect = async (tier: TicketTier) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setPurchasing(true);
    setError('');
    setPendingTier(tier);

    try {
      // Step 1: First request — server responds with 402 + payment requirements
      const firstResponse = await fetch('/api/tickets/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          tier,
          buyerAddress: address,
        }),
      });

      const firstData = await firstResponse.json();

      if (firstResponse.status === 402) {
        // Got the x402 payment requirements — show them to the user
        setPaymentInfo(firstData);
        setShowPaymentModal(true);
        setPurchasing(false);
        return;
      }

      if (!firstResponse.ok) {
        throw new Error(firstData.error || 'Purchase failed');
      }

      // If we got here directly (shouldn't normally), set the ticket
      setTicket(firstData.ticket);
      setQrCodeUrl(firstData.ticket.qrCodeData);
    } catch (err: any) {
      console.error('[PartyStacker] Purchase error:', err);
      setError(err.message || 'Failed to purchase ticket');
      setPurchasing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!pendingTier || !address || !paymentInfo || !event) return;

    setPurchasing(true);
    setError('');

    try {
      // ── Step 2: Pay via Leather wallet using openContractCall (buy-ticket) ──
      // This calls the Contract to mint NFT and transfer funds

      // Calculate On-Chain Event ID
      let onChainId = 1;

      if (typeof eventId === 'string' && eventId.startsWith('chain-')) {
        const parsed = parseInt(eventId.replace('chain-', ''), 10);
        if (!isNaN(parsed)) onChainId = parsed;
      } else {
        try {
          const eventsRes = await fetch('/api/events');
          if (eventsRes.ok) {
            const allEvents: Event[] = await eventsRes.json();
            const eventIndex = allEvents.findIndex(e => e.id === eventId);
            if (eventIndex >= 0) onChainId = eventIndex + 1;
          }
        } catch (e) {
          console.warn('Failed to fetch fallback events', e);
        }
      }

      const tierIndex = pendingTier === 'general' ? 0 : pendingTier === 'vip' ? 1 : 2;

      const tierKey = pendingTier as keyof typeof event.tiers;
      const priceSTX = event.tiers[tierKey].price;
      const priceMicroSTX = Math.floor(priceSTX * 1_000_000);

      // Dynamically import Stacks libraries to avoid SSR build errors
      const { openContractCall } = await import('@stacks/connect');
      const { StacksTestnet } = await import('@stacks/network');
      const { uintCV, Pc } = await import('@stacks/transactions');

      const postCondition = Pc.principal(address)
        .willSendEq(priceMicroSTX)
        .ustx();

      console.log(`[PartyStacker] Buying Ticket for Event ${eventId} (On-Chain ID: ${onChainId}, Tier: ${tierIndex}) Price: ${priceMicroSTX} uSTX`);

      const txData = await new Promise<{ txId: string; txRaw?: string }>((resolve, reject) => {
        openContractCall({
          network: new StacksTestnet(),
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'buy-ticket',
          functionArgs: [uintCV(onChainId), uintCV(tierIndex)],
          postConditions: [postCondition],
          onFinish: (data) => {
            resolve({
              txId: data.txId,
              txRaw: data.txRaw,
            });
          },
          onCancel: () => {
            reject(new Error('Transaction was cancelled by user'));
          },
        });
      });

      const txId = txData.txId;
      const txRaw = txData.txRaw;

      if (!txId) {
        throw new Error('Transaction was not broadcast. Please try again.');
      }

      console.log('[PartyStacker] Contract Call broadcast:', txId);

      // ── Step 3: Send proof of payment to server ──
      const paymentRequirements = paymentInfo.accepts?.[0];

      // Build x402 V2 PaymentPayload with the real txId
      const paymentPayload = {
        x402Version: 2,
        resource: paymentInfo.resource || { url: `partystacker://event/${eventId}/ticket/${pendingTier}` },
        accepted: paymentRequirements || { asset: 'STX', amount: 0, network: 'testnet' },
        payload: {
          transaction: txId,
          txRaw: txRaw || undefined,
        },
      };

      const encodedPayment = encodePaymentHeader(paymentPayload);

      const response = await fetch('/api/tickets/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [X402_HEADERS.PAYMENT_SIGNATURE]: encodedPayment,
        },
        body: JSON.stringify({
          eventId,
          tier: pendingTier,
          buyerAddress: address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment verification failed');
      }

      setTicket(data.ticket);
      setQrCodeUrl(data.ticket.qrCodeData);
      setPaymentInfo(data.payment);
      setShowPaymentModal(false);
    } catch (err: any) {
      console.error('[PartyStacker] Payment error:', err);
      // Handle user cancellation specifically
      if (err.message?.includes('User rejected') || err.message?.includes('cancelled')) {
        setError('Transaction was cancelled');
      } else {
        setError(err.message || 'Failed to process payment');
      }
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-slate-300 dark:border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400">Event not found</p>
        <Link href="/">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">Back to Events</Button>
        </Link>
      </div>
    );
  }

  // Show the ticket after purchase
  if (ticket) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 p-4">
        <div className="max-w-2xl mx-auto py-8 space-y-6">
          <Link href="/">
            <Button variant="outline" className="mb-2 bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>

          {/* x402 Payment Confirmation Banner */}
          {paymentInfo && (
            <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-green-800 dark:text-green-200">
                    Payment Confirmed via x402-stacks
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {paymentInfo.amountFormatted} paid to organizer
                  </p>
                  {paymentInfo.transaction && (
                    <a
                      href={getExplorerURL(paymentInfo.transaction, 'testnet')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      View on Explorer <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <p className="text-xs text-green-600 dark:text-green-400 font-mono">
                    Protocol: x402 V2 • Network: Stacks Testnet
                  </p>
                </div>
              </div>
            </Card>
          )}

          <QRCodeDisplay ticket={ticket} event={event} qrCodeUrl={qrCodeUrl} />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navbar removed */}

      {/* Hero Banner with Blurred Background */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden bg-slate-900">
        {event.imageUrl && (
          <>
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover opacity-60 blur-sm scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
          </>
        )}

        <div className="absolute inset-0 flex flex-col justify-end pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <span className="bg-orange-600/90 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm">
                Live Event
              </span>
              <span className="text-slate-300 text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                Verified Organizer
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight drop-shadow-xl max-w-4xl">
              {event.title}
            </h1>

            <p className="text-lg md:text-xl text-slate-200 max-w-2xl font-light">
              Hosted by <span className="font-semibold text-white">{event.organizerName}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 space-y-8 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Details & Description */}
          <div className="lg:col-span-3 space-y-8">


            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Date</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {event.location}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Capacity</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {event.tiers ? Object.values(event.tiers).reduce((sum, t) => sum + t.available, 0) : 0} total tickets
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Description */}
            <Card className="p-6 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">About This Event</h2>
              <p className="text-slate-600 dark:text-slate-300">{event.description}</p>
            </Card>
            {/* Error and Purchase Section */}
            <div className="space-y-6 pt-8 border-t border-slate-100 dark:border-slate-800">
              {(error || walletError) && (
                <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <p className="text-red-700 dark:text-red-300 text-sm">{error || walletError}</p>
                </Card>
              )}

              {!isConnected ? (
                <Card className="p-8 text-center space-y-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Connect Wallet to Purchase</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Connect your Leather Wallet to buy tickets with STX via x402 protocol
                  </p>
                  <ConnectButton
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium"
                  >
                    Connect Leather Wallet
                  </ConnectButton>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Connected: <span className="font-mono text-xs">{address?.slice(0, 8)}...{address?.slice(-6)}</span></span>
                  </div>
                  {/* Width is now full main column, so Grid logic in TierSelector applies */}
                  <TierSelector event={event} onSelectTier={handleTierSelect} isLoading={purchasing} />
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-6 h-fit">

              {/* x402 Payment Modal */}
              {showPaymentModal && paymentInfo && (() => {
                const requirements = paymentInfo.accepts?.[0];
                const amountMicroSTX = requirements?.amount ? BigInt(requirements.amount) : BigInt(0);
                const amountSTX = Number(amountMicroSTX) / 1_000_000;
                return (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="max-w-md w-full p-6 space-y-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto">
                          <Zap className="w-8 h-8 text-orange-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          x402 Payment Required
                        </h3>
                        <p className="text-sm font-mono text-orange-600 dark:text-orange-400">
                          HTTP 402 • Stacks Blockchain
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400 text-sm">Description</span>
                          <span className="font-semibold text-slate-900 dark:text-white text-sm text-right max-w-[200px]">
                            {paymentInfo.resource?.description || 'Ticket Purchase'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400 text-sm">Asset</span>
                          <span className="font-semibold text-slate-900 dark:text-white text-sm">
                            {requirements?.asset || 'STX'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400 text-sm">Network</span>
                          <span className="font-semibold text-slate-900 dark:text-white text-sm">
                            {requirements?.network === 'stacks:1' ? 'Mainnet' : 'Testnet'}
                          </span>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-900 dark:text-white font-semibold">Total</span>
                            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {amountSTX} STX
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-xs space-y-1">
                          <p className="text-slate-500 dark:text-slate-400">Payment Protocol</p>
                          <p className="font-mono text-slate-700 dark:text-slate-300">
                            x402-stacks V2 • Scheme: {requirements?.scheme || 'exact'}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 mt-1">Pay To</p>
                          <p className="font-mono text-slate-700 dark:text-slate-300 break-all">
                            {requirements?.payTo || event.organizerAddress}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => {
                            setShowPaymentModal(false);
                            setPendingTier(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                          onClick={handleConfirmPayment}
                          disabled={purchasing}
                        >
                          {purchasing ? 'Processing...' : `Pay ${amountSTX} STX`}
                        </Button>
                      </div>
                    </Card>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </main >
  );
}
