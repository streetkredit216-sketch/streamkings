import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types/user';
import { PublicKey, Connection } from '@solana/web3.js';
import { follow } from '@/solana/transactions/follow';
import { unfollow } from '@/solana/transactions/unfollow';
import { PLATFORM_WALLET, FEE_WALLET, CONFIG_ACCOUNT, SOLANA_RPC_URL } from '@/solana/constants';
import { useWallet } from '@solana/wallet-adapter-react';
import { updateStreetCreditAfterTransaction } from '@/lib/streetCredit';

interface FollowButtonProps {
  currentUser: User | null;
  targetUser: User | null;
  className?: string;
}

const FollowButton: React.FC<FollowButtonProps> = ({ currentUser, targetUser, className }) => {
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const wallet = useWallet();
  const { publicKey } = wallet;
  const connection = new Connection(SOLANA_RPC_URL);

  // Fetch follow status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      if (!currentUser?.id || !targetUser?.id) return;
      try {
        const response = await fetch(api.users.following(currentUser.id));
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.some((u: any) => u.id === targetUser.id));
        } else {
          setIsFollowing(false);
        }
      } catch {
        setIsFollowing(false);
      }
    };
    fetchStatus();
  }, [currentUser?.id, targetUser?.id]);

  const handlefollowToggle = async () => {
    if (!currentUser?.id || !targetUser?.id) return;
    
    if (!publicKey) {
      alert('Please connect your wallet to follow users');
      return;
    }

    setLoading(true);
    try {
      // First, do the Solana transaction
      let signature: string;
      
      if (isFollowing) {
        // Unfollow transaction
        signature = await unfollow({
          connection,
          wallet,
          fromOwner: publicKey,
          receiverOwner: new PublicKey(targetUser.walletAddress),
          feeOwner: new PublicKey(FEE_WALLET),
          configAccount: new PublicKey(CONFIG_ACCOUNT)
        });
        console.log('Unfollow transaction successful:', signature);
      } else {
        // Follow transaction
        signature = await follow({
          connection,
          wallet,
          fromOwner: publicKey,
          receiverOwner: new PublicKey(targetUser.walletAddress),
          feeOwner: new PublicKey(FEE_WALLET),
          configAccount: new PublicKey(CONFIG_ACCOUNT)
        });
        console.log('Follow transaction successful:', signature);
      }

      // Update street credit balance after successful transaction
      await updateStreetCreditAfterTransaction(publicKey.toBase58());

      // Then update the backend
      const response = await fetch(api.users.follow(targetUser.id), {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setShowError(true);
      setTimeout(() => setShowError(false), 1000);
      alert(error instanceof Error ? error.message : 'Failed to follow/unfollow user');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || !targetUser) return null;
  if (currentUser.id === targetUser.id) return null;
  if (isFollowing === null) {
    return <button className={className} disabled>...</button>;
  }

  return (
    <button
      className={`${className} px-3 py-1 text-sm rounded-full transition-colors holographic-hover ${isFollowing ? 'bg-green-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'} ${showError ? 'error-corruption' : ''}`}
      onClick={handlefollowToggle}
      disabled={loading}
    >
      {loading ? (isFollowing ? 'Unfollowing...' : 'Following...') : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
};

export default FollowButton; 