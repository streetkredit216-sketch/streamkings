import { HiUpload, HiPlus } from 'react-icons/hi'; // Add HiPlus import
import { useEffect, useState } from 'react';
import SongCard from './SongCard';
import { User } from '@/types/user';
import { Song } from '@/types/song';
import CreatePlaylistModal from './CreatePlaylistModal'; // We'll create this next
import PlaylistSelector from './PlaylistSelector';
import { api } from '@/lib/api';
import { Playlist } from '@/types/playlist';
import PlaylistView from './PlaylistView';
import { ProfileTab } from '@/types/user';

interface RenderMusicProps {
  user: User | null;  // Currently logged in user
  profileUser: User;  // User whose profile we're viewing
  activeProfileTab: ProfileTab;
  isProfileOwner: boolean;
  songs: Song[];
  isLoadingMusic: boolean;
  setShowSongUploader: (show: boolean) => void;
}

const RenderMusic = ({
  user,
  activeProfileTab,
  profileUser,
  isProfileOwner,
  setShowSongUploader
}: RenderMusicProps) => {
  const isArtist = profileUser.role === 'ARTIST';
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [purchases, setPurchases] = useState<Song[]>([]);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  
  const fetchPlaylists = async () => {
    try {
      console.log('Fetching playlists for user:', profileUser.walletAddress);
      const response = await fetch(api.playlists.getUserPlaylists(profileUser.walletAddress));
      console.log('Playlist response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch playlists');
      }
      
      const data = await response.json();
      console.log('Fetched playlists:', data);
      setPlaylists(data);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setPlaylists([]);
    }
  };

  const fetchSongs = async () => {
    setIsLoadingMusic(true);
    try {
      const params = new URLSearchParams();
      if (profileUser?.walletAddress) {
        params.append('userId', profileUser.walletAddress);
      }
      
      const url = `${api.songs.list}?${params}`;
      console.log('Attempting to fetch songs:', {
        url,
        walletAddress: profileUser.walletAddress,
        username: profileUser.username,
        isArtist: profileUser.role === 'ARTIST',
        activeTab: activeProfileTab
      });
      
      const response = await fetch(url);
      console.log('Songs response:', {
        status: response.status,
        ok: response.ok
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch songs');
      }
      
      const data = await response.json();
      console.log('Songs fetch successful:', {
        count: data.length,
        songs: data
      });
      setSongs(data);
    } catch (error) {
      console.error('Error fetching songs:', error);
      setSongs([]);
    } finally {
      setIsLoadingMusic(false);
    }
  };

  const fetchPurchases = async () => {
    if (!profileUser?.walletAddress) return;
    
    setIsLoadingPurchases(true);
    try {
      const url = `${api.songs.library}?userId=${profileUser.walletAddress}`;
      console.log('Attempting to fetch purchases:', {
        url,
        walletAddress: profileUser.walletAddress,
        username: profileUser.username,
        activeTab: activeProfileTab
      });

      const response = await fetch(url);
      console.log('Purchases response:', {
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error('Failed to fetch library');
      }

      const data = await response.json();
      console.log('Purchases fetch successful:', {
        count: data.length,
        purchases: data
      });
      setPurchases(data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setPurchases([]);
    } finally {
      setIsLoadingPurchases(false);
    }
  };

  useEffect(() => {
    console.log('RenderMusic received props:', {
      activeProfileTab,
      profileUser: profileUser?.username,
      isArtist: profileUser?.role === 'ARTIST'
    });
  }, [activeProfileTab, profileUser]);

  useEffect(() => {
    console.log('Songs useEffect triggered:', {
      activeTab: activeProfileTab,
      hasWalletAddress: !!profileUser?.walletAddress,
      isArtist: profileUser?.role === 'ARTIST',
      shouldFetch: activeProfileTab === 'music' && profileUser?.walletAddress && profileUser.role === 'ARTIST'
    });

    if (activeProfileTab === 'music' && profileUser?.walletAddress && profileUser.role === 'ARTIST') {
      fetchSongs();
    }
  }, [activeProfileTab, profileUser]);

  useEffect(() => {
    console.log('Purchases useEffect triggered:', {
      activeTab: activeProfileTab,
      hasWalletAddress: !!profileUser?.walletAddress,
      shouldFetch: activeProfileTab === 'music' && profileUser?.walletAddress
    });

    if (activeProfileTab === 'music' && profileUser?.walletAddress) {
      fetchPurchases();
    }
  }, [activeProfileTab, profileUser]);

  useEffect(() => {
    if (profileUser?.walletAddress) {
      fetchPlaylists();
    }
  }, [profileUser?.walletAddress]);

  const handleAddToPlaylist = (songId: string) => {
    setSelectedSongId(songId);
    setShowPlaylistSelector(true);
  };

  console.log('Purchases in RenderMusic:', purchases);
  console.log('Current user:', user);
  console.log('Profile user:', profileUser);

  const handleLikeToggle = (songId: string) => {
    // Handle like toggle logic if needed
  };

  const fetchPlaylist = async (playlistId: string) => {
    try {
      // Update the endpoint to match the backend route structure
      const response = await fetch(api.playlists.getPlaylist(playlistId));
      console.log('Fetching playlist:', playlistId);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch playlist');
      }
      
      const data = await response.json();
      console.log('Fetched playlist data:', data);
      setSelectedPlaylist(data);
    } catch (error) {
      console.error('Error fetching playlist:', error);
    }
  };

  return (
    <div className={`grid ${isArtist ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'} gap-4 sm:gap-6`}>
      {/* Uploads Column (Artists Only) */}
      {isArtist && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Uploads ({songs.length})
            </h3>
            {isProfileOwner && (
              <button
                onClick={() => setShowSongUploader(true)}
                className="px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm sm:text-base"
              >
                <HiUpload className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Upload Song</span>
                <span className="sm:hidden">Upload</span>
              </button>
            )}
          </div>
          {isLoadingMusic ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white" />
            </div>
          ) : songs.length === 0 ? (
            <p className="text-center text-white/60 py-8">No songs uploaded yet</p>
          ) : (
            <div className="space-y-4">
              {songs.map((song) => (
                <SongCard 
                  key={song.id} 
                  song={song}
                  isPurchased={song.isLiked ?? false}
                  user={user}  // Pass the logged-in user
                  onLikeToggle={handleLikeToggle}
                  onAddToPlaylist={(songId) => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Playlists Column */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-white">Playlists</h3>
          {isProfileOwner && !selectedPlaylist && (
            <button
              onClick={() => setShowCreatePlaylist(true)}
              className="px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm sm:text-base"
            >
              <HiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Create Playlist</span>
              <span className="sm:hidden">Create</span>
            </button>
          )}
        </div>
        
        {selectedPlaylist ? (
          <PlaylistView
            playlist={selectedPlaylist}
            onBack={() => setSelectedPlaylist(null)}
            user={user}
            onLikeToggle={handleLikeToggle}
            onAddToPlaylist={handleAddToPlaylist}
          />
        ) : playlists.length === 0 ? (
          <p className="text-center text-white/60 py-8">No playlists yet</p>
        ) : (
          <div className="space-y-4">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => fetchPlaylist(playlist.id)}
                className="w-full bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors text-left"
              >
                <h4 className="text-white font-bold">{playlist.name}</h4>
                <p className="text-white/60 text-sm">
                  {playlist.songs?.length || 0} songs
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Modals */}
        <CreatePlaylistModal
          show={showCreatePlaylist}
          onClose={() => {
            setShowCreatePlaylist(false);
            fetchPlaylists();
          }}
          userId={user?.walletAddress || ''}
        />
        
        <PlaylistSelector
          show={showPlaylistSelector}
          onClose={() => {
            setShowPlaylistSelector(false);
            if (selectedPlaylist) {
              fetchPlaylist(selectedPlaylist.id); // Refresh playlist after adding song
            }
          }}
          userId={user?.walletAddress || ''}
          songId={selectedSongId || ''}
        />
      </div>

      {/* Library Column */}
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
          Library ({purchases.length})
        </h3>
        {isLoadingPurchases ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white" />
          </div>
        ) : !purchases || purchases.length === 0 ? (
          <div>
            <p className="text-white/60">
              {isProfileOwner 
                ? "You haven't purchased any songs yet"
                : `${profileUser.username} hasn't purchased any songs yet`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((song: Song) => (
              <SongCard 
                key={song.id} 
                song={song} 
                user={user}
                isPurchased={isProfileOwner}
                onLikeToggle={handleLikeToggle}
                onAddToPlaylist={handleAddToPlaylist}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RenderMusic;
