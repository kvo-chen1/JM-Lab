import React, { useCallback, useRef, memo, useState, useEffect } from 'react'
import './SearchBar.css' // Import custom Pinterest styles

// 搜索结果类型枚举
export const SearchResultType = {
  WORK: 'work',
  USER: 'user',
  CATEGORY: 'category',
  TAG: 'tag',
  PAGE: 'page'
} as const;

export type SearchResultType = typeof SearchResultType[keyof typeof SearchResultType];

// 搜索建议项类型
export interface SearchSuggestion {
  id: string
  text: string
  type: SearchResultType
  icon?: string
  group?: string
  onRemove?: () => void
}

// 高级筛选选项
export interface SearchFilters {
  type?: SearchResultType[]
  category?: string[]
  tags?: string[]
  dateRange?: { start: Date | null; end: Date | null }
  sortBy?: 'relevance' | 'latest' | 'popular'
}

interface SearchBarProps {
  search: string
  setSearch: (value: string) => void
  showSuggest: boolean
  setShowSuggest: (value: boolean) => void
  suggestions: SearchSuggestion[]
  isDark: boolean
  onSearch: (query: string, filters?: SearchFilters) => void
  onSuggestionSelect: (suggestion: SearchSuggestion) => void
  filters?: SearchFilters
  onFiltersChange?: (filters: SearchFilters) => void
}

// 搜索建议项组件
interface SuggestionItemProps {
  suggestion: SearchSuggestion
  isDark: boolean
  onSelect: (suggestion: SearchSuggestion) => void
}

const SuggestionItem = memo(({ suggestion, isDark, onSelect }: SuggestionItemProps) => {
  const getTypeIcon = (type: SearchResultType) => {
    switch (type) {
      case SearchResultType.WORK: return 'fas fa-image';
      case SearchResultType.USER: return 'fas fa-user';
      case SearchResultType.CATEGORY: return 'fas fa-folder';
      case SearchResultType.TAG: return 'fas fa-tag';
      case SearchResultType.PAGE: return 'fas fa-file';
      default: return 'fas fa-search';
    }
  }

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (suggestion.onRemove) {
      suggestion.onRemove();
    }
  }, [suggestion]);

  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent input blur
    onSelect(suggestion);
  }, [onSelect, suggestion]);

  return (
    <div 
      onMouseDown={handleSelect} 
      className="suggestion-item"
    >
      <div className="suggestion-icon">
        <i className={suggestion.icon || getTypeIcon(suggestion.type)}></i>
      </div>
      <span className="flex-1">{suggestion.text}</span>
      {suggestion.onRemove && (
        <button 
          className="remove-btn" 
          onClick={handleRemove} 
          onMouseDown={(e) => e.stopPropagation()} // Prevent parent selection
          aria-label="Remove"
        >
          <i className="fas fa-times"></i>
        </button>
      )}
    </div>
  )
})

const SearchBar: React.FC<SearchBarProps> = memo(({
  search,
  setSearch,
  showSuggest,
  setShowSuggest,
  suggestions,
  isDark,
  onSearch,
  onSuggestionSelect,
  filters = {},
  onFiltersChange
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search execution (optional, as the parent might handle API calls based on 'search' prop)
  // For this component, we update the input value immediately.
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    setShowSuggest(true)
  }, [setSearch, setShowSuggest])

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowSuggest(true)
  }, [setShowSuggest])

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setTimeout(() => setShowSuggest(false), 200)
  }, [setShowSuggest])

  const handleClear = useCallback(() => {
    setSearch('');
    inputRef.current?.focus();
  }, [setSearch]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setShowSuggest(false)
      onSearch(search.trim(), filters)
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
        setSearch('');
        inputRef.current?.blur();
        setShowSuggest(false);
    }
  }, [search, onSearch, setShowSuggest, filters, setSearch])

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (e.key === '/' && document.activeElement !== inputRef.current) {
            e.preventDefault();
            inputRef.current?.focus();
        }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Group suggestions
  const groupedSuggestions = React.useMemo(() => {
    if (!suggestions.length) return {};
    
    // If no group is defined, treat as 'Suggestions' or handle flat list
    // Check if any item has a group
    const hasGroups = suggestions.some(s => s.group);
    if (!hasGroups) return { 'default': suggestions };

    return suggestions.reduce((acc, curr) => {
      const group = curr.group || '其他';
      if (!acc[group]) acc[group] = [];
      acc[group].push(curr);
      return acc;
    }, {} as Record<string, SearchSuggestion[]>);
  }, [suggestions]);

  const groupKeys = Object.keys(groupedSuggestions);

  return (
    <div className={`pinterest-search-wrapper ${isDark ? 'dark' : ''}`} style={{ position: 'relative', zIndex: 9999, overflow: 'visible' }}>
      <div className={`pinterest-search-bar ${isFocused ? 'focused' : ''}`} style={{ position: 'relative', zIndex: 9999, overflow: 'visible' }}>
        
        {/* Search Icon */}
        <div className="search-icon-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
             <path d="M10 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z M10 2c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8z" />
          </svg>
        </div>
        
        {/* Input Field */}
        <input 
          ref={inputRef}
          value={search} 
          onChange={handleSearchChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyPress}
          placeholder="Search" 
          aria-label="Search" 
          autoComplete="off"
        />
        
        {/* Clear Button */}
        <button 
            className={`clear-btn ${search.length > 0 ? 'visible' : ''}`} 
            onClick={handleClear}
            aria-label="Clear search"
            type="button"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>

      </div>
      
      {/* Search Suggestions Dropdown - Moved outside the search bar to avoid overflow issues */}
      {showSuggest && suggestions.length > 0 && (
        <div className="pinterest-suggestions visible" style={{ position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 99999, overflow: 'visible' }}>
           {groupKeys.length === 1 && groupKeys[0] === 'default' ? (
              // Flat list
              groupedSuggestions['default'].map((suggestion) => (
                <SuggestionItem 
                  key={suggestion.id} 
                  suggestion={suggestion} 
                  isDark={isDark} 
                  onSelect={onSuggestionSelect}
                />
              ))
           ) : (
              // Grouped list
              groupKeys.map(group => (
                <div key={group} className="suggestion-group">
                  <div className="suggestion-group-title">{group}</div>
                  {groupedSuggestions[group].map((suggestion) => (
                    <SuggestionItem 
                      key={suggestion.id} 
                      suggestion={suggestion} 
                      isDark={isDark} 
                      onSelect={onSuggestionSelect}
                    />
                  ))}
                </div>
              ))
           )}
        </div>
      )}

      
      {/* Note: Original 'Filter' and 'Search' buttons have been removed to comply with 
          1:1 Pinterest visual replication requirements. If these functionalities are critical, 
          they should be moved to a separate toolbar or integrated differently. */}
    </div>
  )
})

export default SearchBar
