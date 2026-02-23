import React from 'react';
import { motion } from 'framer-motion';
import { 
  Menu, 
  Bell, 
  Search, 
  Sparkles,
  Crown,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CreatorHeaderProps {
  user: any;
  isDark: boolean;
  onMenuToggle: () => void;
}

const CreatorHeader: React.FC<CreatorHeaderProps> = ({ user, isDark, onMenuToggle }) => {
  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 h-16 ${
        isDark 
          ? 'bg-gray-900/95 border-gray-800' 
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-md border-b transition-colors duration-300`}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMenuToggle}
            className={`p-2 rounded-lg ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            } transition-colors`}
          >
            <Menu className="w-5 h-5" />
          </motion.button>

          <Link to="/creator-center" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className={`font-bold text-lg hidden sm:block ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              创作者中心
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <Search className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="搜索功能、帮助..."
              className={`bg-transparent border-none outline-none text-sm w-48 ${
                isDark ? 'text-gray-200 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'
              }`}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative p-2 rounded-lg ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            } transition-colors`}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </motion.button>

          <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
            <div className={`hidden sm:flex flex-col items-end ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <span className="text-sm font-medium">{user?.name || '创作者'}</span>
              <div className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-gray-500">LV.{user?.level || 3}</span>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <img
                src={user?.avatar || '/default-avatar.png'}
                alt="头像"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/30"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default CreatorHeader;
