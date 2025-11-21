import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { FileType } from '../types/file';

// Validate environment variables
const requiredEnvVars = {
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Initialize S3 Client
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET || 'streamko';

// Function to ensure user's folder exists
export async function ensureUserFolder(walletAddress: string): Promise<void> {
  try {
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
  } catch (error) {
    throw new Error(`S3 bucket is not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Add this function to create user folders
export async function createUserFolders(walletAddress: string): Promise<void> {
  try {
    // Create empty objects to represent folders
    const folders = ['photos', 'songs', 'videos', 'profile-pics', 'banners'].map(folder => ({
      Bucket: BUCKET_NAME,
      Key: `${walletAddress}/${folder}/`,
      Body: '',
      ContentType: 'application/x-directory'
    }));

    // Create all folders in parallel
    await Promise.all(
      folders.map(folder =>
        s3Client.send(new PutObjectCommand(folder))
      )
    );
  } catch (error) {
    throw new Error(`Failed to create user folders: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to upload file to S3
export async function uploadFileToS3(
  fileData: Buffer,
  contentType: string,
  walletAddress: string,
  fileType: 'profile' | 'banner' | 'photo',
  originalFilename: string
): Promise<string> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${fileType}-${timestamp}${getFileExtension(originalFilename)}`;
    
    // Construct the key (path in S3)
    const key = `${walletAddress}/${filename}`;

    // Upload to S3 with public-read ACL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileData,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Return the URL
    const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
    return url;
  } catch (error) {
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to get file extension
function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop();
  return ext ? `.${ext}` : '';
}

const CLOUDFRONT_URL = 'https://d1800dw1pmsgy7.cloudfront.net';

export async function uploadToS3(
  file: FileType,
  folder: string
): Promise<string> {
  try {
    // Handle buffer based on file type
    let buffer: Buffer;
    if ('buffer' in file) {
      // Multer file already has buffer
      buffer = file.buffer;
    } else {
      // Browser File needs conversion
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    const timestamp = Date.now();
    const extension = ('originalname' in file ? file.originalname : file.name).split('.').pop();
    const key = `${folder}/${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: 'mimetype' in file ? file.mimetype : file.type,
        // ACL removed - bucket policy handles public access
      })
    );

    // Return the CloudFront URL
    const url = `${CLOUDFRONT_URL}/${key}`;
    
    return url;
  } catch (error) {
    throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 