import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { ReactNode } from 'react';

interface AnalyticsLayoutProps {
  leftSidebar: ReactNode;
  mainContent: ReactNode;
  rightSidebar: ReactNode;
  header?: ReactNode;
}

export default function AnalyticsLayout({
  leftSidebar,
  mainContent,
  rightSidebar,
  header,
}: AnalyticsLayoutProps) {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="container mx-auto px-4 py-6">
        {header && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            {header}
          </motion.header>
        )}
        <div className="flex gap-6">
          {/* 左侧栏 - 导航/筛选区 */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden lg:block w-[260px] xl:w-[280px] flex-shrink-0"
          >
            <div className="sticky top-24 space-y-4">
              {leftSidebar}
            </div>
          </motion.aside>

          {/* 中间栏 - 核心数据展示区 */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 min-w-0"
          >
            {mainContent}
          </motion.main>

          {/* 右侧栏 - 辅助信息/详情区 */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="hidden xl:block w-[300px] 2xl:w-[320px] flex-shrink-0"
          >
            <div className="sticky top-24 space-y-4">
              {rightSidebar}
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
