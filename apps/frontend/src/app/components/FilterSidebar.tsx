import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type FilterItem = {
  name: string;
  count: number;
};

type FilterSidebarProps = {
  availableShows: FilterItem[];
  availableCharacters: FilterItem[];
  filterShow: string;
  filterCharacter: string;
  onShowFilterChange: (show: string) => void;
  onCharacterFilterChange: (character: string) => void;
};

export function FilterSidebar({
  availableShows,
  availableCharacters,
  filterShow,
  filterCharacter,
  onShowFilterChange,
  onCharacterFilterChange,
}: FilterSidebarProps) {
  const renderFilterItem = (
    item: FilterItem,
    isSelected: boolean,
    onClick: () => void
  ) => (
    <Box
      key={item.name}
      onClick={onClick}
      sx={{
        px: 2,
        py: 1.5,
        mb: 0.5,
        borderRadius: '8px',
        cursor: 'pointer',
        bgcolor: isSelected ? 'rgba(59, 157, 214, 0.15)' : 'transparent',
        color: isSelected ? '#3b9dd6' : '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        '&:hover': {
          bgcolor: isSelected ? 'rgba(59, 157, 214, 0.15)' : 'rgba(255, 255, 255, 0.05)',
        },
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 400 }}>
        {item.name}
      </Typography>
      <Typography variant="body2" sx={{ color: '#9ca3af' }}>
        {item.count}
      </Typography>
    </Box>
  );

  const totalShowsCount = availableShows.reduce((sum, show) => sum + show.count, 0);
  const totalCharactersCount = availableCharacters.reduce((sum, char) => sum + char.count, 0);

  return (
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
          {renderFilterItem(
            { name: 'All Shows', count: totalShowsCount },
            filterShow === 'all',
            () => onShowFilterChange('all')
          )}
          {availableShows.map((show) => 
            renderFilterItem(
              show,
              filterShow === show.name,
              () => onShowFilterChange(show.name)
            )
          )}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: '#9ca3af', px: 1 }}>
          No shows available
        </Typography>
      )}

      {/* Characters Filter Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ color: '#fff', mb: 2, px: 1 }}>
          Characters
        </Typography>
        
        {availableCharacters.length > 0 ? (
          <Box>
            {renderFilterItem(
              { name: 'All Characters', count: totalCharactersCount },
              filterCharacter === 'all',
              () => onCharacterFilterChange('all')
            )}
            {availableCharacters.map((character) =>
              renderFilterItem(
                character,
                filterCharacter === character.name,
                () => onCharacterFilterChange(character.name)
              )
            )}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: '#9ca3af', px: 1 }}>
            No characters available
          </Typography>
        )}
      </Box>
    </Box>
  );
}
