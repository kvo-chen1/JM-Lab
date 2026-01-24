import React, { ReactNode, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface CommunityLayoutProps {
  children: ReactNode;
  isDark: boolean;
  sidebar: ReactNode;
  navigation: ReactNode;
  infoSidebar?: ReactNode;
  activeCommunity?: any; // 添加活跃社群信息，用于自定义风格
  search?: string;
  setSearch?: (value: string) => void;
}

export const CommunityLayout: React.FC<CommunityLayoutProps> = ({
  children,
  isDark,
  sidebar,
  navigation,
  infoSidebar,
  activeCommunity,
  search,
  setSearch
}) => {
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
      
      {/* Mobile Community Bar */}
      <div className="md:hidden px-4 py-2 border-b dark:border-gray-700 border-gray-200 overflow-x-auto">
        <div className="flex space-x-3">
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

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
          {sidebar}
      </div>

      {/* 2. Middle Navigation (Channels) - Mobile Optimization */}
      <div className={`fixed inset-y-0 left-0 top-0 z-50 transform transition-transform duration-300 ease-in-out md:transform-none md:static md:block md:left-[72px] ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
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
             <div className="md:hidden h-14 flex items-center px-4 border-b dark:border-gray-700 border-gray-200">
               <button 
                 onClick={() => setMobileNavOpen(!mobileNavOpen)}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
               >
                 <i className="fas fa-list-ul"></i>
                 <span>导航</span>
               </button>
               
               {/* Mobile Search Bar */}
               <div className="ml-3 flex-1 relative">
                 <i className={`fas fa-search absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                 <input
                   placeholder="搜索社群关键词..."
                   value={search}
                   onChange={(e) => setSearch?.(e.target.value)}
                   className={`w-full pl-10 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 shadow-sm'}`}
                 />
               </div>
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
                <div className={`fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${mobileInfoSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ width: '90vw', maxWidth: '400px' }}>
                    {infoSidebar}
                </div>
            </>
        )}
      </main>
    </div>
  );
};
