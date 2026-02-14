'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWalletStore } from './store';

/**
 * Hook for connecting to Stacks wallets (Leather, Xverse, etc.)
 * Uses the official @stacks/connect library (v8+).
 *
 * Flow:
 *   1. connect() opens the wallet popup via @stacks/connect
 *   2. User approves in Leather wallet
 *   3. We get STX address from the response or localStorage
 *   4. Address is persisted in zustand store
 */
export function useStacksWallet() {
  const { address, setWallet, clearWallet } = useWalletStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // On mount, check if already connected via @stacks/connect localStorage
  useEffect(() => {
    if (address) return; // Already connected via store

    try {
      // @stacks/connect stores connection data in localStorage
      const stored = localStorage.getItem('stacks-connect');
      if (stored) {
        const data = JSON.parse(stored);
        const stxAddr =
          data?.addresses?.stx?.[0]?.address ||
          data?.addresses?.stacks?.[0]?.address;
        if (stxAddr) {
          setWallet(`stacks-connect-${stxAddr}`, stxAddr);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [address, setWallet]);

  const connectWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (typeof window === 'undefined') {
        throw new Error('Window object not available');
      }

      // Dynamically import @stacks/connect to avoid SSR issues
      // (it accesses window/document internally)
      const stacksConnect = await import('@stacks/connect');

      // Check if already connected
      if (stacksConnect.isConnected()) {
        const stored = stacksConnect.getLocalStorage();
        const stxAddr =
          stored?.addresses?.stx?.[0]?.address ||
          stored?.addresses?.stacks?.[0]?.address;
        if (stxAddr) {
          console.log('[PartyStacker] Already connected:', stxAddr);
          setWallet(`stacks-connect-${stxAddr}`, stxAddr);
          setLoading(false);
          return stxAddr;
        }
      }

      // Call connect() which opens the wallet popup
      // In @stacks/connect v8+, connect() is an alias for
      // request('getAddresses', { forceWalletSelect: true })
      const response = await stacksConnect.connect();

      // Extract STX address from the response
      let walletAddress: string | null = null;

      if (response && response.addresses) {
        // response.addresses has { stx: [...], btc: [...] }
        const stxAddresses = response.addresses.stx || response.addresses.stacks || [];
        if (stxAddresses.length > 0) {
          walletAddress = stxAddresses[0].address;
        }
      }

      // Fallback: try getLocalStorage if response parsing fails
      if (!walletAddress) {
        const stored = stacksConnect.getLocalStorage();
        if (stored?.addresses) {
          const stxAddr =
            stored.addresses.stx?.[0]?.address ||
            stored.addresses.stacks?.[0]?.address;
          walletAddress = stxAddr || null;
        }
      }

      if (!walletAddress) {
        throw new Error(
          'Could not get STX address from wallet. Please make sure you have Leather Wallet installed and have a Stacks account.'
        );
      }

      console.log('[PartyStacker] Connected wallet:', walletAddress);
      setWallet(`stacks-connect-${walletAddress}`, walletAddress);
      setLoading(false);
      return walletAddress;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to connect wallet';
      console.error('[PartyStacker] Wallet connection error:', err);

      // Provide helpful error messages
      if (errorMessage.includes('No wallet found') || errorMessage.includes('provider')) {
        setError(
          'No Stacks wallet found. Please install the Leather Wallet extension from leather.io'
        );
      } else if (errorMessage.includes('User rejected') || errorMessage.includes('cancelled')) {
        setError('Wallet connection was cancelled by user');
      } else {
        setError(errorMessage);
      }

      setLoading(false);
      return null;
    }
  }, [setWallet]);

  const disconnectWallet = useCallback(async () => {
    try {
      // Dynamically import to avoid SSR issues
      const stacksConnect = await import('@stacks/connect');
      stacksConnect.disconnect();
    } catch {
      // Ignore if disconnect fails
    }

    clearWallet();
    setError(null);
  }, [clearWallet]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    address,
    isConnected: !!address,
    connect: connectWallet,
    disconnect: disconnectWallet,
    error,
    clearError,
    loading,
  };
}
