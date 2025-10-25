import React, { createContext, useContext, useState } from 'react';

type SearchContextType = {
  searchInput: string;
  setSearchInput: (v: string) => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchInput, setSearchInput] = useState('');
  return (
    <SearchContext.Provider value={{ searchInput, setSearchInput }}>
      {children}
    </SearchContext.Provider>
  );
};

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}

export default SearchProvider;
