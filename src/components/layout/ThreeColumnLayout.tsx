/**
 * 三栏布局组件 V3
 * 左侧栏 + 中间内容区 + 右侧信息栏
 * 优化：支持左侧边栏、更现代的布局、更好的响应式支持
 */
import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

interface ThreeColumnLayoutProps {
  leftSidebar?: ReactNode;
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
  const { isDark, theme } = useTheme();
  
  // 根据当前主题确定应用的类
  const themeClass = theme === 'delta-force' ? 'delta-force' : 'marketplace-theme';
  const darkClass = isDark ? 'dark' : 'light';
  
  return (
    <div className={`min-h-screen marketplace-theme ${themeClass} ${darkClass} ${className}`}>
      <div className="max-w-[1600px] mx-auto">
        <div className="flex gap-5 lg:gap-6 px-3 sm:px-4 lg:px-6 py-5 lg:py-6">
          {/* 左侧栏 - 在平板及以下隐藏 */}
          {leftSidebar && (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="hidden lg:block w-[280px] flex-shrink-0"
            >
              <div className="sticky top-5 lg:top-6">
                {leftSidebar}
              </div>
            </motion.aside>
          )}

          {/* 中间内容区 */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 min-w-0 overflow-hidden"
          >
            {children}
          </motion.main>

          {/* 右侧栏 - 在平板及以下隐藏 */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            className="hidden xl:block w-[320px] 2xl:w-[340px] flex-shrink-0"
          >
            <div className="sticky top-5 lg:top-6 space-y-4">
              {rightSidebar}
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
};

export default ThreeColumnLayout;
