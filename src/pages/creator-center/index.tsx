import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useNavigate } from 'react-router-dom';
import CreatorSidebar from './components/CreatorSidebar';
import CreatorOverview from './components/CreatorOverview';
import GrowthSystem from './components/GrowthSystem';
import MonetizationCenter from './components/MonetizationCenter';
import InspirationHub from './components/InspirationHub';
import DataAnalytics from './components/DataAnalytics';
import CreatorHeader from './components/CreatorHeader';

export type CreatorTab = 'overview' | 'growth' | 'monetization' | 'inspiration' | 'analytics';

const validTabs: CreatorTab[] = ['overview', 'growth', 'monetization', 'inspiration', 'analytics'];

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
      case 'growth':
        return <GrowthSystem />;
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
    <div className={`fixed inset-0 z-50 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} overflow-hidden`}>
      <CreatorHeader 
        user={user} 
        isDark={isDark}
        onMenuToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <div className="flex h-[calc(100vh-4rem)] mt-16">
        <CreatorSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isCollapsed={isSidebarCollapsed}
          onCollapse={setIsSidebarCollapsed}
          isDark={isDark}
          isMobile={isMobile}
        />

        <main 
          className={`flex-1 overflow-y-auto transition-all duration-300 pt-0 ${
            isSidebarCollapsed ? 'ml-20' : 'ml-64'
          }`}
        >
          <div className="p-6 lg:p-8 pt-6">
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
