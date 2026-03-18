/**
 * 订单页面三栏布局容器
 * 提供响应式的三栏布局结构
 */
import React from 'react';
import { motion } from 'framer-motion';

interface OrdersThreeColumnLayoutProps {
  leftSidebar: React.ReactNode;
  mainContent: React.ReactNode;
  rightSidebar: React.ReactNode;
  header?: React.ReactNode;
}

export const OrdersThreeColumnLayout: React.FC<OrdersThreeColumnLayoutProps> = ({
  leftSidebar,
  mainContent,
  rightSidebar,
  header,
}) => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      {header && (
        <header className="sticky top-0 z-50 bg-white/95 border-b border-slate-200 backdrop-blur-md">
          {header}
        </header>
      )}

      {/* 三栏布局容器 */}
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* 左栏 - 导航与筛选 */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
          className="hidden lg:flex w-60 flex-shrink-0 flex-col bg-white border-r border-slate-200 overflow-y-auto scrollbar-thin"
        >
          {leftSidebar}
        </motion.aside>

        {/* 中栏 - 主内容区 */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {mainContent}
          </div>
        </main>

        {/* 右栏 - 辅助信息 */}
        <motion.aside
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.8, 0.25, 1] }}
          className="hidden xl:flex w-80 flex-shrink-0 flex-col bg-white border-l border-slate-200 overflow-y-auto scrollbar-thin"
        >
          {rightSidebar}
        </motion.aside>
      </div>
    </div>
  );
};

export default OrdersThreeColumnLayout;
