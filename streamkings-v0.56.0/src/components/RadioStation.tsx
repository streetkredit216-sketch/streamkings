// RadioStation.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import { api } from '@/lib/api';

interface Video {
  id: string;
  title: string;
  artist?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
}

interface RadioState {
  video: Video;
  elapsedTime: number;
  startTime: number;
}

export default function RadioStation() {
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const syncIntervalRef = useRef<NodeJS.Timeout>();

  const fetchRadioState = async () => {
    try {
      const response = await fetch(api.radio.getState);
      if (!response.ok) {
        throw new Error('Radio not initialized');
      }

      const state: RadioState = await response.json();
      const { video, elapsedTime, startTime } = state;

      setCurrentVideo(video);
      setStartTime(startTime);

      // If we're close to the end of the video, resync sooner
      const timeRemaining = video.duration - elapsedTime;
      if (timeRemaining < 5) {
        setTimeout(fetchRadioState, timeRemaining * 1000);
      }
    } catch (error) {
      console.error('Error fetching radio state:', error);
      setCurrentVideo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRadioState();

    // Re-sync every 30 seconds to stay aligned
    syncIntervalRef.current = setInterval(fetchRadioState, 30000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black p-2 sm:p-4 relative overflow-hidden">
        {/* Pure black background for TV mode loading */}
        <div className="absolute inset-0 bg-black"></div>
        
        {/* Loading spinner */}
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400 shadow-lg shadow-gray-400/50"></div>
        </div>
      </div>
    );
  }

  if (!currentVideo?.videoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white p-2 sm:p-4 relative overflow-hidden">
        {/* Pure black background for TV mode when no video */}
        <div className="absolute inset-0 bg-black"></div>
        
        <div className="relative z-10 text-center">
          <div className="text-2xl font-bold text-gray-400 mb-2">📺</div>
          <div className="text-lg text-gray-300">No video is currently playing</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 relative overflow-hidden">
      {/* Animated background container */}
      <div className="absolute inset-0 -z-10 rounded-2xl overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900"></div>
        
        {/* Animated color-changing overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,119,198,0.15),transparent_50%)] animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(120,255,198,0.15),transparent_50%)] animate-pulse-slow animation-delay-1000"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(198,119,255,0.1),transparent_50%)] animate-spin-slow"></div>
        
        {/* Steampunk grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-2xl border border-cyan-400/30 shadow-lg shadow-cyan-400/20"></div>
      </div>
      
      {/* Video player with backdrop blur */}
      <div className="relative z-10 backdrop-blur-sm bg-black/20 rounded-2xl p-4">
        <VideoPlayer
          videoUrl={currentVideo.videoUrl}
          title={currentVideo.title}
          artist={currentVideo.artist || 'Unknown'}
          thumbnailUrl={currentVideo.thumbnailUrl || ''}
          startTime={startTime ? (Date.now() - startTime) / 1000 : 0}
          autoPlay={true}
          onEnded={() => {
            // Do nothing. Let backend switch video.
            setTimeout(fetchRadioState, 2000); // Give Redis a sec to update
          }}
        />
      </div>
    </div>
  );
}
