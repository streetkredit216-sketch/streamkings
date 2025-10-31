"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const s3_1 = require("../lib/s3");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const upload = (0, multer_1.default)();
router.post('/', upload.fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
]), async (req, res) => {
    try {
        const files = req.files;
        const { title, genre, walletAddress } = req.body;
        console.log('Received song upload request:', {
            title,
            genre,
            walletAddress,
            files: Object.keys(files),
            body: req.body
        });
        // Validate required fields
        if (!title || !genre || !walletAddress || !files.audioFile || !files.coverImage) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Get user by walletAddress instead of username
        const user = await prisma.user.findUnique({
            where: { walletAddress }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.role !== 'ARTIST') {
            return res.status(403).json({ error: 'Only artists can upload songs' });
        }
        // Upload files to S3 with better error handling
        let audioUrl, coverImageUrl;
        try {
            audioUrl = await (0, s3_1.uploadToS3)(files.audioFile[0], `${walletAddress}/songs`);
            coverImageUrl = await (0, s3_1.uploadToS3)(files.coverImage[0], `${walletAddress}/covers`);
        }
        catch (uploadError) {
            console.error('Error uploading files to S3:', uploadError);
            return res.status(500).json({
                error: 'Failed to upload files',
                details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
            });
        }
        // Create song with proper error handling
        try {
            const song = await prisma.song.create({
                data: {
                    title,
                    artist: user.username,
                    genre,
                    audioUrl,
                    coverImage: coverImageUrl,
                    authorId: user.id
                }
            });
            res.json(song);
        }
        catch (dbError) {
            console.error('Error creating song in database:', dbError);
            return res.status(500).json({
                error: 'Failed to create song in database',
                details: dbError instanceof Error ? dbError.message : 'Unknown error'
            });
        }
    }
    catch (error) {
        console.error('Error in song upload route:', error);
        res.status(500).json({
            error: 'Failed to create song',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        let whereClause = {};
        if (userId) {
            // Find the user by wallet address
            const user = await prisma.user.findUnique({
                where: { walletAddress: userId }
            });
            if (user) {
                // Only fetch songs where this user is the author
                whereClause = { authorId: user.id };
            }
        }
        const songs = await prisma.song.findMany({
            where: whereClause,
            include: {
                author: {
                    select: {
                        username: true,
                        profilePic: true,
                        walletAddress: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(songs);
    }
    catch (error) {
        console.error('Error fetching songs:', error);
        res.status(500).json({ error: 'Failed to fetch songs' });
    }
});
router.get('/library', async (req, res) => {
    try {
        const { userId } = req.query;
        console.log('Library request received:', {
            userId,
            query: req.query,
            url: req.url
        });
        // This will be the profile owner's wallet address
        console.log('Fetching library for wallet address:', userId);
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        // Get the profile user using the wallet address
        const profileUser = await prisma.user.findFirst({
            where: { walletAddress: userId }
        });
        if (!profileUser) {
            console.log('No user found with wallet address:', userId);
            return res.status(404).json({ error: 'User not found' });
        }
        // Fetch purchases for this profile user
        const purchases = await prisma.purchase.findMany({
            where: { userId: profileUser.id },
            include: {
                song: {
                    include: {
                        author: {
                            select: {
                                username: true,
                                profilePic: true,
                                walletAddress: true // Add this to help with ownership checks
                            },
                        },
                    },
                },
            },
        });
        console.log(`Found ${purchases.length} purchases for user ${profileUser.id}`);
        const songs = purchases.map(purchase => ({
            ...purchase.song,
            isPurchased: true
        }));
        res.json(songs);
    }
    catch (error) {
        console.error('Error fetching library songs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/like', async (req, res) => {
    try {
        const { userId, songId } = req.body;
        // Validate inputs
        if (!userId || !songId) {
            return res.status(400).json({ error: 'User ID and Song ID are required' });
        }
        // Ensure user and song exist
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const song = await prisma.song.findUnique({ where: { id: songId } });
        if (!user || !song) {
            return res.status(404).json({ error: 'User or song not found' });
        }
        // Check if the song is already liked (purchased)
        const existingPurchase = await prisma.purchase.findUnique({
            where: { userId_songId: { userId, songId } },
        });
        if (existingPurchase) {
            return res.status(400).json({ error: 'Song already liked' });
        }
        // Create the purchase (like)
        const purchase = await prisma.purchase.create({
            data: {
                userId,
                songId,
            },
        });
        res.json(purchase);
    }
    catch (error) {
        console.error('Error liking song:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get all playlists for a user
router.get('/playlists/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('Fetching playlists for wallet address:', userId);
        // Get user by wallet address
        const user = await prisma.user.findFirst({
            where: { walletAddress: userId }
        });
        if (!user) {
            console.log('No user found with wallet address:', userId);
            return res.status(404).json({ error: 'User not found' });
        }
        console.log('Found user:', user.id);
        const playlists = await prisma.playlist.findMany({
            where: { authorId: user.id }, // Use authorId instead of userId
            include: {
                songs: {
                    include: {
                        song: {
                            include: {
                                author: {
                                    select: { username: true, profilePic: true }
                                }
                            }
                        }
                    }
                }
            }
        });
        console.log(`Found ${playlists.length} playlists for user`);
        res.json(playlists);
    }
    catch (error) {
        console.error('Error fetching playlists:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get a specific playlist with its songs
router.get('/playlists/single/:playlistId', async (req, res) => {
    try {
        const { playlistId } = req.params;
        const playlist = await prisma.playlist.findUnique({
            where: { id: playlistId },
            include: {
                songs: {
                    include: {
                        song: {
                            include: {
                                author: {
                                    select: { username: true, profilePic: true }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }
        res.json(playlist);
    }
    catch (error) {
        console.error('Error fetching playlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/playlist', async (req, res) => {
    try {
        const { userId, name } = req.body; // userId here is the wallet address
        console.log('Creating playlist:', { userId, name });
        // First get the user's Prisma ID using their wallet address
        const user = await prisma.user.findFirst({
            where: { walletAddress: userId }
        });
        if (!user) {
            console.log('No user found with wallet address:', userId);
            return res.status(404).json({ error: 'User not found' });
        }
        // Create playlist using the user's Prisma ID as authorId
        const playlist = await prisma.playlist.create({
            data: {
                name,
                authorId: user.id, // Use the Prisma ID, not wallet address
            },
        });
        console.log('Created playlist:', playlist);
        res.json(playlist);
    }
    catch (error) {
        console.error('Error creating playlist:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/add', async (req, res) => {
    try {
        const { playlistId, songId } = req.body;
        if (!playlistId || !songId) {
            return res.status(400).json({ error: 'Playlist ID and Song ID are required' });
        }
        const playlistSong = await prisma.playlistSong.create({
            data: { playlistId, songId },
        });
        res.json(playlistSong);
    }
    catch (error) {
        console.error('Error adding song to playlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
