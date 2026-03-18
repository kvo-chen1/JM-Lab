/**
 * 垂直 Tab 导航组件 - 文创商城左侧导航
 * 用于快速切换不同内容板块
 */
import React from 'react';
import { motion } from 'framer-motion';

export interface TabItemData {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeType?: 'default' | 'hot' | 'new' | 'accent';
}

interface VerticalTabsProps {
  tabs: TabItemData[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const VerticalTabs: React.FC<VerticalTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  console.log('[VerticalTabs] 渲染 Tabs:', tabs.map(t => t.label));

  return (
    <div className={`mp-vertical-tabs ${className}`}>
      {tabs.map((tab, index) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          index={index}
        />
      ))}
    </div>
  );
};

interface TabItemProps {
  tab: TabItemData;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

const TabItem: React.FC<TabItemProps> = ({ tab, isActive, onClick, index }) => {
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`mp-tab-item ${isActive ? 'active' : ''}`}
      type="button"
    >
      <span className="mp-tab-icon">{tab.icon}</span>
      <span className="mp-tab-label">{tab.label}</span>
      {tab.badge && (
        <span className={`mp-tab-badge ${tab.badgeType || 'default'}`}>
          {tab.badge}
        </span>
      )}
    </motion.button>
  );
};

export default VerticalTabs;
