import React, { ReactNode, useState, memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NotificationCenter } from './Notification/NotificationCenter';

interface CommunityLayoutProps {
  children: ReactNode;
  isDark: boolean;
  sidebar: ReactNode;
  navigation: ReactNode;
  infoSidebar?: ReactNode;
  activeCommunity?: any;
  search?: string;
  setSearch?: (value: string) => void;
  user?: any;
  unreadNotificationCount?: number;
}

export const CommunityLayout: React.FC<CommunityLayoutProps> = memo(({
  children,
  isDark,
  sidebar,
  navigation,
  infoSidebar,
  activeCommunity,
  search,
  setSearch,
  user,
  unreadNotificationCount = 0
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileInfoSidebarOpen, setMobileInfoSidebarOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  const containerStyle = useMemo(() => ({
    '--primary-color': activeCommunity?.theme?.primaryColor || (isDark ? '#3B82F6' : '#3B82F6'),
    '--secondary-color': activeCommunity?.theme?.secondaryColor || (isDark ? '#60A5FA' : '#60A5FA')
  } as React.CSSProperties), [activeCommunity, isDark]);

  return (
    <div 
      className={`min-h-screen w-full flex flex-col md:flex-row ${isDark ? 'bg-gray-700' : 'bg-white'}`}
      style={containerStyle}
    >
      
      {/* Mobile Community Bar */}
      <div className="md:hidden px-4 py-3 border-b dark:border-gray-700 border-gray-200 overflow-x-auto">
        <div className="flex space-x-4">
          {sidebar}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileNavOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileNavOpen(false)}
                className="md:hidden fixed inset-0 bg-black/50 z-40"
            />
        )}
        {mobileInfoSidebarOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileInfoSidebarOpen(false)}
                className="md:hidden fixed inset-0 bg-black/50 z-40"
            />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
          {sidebar}
      </div>

      {/* 2. Middle Navigation (Channels) - Mobile Optimization */}
      <div className={`fixed inset-y-0 left-0 top-16 z-90 transform transition-transform duration-300 ease-in-out md:transform-none md:static md:block md:left-[72px] md:top-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
         {navigation}
      </div>

      {/* 3. Main Content Area */}
      <main 
        className={`flex-1 min-h-screen transition-all duration-300 w-full lg:w-auto flex overflow-x-hidden`}
      >
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={`h-full ${isDark ? 'bg-gray-700' : 'bg-white'} min-h-[calc(100vh-64px)] lg:min-h-screen flex-1 w-full max-w-full`}
        >
             {/* Mobile Navigation Toggle */}
             <div className="md:hidden h-16 flex items-center justify-between px-4 border-b dark:border-gray-700 border-gray-200">
               <div className="flex items-center space-x-3">
                 <button 
                   onClick={() => setMobileNavOpen(!mobileNavOpen)}
                   className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                   aria-label="打开导航"
                 >
                   <i className="fas fa-bars text-lg"></i>
                 </button>
                 
                 <h1 className="text-lg font-semibold">{activeCommunity?.name || '津脉社区'}</h1>
               </div>
               
               <div className="flex items-center space-x-3">
                 {/* 通知按钮 */}
                 <button 
                   onClick={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
                   className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} relative`}
                   aria-label="打开通知"
                 >
                   <i className="fas fa-bell text-lg"></i>
                   {/* 通知徽章 */}
                   {unreadNotificationCount > 0 && (
                     <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                       {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                     </span>
                   )}
                 </button>
                 
                 {infoSidebar && (
                   <button 
                     onClick={() => setMobileInfoSidebarOpen(!mobileInfoSidebarOpen)}
                     className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                     aria-label="打开信息侧边栏"
                   >
                     <i className="fas fa-info-circle text-lg"></i>
                   </button>
                 )}
               </div>
             </div>
             
             {/* Mobile Search Bar */}
             <div className="md:hidden px-4 py-3 border-b dark:border-gray-700 border-gray-200">
               <div className="relative">
                 <i className={`fas fa-search absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                 <input
                   placeholder="搜索社群关键词..."
                   value={search}
                   onChange={(e) => setSearch?.(e.target.value)}
                   className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 shadow-sm'}`}
                 />
               </div>
             </div>
             
             {children}
        </motion.div>

        {/* 4. Right Info Sidebar (Optional) - Responsive Design */}
        {infoSidebar && (
            <>
                {/* Desktop Sidebar */}
                <div className="hidden md:block">
                    {infoSidebar}
                </div>
                {/* Mobile Sidebar */}
                <div className={`fixed inset-y-0 right-0 top-16 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${mobileInfoSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ width: '90vw', maxWidth: '400px' }}>
                    {infoSidebar}
                </div>
            </>
        )}
      </main>

      {/* 通知中心 */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        isDark={isDark}
        userId={user?.id || ''}
      />
    </div>
  );
});

// 添加displayName便于调试
CommunityLayout.displayName = 'CommunityLayout';
