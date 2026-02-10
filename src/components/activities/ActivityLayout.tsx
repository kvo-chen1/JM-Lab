import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

interface ActivityLayoutProps {
  header: ReactNode;
  stats: ReactNode;
  leftSidebar: ReactNode;
  mainContent: ReactNode;
  rightSidebar: ReactNode;
  isLoading?: boolean;
}

export const ActivityLayout: React.FC<ActivityLayoutProps> = ({
  header,
  stats,
  leftSidebar,
  mainContent,
  rightSidebar,
  isLoading = false,
}) => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 头部区域 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          {header}
        </motion.div>

        {/* 统计卡片区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          {stats}
        </motion.div>

        {/* 三栏布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧栏 - 在移动端可折叠 */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="lg:col-span-3 xl:col-span-2 hidden lg:block"
          >
            <div className="sticky top-6 space-y-6">
              {leftSidebar}
            </div>
          </motion.aside>

          {/* 中间主内容区 */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="lg:col-span-6 xl:col-span-7"
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              </div>
            ) : (
              mainContent
            )}
          </motion.main>

          {/* 右侧栏 */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="lg:col-span-3 xl:col-span-3 hidden lg:block"
          >
            <div className="sticky top-6 space-y-6">
              {rightSidebar}
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
};

export default ActivityLayout;
