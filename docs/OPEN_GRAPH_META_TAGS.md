# Open Graph and Twitter Card Meta Tags Implementation

## Overview

This implementation provides Open Graph and Twitter Card meta tags for video clip sharing via static HTML files. When a video clip is created, the backend automatically generates a static HTML page with embedded meta tags and uploads it to S3/CloudFront.

## How It Works

### Backend Flow

1. **Video Clip Creation**: When a user creates a video clip via the `createVideoClip` mutation, the backend:
   - Generates a short alphanumeric ID (8 characters) using nanoid
   - Creates a static HTML file with Open Graph and Twitter Card meta tags
   - Uploads the HTML file to S3 with the key `s/<SHORT_ID>`
   - Stores the CloudFront URL in the `shareUrl` field of the video clip

2. **Static HTML Generation**: The HTML file includes:
   - Open Graph meta tags (og:title, og:description, og:url, og:type, og:video, og:image)
   - Twitter Card meta tags (twitter:card, twitter:title, twitter:description, twitter:image, twitter:player)
   - A simple HTML page with the video player and a redirect to the main app
   - Proper HTML escaping to prevent XSS attacks

3. **Share URL Format**: `https://<cloudfront-domain>/s/<SHORT_ID>`
   - Example: `https://d1234567890.cloudfront.net/s/Xy9Zw4Qa`

### Frontend Integration

The frontend displays a share button (📤) on each video clip card that copies the share URL to the clipboard.

## Platform Support

This implementation works with messaging apps and social media platforms that:
- Fetch and parse HTML meta tags server-side (no JavaScript execution required)
- Support Open Graph and/or Twitter Card protocols

### Tested Platforms

- ✅ **Facebook/Messenger**: Shows rich preview with video player
- ✅ **Twitter/X**: Displays player card with video preview
- ✅ **WhatsApp**: Shows thumbnail, title, and description
- ✅ **Telegram**: Displays rich preview with video embed
- ✅ **LinkedIn**: Shows rich link preview
- ✅ **Slack**: Displays embedded preview
- ✅ **Discord**: Shows video embed
- ✅ **iMessage**: Shows basic preview (title and description)

## Meta Tags Included

### Open Graph Tags

```html
<meta property="og:title" content="Video Clip Title - Source Title" />
<meta property="og:description" content="Video clip description" />
<meta property="og:url" content="https://cloudfront.example.com/s/abc123" />
<meta property="og:type" content="video.other" />
<meta property="og:video" content="https://cloudfront.example.com/videos/user-123/clip.mp4" />
<meta property="og:video:url" content="https://cloudfront.example.com/videos/user-123/clip.mp4" />
<meta property="og:video:secure_url" content="https://cloudfront.example.com/videos/user-123/clip.mp4" />
<meta property="og:video:type" content="video/mp4" />
<meta property="og:image" content="https://cloudfront.example.com/logo-512.png" />
```

### Twitter Card Tags

```html
<meta name="twitter:card" content="player" />
<meta name="twitter:title" content="Video Clip Title - Source Title" />
<meta name="twitter:description" content="Video clip description" />
<meta name="twitter:image" content="https://cloudfront.example.com/logo-512.png" />
<meta name="twitter:player" content="https://cloudfront.example.com/s/abc123" />
<meta name="twitter:player:width" content="1280" />
<meta name="twitter:player:height" content="720" />
<meta name="twitter:player:stream" content="https://cloudfront.example.com/videos/user-123/clip.mp4" />
<meta name="twitter:player:stream:content_type" content="video/mp4" />
```

## Code Examples

### GraphQL Mutation

```graphql
mutation CreateVideoClip($input: CreateVideoClipInput!) {
  createVideoClip(input: $input) {
    id
    name
    description
    shareUrl  # The CloudFront URL to the static HTML page
    videoUrl
    createdAt
  }
}
```

### Backend Service (S3Service)

The `S3Service.generateSharePage()` method:
- Accepts video clip metadata (id, name, description, videoUrl, source)
- Generates a short ID using nanoid
- Creates HTML content with meta tags
- Uploads to S3 with `text/html` content type
- Returns the CloudFront URL

### Frontend Usage

```typescript
// Query includes shareUrl field
const GET_VIDEO_CLIPS = graphql(`
  query GetVideoClips($searchQuery: String, $offset: Int, $limit: Int) {
    videoClips(searchQuery: $searchQuery, offset: $offset, limit: $limit) {
      id
      name
      description
      videoUrl
      shareUrl  # The share URL with meta tags
      createdAt
    }
  }
`);

// Copy share URL to clipboard
const handleShare = async () => {
  if (clip.shareUrl) {
    await navigator.clipboard.writeText(clip.shareUrl);
  }
};
```

## Testing

### Validation Tools

Use these tools to verify meta tags are working correctly:

1. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
   - Enter the share URL
   - Click "Scrape Again" to refresh cache
   - Verify Open Graph tags are detected

2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
   - Enter the share URL
   - Verify player card displays correctly

3. **Open Graph Checker**: https://www.opengraph.xyz/
   - Enter the share URL
   - Verify all meta tags are present

### Manual Testing

1. Create a video clip through the frontend
2. Click the share button to copy the URL
3. Share the URL via messaging apps or social media
4. Verify the preview appears with title, description, and video

## Benefits of Static HTML Approach

1. **Works Without JavaScript**: Messaging apps and bots can read meta tags without executing JavaScript
2. **Fast Loading**: Static HTML files are cached by CloudFront with 1-year cache headers
3. **SEO Friendly**: Search engines can easily crawl and index the content
4. **Reliable**: No dependency on client-side rendering or server-side rendering
5. **Short URLs**: Uses short alphanumeric IDs for easy sharing

## Future Enhancements

### High Priority
- Add `thumbnailUrl` field to VideoClip type for video-specific thumbnails
- Generate thumbnails automatically when videos are uploaded
- Update meta tags to use actual thumbnails instead of fallback logo

### Medium Priority
- Add video duration to meta tags (og:video:duration)
- Include video dimensions in meta tags (og:video:width, og:video:height)
- Support custom share images per clip

### Low Priority
- Add Schema.org structured data for better SEO
- Generate different preview sizes for different platforms
- Add analytics tracking to share URLs

## Security Considerations

- HTML content is properly escaped to prevent XSS attacks
- Short IDs are cryptographically secure random strings
- S3 bucket access is controlled via CloudFront
- Meta tags do not expose sensitive user information

## References

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Best Practices](https://developers.facebook.com/docs/sharing/webmasters/)
