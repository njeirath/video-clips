import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import FilterListIcon from '@mui/icons-material/FilterList';

type SortOption = 'createdAt' | 'name';

type ClipsHeaderProps = {
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  isMobile?: boolean;
  onFilterClick?: () => void;
};

export function ClipsHeader({ sortBy, onSortChange, isMobile, onFilterClick }: ClipsHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: { xs: 2, md: 4 },
        py: { xs: 2, md: 3 },
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isMobile && onFilterClick && (
          <IconButton 
            onClick={onFilterClick}
            sx={{ 
              color: '#fff',
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <FilterListIcon />
          </IconButton>
        )}
        <Typography 
          variant="h4" 
          sx={{ 
            color: '#fff', 
            fontWeight: 600,
            fontSize: { xs: '1.5rem', md: '2.125rem' }
          }}
        >
          Explore Clips
        </Typography>
      </Box>
      
      <FormControl sx={{ minWidth: { xs: 140, md: 200 } }} size="small">
        <InputLabel id="sort-label">Sort by</InputLabel>
        <Select
          labelId="sort-label"
          id="sort-select"
          value={sortBy}
          label="Sort by"
          onChange={(e) => onSortChange(e.target.value as SortOption)}
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
  );
}
