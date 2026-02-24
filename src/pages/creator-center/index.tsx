import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useNavigate } from 'react-router-dom';
import CreatorSidebar from './components/CreatorSidebar';
import CreatorOverview from './components/CreatorOverview';
import HotPromotion from './components/HotPromotion';
import MonetizationCenter from './components/MonetizationCenter';
import InspirationHub from './components/InspirationHub';
import DataAnalytics from './components/DataAnalytics';

export type CreatorTab = 'overview' | 'promotion' | 'monetization' | 'inspiration' | 'analytics';

const validTabs: CreatorTab[] = ['overview', 'promotion', 'monetization', 'inspiration', 'analytics'];

const CreatorCenter: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<CreatorTab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (tab && validTabs.includes(tab as CreatorTab)) {
      setActiveTab(tab as CreatorTab);
    }
  }, [tab]);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <CreatorOverview />;
      case 'promotion':
        return <HotPromotion />;
      case 'monetization':
        return <MonetizationCenter />;
      case 'inspiration':
        return <InspirationHub />;
      case 'analytics':
        return <DataAnalytics />;
      default:
        return <CreatorOverview />;
    }
  };

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
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreatorCenter;
