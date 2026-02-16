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
      <div className={`fixed inset-y-0 left-0 top-16 z-50 transform transition-transform duration-300 ease-in-out md:transform-none md:static md:block md:left-[72px] md:top-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
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
             {/* Mobile Header - 简约风格 */}
             <div className="md:hidden">
               {activeCommunity ? (
                 // 在社群详情页显示简约头部
                 <div className="h-14 flex items-center justify-between px-4 border-b dark:border-gray-700/50 border-gray-200/80 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 sticky top-0 z-30">
                   <div className="flex items-center gap-3">
                     <motion.button 
                       whileTap={{ scale: 0.9 }}
                       onClick={() => setMobileNavOpen(!mobileNavOpen)}
                       className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                     >
                       <i className="fas fa-bars text-base"></i>
                     </motion.button>
                     <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                       {activeCommunity?.name || '津脉社区'}
                     </h1>
                   </div>
                   
                   <div className="flex items-center gap-2">
                     <motion.button 
                       whileTap={{ scale: 0.9 }}
                       onClick={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
                       className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 relative"
                     >
                       <i className="fas fa-bell text-base"></i>
                       {unreadNotificationCount > 0 && (
                         <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">
                           {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                         </span>
                       )}
                     </motion.button>
                   </div>
                 </div>
               ) : null}
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
