# Open Graph and Twitter Card Meta Tags Documentation

## Overview

This document describes the Open Graph (OG) and Twitter Card meta tags implemented for video clip previews in messaging apps and social media platforms.

## Supported Platforms

The following platforms support link previews with our meta tags:

### Full Support (Rich Previews with Video)
- **Facebook/Messenger**: Supports Open Graph video tags, displays video thumbnails and playback
- **Twitter/X**: Supports Twitter Card player tags, can show video previews
- **LinkedIn**: Supports Open Graph tags, displays rich previews
- **Slack**: Supports Open Graph tags, displays thumbnails and descriptions
- **Discord**: Supports Open Graph tags, displays embedded video players
- **WhatsApp**: Supports Open Graph tags for basic previews (image, title, description)
- **Telegram**: Supports Open Graph tags, displays rich previews

### Partial Support (Basic Previews)
- **iMessage**: Limited Open Graph support, primarily shows title and description
- **SMS apps**: Variable support depending on the app and platform

## Implemented Meta Tags

### Open Graph Tags

The following Open Graph tags are dynamically generated for each video clip page:

| Tag | Description | Example |
|-----|-------------|---------|
| `og:title` | Title of the video clip | "Iconic Duel Scene - The Princess Bride" |
| `og:description` | Description of the clip | "The famous sword fight scene" |
| `og:url` | Canonical URL of the clip page | "https://example.com/clip/123" |
| `og:type` | Type of content | "video.other" |
| `og:video` | URL to the video file | "https://cdn.example.com/videos/clip.mp4" |
| `og:video:url` | Same as og:video | "https://cdn.example.com/videos/clip.mp4" |
| `og:video:secure_url` | HTTPS URL to the video | "https://cdn.example.com/videos/clip.mp4" |
| `og:video:type` | MIME type of the video | "video/mp4" |
| `og:image` | Thumbnail image for the clip | "https://example.com/logo-512.png" (fallback) |

### Twitter Card Tags

The following Twitter Card tags are dynamically generated for each video clip page:

| Tag | Description | Example |
|-----|-------------|---------|
| `twitter:card` | Type of card | "player" |
| `twitter:title` | Title of the video clip | "Iconic Duel Scene - The Princess Bride" |
| `twitter:description` | Description of the clip | "The famous sword fight scene" |
| `twitter:image` | Thumbnail image for the clip | "https://example.com/logo-512.png" (fallback) |
| `twitter:player` | URL to the player page | "https://example.com/clip/123" |
| `twitter:player:width` | Player width in pixels | "1280" |
| `twitter:player:height` | Player height in pixels | "720" |
| `twitter:player:stream` | URL to the video stream | "https://cdn.example.com/videos/clip.mp4" |
| `twitter:player:stream:content_type` | MIME type | "video/mp4" |

## Fallback Behavior

### Missing Thumbnail Images

When a video clip does not have a dedicated thumbnail image (`thumbnailUrl` field):
- The system uses a fallback logo image (`/logo-512.png`)
- The `og:image` and `twitter:image` tags will point to this fallback image
- **Future Enhancement**: Once `thumbnailUrl` is added to the GraphQL schema, thumbnails will be automatically used when available

### Missing Video URL

When a video clip does not have a video URL:
- Video-specific tags (`og:video`, `twitter:player:stream`) are omitted
- Only basic metadata (title, description, image) is included
- The page still displays properly with a "No video available" message

### Missing Metadata

- **Description**: If empty, a generated description is used based on the source (e.g., "Video clip from The Princess Bride")
- **Source Information**: If no source is provided, only the clip name is used in the title

## Implementation Details

### Technology Stack

- **react-helmet-async**: Used for managing dynamic meta tags in the React application
- **React Router**: Individual clip pages at `/clip/:id`
- **GraphQL**: Fetches video clip metadata for dynamic tag generation

### Code Examples

#### Basic Video Clip Page with Meta Tags

```tsx
import { Helmet } from 'react-helmet-async';

function VideoClipDetail() {
  const clip = { /* fetched from GraphQL */ };
  const clipUrl = `${window.location.origin}/clip/${clip.id}`;
  
  return (
    <>
      <Helmet>
        <title>{clip.name}</title>
        <meta property="og:title" content={clip.name} />
        <meta property="og:description" content={clip.description} />
        <meta property="og:url" content={clipUrl} />
        <meta property="og:type" content="video.other" />
        {clip.videoUrl && (
          <meta property="og:video" content={clip.videoUrl} />
        )}
      </Helmet>
      {/* Page content */}
    </>
  );
}
```

#### Fallback Tags in HTML

The main `index.html` includes fallback Open Graph and Twitter Card tags for the home page:

```html
<head>
  <!-- Open Graph meta tags (fallback) -->
  <meta property="og:title" content="Video Clips - Share Your Favorite Moments" />
  <meta property="og:description" content="Share and discover video clips from your favorite movies and TV shows" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="/logo-512.png" />
  
  <!-- Twitter Card meta tags (fallback) -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Video Clips - Share Your Favorite Moments" />
  <meta name="twitter:description" content="Share and discover video clips from your favorite movies and TV shows" />
  <meta name="twitter:image" content="/logo-512.png" />
</head>
```

## Testing

### Testing on Mobile Messaging Apps

#### iOS Testing
1. **iMessage**: Share a clip URL via iMessage and verify the preview displays
2. **WhatsApp**: Share a clip URL and check for thumbnail and title
3. **Facebook Messenger**: Share a clip URL and verify video preview

#### Android Testing
1. **WhatsApp**: Share a clip URL and check for rich preview
2. **Facebook Messenger**: Share a clip URL and verify video preview
3. **Telegram**: Share a clip URL and verify embedded player

### Testing Tools

Use these tools to validate meta tags before mobile testing:

1. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
   - Enter your clip URL
   - Click "Scrape Again" to refresh the cache
   - Verify all OG tags are present

2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
   - Enter your clip URL
   - Verify the player card displays correctly

3. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/
   - Enter your clip URL
   - Check the preview rendering

4. **Open Graph Checker**: https://www.opengraph.xyz/
   - General-purpose validator for all OG tags

### Testing Checklist

- [ ] Individual clip pages load correctly at `/clip/:id`
- [ ] Meta tags are dynamically generated with correct values
- [ ] Title includes source information when available
- [ ] Description falls back to generated text when empty
- [ ] Video URL is included in tags when available
- [ ] Fallback image is used when no thumbnail exists
- [ ] Facebook sharing shows rich preview
- [ ] Twitter sharing shows player card
- [ ] WhatsApp shows thumbnail and title
- [ ] iMessage shows basic preview
- [ ] Links work on both iOS and Android devices

## Future Enhancements

### Add Thumbnail Generation
- Add `thumbnailUrl` field to the VideoClip GraphQL schema
- Generate thumbnails automatically when videos are uploaded
- Use actual video frames instead of fallback logo

### Add Video Duration to Tags
- Include `og:video:duration` tag
- Helps platforms display more accurate information

### Add More Video Metadata
- `og:video:width` and `og:video:height` for better player sizing
- `og:video:codec` for codec information

### Server-Side Rendering (SSR)
- For better SEO and immediate meta tag availability
- Consider using Next.js or similar framework
- Allows bots to see meta tags without JavaScript execution

### Add Schema.org Structured Data
- Include JSON-LD structured data for search engines
- Helps with Google rich snippets
- Provides additional context for video content

## References

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Open Graph Guide](https://developers.facebook.com/docs/sharing/webmasters/)
- [WhatsApp Link Preview Guide](https://faq.whatsapp.com/general/how-to-use-link-previews)
