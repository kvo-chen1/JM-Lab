import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface SettingsLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
  preview: ReactNode;
  className?: string;
}

export function SettingsLayout({ sidebar, content, preview, className }: SettingsLayoutProps) {
  return (
    <div className={clsx(
      'min-h-screen bg-[#fafafa] dark:bg-[#0f0f0f]',
      'flex',
      className
    )}>
      {/* 左侧导航栏 - 固定宽度 */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={clsx(
          'fixed left-0 top-0 h-screen w-[280px]',
          'bg-white/80 dark:bg-[#1a1a1a]/80',
          'backdrop-blur-xl',
          'border-r border-gray-200/50 dark:border-gray-800/50',
          'z-20',
          'hidden lg:block'
        )}
      >
        {sidebar}
      </motion.aside>

      {/* 中间内容区 - 自适应 */}
      <motion.main
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={clsx(
          'flex-1 min-h-screen',
          'lg:ml-[280px] lg:mr-[320px]',
          'px-4 sm:px-6 lg:px-8 py-8'
        )}
      >
        <div className="max-w-[900px] mx-auto">
          {content}
        </div>
      </motion.main>

      {/* 右侧预览区 - 固定宽度 */}
      <motion.aside
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={clsx(
          'fixed right-0 top-0 h-screen w-[320px]',
          'bg-white/60 dark:bg-[#1a1a1a]/60',
          'backdrop-blur-xl',
          'border-l border-gray-200/50 dark:border-gray-800/50',
          'z-20',
          'hidden xl:block'
        )}
      >
        {preview}
      </motion.aside>

      {/* 移动端底部导航占位 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-gray-800 z-30" />
    </div>
  );
}

export default SettingsLayout;
