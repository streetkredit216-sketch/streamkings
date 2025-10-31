"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUCKET_NAME = exports.s3Client = void 0;
exports.ensureUserFolder = ensureUserFolder;
exports.createUserFolders = createUserFolders;
exports.uploadFileToS3 = uploadFileToS3;
exports.uploadToS3 = uploadToS3;
const client_s3_1 = require("@aws-sdk/client-s3");
// Validate environment variables
const requiredEnvVars = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
};
console.log('AWS Environment Variables Status:', {
    hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-west-2'
});
// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}
// Initialize S3 Client
exports.s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || 'us-west-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});
exports.BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET || 'streamko';
// Function to ensure user's folder exists
async function ensureUserFolder(walletAddress) {
    try {
        console.log('Checking bucket access...', {
            bucket: exports.BUCKET_NAME,
            region: process.env.AWS_REGION,
            hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
            hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
        });
        // Check if bucket exists
        await exports.s3Client.send(new client_s3_1.HeadBucketCommand({ Bucket: exports.BUCKET_NAME }));
        console.log('Bucket access verified successfully');
    }
    catch (error) {
        console.error('Error checking bucket:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            bucket: exports.BUCKET_NAME,
            region: process.env.AWS_REGION
        });
        throw new Error(`S3 bucket is not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
// Add this function to create user folders
async function createUserFolders(walletAddress) {
    try {
        console.log('Creating user folders in S3...', { walletAddress });
        // Create empty objects to represent folders
        const folders = ['photos', 'songs', 'videos', 'profile-pics', 'banners'].map(folder => ({
            Bucket: exports.BUCKET_NAME,
            Key: `${walletAddress}/${folder}/`,
            Body: '',
            ContentType: 'application/x-directory'
        }));
        // Create all folders in parallel
        await Promise.all(folders.map(folder => exports.s3Client.send(new client_s3_1.PutObjectCommand(folder))));
        console.log('Successfully created user folders');
    }
    catch (error) {
        console.error('Error creating user folders:', error);
        throw new Error(`Failed to create user folders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
// Function to upload file to S3
async function uploadFileToS3(fileData, contentType, walletAddress, fileType, originalFilename) {
    try {
        console.log('Starting file upload to S3...', {
            contentType,
            walletAddress,
            fileType,
            originalFilename,
            fileSize: fileData.length
        });
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${fileType}-${timestamp}${getFileExtension(originalFilename)}`;
        // Construct the key (path in S3)
        const key = `${walletAddress}/${filename}`;
        console.log('Generated S3 key:', key);
        // Upload to S3 with public-read ACL
        const command = new client_s3_1.PutObjectCommand({
            Bucket: exports.BUCKET_NAME,
            Key: key,
            Body: fileData,
            ContentType: contentType,
        });
        console.log('Sending upload command to S3...');
        await exports.s3Client.send(command);
        console.log('File uploaded successfully');
        // Return the URL
        const url = `https://${exports.BUCKET_NAME}.s3.amazonaws.com/${key}`;
        console.log('Generated URL:', url);
        return url;
    }
    catch (error) {
        console.error('Error uploading to S3:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            bucket: exports.BUCKET_NAME,
            key: `${walletAddress}/${fileType}`,
            contentType,
            fileSize: fileData.length
        });
        throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
// Helper function to get file extension
function getFileExtension(filename) {
    const ext = filename.split('.').pop();
    return ext ? `.${ext}` : '';
}
const CLOUDFRONT_URL = 'https://d1vzx9blif66wm.cloudfront.net';
async function uploadToS3(file, folder) {
    try {
        console.log('Starting S3 upload process...', {
            fileName: 'originalname' in file ? file.originalname : file.name,
            fileType: 'mimetype' in file ? file.mimetype : file.type,
            fileSize: file.size,
            folder,
            bucket: exports.BUCKET_NAME,
            region: process.env.AWS_REGION || 'us-west-2'
        });
        // Handle buffer based on file type
        let buffer;
        if ('buffer' in file) {
            // Multer file already has buffer
            buffer = file.buffer;
        }
        else {
            // Browser File needs conversion
            const arrayBuffer = await file.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        }
        const timestamp = Date.now();
        const extension = ('originalname' in file ? file.originalname : file.name).split('.').pop();
        const key = `${folder}/${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;
        console.log('Preparing S3 upload...', {
            bucket: exports.BUCKET_NAME,
            key,
            contentType: 'mimetype' in file ? file.mimetype : file.type,
            bufferSize: buffer.length
        });
        await exports.s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: exports.BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: 'mimetype' in file ? file.mimetype : file.type,
        }));
        // Instead of returning the S3 URL, return the CloudFront URL
        const url = `${CLOUDFRONT_URL}/${key}`;
        console.log('Generated CloudFront URL:', url);
        return url;
    }
    catch (error) {
        console.error('Error uploading to S3:', {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            fileName: 'originalname' in file ? file.originalname : file.name,
            fileType: 'mimetype' in file ? file.mimetype : file.type,
            fileSize: file.size,
            folder
        });
        throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
