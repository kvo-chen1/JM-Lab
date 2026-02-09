import { motion } from 'framer-motion';
import { FileEdit, Plus, Search, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  isDark: boolean;
  type: 'all' | 'search' | 'category';
  onCreateNew?: () => void;
  searchTerm?: string;
}

export default function EmptyState({
  isDark,
  type,
  onCreateNew,
  searchTerm
}: EmptyStateProps) {
  const configs = {
    all: {
      icon: FileEdit,
      title: '暂无保存的草稿',
      description: '在创作中心点击"保存草稿"可将作品存档于此',
      action: {
        text: '开始创作',
        icon: Plus
      }
    },
    search: {
      icon: Search,
      title: '没有找到匹配的草稿',
      description: searchTerm ? `搜索 "${searchTerm}" 没有结果` : '尝试使用其他关键词搜索',
      action: null
    },
    category: {
      icon: Sparkles,
      title: '该分类暂无草稿',
      description: '此分类下还没有保存任何草稿',
      action: {
        text: '去创作',
        icon: Plus
      }
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center py-20 px-4 rounded-3xl border-2 border-dashed ${
        isDark
          ? 'border-gray-700 bg-gray-800/30'
          : 'border-gray-200 bg-gray-50/50'
      }`}
    >
      {/* 图标 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-6 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-lg`}
      >
        <Icon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
      </motion.div>

      {/* 标题 */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {config.title}
      </h3>

      {/* 描述 */}
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-8">
        {config.description}
      </p>

      {/* 操作按钮 */}
      {config.action && onCreateNew && (
        <motion.button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl shadow-lg shadow-primary-500/25 transition-all duration-300"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <config.action.icon className="w-5 h-5" />
          {config.action.text}
        </motion.button>
      )}

      {/* 装饰元素 */}
      <div className="flex items-center gap-2 mt-8">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
