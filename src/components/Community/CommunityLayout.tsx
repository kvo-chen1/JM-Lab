import React, { ReactNode, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface CommunityLayoutProps {
  children: ReactNode;
  isDark: boolean;
  sidebar: ReactNode;
  navigation: ReactNode;
  infoSidebar?: ReactNode;
  activeCommunity?: any; // 添加活跃社群信息，用于自定义风格
}

export const CommunityLayout: React.FC<CommunityLayoutProps> = ({
  children,
  isDark,
  sidebar,
  navigation,
  infoSidebar,
  activeCommunity
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileInfoSidebarOpen, setMobileInfoSidebarOpen] = useState(false);

  return (
    <div 
      className={`min-h-screen w-full flex flex-col md:flex-row ${isDark ? 'bg-gray-700' : 'bg-white'}`}
      style={{
        '--primary-color': activeCommunity?.theme?.primaryColor || (isDark ? '#3B82F6' : '#3B82F6'),
        '--secondary-color': activeCommunity?.theme?.secondaryColor || (isDark ? '#60A5FA' : '#60A5FA')
      } as React.CSSProperties}
    >
      
      {/* Mobile Header */}
      <div className={`md:hidden h-16 flex items-center justify-between px-4 border-b z-50 sticky top-0 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} shadow-sm`}>
        {/* 如果有社群主题色，应用到移动端头部 */}
        {activeCommunity?.theme?.primaryColor && (
          <style jsx>{`
            .mobile-header-button.active {
              background-color: ${activeCommunity.theme.primaryColor} !important;
              color: white !important;
            }
          `}</style>
        )}
        <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -ml-2 rounded-lg hover:bg-gray-200/20 dark:hover:bg-gray-700/50 transition-colors">
                <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
            </button>
            <span className="font-bold text-base">创作社群</span>
        </div>
        <div className="flex items-center gap-3">
             <button className="p-2 rounded-lg hover:bg-gray-200/20 dark:hover:bg-gray-700/50 transition-colors">
               <i className="fas fa-search text-base"></i>
             </button>
             {/* 移动端信息侧边栏切换按钮 */}
             {infoSidebar && (
               <button onClick={() => setMobileInfoSidebarOpen(!mobileInfoSidebarOpen)} className="p-2 rounded-lg hover:bg-gray-200/20 dark:hover:bg-gray-700/50 transition-colors">
                 <i className="fas fa-info-circle text-base"></i>
               </button>
             )}
             <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-medium">
               {""}
             </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden fixed inset-0 bg-black/50 z-40"
            />
        )}
        {mobileNavOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileNavOpen(false)}
                className="md:hidden fixed inset-0 bg-black/50 z-40"
            />
        )}
        {mobileInfoSidebarOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileInfoSidebarOpen(false)}
                className="md:hidden fixed inset-0 bg-black/50 z-40"
            />
        )}
      </AnimatePresence>

      {/* 1. Far Left Sidebar (Servers) */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:transform-none md:static md:block ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          {sidebar}
      </div>

      {/* 2. Middle Navigation (Channels) - Mobile Optimization */}
      <div className={`fixed inset-y-0 left-0 top-16 z-50 transform transition-transform duration-300 ease-in-out md:transform-none md:static md:block md:left-[72px] ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
         {navigation}
      </div>

      {/* 3. Main Content Area */}
      <main 
        className={`flex-1 min-h-screen transition-all duration-300 w-full lg:w-auto flex`}
      >
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={`h-full ${isDark ? 'bg-gray-700' : 'bg-white'} min-h-[calc(100vh-64px)] lg:min-h-screen flex-1`}
        >
             {/* Mobile Navigation Toggle */}
             <div className="md:hidden h-14 flex items-center px-4 border-b dark:border-gray-700 border-gray-200">
               <button 
                 onClick={() => setMobileNavOpen(!mobileNavOpen)}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
               >
                 <i className="fas fa-list-ul"></i>
                 <span>导航</span>
               </button>
             </div>
             {children}
        </motion.div>

        {/* 4. Right Info Sidebar (Optional) - Responsive Design */}
        {infoSidebar && (
            <>
                {/* Desktop Sidebar */}
                <div className="hidden lg:block">
                    {infoSidebar}
                </div>
                {/* Mobile Sidebar */}
                <div className={`fixed inset-y-0 right-0 top-16 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${mobileInfoSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ width: '90vw', maxWidth: '400px' }}>
                    {infoSidebar}
                </div>
            </>
        )}
      </main>
    </div>
  );
};
