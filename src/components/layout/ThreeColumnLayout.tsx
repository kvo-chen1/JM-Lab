/**
 * 三栏布局组件 V2
 * 中间内容区 + 右侧信息栏（左侧栏已移除）
 * 优化：更现代的布局、更好的响应式支持
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
          {/* 中间内容区 - 占满左侧空间 */}
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
