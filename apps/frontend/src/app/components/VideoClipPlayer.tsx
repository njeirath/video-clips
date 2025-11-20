import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import ShareIcon from '@mui/icons-material/Share';
import { BlurhashImage } from './BlurhashImage';
import { VideoClip } from './types';

type VideoClipPlayerProps = {
  clip: VideoClip;
};

export function VideoClipPlayer({ clip }: VideoClipPlayerProps) {
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
        width: '100%',
        maxWidth: 280,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        bgcolor: '#2a3544',
        borderRadius: '12px',
        overflow: 'hidden',
        mx: { xs: 'auto', sm: 0 },
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
