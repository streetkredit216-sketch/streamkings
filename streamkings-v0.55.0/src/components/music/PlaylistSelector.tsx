import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { api } from '@/lib/api';

interface Playlist {
  id: string;
  name: string;
}

interface PlaylistSelectorProps {
  show: boolean;
  onClose: () => void;
  userId: string;
  songId: string;
}

const PlaylistSelector = ({ show, onClose, userId, songId }: PlaylistSelectorProps) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (show && userId) {
      fetchPlaylists();
    }
  }, [show, userId]);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch(api.playlists.getUserPlaylists(userId));
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      const response = await fetch(api.playlists.addSong, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playlistId,
          songId,
        }),
      });

      if (response.ok) {
        onClose();
      }
    } catch (error) {
      console.error('Error adding song to playlist:', error);
    }
  };

  return (
    <Dialog open={show} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
          <Dialog.Title className="text-xl font-bold text-white mb-4">
            Add to Playlist
          </Dialog.Title>

          {loading ? (
            <p className="text-white/60">Loading playlists...</p>
          ) : playlists.length === 0 ? (
            <p className="text-white/60">No playlists yet. Create one first!</p>
          ) : (
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleAddToPlaylist(playlist.id)}
                  className="w-full p-3 text-left text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {playlist.name}
                </button>
              ))}
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default PlaylistSelector; 