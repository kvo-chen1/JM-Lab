import React, { useCallback, memo } from 'react'

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  isDark: boolean
  placeholder?: string
  onFocus?: () => void
  onBlur?: () => void
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

const PromptInput = memo(({
  value,
  onChange,
  isDark,
  placeholder = '输入创作提示词...',
  onFocus,
  onBlur,
  onKeyPress
}: PromptInputProps) => {
  // 优化事件处理函数
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }, [onChange])

  // 预先计算样式类名
  const inputBaseClassName = isDark 
    ? 'bg-gray-900 text-gray-100 focus:bg-gray-900' 
    : 'bg-gray-50 text-gray-900 focus:bg-white'

  const containerClassName = isDark 
    ? 'bg-gray-900 ring-gray-700 hover:ring-gray-600' 
    : 'bg-white ring-gray-200 hover:ring-gray-300'

  const iconClassName = isDark 
    ? 'text-gray-400 hover:text-gray-300' 
    : 'text-gray-500 hover:text-gray-600'

  return (
    <div className="relative">
      <div className={`flex items-center rounded-xl ring-2 ${containerClassName} px-4 py-3 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 transform hover:-translate-y-0.5`}>
        {/* 搜索图标 - 保留以保持视觉一致性 */}
        <div className={`flex items-center justify-center ${iconClassName} mr-3 transition-colors duration-300`}>
          <i className="fas fa-search text-lg"></i>
        </div>
        
        <input 
          value={value} 
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyPress={onKeyPress}
          className={`${inputBaseClassName} flex-1 px-2 py-2 border-0 focus:outline-none focus:ring-0 transition-all duration-300 text-sm sm:text-base`} 
          placeholder={placeholder} 
          aria-label="创作提示词"
        />
      </div>
    </div>
  )
})

export default PromptInput