import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { ReactNode, useState } from 'react';
import MobileNav from './MobileNav';

interface GameLayoutProps {
  hero: ReactNode;
  leftSidebar: ReactNode;
  mainContent: ReactNode;
  rightSidebar: ReactNode;
}

export default function GameLayout({ hero, leftSidebar, mainContent, rightSidebar }: GameLayoutProps) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('games');

  // 根据移动端标签页渲染不同内容
  const renderMobileContent = () => {
    switch (activeTab) {
      case 'home':
      case 'games':
        return (
          <>
            <div className="mb-6 lg:hidden">
              {leftSidebar}
            </div>
            {mainContent}
          </>
        );
      case 'leaderboard':
      case 'achievements':
        return (
          <div className="lg:hidden">
            {rightSidebar}
          </div>
        );
      case 'profile':
        return (
          <div className="lg:hidden space-y-6">
            {leftSidebar}
            {rightSidebar}
          </div>
        );
      default:
        return mainContent;
    }
  };

  return (
    <div className={`min-h-screen pb-20 lg:pb-0 ${isDark ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900'}`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {/* Hero 区域 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {hero}
        </motion.div>

        {/* 桌面端三栏布局 */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6 mt-6">
          {/* 左栏 - 游戏分类与导航 */}
          <motion.aside
            className="lg:col-span-3 xl:col-span-3 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {leftSidebar}
          </motion.aside>

          {/* 中栏 - 主内容区域 */}
          <motion.main
            className="lg:col-span-6 xl:col-span-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {mainContent}
          </motion.main>

          {/* 右栏 - 排行榜与成就 */}
          <motion.aside
            className="lg:col-span-3 xl:col-span-3 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {rightSidebar}
          </motion.aside>
        </div>

        {/* 移动端内容区域 */}
        <motion.div
          className="lg:hidden mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {renderMobileContent()}
        </motion.div>
      </div>

      {/* 移动端底部导航 */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
