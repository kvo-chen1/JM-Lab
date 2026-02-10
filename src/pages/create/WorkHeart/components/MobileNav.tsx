import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useActiveTab, useWorkHeartStore } from '../hooks/useWorkHeartStore';

const navItems = [
  { id: 'create', label: '创作', icon: 'lightbulb' },
  { id: 'design', label: '设计', icon: 'magic' },
  { id: 'results', label: '结果', icon: 'images' },
  { id: 'history', label: '历史', icon: 'clock-rotate-left' },
  { id: 'vein', label: '脉络', icon: 'project-diagram' }
];

export default function MobileNav() {
  const { isDark } = useTheme();
  const activeTab = useActiveTab();
  const { setActiveTab, toggleRightSidebar } = useWorkHeartStore();

  return (
    <>
      {/* 底部导航栏 */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 border-t lg:hidden ${
        isDark 
          ? 'bg-slate-900/95 border-slate-800 backdrop-blur-lg' 
          : 'bg-white/95 border-slate-200 backdrop-blur-lg'
      }`}>
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                  isActive
                    ? isDark ? 'text-red-400' : 'text-red-600'
                    : isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <i className={`fas fa-${item.icon} text-lg mb-1`}></i>
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobileNavIndicator"
                    className={`absolute bottom-1 w-1 h-1 rounded-full ${
                      isDark ? 'bg-red-500' : 'bg-red-600'
                    }`}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
        {/* 安全区域 */}
        <div className="h-[env(safe-area-inset-bottom)]"></div>
      </div>

      {/* 右侧辅助面板切换按钮 */}
      <motion.button
        onClick={toggleRightSidebar}
        className={`fixed top-20 right-4 z-40 w-10 h-10 rounded-full shadow-lg flex items-center justify-center lg:hidden ${
          isDark 
            ? 'bg-slate-800 text-slate-300 border border-slate-700' 
            : 'bg-white text-slate-600 border border-slate-200'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <i className="fas fa-robot"></i>
      </motion.button>
    </>
  );
}
