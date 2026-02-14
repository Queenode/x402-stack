import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Ticket, Event } from './types';

interface WalletState {
  // Wallet connection - no private keys, just the connected address
  address: string | null;
  walletId: string | null; // Internal identifier for the connection
  network: 'mainnet' | 'testnet';

  // Local data cache
  tickets: Ticket[];
  events: Event[];

  // Actions
  setWallet: (walletId: string, address: string) => void;
  clearWallet: () => void;
  addTicket: (ticket: Ticket) => void;
  updateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  addEvent: (event: Event) => void;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      walletId: null,
      network: 'testnet',
      tickets: [],
      events: [],
      setWallet: (walletId, address) =>
        set({ walletId, address }),
      clearWallet: () =>
        set({ walletId: null, address: null, tickets: [], events: [] }),
      addTicket: (ticket) =>
        set((state) => ({
          tickets: [...state.tickets, ticket],
        })),
      updateTicket: (ticketId, updates) =>
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId ? { ...t, ...updates } : t
          ),
        })),
      addEvent: (event) =>
        set((state) => ({
          events: [...state.events, event],
        })),
      updateEvent: (eventId, updates) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId ? { ...e, ...updates } : e
          ),
        })),
    }),
    { name: 'partystacker-wallet' }
  )
);
