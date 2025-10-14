import { useEffect } from 'react';
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
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
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

interface VideoClipFormData {
  name: string;
  description: string;
}

export default function AddVideoClip() {
  const navigate = useNavigate();
  const [createVideoClip, { loading, error: mutationError }] = useMutation(CREATE_VIDEO_CLIP);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
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
      await createVideoClip({
        variables: {
          input: {
            name: data.name.trim(),
            description: data.description.trim(),
          },
        },
      });
      reset();
    } catch (err) {
      // Error handled by Apollo Client
      console.error('Failed to create video clip:', err);
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
                disabled={loading || isSubmitting}
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
                disabled={loading || isSubmitting}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            )}
          />
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
            disabled={loading || isSubmitting}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading || isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Add Video Clip'
            )}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/')}
            disabled={loading || isSubmitting}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
