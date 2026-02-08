import React from 'react';
import { motion } from 'framer-motion';

interface ThreeColumnLayoutProps {
  isDark: boolean;
  leftSidebar: React.ReactNode;
  mainContent: React.ReactNode;
  rightSidebar?: React.ReactNode;
  showRightSidebar?: boolean;
}

const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  isDark,
  leftSidebar,
  mainContent,
  rightSidebar,
  showRightSidebar = true
}) => {
  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* 三栏布局容器 */}
      <div className="flex h-screen overflow-hidden">
        {/* 左侧导航栏 - 固定宽度 */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
          className={`
            w-64 flex-shrink-0 flex flex-col
            ${isDark ? 'bg-slate-800 border-r border-slate-700/50' : 'bg-white border-r border-gray-200'}
          `}
        >
          {leftSidebar}
        </motion.aside>

        {/* 主内容区 - 自适应宽度 */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* 内容滚动区域 */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto p-6 lg:p-8">
              {mainContent}
            </div>
          </div>
        </main>

        {/* 右侧辅助栏 - 固定宽度，可选 */}
        {showRightSidebar && rightSidebar && (
          <motion.aside
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1, ease: [0.25, 0.8, 0.25, 1] }}
            className={`
              w-80 flex-shrink-0 hidden xl:flex flex-col
              ${isDark ? 'bg-slate-800/50 border-l border-slate-700/50' : 'bg-white border-l border-gray-200'}
            `}
          >
            {rightSidebar}
          </motion.aside>
        )}
      </div>
    </div>
  );
};

export default ThreeColumnLayout;
