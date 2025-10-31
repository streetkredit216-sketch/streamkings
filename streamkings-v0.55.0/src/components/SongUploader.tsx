import { useState, useEffect } from 'react';
import { HiX, HiUpload } from 'react-icons/hi';
import { api } from '../lib/api';
import { uploadSong } from '@/solana/transactions/uploadSong';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { SOLANA_RPC_URL, PLATFORM_WALLET, FEE_WALLET, CONFIG_ACCOUNT } from '@/solana/constants';
import { updateStreetCreditAfterTransaction } from '@/lib/streetCredit';

interface SongUploaderProps {
  onClose: () => void;
  onSuccess: () => Promise<void>;
  userRole: 'TASTEMAKER' | 'DJ' | 'ARTIST';
  walletAddress: string;
}

export default function SongUploader({ onClose, onSuccess, userRole, walletAddress }: SongUploaderProps) {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wallet = useWallet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !title || !genre || !coverImage) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // First, do the Solana transaction
      const connection = new Connection(SOLANA_RPC_URL);
      
      if (!wallet.publicKey) {
        alert('Please connect your wallet to upload songs');
        return;
      }

      const signature = await uploadSong({
        connection,
        wallet,
        fromOwner: wallet.publicKey,
        platformOwner: new PublicKey(PLATFORM_WALLET),
        feeOwner: new PublicKey(FEE_WALLET),
        configAccount: new PublicKey(CONFIG_ACCOUNT)
      });

      console.log('Upload song transaction successful:', signature);

      // Update street credit balance after successful transaction
      await updateStreetCreditAfterTransaction(wallet.publicKey.toBase58());

      // Then upload the files to the backend
      const formData = new FormData();
      formData.append('audioFile', audioFile);
      formData.append('title', title);
      formData.append('genre', genre);
      formData.append('coverImage', coverImage);
      formData.append('walletAddress', walletAddress);

      const response = await fetch(api.songs.upload, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload song');
      }

      // Call onSuccess to update parent state
      await onSuccess();
      onClose();
    } catch (error) {
      console.error('Error uploading song:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload song');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-lg overflow-hidden w-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-xl font-bold text-white">Upload Song</h2>
        <button
          onClick={onClose}
          type="button"
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close upload dialog"
        >
          <HiX className="w-6 h-6 text-white" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label htmlFor="song-title" className="block text-sm font-medium text-white/60 mb-1">
            Song Title *
          </label>
          <input
            id="song-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white"
            required
            placeholder="Enter song title"
            aria-label="Song title"
          />
        </div>

        <div>
          <label htmlFor="song-genre" className="block text-sm font-medium text-white/60 mb-1">
            Genre *
          </label>
          <input
            id="song-genre"
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white"
            required
            placeholder="Enter genre"
            aria-label="Song genre"
          />
        </div>

        <div>
          <label htmlFor="audio-file" className="block text-sm font-medium text-white/60 mb-1">
            Audio File *
          </label>
          <input
            id="audio-file"
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white"
            required
            aria-label="Upload audio file"
          />
        </div>

        <div>
          <label htmlFor="cover-image" className="block text-sm font-medium text-white/60 mb-1">
            Cover Image *
          </label>
          <input
            id="cover-image"
            type="file"
            accept="image/*"
            onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white"
            required
            aria-label="Upload cover image"
          />
        </div>



        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Uploading...' : 'Upload Song'}
          </button>
        </div>
      </form>
    </div>
  );
} 