# Token-2022 Integration Guide

This guide shows how to properly integrate Token-2022 in your Solana dApp.

## Key Files Created/Updated

1. **`src/solana/token2022.ts`** - Token-2022 utility functions
2. **`src/solana/transactions/exampleToken2022.ts`** - Complete examples
3. **`src/solana/constants.ts`** - Updated with correct Token-2022 program ID
4. **`src/solana/transactions/createBlog.ts`** - Updated to use Token-2022 utilities

## Core Token-2022 Utilities

### 1. Get ATA Address
```typescript
import { getToken2022Ata } from '../token2022';

const ata = await getToken2022Ata(mint, owner);
```

### 2. Create ATA Instruction
```typescript
import { createToken2022AtaInstruction } from '../token2022';

const instruction = createToken2022AtaInstruction(mint, owner, payer);
```

### 3. Verify Token-2022 Mint
```typescript
import { verifyToken2022Mint } from '../token2022';

const isToken2022 = await verifyToken2022Mint(connection, mint);
```

### 4. Get Token-2022 Program ID
```typescript
import { getToken2022ProgramId } from '../token2022';

const tokenProgramId = getToken2022ProgramId();
```

## Complete Transaction Example

```typescript
import { 
  getToken2022Ata, 
  createToken2022AtaInstruction, 
  verifyToken2022Mint,
  debugToken2022Setup,
  getToken2022ProgramId
} from '../token2022';

export async function createBlogWithToken2022({
  connection,
  wallet,
  fromWallet,
  toWallet,
  amount = 20000000000
}: Token2022TransactionParams): Promise<string> {
  
  // Step 1: Verify Token-2022 mint
  const isToken2022 = await verifyToken2022Mint(connection, STREET_CREDIT_MINT);
  if (!isToken2022) {
    throw new Error('Mint is not using Token-2022 program');
  }

  // Step 2: Get ATAs using Token-2022
  const fromTokenAccount = await getToken2022Ata(STREET_CREDIT_MINT, fromWallet);
  const toTokenAccount = await getToken2022Ata(STREET_CREDIT_MINT, toWallet);
  const feeTokenAccount = await getToken2022Ata(STREET_CREDIT_MINT, FEE_WALLET);

  // Step 3: Debug logging
  await debugToken2022Setup(STREET_CREDIT_MINT, fromWallet, fromTokenAccount);

  // Step 4: Create transaction
  const transaction = new Transaction();

  // Step 5: Check and create ATAs
  const accounts = [
    { ata: fromTokenAccount, owner: fromWallet, name: 'from' },
    { ata: toTokenAccount, owner: toWallet, name: 'to' },
    { ata: feeTokenAccount, owner: FEE_WALLET, name: 'fee' }
  ];

  for (const { ata, owner, name } of accounts) {
    const info = await connection.getAccountInfo(ata);
    if (!info) {
      console.log(`➕ Creating ${name} ATA...`);
      transaction.add(createToken2022AtaInstruction(STREET_CREDIT_MINT, owner, wallet.publicKey));
    }
  }

  // Step 6: Create instruction with correct Token-2022 program ID
  const program = getProgram(wallet, connection);
  const tokenProgramId = getToken2022ProgramId();

  const instruction = await program.methods
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

  transaction.add(instruction);

  // Step 7: Send transaction
  const signature = await wallet.sendTransaction(transaction, connection);
  const confirmation = await connection.confirmTransaction(signature);
  
  if (confirmation.value.err) {
    throw new Error('Transaction failed to confirm');
  }

  return signature;
}
```

## Key Differences from Legacy SPL Token

### ❌ Wrong (Legacy SPL Token)
```typescript
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

// Wrong: Using legacy token program
const ata = await getAssociatedTokenAddress(mint, owner, false, TOKEN_PROGRAM_ID);

// Wrong: Using legacy program ID in instruction
.accounts({
  token_program: TOKEN_PROGRAM_ID
})
```

### ✅ Correct (Token-2022)
```typescript
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { getToken2022Ata, getToken2022ProgramId } from '../token2022';

// Correct: Using Token-2022 utilities
const ata = await getToken2022Ata(mint, owner);

// Correct: Using Token-2022 program ID
const tokenProgramId = getToken2022ProgramId();
.accounts({
  token_program: tokenProgramId
})
```

## Debug Logging

The utilities include comprehensive debug logging:

```typescript
// This will log:
// - Mint address and owner verification
// - ATA addresses for all accounts
// - Token-2022 program ID confirmation
// - Account existence checks
await debugToken2022Setup(mint, owner, ata);
```

## Migration Checklist

- [ ] Update all `getAssociatedTokenAddress` calls to use `getToken2022Ata`
- [ ] Update all `createAssociatedTokenAccountInstruction` calls to use `createToken2022AtaInstruction`
- [ ] Replace `TOKEN_PROGRAM_ID` with `getToken2022ProgramId()` in instruction accounts
- [ ] Add `verifyToken2022Mint` checks before transactions
- [ ] Add debug logging with `debugToken2022Setup`
- [ ] Test all transaction types with Token-2022

## Common Issues Fixed

1. **"Cannot use 'in' operator to search for 'option' in publicKey"**
   - Fixed by using correct Token-2022 program ID from `@solana/spl-token`
   - Fixed by using proper ATA creation with Token-2022 program

2. **CORS errors with RPC endpoints**
   - Fixed by using Helius RPC endpoint with CORS support

3. **Account name mismatches in IDL**
   - Fixed by updating IDL to use snake_case account names
   - Fixed by updating transaction calls to use correct account names

4. **Method name mismatches**
   - Fixed by updating IDL to use snake_case method names (`platform_action`, `user_action`)
   - Fixed by updating transaction calls to use correct method names

