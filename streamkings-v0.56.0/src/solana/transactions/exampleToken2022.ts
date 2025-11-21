// exampleToken2022.ts - Example of proper Token-2022 usage

import * as anchor from '@coral-xyz/anchor';
import { PublicKey, Connection, Transaction } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { 
  getToken2022Ata, 
  createToken2022AtaInstruction, 
  verifyToken2022Mint,
  debugToken2022Setup,
  getToken2022ProgramId
} from '../token2022';
import { STREET_CREDIT_MINT, CONFIG_ACCOUNT, FEE_WALLET, PLATFORM_WALLET } from '../constants';
import { getProgram } from '../anchorProvider';

interface Token2022TransactionParams {
  connection: Connection;
  wallet: WalletContextState;
  fromWallet: PublicKey;
  toWallet: PublicKey;
  amount?: number;
}

/**
 * Example: Create a blog post using Token-2022
 * This shows the complete flow with proper ATA handling
 */
export async function createBlogWithToken2022({
  connection,
  wallet,
  fromWallet,
  toWallet,
  amount = 20000000000 // 20 tokens
}: Token2022TransactionParams): Promise<string> {
  console.log('🚀 [Token-2022 Example] Starting createBlog transaction');

  if (!wallet?.publicKey || !wallet?.signTransaction || !wallet?.signAllTransactions) {
    throw new Error('Invalid wallet: missing adapter or not connected');
  }

  // Step 1: Verify the mint is using Token-2022
  const isToken2022 = await verifyToken2022Mint(connection, STREET_CREDIT_MINT);
  if (!isToken2022) {
    throw new Error('Mint is not using Token-2022 program');
  }

  // Step 2: Get all required ATAs using Token-2022
  console.log('📋 [Token-2022 Example] Getting ATAs...');
  
  const fromTokenAccount = await getToken2022Ata(STREET_CREDIT_MINT, fromWallet);
  const toTokenAccount = await getToken2022Ata(STREET_CREDIT_MINT, toWallet);
  const feeTokenAccount = await getToken2022Ata(STREET_CREDIT_MINT, FEE_WALLET);
  const platformTokenAccount = await getToken2022Ata(STREET_CREDIT_MINT, PLATFORM_WALLET);

  // Step 3: Debug logging
  await debugToken2022Setup(STREET_CREDIT_MINT, fromWallet, fromTokenAccount);

  // Step 4: Create transaction
  const transaction = new Transaction();

  // Step 5: Check and create ATAs if they don't exist
  console.log('🔍 [Token-2022 Example] Checking ATA existence...');
  
  const fromInfo = await connection.getAccountInfo(fromTokenAccount);
  if (!fromInfo) {
    console.log('➕ [Token-2022 Example] Creating from ATA...');
    transaction.add(await createToken2022AtaInstruction(STREET_CREDIT_MINT, fromWallet, wallet.publicKey));
  }

  const toInfo = await connection.getAccountInfo(toTokenAccount);
  if (!toInfo) {
    console.log('➕ [Token-2022 Example] Creating to ATA...');
    transaction.add(await createToken2022AtaInstruction(STREET_CREDIT_MINT, toWallet, wallet.publicKey));
  }

  const feeInfo = await connection.getAccountInfo(feeTokenAccount);
  if (!feeInfo) {
    console.log('➕ [Token-2022 Example] Creating fee ATA...');
    transaction.add(await createToken2022AtaInstruction(STREET_CREDIT_MINT, FEE_WALLET, wallet.publicKey));
  }

  const platformInfo = await connection.getAccountInfo(platformTokenAccount);
  if (!platformInfo) {
    console.log('➕ [Token-2022 Example] Creating platform ATA...');
    transaction.add(await createToken2022AtaInstruction(STREET_CREDIT_MINT, PLATFORM_WALLET, wallet.publicKey));
  }

  // Step 6: Get the program and create instruction
  const program = getProgram(wallet, connection);
  const tokenProgramId = getToken2022ProgramId();

  console.log('🎯 [Token-2022 Example] Creating platform_action instruction...');
  console.log('  Program ID:', program.programId.toBase58());
  console.log('  Token Program:', tokenProgramId.toBase58());
  console.log('  Amount:', amount);

  const createBlogIx = await program.methods
    .platform_action("blog", new anchor.BN(amount))
    .accounts({
      from: fromTokenAccount,
      platform_wallet: toTokenAccount,
      fee_wallet: feeTokenAccount,
      config: CONFIG_ACCOUNT,
      mint: STREET_CREDIT_MINT,
      authority: wallet.publicKey,
      token_program: tokenProgramId // ✅ Always use Token-2022 program ID
    })
    .instruction();

  transaction.add(createBlogIx);

  // Step 7: Send and confirm transaction
  console.log('📤 [Token-2022 Example] Sending transaction...');
  const signature = await wallet.sendTransaction(transaction, connection);
  console.log('✅ [Token-2022 Example] Transaction sent:', signature);

  // Wait for confirmation
  const confirmation = await connection.confirmTransaction(signature);
  if (confirmation.value.err) {
    throw new Error('Transaction failed to confirm');
  }

  console.log('🎉 [Token-2022 Example] Transaction confirmed:', signature);
  return signature;
}

/**
 * Example: Follow a user using Token-2022
 * Shows user-to-user action with proper ATA handling
 */
export async function followWithToken2022({
  connection,
  wallet,
  fromWallet,
  toWallet,
  amount = 100000000000 // 100 tokens
}: Token2022TransactionParams): Promise<string> {
  console.log('👥 [Token-2022 Example] Starting follow transaction');

  if (!wallet?.publicKey || !wallet?.signTransaction || !wallet?.signAllTransactions) {
    throw new Error('Invalid wallet: missing adapter or not connected');
  }

  // Verify Token-2022 mint
  const isToken2022 = await verifyToken2022Mint(connection, STREET_CREDIT_MINT);
  if (!isToken2022) {
    throw new Error('Mint is not using Token-2022 program');
  }

  // Get ATAs
  const fromTokenAccount = await getToken2022Ata(STREET_CREDIT_MINT, fromWallet);
  const toTokenAccount = await getToken2022Ata(STREET_CREDIT_MINT, toWallet);
  const feeTokenAccount = await getToken2022Ata(STREET_CREDIT_MINT, FEE_WALLET);

  // Debug setup
  await debugToken2022Setup(STREET_CREDIT_MINT, fromWallet, fromTokenAccount);

  const transaction = new Transaction();

  // Check and create ATAs
  const accounts = [
    { ata: fromTokenAccount, owner: fromWallet, name: 'from' },
    { ata: toTokenAccount, owner: toWallet, name: 'to' },
    { ata: feeTokenAccount, owner: FEE_WALLET, name: 'fee' }
  ];

  for (const { ata, owner, name } of accounts) {
    const info = await connection.getAccountInfo(ata);
    if (!info) {
      console.log(`➕ [Token-2022 Example] Creating ${name} ATA...`);
      transaction.add(await createToken2022AtaInstruction(STREET_CREDIT_MINT, owner, wallet.publicKey));
    }
  }

  // Create instruction
  const program = getProgram(wallet, connection);
  const tokenProgramId = getToken2022ProgramId();

  const followIx = await program.methods
    .user_action("follow", new anchor.BN(amount))
    .accounts({
      from: fromTokenAccount,
      receiver_wallet: toTokenAccount,
      fee_wallet: feeTokenAccount,
      config: CONFIG_ACCOUNT,
      mint: STREET_CREDIT_MINT,
      authority: wallet.publicKey,
      token_program: tokenProgramId // ✅ Always use Token-2022 program ID
    })
    .instruction();

  transaction.add(followIx);

  // Send transaction
  console.log('📤 [Token-2022 Example] Sending follow transaction...');
  const signature = await wallet.sendTransaction(transaction, connection);
  console.log('✅ [Token-2022 Example] Follow transaction sent:', signature);

  const confirmation = await connection.confirmTransaction(signature);
  if (confirmation.value.err) {
    throw new Error('Follow transaction failed to confirm');
  }

  console.log('🎉 [Token-2022 Example] Follow transaction confirmed:', signature);
  return signature;
}

/**
 * Helper function to check if an account exists
 */
export async function checkAccountExists(connection: Connection, address: PublicKey): Promise<boolean> {
  const info = await connection.getAccountInfo(address);
  return info !== null;
}

/**
 * Helper function to get account info with debug logging
 */
export async function getAccountInfoWithDebug(connection: Connection, address: PublicKey, name: string) {
  console.log(`🔍 [Token-2022 Example] Checking ${name} account:`, address.toBase58());
  
  const info = await connection.getAccountInfo(address);
  
  if (info) {
    console.log(`✅ [Token-2022 Example] ${name} account exists:`, {
      address: address.toBase58(),
      owner: info.owner.toBase58(),
      lamports: info.lamports,
      dataLength: info.data.length
    });
  } else {
    console.log(`❌ [Token-2022 Example] ${name} account does not exist:`, address.toBase58());
  }
  
  return info;
}
