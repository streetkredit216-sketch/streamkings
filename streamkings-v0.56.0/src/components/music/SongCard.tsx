//SongCard.tsx

import { useState, useEffect } from "react";
import { HiHeart, HiOutlineHeart, HiPlus } from "react-icons/hi";
import { Song } from '@/types/song';
import { api } from '@/lib/api';
import { User } from '@/types/user';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Connection } from '@solana/web3.js';
import { save } from '@/solana/transactions/save';
import { FEE_WALLET, CONFIG_ACCOUNT, SOLANA_RPC_URL } from '@/solana/constants';

interface SongCardProps {
  song: Song;
  isPurchased: boolean;
  user: User | null;
  onLikeToggle: (songId: string) => void;
  onAddToPlaylist: (songId: string) => void;
}

const SongCard = ({ song, isPurchased, user, onLikeToggle, onAddToPlaylist }: SongCardProps) => {
  const [loading, setLoading] = useState(false);
  const wallet = useWallet();
  const { connection } = useConnection();

  const handlePurchase = async () => {
    if (!wallet.publicKey || !user || !wallet.connected || !wallet.wallet) {
      alert('Please connect your wallet to purchase songs');
      return;
    }

    // Validate song data
    if (!song.author?.walletAddress) {
      console.error('[SongCard] Invalid song data:', song);
      alert('Invalid song data: Missing artist wallet address');
      return;
    }

    // Validate platform wallet
    const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET;
    if (!platformWallet) {
      console.error('[SongCard] Platform wallet not configured');
      alert('Platform wallet not configured. Please contact support.');
      return;
    }

    setLoading(true);
    try {
      // Get the artist's wallet address from the song's author
      const artistWalletAddress = song.author.walletAddress;
      
      console.log('[SongCard] Starting purchase process:', {
        songId: song.id,
        fromWallet: wallet.publicKey.toBase58(),
        toWallet: artistWalletAddress,
        songData: song
      });

      // Execute the purchase transaction
      console.log('[SongCard] Executing save(user action) with params:', {
        fromOwner: wallet.publicKey.toBase58(),
        receiverOwner: artistWalletAddress,
      });

      const signature = await save({
        connection,
        wallet,
        fromOwner: wallet.publicKey,
        receiverOwner: new PublicKey(artistWalletAddress),
        feeOwner: new PublicKey(FEE_WALLET),
        configAccount: new PublicKey(CONFIG_ACCOUNT)
      });

      console.log('[SongCard] Purchase successful:', signature);

      // Update the backend
      const response = await fetch(`${api.songs.like}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          songId: song.id,
          userId: user.id,
          transactionSignature: signature
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update purchase status');
      }

      // Update UI
      onLikeToggle(song.id);
    } catch (error) {
      console.error('[SongCard] Purchase failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to purchase song');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user && isPurchased) {
      onAddToPlaylist(song.id);
    }
  };

  return (
    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
      <div className="flex items-center space-x-4">
        {/* Album Cover */}
        <div className="w-16 h-16 rounded overflow-hidden">
          <img
            src={song.coverImage || "/images/default-album.png"}
            alt={song.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Song Info */}
        <div className="flex-1">
          <h4 className="font-bold text-white">{song.title}</h4>
          <p className="text-white/60 text-sm">{song.author?.username || 'Unknown Artist'}</p>
          <p className="text-white/40 text-sm">{song.genre}</p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={handlePurchase}
            className="text-white hover:text-red-500 transition-colors"
            disabled={loading || isPurchased}
            title={isPurchased ? "Already purchased" : "Purchase song"}
          >
            {isPurchased ? <HiHeart className="w-6 h-6" /> : <HiOutlineHeart className="w-6 h-6" />}
          </button>

          {isPurchased && user && (
            <button
              onClick={handleAddToPlaylist}
              className="text-white hover:text-blue-500 transition-colors"
              title="Add to playlist"
            >
              <HiPlus className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SongCard;
