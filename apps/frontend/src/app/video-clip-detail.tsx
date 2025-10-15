import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { Helmet } from 'react-helmet-async';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { graphql } from '../gql/gql';
import { useRef, useState } from 'react';

const GET_VIDEO_CLIPS = graphql(`
  query GetVideoClipById($searchQuery: String, $limit: Int, $offset: Int) {
    videoClips(searchQuery: $searchQuery, limit: $limit, offset: $offset) {
      id
      name
      description
      userId
      userEmail
      videoUrl
      createdAt
      script
      duration
      actors
      tags
      source {
        ... on ShowSource {
          title
          airDate
          season
          episode
          start
          end
        }
        ... on MovieSource {
          title
          releaseDate
          start
          end
        }
      }
    }
  }
`);

export default function VideoClipDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch all clips and find the one with matching ID
  // Note: This is not ideal, but works with current schema
  const { loading, error, data } = useQuery(GET_VIDEO_CLIPS, {
    variables: { limit: 1000 }, // Fetch more clips to find the one we need
  });

  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(() => {
      videoRef.current?.play();
    }, 0);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Error loading video clip: {error.message}</Alert>
      </Container>
    );
  }

  const clip = data?.videoClips.find((c) => c.id === id);

  if (!clip) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">Video clip not found</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Back to Home
        </Button>
      </Container>
    );
  }

  const hasVideo = !!clip.videoUrl;
  const poster = undefined; // TODO: Add thumbnailUrl to schema
  
  // Build the full URL for this clip
  const clipUrl = `${window.location.origin}/clip/${clip.id}`;
  
  // Determine the source title for better description
  let sourceInfo = '';
  if (clip.source) {
    if ('title' in clip.source) {
      sourceInfo = clip.source.title;
      if ('season' in clip.source && clip.source.season) {
        sourceInfo += ` S${clip.source.season}`;
        if (clip.source.episode) {
          sourceInfo += `E${clip.source.episode}`;
        }
      }
    }
  }

  // Build description for meta tags
  const metaDescription = clip.description || 
    (sourceInfo ? `Video clip from ${sourceInfo}` : 'Video clip');

  // Build a more descriptive title
  const metaTitle = sourceInfo 
    ? `${clip.name} - ${sourceInfo}`
    : clip.name;

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        
        {/* Open Graph tags */}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={clipUrl} />
        <meta property="og:type" content="video.other" />
        
        {clip.videoUrl && (
          <>
            <meta property="og:video" content={clip.videoUrl} />
            <meta property="og:video:url" content={clip.videoUrl} />
            <meta property="og:video:secure_url" content={clip.videoUrl} />
            <meta property="og:video:type" content="video/mp4" />
          </>
        )}
        
        {/* TODO: Add og:image when thumbnailUrl is available in schema */}
        <meta property="og:image" content={`${window.location.origin}/logo-512.png`} />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="player" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={`${window.location.origin}/logo-512.png`} />
        
        {clip.videoUrl && (
          <>
            <meta name="twitter:player" content={clipUrl} />
            <meta name="twitter:player:width" content="1280" />
            <meta name="twitter:player:height" content="720" />
            <meta name="twitter:player:stream" content={clip.videoUrl} />
            <meta name="twitter:player:stream:content_type" content="video/mp4" />
          </>
        )}
      </Helmet>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 3 }}
        >
          Back to Home
        </Button>

        <Card>
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom>
              {clip.name}
            </Typography>

            {sourceInfo && (
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                From: {sourceInfo}
              </Typography>
            )}

            <Typography variant="body1" color="text.secondary" paragraph>
              {clip.description}
            </Typography>

            {hasVideo ? (
              isPlaying ? (
                <Box sx={{ mt: 3 }}>
                  <video
                    ref={videoRef}
                    controls
                    style={{ width: '100%', maxHeight: 500, borderRadius: 4 }}
                    src={clip.videoUrl}
                    poster={poster}
                    autoPlay
                  >
                    Your browser does not support the video tag.
                  </video>
                </Box>
              ) : (
                <Box
                  sx={{
                    mt: 3,
                    position: 'relative',
                    width: '100%',
                    maxHeight: 500,
                    background: '#000',
                    borderRadius: 4,
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                  onClick={handlePlay}
                >
                  {poster ? (
                    <img
                      src={poster}
                      alt={clip.name}
                      style={{ width: '100%', display: 'block' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                      }}
                    >
                      <Typography variant="h6">Click to play</Typography>
                    </Box>
                  )}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.3)',
                      '&:hover': { background: 'rgba(0,0,0,0.5)' },
                    }}
                  >
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': { background: 'rgba(255,255,255,1)' },
                      }}
                    >
                      <Box
                        sx={{
                          width: 0,
                          height: 0,
                          borderLeft: '20px solid #000',
                          borderTop: '12px solid transparent',
                          borderBottom: '12px solid transparent',
                          ml: 1,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              )
            ) : (
              <Box
                sx={{
                  mt: 3,
                  width: '100%',
                  height: 300,
                  background: '#eee',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography color="text.secondary">No video available</Typography>
              </Box>
            )}

            {clip.script && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Script
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontStyle: 'italic',
                    p: 2,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                  }}
                >
                  "{clip.script}"
                </Typography>
              </Box>
            )}

            {clip.actors && clip.actors.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Actors
                </Typography>
                <Typography variant="body2">
                  {clip.actors.join(', ')}
                </Typography>
              </Box>
            )}

            {clip.tags && clip.tags.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {clip.tags.map((tag) => (
                    <Box
                      key={tag}
                      sx={{
                        px: 2,
                        py: 0.5,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        borderRadius: 2,
                        fontSize: '0.875rem',
                      }}
                    >
                      {tag}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {clip.duration && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Duration: {clip.duration} seconds
                </Typography>
              </Box>
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 3 }}
            >
              Added: {new Date(clip.createdAt).toLocaleString()} by {clip.userEmail}
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
