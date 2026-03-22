import React from 'react';
import { useTheme } from '@/hooks/useTheme';

export interface QuickOption {
  id: string;
  label: string;
  description?: string;
  preview?: string; // 颜色值或图标
  type: 'color' | 'style' | 'industry' | 'emoji';
}

interface QuickOptionsProps {
  options: QuickOption[];
  onSelect: (option: QuickOption) => void;
  title?: string;
}

export const QuickOptions: React.FC<QuickOptionsProps> = ({
  options,
  onSelect,
  title,
}) => {
  const { isDark } = useTheme();

  const handleOptionClick = (option: QuickOption) => {
    onSelect(option);
  };

  return (
    <div className={`mt-3 ${title ? '' : 'mt-0'}`}>
      {title && (
        <div className={`text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {title}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleOptionClick(option)}
            className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all border ${
              isDark
                ? 'bg-gray-800/50 border-gray-700 hover:border-purple-500/50 hover:bg-purple-500/10'
                : 'bg-white border-gray-200 hover:border-purple-500/50 hover:bg-purple-50'
            }`}
          >
            {/* 颜色预览 */}
            {option.type === 'color' && option.preview && (
              <div
                className="w-5 h-5 rounded-full border border-gray-300 shadow-sm"
                style={{ backgroundColor: option.preview }}
              />
            )}

            {/* Emoji 预览 */}
            {option.type === 'emoji' && option.preview && (
              <span className="text-lg">{option.preview}</span>
            )}

            {/* 样式/行业图标 */}
            {(option.type === 'style' || option.type === 'industry') && (
              <div className={`w-5 h-5 rounded flex items-center justify-center ${
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <span className="text-xs">✨</span>
              </div>
            )}

            {/* 标签 */}
            <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>
              {option.label}
            </span>

            {/* 悬停效果 */}
            <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${
              isDark ? 'text-purple-400' : 'text-purple-500'
            }`}>
              ✓
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickOptions;
