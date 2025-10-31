"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const s3_1 = require("../lib/s3");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const upload = (0, multer_1.default)();
// Upload a new video
router.post('/', upload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
    try {
        const files = req.files;
        const { title, artist, duration } = req.body;
        if (!files.videoFile || !files.thumbnail || !title || !artist) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const videoUrl = await (0, s3_1.uploadToS3)(files.videoFile[0], 'videos');
        const thumbnailUrl = await (0, s3_1.uploadToS3)(files.thumbnail[0], 'thumbnails');
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ error: 'Failed to delete video' });
    }
});
exports.default = router;
