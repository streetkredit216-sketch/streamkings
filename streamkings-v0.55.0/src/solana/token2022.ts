import { PublicKey, Connection } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID 
} from '@solana/spl-token';
import { TOKEN_2022_PROGRAM_ID } from './constants';

/**
 * Get the Associated Token Account (ATA) address for a Token-2022 mint
 * @param mint - The Token-2022 mint address
 * @param owner - The owner of the ATA
 * @returns Promise<PublicKey> - The ATA address
 */
export async function getToken2022Ata(mint: PublicKey, owner: PublicKey): Promise<PublicKey> {
  console.log('[Token-2022] Getting ATA for:', {
    mint: mint.toBase58(),
    owner: owner.toBase58(),
    tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58()
  });

  const ata = await getAssociatedTokenAddress(
    mint,
    owner,
    false, // allowOwnerOffCurve
    TOKEN_2022_PROGRAM_ID, // Use Token-2022 program
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  console.log('[Token-2022] ATA address:', ata.toBase58());
  return ata;
}

/**
 * Create an instruction to create an Associated Token Account for Token-2022
 * @param mint - The Token-2022 mint address
 * @param owner - The owner of the ATA
 * @param payer - The account that will pay for the creation
 * @returns Instruction to create the ATA
 */
export async function createToken2022AtaInstruction(
  mint: PublicKey,
  owner: PublicKey,
  payer: PublicKey
) {
  console.log('[Token-2022] Creating ATA instruction for:', {
    mint: mint.toBase58(),
    owner: owner.toBase58(),
    payer: payer.toBase58(),
    tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58()
  });

  const ata = await getToken2022Ata(mint, owner);
  
  return createAssociatedTokenAccountInstruction(
    payer, // payer
    ata, // ata
    owner, // owner
    mint, // mint
    TOKEN_2022_PROGRAM_ID, // Use Token-2022 program
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

/**
 * Verify that a mint is using Token-2022
 * @param connection - Solana connection
 * @param mint - The mint address to verify
 * @returns Promise<boolean> - True if using Token-2022
 */
export async function verifyToken2022Mint(connection: Connection, mint: PublicKey): Promise<boolean> {
  try {
    console.log('[Token-2022] Verifying mint:', mint.toBase58());
    
    const mintInfo = await connection.getAccountInfo(mint);
    if (!mintInfo) {
      console.error('[Token-2022] ❌ Mint account not found');
      return false;
    }

    const isToken2022 = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
    
    console.log('[Token-2022] Mint verification:', {
      mint: mint.toBase58(),
      owner: mintInfo.owner.toBase58(),
      isToken2022,
      expectedOwner: TOKEN_2022_PROGRAM_ID.toBase58()
    });

    if (isToken2022) {
      console.log('[Token-2022] ✅ Mint is using Token-2022');
    } else {
      console.error('[Token-2022] ❌ Mint is NOT using Token-2022');
    }

    return isToken2022;
  } catch (error) {
    console.error('[Token-2022] Error verifying mint:', error);
    return false;
  }
}

/**
 * Get the correct token program ID for Token-2022 operations
 * @returns PublicKey - The Token-2022 program ID
 */
export function getToken2022ProgramId(): PublicKey {
  console.log('[Token-2022] Using program ID:', TOKEN_2022_PROGRAM_ID.toBase58());
  return TOKEN_2022_PROGRAM_ID;
}

/**
 * Debug helper to log all Token-2022 related addresses
 * @param mint - The mint address
 * @param owner - The owner address
 * @param ata - The ATA address (optional, will be calculated if not provided)
 */
export async function debugToken2022Setup(
  mint: PublicKey, 
  owner: PublicKey, 
  ata?: PublicKey
): Promise<void> {
  console.log('🔍 [Token-2022 Debug] Setup Information:');
  console.log('  Mint:', mint.toBase58());
  console.log('  Owner:', owner.toBase58());
  console.log('  ATA:', ata ? ata.toBase58() : (await getToken2022Ata(mint, owner)).toBase58());
  console.log('  Token-2022 Program:', TOKEN_2022_PROGRAM_ID.toBase58());
  console.log('  Associated Token Program:', ASSOCIATED_TOKEN_PROGRAM_ID.toBase58());
}
