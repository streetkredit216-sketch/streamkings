import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { Comment, CreateCommentData } from '@/types/comment';
import { User } from '@/types/user';
import { BlogData } from '@/types/blog';
import { PublicKey, Connection } from '@solana/web3.js';
import { deleteContent } from '@/solana/transactions/delete';
import { comment } from '@/solana/transactions/comment';
import { CONFIG_ACCOUNT, PLATFORM_WALLET, FEE_WALLET, SOLANA_RPC_URL } from '@/solana/constants';
import { updateStreetCreditAfterTransaction } from '@/lib/streetCredit';
import { useWallet } from '@solana/wallet-adapter-react';
import FollowButton from '@/components/ui/FollowButton';
import SaveCommentButton from '@/components/ui/SaveCommentButton';

interface CommentSectionProps {
  blog: BlogData;
  currentUser: User | null;
  onUserClick?: (walletAddress: string) => void;
  onFollowToggle: (userId: string) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  blog,
  currentUser,
  onUserClick,
  onFollowToggle
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const wallet = useWallet();
  const { publicKey } = wallet;
  const connection = new Connection(SOLANA_RPC_URL);

  // Fetch comments on mount
  useEffect(() => {
    fetchComments();
  }, [blog.id]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(api.comments.list(blog.id));
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser?.id || !publicKey) {
      if (!publicKey) {
        alert('Please connect your wallet to comment');
      }
      return;
    }
    if (newComment.length > 1000) {
      alert('Comment exceeds 1000 characters.');
      return;
    }

    setSubmitting(true);
    try {
      // First, do the Solana transaction
      const signature = await comment({
        connection,
        wallet,
        fromOwner: publicKey,
        receiverOwner: new PublicKey(blog.author.walletAddress),
        feeOwner: new PublicKey(FEE_WALLET),
        configAccount: CONFIG_ACCOUNT
      });

      console.log('Comment transaction successful:', signature);

      // Update street credit balance after successful transaction
      await updateStreetCreditAfterTransaction(publicKey.toBase58());

      // Then create the comment in the database
      const commentData: CreateCommentData = {
        content: newComment.trim(),
        authorId: currentUser.id,
        blogId: blog.id
      };

      const response = await fetch(api.comments.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData)
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create comment');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      alert(error instanceof Error ? error.message : 'Failed to create comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string, authorId: string) => {
    if (!currentUser?.id || currentUser.id !== authorId) return;

    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      if (!publicKey) throw new Error('Connect wallet to delete comment');
      // Run Solana delete platform action prior to API delete
      const sig = await deleteContent({
        connection,
        wallet,
        fromOwner: publicKey,
        platformOwner: new PublicKey(PLATFORM_WALLET),
        feeOwner: new PublicKey(FEE_WALLET),
        configAccount: CONFIG_ACCOUNT
      });
      console.log('[CommentSection] Delete tx signature:', sig);

      const response = await fetch(api.comments.delete(commentId), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ authorId: currentUser.id })
      });

      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete comment');
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-xl font-bold text-white mb-4">Comments ({comments.length})</h3>
      
      {/* Comment form */}
      {currentUser && (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex items-start space-x-3">
            <img
              src={currentUser.profilePic}
              alt={currentUser.username}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 resize-none"
                rows={3}
                disabled={submitting}
                maxLength={1000}
              />
              <div className="text-right text-xs text-white/50">{newComment.length}/1000</div>
              <div className="flex justify-between items-center mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="text-white/60">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-white/60">No comments yet. Be the first to comment!</div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white/5 rounded-lg p-3 sm:p-4 w-full overflow-hidden">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <img
                  src={comment.author.profilePic}
                  alt={comment.author.username}
                  className="w-10 h-10 rounded-full cursor-pointer glitch-hover"
                  onClick={() => onUserClick?.(comment.author.walletAddress)}
                />
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div>
                        <h4 
                          className="font-semibold text-white cursor-pointer hover:text-white/80 glitch-text-hover"
                          onClick={() => onUserClick?.(comment.author.walletAddress)}
                        >
                          {comment.author.username}
                        </h4>
                        <p className="text-xs text-white/60 font-mono">{comment.author.walletAddress}</p>
                      </div>
                      {currentUser && currentUser.id !== comment.author.id && (
                        <FollowButton
                          currentUser={currentUser}
                          targetUser={comment.author}
                        />
                      )}
                    </div>
                                         <div className="flex flex-wrap items-center gap-2">
                       <SaveCommentButton
                         currentUser={currentUser}
                         comment={comment}
                         onCommentUpdate={fetchComments}
                       />
                       {currentUser?.id === comment.author.id && (
                         <button
                           onClick={() => handleDeleteComment(comment.id, comment.authorId)}
                           className="text-white/60 hover:text-white/80 text-sm holographic-hover px-2 py-1 rounded"
                         >
                           Delete
                         </button>
                       )}
                     </div>
                  </div>
                  <p className="text-white/90 mt-2 break-words">{comment.content}</p>
                  <div className="text-white/60 text-xs sm:text-sm mt-2">
                    {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection; 