import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { uploadToS3 } from '../lib/s3';
import { createUserFolders } from '../lib/s3';
import { UploadedFile } from '../types/file';

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer();

// GET /api/users/leaderboard - Get leaderboard of users ranked by street credit
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const users = await prisma.user.findMany({
      orderBy: {
        streetCredit: 'desc'
      },
      take: parseInt(limit as string) || 50,
      select: {
        id: true,
        walletAddress: true,
        username: true,
        profilePic: true,
        role: true,
        streetCredit: true,
        ranking: true,
        createdAt: true,
        _count: {
          select: {
            blogs: true,
            songs: true,
            photos: true,
            following: true,
            followers: true
          }
        }
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchQuery = q as string;
    console.log('Searching for users with query:', searchQuery);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: searchQuery } },
          { description: { contains: searchQuery } },
          { walletAddress: { contains: searchQuery } }
        ]
      },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        profilePic: true,
        role: true,
        streetCredit: true,
        ranking: true,
        createdAt: true,
        description: true
      },
      take: 10
    });

    console.log('Found users:', users.length);
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get user by wallet address
router.get('/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        _count: {
          select: {
            blogs: true,
            songs: true,
            photos: true,
            following: true,
            followers: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User API response:', { 
      id: user.id, 
      username: user.username, 
      walletAddress: user.walletAddress 
    });
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update profile picture
router.post('/:walletAddress/profile-pic', upload.single('file'), async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('Processing profile picture upload:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }

    // Find user first to verify they exist
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const imageUrl = await uploadToS3(file, `${walletAddress}/profile-pics`);
    const user = await prisma.user.update({
      where: { walletAddress },
      data: { profilePic: imageUrl }
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ 
      error: 'Failed to update profile picture',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update banner
router.post('/:walletAddress/banner', upload.single('file'), async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('Processing banner upload:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }

    // Validate file size (e.g., 5MB limit)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB' });
    }

    // Find user first to verify they exist
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const imageUrl = await uploadToS3(file, `${walletAddress}/banners`);
    const user = await prisma.user.update({
      where: { walletAddress },
      data: { profileBanner: imageUrl }
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ 
      error: 'Failed to update banner',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update registration endpoint
router.post('/register', async (req, res) => {
  try {
    console.log('Received registration request:', req.body);
    const { username, profilePic, role, description, walletAddress } = req.body;

    // Validate required fields
    if (!username || !role || !walletAddress) {
      // Missing required fields - error thrown below
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate username length
    if (username.length > 20) {
      console.log('Username too long:', { username, length: username.length });
      return res.status(400).json({ error: 'Username must be 20 characters or less' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (existingUser) {
      console.log('User already exists:', existingUser);
      return res.status(400).json({ error: 'User already exists' });
    }

     // Create S3 folders for the user
     try {
      await createUserFolders(walletAddress);
    } catch (s3Error) {
      console.error('Failed to create S3 folders:', s3Error);
      return res.status(500).json({ error: 'Failed to create storage folders' });
    }

    // Handle base64 profile picture if provided
    let profilePicUrl = '/public/bodysillhouette.png';
    if (profilePic && profilePic.startsWith('data:image')) {
      try {
        // Convert base64 to buffer
        const base64Data = profilePic.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        const fileData: UploadedFile = {
          fieldname: 'profilePic',
          originalname: `${username}-profile.${profilePic.split(';')[0].split('/')[1]}`,
          encoding: '7bit',
          mimetype: profilePic.split(';')[0].split(':')[1],
          buffer: buffer,
          size: buffer.length,
          stream: null,
          destination: '',
          filename: '',
          path: ''
        };

        profilePicUrl = await uploadToS3(fileData, `${walletAddress}/profile-pics`);
      } catch (uploadError) {
        console.error('Failed to upload profile picture:', uploadError);
        // Continue with default profile picture if upload fails
      }
    }

    // Create new user with CloudFront URL
    const user = await prisma.user.create({
      data: {
        username,
        profilePic: profilePicUrl, // This will now be the CloudFront URL
        role,
        description: description || '',
        walletAddress,
        streetCredit: 0,
        ranking: 0,
        email: req.body.email,
      },
    });

    console.log('User created successfully:', user);
    res.json(user);
  } catch (error) {
    console.error('Registration error details:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Add updateRanking function
async function updateRanking() {
  try {
    // Get all users ordered by street credit
    const users = await prisma.user.findMany({
      orderBy: {
        streetCredit: 'desc'
      }
    });

    // Update rankings
    for (let i = 0; i < users.length; i++) {
      await prisma.user.update({
        where: { id: users[i].id },
        data: { ranking: i + 1 }
      });
    }
  } catch (error) {
    console.error('Error updating rankings:', error);
  }
}

// Add endpoint to update street credit
router.post('/:walletAddress/street-credit', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { amount } = req.body;

    const user = await prisma.user.update({
      where: { walletAddress },
      data: {
        streetCredit: amount
      }
    });

    // Update rankings after street credit change
    await updateRanking();

    res.json(user);
  } catch (error) {
    console.error('Error updating street credit:', error);
    res.status(500).json({ error: 'Failed to update street credit' });
  }
});

// Update user description
router.put('/:walletAddress/description', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { description } = req.body;

    if (description === undefined) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const user = await prisma.user.update({
      where: { walletAddress },
      data: { description: description || '' }
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating description:', error);
    res.status(500).json({ 
      error: 'Failed to update description',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/users/follow/:userId - Follow a user
router.post('/follow/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { userId: followerId } = req.body;

    console.log('Follow request:', { userId, followerId });

    if (!followerId || !userId) {
      return res.status(400).json({ error: 'Both userId and followerId are required' });
    }

    // Get the follower user
    const follower = await prisma.user.findUnique({
      where: { id: followerId }
    });

    if (!follower) {
      return res.status(404).json({ error: 'Follower not found' });
    }

    // Get the user to follow
    const userToFollow = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToFollow) {
      return res.status(404).json({ error: 'User to follow not found' });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: userId,
        },
      },
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: follower.id,
        followingId: userId,
      },
    });

    res.status(200).json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Failed to follow user', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// DELETE /api/users/follow/:userId - Unfollow a user
router.delete('/follow/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { userId: followerId } = req.body;

    console.log('Unfollow request:', { userId, followerId });

    if (!followerId || !userId) {
      return res.status(400).json({ error: 'Both userId and followerId are required' });
    }

    // Get the follower user
    const follower = await prisma.user.findUnique({
      where: { id: followerId }
    });

    if (!follower) {
      return res.status(404).json({ error: 'Follower not found' });
    }

    // Delete the follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: userId,
        },
      },
    });

    res.status(200).json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ error: 'Failed to unfollow user', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/users/following/:userId - Get list of users being followed
router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const following = await prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: true,
      },
    });

    res.json(following.map(f => f.following));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch following list' });
  }
});

export default router; 