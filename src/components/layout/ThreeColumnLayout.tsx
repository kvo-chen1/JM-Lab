/**
 * 三栏布局组件
 * 左侧导航栏 + 中间内容区 + 右侧信息栏
 */
import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

interface ThreeColumnLayoutProps {
  leftSidebar: ReactNode;
  rightSidebar: ReactNode;
  children: ReactNode;
  className?: string;
}

const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  leftSidebar,
  rightSidebar,
  children,
  className = '',
}) => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] marketplace-theme ${isDark ? '' : 'light'} ${className}`}>
      <div className="max-w-[1600px] mx-auto">
        <div className="flex gap-4 lg:gap-6 px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
          {/* 左侧栏 - 在移动端隐藏 */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="hidden lg:block w-[220px] xl:w-[240px] flex-shrink-0"
          >
            <div className="sticky top-4 lg:top-6">
              {leftSidebar}
            </div>
          </motion.aside>

          {/* 中间内容区 */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 min-w-0 overflow-hidden"
          >
            {children}
          </motion.main>

          {/* 右侧栏 - 在平板及以下隐藏 */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="hidden xl:block w-[300px] 2xl:w-[320px] flex-shrink-0"
          >
            <div className="sticky top-4 lg:top-6 space-y-3 lg:space-y-4">
              {rightSidebar}
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
};

export default ThreeColumnLayout;
