"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = validateEnvironment;
exports.logEnvironmentInfo = logEnvironmentInfo;
function validateEnvironment() {
    const requiredVars = [
        'NODE_ENV',
        'DATABASE_URL',
        'JWT_SECRET',
        'AWS_REGION',
        'FRONTEND_URL'
    ];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    // Validate NODE_ENV
    if (!['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
        throw new Error(`Invalid NODE_ENV: ${process.env.NODE_ENV}. Must be development, production, or test`);
    }
    // Validate DATABASE_URL format
    if (!process.env.DATABASE_URL.startsWith('mysql://')) {
        throw new Error('DATABASE_URL must be a valid MySQL connection string');
    }
    // Validate JWT_SECRET strength
    if (process.env.JWT_SECRET.length < 10) {
        throw new Error('JWT_SECRET must be at least 10 characters long');
    }
    // Validate AWS configuration
    if (process.env.NODE_ENV === 'production') {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error('AWS credentials are required in production');
        }
    }
    return {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        AWS_REGION: process.env.AWS_REGION,
        MEMCACHED_URL: process.env.MEMCACHED_URL,
        ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL,
        FRONTEND_URL: process.env.FRONTEND_URL,
        LOG_LEVEL: process.env.LOG_LEVEL || 'info'
    };
}
function logEnvironmentInfo(config) {
    console.log('🌍 Environment Configuration:');
    console.log(`  NODE_ENV: ${config.NODE_ENV}`);
    console.log(`  DATABASE_URL: ${config.DATABASE_URL.replace(/\/\/.*@/, '//***:***@')}`);
    console.log(`  AWS_REGION: ${config.AWS_REGION}`);
    console.log(`  FRONTEND_URL: ${config.FRONTEND_URL}`);
    console.log(`  LOG_LEVEL: ${config.LOG_LEVEL}`);
    if (config.AWS_ACCESS_KEY_ID) {
        console.log(`  AWS_ACCESS_KEY_ID: ${config.AWS_ACCESS_KEY_ID.substring(0, 8)}...`);
    }
    if (config.MEMCACHED_URL) {
        console.log(`  MEMCACHED_URL: ${config.MEMCACHED_URL}`);
    }
    if (config.ELASTICSEARCH_URL) {
        console.log(`  ELASTICSEARCH_URL: ${config.ELASTICSEARCH_URL}`);
    }
    console.log('');
}
