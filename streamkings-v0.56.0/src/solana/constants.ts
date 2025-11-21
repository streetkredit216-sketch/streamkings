import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

// New Token-2022 compatible program configuration
export const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || 'D4b2rvBeV4sMAkPRZjytgzWoi1N57jFrrFq2oxDyGPtU');
export const CONFIG_ACCOUNT = new PublicKey('JBHyCLCgAQBWVavJwrk9AMcEskBAKQtQcREpYGkeVtbg');

// Token-2022 mint address (devnet for testing)
export const STREET_CREDIT_MINT = new PublicKey(process.env.NEXT_PUBLIC_STREET_KREDIT_MINT || "8uPfWgMQiiVXdFZ6c12xzB6MTAWeDPNcqWjrovfNkBoQ");

// Platform and fee wallets from testTokenInfo.json
export const PLATFORM_WALLET = new PublicKey(process.env.NEXT_PUBLIC_PLATFORM_WALLET || "skgMLYumACE5CLLmhBz8JxRe9ZyVrKfLZV1xCYn1PdP");
export const FEE_WALLET = new PublicKey(process.env.NEXT_PUBLIC_FEE_WALLET || "87wRiNDexEFEo7nrnciVQJPbjEkgdMuzdcYD5V8yqema");
export const AUTHORITY = new PublicKey(process.env.NEXT_PUBLIC_AUTHORITY || "snowhFdtUoXcJxjLFi75E4dqChyp3SSZboyooLmBhgb");

// Token accounts
export const FEE_TOKEN_ACCOUNT = new PublicKey("EG1VhVL5wMMXpfMKSUBLABbcnxWK2X8ifWVubw3hQi5G");
export const PLATFORM_TOKEN_ACCOUNT = new PublicKey("JhLxDFUS6q3Wk2zbRsLMMZeFKtKM7egrqn1PMJPsK5T");

// Token-2022 Program ID - Import from @solana/spl-token
export { TOKEN_2022_PROGRAM_ID };

// Re-export for convenience
export const TOKEN_2022_PROGRAM = TOKEN_2022_PROGRAM_ID;

// Solana network configuration - Devnet for testing (using Helius RPC endpoint)
export const SOLANA_RPC_URL = (process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com') as string;
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

// Fallback RPC URLs for better reliability (CORS-enabled)
export const FALLBACK_RPC_URLS = [
  'https://solana.public-rpc.com',
  'https://rpc.ankr.com/solana',
  'https://solana-api.projectserum.com'
];

// Environment-aware configuration
export const isProduction = process.env.NEXT_PUBLIC_NODE_ENV === 'production';
export const isDevelopment = process.env.NEXT_PUBLIC_NODE_ENV === 'development';