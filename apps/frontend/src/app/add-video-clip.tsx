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
  } = useForm<VideoClipFormData>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

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

  // Redirect after successful submission
  useEffect(() => {
    if (isSubmitSuccessful) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitSuccessful, navigate]);

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

      // Create video clip with metadata
      await createVideoClip({
        variables: {
          input: {
            name: data.name.trim(),
            description: data.description.trim(),
            s3Key,
            videoUrl,
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
    <Container component="main" maxWidth="xs">
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
            rules={{
              required: 'Description is required',
              validate: (value) => value.trim().length > 0 || 'Description cannot be empty',
            }}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                required
                fullWidth
                id="description"
                label="Description"
                multiline
                rows={4}
                disabled={loading || isSubmitting || uploading}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            )}
          />

          {/* File Upload Section */}
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
