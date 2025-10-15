# Video Upload Feature

This document describes the video file upload functionality in the video clips application.

## Overview

The application allows authenticated users to upload video files when creating a new video clip. The uploaded files are stored in an AWS S3 bucket and delivered through a CloudFront distribution for optimal performance.

## Architecture

### Components

1. **Frontend (React)**
   - File selection UI with drag-and-drop support
   - Client-side validation (file type, size)
   - Direct upload to S3 using presigned URLs
   - Progress tracking

2. **Backend (GraphQL API)**
   - Presigned URL generation
   - S3 integration
   - Video metadata storage

3. **Infrastructure (AWS CDK)**
   - S3 bucket for video storage
   - CloudFront distribution for content delivery
   - Proper CORS configuration

## Upload Flow

1. **User selects a video file** in the Add Video Clip form
2. **Frontend validates** the file (type and size)
3. **Frontend requests presigned URL** from backend GraphQL API
   ```graphql
   mutation GenerateUploadUrl($fileName: String!, $contentType: String!) {
     generateUploadUrl(fileName: $fileName, contentType: $contentType) {
       uploadUrl
       s3Key
       videoUrl
     }
   }
   ```
4. **Backend generates presigned URL** with 1-hour expiration
5. **Frontend uploads file directly to S3** using the presigned URL (PUT request)
6. **Frontend creates video clip** with S3 key and CloudFront URL
   ```graphql
   mutation CreateVideoClip($input: CreateVideoClipInput!) {
     createVideoClip(input: $input) {
       id
       name
       description
       s3Key
       videoUrl
       createdAt
     }
   }
   ```

## Supported Video Formats

The following video formats are supported:

- **MP4** (`video/mp4`)
- **QuickTime** (`video/quicktime`)
- **AVI** (`video/x-msvideo`)
- **Matroska/MKV** (`video/x-matroska`)
- **WebM** (`video/webm`)

## File Size Limit

- Maximum file size: **500 MB**

## S3 Bucket Structure

Videos are stored in S3 with the following key structure:

```
videos/{userId}/{uniqueId}.{extension}
```

Example:
```
videos/550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-ef1234567890.mp4
```

## CloudFront Distribution

Videos are delivered through CloudFront with the following settings:

- **HTTPS only**: All video access is redirected to HTTPS
- **Caching**: Optimized caching for video content
- **Geographic distribution**: Optimized for North America and Europe (Price Class 100)

## Security

### S3 Bucket Security

- Public access is **blocked** by default
- Access is controlled via CloudFront Origin Access Identity (OAI)
- CORS is configured to allow uploads from the frontend

### Presigned URLs

- URLs expire after **1 hour**
- Each URL is unique and tied to a specific file upload
- URLs are scoped to the authenticated user's directory

### Authentication

- Video upload requires **authentication**
- User must have a valid AWS Cognito JWT token
- Videos are stored in user-specific directories

## Environment Variables

The following environment variables are required for video upload functionality:

### Backend (`apps/backend/.env`)

```bash
AWS_REGION=us-east-2
S3_VIDEO_BUCKET=dev-video-clips-storage
CLOUDFRONT_DOMAIN=d1234567890abc.cloudfront.net
```

## Error Handling

### Frontend Errors

- **Invalid file type**: User-friendly error message
- **File too large**: User-friendly error message
- **Upload failure**: Network error handling with retry option

### Backend Errors

- **Authentication failure**: Returns "Not authenticated" error
- **Invalid content type**: Returns specific error message
- **S3 service unavailable**: Returns error with fallback behavior

## Testing

### Frontend Tests

Run frontend tests:
```bash
npx nx test frontend
```

Tests include:
- File type validation
- File size validation
- Form submission

### Backend Tests

Run backend tests:
```bash
npx nx test backend
```

Tests include:
- Presigned URL generation for authenticated users
- Authentication requirement
- Video clip creation with S3 metadata

## Deployment

### Prerequisites

1. AWS account with appropriate permissions
2. CDK CLI installed
3. Environment variables configured

### Deploy S3 and CloudFront

```bash
cd apps/cdk
cdk deploy DevStorage
```

This will create:
- S3 bucket: `dev-video-clips-storage`
- CloudFront distribution
- CloudFront Origin Access Identity

### Update Environment Variables

After deployment, update your backend `.env` file with:
- `S3_VIDEO_BUCKET`: Output from CDK deployment
- `CLOUDFRONT_DOMAIN`: Output from CDK deployment

## Monitoring

### CloudWatch Metrics

Monitor the following metrics:

- S3 bucket storage size
- CloudFront request count
- CloudFront error rates
- S3 PUT request count

### Cost Optimization

- Lifecycle policies delete incomplete multipart uploads after 7 days
- CloudFront caching reduces S3 GET requests
- Videos are stored in a single region to minimize transfer costs

## Future Enhancements

- [ ] Video transcoding (convert to multiple formats/resolutions)
- [ ] Thumbnail generation
- [ ] Progress callbacks during upload
- [ ] Resumable uploads for large files
- [ ] Video compression before upload
- [ ] Support for more video formats
- [ ] Video duration and metadata extraction
- [ ] Adaptive bitrate streaming (HLS/DASH)
