// denounce.ts - Platform action for denouncing content

import * as anchor from '@coral-xyz/anchor';
import { PublicKey, Connection, Transaction, SystemProgram } from '@solana/web3.js';
import { 
  PROGRAM_ID, 
  STREET_CREDIT_MINT, 
  CONFIG_ACCOUNT, 
  FEE_WALLET, 
  PLATFORM_WALLET,
  TOKEN_2022_PROGRAM_ID 
} from '../constants';
import {
  getToken2022Ata,
  createToken2022AtaInstruction,
  debugToken2022Setup,
  getToken2022ProgramId
} from '../token2022';
import { getProgram } from '../anchorProvider';
import { WalletContextState } from '@solana/wallet-adapter-react';

interface DenounceParams {
  connection: Connection;
  wallet: WalletContextState;
  fromOwner: PublicKey;        // owner of sender ATA
  platformOwner: PublicKey;    // owner of platform ATA (where tokens go)
  feeOwner: PublicKey;         // owner of fee ATA (where fees go)
  configAccount: PublicKey;
}

export async function denounce({
  connection,
  wallet,
  fromOwner,
  platformOwner,
  feeOwner,
  configAccount
}: DenounceParams): Promise<string> {
  // Basic runtime guards
  if (!wallet?.publicKey || !wallet?.signTransaction || !wallet?.signAllTransactions) {
    throw new Error('Invalid wallet: missing adapter or not connected');
  }
  [fromOwner, platformOwner, feeOwner, configAccount, STREET_CREDIT_MINT, PROGRAM_ID].forEach((p, i) => {
    if (!p || !(p instanceof PublicKey)) {
      throw new Error(`Arg ${i} expected PublicKey but got ${String(p)}`);
    }
  });

  // 2. Quick sanity checks - Check mint decimals and owner
  const mintAcc = await connection.getParsedAccountInfo(STREET_CREDIT_MINT);

  try {
    // Verify mint and ownership
    const mintInfo = await connection.getAccountInfo(STREET_CREDIT_MINT);
    if (!mintInfo) throw new Error(`Mint ${STREET_CREDIT_MINT.toBase58()} not found on this network`);
    if (!mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
      throw new Error(`Mint is not owned by Token-2022 program (${TOKEN_2022_PROGRAM_ID.toBase58()})`);
    }

    // Resolve ATAs - use Token-2022 for both mint and accounts
    const fromTokenAccount = await getToken2022Ata(STREET_CREDIT_MINT, fromOwner);
    const platformTokenAccount = await getToken2022Ata(STREET_CREDIT_MINT, platformOwner);
    const feeTokenAccount = await getToken2022Ata(STREET_CREDIT_MINT, feeOwner);

    await debugToken2022Setup(STREET_CREDIT_MINT, fromOwner, fromTokenAccount);

    // Build transaction and create missing ATAs
    const tx = new Transaction();
    tx.feePayer = wallet.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    const checkAndAddCreateAta = async (ata: PublicKey, owner: PublicKey) => {
      const info = await connection.getAccountInfo(ata);
      if (!info) {
        if (!wallet.publicKey) throw new Error('Wallet public key is null');
        tx.add(await createToken2022AtaInstruction(STREET_CREDIT_MINT, owner, wallet.publicKey));
      }
    };

    await checkAndAddCreateAta(fromTokenAccount, fromOwner);
    await checkAndAddCreateAta(platformTokenAccount, platformOwner);
    await checkAndAddCreateAta(feeTokenAccount, feeOwner);

    // Use Anchor's proper methods instead of manual encoding
    const program = getProgram(wallet, connection);
    // Use Token-2022 program for the instruction since we're using Token-2022 accounts
    const tokenProgramId = getToken2022ProgramId();
    
    const platformActionTx = await program.methods
      .platformAction("denounce", new anchor.BN(20000000000))
      .accounts({
        from: fromTokenAccount,
        platformWallet: platformTokenAccount,
        feeWallet: feeTokenAccount,
        config: CONFIG_ACCOUNT, // Use imported constant instead of parameter
        mint: STREET_CREDIT_MINT,
        authority: wallet.publicKey,
        tokenProgram: tokenProgramId,
        systemProgram: SystemProgram.programId,
      })
      .transaction();
    
    // Add the instruction to our transaction
    tx.add(...platformActionTx.instructions);

    // Simulate
    const simulation = await connection.simulateTransaction(tx);
    if (simulation.value.err) {
      throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
    }

    // Send (wallet adapter)
    const signature = await wallet.sendTransaction(tx, connection);

    const confirmation = await connection.confirmTransaction(signature);
    if (confirmation.value.err) {
      throw new Error(`Transaction confirm failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    return signature;

  } catch (err) {
    // Only log error type, not sensitive details
    if (err instanceof Error) {
      console.error('[Denounce] Transaction failed:', err.message);
    }
    throw err;
  }
}

