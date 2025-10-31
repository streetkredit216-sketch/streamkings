// Helper functions for updating street credit after Solana transactions

import { api } from './api';

/**
 * Updates the user's street credit balance in the database after a Solana transaction
 * This ensures the scoreboard and rankings are updated immediately
 */
export async function updateStreetCreditAfterTransaction(walletAddress: string): Promise<void> {
  try {
    // Get the current token balance from Solana
    const { getStreetCreditBalance } = await import('@/solana/utils');
    const newBalance = await getStreetCreditBalance(walletAddress);
    
    // Update the backend database
    const response = await fetch(api.users.updateStreetCredit(walletAddress), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: newBalance }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend update failed: ${response.statusText} - ${errorText}`);
    }
    
  } catch (error) {
    // Don't throw - we don't want to break the main transaction flow
    // Silently fail to avoid disrupting user experience
  }
}

