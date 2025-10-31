import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

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

const BUCKET_NAME = 'streamking';
const PHOTOS_PREFIX = 'Photos';

// Function to ensure user's folder exists
export async function ensureUserFolder(walletAddress: string): Promise<void> {
  try {
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
  } catch (error) {
    throw new Error(`S3 bucket is not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    const key = `${PHOTOS_PREFIX}/${walletAddress}/${filename}`;

    // Upload to S3 with public-read ACL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileData,
      ContentType: contentType,
      ACL: 'public-read', // Make the object publicly readable
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

export async function uploadToS3(file: File, folder: string): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const key = `${folder}/${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: file.type,
          ACL: 'public-read'
        })
      );
    } catch (s3Error) {
      throw s3Error;
    }

    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-west-2'}.amazonaws.com/${key}`;
    
    return url;
  } catch (error) {
    throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 