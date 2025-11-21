import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getStreetCreditBalance, isDevnet } from '@/solana/utils';
import { api } from '@/lib/api';

export function useStreetCredit() {
  console.log('[useStreetCredit] Hook initialized');
  
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useStreetCredit] Wallet state changed:', {
      connected,
      publicKey: publicKey?.toBase58()
    });
  }, [connected, publicKey]);

  const updateBalance = async () => {
    if (!publicKey) {
      console.log('[useStreetCredit] No public key available');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);

      const walletAddress = publicKey.toBase58();
      console.log('[useStreetCredit] Starting balance update for wallet:', walletAddress);

      // Check if we're on devnet (for development)
      if (isDevnet()) {
        console.log('[useStreetCredit] Using devnet - fetching balance from blockchain');
      } else {
        console.log('[useStreetCredit] Using mainnet - fetching balance from blockchain');
      }

      console.log('[useStreetCredit] Fetching token balance...');
      const newBalance = await getStreetCreditBalance(walletAddress);
      console.log('[useStreetCredit] Received balance:', newBalance);
      
      setBalance(newBalance);

      // Update the balance in the backend
      console.log('[useStreetCredit] Updating backend with new balance...');
      const response = await fetch(api.users.updateStreetCredit(walletAddress), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: newBalance }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useStreetCredit] Backend update failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Backend update failed: ${response.statusText} - ${errorText}`);
      }

      const updatedUser = await response.json();
      console.log('[useStreetCredit] Backend update successful:', updatedUser);
    } catch (error) {
      console.error('[useStreetCredit] Error in updateBalance:', error);
      if (error instanceof Error) {
        setError(`Failed to fetch Street Credit balance: ${error.message}`);
      } else {
        setError('Failed to fetch Street Credit balance');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update balance when wallet connects
  useEffect(() => {
    console.log('[useStreetCredit] Wallet connection effect triggered:', {
      hasPublicKey: !!publicKey,
      publicKey: publicKey?.toBase58()
    });
    
    if (publicKey) {
      console.log('[useStreetCredit] Wallet connected, updating balance...');
      updateBalance();
    }
  }, [publicKey]);

  // Poll for balance updates every 30 seconds
  useEffect(() => {
    if (!publicKey) {
      console.log('[useStreetCredit] No public key, skipping balance polling setup');
      return;
    }

    console.log('[useStreetCredit] Setting up balance polling...');
    const interval = setInterval(() => {
      console.log('[useStreetCredit] Polling for balance update...');
      updateBalance();
    }, 30000);
    
    return () => {
      console.log('[useStreetCredit] Cleaning up balance polling...');
      clearInterval(interval);
    };
  }, [publicKey]);

  return {
    balance,
    isLoading,
    error,
    updateBalance,
  };
} 