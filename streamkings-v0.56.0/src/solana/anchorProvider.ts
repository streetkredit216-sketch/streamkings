// anchorProvider.ts - Updated for Token-2022 compatible program

import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { Connection, Commitment, PublicKey } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import idl from "./idl.json";
import { PROGRAM_ID, SOLANA_RPC_URL, SOLANA_NETWORK, isProduction } from "./constants";

const opts = {
  preflightCommitment: "processed" as Commitment,
};

// Create connection based on environment
export function createConnection(): Connection {
  return new Connection(SOLANA_RPC_URL, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60000,
    wsEndpoint: SOLANA_RPC_URL.replace('https://', 'wss://'),
  });
}

// Create connection with fallback RPC handling
export function createConnectionWithFallback(): Connection {
  const connection = new Connection(SOLANA_RPC_URL, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60000,
  });
  
  return connection;
}

export function getProgram(wallet: WalletContextState, connection: Connection) {
  if (!wallet?.publicKey || !wallet?.signTransaction || !wallet?.signAllTransactions) {
    throw new Error("Invalid wallet adapter passed to getProgram");
  }

  // Create a provider with the wallet adapter
  const provider = new AnchorProvider(connection, wallet as any, opts);
  
  // Create the program instance with the provider and proper IDL
  const program = new Program(idl as any, provider);

  return program;
}

// Log environment configuration for debugging
if (typeof window !== 'undefined') {
  console.log('🌍 Solana Configuration:', {
    rpcUrl: SOLANA_RPC_URL,
    network: SOLANA_NETWORK,
    isProduction,
    platformWallet: process.env.NEXT_PUBLIC_PLATFORM_WALLET
  });
}
