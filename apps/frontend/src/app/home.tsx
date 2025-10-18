
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
import ShareIcon from '@mui/icons-material/Share';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useQuery } from '@apollo/client/react';
import { graphql } from '../gql/gql';
import { useNavigate } from 'react-router-dom';


// VideoClipPlayer component: only loads video when play is clicked
type VideoClipPlayerProps = {
  clip: {
    id: string;
    name: string;
    description?: string;
    videoUrl: string;
    shareUrl?: string;
    createdAt: string;
    // Optionally add thumbnailUrl if available in your backend
    thumbnailUrl?: string;
  };
};

function VideoClipPlayer({ clip }: VideoClipPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(() => {
      videoRef.current?.play();
    }, 0);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (clip.shareUrl) {
      try {
        await navigator.clipboard.writeText(clip.shareUrl);
        setCopySuccess(true);
      } catch (err) {
        console.error('Failed to copy share URL:', err);
      }
    }
  };

  const handleCloseSnackbar = () => {
    setCopySuccess(false);
  };

  const handleCardClick = () => {
    navigate(`/clip/${clip.id}`);
  };

  // fallback thumbnail (optional): use a static image or color if not present
  const poster = clip.thumbnailUrl || undefined;
  const hasVideo = !!clip.videoUrl;
  return (
    <div style={{ flex: '1 0 30%', minWidth: 300, maxWidth: 400 }}>
      <Card
        onClick={handleCardClick}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s, box-shadow 0.2s',
          minHeight: 200,
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ flex: 1 }}>
              {clip.name}
            </Typography>
            {clip.shareUrl && (
              <Tooltip title="Copy share link">
                <IconButton onClick={handleShare} size="small" color="primary">
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {clip.description}
          </Typography>
          {hasVideo ? (
            isPlaying ? (
              <Box sx={{ mt: 2 }}>
                <video
                  ref={videoRef}
                  controls
                  style={{ width: '100%', maxHeight: 200, borderRadius: 4 }}
                  src={clip.videoUrl}
                  poster={poster}
                  autoPlay
                >
                  Your browser does not support the video tag.
                </video>
              </Box>
            ) : (
              <Box sx={{ mt: 2, position: 'relative', width: '100%', maxHeight: 200, background: '#000', borderRadius: 4, overflow: 'hidden' }}>
                {poster ? (
                  <img
                    src={poster}
                    alt={clip.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: 200, background: '#222' }} />
                )}
                <button
                  onClick={handlePlay}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: 32,
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 64,
                    height: 64,
                    cursor: 'pointer',
                  }}
                  aria-label={`Play ${clip.name}`}
                >
                  ▶
                </button>
              </Box>
            )
          ) : (
            <Box sx={{ mt: 2, width: '100%', height: 200, background: '#eee', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">No video available</Typography>
            </Box>
          )}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 2 }}
          >
            Added: {new Date(clip.createdAt).toLocaleDateString()}
          </Typography>
        </CardContent>
      </Card>
      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message="Share link copied to clipboard!"
      />
    </div>
  );
}

const GET_VIDEO_CLIPS = graphql(`
  query GetVideoClips($searchQuery: String, $offset: Int, $limit: Int, $sortBy: String, $filterShow: String) {
    videoClips(searchQuery: $searchQuery, offset: $offset, limit: $limit, sortBy: $sortBy, filterShow: $filterShow) {
      id
      name
      description
      userId
      userEmail
      videoUrl
      shareUrl
      thumbnailUrl
      createdAt
      source {
        ... on ShowSource {
          title
          season
          episode
        }
        ... on MovieSource {
          title
        }
      }
    }
  }
`);

const ITEMS_PER_PAGE = 12;
const DEBOUNCE_DELAY = 500; // 500ms debounce

type SortOption = 'createdAt' | 'name';

export default function Home() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [allClips, setAllClips] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [filterShow, setFilterShow] = useState<string>('all');
  const observerTarget = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const { data, loading, error, fetchMore } = useQuery(GET_VIDEO_CLIPS, {
    variables: {
      searchQuery: debouncedSearch || undefined,
      offset: 0,
      limit: ITEMS_PER_PAGE,
      sortBy: sortBy,
      filterShow: filterShow !== 'all' ? filterShow : undefined,
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

  // Reset when sort or filter changes
  useEffect(() => {
    setOffset(0);
    setAllClips([]);
  }, [sortBy, filterShow]);

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
          sortBy: sortBy,
          filterShow: filterShow !== 'all' ? filterShow : undefined,
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
  }, [hasMore, loading, fetchMore, debouncedSearch, offset, sortBy, filterShow]);

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

  // Extract unique show titles from all clips
  const availableShows = useMemo(() => {
    const showSet = new Set<string>();
    allClips.forEach((clip) => {
      if (clip.source && clip.source.__typename === 'ShowSource') {
        showSet.add(clip.source.title);
      }
    });
    return Array.from(showSet).sort();
  }, [allClips]);

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
              mb: 2,
            }}
          />
          
          {/* Sorting and Filtering Controls */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel id="sort-label">Sort By</InputLabel>
              <Select
                labelId="sort-label"
                id="sort-select"
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <MenuItem value="createdAt">Date Added (Newest First)</MenuItem>
                <MenuItem value="name">Name (A-Z)</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel id="filter-label">Filter by Show</InputLabel>
              <Select
                labelId="filter-label"
                id="filter-select"
                value={filterShow}
                label="Filter by Show"
                onChange={(e) => setFilterShow(e.target.value)}
              >
                <MenuItem value="all">All Shows</MenuItem>
                {availableShows.map((show) => (
                  <MenuItem key={show} value={show}>
                    {show}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
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
              {searchInput || filterShow !== 'all'
                ? 'No video clips match the selected filters'
                : 'No video clips available yet'}
            </Typography>
          </Box>
        )}

        {allClips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {allClips.map((clip) => (
              <VideoClipPlayer key={clip.id} clip={clip} />
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