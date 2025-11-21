import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types/user';
import { Comment } from '@/types/comment';
import { PublicKey, Connection } from '@solana/web3.js';
import { save } from '@/solana/transactions/save';
import { SOLANA_RPC_URL, FEE_WALLET, CONFIG_ACCOUNT } from '@/solana/constants';
import { useWallet } from '@solana/wallet-adapter-react';

interface SaveCommentButtonProps {
  currentUser: User | null;
  comment: Comment;
  className?: string;
  onCommentUpdate?: () => void;
  showUnsaveButton?: boolean;
  onUnsave?: () => void;
}

const SaveCommentButton: React.FC<SaveCommentButtonProps> = ({ 
  currentUser, 
  comment, 
  className = '',
  onCommentUpdate,
  showUnsaveButton,
  onUnsave
}) => {
  const [isSaved, setIsSaved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const wallet = useWallet();
  const { publicKey } = wallet;
  const connection = new Connection(SOLANA_RPC_URL);

  // Fetch save status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      if (!currentUser?.id || !comment?.id) return;
      try {
        // Check if the comment is in the user's saved comments
        const response = await fetch(api.comments.saved(currentUser.id));
        if (response.ok) {
          const data = await response.json();
          const isCommentSaved = data.some((savedComment: any) => savedComment.commentId === comment.id);
          console.log('Comment save status check:', { commentId: comment.id, isSaved: isCommentSaved, savedComments: data.length });
          setIsSaved(isCommentSaved);
        } else {
          console.log('Failed to fetch saved comments:', response.status);
          setIsSaved(false);
        }
      } catch (error) {
        console.error('Error fetching comment save status:', error);
        setIsSaved(false);
      }
    };
    fetchStatus();
  }, [currentUser?.id, comment?.id]);

  const handleSaveToggle = async () => {
    if (!currentUser?.id || !comment?.id) return;
    
    if (!publicKey) {
      alert('Please connect your wallet to save comments');
      return;
    }

    setLoading(true);
    try {
      // First, do the Solana transaction
      const signature = await save({
        connection,
        wallet,
        fromOwner: publicKey,
        receiverOwner: new PublicKey(comment.author.walletAddress),
        feeOwner: new PublicKey(FEE_WALLET),
        configAccount: new PublicKey(CONFIG_ACCOUNT)
      });

      console.log('Save comment transaction successful:', signature);

      // Determine the action based on current state
      const method = isSaved ? 'DELETE' : 'POST';
      
      const response = await fetch(api.comments.save(comment.id), {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser.id
        })
      });

      if (response.ok) {
        // Success - toggle the state
        console.log('Comment save/unsave successful:', { method, newState: !isSaved });
        setIsSaved(!isSaved);
        onCommentUpdate?.();
        
        // Handle unsave callback if needed
        if (!isSaved && showUnsaveButton && onUnsave) {
          onUnsave();
        }
      } else if (response.status === 409 && !isSaved) {
        // Comment is already saved but our state was wrong - fix it
        console.log('Comment already saved, fixing state');
        setIsSaved(true);
        onCommentUpdate?.();
      } else {
        const data = await response.json();
        console.error('Comment save/unsave failed:', { status: response.status, data });
        throw new Error(data.error || 'Failed to save comment');
      }
    } catch (error) {
      console.error('Error saving comment:', error);
      alert(error instanceof Error ? error.message : 'Failed to save comment');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || !comment) return null;
  if (currentUser.id === comment.authorId) return null; // Don't show save button for own comments
  if (isSaved === null) {
    return <button className={className} disabled>...</button>;
  }

  return (
    <button
      className={`${className} px-2 py-1 text-xs rounded-full transition-colors holographic-hover ${
        isSaved
          ? 'bg-white text-black hover:bg-white/90'
          : 'bg-white/10 text-white hover:bg-white/20'
      }`}
      onClick={handleSaveToggle}
      disabled={loading}
    >
      {loading ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
    </button>
  );
};

export default SaveCommentButton; 