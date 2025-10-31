"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get all blogs
router.get('/', async (req, res) => {
    try {
        const { view, userId, authorId } = req.query;
        console.log('Blogs API request:', { view, userId, authorId });
        // Base query options
        const queryOptions = {
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        profilePic: true,
                        walletAddress: true,
                    }
                },
                _count: {
                    select: {
                        comments: true,
                        savedBy: true
                    }
                }
            }
        };
        // If viewing a specific user's profile
        if (authorId) {
            queryOptions.where = {
                authorId: authorId
            };
            queryOptions.orderBy = { createdAt: 'desc' };
        }
        // If viewing the main feed
        else if (view === 'following' && userId) {
            // Get the users that the current user is following
            const following = await prisma.follow.findMany({
                where: {
                    followerId: userId
                },
                select: {
                    followingId: true
                }
            });
            const followingIds = following.map(f => f.followingId);
            // Get blogs from followed users
            queryOptions.where = {
                authorId: {
                    in: followingIds
                }
            };
            queryOptions.orderBy = { createdAt: 'desc' };
        }
        // Default to newest view
        else {
            queryOptions.orderBy = { createdAt: 'desc' };
        }
        const blogs = await prisma.blog.findMany(queryOptions);
        console.log('Found blogs:', blogs.length, 'blogs');
        if (authorId) {
            console.log('Blogs for authorId:', authorId, ':', blogs.map(b => ({ id: b.id, title: b.title, authorId: b.authorId })));
        }
        // If userId is provided, add isFollowed and isSaved information
        if (userId) {
            const [following, savedBlogs] = await Promise.all([
                prisma.follow.findMany({
                    where: {
                        followerId: userId
                    },
                    select: {
                        followingId: true
                    }
                }),
                prisma.savedBlog.findMany({
                    where: {
                        userId: userId
                    },
                    select: {
                        blogId: true
                    }
                })
            ]);
            const followingSet = new Set(following.map(f => f.followingId));
            const savedBlogIds = new Set(savedBlogs.map(sb => sb.blogId));
            const blogsWithInfo = blogs.map(blog => ({
                ...blog,
                isSaved: savedBlogIds.has(blog.id),
                author: {
                    ...blog.author,
                    isFollowed: followingSet.has(blog.author.id)
                }
            }));
            res.json(blogsWithInfo);
        }
        else {
            // Add isFollowed: false and isSaved: false for blogs when no userId is provided
            const blogsWithInfo = blogs.map(blog => ({
                ...blog,
                isSaved: false,
                author: {
                    ...blog.author,
                    isFollowed: false
                }
            }));
            res.json(blogsWithInfo);
        }
    }
    catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ error: 'Failed to fetch blogs' });
    }
});
// Get a single blog by ID
router.get('/:id', async (req, res) => {
    try {
        const blog = await prisma.blog.findUnique({
            where: { id: req.params.id },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        profilePic: true,
                        walletAddress: true,
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
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        // Add isFollowed: false by default
        const blogWithFollowInfo = {
            ...blog,
            author: {
                ...blog.author,
                isFollowed: false
            }
        };
        res.json(blogWithFollowInfo);
    }
    catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).json({ error: 'Failed to fetch blog' });
    }
});
// Create a new blog
router.post('/', async (req, res) => {
    try {
        const blog = await prisma.blog.create({
            data: req.body,
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
        // Add isFollowed: false by default
        const blogWithFollowInfo = {
            ...blog,
            author: {
                ...blog.author,
                isFollowed: false
            }
        };
        res.status(201).json(blogWithFollowInfo);
    }
    catch (error) {
        console.error('Error creating blog:', error);
        res.status(500).json({ error: 'Failed to create blog' });
    }
});
// Update a blog
router.put('/:id', async (req, res) => {
    try {
        const blog = await prisma.blog.update({
            where: { id: req.params.id },
            data: req.body,
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
        // Add isFollowed: false by default
        const blogWithFollowInfo = {
            ...blog,
            author: {
                ...blog.author,
                isFollowed: false
            }
        };
        res.json(blogWithFollowInfo);
    }
    catch (error) {
        console.error('Error updating blog:', error);
        res.status(500).json({ error: 'Failed to update blog' });
    }
});
// Delete a blog
router.delete('/:id', async (req, res) => {
    try {
        await prisma.blog.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ error: 'Failed to delete blog' });
    }
});
// Save a blog
router.post('/:id/save', async (req, res) => {
    try {
        const { userId } = req.body;
        const blogId = req.params.id;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        // Check if blog exists
        const blog = await prisma.blog.findUnique({
            where: { id: blogId }
        });
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Create saved blog entry
        const savedBlog = await prisma.savedBlog.create({
            data: {
                userId,
                blogId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profilePic: true,
                        walletAddress: true,
                    }
                },
                blog: {
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
        res.status(201).json(savedBlog);
    }
    catch (error) {
        console.error('Error saving blog:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return res.status(409).json({ error: 'Blog already saved' });
        }
        res.status(500).json({ error: 'Failed to save blog' });
    }
});
// Unsave a blog
router.delete('/:id/save', async (req, res) => {
    try {
        const { userId } = req.body;
        const blogId = req.params.id;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        // Delete saved blog entry
        await prisma.savedBlog.delete({
            where: {
                userId_blogId: {
                    userId,
                    blogId
                }
            }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error unsaving blog:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return res.status(404).json({ error: 'Saved blog not found' });
        }
        res.status(500).json({ error: 'Failed to unsave blog' });
    }
});
// Get saved blogs for a user
router.get('/saved/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const savedBlogs = await prisma.savedBlog.findMany({
            where: { userId },
            include: {
                blog: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                profilePic: true,
                                walletAddress: true,
                            }
                        },
                        _count: {
                            select: {
                                comments: true,
                                savedBy: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        const blogsWithFollowInfo = savedBlogs.map(savedBlog => ({
            id: savedBlog.id,
            userId: savedBlog.userId,
            blogId: savedBlog.blogId,
            createdAt: savedBlog.createdAt,
            blog: {
                ...savedBlog.blog,
                author: {
                    ...savedBlog.blog.author,
                    isFollowed: false // You might want to add logic to check if the current user follows this author
                }
            }
        }));
        res.json(blogsWithFollowInfo);
    }
    catch (error) {
        console.error('Error fetching saved blogs:', error);
        res.status(500).json({ error: 'Failed to fetch saved blogs' });
    }
});
exports.default = router;
