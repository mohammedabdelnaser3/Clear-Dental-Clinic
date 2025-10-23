import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../services/searchService';
import type { SearchResult } from '../services/searchService';
import { useDebounce } from './useDebounce';

interface UseSearchOptions {
  minQueryLength?: number;
  debounceMs?: number;
  maxRecentSearches?: number;
}

export const useSearch = (options: UseSearchOptions = {}) => {
  const {
    minQueryLength = 2,
    debounceMs = 300,
    maxRecentSearches = 5
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, debounceMs);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches', e);
        localStorage.removeItem('recentSearches');
      }
    }
  }, []);

  // Save recent searches to localStorage when they change
  useEffect(() => {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Fetch search results when debounced query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery || debouncedQuery.length < minQueryLength) {
        setResults([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await searchService.globalSearch(debouncedQuery);
        
        if (response.success) {
          setResults(response.data || []);
        } else {
          setError(response.message || 'Search failed');
          setResults([]);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to perform search');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery, minQueryLength]);

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add search to recent searches
  const addToRecentSearches = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item !== searchQuery);
      return [searchQuery, ...filtered].slice(0, maxRecentSearches);
    });
  }, [maxRecentSearches]);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  }, []);

  // Handle search submission
  const handleSearch = useCallback((searchQuery: string = query) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;
    
    addToRecentSearches(trimmedQuery);
    setShowResults(false);
    navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  }, [query, addToRecentSearches, navigate]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Arrow down to focus on first result
    if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      const firstResult = document.querySelector('[data-search-result]') as HTMLElement;
      firstResult?.focus();
    }
  }, [results.length]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    recentSearches,
    showResults,
    setShowResults,
    handleSearch,
    addToRecentSearches,
    clearRecentSearches,
    searchRef,
    handleKeyDown
  };
};