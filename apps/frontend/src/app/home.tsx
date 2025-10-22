
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
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
import { useNavigate, Link } from 'react-router-dom';
import { BlurhashImage } from './components/BlurhashImage';


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
    blurhash?: string;
  };
};

function VideoClipPlayer({ clip }: VideoClipPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  const handlePlay = (e?: React.MouseEvent) => {
    // prevent the click from bubbling up to the Card which would navigate
    e?.stopPropagation();
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
    <Card
      onClick={handleCardClick}
      sx={{
        width: 280,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        bgcolor: '#2a3544',
        borderRadius: '12px',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      {/* Video/Thumbnail Area */}
      {hasVideo ? (
        isPlaying ? (
          <Box>
            <video
              ref={videoRef}
              controls
              style={{ width: '100%', height: 200, objectFit: 'cover' }}
              src={clip.videoUrl}
              poster={poster}
              autoPlay
              onClick={(e) => e.stopPropagation()}
            >
              Your browser does not support the video tag.
            </video>
          </Box>
        ) : (
          <Box
            sx={{ 
              position: 'relative', 
              width: '100%', 
              height: 200, 
              background: '#1a2332',
              overflow: 'hidden' 
            }}
            onClick={(e) => handlePlay(e)}
          >
            {poster ? (
              <BlurhashImage
                src={poster}
                blurhash={clip.blurhash}
                alt={clip.name}
                height={200}
                style={{ objectFit: 'cover', width: '100%' }}
              />
            ) : (
              <div style={{ width: '100%', height: 200, background: '#1a2332' }} />
            )}
            <button
              onClick={(e) => handlePlay(e)}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 32,
                background: 'rgba(0,0,0,0.6)',
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
        <Box sx={{ width: '100%', height: 200, background: '#1a2332', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">No video available</Typography>
        </Box>
      )}

      {/* Card Content */}
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography 
          variant="h6" 
          component="h2" 
          sx={{ 
            fontSize: '1rem',
            fontWeight: 600,
            mb: 1,
            color: '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            wordWrap: 'break-word',
            lineHeight: 1.4,
          }}
        >
          {clip.name}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#9ca3af',
            fontSize: '0.875rem',
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {clip.description}
        </Typography>
        
        {/* Share Button */}
        {clip.shareUrl && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              onClick={handleShare} 
              size="small" 
              sx={{ 
                color: '#9ca3af',
                '&:hover': { 
                  color: '#3b9dd6',
                  bgcolor: 'rgba(59, 157, 214, 0.1)' 
                } 
              }}
            >
              <ShareIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption" sx={{ color: '#9ca3af' }}>
              Share
            </Typography>
          </Box>
        )}
      </CardContent>
      
      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message="Share link copied to clipboard!"
      />
    </Card>
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
      blurhash
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

const GET_AVAILABLE_SHOWS = graphql(`
  query GetAvailableShows {
    availableShows {
      name
      count
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

  const { data, loading, error, fetchMore, refetch } = useQuery(GET_VIDEO_CLIPS, {
    variables: {
      searchQuery: debouncedSearch || undefined,
      offset: 0,
      limit: ITEMS_PER_PAGE,
      sortBy: sortBy,
      filterShow: filterShow !== 'all' ? filterShow : undefined,
    },
    fetchPolicy: 'cache-and-network',
  });

  // Fetch available shows from backend
  const { data: showsData } = useQuery(GET_AVAILABLE_SHOWS, {
    fetchPolicy: 'cache-first',
  });

  const availableShows = useMemo(() => {
    return showsData?.availableShows || [];
  }, [showsData]);

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
    // Clear the list and reset offset
    setAllClips([]);
    setOffset(0);
    setHasMore(true);
    
    // trigger a refetch to get the newly-sorted/filtered data and update the list when it returns
    refetch({
      searchQuery: debouncedSearch || undefined,
      offset: 0,
      limit: ITEMS_PER_PAGE,
      sortBy: sortBy,
      filterShow: filterShow !== 'all' ? filterShow : undefined,
    }).then((result: any) => {
      if (result?.data?.videoClips) {
        setAllClips(result.data.videoClips);
        setOffset(result.data.videoClips.length);
        setHasMore(result.data.videoClips.length >= ITEMS_PER_PAGE);
      } else {
        // no data — clear the list
        setAllClips([]);
        setHasMore(false);
      }
    }).catch((err: any) => {
      console.error('Refetch error after sort/filter change:', err);
      // keep existing list in case of error
    });
  }, [sortBy, filterShow, refetch, debouncedSearch]);

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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Left Sidebar */}
      <Box
        sx={{
          width: 250,
          bgcolor: '#1a2332',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          py: 3,
          px: 2,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <Typography variant="h6" sx={{ color: '#fff', mb: 2, px: 1 }}>
          Shows
        </Typography>
        
        {availableShows.length > 0 ? (
          <Box>
            <Box
              onClick={() => setFilterShow('all')}
              sx={{
                px: 2,
                py: 1.5,
                mb: 0.5,
                borderRadius: '8px',
                cursor: 'pointer',
                bgcolor: filterShow === 'all' ? 'rgba(59, 157, 214, 0.15)' : 'transparent',
                color: filterShow === 'all' ? '#3b9dd6' : '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                '&:hover': {
                  bgcolor: filterShow === 'all' ? 'rgba(59, 157, 214, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: filterShow === 'all' ? 600 : 400 }}>
                All Shows
              </Typography>
              <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                {availableShows.reduce((sum, show) => sum + show.count, 0)}
              </Typography>
            </Box>
            {availableShows.map((show) => (
              <Box
                key={show.name}
                onClick={() => setFilterShow(show.name)}
                sx={{
                  px: 2,
                  py: 1.5,
                  mb: 0.5,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  bgcolor: filterShow === show.name ? 'rgba(59, 157, 214, 0.15)' : 'transparent',
                  color: filterShow === show.name ? '#3b9dd6' : '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  '&:hover': {
                    bgcolor: filterShow === show.name ? 'rgba(59, 157, 214, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: filterShow === show.name ? 600 : 400 }}>
                  {show.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                  {show.count}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: '#9ca3af', px: 1 }}>
            No shows available
          </Typography>
        )}
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header with Title and Sort */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 4,
            py: 3,
          }}
        >
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
            Explore Clips
          </Typography>
          
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel id="sort-label">Sort by</InputLabel>
            <Select
              labelId="sort-label"
              id="sort-select"
              value={sortBy}
              label="Sort by"
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              sx={{
                bgcolor: '#2a3544',
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
              }}
            >
              <MenuItem value="createdAt">Most Recent</MenuItem>
              <MenuItem value="name">Name (A-Z)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Video clips grid */}
        <Box sx={{ flex: 1, px: 4, pb: 4 }}>
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
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 280px))',
                gap: 3,
                justifyContent: 'start',
              }}
            >
              {allClips.map((clip) => (
                <VideoClipPlayer key={clip.id} clip={clip} />
              ))}
            </Box>
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
        </Box>
      </Box>
    </Box>
  );
}