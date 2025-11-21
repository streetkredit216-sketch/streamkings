import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { Song } from '@/types/song';

interface MusicPlayerProps {
  song: Song;
  onPlay?: (songId: string) => void;
  autoPlay?: boolean;
  onSkipNext?: () => void;
  onSkipPrev?: () => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  song,
  onPlay,
  autoPlay,
  onSkipNext,
  onSkipPrev,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1); // 1 = 100%
  const [error, setError] = useState<string | null>(null);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        await audio.pause();
      } else {
        await audio.play();
        onPlay?.(song.id);
      }
      setIsPlaying(!isPlaying);
      setError(null);
    } catch (err) {
      console.error('Error playing audio:', err);
      setError('Failed to play audio. Please try again.');
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error('Error auto-playing audio:', err);
        setError('Failed to auto-play audio.');
      });
      setIsPlaying(true);
      onPlay?.(song.id);
    }
  }, [autoPlay, song.id, onPlay]);

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    setError(null);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, [song.id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  return (
    <div className="relative flex items-center w-full p-2 border rounded-lg shadow-md bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Watermark Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg z-0">
        <div className="watermark-text" style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '0', 
          color: 'rgba(255, 255, 255, 0.08)', 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          whiteSpace: 'nowrap',
          animation: 'watermarkScroll 20s linear infinite',
          fontFamily: 'Bank Gothic, sans-serif',
          letterSpacing: '0.3em',
          transform: 'translateY(-50%)'
        }}>
          Stream Kings
        </div>
        <div className="watermark-text" style={{ 
          position: 'absolute', 
          top: '30%', 
          left: '0', 
          color: 'rgba(255, 255, 255, 0.06)', 
          fontSize: '1.2rem', 
          fontWeight: 'bold', 
          whiteSpace: 'nowrap',
          animation: 'watermarkScroll 22s linear infinite',
          animationDelay: '-7s',
          fontFamily: 'Bank Gothic, sans-serif',
          letterSpacing: '0.3em',
          transform: 'translateY(-50%)'
        }}>
          Stream Kings
        </div>
      </div>

      {/* Existing content with relative z-index */}
      <div className="relative z-10 flex items-center w-full">
      {song.coverImage && (
        <img src={song.coverImage} alt={`Cover for ${song.title}`} className="w-12 h-12 rounded mr-4" />
      )}
      <div className="flex-1">
        <div className="font-semibold">{song.title}</div>
        <div className="text-sm text-gray-300">{song.artist}</div>
        <input
          type="range"
          min={0}
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          className="w-full accent-purple-400"
          aria-label="Seek position"
        />
        <div className="text-xs text-gray-300 flex justify-between">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        {error && (
          <div className="text-xs text-red-400 mt-1">{error}</div>
        )}
      </div>
      <div className="flex items-center ml-4 space-x-2">
        {onSkipPrev && (
          <button 
            onClick={onSkipPrev} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Previous track"
          >
            <SkipBack className="w-5 h-5" />
          </button>
        )}
        <button 
          onClick={togglePlay} 
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>
        {onSkipNext && (
          <button 
            onClick={onSkipNext} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Next track"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        )}
        {/* Volume Bar */}
        <div className="flex items-center ml-4 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 rounded px-2 py-1">
          <span className="text-xs text-gray-300 mr-2" aria-hidden="true">🔊</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolumeChange}
            className="accent-purple-400"
            style={{ width: 80 }}
            aria-label="Volume control"
          />
        </div>
      </div>
      <audio
        ref={audioRef}
        src={song.audioUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onError={() => setError('Error loading audio file')}
      />
      </div>
    </div>
  );
};

function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default MusicPlayer;
