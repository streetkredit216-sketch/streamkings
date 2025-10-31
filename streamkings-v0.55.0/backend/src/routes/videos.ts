import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { uploadToS3 } from '../lib/s3';

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer();

// Upload a new video
router.post('/', upload.fields([
  { name: 'videoFile', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const { title, artist, duration } = req.body;

    if (!files.videoFile || !files.thumbnail || !title || !artist) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const videoUrl = await uploadToS3(files.videoFile[0], 'videos');
    const thumbnailUrl = await uploadToS3(files.thumbnail[0], 'thumbnails');

    const video = await prisma.video.create({
      data: {
        title,
        artist,
        videoUrl,
        thumbnailUrl,
        duration: parseInt(duration) || 0
      }
    });

    res.json(video);
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ error: 'Failed to create video' });
  }
});

// Get all videos
router.get('/', async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Delete a video
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.video.delete({ where: { id } });
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

export default router; 