
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useSearch } from './SearchContext';
import Box from '@mui/material/Box';
import { useQuery } from '@apollo/client/react';
import { graphql } from '../gql/gql';
import { FilterSidebar } from './components/FilterSidebar';
import { ClipsHeader } from './components/ClipsHeader';
import { ClipsGrid } from './components/ClipsGrid';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import FilterListIcon from '@mui/icons-material/FilterList';

const GET_VIDEO_CLIPS = graphql(`
  query GetVideoClips($filter: VideoClipFilter, $offset: Int, $limit: Int, $sortBy: String) {
    videoClips(filter: $filter, offset: $offset, limit: $limit, sortBy: $sortBy) {
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

const GET_AVAILABLE_FILTERS = graphql(`
  query GetAvailableFilters($filter: VideoClipFilter) {
    availableFilters(filter: $filter) {
      shows {
        name
        count
      }
      characters {
        name
        count
      }
    }
  }
`);

const ITEMS_PER_PAGE = 12;
const DEBOUNCE_DELAY = 500; // 500ms debounce

type SortOption = 'createdAt' | 'name';

export default function Home() {
  const { searchInput, setSearchInput } = useSearch();
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(offset);
  const [allClips, setAllClips] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [filterShow, setFilterShow] = useState<string>('all');
  const [filterCharacter, setFilterCharacter] = useState<string>('all');
  const observerTarget = useRef<HTMLDivElement>(null);
  // guard to prevent concurrent fetchMore calls which were causing duplicate API requests
  const isFetchingMoreRef = useRef(false);
  // dedupe requests by offset to avoid making duplicate fetches for the same page
  const lastRequestedOffsetRef = useRef<number | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Mobile drawer state
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, loading, error, fetchMore, refetch } = useQuery(GET_VIDEO_CLIPS, {
    variables: {
      filter: {
        searchQuery: debouncedSearch || undefined,
        filterShow: filterShow !== 'all' ? filterShow : undefined,
        filterCharacter: filterCharacter !== 'all' ? filterCharacter : undefined,
      },
      offset: 0,
      limit: ITEMS_PER_PAGE,
      sortBy: sortBy,
    },
    fetchPolicy: 'cache-and-network',
  });

  // Fetch available filters (shows and characters) from backend
  const { data: filtersData } = useQuery(GET_AVAILABLE_FILTERS, {
    variables: {
      filter: {
        filterShow: filterShow !== 'all' ? filterShow : undefined,
        filterCharacter: filterCharacter !== 'all' ? filterCharacter : undefined,
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  const availableShows = useMemo(() => {
    return filtersData?.availableFilters?.shows || [];
  }, [filtersData]);

  const availableCharacters = useMemo(() => {
    return filtersData?.availableFilters?.characters || [];
  }, [filtersData]);

  // Ensure allClips is updated if data.videoClips changes (e.g., after cache update)
  useEffect(() => {
    if (data && Array.isArray(data.videoClips)) {
      setAllClips(data.videoClips);
      setOffset(data.videoClips.length);
      offsetRef.current = data.videoClips.length;
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
      filter: {
        searchQuery: debouncedSearch || undefined,
        filterShow: filterShow !== 'all' ? filterShow : undefined,
        filterCharacter: filterCharacter !== 'all' ? filterCharacter : undefined,
      },
      offset: 0,
      limit: ITEMS_PER_PAGE,
      sortBy: sortBy,
    }).then((result: any) => {
      if (result?.data?.videoClips) {
        setAllClips(result.data.videoClips);
        setOffset(result.data.videoClips.length);
        offsetRef.current = result.data.videoClips.length;
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
  }, [sortBy, filterShow, filterCharacter, refetch, debouncedSearch]);

  // Debounce search input (shared from header)
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setOffset(0);
      offsetRef.current = 0;
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
    // Prevent concurrent loadMore execution
    if (isFetchingMoreRef.current) return;

    // compute the offset to request from the ref to avoid races
    const requestOffset = offsetRef.current;

    // If we've already requested this offset, skip to avoid duplicate API calls
    if (lastRequestedOffsetRef.current === requestOffset) return;

    isFetchingMoreRef.current = true;
    lastRequestedOffsetRef.current = requestOffset;

    try {
      const result = await fetchMore({
        variables: {
          filter: {
            searchQuery: debouncedSearch || undefined,
            filterShow: filterShow !== 'all' ? filterShow : undefined,
            filterCharacter: filterCharacter !== 'all' ? filterCharacter : undefined,
          },
          offset: requestOffset,
          limit: ITEMS_PER_PAGE,
          sortBy: sortBy,
        },
      });

      if (result.data?.videoClips) {
        const newClips = result.data.videoClips;
        setAllClips((prev) => [...prev, ...newClips]);
        setOffset((prev) => {
          const next = prev + newClips.length;
          offsetRef.current = next;
          return next;
        });
        setHasMore(newClips.length >= ITEMS_PER_PAGE);
      }
    } catch (err) {
      console.error('Error loading more clips:', err);
    }
    finally {
      isFetchingMoreRef.current = false;
      // clear the last requested offset so subsequent scrolls can request it again if needed
      lastRequestedOffsetRef.current = null;
    }
  }, [hasMore, loading, fetchMore, debouncedSearch, offset, sortBy, filterShow, filterCharacter]);

  // refs to avoid stale closures in the observer callback
  const loadMoreRef = useRef(loadMore);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);

  // keep refs in sync with latest values so the observer can use them without recreating
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Create an observer that calls the latest loadMore via refs. This effect runs when
  // the target element mounts/unmounts (observerTarget.current changes).
  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observerRefInternal = { current: null as IntersectionObserver | null };

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (!entry.isIntersecting) return;
      if (!hasMoreRef.current) return;
      if (loadingRef.current) return;

      // Unobserve immediately so we don't get another intersection while fetching
      try {
        observer.unobserve(element);
      } catch (e) {
        // ignore
      }

      // Call loadMore and when finished, re-observe if there is still more to load
      (async () => {
        try {
          await loadMoreRef.current();
        } catch (e) {
          // swallow: loadMore logs errors
        }

        if (hasMoreRef.current) {
          try {
            observer.observe(element);
          } catch (e) {
            // ignore
          }
        }
      })();
    }, { threshold: 0.1 });

    observerRefInternal.current = observer;
    observer.observe(element);

    return () => {
      try {
        observer.unobserve(element);
      } catch (e) {
        // ignore
      }
      try {
        observer.disconnect();
      } catch (e) {
        // ignore
      }
      observerRefInternal.current = null;
    };
    // Intentionally depend on the element ref value so we re-run when the target mounts
  }, [observerTarget.current]);

  // Infinite scroll implementation
  // Infinite scroll implementation will create an observer later that uses stable refs

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Left Sidebar - Desktop only */}
      {!isMobile && (
        <FilterSidebar
          availableShows={availableShows}
          availableCharacters={availableCharacters}
          filterShow={filterShow}
          filterCharacter={filterCharacter}
          onShowFilterChange={setFilterShow}
          onCharacterFilterChange={setFilterCharacter}
        />
      )}

      {/* Mobile Drawer for Filters */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <FilterSidebar
            availableShows={availableShows}
            availableCharacters={availableCharacters}
            filterShow={filterShow}
            filterCharacter={filterCharacter}
            onShowFilterChange={(show) => {
              setFilterShow(show);
              setDrawerOpen(false);
            }}
            onCharacterFilterChange={(character) => {
              setFilterCharacter(character);
              setDrawerOpen(false);
            }}
          />
        </Drawer>
      )}

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header with Title and Sort */}
        <ClipsHeader 
          sortBy={sortBy} 
          onSortChange={setSortBy}
          isMobile={isMobile}
          onFilterClick={() => setDrawerOpen(true)}
        />

        {/* Video clips grid */}
        <ClipsGrid
          clips={allClips}
          loading={loading}
          error={error}
          hasMore={hasMore}
          searchInput={searchInput}
          filterShow={filterShow}
          filterCharacter={filterCharacter}
          observerTarget={observerTarget}
        />
      </Box>
    </Box>
  );
}