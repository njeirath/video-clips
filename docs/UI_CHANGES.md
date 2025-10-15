# Video Upload Feature - UI Changes Summary

## Overview
This document summarizes the UI changes made to support video file uploads in the Add Video Clip feature.

## Changes to Add Video Clip Page

### New File Upload Section

The Add Video Clip form now includes a file upload section between the Description field and the action buttons:

#### Components Added:
1. **File Input Button**
   - Hidden native file input with custom Material-UI button
   - Icon: CloudUploadIcon
   - Text: "Select Video File" (changes to "Change Video File" after selection)
   - Accept attribute: "video/*"

2. **Selected File Display**
   - Shows filename and file size when a file is selected
   - Example: "Selected: my-video.mp4 (45.23 MB)"

3. **Upload Progress Indicator**
   - Linear progress bar shown during upload
   - Displays upload percentage
   - Only visible when actively uploading

4. **Error Messages**
   - File type validation errors
   - File size validation errors (max 500MB)
   - Upload failure errors

### Form Behavior

#### Validation:
- **File Type**: Only video formats allowed (MP4, MOV, AVI, MKV, WebM)
- **File Size**: Maximum 500MB
- **Optional**: Video file is optional; clips can be created without videos

#### Upload Flow:
1. User selects file via button
2. Frontend validates file type and size
3. On form submit:
   - If file selected: Request presigned URL from backend
   - Upload file to S3 using presigned URL
   - Show progress bar during upload
   - Create clip with video metadata
4. Form disabled during upload process

#### State Management:
- All form fields disabled during upload
- Progress indicator shows upload status
- Success/error messages shown after completion

## Changes to Home Page

### Video Player Integration

Video clips with uploaded videos now display an embedded video player:

#### Features:
- HTML5 video player with native controls
- Responsive width (100% of card width)
- Fixed max height (200px)
- Rounded corners (borderRadius: 4)
- Positioned between description and date

#### Display Logic:
- Video player only shown if `clip.videoUrl` exists
- Falls back to text-only display if no video

## GraphQL Schema Updates

### New Mutation: `generateUploadUrl`
```graphql
mutation GenerateUploadUrl($fileName: String!, $contentType: String!) {
  generateUploadUrl(fileName: $fileName, contentType: $contentType) {
    uploadUrl
    s3Key
    videoUrl
  }
}
```

### Updated VideoClip Type
```graphql
type VideoClip {
  id: ID!
  name: String!
  description: String!
  userId: String!
  userEmail: String!
  s3Key: String        # New field
  videoUrl: String     # New field
  createdAt: String!
}
```

### Updated CreateVideoClipInput
```graphql
input CreateVideoClipInput {
  name: String!
  description: String!
  s3Key: String        # New field
  videoUrl: String     # New field
}
```

## User Experience Flow

### Adding a Video Clip with Video:

1. Navigate to "Add Video Clip" page
2. Fill in Name and Description (required)
3. Click "Select Video File" button
4. Choose video from file system
5. See selected file name and size
6. Click "Add Video Clip" button
7. See upload progress bar
8. See success message
9. Redirected to home page after 2 seconds

### Viewing Video Clips:

1. Navigate to Home page
2. Scroll through video clips
3. If clip has video, see embedded player
4. Click play to watch video
5. Video streams from CloudFront

## Error Handling

### Client-Side Validation Errors:
- "Invalid file type. Please select a valid video file (MP4, MOV, AVI, MKV, or WebM)."
- "File is too large. Maximum file size is 500MB."

### Upload Errors:
- "Failed to get upload URL"
- "Upload failed with status: [HTTP status code]"
- "Failed to upload video"

### Form Validation Errors:
- "Video clip name is required"
- "Video clip name cannot be empty"
- "Description is required"
- "Description cannot be empty"

## Accessibility

- Proper label associations for form fields
- Screen reader-friendly button text
- Keyboard navigation support
- Focus management during upload
- Clear error messages

## Performance Optimizations

- Direct S3 upload (no backend proxy)
- CloudFront CDN for video delivery
- Presigned URLs with 1-hour expiration
- Form validation before upload starts
- Progress feedback during upload

## Testing

- Unit tests for file validation logic
- Unit tests for presigned URL generation
- Integration tests for upload flow
- Form validation tests

## Known Limitations

- No drag-and-drop support (future enhancement)
- No resume capability for interrupted uploads
- Single file upload only
- No video preview before upload
- No client-side video compression
