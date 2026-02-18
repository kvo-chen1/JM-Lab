import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Search, X, ArrowLeft } from 'lucide-react';
import { SearchEmptyProps } from '../types/collection';

/**
 * 搜索空状态组件
 * 当搜索无结果时显示
 */
export function SearchEmpty({ query, onClear }: SearchEmptyProps) {
  const { isDark } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      {/* 图标 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={`
          w-20 h-20 rounded-full flex items-center justify-center mb-6
          ${isDark ? 'bg-gray-800' : 'bg-gray-100'}
        `}
      >
        <Search className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      </motion.div>

      {/* 标题 */}
      <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        未找到相关结果
      </h3>

      {/* 描述 */}
      <p className={`text-center max-w-md mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        没有找到与
        <span className={`mx-1 px-2 py-0.5 rounded ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
          "{query}"
        </span>
        相关的收藏内容
      </p>

      <p className={`text-sm mb-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        试试其他关键词，或检查拼写是否正确
      </p>

      {/* 操作按钮 */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClear}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium
            transition-colors
            ${isDark
              ? 'bg-gray-800 hover:bg-gray-700 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }
          `}
        >
          <X className="w-4 h-4" />
          清除搜索
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.history.back()}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium
            transition-colors
            ${isDark
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </motion.button>
      </div>

      {/* 搜索建议 */}
      <div className="mt-12 text-center">
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          您可以尝试搜索：
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {['天津', '年画', '设计', '插画', '传统'].map((tag) => (
            <motion.button
              key={tag}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // 触发搜索
                const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (searchInput) {
                  searchInput.value = tag;
                  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }}
              className={`
                px-3 py-1.5 rounded-full text-sm
                transition-colors
                ${isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }
              `}
            >
              {tag}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default SearchEmpty;
