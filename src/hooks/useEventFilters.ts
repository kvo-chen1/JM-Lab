import { useState, useCallback, useMemo } from 'react';
import { Event } from '@/types';

export type EventStatus = 'all' | 'upcoming' | 'ongoing' | 'completed';
export type EventCategory = 'all' | 'theme' | 'collaboration' | 'competition' | 'workshop' | 'exhibition';
export type EventType = 'all' | 'online' | 'offline';
export type SortOption = 'latest' | 'upcoming' | 'popular' | 'participants';

export interface FilterState {
  status: EventStatus;
  category: EventCategory;
  type: EventType;
  searchQuery: string;
  dateRange: { start?: Date; end?: Date } | null;
  tags: string[];
  sortBy: SortOption;
}

export interface UseEventFiltersReturn {
  filters: FilterState;
  setStatus: (status: EventStatus) => void;
  setCategory: (category: EventCategory) => void;
  setType: (type: EventType) => void;
  setSearchQuery: (query: string) => void;
  setDateRange: (range: { start?: Date; end?: Date } | null) => void;
  setTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  setSortBy: (sort: SortOption) => void;
  resetFilters: () => void;
  filterEvents: (events: Event[]) => Event[];
  sortEvents: (events: Event[]) => Event[];
  activeFiltersCount: number;
}

const initialFilters: FilterState = {
  status: 'all',
  category: 'all',
  type: 'all',
  searchQuery: '',
  dateRange: null,
  tags: [],
  sortBy: 'latest',
};

export function useEventFilters(): UseEventFiltersReturn {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const setStatus = useCallback((status: EventStatus) => {
    setFilters(prev => ({ ...prev, status }));
  }, []);

  const setCategory = useCallback((category: EventCategory) => {
    setFilters(prev => ({ ...prev, category }));
  }, []);

  const setType = useCallback((type: EventType) => {
    setFilters(prev => ({ ...prev, type }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilters(prev => ({ ...prev, searchQuery }));
  }, []);

  const setDateRange = useCallback((dateRange: { start?: Date; end?: Date } | null) => {
    setFilters(prev => ({ ...prev, dateRange }));
  }, []);

  const setTags = useCallback((tags: string[]) => {
    setFilters(prev => ({ ...prev, tags }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  }, []);

  const setSortBy = useCallback((sortBy: SortOption) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const filterEvents = useCallback((events: Event[]): Event[] => {
    return events.filter(event => {
      const now = new Date();
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      // Status filter
      if (filters.status !== 'all') {
        const isUpcoming = eventStart > now;
        const isOngoing = eventStart <= now && eventEnd >= now;
        const isCompleted = eventEnd < now;

        if (filters.status === 'upcoming' && !isUpcoming) return false;
        if (filters.status === 'ongoing' && !isOngoing) return false;
        if (filters.status === 'completed' && !isCompleted) return false;
      }

      // Category filter
      if (filters.category !== 'all' && event.category !== filters.category) {
        return false;
      }

      // Type filter
      if (filters.type !== 'all' && event.type !== filters.type) {
        return false;
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesDesc = event.description.toLowerCase().includes(query);
        const matchesTags = event.tags?.some(tag => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        if (start && eventEnd < start) return false;
        if (end && eventStart > end) return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const eventTags = event.tags || [];
        const hasMatchingTag = filters.tags.some(tag => eventTags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [filters]);

  const sortEvents = useCallback((events: Event[]): Event[] => {
    const sorted = [...events];
    
    switch (filters.sortBy) {
      case 'latest':
        return sorted.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'upcoming':
        return sorted.sort((a, b) => 
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      case 'popular':
        return sorted.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      case 'participants':
        return sorted.sort((a, b) => (b.participants || 0) - (a.participants || 0));
      default:
        return sorted;
    }
  }, [filters.sortBy]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.category !== 'all') count++;
    if (filters.type !== 'all') count++;
    if (filters.searchQuery) count++;
    if (filters.dateRange) count++;
    count += filters.tags.length;
    return count;
  }, [filters]);

  return {
    filters,
    setStatus,
    setCategory,
    setType,
    setSearchQuery,
    setDateRange,
    setTags,
    toggleTag,
    setSortBy,
    resetFilters,
    filterEvents,
    sortEvents,
    activeFiltersCount,
  };
}
