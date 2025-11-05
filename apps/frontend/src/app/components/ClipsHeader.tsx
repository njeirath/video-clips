import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

type SortOption = 'createdAt' | 'name';

type ClipsHeaderProps = {
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
};

export function ClipsHeader({ sortBy, onSortChange }: ClipsHeaderProps) {
  return (
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
