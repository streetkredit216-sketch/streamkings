import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { api } from '@/lib/api';

interface CreatePlaylistModalProps {
  show: boolean;
  onClose: () => void;
  userId: string;
}

const CreatePlaylistModal = ({ show, onClose, userId }: CreatePlaylistModalProps) => {
  const [playlistName, setPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim()) return;
  
    setIsCreating(true);
    try {
      console.log('Submitting playlist creation:', { name: playlistName, userId });
      const response = await fetch(api.playlists.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlistName,
          userId, // This is the wallet address
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create playlist');
      }

      // Reset form and close modal
      console.log('Playlist created:', data);
      setPlaylistName('');
      onClose();
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert(error instanceof Error ? error.message : 'Failed to create playlist');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={show} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
          <Dialog.Title className="text-xl font-bold text-white mb-4">
            Create New Playlist
          </Dialog.Title>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Playlist name"
              className="w-full px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
              disabled={isCreating}
            />

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-white/70 hover:text-white"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50"
                disabled={isCreating || !playlistName.trim()}
              >
                {isCreating ? 'Creating...' : 'Create Playlist'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default CreatePlaylistModal; 