'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FaPlay, FaPause, FaExpand, FaCompress, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { BiSkipNext, BiSkipPrevious } from 'react-icons/bi';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  onEnded: () => void;
  autoPlay?: boolean;
  startTime?: number;
}

export default function VideoPlayer({ 
  videoUrl, 
  title, 
  artist, 
  thumbnailUrl,
  onEnded,
  autoPlay,
  startTime
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleError = (e: Event) => {
      const videoElement = e.target as HTMLVideoElement;
      console.error('Video loading error:', {
        error: e,
        networkState: videoElement.networkState,
        readyState: videoElement.readyState,
        errorCode: videoElement.error?.code,
        errorMessage: videoElement.error?.message,
        currentSrc: videoElement.currentSrc
      });
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      video.volume = volume;
      video.muted = isMuted;
      if (autoPlay && !isPlaying) {
        video.play().catch((err) => {
          console.warn('Autoplay failed:', err);
          setIsPlaying(false);
        });
      }
    };

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleEnded = () => onEnded?.();
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [autoPlay, onEnded, videoUrl, volume, isMuted, isPlaying]);

  useEffect(() => {
    if (videoRef.current && startTime) {
      videoRef.current.currentTime = startTime;
    }
  }, [startTime]);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current || !videoRef.current) return;

    const container = containerRef.current as any;
    const video = videoRef.current;
    const doc = document as any;

    try {
      if (!isFullscreen) {
        // Try different fullscreen methods for cross-browser/mobile support
        // First try container (preferred for desktop)
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
          await container.mozRequestFullScreen();
        } else if (container.msRequestFullscreen) {
          await container.msRequestFullscreen();
        } 
        // Then try video element (often needed for mobile, especially iOS)
        else if ((video as any).webkitEnterFullScreen) {
          // iOS Safari - must be called on video element
          (video as any).webkitEnterFullScreen();
        } else if ((video as any).requestFullscreen) {
          await (video as any).requestFullscreen();
        } else if ((video as any).webkitRequestFullscreen) {
          await (video as any).webkitRequestFullscreen();
        } else if ((video as any).mozRequestFullScreen) {
          await (video as any).mozRequestFullScreen();
        } else if ((video as any).msRequestFullscreen) {
          await (video as any).msRequestFullscreen();
        } 
        // Fallback for older mobile browsers
        else {
          container.style.position = 'fixed';
          container.style.top = '0';
          container.style.left = '0';
          container.style.width = '100vw';
          container.style.height = '100vh';
          container.style.zIndex = '9999';
          setIsFullscreen(true);
        }
      } else {
        // Exit fullscreen
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.webkitCancelFullScreen) {
          await doc.webkitCancelFullScreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        } else {
          // Fallback: reset styles
          container.style.position = '';
          container.style.top = '';
          container.style.left = '';
          container.style.width = '';
          container.style.height = '';
          container.style.zIndex = '';
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes to keep state in sync
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isCurrentlyFullscreen = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  }, [isMuted]);

  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setCurrentTime(time);
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const skip = useCallback((amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  }, []);

  return (
    <div ref={containerRef} className="relative bg-black aspect-video w-full max-w-full overflow-hidden">
      {/* Watermark Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <div className="watermark-text" style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '0', 
          color: 'rgba(255, 255, 255, 0.12)', 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          whiteSpace: 'nowrap',
          animation: 'watermarkScroll 18s linear infinite',
          fontFamily: 'Bank Gothic, sans-serif',
          letterSpacing: '0.5em',
          transform: 'translateY(-50%)'
        }}>
          Stream Kings
        </div>
        <div className="watermark-text" style={{ 
          position: 'absolute', 
          top: '30%', 
          left: '0', 
          color: 'rgba(255, 255, 255, 0.08)', 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          whiteSpace: 'nowrap',
          animation: 'watermarkScroll 20s linear infinite',
          animationDelay: '-6s',
          fontFamily: 'Bank Gothic, sans-serif',
          letterSpacing: '0.5em',
          transform: 'translateY(-50%)'
        }}>
          Stream Kings
        </div>
        <div className="watermark-text" style={{ 
          position: 'absolute', 
          top: '70%', 
          left: '0', 
          color: 'rgba(255, 255, 255, 0.10)', 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          whiteSpace: 'nowrap',
          animation: 'watermarkScroll 22s linear infinite',
          animationDelay: '-12s',
          fontFamily: 'Bank Gothic, sans-serif',
          letterSpacing: '0.5em',
          transform: 'translateY(-50%)'
        }}>
          Stream Kings
        </div>
      </div>
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        autoPlay={false}
        playsInline
        muted={isMuted}
        preload="metadata"
        crossOrigin="anonymous"
      />
      
      {/* CONTROLS */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-2 sm:p-4 z-50">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-2 gap-2 sm:gap-0">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button onClick={togglePlay} className="text-white hover:text-white/80" aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} />}
            </button>
            <button onClick={() => skip(-10)} className="text-white hover:text-white/80" aria-label="Skip backward 10 seconds">
              <BiSkipPrevious size={20} />
            </button>
            <button onClick={() => skip(10)} className="text-white hover:text-white/80" aria-label="Skip forward 10 seconds">
              <BiSkipNext size={20} />
            </button>
            <div className="text-white text-xs sm:text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button onClick={toggleMute} className="text-white hover:text-white/80" aria-label={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                aria-label="Volume control"
              />
            </div>
            <button onClick={toggleFullscreen} className="text-white hover:text-white/80" aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
              {isFullscreen ? <FaCompress size={20} /> : <FaExpand size={20} />}
            </button>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleTimeChange}
          className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
          aria-label="Video progress"
          style={{
            backgroundSize: `${(currentTime / (duration || 1)) * 100}% 100%`,
          }}
        />
      </div>

      {/* COMMENT SECTION (static for now) */}
      <section className="p-4 bg-black text-white space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Comments</h3>
          <button className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20">
            Add Comment
          </button>
        </div>

        <div>
          <textarea
            placeholder="Write a comment..."
            className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white placeholder-white/40 resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90">
              Post
            </button>
          </div>
        </div>

        {/* Example Comment */}
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/10" />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Username</span>
                <span className="text-white/40 text-sm">2 hours ago</span>
              </div>
              <p className="mt-2 text-white/90">
                This is a sample comment. Comments will be loaded dynamically once implemented.
              </p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-white/40">
                <button className="hover:text-white" aria-label="Reply to comment">Reply</button>
                <button className="hover:text-white" aria-label="Like comment">Like</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
