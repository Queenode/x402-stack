'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWalletStore } from './store';

/**
 * Hook for managing wallet state.
 * Actual connection logic is now handled by components/ConnectButton.tsx
 * to avoid SSR dynamic import issues with @stacks/connect.
 */
export function useStacksWallet() {
  const { address, setWallet, clearWallet } = useWalletStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // On mount, check if there's a stored session from stacks.js
  useEffect(() => {
    if (address || typeof window === 'undefined') return;

    try {
      // Check for Stacks user session in localStorage
      const sessionKey = 'blockstack-session';
      const stored = localStorage.getItem(sessionKey);
      
      if (stored) {
        const session = JSON.parse(stored);
        const userData = session?.userData;
        // Profile shape depends on Stacks/Blockstack version, but usually has stxAddress
        const stxAddr = userData?.profile?.stxAddress?.testnet || userData?.profile?.stxAddress?.mainnet;
        
        if (stxAddr) {
           setWallet(`stacks-connect-${stxAddr}`, stxAddr);
        }
      }
    } catch (e) {
      console.error('[PartyStacker] Failed to restore session', e);
    }
  }, [address, setWallet]);

  const connectWallet = useCallback(async () => {
    console.warn('[PartyStacker] usage of connect() from hook is deprecated. Use <ConnectButton /> component.');
    // No-op or throw
  }, []);

  const disconnectWallet = useCallback(() => {
    try {
      // Clear stacks session
      localStorage.removeItem('blockstack-session'); 
    } catch {}

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
