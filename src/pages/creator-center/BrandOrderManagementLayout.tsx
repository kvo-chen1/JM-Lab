import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import CreatorSidebar from './components/CreatorSidebar';
import BrandOrderManagement from './components/BrandOrderManagement';

export type CreatorTab = 'overview' | 'promotion' | 'monetization' | 'inspiration' | 'analytics';
// 扩展的 Tab 类型，包含带子菜单的导航分组
export type ExtendedCreatorTab = CreatorTab | 'order-monetization';

const BrandOrderManagementLayout: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ExtendedCreatorTab>('order-monetization');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 监听窗口大小变化
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTabChange = (tab: CreatorTab) => {
    setActiveTab(tab);
    
    // 根据 tab 跳转到对应页面
    switch (tab) {
      case 'overview':
        navigate('/creator-center');
        break;
      case 'promotion':
        navigate('/creator-center/promotion');
        break;
      case 'monetization':
        navigate('/creator-center/monetization');
        break;
      case 'inspiration':
        navigate('/creator-center/inspiration');
        break;
      case 'analytics':
        navigate('/creator-center/analytics');
        break;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex">
        {/* 侧边栏 */}
        <CreatorSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isCollapsed={isCollapsed}
          onCollapse={setIsCollapsed}
          isDark={isDark}
          isMobile={isMobile}
        />

        {/* 主内容区 */}
        <main className="flex-1">
          {/* 页面内容 */}
          <div className="h-screen">
            <BrandOrderManagement />
          </div>
        </main>
      </div>
    </div>
  );
};

export default BrandOrderManagementLayout;
