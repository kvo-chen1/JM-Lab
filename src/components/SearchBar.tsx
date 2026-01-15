import React, { useCallback, useRef, memo } from 'react'

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
}

interface SearchBarProps {
  search: string
  setSearch: (value: string) => void
  showSuggest: boolean
  setShowSuggest: (value: boolean) => void
  suggestions: SearchSuggestion[]
  isDark: boolean
  onSearch: (query: string) => void
  onSuggestionSelect: (suggestion: SearchSuggestion) => void
}

// 搜索建议项组件
interface SuggestionItemProps {
  suggestion: SearchSuggestion
  isDark: boolean
  onSelect: (suggestion: SearchSuggestion) => void
}

const SuggestionItem = memo(({ suggestion, isDark, onSelect }: SuggestionItemProps) => {
  // 预先计算样式类名
  const itemClassName = isDark 
    ? 'hover:bg-gray-700' 
    : 'hover:bg-gray-50'

  // 根据类型获取图标和颜色
  const getTypeIcon = (type: SearchResultType) => {
    switch (type) {
      case SearchResultType.WORK:
        return { icon: 'fas fa-image', color: 'text-blue-500' }
      case SearchResultType.USER:
        return { icon: 'fas fa-user', color: 'text-green-500' }
      case SearchResultType.CATEGORY:
        return { icon: 'fas fa-folder', color: 'text-purple-500' }
      case SearchResultType.TAG:
        return { icon: 'fas fa-tag', color: 'text-yellow-500' }
      case SearchResultType.PAGE:
        return { icon: 'fas fa-file', color: 'text-indigo-500' }
      default:
        return { icon: 'fas fa-search', color: 'text-gray-500' }
    }
  }

  // 根据类型获取显示名称
  const getTypeName = (type: SearchResultType) => {
    switch (type) {
      case SearchResultType.WORK:
        return '作品'
      case SearchResultType.USER:
        return '用户'
      case SearchResultType.CATEGORY:
        return '分类'
      case SearchResultType.TAG:
        return '标签'
      case SearchResultType.PAGE:
        return '页面'
      default:
        return '搜索结果'
    }
  }

  const typeInfo = getTypeIcon(suggestion.type)

  const handleSelect = useCallback(() => {
    onSelect(suggestion)
  }, [suggestion, onSelect])

  return (
    <div 
      onMouseDown={handleSelect} 
      className={`${itemClassName} px-3 py-2 text-sm cursor-pointer flex items-center justify-between`}
    >
      <div className="flex items-center gap-2">
        <i className={`${typeInfo.icon} ${typeInfo.color} text-sm`}></i>
        <span>{suggestion.text}</span>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
        {getTypeName(suggestion.type)}
      </span>
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
  onSuggestionSelect
}) => {
  // 优化事件处理函数 - 移除不必要的防抖，确保输入流畅
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // 立即更新搜索状态，确保输入流畅
    setSearch(value)
    
    setShowSuggest(true)
  }, [setSearch, setShowSuggest])

  const handleFocus = useCallback(() => {
    setShowSuggest(true)
  }, [setShowSuggest])

  const handleBlur = useCallback(() => {
    setTimeout(() => setShowSuggest(false), 150)
  }, [setShowSuggest])

  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setSearch(suggestion.text)
    setShowSuggest(false)
    onSuggestionSelect(suggestion)
  }, [setSearch, setShowSuggest, onSuggestionSelect])

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setShowSuggest(false)
      onSearch(search.trim())
    }
  }, [search, onSearch, setShowSuggest])

  const handleSearchButtonClick = useCallback(() => {
    setShowSuggest(false)
    onSearch(search.trim())
  }, [search, onSearch, setShowSuggest])

  // 预先计算样式类名
  const inputBaseClassName = isDark 
    ? 'bg-gray-800 text-white focus:bg-gray-800' 
    : 'bg-gray-50 text-gray-900 focus:bg-white'

  const inputContainerClassName = isDark 
    ? 'bg-gray-700' 
    : 'bg-gray-100'

  const suggestBoxClassName = isDark 
    ? 'bg-gray-800 text-white ring-gray-700 shadow-lg' 
    : 'bg-white text-gray-900 ring-gray-200 shadow-lg'

  const buttonClassName = isDark 
    ? 'bg-red-600 hover:bg-red-700 text-white' 
    : 'bg-red-600 hover:bg-red-700 text-white'

  return (
    <div className="relative">
      <div className={`flex items-center rounded-lg ring-1 ${isDark ? 'bg-gray-900 ring-gray-700 hover:ring-gray-600' : 'bg-white ring-gray-200 hover:ring-gray-300'} px-3 py-2 transition-all duration-300 hover:shadow-lg`}>
        {/* 搜索图标 */}
        <div className={`flex items-center justify-center ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'} mr-2 transition-colors duration-300`}>
          <i className="fas fa-search"></i>
        </div>
        
        <input 
          value={search} 
          onChange={handleSearchChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          className={`${inputBaseClassName} flex-1 px-2 py-2 border-0 focus:outline-none focus:ring-0 transition-all duration-300`} 
          placeholder="搜索作品、用户、分类、标签或页面" 
          aria-label="搜索内容" 
        />
        
        {/* 搜索按钮 */}
        <button 
          onClick={handleSearchButtonClick}
          className={`ml-2 px-3 py-1 rounded-md ${buttonClassName} text-sm font-medium transition-all duration-300 hover:shadow-md transform hover:-translate-y-0.5`}
          aria-label="搜索"
        >
          搜索
        </button>
      </div>
      
      {showSuggest && suggestions.length > 0 && (
        <div className={`${suggestBoxClassName} absolute z-10 mt-2 w-full rounded-xl ring-1 max-h-48 overflow-auto transition-all duration-300 transform origin-top scale-100 opacity-100`}>
          {suggestions.map((suggestion) => (
            <SuggestionItem 
              key={suggestion.id} 
              suggestion={suggestion} 
              isDark={isDark} 
              onSelect={handleSuggestionSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
})

export default SearchBar