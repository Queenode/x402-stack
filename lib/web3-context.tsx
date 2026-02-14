'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

interface LeatherWallet {
  request: (options: { method: string; params?: unknown[] }) => Promise<unknown>;
}

declare global {
  interface Window {
    LeatherProvider?: LeatherWallet;
  }
}

interface Web3ContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const connect = useCallback(async () => {
    try {
      setError(null);

      if (typeof window === 'undefined') {
        throw new Error('Window object not available');
      }

      const leatherProvider = (window as any).LeatherProvider;

      if (!leatherProvider) {
        throw new Error('Leather Wallet not found. Please install Leather Wallet extension.');
      }

      try {
        const accounts = (await leatherProvider.request({
          method: 'stx_requestAccounts',
        })) as string[];

        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts found in Leather Wallet');
        }

        setAddress(accounts[0]);
        setIsConnected(true);
      } catch (innerErr: any) {
        throw new Error(innerErr?.message || 'Failed to connect wallet');
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to connect wallet';

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const errObj = err as Record<string, unknown>;
        if (errObj.message) {
          errorMessage = String(errObj.message);
        }
      }

      console.error('[v0] Wallet connection error:', errorMessage);
      setError(errorMessage);
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    setError(null);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <Web3Context.Provider value={{ address, isConnected, connect, disconnect, error }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
