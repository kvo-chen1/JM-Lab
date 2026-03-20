import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

export interface CommunityTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isDark: boolean;
}

const CommunityTabs: React.FC<CommunityTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  isDark
}) => {
  return (
    <div 
      className={`
        flex border-b
        ${isDark ? 'border-slate-700/50' : 'border-slate-200'}
        px-2
      `}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        // 安全处理：如果 Icon 未定义，使用空组件
        const SafeIcon = Icon || (() => null);
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center gap-2 px-5 py-4 font-medium
              transition-all duration-300
              mx-1 rounded-t-xl
              ${isActive
                ? isDark 
                  ? 'text-indigo-400 bg-slate-800/50' 
                  : 'text-indigo-600 bg-indigo-50/50'
                : isDark 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
              }
            `}
          >
            <motion.div
              initial={false}
              animate={{ scale: isActive ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <SafeIcon size={18} />
            </motion.div>
            
            <span>{tab.label}</span>
            
            {tab.count !== undefined && tab.count > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`
                  px-2 py-0.5 rounded-full text-xs font-semibold
                  ${isActive
                    ? isDark 
                      ? 'bg-indigo-500/20 text-indigo-300' 
                      : 'bg-indigo-100 text-indigo-700'
                    : isDark 
                      ? 'bg-slate-700 text-slate-300' 
                      : 'bg-slate-200 text-slate-600'
                  }
                `}
              >
                {tab.count > 99 ? '99+' : tab.count}
              </motion.span>
            )}
            
            {/* 激活状态下划线 */}
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className={`
                  absolute bottom-0 left-2 right-2 h-0.5 rounded-full
                  ${isDark ? 'bg-indigo-400' : 'bg-indigo-600'}
                `}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 30 
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CommunityTabs;
