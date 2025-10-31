import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types/user';
import { BlogData } from '@/types/blog';
import { PublicKey, Connection } from '@solana/web3.js';
import { save } from '@/solana/transactions/save';
import { SOLANA_RPC_URL, FEE_WALLET, CONFIG_ACCOUNT } from '@/solana/constants';
import { useWallet } from '@solana/wallet-adapter-react';

interface SavePostButtonProps {
  currentUser: User | null;
  blog: BlogData;
  className?: string;
  onBlogUpdate?: () => void;
  showUnsaveButton?: boolean;
  onUnsave?: () => void;
}

const SavePostButton: React.FC<SavePostButtonProps> = ({ 
  currentUser, 
  blog, 
  className = '',
  onBlogUpdate,
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
      if (!currentUser?.id || !blog?.id) return;
      try {
        // Check if the blog is in the user's saved blogs
        const response = await fetch(api.blogs.saved(currentUser.id));
        if (response.ok) {
          const data = await response.json();
          const isBlogSaved = data.some((savedBlog: any) => savedBlog.blogId === blog.id);
          console.log('Save status check:', { blogId: blog.id, isSaved: isBlogSaved, savedBlogs: data.length });
          setIsSaved(isBlogSaved);
        } else {
          console.log('Failed to fetch saved blogs:', response.status);
          setIsSaved(false);
        }
      } catch (error) {
        console.error('Error fetching save status:', error);
        setIsSaved(false);
      }
    };
    fetchStatus();
  }, [currentUser?.id, blog?.id]);

  const handleSaveToggle = async () => {
    if (!currentUser?.id || !blog?.id) return;
    
    if (!publicKey) {
      alert('Please connect your wallet to save posts');
      return;
    }

    setLoading(true);
    try {
      // First, do the Solana transaction
      const signature = await save({
        connection,
        wallet,
        fromOwner: publicKey,
        receiverOwner: new PublicKey(blog.author.walletAddress),
        feeOwner: new PublicKey(FEE_WALLET),
        configAccount: new PublicKey(CONFIG_ACCOUNT)
      });

      console.log('Save transaction successful:', signature);

      // Determine the action based on current state
      const method = isSaved ? 'DELETE' : 'POST';
      
      const response = await fetch(api.blogs.save(blog.id), {
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
        console.log('Save/unsave successful:', { method, newState: !isSaved });
        setIsSaved(!isSaved);
        onBlogUpdate?.();
        
        // Handle unsave callback if needed
        if (!isSaved && showUnsaveButton && onUnsave) {
          onUnsave();
        }
      } else if (response.status === 409 && !isSaved) {
        // Blog is already saved but our state was wrong - fix it
        console.log('Blog already saved, fixing state');
        setIsSaved(true);
        onBlogUpdate?.();
      } else {
        const data = await response.json();
        console.error('Save/unsave failed:', { status: response.status, data });
        throw new Error(data.error || 'Failed to save blog');
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      alert(error instanceof Error ? error.message : 'Failed to save blog');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || !blog) return null;
  if (currentUser.id === blog.author.id) return null; // Don't show save button for own posts
  if (isSaved === null) {
    return <button className={className} disabled>...</button>;
  }

  return (
    <button
      className={`${className} px-3 py-1 text-sm rounded-full transition-colors holographic-hover ${
        isSaved
          ? 'bg-white text-black hover:bg-white/90'
          : 'bg-white/10 text-white hover:bg-white/20'
      }`}
      onClick={handleSaveToggle}
      disabled={loading}
    >
      {loading ? 'Saving...' : isSaved ? 'Saved' : 'Save Post'}
    </button>
  );
};

export default SavePostButton; 