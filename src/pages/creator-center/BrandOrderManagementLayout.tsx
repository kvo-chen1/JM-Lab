import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import CreatorSidebar from './components/CreatorSidebar';
import BrandOrderManagement from './components/BrandOrderManagement';

export type CreatorTab = 'overview' | 'promotion' | 'monetization' | 'inspiration' | 'analytics';
// 扩展的 Tab 类型，包含带子菜单的导航分组
export type ExtendedCreatorTab = CreatorTab | 'order-monetization';

const BrandOrderManagementLayout: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
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
          {/* 顶部导航栏 */}
          <header className={`sticky top-0 z-40 border-b ${
            isDark 
              ? 'bg-gray-900/80 border-gray-800 backdrop-blur-md' 
              : 'bg-white/80 border-gray-200 backdrop-blur-md'
          }`}>
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  品牌方商单管理
                </h1>
              </div>
              
              {/* 用户信息 */}
              <div className="flex items-center gap-3">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user?.email}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {user?.email?.[0].toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* 页面内容 */}
          <div className="h-[calc(100vh-73px)]">
            <BrandOrderManagement />
          </div>
        </main>
      </div>
    </div>
  );
};

export default BrandOrderManagementLayout;
