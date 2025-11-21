// buySong.ts - Updated for uniform_token_actions program

import * as anchor from '@coral-xyz/anchor';
import { PublicKey, Connection, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import {
  getToken2022Ata,
  createToken2022AtaInstruction,
} from '../token2022';
import * as sha256 from 'js-sha256';
import { PROGRAM_ID, STREET_CREDIT_MINT, CONFIG_ACCOUNT, FEE_WALLET, PLATFORM_WALLET, TOKEN_2022_PROGRAM_ID } from '../constants';
import { getProgram } from '../anchorProvider';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Helper function to get correct discriminators from IDL
function getDiscriminator(ixName: string): Buffer {
  const discriminators: { [key: string]: number[] } = {
    'user_action': [65, 153, 189, 186, 250, 208, 56, 246],
    'platform_action': [64, 10, 211, 207, 118, 161, 170, 243]
  };
  
  const discriminator = discriminators[ixName];
  if (!discriminator) {
    throw new Error(`Unknown instruction: ${ixName}`);
  }
  
  return Buffer.from(discriminator);
}

// Constants
const TOKEN_PROGRAM_STR = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

interface BuySongParams {
  connection: Connection;
  wallet: WalletContextState;
  fromWallet: PublicKey;
  toWallet: PublicKey;
  amount?: number; // Amount in lamports (smallest unit)
}

export async function buySong({
  connection,
  wallet,
  fromWallet,
  toWallet,
  amount = 1000000 // Default amount: 1 token (assuming 6 decimals)
}: BuySongParams): Promise<string> {
  if (!wallet?.publicKey || !wallet?.signTransaction || !wallet?.signAllTransactions) {
    throw new Error('Invalid wallet: missing adapter or not connected');
  }

  if (!fromWallet || !toWallet) {
    throw new Error('Missing required wallet parameters');
  }

  if (!STREET_CREDIT_MINT || !(STREET_CREDIT_MINT instanceof PublicKey)) {
    throw new Error('Invalid STREET_CREDIT_MINT');
  }


  try {
    // Get the associated token accounts using Token-2022 helpers
    const fromTokenAccount = await getToken2022Ata(STREET_CREDIT_MINT, fromWallet);
    const toTokenAccount = await getToken2022Ata(STREET_CREDIT_MINT, toWallet);
    const feeTokenAccount = await getToken2022Ata(STREET_CREDIT_MINT, FEE_WALLET);

    const transaction = new Transaction();
    
    // Set up transaction properly like createBlog
    transaction.feePayer = wallet.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    // Check and create token accounts if they don't exist using Token-2022 helpers
    const checkAndAddCreateAta = async (ata: PublicKey, owner: PublicKey) => {
      const info = await connection.getAccountInfo(ata);
      if (!info) {
        if (!wallet.publicKey) throw new Error('Wallet public key is null');
        transaction.add(await createToken2022AtaInstruction(STREET_CREDIT_MINT, owner, wallet.publicKey));
      }
    };

    await checkAndAddCreateAta(fromTokenAccount, fromWallet);
    await checkAndAddCreateAta(toTokenAccount, toWallet);
    await checkAndAddCreateAta(feeTokenAccount, FEE_WALLET);

    // Manual instruction construction to avoid Interface type issues
    const discriminator = getDiscriminator("user_action");
    const actionStr = "tip";
    const actionBuf = Buffer.from(actionStr, "utf8");
    const actionLen = Buffer.alloc(4);
    actionLen.writeUInt32LE(actionBuf.length, 0);
    const amountBuf = new anchor.BN(amount).toArrayLike(Buffer, "le", 8);
    
    const instructionData = Buffer.concat([
      discriminator,
      actionLen,
      actionBuf,
      amountBuf
    ]);

    const tipIx = new TransactionInstruction({
      keys: [
        { pubkey: fromTokenAccount, isSigner: false, isWritable: true },      // from
        { pubkey: toTokenAccount, isSigner: false, isWritable: true },       // receiver_wallet
        { pubkey: feeTokenAccount, isSigner: false, isWritable: true },      // fee_wallet
        { pubkey: CONFIG_ACCOUNT, isSigner: false, isWritable: true },       // config
        { pubkey: STREET_CREDIT_MINT, isSigner: false, isWritable: false },  // mint
        { pubkey: wallet.publicKey, isSigner: true, isWritable: false },     // authority
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
      ],
      programId: PROGRAM_ID,
      data: instructionData,
    });

    transaction.add(tipIx);

    // Simulate transaction
    const simulation = await connection.simulateTransaction(transaction);
    if (simulation.value.err) {
      throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
    }

    const signature = await wallet.sendTransaction(transaction, connection);

    // Wait for transaction confirmation
    const confirmation = await connection.confirmTransaction(signature);
    
    if (confirmation.value.err) {
      throw new Error('Transaction failed to confirm');
    }

    return signature;

  } catch (error) {
    // Only log error type, not sensitive details
    if (error instanceof Error) {
      console.error('[BuySong] Transaction failed:', error.message);
    }
    throw error;
  }
}
