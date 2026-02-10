import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useLeftSidebarCollapsed, useRightSidebarVisible } from './hooks/useWorkHeartStore';
import WorkHeartLeftSidebar from './WorkHeartLeftSidebar';
import WorkHeartRightSidebar from './WorkHeartRightSidebar';
import MobileNav from './components/MobileNav';

interface WorkHeartLayoutProps {
  children: React.ReactNode;
}

export default function WorkHeartLayout({ children }: WorkHeartLayoutProps) {
  const { isDark } = useTheme();
  const leftCollapsed = useLeftSidebarCollapsed();
  const rightVisible = useRightSidebarVisible();

  return (
    <div className={`flex h-full overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* 左侧边栏 - 桌面端显示 */}
      <div className="hidden lg:block">
        <WorkHeartLeftSidebar />
      </div>

      {/* 主内容区 */}
      <motion.main
        className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300`}
        layout
      >
        {/* 顶部标题栏 */}
        <div className={`flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b flex-shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/50'
        } backdrop-blur-sm`}>
          <div className="flex items-center gap-3">
            {/* 移动端Logo */}
            <motion.div
              initial={{ rotate: -15, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg"
            >
              <i className="fas fa-heart text-base lg:text-lg"></i>
            </motion.div>
            <div>
              <h1 className={`text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                作品之心
              </h1>
              <p className={`text-[10px] lg:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                AI驱动的创意灵感引擎
              </p>
            </div>
          </div>

          {/* 顶部操作按钮 */}
          <div className="flex items-center gap-2">
            <button
              className={`hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isDark 
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
              onClick={() => window.open('/help', '_blank')}
            >
              <i className="fas fa-question-circle mr-2"></i>
              帮助
            </button>
            {/* 移动端帮助按钮 */}
            <button
              className={`sm:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                isDark 
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
              onClick={() => window.open('/help', '_blank')}
            >
              <i className="fas fa-question-circle"></i>
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden pb-16 lg:pb-0">
          {children}
        </div>
      </motion.main>

      {/* 右侧边栏 - 桌面端显示 */}
      <AnimatePresence>
        {rightVisible && (
          <div className="hidden lg:block">
            <WorkHeartRightSidebar />
          </div>
        )}
      </AnimatePresence>

      {/* 移动端右侧边栏抽屉 */}
      <AnimatePresence>
        {rightVisible && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed inset-y-0 right-0 z-40 w-80 lg:hidden ${
              isDark ? 'bg-slate-900' : 'bg-white'
            }`}
          >
            <WorkHeartRightSidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 遮罩层 */}
      <AnimatePresence>
        {rightVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => useWorkHeartStore.getState().toggleRightSidebar()}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* 移动端底部导航 */}
      <MobileNav />
    </div>
  );
}
