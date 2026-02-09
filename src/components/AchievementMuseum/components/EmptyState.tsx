import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Search, Filter, Trophy, Rocket } from 'lucide-react';

interface EmptyStateProps {
  type: 'search' | 'filter' | 'all' | 'locked';
  onReset?: () => void;
}

export default function EmptyState({ type, onReset }: EmptyStateProps) {
  const { isDark } = useTheme();

  const configs = {
    search: {
      icon: Search,
      title: '未找到相关成就',
      description: '尝试使用其他关键词搜索',
      action: onReset ? '清除搜索' : null,
    },
    filter: {
      icon: Filter,
      title: '没有符合条件的成就',
      description: '尝试调整筛选条件',
      action: onReset ? '重置筛选' : null,
    },
    all: {
      icon: Trophy,
      title: '暂无成就数据',
      description: '开始创作，解锁你的第一个成就！',
      action: null,
    },
    locked: {
      icon: Rocket,
      title: '还有成就等待解锁',
      description: '继续创作，解锁更多精彩成就',
      action: null,
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center py-16 px-4 rounded-2xl ${
        isDark ? 'bg-gray-800/30 border border-gray-700/50' : 'bg-gray-50 border border-gray-100'
      }`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
        style={{
          boxShadow: isDark
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(0,0,0,0.05)',
        }}
      >
        <Icon className={`w-10 h-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
      >
        {config.title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`text-sm text-center max-w-sm mb-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
      >
        {config.description}
      </motion.p>

      {config.action && onReset && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onReset}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            isDark
              ? 'bg-[#C02C38]/20 text-[#C02C38] hover:bg-[#C02C38]/30 border border-[#C02C38]/30'
              : 'bg-[#C02C38]/10 text-[#C02C38] hover:bg-[#C02C38]/20 border border-[#C02C38]/20'
          }`}
        >
          {config.action}
        </motion.button>
      )}
    </motion.div>
  );
}
