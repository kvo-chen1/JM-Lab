import React from 'react';
import { motion } from 'framer-motion';

interface DraftsLayoutProps {
  isDark: boolean;
  leftSidebar: React.ReactNode;
  mainContent: React.ReactNode;
  rightSidebar?: React.ReactNode;
  showRightSidebar?: boolean;
  mobileDrawer?: React.ReactNode;
}

const DraftsLayout: React.FC<DraftsLayoutProps> = ({
  isDark,
  leftSidebar,
  mainContent,
  rightSidebar,
  showRightSidebar = true,
  mobileDrawer
}) => {
  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* 移动端抽屉 */}
      {mobileDrawer}

      {/* 三栏布局容器 */}
      <div className="flex min-h-screen">
        {/* 左侧边栏 - 固定宽度 280px */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
          className={`
            w-72 flex-shrink-0 hidden lg:flex flex-col sticky top-0 h-screen overflow-y-auto
            ${isDark ? 'bg-slate-800/80 border-r border-slate-700/50' : 'bg-white/80 border-r border-gray-200/80'}
            backdrop-blur-xl
          `}
        >
          <div className="p-6 space-y-6">
            {leftSidebar}
          </div>
        </motion.aside>

        {/* 主内容区 - 自适应宽度 */}
        <main className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto p-4 lg:p-8">
            {mainContent}
          </div>
        </main>

        {/* 右侧辅助栏 - 固定宽度 320px */}
        {showRightSidebar && rightSidebar && (
          <motion.aside
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.8, 0.25, 1] }}
            className={`
              w-80 flex-shrink-0 hidden xl:flex flex-col sticky top-0 h-screen overflow-y-auto
              ${isDark ? 'bg-slate-800/50 border-l border-slate-700/50' : 'bg-white/50 border-l border-gray-200/80'}
              backdrop-blur-xl
            `}
          >
            <div className="p-6 space-y-6">
              {rightSidebar}
            </div>
          </motion.aside>
        )}
      </div>
    </div>
  );
};

export default DraftsLayout;
