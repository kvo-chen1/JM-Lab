import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { LucideIcon } from 'lucide-react';

interface QuickNavCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  count?: number;
  color: 'blue' | 'red' | 'green' | 'purple' | 'orange' | 'pink' | 'yellow';
  onClick?: () => void;
}

const colorVariants = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400',
    hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500/20 to-blue-600/20',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-400',
    hover: 'hover:bg-red-100 dark:hover:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    gradient: 'from-red-500/20 to-red-600/20',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400',
    hover: 'hover:bg-green-100 dark:hover:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    gradient: 'from-green-500/20 to-green-600/20',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-400',
    hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-500/20 to-purple-600/20',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    icon: 'bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-400',
    hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
    border: 'border-orange-200 dark:border-orange-800',
    gradient: 'from-orange-500/20 to-orange-600/20',
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    icon: 'bg-pink-100 dark:bg-pink-800 text-pink-600 dark:text-pink-400',
    hover: 'hover:bg-pink-100 dark:hover:bg-pink-900/30',
    border: 'border-pink-200 dark:border-pink-800',
    gradient: 'from-pink-500/20 to-pink-600/20',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    icon: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-400',
    hover: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    gradient: 'from-yellow-500/20 to-yellow-600/20',
  },
};

export default function QuickNavCard({
  title,
  description,
  icon: Icon,
  href,
  count,
  color,
  onClick,
}: QuickNavCardProps) {
  const { isDark } = useTheme();
  const colors = colorVariants[color];

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <motion.a
      href={href}
      onClick={handleClick}
      className={`block p-5 rounded-2xl border ${colors.bg} ${colors.border} ${colors.hover} transition-all duration-300 cursor-pointer group relative overflow-hidden`}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* 背景装饰 */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${colors.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            <Icon className="w-6 h-6" />
          </div>
          {count !== undefined && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600'} shadow-sm`}>
              {count}
            </span>
          )}
        </div>
        
        <h3 className="font-semibold text-base mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
          {title}
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} line-clamp-2`}>
          {description}
        </p>
        
        <div className="mt-4 flex items-center text-sm font-medium text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span>查看详情</span>
          <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </motion.a>
  );
}
