import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { FilterSidebar } from './FilterSidebar';

describe('FilterSidebar', () => {
  const mockShows = [
    { name: 'Show A', count: 5 },
    { name: 'Show B', count: 3 },
  ];

  const mockCharacters = [
    { name: 'Character 1', count: 2 },
    { name: 'Character 2', count: 4 },
  ];

  const mockOnShowFilterChange = vi.fn();
  const mockOnCharacterFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders shows section with all available shows', () => {
    render(
      <FilterSidebar
        availableShows={mockShows}
        availableCharacters={mockCharacters}
        filterShow="all"
        filterCharacter="all"
        onShowFilterChange={mockOnShowFilterChange}
        onCharacterFilterChange={mockOnCharacterFilterChange}
      />
    );

    expect(screen.getByText('Shows')).toBeInTheDocument();
    expect(screen.getByText('All Shows')).toBeInTheDocument();
    expect(screen.getByText('Show A')).toBeInTheDocument();
    expect(screen.getByText('Show B')).toBeInTheDocument();
  });

  it('renders characters section with all available characters', () => {
    render(
      <FilterSidebar
        availableShows={mockShows}
        availableCharacters={mockCharacters}
        filterShow="all"
        filterCharacter="all"
        onShowFilterChange={mockOnShowFilterChange}
        onCharacterFilterChange={mockOnCharacterFilterChange}
      />
    );

    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('All Characters')).toBeInTheDocument();
    expect(screen.getByText('Character 1')).toBeInTheDocument();
    expect(screen.getByText('Character 2')).toBeInTheDocument();
  });

  it('calls onShowFilterChange when a show is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FilterSidebar
        availableShows={mockShows}
        availableCharacters={mockCharacters}
        filterShow="all"
        filterCharacter="all"
        onShowFilterChange={mockOnShowFilterChange}
        onCharacterFilterChange={mockOnCharacterFilterChange}
      />
    );

    await user.click(screen.getByText('Show A'));
    expect(mockOnShowFilterChange).toHaveBeenCalledWith('Show A');
  });

  it('calls onCharacterFilterChange when a character is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FilterSidebar
        availableShows={mockShows}
        availableCharacters={mockCharacters}
        filterShow="all"
        filterCharacter="all"
        onShowFilterChange={mockOnShowFilterChange}
        onCharacterFilterChange={mockOnCharacterFilterChange}
      />
    );

    await user.click(screen.getByText('Character 1'));
    expect(mockOnCharacterFilterChange).toHaveBeenCalledWith('Character 1');
  });

  it('displays correct counts for shows and characters', () => {
    render(
      <FilterSidebar
        availableShows={mockShows}
        availableCharacters={mockCharacters}
        filterShow="all"
        filterCharacter="all"
        onShowFilterChange={mockOnShowFilterChange}
        onCharacterFilterChange={mockOnCharacterFilterChange}
      />
    );

    // Check show counts
    const showElements = screen.getAllByText('5');
    expect(showElements.length).toBeGreaterThan(0);
    
    const characterElements = screen.getAllByText('2');
    expect(characterElements.length).toBeGreaterThan(0);
  });

  it('displays "No shows available" when there are no shows', () => {
    render(
      <FilterSidebar
        availableShows={[]}
        availableCharacters={mockCharacters}
        filterShow="all"
        filterCharacter="all"
        onShowFilterChange={mockOnShowFilterChange}
        onCharacterFilterChange={mockOnCharacterFilterChange}
      />
    );

    expect(screen.getByText('No shows available')).toBeInTheDocument();
  });

  it('displays "No characters available" when there are no characters', () => {
    render(
      <FilterSidebar
        availableShows={mockShows}
        availableCharacters={[]}
        filterShow="all"
        filterCharacter="all"
        onShowFilterChange={mockOnShowFilterChange}
        onCharacterFilterChange={mockOnCharacterFilterChange}
      />
    );

    expect(screen.getByText('No characters available')).toBeInTheDocument();
  });
});
