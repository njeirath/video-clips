import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid';

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

    // Generate the HTML content with Open Graph and Twitter Card meta tags
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${this.escapeHtml(metaTitle)}</title>
  <meta name="description" content="${this.escapeHtml(metaDescription)}" />
  
  <!-- Open Graph meta tags -->
  <meta property="og:title" content="${this.escapeHtml(metaTitle)}" />
  <meta property="og:description" content="${this.escapeHtml(metaDescription)}" />
  <meta property="og:url" content="${shareUrl}" />
  <meta property="og:type" content="video.other" />
  ${clipData.videoUrl ? `<meta property="og:video" content="${clipData.videoUrl}" />
  <meta property="og:video:url" content="${clipData.videoUrl}" />
  <meta property="og:video:secure_url" content="${clipData.videoUrl}" />
  <meta property="og:video:type" content="video/mp4" />` : ''}
  <meta property="og:image" content="${fallbackImage}" />
  
  <!-- Twitter Card meta tags -->
  <meta name="twitter:card" content="${clipData.videoUrl ? 'player' : 'summary'}" />
  <meta name="twitter:title" content="${this.escapeHtml(metaTitle)}" />
  <meta name="twitter:description" content="${this.escapeHtml(metaDescription)}" />
  <meta name="twitter:image" content="${fallbackImage}" />
  ${clipData.videoUrl ? `<meta name="twitter:player" content="${shareUrl}" />
  <meta name="twitter:player:width" content="1280" />
  <meta name="twitter:player:height" content="720" />
  <meta name="twitter:player:stream" content="${clipData.videoUrl}" />
  <meta name="twitter:player:stream:content_type" content="video/mp4" />` : ''}
  
  <meta http-equiv="refresh" content="0; url=/" />
</head>
<body>
  <h1>${this.escapeHtml(metaTitle)}</h1>
  <p>${this.escapeHtml(metaDescription)}</p>
  ${clipData.videoUrl ? `<video controls style="width: 100%; max-width: 800px;">
    <source src="${clipData.videoUrl}" type="video/mp4" />
    Your browser does not support the video tag.
  </video>` : '<p>No video available</p>'}
  <p><a href="/">View all clips</a></p>
</body>
</html>`;

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

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

// Singleton instance
export const s3Service = new S3Service();
