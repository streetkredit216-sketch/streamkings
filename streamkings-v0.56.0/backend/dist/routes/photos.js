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
router.post('/', upload.single('file'), async (req, res) => {
    try {
        console.log('Received photo upload request:', {
            body: req.body,
            file: req.file,
            headers: req.headers
        });
        const { description, walletAddress } = req.body;
        const file = req.file;
        if (!file || !description || !walletAddress) {
            console.log('Missing required fields:', { file: !!file, description, walletAddress });
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const user = await prisma.user.findUnique({
            where: { walletAddress }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const imageUrl = await (0, s3_1.uploadToS3)(file, 'photos');
        const photo = await prisma.photo.create({
            data: {
                imageUrl,
                description,
                authorId: user.id
            },
            include: {
                author: {
                    select: {
                        username: true,
                        profilePic: true,
                        walletAddress: true
                    }
                },
                _count: {
                    select: {
                        comments: true,
                        savedBy: true
                    }
                }
            }
        });
        res.json(photo);
    }
    catch (error) {
        console.error('Detailed error creating photo:', error);
        res.status(500).json({
            error: 'Failed to create photo',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        let whereClause = {};
        if (userId) {
            const user = await prisma.user.findUnique({
                where: { walletAddress: userId }
            });
            if (user) {
                whereClause = { authorId: user.id };
            }
        }
        const photos = await prisma.photo.findMany({
            where: whereClause,
            include: {
                author: {
                    select: {
                        username: true,
                        profilePic: true,
                        walletAddress: true
                    }
                },
                _count: {
                    select: {
                        comments: true,
                        savedBy: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(photos);
    }
    catch (error) {
        console.error('Error fetching photos:', error);
        res.status(500).json({ error: 'Failed to fetch photos' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.photo.delete({ where: { id } });
        res.json({ message: 'Photo deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting photo:', error);
        res.status(500).json({ error: 'Failed to delete photo' });
    }
});
exports.default = router;
