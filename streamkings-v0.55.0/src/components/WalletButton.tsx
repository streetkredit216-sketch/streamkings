'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import ClientOnly from './ClientOnly';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';

export default function WalletButton() {
  const { connected, publicKey, connecting } = useWallet();

  useEffect(() => {
    console.log('[WalletButton] Wallet state:', {
      connected,
      connecting,
      publicKey: publicKey?.toBase58()
    });
  }, [connected, connecting, publicKey]);

  return (
    <ClientOnly>
      <div className="wallet-button-container">
        <WalletMultiButton 
          className="wallet-btn"
          onClick={() => {
            console.log('[WalletButton] Wallet button clicked');
          }}
        />
      </div>
    </ClientOnly>
  );
} 