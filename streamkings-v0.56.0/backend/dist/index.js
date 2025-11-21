"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const env_validator_1 = require("./utils/env-validator");
// Load environment variables
dotenv_1.default.config();
// Validate environment configuration
const envConfig = (0, env_validator_1.validateEnvironment)();
(0, env_validator_1.logEnvironmentInfo)(envConfig);
// Initialize Express app
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Initialize Socket.IO
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? 'https://www.streamkobeta.live'
            : ['http://localhost:3000', 'http://localhost', 'http://localhost:80'],
        methods: ['GET', 'POST']
    }
});
// Single Prisma instance
const prisma = new client_1.PrismaClient();
// Middleware
app.use((0, cors_1.default)({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost',
        'http://localhost:80'
    ],
    credentials: true
}));
app.use(express_1.default.json({ limit: '5mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '5mb' }));
// Add your route imports
const songs_1 = __importDefault(require("./routes/songs"));
const blogs_1 = __importDefault(require("./routes/blogs"));
const users_1 = __importDefault(require("./routes/users"));
const photos_1 = __importDefault(require("./routes/photos"));
const videos_1 = __importDefault(require("./routes/videos"));
const comments_1 = __importDefault(require("./routes/comments"));
// Use the routes
app.use('/api/songs', songs_1.default);
app.use('/api/blogs', blogs_1.default);
app.use('/api/users', users_1.default);
app.use('/api/photos', photos_1.default);
app.use('/api/videos', videos_1.default);
app.use('/api/comments', comments_1.default);
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
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
// Start server
const PORT = process.env.PORT || 3006;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
