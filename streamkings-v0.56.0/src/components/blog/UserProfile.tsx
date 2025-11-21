import { useState, useEffect, useRef } from 'react';
import { User, ProfileTab } from '@/types/user';
import BlogArticle from './BlogArticle';
import PhotoGrid from '../PhotoGrid';
import RenderMusic from '../music/RenderMusic';
import SupportSection from './SupportSection';
import { Song } from '@/types/song';
import { BlogData, SavedBlogReference } from '@/types/blog';
import { Photo } from '@/types/photo';
import { api } from '@/lib/api';
import SongUploader from '../SongUploader';
import { useStreetCredit } from '@/hooks/useStreetCredit';
import { formatUserRole } from '@/lib/utils';
import { useError } from '@/contexts/ErrorContext';

interface UserProfileProps {
  user: User | null;
  viewingUser: User | null;
  isProfileOwner: boolean;
  viewMode: string;
  activeProfileTab: ProfileTab;
  isLoading: boolean;
  blogs: BlogData[];
  songs: Song[];
  isLoadingMusic: boolean;
  isLoadingPhotos: boolean;
  onClose: () => void;
  onTabChange: (tab: ProfileTab) => void;
  onEditBlog: (blog: any) => void;
  onDeleteBlog?: (blogId: string) => void;
  onUserClick: (walletAddress: string) => void;
  onShowBlogEditor: () => void;
  onShowSongUploader?: (show: boolean) => void;
  onFollowToggle: (userId: string) => Promise<void>;
  setSelectedBlog: (blog: any) => void;
  onClick?: () => void;
  onUserUpdate: (updatedUser: User) => void;
}

const UserProfile = ({
  user,
  viewingUser,
  isProfileOwner,
  viewMode,
  activeProfileTab,
  isLoading,
  blogs,
  songs,
  isLoadingMusic,
  onClose,
  onTabChange,
  onEditBlog,
  onDeleteBlog,
  onUserClick,
  onShowBlogEditor,
  onShowSongUploader,
  onFollowToggle,
  setSelectedBlog,
  onClick,
  onUserUpdate,
}: UserProfileProps) => {
  const { balance, isLoading: isBalanceLoading, error: balanceError } = useStreetCredit();
  const { showError } = useError();

  // Trigger pulse animation when balance changes
  useEffect(() => {
    if (balance !== undefined && balance > 0) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [balance]);

  console.log('UserProfile props:', {
    hasUser: !!user,
    hasViewingUser: !!viewingUser,
    isProfileOwner,
    hasOnUserUpdate: !!onUserUpdate
  });

  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const profileUser = viewingUser || user;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [showPhotoUploader, setShowPhotoUploader] = useState(false);
  const [isUpdatingProfilePic, setIsUpdatingProfilePic] = useState(false);
  const [isUpdatingBanner, setIsUpdatingBanner] = useState(false);
  const [savedBlogs, setSavedBlogs] = useState<SavedBlogReference[]>([]);
  const [savedPhotos, setSavedPhotos] = useState<Photo[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [showSongUploader, setShowSongUploader] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);

  const fetchPhotos = async () => {
    try {
      setIsLoadingPhotos(true);
      const params = new URLSearchParams();
      
      if (profileUser?.walletAddress) {
        params.append('userId', profileUser.walletAddress);
      }
      
      const response = await fetch(`${api.photos.list}?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      
      setPhotos(data);
    } catch (error) {
      console.error('Error fetching photos:', error);
      setPhotos([]);
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user?.walletAddress) return;
    
    setIsUpdatingProfilePic(true);
    try {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);

      const response = await fetch(api.users.updateProfilePic(user.walletAddress), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to update profile picture. Network error occurred.');
      }

      const updatedUser = await response.json();
      console.log('Profile picture updated successfully:', updatedUser);
      
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update profile picture. Please ensure the file is a valid image (JPG, PNG, etc.) and try again.';
      showError(errorMessage, 'PROFILE PICTURE ERROR');
    } finally {
      setIsUpdatingProfilePic(false);
    }
  };

  const handleDescriptionUpdate = async () => {
    if (!user?.walletAddress) return;
    
    setIsUpdatingDescription(true);
    try {
      const response = await fetch(api.users.updateDescription(user.walletAddress), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: editedDescription }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to update description. Network error occurred.');
      }

      const updatedUser = await response.json();
      console.log('Description updated successfully:', updatedUser);
      
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
      
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Error updating description:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update description. Please try again.';
      showError(errorMessage, 'DESCRIPTION UPDATE ERROR');
    } finally {
      setIsUpdatingDescription(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user?.walletAddress) return;
    
    setIsUpdatingBanner(true);
    try {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);

      const response = await fetch(api.users.updateBanner(user.walletAddress), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to update banner image. Server returned status ${response.status}.`);
      }
  
      const updatedUser = await response.json();
      console.log('Banner updated successfully:', updatedUser);
      
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
    } catch (error) {
      console.error('Error updating banner:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update banner image. Please ensure the file is a valid image and under 10MB.';
      showError(errorMessage, 'BANNER UPDATE ERROR');
    } finally {
      setIsUpdatingBanner(false);
    }
  };

  const handlePhotoUpload = async (data: { imageFile: File; description: string }) => {
    if (!user?.walletAddress) {
      showError('Please connect your wallet to upload photos', 'WALLET REQUIRED');
      return;
    }
    
    // Validate file size (e.g., max 10MB)
    if (data.imageFile.size > 10 * 1024 * 1024) {
      showError('Photo size exceeds 10MB limit. Please compress or use a smaller image', 'FILE TOO LARGE');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(data.imageFile.type)) {
      showError('Invalid file type. Please use JPG, PNG, GIF, or WebP format', 'INVALID FILE TYPE');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', data.imageFile);
      formData.append('description', data.description);
      formData.append('walletAddress', user.walletAddress);

      const response = await fetch(api.photos.upload, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || `Failed to upload photo. Server returned status ${response.status}.`);
      }

      await fetchPhotos();
      setShowPhotoUploader(false);
    } catch (error) {
      console.error('Error in handlePhotoUpload:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to upload photo. Please check your connection and try again.';
      showError(errorMessage, 'UPLOAD ERROR');
    }
  };

  const handleUnsaveItem = async (type: 'blog' | 'photo', id: string) => {
    try {
      const endpoint = type === 'blog' 
        ? `${api.blogs.save(id)}`
        : `${api.photos.save(id)}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to unsave ${type}. Server returned status ${response.status}.`);
      }

      // Update local state after successful unsave
      if (type === 'blog') {
        setSavedBlogs(prev => prev.filter(savedBlog => savedBlog.blog.id !== id));
      } else {
        setSavedPhotos(prev => prev.filter(photo => photo.id !== id));
      }
    } catch (error) {
      console.error(`Error unsaving ${type}:`, error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : `Failed to unsave ${type}. Please check your connection and try again.`;
      showError(errorMessage, `UNSAVE ${type.toUpperCase()} ERROR`);
    }
  };

  useEffect(() => {
    if (activeProfileTab === 'photos' && profileUser?.walletAddress) {
      fetchPhotos();
    }
  }, [activeProfileTab, profileUser?.walletAddress]);

  useEffect(() => {
    const fetchSavedItems = async () => {
      if (!profileUser?.walletAddress || activeProfileTab !== 'support') return;

      setIsLoadingSaved(true);
      try {
        console.log('Fetching saved blogs for user:', {
          walletAddress: profileUser.walletAddress,
          username: profileUser.username
        });
        
        // Fetch saved blogs
        const blogsResponse = await fetch(api.blogs.saved(profileUser.id));
        console.log('Saved blogs response:', {
          status: blogsResponse.status,
          ok: blogsResponse.ok
        });
        
        if (blogsResponse.ok) {
          const blogsData = await blogsResponse.json();
          console.log('Fetched saved blogs:', {
            count: blogsData.length,
            data: blogsData
          });
          setSavedBlogs(blogsData);
        } else {
          const errorText = await blogsResponse.text();
          console.error('Failed to fetch saved blogs:', {
            status: blogsResponse.status,
            error: errorText
          });
          setSavedBlogs([]);
        }

        // Fetch saved photos
        try {
          const photosResponse = await fetch(`${api.photos.saved}?userId=${profileUser.walletAddress}`);
          if (photosResponse.ok) {
            const photosData = await photosResponse.json();
            console.log('Fetched saved photos:', photosData);
            setSavedPhotos(photosData);
          } else {
            console.warn('No saved photos found');
            setSavedPhotos([]);
          }
        } catch (photoError) {
          console.warn('Photos endpoint not available:', photoError);
          setSavedPhotos([]);
        }
      } catch (error) {
        console.error('Error fetching saved items:', error);
        setSavedBlogs([]);
        setSavedPhotos([]);
      } finally {
        setIsLoadingSaved(false);
      }
    };

    fetchSavedItems();
  }, [profileUser?.walletAddress, activeProfileTab]);

  const handleSongUploaded = async () => {
    if (onShowSongUploader) {
      onShowSongUploader(false);
    }
  };

  const renderBalance = () => {
    if (!isProfileOwner) {
      return <div className={`text-3xl font-bold text-white glitch-text-hover ${isPulsing ? 'kred-pulse' : ''}`}>{profileUser?.streetCredit || 0}</div>;
    }

    if (isBalanceLoading) {
      return <div className="text-3xl font-bold text-white">...</div>;
    }
    if (balanceError) {
      return <div className="text-sm font-bold text-red-500">{balanceError}</div>;
    }
    return <div className={`text-3xl font-bold text-white glitch-text-hover ${isPulsing ? 'kred-pulse' : ''}`}>{balance}</div>;
  };

  const renderProfileView = () => {
    if (!profileUser || !viewingUser) return null;

    return (
      <div 
        className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center overflow-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="relative w-full max-w-6xl mx-2 sm:mx-4 max-h-[90vh] bg-zinc-900 rounded-xl overflow-y-auto overflow-x-hidden">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Close profile"
            aria-label="Close profile"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Banner as background */}
          <div className="absolute inset-0 w-full">
            {profileUser.profileBanner ? (
              <div className="relative w-full h-full">
                <img
                  src={profileUser.profileBanner}
                  alt="Profile Banner"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-zinc-900/80 to-zinc-900" />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-zinc-800 to-zinc-900" />
            )}
            {isProfileOwner && (
              <button
                onClick={() => bannerInputRef.current?.click()}
                className="absolute top-4 right-16 px-4 py-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors flex items-center space-x-2 z-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Update Banner</span>
              </button>
            )}
          </div>

          {/* Content container with padding for banner */}
          <div className="relative z-10 pt-20 sm:pt-32 px-2 sm:px-4">
            {/* Profile Picture */}
            <div className="relative mx-auto w-24 sm:w-32 mb-4 sm:mb-6">
              <div className="relative group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 sm:border-4 border-zinc-900 mx-auto">
                  <img
                    src={profileUser.profilePic || '/images/default-profile.png'}
                    alt={profileUser.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                {isProfileOwner && (
                  <button
                    onClick={() => profilePicInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                    aria-label="Change profile picture"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-white glitch-text-hover">{profileUser.username}</h1>
              <p className="text-xs sm:text-sm text-white/60 mb-4 font-mono break-all">{profileUser.walletAddress}</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mb-6">
                <div>
                  {renderBalance()}
                  <div className="text-white/60">Street Kredit</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white glitch-text-hover">#{profileUser.ranking}</div>
                  <div className="text-white/60">Ranking</div>
                </div>
              </div>
              {profileUser?.role && (
                <div className="text-sm text-white/60">
                  {formatUserRole(profileUser.role)}
                </div>
              )}
              <div className="max-w-2xl mx-auto">
                {isEditingDescription && isProfileOwner ? (
                  <div className="space-y-2">
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/30 resize-none"
                      rows={4}
                      disabled={isUpdatingDescription}
                    />
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={handleDescriptionUpdate}
                        disabled={isUpdatingDescription}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isUpdatingDescription ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingDescription(false);
                          setEditedDescription(profileUser?.description || '');
                        }}
                        disabled={isUpdatingDescription}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-white/80">{profileUser?.description || 'No bio yet.'}</p>
                    {isProfileOwner && (
                      <button
                        onClick={() => {
                          setEditedDescription(profileUser?.description || '');
                          setIsEditingDescription(true);
                        }}
                        className="text-white/60 hover:text-white/80 text-sm px-2 py-1 rounded transition-colors"
                        title="Edit bio"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="max-w-6xl mx-auto px-2 sm:px-4">
              <div className="flex flex-wrap justify-center gap-2 sm:gap-8 border-b border-white/10 overflow-x-auto">
                {(['blogs', 'events', 'music', 'photos', 'support'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={`py-2 sm:py-4 px-3 sm:px-6 text-sm sm:text-lg transition-colors whitespace-nowrap ${
                      activeProfileTab === tab
                        ? 'text-white border-b-2 border-white'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="py-8">
                {activeProfileTab === 'blogs' && (
                  <div className="space-y-6">
                    {blogs.map((blog) => (
                      <BlogArticle
                        key={blog.id}
                        blog={blog}
                        setSelectedBlog={setSelectedBlog}
                        onEdit={() => onEditBlog(blog)}
                        onDelete={() => onDeleteBlog?.(blog.id)}
                        onUserClick={onUserClick}
                        onFollowToggle={onFollowToggle}
                        user={user}
                      />
                    ))}
                  </div>
                )}
                {activeProfileTab === 'photos' && (
                  <div className="space-y-6">
                    {photos.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-white/60 text-lg">Photos feature coming soon...</p>
                      </div>
                    ) : (
                      <>
                        {isProfileOwner && (
                          <button
                            onClick={() => setShowPhotoUploader(true)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
                            aria-label="Upload photo"
                          >
                            Upload Photo
                          </button>
                        )}
                        <PhotoGrid
                          initialPhotos={photos}
                          onUserClick={onUserClick}
                        />
                      </>
                    )}
                  </div>
                )}
                {activeProfileTab === 'events' && (
                  <div className="grid grid-cols-1 gap-6">
                    <p className="text-center text-white/60">Event features coming soon...</p>
                  </div>
                )}
                {activeProfileTab === 'music' && (
                  <RenderMusic
                    user={user}
                    profileUser={profileUser}
                    isProfileOwner={isProfileOwner}
                    songs={songs}
                    activeProfileTab={activeProfileTab}
                    isLoadingMusic={isLoadingMusic}
                    setShowSongUploader={setShowSongUploader}
                  />
                )}
                {activeProfileTab === 'support' && (
                  <div className="space-y-6">
                    {savedBlogs.map((savedBlog) => (
                      <BlogArticle
                        key={savedBlog.blog.id}
                        blog={savedBlog.blog}
                        setSelectedBlog={setSelectedBlog}
                        onUserClick={onUserClick}
                        onFollowToggle={onFollowToggle}
                        user={user}
                        onUnsave={() => handleUnsaveItem('blog', savedBlog.blog.id)}
                        showUnsaveButton
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hidden file inputs */}
          <input
            type="file"
            ref={profilePicInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleProfilePicUpload}
            title="Upload profile picture"
          />
          <input
            type="file"
            ref={bannerInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleBannerUpload}
            title="Upload banner image"
          />
        </div>
        {showSongUploader && user?.role && user?.walletAddress && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="w-full max-w-lg mx-auto">
              <SongUploader
                onClose={() => setShowSongUploader(false)}
                onSuccess={handleSongUploaded}
                userRole={user.role}
                walletAddress={user.walletAddress}
              />
            </div>
          </div>
        )}
        {selectedPhoto && (
          <button
            onClick={() => setSelectedPhoto(null)}
            className="fixed top-6 right-6 z-[51] p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close photo view"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <button
        onClick={onClick}
        className="flex items-center space-x-3 pr-6 border-r border-white/10 hover:bg-white/5 rounded-lg transition-colors"
        aria-label="View profile"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10">
          <img
            src={user?.profilePic || "/images/default-profile.png"}
            alt={user?.username || "Default profile"}
            className="w-full h-full object-cover glitch-hover"
          />
        </div>
        <div className="text-left">
          <span className="block text-sm font-medium glitch-text-hover">{user?.username || "Loading..."}</span>
          <span className="block text-xs text-white/60 font-mono">{user?.walletAddress}</span>
          <span className="block text-xs text-white/60">{user?.role ? formatUserRole(user.role) : 'User'}</span>
        </div>
      </button>
      {renderProfileView()}
    </>
  );
};

export default UserProfile; 