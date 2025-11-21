import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { validateEnvironment, logEnvironmentInfo } from './utils/env-validator';

// Load environment variables
dotenv.config();

// Validate environment configuration
const envConfig = validateEnvironment();
logEnvironmentInfo(envConfig);

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://www.streamkobeta.live' 
      : ['http://localhost:3000', 'http://localhost', 'http://localhost:80'],
    methods: ['GET', 'POST']
  }
});

// Single Prisma instance
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost',
    'http://localhost:80'
  ],
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Add your route imports
import songsRouter from './routes/songs';
import blogsRouter from './routes/blogs';
import usersRouter from './routes/users';
import photosRouter from './routes/photos';
import videosRouter from './routes/videos';
import commentsRouter from './routes/comments';
import solanaRouter from './routes/solana';
import adminRouter from './routes/admin';

// Use the routes
app.use('/api/songs', songsRouter);
app.use('/api/blogs', blogsRouter);
app.use('/api/users', usersRouter);
app.use('/api/photos', photosRouter);
app.use('/api/videos', videosRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/solana', solanaRouter);
app.use('/api/admin', adminRouter);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle radio station synchronization
  socket.on('join-radio', () => {
    socket.join('radio-room');
  });

  socket.on('leave-radio', () => {
    socket.leave('radio-room');
  });

  // Handle real-time updates
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3006;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 