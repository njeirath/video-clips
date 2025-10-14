import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import { useQuery } from '@apollo/client/react';
import { graphql } from '../gql/gql';

const GET_VIDEO_CLIPS = graphql(`
  query GetVideoClips {
    videoClips {
      id
      name
      description
      userId
      userEmail
      createdAt
    }
  }
`);

const ITEMS_PER_PAGE = 12;

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const observerTarget = useRef<HTMLDivElement>(null);

  const { data, loading, error } = useQuery(GET_VIDEO_CLIPS, {
    fetchPolicy: 'cache-and-network',
  });

  // Filter video clips based on search query
  const filteredClips = useMemo(() => {
    if (!data?.videoClips) return [];
    
    const query = searchQuery.toLowerCase().trim();
    if (!query) return data.videoClips;

    return data.videoClips.filter(clip => 
      clip.name.toLowerCase().includes(query) ||
      clip.description.toLowerCase().includes(query)
    );
  }, [data?.videoClips, searchQuery]);

  // Get clips to display based on pagination
  const displayedClips = useMemo(() => {
    return filteredClips.slice(0, displayCount);
  }, [filteredClips, displayCount]);

  const hasMore = displayedClips.length < filteredClips.length;

  // Infinite scroll implementation
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore) {
      setDisplayCount(prev => prev + ITEMS_PER_PAGE);
    }
  }, [hasMore]);

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver]);

  // Reset display count when search query changes
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [searchQuery]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sticky search bar */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          py: 2,
          boxShadow: 1,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h4" gutterBottom align="center" sx={{ mb: 2 }}>
            Video Clips
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search video clips by name or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              maxWidth: 600,
              mx: 'auto',
              display: 'block',
            }}
          />
        </Container>
      </Box>

      {/* Video clips list */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {loading && displayedClips.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load video clips. Please try again later.
          </Alert>
        )}

        {!loading && displayedClips.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              {searchQuery
                ? `No video clips found matching "${searchQuery}"`
                : 'No video clips available yet'}
            </Typography>
          </Box>
        )}

        {displayedClips.length > 0 && (
          <Grid container spacing={3}>
            {displayedClips.map((clip) => (
              <Grid item xs={12} sm={6} md={4} key={clip.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {clip.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {clip.description}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ display: 'block', mt: 2 }}
                    >
                      Added: {new Date(clip.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Infinite scroll trigger */}
        {hasMore && (
          <Box 
            ref={observerTarget}
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              py: 4 
            }}
          >
            <CircularProgress size={32} />
          </Box>
        )}
      </Container>
    </Box>
  );
}