'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { HiPencil } from 'react-icons/hi';
import { format } from 'date-fns';
import { PublicKey, Connection } from '@solana/web3.js';
import { follow } from '@/solana/transactions/follow';
import { unfollow } from '@/solana/transactions/unfollow';
import { CONFIG_ACCOUNT, PLATFORM_WALLET, SOLANA_RPC_URL } from '@/solana/constants';
import { createBlog } from '@/solana/transactions/createBlog';
import { updateStreetCreditAfterTransaction } from '@/lib/streetCredit';

// Import blog components
import BlogEditor from './blog/BlogEditor';
import BlogArticle from './blog/BlogArticle';
import { BlogData, SavedBlogReference, BlogView } from '@/types/blog';
import SearchResults from './blog/SearchResults';
import NavigationMenu from './blog/NavigationMenu';
import UserProfile from './blog/UserProfile';
import CommentSection from './blog/CommentSection';
import FollowButton from './ui/FollowButton';
import SavePostButton from './ui/SavePostButton';
import SubmitVideoButton from './ui/SubmitVideoButton';
import UpgradeAccountButton from './ui/UpgradeAccountButton';

// Import other components
import RenderMusic from './music/RenderMusic';
import { Song } from '@/types/song';
import { Photo } from '@/types/photo';
import { User } from '@/types/user';
import SupportSection from './blog/SupportSection';

const WalletButton = dynamic(
  () => import('@/components/WalletButton'),
  { ssr: false }
);

type ProfileTab = 'blogs' | 'events' | 'music' | 'photos' | 'support';
const VIEW_MODES = ['blogs', 'search', 'scoreboard', 'radio', 'support'] as const;
type ViewMode = typeof VIEW_MODES[number];

interface BlogSectionProps {
  user: User | null;
  viewingUser: User | null;
  onUserClick: (walletAddress: string) => void;
  onFollowToggle: (userId: string) => Promise<void>;
  onUserUpdate: (updatedUser: User) => void;
  onCloseProfile: () => void;
}

export default function BlogSection({ user, viewingUser, onUserClick, onFollowToggle, onUserUpdate, onCloseProfile }: BlogSectionProps) {
  const [activeProfileTab, setActiveProfileTab] = useState<ProfileTab>('blogs');
  const [showBlogEditor, setShowBlogEditor] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogData | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<BlogData | null>(null);
  const [blogs, setBlogs] = useState<BlogData[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<BlogView>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('blogs');
  const [searchQuery, setSearchQuery] = useState('');
  const wallet = useWallet();
  const { publicKey, signTransaction, signAllTransactions } = wallet;
  const router = useRouter();
  const isProfileOwner = publicKey?.toBase58() === (viewingUser || user)?.walletAddress;
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [streamMode, setStreamMode] = useState<'tv' | 'radio'>('tv');

      const connection = new Connection(SOLANA_RPC_URL);

  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [savedBlogs, setSavedBlogs] = useState<SavedBlogReference[]>([]);
  const [savedComments, setSavedComments] = useState<any[]>([]);
  const [savedPhotos, setSavedPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    if (publicKey) {
      setIsWalletConnected(true);
    } else {
      setIsWalletConnected(false);
    }
  }, [publicKey]);

  useEffect(() => {
    console.log("ViewMode changed:", viewMode);
  }, [viewMode]);

  useEffect(() => {
    console.log('BlogSection useEffect triggered:', { user: !!user, viewingUser: !!viewingUser, view, viewMode });
    if (viewingUser) {
      console.log('ViewingUser in BlogSection:', { 
        id: viewingUser.id, 
        username: viewingUser.username, 
        walletAddress: viewingUser.walletAddress,
        fullObject: viewingUser 
      });
      console.log('ViewingUser ID type:', typeof viewingUser.id);
      console.log('ViewingUser ID value:', viewingUser.id);
    }
    if (user || viewingUser) {
      fetchBlogs();
    }
  }, [user, viewingUser, view, viewMode]);

  useEffect(() => {
    if (activeProfileTab === 'music' && viewingUser?.walletAddress) {
      // Handle music loading
    }
  }, [activeProfileTab, viewingUser?.walletAddress]);

  useEffect(() => {
    if (user?.walletAddress) {
      fetchFollowing();
    }
  }, [user?.walletAddress]);

  const fetchBlogs = async () => {
    if (!user && !viewingUser) return;
    
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      
      if (viewingUser) {
        // When viewing a profile, ONLY fetch that user's blogs
        console.log('About to append authorId:', viewingUser.id, 'type:', typeof viewingUser.id);
        params.append('authorId', viewingUser.id);
        console.log('Fetching profile blogs for:', viewingUser.username, 'with ID:', viewingUser.id);
        console.log('ViewingUser object:', viewingUser);
      } else if (viewMode === 'blogs') {
        // Only add view parameters when in the main blog section
        params.append('view', view);
        if (user?.id) {
          params.append('userId', user.id);
        }
        console.log('Fetching main feed blogs, view:', view);
      }
      
      const url = `${api.blogs.list}?${params}`;
      console.log('Fetching blogs with URL:', url);
      console.log('URLSearchParams:', params.toString());
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch blogs');
      }
      
      const data = await response.json();
      console.log('Received blogs:', data.length, 'blogs');
      if (viewingUser) {
        console.log('Profile blogs data:', data);
      }

      // Initialize following state from blog data
      if (user?.walletAddress) {
        const followingSet = new Set<string>();
        data.forEach((blog: BlogData) => {
          if (blog.author.isFollowed) {
            followingSet.add(blog.author.walletAddress);
          }
        });
        setFollowing(followingSet);
      }

      setBlogs(data);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setBlogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewChange = (newView: BlogView) => {
    setView(newView);
    setSelectedBlog(null);
    // Always fetch blogs when changing views to ensure we have the latest data
    fetchBlogs();
  };

  const handleNavigate = (mode: ViewMode) => {
    console.log("Navigating to mode:", mode);
    setViewMode(mode);
    setSelectedBlog(null);
    
    // Fetch blogs if needed
    if (mode === 'blogs') {
      fetchBlogs();
    }
  };
  

  const handleCreateBlog = async (blog: { title: string; content: string }) => {
    if (!publicKey || !user) {
      alert('Please connect your wallet first');
      return;
    }
    
    try {
      // First, do the Solana transaction
      const signature = await createBlog({
        connection,
        wallet,
        fromOwner: publicKey,
        platformOwner: new PublicKey("54WUnJuNiGCAFfLfcWCP4NQsVMk16ETz6ghWrL8pK8kC"), // Specific receiver wallet
        feeOwner: PLATFORM_WALLET, // Platform gets the fee
        configAccount: CONFIG_ACCOUNT
      });

      console.log('Create blog transaction successful:', signature);

      // Update street credit balance after successful transaction
      await updateStreetCreditAfterTransaction(publicKey.toBase58());

      // Then update the backend
      const response = await fetch(api.blogs.create, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...blog,
          authorId: user.id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create blog');
      }

      await fetchBlogs();
      setShowBlogEditor(false);
    } catch (error) {
      console.error('Error creating blog:', error);
      alert(error instanceof Error ? error.message : 'Failed to create blog');
    }
  };

  const handleUserClick = (walletAddress: string) => {
    onUserClick(walletAddress);
  };

  const handleCloseProfile = () => {
    onCloseProfile();
  };

  const handleFollowToggle = async (userId: string) => {
    await onFollowToggle(userId);
    // Update following state
    setFollowing(prev => {
      const newFollowing = new Set(prev);
      if (newFollowing.has(userId)) {
        newFollowing.delete(userId);
      } else {
        newFollowing.add(userId);
      }
      return newFollowing;
    });
  };

  const fetchFollowing = async () => {
    try {
      const response = await fetch(api.users.following(user?.id || ''));
      if (response.ok) {
        const data = await response.json();
        // Store wallet addresses instead of IDs
        setFollowing(new Set(data.map((f: any) => f.walletAddress)));
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const fetchSavedBlogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(api.blogs.saved(user?.id || ''));
      if (!response.ok) {
        throw new Error('Failed to fetch saved blogs');
      }
      const data = await response.json();
      setSavedBlogs(data);
    } catch (error) {
      console.error('Error fetching saved blogs:', error);
      setSavedBlogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedComments = async () => {
    try {
      const response = await fetch(api.comments.saved(user?.id || ''));
      if (!response.ok) {
        throw new Error('Failed to fetch saved comments');
      }
      const data = await response.json();
      setSavedComments(data);
    } catch (error) {
      console.error('Error fetching saved comments:', error);
      setSavedComments([]);
    }
  };

  useEffect(() => {
    if (viewMode === 'support') {
      fetchSavedBlogs();
      fetchSavedComments();
    }
  }, [viewMode]);

  const handleUnsaveItem = async (type: 'blog' | 'photo' | 'comment', id: string) => {
    try {
      if (type === 'blog') {
        const response = await fetch(`${api.blogs.save(id)}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to unsave blog');
        setSavedBlogs(prev => prev.filter(item => item.id !== id));
      } else if (type === 'comment') {
        const response = await fetch(`${api.comments.save(id)}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to unsave comment');
        setSavedComments(prev => prev.filter(item => item.id !== id));
      }
      // Photo handling can be added here if needed
    } catch (error) {
      console.error('Error unsaving item:', error);
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    // Since we're receiving user and viewingUser as props,
    // we should notify the parent component about the update
    onUserUpdate(updatedUser);
  };

  const renderContent = () => {
    if (!publicKey) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center text-white">
          <p className="mb-4">Please connect your wallet to view content.</p>
          <WalletButton />
        </div>
      );
    }

    if (!user) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white" />
        </div>
      );
    }

    // Check if viewing a user profile first - this takes precedence over any view mode
    if (viewingUser) {
      return (
        <UserProfile
          user={user}
          viewingUser={viewingUser}
          isProfileOwner={isProfileOwner}
          viewMode={viewMode}
          activeProfileTab={activeProfileTab}
          isLoading={isLoading}
          blogs={blogs}
          songs={songs}
          isLoadingMusic={isLoadingMusic}
          isLoadingPhotos={isLoadingPhotos}
          onClose={handleCloseProfile}
          onTabChange={setActiveProfileTab}
          onEditBlog={(blog) => {
            setEditingBlog(blog);
            setShowBlogEditor(true);
          }}
          onUserClick={handleUserClick}
          onShowBlogEditor={() => setShowBlogEditor(true)}
          setSelectedBlog={setSelectedBlog}
          onClick={handleCloseProfile}
          onFollowToggle={handleFollowToggle}
          onUserUpdate={handleUserUpdate}
        />
      );
    }

    if (viewMode === 'search') {
      return (
        <div className="min-h-full w-full bg-transparent">
          <NavigationMenu
            user={user}
            viewMode={viewMode}
            view={view}
            onNavigate={handleNavigate}
            onViewChange={handleViewChange}
            onProfileClick={() => {
              if (user) {
                handleUserClick(user.walletAddress);
              }
            }}
            onUserClick={handleUserClick}
            onUserUpdate={handleUserUpdate}
            streamMode={streamMode}
            setStreamMode={setStreamMode}
          />
        </div>
      );
    }

    if (viewMode === 'scoreboard') {
      return (
        <div className="min-h-full w-full bg-transparent">
          <NavigationMenu
            user={user}
            viewMode={viewMode}
            view={view}
            onNavigate={handleNavigate}
            onViewChange={handleViewChange}
            onProfileClick={() => {
              if (user) {
                handleUserClick(user.walletAddress);
              }
            }}
            onUserClick={handleUserClick}
            onUserUpdate={handleUserUpdate}
            streamMode={streamMode}
            setStreamMode={setStreamMode}
          />
        </div>
      );
    }

    if (selectedBlog) {
      return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-2 sm:p-6">
          <div className="relative w-full max-w-2xl sm:max-w-3xl bg-zinc-900 mt-8 rounded-t-xl mx-auto">
            <div className="sticky top-0 z-10 bg-zinc-900 px-2 sm:px-6 py-4 sm:py-6 border-b border-white/10">
              <button
                onClick={() => setSelectedBlog(null)}
                className="text-white hover:text-white/80 transition-colors flex items-center space-x-2"
              >
                <span>←</span>
                <span className="hidden sm:inline">Back to blogs</span>
              </button>
            </div>
            <div className="relative px-2 sm:px-6 py-4 sm:py-6">
              <div className="bg-white/5 rounded-lg p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4">
                  <img
                    src={selectedBlog?.author.profilePic}
                    alt={selectedBlog?.author.username}
                    className="w-12 h-12 rounded-full cursor-pointer"
                    onClick={() => onUserClick(selectedBlog.author.walletAddress)}
                  />
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <div>
                          <h2 
                            className="font-bold text-white cursor-pointer hover:text-white/80"
                            onClick={() => onUserClick(selectedBlog.author.walletAddress)}
                          >
                            {selectedBlog?.author.username}
                          </h2>
                          <p className="text-xs text-white/60 font-mono">{selectedBlog?.author.walletAddress}</p>
                        </div>
                        {user && user.id !== selectedBlog.author.id && (
                          <FollowButton
                            currentUser={user}
                            targetUser={{
                              ...selectedBlog.author,
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
                        )}
                      </div>
                      <SavePostButton
                        currentUser={user}
                        blog={selectedBlog}
                        onBlogUpdate={() => {
                          // Refresh the selected blog data
                          const updatedBlog = blogs.find(b => b.id === selectedBlog.id);
                          if (updatedBlog) {
                            setSelectedBlog(updatedBlog);
                          }
                        }}
                      />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold mt-2 sm:mt-4 text-white">{selectedBlog?.title}</h1>
                    <p className="mt-2 sm:mt-4 text-white/90 whitespace-pre-wrap leading-relaxed">{selectedBlog?.content}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-4 text-white/60 text-xs sm:text-sm">
                      <span>{format(new Date(selectedBlog?.createdAt || ''), 'MMM d, yyyy')}</span>
                      <span>·</span>
                      <span>{selectedBlog?._count?.comments || 0} comments</span>
                      <span>·</span>
                      <span>{selectedBlog?._count?.savedBy || 0} saves</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Comments Section */}
              <CommentSection
                blog={selectedBlog}
                currentUser={user}
                onUserClick={onUserClick}
                onFollowToggle={onFollowToggle}
              />
            </div>
          </div>
        </div>
      );
    }

    if (viewMode === 'blogs') {
      return (
        <div className="min-h-full w-full bg-transparent">
          <NavigationMenu
            user={user}
            viewMode={viewMode}
            view={view}
            onNavigate={handleNavigate}
            onViewChange={handleViewChange}
            onProfileClick={() => {
              if (user) {
                handleUserClick(user.walletAddress);
              }
            }}
            onUserClick={handleUserClick}
            onUserUpdate={handleUserUpdate}
            streamMode={streamMode}
            setStreamMode={setStreamMode}
          />
          <div className="container mx-auto px-2 sm:px-4 max-w-6xl w-full py-4 sm:py-6">
            <div className="flex justify-between items-center mb-6">
              <UpgradeAccountButton />
              <div className="flex items-center space-x-3">
                <SubmitVideoButton />
                <button
                  onClick={() => setShowBlogEditor(true)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center space-x-2 holographic-hover whitespace-nowrap"
                >
                  <HiPencil size={20} />
                  <span className="hidden sm:inline">Create </span><span>Blog</span>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : blogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/70">
                <p className="text-lg">No blogs available</p>
                <p className="text-sm mt-2">Be the first to create a post!</p>
              </div>
            ) : (
              <div className="space-y-6 w-full">
                {blogs.map((blog) => (
                  <BlogArticle
                    key={blog.id}
                    blog={blog}
                    setSelectedBlog={setSelectedBlog}
                    onUserClick={handleUserClick}
                    user={user}
                    onFollowToggle={handleFollowToggle}
                    onBlogUpdate={fetchBlogs}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeProfileTab === 'support') {
      return (
        <SupportSection
          user={user}
          savedBlogs={savedBlogs}
          savedComments={savedComments}
          savedPhotos={savedPhotos}
          onUnsaveItem={handleUnsaveItem}
          onUserClick={handleUserClick}
          setSelectedBlog={setSelectedBlog}
          onFollowToggle={handleFollowToggle}
          onBlogUpdate={fetchSavedBlogs}
        />
      );
    }

    return null;
  };

  return (
    <div className="relative mt-2 z-[40] bg-zinc-900/95 crt-overlay w-full">

      {showBlogEditor && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center overflow-hidden">
          <div className="w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <BlogEditor
              onClose={() => {
                setShowBlogEditor(false);
                setEditingBlog(null);
              }}
              onSubmit={handleCreateBlog}
              initialBlog={editingBlog || undefined}
              isEditing={!!editingBlog}
            />
          </div>
        </div>
      )}

      {renderContent()}
    </div>
  );
} 