import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get comments for a blog
router.get('/blog/:blogId', async (req, res) => {
  try {
    const blogId = req.params.blogId;

    const comments = await prisma.comment.findMany({
      where: { blogId },
      include: {
        author: {
          select: {
            id: true,
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

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create a new comment
router.post('/', async (req, res) => {
  try {
    const { content, authorId, blogId } = req.body;

    if (!content || !authorId || !blogId) {
      return res.status(400).json({ error: 'Content, author ID, and blog ID are required' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId,
        blogId
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePic: true,
            walletAddress: true,
          }
        }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Update a comment
router.put('/:id', async (req, res) => {
  try {
    const commentId = req.params.id;
    const { content, authorId } = req.body;

    if (!content || !authorId) {
      return res.status(400).json({ error: 'Content and author ID are required' });
    }

    // Check if the comment exists and belongs to the author
    const existingComment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        authorId
      }
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePic: true,
            walletAddress: true,
          }
        }
      }
    });

    res.json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete a comment
router.delete('/:id', async (req, res) => {
  try {
    const commentId = req.params.id;
    const { authorId } = req.body;

    if (!authorId) {
      return res.status(400).json({ error: 'Author ID is required' });
    }

    // Check if the comment exists and belongs to the author
    const existingComment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        authorId
      }
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Save a comment
router.post('/:id/save', async (req, res) => {
  try {
    const { userId } = req.body;
    const commentId = req.params.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Create saved comment entry
    const savedComment = await prisma.savedComment.create({
      data: {
        userId,
        commentId
      },
      include: {
        comment: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                profilePic: true,
                walletAddress: true,
              }
            }
          }
        }
      }
    });

    res.status(201).json(savedComment);
  } catch (error) {
    console.error('Error saving comment:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ error: 'Comment already saved' });
    }
    res.status(500).json({ error: 'Failed to save comment' });
  }
});

// Unsave a comment
router.delete('/:id/save', async (req, res) => {
  try {
    const { userId } = req.body;
    const commentId = req.params.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Delete saved comment entry
    await prisma.savedComment.delete({
      where: {
        userId_commentId: {
          userId,
          commentId
        }
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error unsaving comment:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Saved comment not found' });
    }
    res.status(500).json({ error: 'Failed to unsave comment' });
  }
});

// Get saved comments for a user
router.get('/saved/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const savedComments = await prisma.savedComment.findMany({
      where: { userId },
      include: {
        comment: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                profilePic: true,
                walletAddress: true,
              }
            },
            blog: {
              select: {
                id: true,
                title: true,
                author: {
                  select: {
                    id: true,
                    username: true,
                    profilePic: true,
                    walletAddress: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(savedComments);
  } catch (error) {
    console.error('Error fetching saved comments:', error);
    res.status(500).json({ error: 'Failed to fetch saved comments' });
  }
});

export default router; 