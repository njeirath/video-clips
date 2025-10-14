import { useState, useCallback, useRef, useEffect } from 'react';
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
  query GetVideoClips($searchQuery: String, $offset: Int, $limit: Int) {
    videoClips(searchQuery: $searchQuery, offset: $offset, limit: $limit) {
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
const DEBOUNCE_DELAY = 500; // 500ms debounce

export default function Home() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [allClips, setAllClips] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const { data, loading, error, fetchMore } = useQuery(GET_VIDEO_CLIPS, {
    variables: {
      searchQuery: debouncedSearch || undefined,
      offset: 0,
      limit: ITEMS_PER_PAGE,
    },
    fetchPolicy: 'cache-and-network',
  });

  // Ensure allClips is updated if data.videoClips changes (e.g., after cache update)
  useEffect(() => {
    if (data && Array.isArray(data.videoClips)) {
      setAllClips(data.videoClips);
      setOffset(data.videoClips.length);
      setHasMore(data.videoClips.length >= ITEMS_PER_PAGE);
    }
  }, [data]);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setOffset(0);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchInput]);

  // Load more clips when scrolling
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    try {
      const result = await fetchMore({
        variables: {
          searchQuery: debouncedSearch || undefined,
          offset: offset,
          limit: ITEMS_PER_PAGE,
        },
      });

      if (result.data?.videoClips) {
        const newClips = result.data.videoClips;
        setAllClips((prev) => [...prev, ...newClips]);
        setOffset((prev) => prev + newClips.length);
        setHasMore(newClips.length >= ITEMS_PER_PAGE);
      }
    } catch (err) {
      console.error('Error loading more clips:', err);
    }
  }, [hasMore, loading, fetchMore, debouncedSearch, offset]);

  // Infinite scroll implementation
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading) {
        loadMore();
      }
    },
    [hasMore, loading, loadMore]
  );

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
          py: 3,
          boxShadow: 1,
        }}
      >
        <Container maxWidth="lg">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search video clips by name or keywords..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
        {loading && allClips.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load video clips. Please try again later.
          </Alert>
        )}

        {!loading && allClips.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              {searchInput
                ? `No video clips found matching "${searchInput}"`
                : 'No video clips available yet'}
            </Typography>
          </Box>
        )}

        {allClips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {allClips.map((clip) => (
              <div style={{ flex: '1 0 30%', minWidth: 300, maxWidth: 400 }} key={clip.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    minHeight: 200,
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
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        {hasMore && allClips.length > 0 && (
          <Box
            ref={observerTarget}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              py: 4,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        )}
      </Container>
    </Box>
  );
}