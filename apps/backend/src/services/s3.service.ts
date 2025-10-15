import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private cloudFrontDomain: string;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-2';
    const bucketName = process.env.S3_VIDEO_BUCKET;
    const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;

    if (!bucketName) {
      console.warn('S3_VIDEO_BUCKET not configured. Video upload will not work.');
    }

    if (!cloudFrontDomain) {
      console.warn('CLOUDFRONT_DOMAIN not configured. Video URLs will use S3 direct URLs.');
    }

    this.bucketName = bucketName || 'dev-video-clips-storage';
    this.cloudFrontDomain = cloudFrontDomain || '';
    
    this.s3Client = new S3Client({ region });
  }

  /**
   * Generate a presigned URL for uploading a video file to S3
   * @param userId - The ID of the user uploading the file
   * @param fileName - Original file name
   * @param contentType - MIME type of the file
   * @returns Object containing uploadUrl, s3Key, and videoUrl
   */
  async generatePresignedUploadUrl(
    userId: string,
    fileName: string,
    contentType: string
  ): Promise<{ uploadUrl: string; s3Key: string; videoUrl: string }> {
    // Validate content type
    const allowedTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/webm',
    ];

    if (!allowedTypes.includes(contentType)) {
      throw new Error(
        `Invalid content type: ${contentType}. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    // Generate a unique S3 key
    const fileExtension = fileName.split('.').pop() || 'mp4';
    const uniqueId = uuidv4();
    const s3Key = `videos/${userId}/${uniqueId}.${fileExtension}`;

    // Create the presigned URL for PUT operation
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // URL expires in 1 hour
    });

    // Generate the CloudFront URL for accessing the video
    const videoUrl = this.cloudFrontDomain
      ? `https://${this.cloudFrontDomain}/${s3Key}`
      : `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com/${s3Key}`;

    return {
      uploadUrl,
      s3Key,
      videoUrl,
    };
  }
}

// Singleton instance
export const s3Service = new S3Service();
