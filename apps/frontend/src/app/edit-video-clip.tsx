import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { useMutation, useQuery } from '@apollo/client/react';
import { graphql } from '../gql/gql';
import { getCurrentUser } from 'aws-amplify/auth';

const GET_VIDEO_CLIP = graphql(`
  query GetVideoClip($id: String!) {
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

const UPDATE_VIDEO_CLIP = graphql(`
  mutation UpdateVideoClip($input: UpdateVideoClipInput!) {
    updateVideoClip(input: $input) {
      id
      name
      description
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
      updatedAt
      updatedBy
    }
  }
`);

interface VideoClipFormData {
  description: string;
  script?: string;
  duration?: number;
  characters?: string;
  tags?: string;
  sourceType?: 'none' | 'show' | 'movie';
  showTitle?: string;
  showAirDate?: string;
  showSeason?: number;
  showEpisode?: number;
  showStart?: number;
  showEnd?: number;
  movieTitle?: string;
  movieReleaseDate?: string;
  movieStart?: number;
  movieEnd?: number;
}

export default function EditVideoClip() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [updateVideoClip, { loading: updating, error: mutationError }] = useMutation(UPDATE_VIDEO_CLIP);

  const { data, loading, error } = useQuery(GET_VIDEO_CLIP, {
    variables: { id: id || '' },
    skip: !id,
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
    watch,
  } = useForm<VideoClipFormData>({
    defaultValues: {
      description: '',
      script: '',
      duration: undefined,
      characters: '',
      tags: '',
      sourceType: 'none',
      showTitle: '',
      showAirDate: '',
      showSeason: undefined,
      showEpisode: undefined,
      showStart: undefined,
      showEnd: undefined,
      movieTitle: '',
      movieReleaseDate: '',
      movieStart: undefined,
      movieEnd: undefined,
    },
  });

  const sourceType = watch('sourceType');

  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch {
        // User not authenticated, redirect to sign in
        navigate('/signin', { state: { from: `/clip/${id}` } });
      }
    }
    checkAuth();
  }, [navigate, id]);

  // Populate form with existing data
  useEffect(() => {
    if (data?.videoClip) {
      const clip = data.videoClip;
      
      // Determine source type
      let sourceType: 'none' | 'show' | 'movie' = 'none';
      if (clip.source) {
        if ('season' in clip.source || 'episode' in clip.source) {
          sourceType = 'show';
        } else if ('releaseDate' in clip.source) {
          sourceType = 'movie';
        }
      }

      reset({
        description: clip.description || '',
        script: clip.script || '',
        duration: clip.duration || undefined,
        characters: clip.characters?.join(', ') || '',
        tags: clip.tags?.join(', ') || '',
        sourceType,
        showTitle: sourceType === 'show' && clip.source ? clip.source.title : '',
        showAirDate: sourceType === 'show' && clip.source && 'airDate' in clip.source ? clip.source.airDate || '' : '',
        showSeason: sourceType === 'show' && clip.source && 'season' in clip.source ? clip.source.season || undefined : undefined,
        showEpisode: sourceType === 'show' && clip.source && 'episode' in clip.source ? clip.source.episode || undefined : undefined,
        showStart: sourceType === 'show' && clip.source && 'start' in clip.source ? clip.source.start || undefined : undefined,
        showEnd: sourceType === 'show' && clip.source && 'end' in clip.source ? clip.source.end || undefined : undefined,
        movieTitle: sourceType === 'movie' && clip.source ? clip.source.title : '',
        movieReleaseDate: sourceType === 'movie' && clip.source && 'releaseDate' in clip.source ? clip.source.releaseDate || '' : '',
        movieStart: sourceType === 'movie' && clip.source && 'start' in clip.source ? clip.source.start || undefined : undefined,
        movieEnd: sourceType === 'movie' && clip.source && 'end' in clip.source ? clip.source.end || undefined : undefined,
      });
    }
  }, [data, reset]);

  // Redirect after successful submission
  useEffect(() => {
    if (isSubmitSuccessful && !mutationError) {
      const timer = setTimeout(() => {
        navigate(`/clip/${id}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitSuccessful, mutationError, navigate, id]);

  const onSubmit = async (formData: VideoClipFormData) => {
    if (!id) return;

    try {
      // Parse characters and tags from comma-separated strings
      const characters = formData.characters?.trim() 
        ? formData.characters.split(',').map(a => a.trim()).filter(a => a.length > 0)
        : undefined;
      
      const tags = formData.tags?.trim()
        ? formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : undefined;

      // Build source object based on sourceType
      let source = undefined;
      if (formData.sourceType === 'show' && formData.showTitle?.trim()) {
        source = {
          show: {
            title: formData.showTitle.trim(),
            airDate: formData.showAirDate?.trim() || undefined,
            season: formData.showSeason || undefined,
            episode: formData.showEpisode || undefined,
            start: formData.showStart || undefined,
            end: formData.showEnd || undefined,
          },
        };
      } else if (formData.sourceType === 'movie' && formData.movieTitle?.trim()) {
        source = {
          movie: {
            title: formData.movieTitle.trim(),
            releaseDate: formData.movieReleaseDate?.trim() || undefined,
            start: formData.movieStart || undefined,
            end: formData.movieEnd || undefined,
          },
        };
      }

      // Update video clip with metadata
      await updateVideoClip({
        variables: {
          input: {
            id,
            description: formData.description?.trim() || undefined,
            script: formData.script?.trim() || undefined,
            duration: formData.duration || undefined,
            characters,
            tags,
            source,
          },
        },
      });
    } catch (err) {
      // Error handled by Apollo Client
      console.error('Failed to update video clip:', err);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

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
          <EditIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Edit Video Clip
        </Typography>
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          {clip.name}
        </Typography>

        {/* Video preview */}
        {clip.videoUrl && (
          <Box sx={{ width: '100%', maxWidth: 600, mb: 3 }}>
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

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                fullWidth
                id="description"
                label="Description (Optional)"
                multiline
                rows={4}
                disabled={updating || isSubmitting}
                helperText="Provide a brief description of the video clip"
              />
            )}
          />

          {/* Optional Fields Section */}
          <Divider sx={{ mt: 4, mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Optional Information
            </Typography>
          </Divider>

          {/* Script Field */}
          <Controller
            name="script"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                fullWidth
                id="script"
                label="Script"
                placeholder="Words spoken in the clip"
                multiline
                rows={3}
                disabled={updating || isSubmitting}
                helperText="The dialogue or words spoken in the clip"
              />
            )}
          />

          {/* Duration Field */}
          <Controller
            name="duration"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                fullWidth
                id="duration"
                label="Duration (seconds)"
                type="number"
                placeholder="e.g., 30.5"
                disabled={updating || isSubmitting}
                helperText="Duration of the clip in seconds"
                inputProps={{ step: 0.1, min: 0 }}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            )}
          />

          {/* Characters Field */}
          <Controller
            name="characters"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                fullWidth
                id="characters"
                label="Characters"
                placeholder="e.g., Inigo Montoya, The Man in Black"
                disabled={updating || isSubmitting}
                helperText="Comma-separated list of characters appearing in the clip"
              />
            )}
          />

          {/* Tags Field */}
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                fullWidth
                id="tags"
                label="Tags"
                placeholder="e.g., comedy, action, drama"
                disabled={updating || isSubmitting}
                helperText="Comma-separated tags for categorization"
              />
            )}
          />

          {/* Source Type Selection */}
          <Divider sx={{ mt: 4, mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Source Information
            </Typography>
          </Divider>

          <Controller
            name="sourceType"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth margin="normal">
                <InputLabel id="source-type-label">Source Type</InputLabel>
                <Select
                  {...field}
                  labelId="source-type-label"
                  id="sourceType"
                  label="Source Type"
                  disabled={updating || isSubmitting}
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="show">TV Show/Series</MenuItem>
                  <MenuItem value="movie">Movie</MenuItem>
                </Select>
              </FormControl>
            )}
          />

          {/* Show Source Fields */}
          {sourceType === 'show' && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                TV Show Details
              </Typography>
              <Controller
                name="showTitle"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    fullWidth
                    id="showTitle"
                    label="Show Title"
                    placeholder="e.g., The Office"
                    disabled={updating || isSubmitting}
                  />
                )}
              />
              <Controller
                name="showAirDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    fullWidth
                    id="showAirDate"
                    label="Air Date"
                    type="date"
                    disabled={updating || isSubmitting}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="showSeason"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      fullWidth
                      id="showSeason"
                      label="Season"
                      type="number"
                      placeholder="e.g., 1"
                      disabled={updating || isSubmitting}
                      inputProps={{ min: 1 }}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  )}
                />
                <Controller
                  name="showEpisode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      fullWidth
                      id="showEpisode"
                      label="Episode"
                      type="number"
                      placeholder="e.g., 5"
                      disabled={updating || isSubmitting}
                      inputProps={{ min: 1 }}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="showStart"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      fullWidth
                      id="showStart"
                      label="Start Time (seconds)"
                      type="number"
                      placeholder="e.g., 120.5"
                      disabled={updating || isSubmitting}
                      inputProps={{ step: 0.1, min: 0 }}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  )}
                />
                <Controller
                  name="showEnd"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      fullWidth
                      id="showEnd"
                      label="End Time (seconds)"
                      type="number"
                      placeholder="e.g., 145.8"
                      disabled={updating || isSubmitting}
                      inputProps={{ step: 0.1, min: 0 }}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  )}
                />
              </Box>
            </Box>
          )}

          {/* Movie Source Fields */}
          {sourceType === 'movie' && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Movie Details
              </Typography>
              <Controller
                name="movieTitle"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    fullWidth
                    id="movieTitle"
                    label="Movie Title"
                    placeholder="e.g., The Princess Bride"
                    disabled={updating || isSubmitting}
                  />
                )}
              />
              <Controller
                name="movieReleaseDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    fullWidth
                    id="movieReleaseDate"
                    label="Release Date"
                    type="date"
                    disabled={updating || isSubmitting}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="movieStart"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      fullWidth
                      id="movieStart"
                      label="Start Time (seconds)"
                      type="number"
                      placeholder="e.g., 3456.2"
                      disabled={updating || isSubmitting}
                      inputProps={{ step: 0.1, min: 0 }}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  )}
                />
                <Controller
                  name="movieEnd"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      fullWidth
                      id="movieEnd"
                      label="End Time (seconds)"
                      type="number"
                      placeholder="e.g., 3489.7"
                      disabled={updating || isSubmitting}
                      inputProps={{ step: 0.1, min: 0 }}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  )}
                />
              </Box>
            </Box>
          )}

          {mutationError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {mutationError.message || 'Failed to update video clip'}
            </Alert>
          )}
          {isSubmitSuccessful && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Video clip updated successfully!
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={updating || isSubmitting}
            sx={{ mt: 3, mb: 2 }}
          >
            {updating || isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Save Changes'
            )}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate(`/clip/${id}`)}
            disabled={updating || isSubmitting}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
