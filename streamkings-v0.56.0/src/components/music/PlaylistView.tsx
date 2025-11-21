import { Song } from '@/types/song';
import { User } from '@/types/user';
import SongCard from './SongCard';
import { HiArrowLeft } from 'react-icons/hi';

interface PlaylistViewProps {
  playlist: {
    id: string;
    name: string;
    songs: Array<{
      song: Song;
    }>;
  };
  onBack: () => void;
  user: User | null;
  onLikeToggle: (songId: string) => void;
  onAddToPlaylist: (songId: string) => void;
}

const PlaylistView = ({ playlist, onBack, user, onLikeToggle, onAddToPlaylist }: PlaylistViewProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <HiArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h3 className="text-xl font-bold text-white">{playlist.name}</h3>
      </div>

      {playlist.songs.length === 0 ? (
        <p className="text-white/60 text-center py-4">No songs in this playlist yet</p>
      ) : (
        <div className="space-y-4">
          {playlist.songs.map(({ song }) => (
            <SongCard
              key={song.id}
              song={song}
              user={user}
              isPurchased={true}
              onLikeToggle={onLikeToggle}
              onAddToPlaylist={onAddToPlaylist}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaylistView; 