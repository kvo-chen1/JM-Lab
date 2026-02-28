import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import CreatorSidebar, { ExtendedCreatorTab } from './components/CreatorSidebar';
import OrderSquarePage from './components/OrderSquarePage';

export type CreatorTab = 'overview' | 'promotion' | 'monetization' | 'inspiration' | 'analytics';

const OrderSquareLayout: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ExtendedCreatorTab>('order-monetization');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleTabChange = (newTab: CreatorTab) => {
    setActiveTab(newTab);
    navigate(`/creator-center/${newTab}`);
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex">
        {/* 创作者中心内部侧边栏 - 使用 sticky 定位 */}
        <CreatorSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isCollapsed={isSidebarCollapsed}
          onCollapse={setIsSidebarCollapsed}
          isDark={isDark}
          isMobile={isMobile}
        />

        {/* 主内容区域 */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key="order-square"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <OrderSquarePage />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderSquareLayout;
