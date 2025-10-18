import { useNavigate, useParams } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import EditIcon from '@mui/icons-material/Edit';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { useQuery } from '@apollo/client/react';
import { graphql } from '../gql/gql';
import { useState, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';

const GET_VIDEO_CLIP = graphql(`
  query GetVideoClipDetail($id: String!) {
    videoClip(id: $id) {
      id
      name
      description
      userId
      userEmail
      videoUrl
      thumbnailUrl
      script
      duration
      characters
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
      createdAt
      updatedAt
      updatedBy
    }
  }
`);

export default function VideoClipDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { data, loading, error } = useQuery(GET_VIDEO_CLIP, {
    variables: { id: id || '' },
    skip: !id,
  });

  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <Container component="main" maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !data?.videoClip) {
    return (
      <Container component="main" maxWidth="md">
        <Box sx={{ mt: 8 }}>
          <Alert severity="error">
            Failed to load video clip. Please try again later.
          </Alert>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Back to Home
          </Button>
        </Box>
      </Container>
    );
  }

  const clip = data.videoClip;

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <VideoLibraryIcon />
        </Avatar>
        <Typography component="h1" variant="h4" sx={{ mb: 2 }}>
          {clip.name}
        </Typography>

        {/* Video and thumbnail */}
        {clip.videoUrl && (
          <Box sx={{ width: '100%', maxWidth: 800, mb: 3 }}>
            <video
              controls
              style={{ width: '100%', borderRadius: 8 }}
              src={clip.videoUrl}
              poster={clip.thumbnailUrl || undefined}
            >
              Your browser does not support the video tag.
            </video>
          </Box>
        )}

        {clip.thumbnailUrl && !clip.videoUrl && (
          <Box sx={{ width: '100%', maxWidth: 800, mb: 3 }}>
            <img
              src={clip.thumbnailUrl}
              alt={clip.name}
              style={{ width: '100%', borderRadius: 8 }}
            />
          </Box>
        )}

        {/* Edit button for authenticated users */}
        {isAuthenticated && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/clip/${id}/edit`)}
            sx={{ mb: 3 }}
          >
            Edit
          </Button>
        )}

        {/* Details */}
        <Box sx={{ width: '100%', maxWidth: 800 }}>
          <Divider sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Details
            </Typography>
          </Divider>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1">{clip.description}</Typography>
          </Box>

          {clip.script && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Script
              </Typography>
              <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                "{clip.script}"
              </Typography>
            </Box>
          )}

          {clip.duration !== null && clip.duration !== undefined && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Duration
              </Typography>
              <Typography variant="body1">{clip.duration} seconds</Typography>
            </Box>
          )}

          {clip.characters && clip.characters.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Characters
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {clip.characters.map((character, index) => (
                  <Chip key={index} label={character} />
                ))}
              </Box>
            </Box>
          )}

          {clip.tags && clip.tags.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {clip.tags.map((tag, index) => (
                  <Chip key={index} label={tag} color="primary" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}

          {clip.source && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Source
              </Typography>
              {'season' in clip.source || 'episode' in clip.source ? (
                <Box>
                  <Typography variant="body1">
                    <strong>Show:</strong> {clip.source.title}
                  </Typography>
                  {'season' in clip.source && clip.source.season && (
                    <Typography variant="body2">Season {clip.source.season}</Typography>
                  )}
                  {'episode' in clip.source && clip.source.episode && (
                    <Typography variant="body2">Episode {clip.source.episode}</Typography>
                  )}
                  {'airDate' in clip.source && clip.source.airDate && (
                    <Typography variant="body2">Aired: {clip.source.airDate}</Typography>
                  )}
                  {('start' in clip.source && clip.source.start !== null && clip.source.start !== undefined) ||
                   ('end' in clip.source && clip.source.end !== null && clip.source.end !== undefined) ? (
                    <Typography variant="body2">
                      Clip time:{' '}
                      {'start' in clip.source && clip.source.start !== null && clip.source.start !== undefined ? 
                        `${clip.source.start}s` : '?'}
                      {' - '}
                      {'end' in clip.source && clip.source.end !== null && clip.source.end !== undefined ? 
                        `${clip.source.end}s` : '?'}
                    </Typography>
                  ) : null}
                </Box>
              ) : (
                <Box>
                  <Typography variant="body1">
                    <strong>Movie:</strong> {clip.source.title}
                  </Typography>
                  {'releaseDate' in clip.source && clip.source.releaseDate && (
                    <Typography variant="body2">Released: {clip.source.releaseDate}</Typography>
                  )}
                  {('start' in clip.source && clip.source.start !== null && clip.source.start !== undefined) ||
                   ('end' in clip.source && clip.source.end !== null && clip.source.end !== undefined) ? (
                    <Typography variant="body2">
                      Clip time:{' '}
                      {'start' in clip.source && clip.source.start !== null && clip.source.start !== undefined ? 
                        `${clip.source.start}s` : '?'}
                      {' - '}
                      {'end' in clip.source && clip.source.end !== null && clip.source.end !== undefined ? 
                        `${clip.source.end}s` : '?'}
                    </Typography>
                  ) : null}
                </Box>
              )}
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Created: {new Date(clip.createdAt).toLocaleString()}
            </Typography>
            {clip.updatedAt && (
              <Typography variant="caption" color="text.secondary" display="block">
                Last updated: {new Date(clip.updatedAt).toLocaleString()}
                {clip.updatedBy && ` by ${clip.updatedBy}`}
              </Typography>
            )}
          </Box>

          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            fullWidth
            sx={{ mt: 2 }}
          >
            Back to Home
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
