import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { SOLANA_RPC_URL, SOLANA_NETWORK, isProduction, isDevelopment, FALLBACK_RPC_URLS, STREET_CREDIT_MINT } from './constants';

async function verifyTokenMint(connection: Connection): Promise<boolean> {
  try {
    console.log('[TokenMint] Verifying token mint:', STREET_CREDIT_MINT.toBase58());
    const mintInfo = await connection.getParsedAccountInfo(STREET_CREDIT_MINT);
    
    if (!mintInfo.value) {
      console.error('[TokenMint] Token mint does not exist');
      return false;
    }
    
    console.log('[TokenMint] Token mint info:', {
      address: STREET_CREDIT_MINT.toBase58(),
      exists: true,
      data: mintInfo.value.data
    });
    
    return true;
  } catch (error) {
    console.error('[TokenMint] Error verifying token mint:', error);
    return false;
  }
}

export async function getStreetCreditBalance(walletAddress: string): Promise<number> {
  try {
    console.log('[TokenBalance] Starting balance fetch for wallet:', walletAddress);
    console.log('[TokenBalance] Using mint address:', STREET_CREDIT_MINT.toBase58());
    
    // Use direct connection
    const connection = new Connection(getRpcUrl(), 'confirmed');
    const walletPublicKey = new PublicKey(walletAddress);

    // Verify token mint exists
    console.log('[TokenBalance] Verifying token mint...');
    const isValidMint = await verifyTokenMint(connection);
    if (!isValidMint) {
      console.error('[TokenBalance] Invalid token mint');
      return 0;
    }
    console.log('[TokenBalance] Token mint verified successfully');

    // First check for associated token account
    console.log('[TokenBalance] Getting associated token address...');
    const associatedTokenAddress = await getAssociatedTokenAddress(
      STREET_CREDIT_MINT,
      walletPublicKey
    );
    console.log('[TokenBalance] Associated token address:', associatedTokenAddress.toBase58());

    try {
      console.log('[TokenBalance] Checking associated token account...');
      const associatedTokenAccount = await connection.getParsedAccountInfo(associatedTokenAddress);
      console.log('[TokenBalance] Associated token account exists:', !!associatedTokenAccount.value);
      
      if (associatedTokenAccount.value) {
        const parsedData = associatedTokenAccount.value.data;
        console.log('[TokenBalance] Associated token account data:', parsedData);
        
        if ('parsed' in parsedData) {
          const balance = parsedData.parsed.info.tokenAmount.uiAmount;
          console.log('[TokenBalance] Balance from associated token account:', balance);
          return balance;
        } else {
          console.log('[TokenBalance] Account data is not parsed:', parsedData);
        }
      }
    } catch (e) {
      console.log('[TokenBalance] No associated token account found:', e);
    }

    // Fallback to searching all token accounts
    console.log('[TokenBalance] Searching for all token accounts...');
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPublicKey,
      { mint: STREET_CREDIT_MINT }
    );

    console.log('[TokenBalance] Found token accounts:', tokenAccounts.value.length);
    
    if (tokenAccounts.value.length === 0) {
      console.log('[TokenBalance] No token accounts found for this wallet');
      // Try to get account info directly to see if there's an issue
      try {
        const accountInfo = await connection.getAccountInfo(walletPublicKey);
        console.log('[TokenBalance] Wallet account info:', {
          exists: !!accountInfo,
          lamports: accountInfo?.lamports,
          owner: accountInfo?.owner?.toBase58()
        });
      } catch (e) {
        console.log('[TokenBalance] Could not get wallet account info:', e);
      }
      return 0;
    }

    // Log all token accounts for debugging
    console.log('[TokenBalance] Raw token accounts response:', JSON.stringify(tokenAccounts, null, 2));
    
    tokenAccounts.value.forEach((account: any, index: number) => {
      console.log(`[TokenBalance] Token account ${index}:`, {
        account: account,
        hasPubkey: !!account.pubkey,
        pubkeyType: typeof account.pubkey,
        pubkeyKeys: account.pubkey ? Object.keys(account.pubkey) : 'no pubkey',
        data: account.account?.data
      });
    });

    // Get the balance from the first token account
    const firstAccount = tokenAccounts.value[0];
    console.log('[TokenBalance] First account structure:', firstAccount);
    
    if (firstAccount && firstAccount.account && firstAccount.account.data && 'parsed' in firstAccount.account.data) {
      const balance = firstAccount.account.data.parsed.info.tokenAmount.uiAmount;
      console.log('[TokenBalance] Final balance:', balance);
      return balance;
    } else {
      console.log('[TokenBalance] First account data is not parsed or missing:', firstAccount);
      return 0;
    }
  } catch (error) {
    console.error('[TokenBalance] Error fetching street credit balance:', error);
    if (error instanceof Error) {
      console.error('[TokenBalance] Error details:', error.message);
    }
    return 0;
  }
}

// Helper function to check if we're on devnet
export function isDevnet(): boolean {
  return SOLANA_NETWORK === 'devnet';
}

// Helper function to get the correct RPC URL
export function getRpcUrl(): string {
  // Use environment variable first, fallback to clusterApiUrl
  const url = SOLANA_RPC_URL || clusterApiUrl(SOLANA_NETWORK === 'mainnet-beta' ? 'mainnet-beta' : 'devnet');
  console.log('[Network] Getting RPC URL:', url);
  console.log('[Network] Configuration:', {
    network: SOLANA_NETWORK,
    rpcUrl: SOLANA_RPC_URL
  });
  return url;
}

// Helper function to get RPC URL with fallbacks
export async function getReliableRpcUrl(): Promise<string> {
  // Always prioritize the environment variable RPC URL
  if (SOLANA_RPC_URL) {
    try {
      console.log('[Network] Testing primary RPC endpoint:', SOLANA_RPC_URL);
      const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
      await connection.getSlot();
      console.log('[Network] Primary RPC endpoint working:', SOLANA_RPC_URL);
      return SOLANA_RPC_URL;
    } catch (error) {
      console.warn('[Network] Primary RPC endpoint failed:', SOLANA_RPC_URL, error);
    }
  }
  
  // Only use fallbacks if primary fails
  const urls = FALLBACK_RPC_URLS.filter(Boolean);
  
  for (const url of urls) {
    try {
      console.log('[Network] Testing fallback RPC endpoint:', url);
      const connection = new Connection(url, 'confirmed');
      await connection.getSlot();
      console.log('[Network] Fallback RPC endpoint working:', url);
      return url;
    } catch (error) {
      console.warn('[Network] Fallback RPC endpoint failed:', url, error);
      continue;
    }
  }
  
  // If all fail, return the primary URL anyway (let it fail gracefully)
  console.warn('[Network] All RPC endpoints failed, using primary:', SOLANA_RPC_URL);
  return SOLANA_RPC_URL;
}

// New function to use backend proxy for Solana RPC calls
export async function makeSolanaRpcCall(method: string, params: any[] = []): Promise<any> {
  try {
    console.log('[Solana Proxy] Making RPC call:', method, params);
    
    const response = await fetch('/api/solana/rpc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Proxy request failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(`RPC error: ${result.error.message}`);
    }
    
    console.log('[Solana Proxy] RPC call successful:', method);
    return result.result;
    
  } catch (error) {
    console.error('[Solana Proxy] Error:', error);
    throw error;
  }
}

// Helper function to create a proxy-based connection
export function createProxyConnection(): any {
  return {
    getSlot: () => makeSolanaRpcCall('getSlot'),
    getLatestBlockhash: () => makeSolanaRpcCall('getLatestBlockhash'),
    getAccountInfo: (publicKey: PublicKey) => makeSolanaRpcCall('getAccountInfo', [publicKey.toBase58()]),
    getParsedAccountInfo: (publicKey: PublicKey) => makeSolanaRpcCall('getAccountInfo', [publicKey.toBase58(), { encoding: 'jsonParsed' }]),
    getParsedTokenAccountsByOwner: (owner: PublicKey, filter: any, config?: any) => 
      makeSolanaRpcCall('getTokenAccountsByOwner', [owner.toBase58(), filter, { encoding: 'jsonParsed', ...config }]),
    // Note: getAssociatedTokenAddress is not a standard RPC method, so we'll calculate it locally
    getAssociatedTokenAddress: (mint: PublicKey, owner: PublicKey, allowOwnerOffCurve?: boolean) => {
      // Calculate the associated token address locally using the SPL Token program
      const { getAssociatedTokenAddress } = require('@solana/spl-token');
      return getAssociatedTokenAddress(mint, owner, allowOwnerOffCurve);
    },
  };
}
