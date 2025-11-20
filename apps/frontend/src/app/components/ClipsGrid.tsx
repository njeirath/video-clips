import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { VideoClipPlayer } from './VideoClipPlayer';
import { VideoClip } from './types';

type ClipsGridProps = {
  clips: VideoClip[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  searchInput: string;
  filterShow: string;
  filterCharacter: string;
  observerTarget: React.RefObject<HTMLDivElement>;
};

export function ClipsGrid({
  clips,
  loading,
  error,
  hasMore,
  searchInput,
  filterShow,
  filterCharacter,
  observerTarget,
}: ClipsGridProps) {
  return (
    <Box sx={{ flex: 1, px: { xs: 2, md: 4 }, pb: { xs: 2, md: 4 } }}>
      {loading && clips.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load video clips. Please try again later.
        </Alert>
      )}

      {!loading && clips.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {searchInput || filterShow !== 'all' || filterCharacter !== 'all'
              ? 'No video clips match the selected filters'
              : 'No video clips available yet'}
          </Typography>
        </Box>
      )}

      {clips.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fill, minmax(280px, 1fr))',
              md: 'repeat(auto-fill, minmax(280px, 280px))',
            },
            gap: { xs: 2, md: 3 },
            justifyContent: 'start',
          }}
        >
          {clips.map((clip) => (
            <VideoClipPlayer key={clip.id} clip={clip} />
          ))}
        </Box>
      )}

      {/* Infinite scroll trigger */}
      {hasMore && clips.length > 0 && (
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
  );
}
