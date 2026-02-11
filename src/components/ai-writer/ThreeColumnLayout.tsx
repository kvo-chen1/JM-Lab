import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

interface ThreeColumnLayoutProps {
  leftSidebar: React.ReactNode;
  mainContent: React.ReactNode;
  rightSidebar: React.ReactNode;
  header?: React.ReactNode;
}

export const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  leftSidebar,
  mainContent,
  rightSidebar,
  header,
}) => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 顶部导航 */}
      {header && (
        <header className={`sticky top-0 z-50 ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} border-b backdrop-blur-md`}>
          {header}
        </header>
      )}

      {/* 三栏布局容器 */}
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* 左栏 - 模板分类导航 */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`hidden xl:block w-[280px] flex-shrink-0 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r overflow-y-auto scrollbar-thin`}
        >
          {leftSidebar}
        </motion.aside>

        {/* 中栏 - 主内容区 */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-4xl mx-auto px-6 py-6">
            {mainContent}
          </div>
        </main>

        {/* 右栏 - 表单输入区 */}
        <motion.aside
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
          className={`hidden lg:block w-[380px] flex-shrink-0 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-l overflow-y-auto scrollbar-thin`}
        >
          {rightSidebar}
        </motion.aside>
      </div>

      {/* 移动端底部导航 */}
      <MobileNavigation />
    </div>
  );
};

// 移动端底部导航
const MobileNavigation: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className={`xl:hidden fixed bottom-0 left-0 right-0 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-t z-50`}>
      <div className="flex items-center justify-around py-2">
        <MobileNavItem icon="templates" label="模板" active />
        <MobileNavItem icon="preview" label="预览" />
        <MobileNavItem icon="form" label="填写" />
      </div>
    </div>
  );
};

interface MobileNavItemProps {
  icon: 'templates' | 'preview' | 'form';
  label: string;
  active?: boolean;
}

const MobileNavItem: React.FC<MobileNavItemProps> = ({ icon, label, active }) => {
  const { isDark } = useTheme();

  const icons = {
    templates: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    preview: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    form: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  };

  return (
    <button
      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 ${
        active
          ? 'text-blue-600'
          : isDark
          ? 'text-gray-400 hover:text-gray-200'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {icons[icon]}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

export default ThreeColumnLayout;
