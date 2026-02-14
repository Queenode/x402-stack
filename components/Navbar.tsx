'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Ticket, BarChart3, QrCode, Wallet, Calendar } from 'lucide-react';
import { useStacksWallet } from '@/lib/useStacksWallet';

export function Navbar() {
    const { address, isConnected, connect, disconnect, loading: walletLoading } = useStacksWallet();

    return (
        <nav className="fixed w-full top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 dark:bg-orange-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                        ₿
                    </div>
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">PartyStacker</h1>
                </Link>

                <div className="flex items-center gap-3">
                    <Link href="/events">
                        <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Explore Events</span>
                        </Button>
                    </Link>

                    {isConnected && (
                        <>
                            <Link href="/my-tickets">
                                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                                    <Ticket className="w-4 h-4 mr-1" />
                                    <span className="hidden sm:inline">My Tickets</span>
                                </Button>
                            </Link>
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                                    <BarChart3 className="w-4 h-4 mr-1" />
                                    <span className="hidden sm:inline">Dashboard</span>
                                </Button>
                            </Link>
                            <Link href="/verify">
                                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                                    <QrCode className="w-4 h-4 mr-1" />
                                    <span className="hidden sm:inline">Verify</span>
                                </Button>
                            </Link>
                        </>
                    )}

                    {isConnected ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 hidden md:block">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={disconnect}
                                className="text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 bg-transparent"
                            >
                                Disconnect
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="sm"
                            onClick={connect}
                            disabled={walletLoading}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-medium"
                        >
                            <Wallet className="w-4 h-4 mr-1" />
                            {walletLoading ? 'Connecting...' : 'Connect Wallet'}
                        </Button>
                    )}

                    <Link href="/create">
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white font-medium">
                            Create Event
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
