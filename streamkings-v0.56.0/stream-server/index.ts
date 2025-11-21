import express from 'express';
import cors from 'cors';
import { videoList } from './lib/videoList';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from '@ffprobe-installer/ffprobe';
import https from 'https';
import { PassThrough } from 'stream';
import { Request, Response } from 'express';

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // your frontend
  methods: ['GET', 'POST'],
  credentials: true
}));

const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL || 'https://d1800dw1pmsgy7.cloudfront.net';

// Set up ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath as string);
ffmpeg.setFfprobePath(ffprobePath.path);

interface VideoData {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  startTime: number;
}

// Stream state management
let currentVideo: VideoData | null = null;
let isStreamRunning = false;

// Add proper types for the video metadata
interface FFProbeMetadata {
  format: {
    duration: number;
    // Add other metadata properties if needed
  };
}

// Function to get a random video that's different from the current one
const getRandomVideo = (): string => {
  if (!currentVideo) {
    // If no current video, just return a random video from the full list
    return videoList[Math.floor(Math.random() * videoList.length)];
  }

  //Filter out current video, Now TypeScript knows currentVideo is not null
  const currentVideoId = currentVideo.id;  // Safe to access .id here
  const availableVideos = videoList.filter(video => video !== currentVideoId);
  
  // If somehow all videos were filtered out, return from full list
  if (availableVideos.length === 0) {
    return videoList[Math.floor(Math.random() * videoList.length)];
  }

  return availableVideos[Math.floor(Math.random() * availableVideos.length)];
};

// Function to fetch video metadata and prepare it for streaming
const prepareVideo = async (videoKey: string): Promise<VideoData> => {
  return new Promise((resolve, reject) => {
    const cloudFrontVideoUrl = `${CLOUDFRONT_URL}/${videoKey}`;
    
    https.get(cloudFrontVideoUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to fetch video: ${response.statusCode}`));
        return;
      }

      const pass = new PassThrough();
      response.pipe(pass);

      ffmpeg.ffprobe(pass, (err: Error | null, metadata: FFProbeMetadata) => {
        if (err) {
          reject(err);
          return;
        }

        if (!metadata.format?.duration) {
          reject(new Error('Invalid video metadata: missing duration'));
          return;
        }

        resolve({
          id: videoKey,
          title: videoKey.split('/').pop() || videoKey,
          videoUrl: cloudFrontVideoUrl,
          duration: metadata.format.duration,
          startTime: Date.now()
        });
      });
    }).on('error', reject);
  });
};

// Function to manage the stream and transition between videos
const manageStream = async (): Promise<void> => {
  if (!isStreamRunning) return;

  try {
    let shouldTransition = false;

    if (!currentVideo) {
      shouldTransition = true;
    } else {
      shouldTransition = (Date.now() - currentVideo.startTime) / 1000 >= currentVideo.duration;
    }

    if (shouldTransition) {
      const nextVideoKey = getRandomVideo();
      console.log('Transitioning to next video:', nextVideoKey);
      
      try {
        currentVideo = await prepareVideo(nextVideoKey);
        console.log('New video started:', currentVideo.title);
      } catch (prepareError) {
        console.error('Failed to prepare video:', prepareError);
        const fallbackKey = getRandomVideo();
        if (fallbackKey !== nextVideoKey) {
          currentVideo = await prepareVideo(fallbackKey);
        }
      }
    }
  } catch (error) {
    console.error('Error managing stream:', error);
  }

  setTimeout(manageStream, 1000);
};

// Start the stream
app.post('/radio/start', async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!isStreamRunning) {
      isStreamRunning = true;
      manageStream();
      res.json({ message: 'Stream started' });
    } else {
      res.json({ message: 'Stream already running' });
    }
  } catch (error) {
    console.error('Error starting stream:', error);
    res.status(500).json({ error: 'Failed to start stream' });
  }
});

// Stop the stream
app.post('/radio/stop', (_req: Request, res: Response): void => {
  isStreamRunning = false;
  currentVideo = null;
  res.json({ message: 'Stream stopped' });
});

// Get current state
app.get('/radio/state', (_req: Request, res: Response): void => {
  if (!currentVideo || !isStreamRunning) {
    res.status(404).json({ error: 'No stream active' });
    return;
  }

  const elapsedTime = (Date.now() - currentVideo.startTime) / 1000;
  
  res.json({
    video: currentVideo,
    elapsedTime,
    startTime: currentVideo.startTime,
    isStreamRunning
  });
});

// Force skip to next video
app.post('/radio/skip', async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!isStreamRunning) {
      res.status(400).json({ error: 'Stream not running' });
      return;
    }

    const nextVideoKey = getRandomVideo();
    try {
      currentVideo = await prepareVideo(nextVideoKey);
      res.json({ message: 'Skipped to next video', video: currentVideo });
    } catch (prepareError) {
      console.error('Failed to prepare video:', prepareError);
      res.status(500).json({ error: 'Failed to prepare next video' });
    }
  } catch (error) {
    console.error('Error skipping video:', error);
    res.status(500).json({ error: 'Failed to skip video' });
  }
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ 
    status: 'ok',
    streamRunning: isStreamRunning,
    currentVideo: currentVideo?.title || 'none'
  });
});

app.listen(4000, '0.0.0.0', () => {
  console.log('Stream server running on :4000');
  console.log('Available videos:', videoList.length);
  
  // Auto-start the radio stream when the server starts
  console.log('Auto-starting radio stream...');
  isStreamRunning = true;
  manageStream();
  console.log('Radio stream started automatically');
});
