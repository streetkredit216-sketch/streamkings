import { format } from 'date-fns';
import { BlogData } from '@/types/blog';
import { User } from '@/types/user';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { deleteContent } from '@/solana/transactions/delete';
import { PLATFORM_WALLET, FEE_WALLET, CONFIG_ACCOUNT } from '@/solana/constants';
import BlogEditor from './BlogEditor';
import FollowButton from '@/components/ui/FollowButton';
import SavePostButton from '@/components/ui/SavePostButton';

interface BlogArticleProps {
  blog: BlogData;
  setSelectedBlog: (blog: BlogData | null) => void;
  onUserClick?: (walletAddress: string) => void;
  onFollowToggle: (userId: string) => void;
  onUnsave?: () => void;
  showUnsaveButton?: boolean;
  user: User | null;
  onBlogUpdate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function BlogArticle({
  blog,
  setSelectedBlog,
  onUserClick,
  onFollowToggle,
  onUnsave,
  showUnsaveButton,
  user,
  onBlogUpdate
}: BlogArticleProps) {
  const [showBlogEditor, setShowBlogEditor] = useState(false);
  const wallet = useWallet();
  const { connection } = useConnection();

  // Add safety checks
  if (!blog || !blog.author) {
    console.warn('Blog or blog author is undefined:', blog);
    return null;
  }

  // Safe access to user and blog author IDs
  const isOwnBlog = user?.id && blog.author?.id ? user.id === blog.author.id : false;

  const handleEditBlog = async (blogData: { title: string; content: string }) => {
    if (!blog.id || !user) return;
    
    try {
      const response = await fetch(api.blogs.update(blog.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blogData),
      });

      if (!response.ok) throw new Error('Failed to update blog');
      
      setShowBlogEditor(false);
      onBlogUpdate?.();
    } catch (error) {
      console.error('Error updating blog:', error);
    }
  };

  const handleDeleteBlog = async () => {
    if (!blog.id || !user) return;
    
    if (!confirm('Are you sure you want to delete this blog?')) return;
    
    try {
      // First, run Solana delete platform action
      if (!wallet.publicKey) throw new Error('Connect wallet to delete blog');
      const sig = await deleteContent({
        connection,
        wallet,
        fromOwner: wallet.publicKey,
        platformOwner: new PublicKey(PLATFORM_WALLET),
        feeOwner: new PublicKey(FEE_WALLET),
        configAccount: new PublicKey(CONFIG_ACCOUNT)
      });
      console.log('[BlogArticle] Delete tx signature:', sig);

      const response = await fetch(api.blogs.delete(blog.id), {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete blog');
      }
      
      onBlogUpdate?.();
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete blog');
    }
  };



  return (
    <>
      <div className="bg-white/5 rounded-lg p-3 sm:p-6 digital-noise w-full overflow-hidden">
        <div className="flex items-start space-x-2 sm:space-x-4">
          <img
            src={blog.author.profilePic}
            alt={blog.author.username}
            className="w-12 h-12 rounded-full cursor-pointer glitch-hover"
            onClick={() => onUserClick?.(blog.author.walletAddress)}
          />
          <div className="flex-1">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className="min-w-0 flex-1">
                    <h2 
                      className="font-bold text-white cursor-pointer hover:text-white/80 glitch-text-hover truncate"
                      onClick={() => onUserClick?.(blog.author.walletAddress)}
                    >
                      {blog.author.username}
                    </h2>
                    <p className="text-xs text-white/60 font-mono truncate">{blog.author.walletAddress}</p>
                  </div>
                </div>
                {!isOwnBlog && (
                  <div className="flex-shrink-0 sm:ml-2">
                    <FollowButton
                      currentUser={user}
                      targetUser={{
                        ...blog.author,
                        role: 'TASTEMAKER',
                        description: '',
                        streetCredit: 0,
                        ranking: 0,
                        email: '',
                        profileBanner: undefined,
                        savedBlogs: undefined,
                        savedPhotos: undefined,
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isOwnBlog && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setShowBlogEditor(true);
                      }}
                      className="px-4 py-2 text-base bg-white/10 hover:bg-white/20 rounded-full transition-colors holographic-hover"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDeleteBlog}
                      className="px-4 py-2 text-base bg-white/10 hover:bg-white/20 rounded-full transition-colors holographic-hover"
                    >
                      Delete
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setSelectedBlog(blog)}
                  className="px-4 py-2 text-base bg-white/10 hover:bg-white/20 rounded-full transition-colors holographic-hover flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{blog._count?.comments || 0}</span>
                </button>
                <SavePostButton
                  currentUser={user}
                  blog={blog}
                  onBlogUpdate={onBlogUpdate}
                  showUnsaveButton={showUnsaveButton}
                  onUnsave={onUnsave}
                />
              </div>
            </div>
            <div
              className="mt-4 cursor-pointer"
              onClick={() => setSelectedBlog(blog)}
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white break-words">{blog.title}</h1>
              <p className="mt-2 text-white/90 line-clamp-3 break-words">{blog.content}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4 text-white/60 text-sm">
              <span>{format(new Date(blog.createdAt), 'MMM d, yyyy')}</span>
              <span className="hidden sm:inline">·</span>
              <span>{blog._count?.comments || 0} comments</span>
              <span className="hidden sm:inline">·</span>
              <span>{blog._count?.savedBy || 0} saves</span>
            </div>
          </div>
        </div>
      </div>

      {showBlogEditor && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="w-full max-w-3xl mx-4">
            <BlogEditor
              onClose={() => {
                setShowBlogEditor(false);
              }}
              onSubmit={handleEditBlog}
            />
          </div>
        </div>
      )}
    </>
  );
}
