import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid';
import Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

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

  /**
   * Generate and upload a static HTML file with Open Graph meta tags for a video clip
   * @param clipData - Video clip data including name, description, videoUrl, etc.
   * @returns The CloudFront URL to the static HTML page
   */
  async generateSharePage(clipData: {
    id: string;
    name: string;
    description: string;
    videoUrl?: string;
    source?: any;
  }): Promise<string> {
    // Generate a short alphanumeric ID (8 characters, URL-safe)
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 8);
    const shortId = nanoid();
    const s3Key = `s/${shortId}`;

    // Build the title with source information
    let metaTitle = clipData.name;
    if (clipData.source) {
      const source = clipData.source;
      if (source.type === 'show' && source.title) {
        metaTitle = `${clipData.name} - ${source.title}`;
        if (source.season) {
          metaTitle += ` S${source.season}`;
          if (source.episode) {
            metaTitle += `E${source.episode}`;
          }
        }
      } else if (source.type === 'movie' && source.title) {
        metaTitle = `${clipData.name} - ${source.title}`;
      }
    }

    // Build the description
    const metaDescription = clipData.description || 'Video clip';

    // Get the share URL
    const shareUrl = this.cloudFrontDomain
      ? `https://${this.cloudFrontDomain}/${s3Key}`
      : `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com/${s3Key}`;

    // Fallback image (app logo)
    const fallbackImage = this.cloudFrontDomain
      ? `https://${this.cloudFrontDomain}/logo-512.png`
      : '/logo-512.png';

    // Read and compile the Handlebars template
    // In production: dist/backend/apps/backend/src/services/ -> dist/backend/templates/
    // In development: apps/backend/src/services/ -> apps/backend/src/templates/
    let templatePath: string;
    if (process.env.NODE_ENV === 'production' || __dirname.includes('dist/backend')) {
      // Production: Go up to dist/backend then into templates
      templatePath = path.join(__dirname, '../../../../../templates/share-page.hbs');
    } else {
      // Development: Relative path to templates folder
      templatePath = path.join(__dirname, '../templates/share-page.hbs');
    }
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);

    // Render the HTML with template data
    const htmlContent = template({
      metaTitle,
      metaDescription,
      shareUrl,
      videoUrl: clipData.videoUrl,
      fallbackImage,
    });

    // Upload the HTML file to S3
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      Body: htmlContent,
      ContentType: 'text/html',
      CacheControl: 'public, max-age=31536000', // Cache for 1 year
    });

    await this.s3Client.send(command);

    return shareUrl;
  }
}

// Singleton instance
export const s3Service = new S3Service();
