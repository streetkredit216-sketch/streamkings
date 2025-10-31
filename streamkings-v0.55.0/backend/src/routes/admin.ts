import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();

// Simple admin authentication - you can enhance this later
const authenticateAdmin = (req: any, res: any, next: any) => {
  // For now, we'll use a simple API key approach
  // You can replace this with JWT, wallet signature, or other auth methods
  const adminKey = process.env.ADMIN_API_KEY;
  const providedKey = req.headers['x-admin-key'];
  
  if (!adminKey || providedKey !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized - Admin access required' });
  }
  
  next();
};

// PATCH /api/admin/users/:id/role - Update user role
router.patch('/users/:id/role', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['TASTEMAKER', 'DJ', 'ARTIST'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role', 
        validRoles 
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        role: true,
        streetCredit: true,
        ranking: true,
        createdAt: true
      }
    });

    // Log the role change
    // Role updated successfully

    res.json({
      message: `Successfully updated ${user.username} to ${role}`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// GET /api/admin/users - List all users with their roles
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { role, limit = 50, offset = 0 } = req.query;
    
    const where = role ? { role: role as 'TASTEMAKER' | 'DJ' | 'ARTIST' } : {};
    
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        walletAddress: true,
        role: true,
        streetCredit: true,
        ranking: true,
        createdAt: true,
        _count: {
          select: {
            blogs: true,
            songs: true,
            photos: true,
            followers: true
          }
        }
      },
      orderBy: { streetCredit: 'desc' },
      take: parseInt(limit as string) || 50,
      skip: parseInt(offset as string) || 0
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id - Get specific user details
router.get('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        email: true,
        role: true,
        streetCredit: true,
        ranking: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            blogs: true,
            songs: true,
            photos: true,
            followers: true,
            following: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/admin/users/wallet/:walletAddress - Find user by wallet address
router.get('/users/wallet/:walletAddress', authenticateAdmin, async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        email: true,
        role: true,
        streetCredit: true,
        ranking: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            blogs: true,
            songs: true,
            photos: true,
            followers: true,
            following: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user by wallet:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PATCH /api/admin/users/wallet/:walletAddress/role - Update user role by wallet address
router.patch('/users/wallet/:walletAddress/role', authenticateAdmin, async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['TASTEMAKER', 'DJ', 'ARTIST'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role', 
        validRoles 
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: { id: true, username: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the role
    const updatedUser = await prisma.user.update({
      where: { walletAddress },
      data: { role },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        role: true,
        streetCredit: true,
        ranking: true,
        createdAt: true
      }
    });

    // Log the role change
    // Role updated successfully

    res.json({
      message: `Successfully updated ${user.username} to ${role}`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user role by wallet:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

export default router;
