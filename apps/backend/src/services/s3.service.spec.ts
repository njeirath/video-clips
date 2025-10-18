import * as fs from 'fs';

// Mock nanoid before importing
jest.mock('nanoid', () => ({
  customAlphabet: jest.fn().mockReturnValue(() => 'abc12345'),
}));

// Mock AWS SDK before importing
jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn().mockResolvedValue({});
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://example.com/presigned-url'),
}));

// Mock fs to avoid file system operations
jest.mock('fs');

// Mock Handlebars
jest.mock('handlebars', () => ({
  compile: jest.fn().mockReturnValue((data: any) => {
    // Simple mock that returns a string with the data for testing
    return JSON.stringify(data);
  }),
}));

import { S3Service } from './s3.service';
import { PutObjectCommand } from '@aws-sdk/client-s3';

describe('S3Service', () => {
  let service: S3Service;
  let mockS3Send: jest.Mock;

  beforeEach(() => {
    // Set up environment variables
    process.env.AWS_REGION = 'us-east-2';
    process.env.S3_VIDEO_BUCKET = 'test-bucket';
    process.env.CLOUDFRONT_DOMAIN = 'test.cloudfront.net';

    // Mock the S3 client send method
    mockS3Send = jest.fn().mockResolvedValue({});
    
    // Mock fs.readFileSync
    (fs.readFileSync as jest.Mock).mockReturnValue('mock template');

    service = new S3Service();
    (service as any).s3Client = {
      send: mockS3Send,
    };

    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.AWS_REGION;
    delete process.env.S3_VIDEO_BUCKET;
    delete process.env.CLOUDFRONT_DOMAIN;
  });

  describe('generateSharePage', () => {
    it('should pass thumbnailUrl to the template when provided', async () => {
      const clipData = {
        id: 'test-id',
        name: 'Test Video',
        description: 'Test Description',
        videoUrl: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
      };

      await service.generateSharePage(clipData);

      // The mock compile function returns JSON.stringify of the data
      const uploadCall = mockS3Send.mock.calls[0][0];
      expect(uploadCall).toBeDefined();
      expect(uploadCall.input).toBeDefined();
      
      // Parse the HTML content which is JSON.stringify of template data
      const htmlContent = uploadCall.input.Body;
      const templateData = JSON.parse(htmlContent);

      expect(templateData.thumbnailUrl).toBe('https://example.com/thumbnail.jpg');
      expect(templateData.videoUrl).toBe('https://example.com/video.mp4');
      expect(templateData.metaTitle).toBe('Test Video');
      expect(templateData.metaDescription).toBe('Test Description');
    });

    it('should not pass thumbnailUrl when not provided', async () => {
      const clipData = {
        id: 'test-id',
        name: 'Test Video',
        description: 'Test Description',
        videoUrl: 'https://example.com/video.mp4',
      };

      await service.generateSharePage(clipData);

      const uploadCall = mockS3Send.mock.calls[0][0];
      const htmlContent = uploadCall.input.Body;
      const templateData = JSON.parse(htmlContent);

      expect(templateData.thumbnailUrl).toBeUndefined();
      expect(templateData.fallbackImage).toBeDefined();
    });

    it('should include source information in meta title for shows', async () => {
      const clipData = {
        id: 'test-id',
        name: 'Funny Scene',
        description: 'A funny scene',
        videoUrl: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        source: {
          type: 'show',
          title: 'Test Show',
          season: 1,
          episode: 5,
        },
      };

      await service.generateSharePage(clipData);

      const uploadCall = mockS3Send.mock.calls[0][0];
      const htmlContent = uploadCall.input.Body;
      const templateData = JSON.parse(htmlContent);

      expect(templateData.metaTitle).toBe('Funny Scene - Test Show S1E5');
      expect(templateData.thumbnailUrl).toBe('https://example.com/thumbnail.jpg');
    });

    it('should include source information in meta title for movies', async () => {
      const clipData = {
        id: 'test-id',
        name: 'Epic Scene',
        description: 'An epic scene',
        videoUrl: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        source: {
          type: 'movie',
          title: 'Test Movie',
        },
      };

      await service.generateSharePage(clipData);

      const uploadCall = mockS3Send.mock.calls[0][0];
      const htmlContent = uploadCall.input.Body;
      const templateData = JSON.parse(htmlContent);

      expect(templateData.metaTitle).toBe('Epic Scene - Test Movie');
      expect(templateData.thumbnailUrl).toBe('https://example.com/thumbnail.jpg');
    });

    it('should upload HTML to S3 with correct parameters', async () => {
      const clipData = {
        id: 'test-id',
        name: 'Test Video',
        description: 'Test Description',
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
      };

      const result = await service.generateSharePage(clipData);

      expect(mockS3Send).toHaveBeenCalledTimes(1);
      const uploadCall = mockS3Send.mock.calls[0][0];
      
      expect(uploadCall).toBeDefined();
      expect(uploadCall.input).toBeDefined();
      expect(uploadCall.input.Bucket).toBe('test-bucket');
      expect(uploadCall.input.Key).toMatch(/^s\/[A-Za-z0-9]{8}$/);
      expect(uploadCall.input.ContentType).toBe('text/html');
      expect(uploadCall.input.CacheControl).toBe('public, max-age=31536000');
      
      // Result should be the CloudFront URL
      expect(result).toMatch(/^https:\/\/test\.cloudfront\.net\/s\/[A-Za-z0-9]{8}$/);
    });
  });
});
