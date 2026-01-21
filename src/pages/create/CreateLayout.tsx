import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

export default function CreateLayout() {
  const { isDark } = useTheme();
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/create', label: '设计工坊', icon: 'layer-group', exact: true },
    { path: '/create/inspiration', label: '灵感探索', icon: 'bolt' },
    { path: '/create/wizard', label: '向导模式', icon: 'hat-wizard' },
    { path: '/create-activity', label: '创建活动', icon: 'calendar-plus', exact: true },
  ];

  // Determine if we are in the main studio (no scroll) or sub-pages (scrollable)
  const isStudio = location.pathname === '/create';

  return (
    <div className={`flex flex-col h-[calc(100vh-64px)] ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Top Navigation Bar - 顶部导航栏 */}
      <div className={`flex items-center justify-between px-6 py-3 border-b flex-shrink-0 z-30 transition-colors duration-300 ${isDark ? 'border-gray-800 bg-gray-900/95 backdrop-blur-sm' : 'border-gray-200 bg-white/95 backdrop-blur-sm'}`}>
        <div className={`flex space-x-1 p-1 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100/80 border-gray-200'}`}>
          {navItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={`
                  px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center space-x-2
                  ${isActive 
                    ? (isDark 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                        : 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5') 
                    : (isDark 
                        ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-700/50' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50')
                  }`}
              >
                <i className={`fas fa-${item.icon} ${isActive ? 'animate-pulse-slow' : ''} text-xs`}></i>
                {/* 移动端隐藏文字，仅显示图标 */}
                <span className="lg:inline hidden">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
        
        {/* Optional: Add some actions on the right if needed, strictly purely layout optimization */}
      </div>

      {/* Content Area */}
      <div className={`flex-1 relative ${isStudio ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <Outlet />
      </div>
    </div>
  );
}
