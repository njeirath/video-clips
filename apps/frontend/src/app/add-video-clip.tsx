import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { useMutation } from '@apollo/client/react';
import { graphql } from '../gql/gql';
import { getCurrentUser } from 'aws-amplify/auth';

const CREATE_VIDEO_CLIP = graphql(`
  mutation CreateVideoClip($input: CreateVideoClipInput!) {
    createVideoClip(input: $input) {
      id
      name
      description
      userId
      createdAt
    }
  }
`);

const GENERATE_UPLOAD_URL = graphql(`
  mutation GenerateUploadUrl($fileName: String!, $contentType: String!) {
    generateUploadUrl(fileName: $fileName, contentType: $contentType) {
      uploadUrl
      s3Key
      videoUrl
    }
  }
`);

interface VideoClipFormData {
  name: string;
  description: string;
  videoFile?: File;
  script?: string;
  duration?: number;
  characters?: string;
  tags?: string;
  thumbnailUrl?: string;
  blurhash?: string;
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

export default function AddVideoClip() {
  const navigate = useNavigate();
  const [createVideoClip, { loading, error: mutationError }] = useMutation(CREATE_VIDEO_CLIP);
  const [generateUploadUrl] = useMutation(GENERATE_UPLOAD_URL);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
    setValue,
    watch,
  } = useForm<VideoClipFormData>({
    defaultValues: {
      name: '',
      description: '',
      script: '',
      duration: undefined,
      characters: '',
      tags: '',
      thumbnailUrl: '',
      blurhash: '',
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
      } catch {
        // User not authenticated, redirect to sign in
        navigate('/signin', { state: { from: '/add-clip' } });
      }
    }
    checkAuth();
  }, [navigate]);

  // Redirect after successful submission (only if no error)
  useEffect(() => {
    if (isSubmitSuccessful && !mutationError) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitSuccessful, mutationError, navigate]);

  const onSubmit = async (data: VideoClipFormData) => {
    try {
      setUploadError(null);
      let s3Key: string | undefined;
      let videoUrl: string | undefined;

      // Upload video file if selected
      if (selectedFile) {
        setUploading(true);
        setUploadProgress(0);

        try {
          // Get presigned URL from backend
          const { data: urlData } = await generateUploadUrl({
            variables: {
              fileName: selectedFile.name,
              contentType: selectedFile.type,
            },
          });

          if (!urlData?.generateUploadUrl) {
            throw new Error('Failed to get upload URL');
          }

          const { uploadUrl, s3Key: key, videoUrl: url } = urlData.generateUploadUrl;
          s3Key = key;
          videoUrl = url;

          // Upload file directly to S3 using presigned URL
          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: selectedFile,
            headers: {
              'Content-Type': selectedFile.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed with status: ${uploadResponse.status}`);
          }

          setUploadProgress(100);
        } catch (err) {
          console.error('Failed to upload video:', err);
          setUploadError(err instanceof Error ? err.message : 'Failed to upload video');
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      // Parse characters and tags from comma-separated strings
      const characters = data.characters?.trim() 
        ? data.characters.split(',').map(a => a.trim()).filter(a => a.length > 0)
        : undefined;
      
      const tags = data.tags?.trim()
        ? data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : undefined;

      // Build source object based on sourceType
      let source = undefined;
      if (data.sourceType === 'show' && data.showTitle?.trim()) {
        source = {
          show: {
            title: data.showTitle.trim(),
            airDate: data.showAirDate?.trim() || undefined,
            season: data.showSeason || undefined,
            episode: data.showEpisode || undefined,
            start: data.showStart || undefined,
            end: data.showEnd || undefined,
          },
        };
      } else if (data.sourceType === 'movie' && data.movieTitle?.trim()) {
        source = {
          movie: {
            title: data.movieTitle.trim(),
            releaseDate: data.movieReleaseDate?.trim() || undefined,
            start: data.movieStart || undefined,
            end: data.movieEnd || undefined,
          },
        };
      }

      // Create video clip with metadata
      await createVideoClip({
        variables: {
          input: {
            name: data.name.trim(),
            description: data.description?.trim() || undefined,
            s3Key,
            videoUrl,
            script: data.script?.trim() || undefined,
            duration: data.duration || undefined,
            characters,
            tags,
            thumbnailUrl: data.thumbnailUrl?.trim() || undefined,
            blurhash: data.blurhash?.trim() || undefined,
            source,
          },
        },
      });
      reset();
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (err) {
      // Error handled by Apollo Client
      console.error('Failed to create video clip:', err);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Invalid file type. Please select a valid video file (MP4, MOV, AVI, MKV, or WebM).');
        return;
      }

      // Validate file size (max 500MB)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        setUploadError('File is too large. Maximum file size is 500MB.');
        return;
      }

      setSelectedFile(file);
      setUploadError(null);
      setValue('videoFile', file);
    }
  };

  return (
    <Container component="main" maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          marginTop: { xs: 4, md: 8 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <VideoLibraryIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Add Video Clip
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
          <Controller
            name="name"
            control={control}
            rules={{
              required: 'Video clip name is required',
              validate: (value) => value.trim().length > 0 || 'Video clip name cannot be empty',
            }}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                required
                fullWidth
                id="name"
                label="Video Clip Name"
                autoFocus
                disabled={loading || isSubmitting || uploading}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />
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
                disabled={loading || isSubmitting || uploading}
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
                disabled={loading || isSubmitting || uploading}
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
                disabled={loading || isSubmitting || uploading}
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
                disabled={loading || isSubmitting || uploading}
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
                disabled={loading || isSubmitting || uploading}
                helperText="Comma-separated tags for categorization"
              />
            )}
          />

          {/* Thumbnail URL Field */}
          <Controller
            name="thumbnailUrl"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                fullWidth
                id="thumbnailUrl"
                label="Thumbnail URL"
                placeholder="e.g., https://cdn.example.com/previews/clip-123.jpg"
                disabled={loading || isSubmitting || uploading}
                helperText="URL to a preview image for the video clip"
              />
            )}
          />

          {/* BlurHash Field */}
          <Controller
            name="blurhash"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                fullWidth
                id="blurhash"
                label="BlurHash"
                placeholder="e.g., U1F5E9kCj@ay~qj[ayj[ayj[ayj["
                disabled={loading || isSubmitting || uploading}
                helperText="Compact representation of thumbnail for fast placeholder rendering"
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
                  disabled={loading || isSubmitting || uploading}
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
                    disabled={loading || isSubmitting || uploading}
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
                    disabled={loading || isSubmitting || uploading}
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
                      disabled={loading || isSubmitting || uploading}
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
                      disabled={loading || isSubmitting || uploading}
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
                      disabled={loading || isSubmitting || uploading}
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
                      disabled={loading || isSubmitting || uploading}
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
                    disabled={loading || isSubmitting || uploading}
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
                    disabled={loading || isSubmitting || uploading}
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
                      disabled={loading || isSubmitting || uploading}
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
                      disabled={loading || isSubmitting || uploading}
                      inputProps={{ step: 0.1, min: 0 }}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  )}
                />
              </Box>
            </Box>
          )}

          {/* File Upload Section */}
          <Divider sx={{ mt: 4, mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Video File
            </Typography>
          </Divider>
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Video File (Optional)
            </Typography>
            <input
              accept="video/*"
              style={{ display: 'none' }}
              id="video-file-input"
              type="file"
              onChange={handleFileSelect}
              disabled={loading || isSubmitting || uploading}
            />
            <label htmlFor="video-file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                disabled={loading || isSubmitting || uploading}
                fullWidth
                sx={{ mb: 1 }}
              >
                {selectedFile ? 'Change Video File' : 'Select Video File'}
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}
            {uploading && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Uploading video... {uploadProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}
          </Box>

          {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {uploadError}
            </Alert>
          )}
          {mutationError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {mutationError.message || 'Failed to add video clip'}
            </Alert>
          )}
          {isSubmitSuccessful && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Video clip added successfully!
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading || isSubmitting || uploading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading || isSubmitting || uploading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Add Video Clip'
            )}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/')}
            disabled={loading || isSubmitting || uploading}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
