'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { SOLANA_RPC_URL, SOLANA_NETWORK } from '@/solana/constants';

// Import wallet adapter CSS
require('@solana/wallet-adapter-react-ui/styles.css');

interface Props {
  children: ReactNode;
}

const WalletProviderInner: FC<Props> = ({ children }) => {
  return <>{children}</>;
};

export const WalletProviderComponent: FC<Props> = ({ children }) => {
  // Use explicit network configuration from environment variables
  const network = useMemo(() => {
    if (SOLANA_NETWORK === 'mainnet-beta') {
      return WalletAdapterNetwork.Mainnet;
    } else if (SOLANA_NETWORK === 'devnet') {
      return WalletAdapterNetwork.Devnet;
    } else {
      // Default to mainnet if not specified
      return WalletAdapterNetwork.Mainnet;
    }
  }, []);

  const endpoint = useMemo(() => {
    // Prioritize the explicit RPC URL from environment variables
    const url = SOLANA_RPC_URL || clusterApiUrl(network);
    return url;
  }, [network]);
  
  const wallets = useMemo(
    () => {
      return [new PhantomWalletAdapter()];
    },
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletProviderInner>
            {children}
          </WalletProviderInner>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}; 