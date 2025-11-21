import { useState } from 'react';
import { useMusicData } from '@/hooks/useMusicData';
import MusicPlayer from '@/components/MusicPlayer';
import { Playlist } from '@/types/playlist';
import { Song } from '@/types/song';
import { User } from '@/types/user';
import { SongCarousel } from '@/components/ui/SongCarousel';

interface SongStreamProps {
  user: User;
}

export default function SongStream({ user }: SongStreamProps) {
    const [tab, setTab] = useState<'playlists' | 'uploads' | 'library'>('playlists');
    const {
      uploads, loadingUploads, fetchUploads,
      library, loadingLibrary, fetchLibrary,
      playlists, loadingPlaylists, fetchPlaylists,
    } = useMusicData(user.walletAddress);

    // For bottom player bar
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center py-8 relative overflow-hidden">
          {/* Rainbow Radio Mode Background - Dark Neon 2000s Style */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,0,128,0.2),transparent_50%)] animate-pulse-slow"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,255,255,0.15),transparent_50%)] animate-pulse-slow animation-delay-1000"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,0,0.1),transparent_50%)] animate-spin-slow"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(128,0,255,0.12),transparent_50%)] animate-pulse-slow animation-delay-2000"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(0,255,128,0.1),transparent_50%)] animate-pulse-slow animation-delay-3000"></div>
          
          {/* Rainbow grid pattern */}
          <div className="absolute inset-0 opacity-8">
            <div className="w-full h-full" style={{
              backgroundImage: `
                linear-gradient(rgba(255,0,128,0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,255,255,0.15) 1px, transparent 1px)
              `,
              backgroundSize: '25px 25px'
            }}></div>
          </div>
          <div className="relative z-10 flex space-x-4 mb-8">
            <button
              className={`px-6 py-2 rounded-lg font-bold transition-all duration-300 ${
                tab === 'playlists' 
                  ? 'bg-pink-400 text-black shadow-lg shadow-pink-400/50' 
                  : 'bg-gray-800 text-pink-300 hover:bg-gray-700 border border-pink-400/30'
              }`}
              onClick={() => setTab('playlists')}
            >
              Playlists
            </button>
            <button
              className={`px-6 py-2 rounded-lg font-bold transition-all duration-300 ${
                tab === 'uploads' 
                  ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/50' 
                  : 'bg-gray-800 text-cyan-300 hover:bg-gray-700 border border-cyan-400/30'
              }`}
              onClick={() => setTab('uploads')}
            >
              Uploads
            </button>
            <button
              className={`px-6 py-2 rounded-lg font-bold transition-all duration-300 ${
                tab === 'library' 
                  ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/50' 
                  : 'bg-gray-800 text-yellow-300 hover:bg-gray-700 border border-yellow-400/30'
              }`}
              onClick={() => setTab('library')}
            >
              Library
            </button>
          </div>
          <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
            {tab === 'uploads' && (
              loadingUploads ? <div className="text-cyan-300">Loading...</div> :
              uploads.length > 0 ? (
                <SongCarousel items={uploads} onSelect={setSelectedSong} />
              ) : (
                <div className="text-cyan-300/70">No uploads found.</div>
              )
            )}
            {tab === 'library' && (
              loadingLibrary ? <div className="text-yellow-300">Loading...</div> :
              library.length > 0 ? (
                <SongCarousel items={library} onSelect={setSelectedSong} />
              ) : (
                <div className="text-yellow-300/70">No saved songs found.</div>
              )
            )}
            {tab === 'playlists' && (
              loadingPlaylists ? <div className="text-pink-300">Loading...</div> :
              playlists.length > 0 ? (
                <div className="text-pink-300/70">Playlists feature coming soon...</div>
              ) : (
                <div className="text-pink-300/70">No playlists found.</div>
              )
            )}
          </div>

          {/* Bottom Music Player Bar */}
          {selectedSong && (
            <div className="fixed bottom-0 left-0 w-full z-50 bg-gradient-to-r from-gray-900 via-gray-950 to-black shadow-2xl border-t border-gray-950">
              <div className="max-w-3xl mx-auto px-4 py-2 flex items-center">
                <MusicPlayer
                  song={{
                    ...selectedSong,
                    audioUrl: selectedSong.audioUrl,
                  }}
                  autoPlay
                />
                <button
                  className="ml-4 px-3 py-1 text-xs bg-gray-950 text-white rounded hover:bg-gray-800 transition"
                  onClick={() => setSelectedSong(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Playlist Modal (implement as needed) */}
          {selectedPlaylist && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">{selectedPlaylist.name}</h2>
                {/* Render playlist songs here */}
                <button className="mt-4 px-4 py-2 bg-purple-700 text-white rounded" onClick={() => setSelectedPlaylist(null)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      );
}
