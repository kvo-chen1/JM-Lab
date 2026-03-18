/**
 * 区块标题组件 V2 - 高级设计版本
 * 包含渐变图标、主标题、副标题、数量徽章、查看更多按钮
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SectionHeaderV2Props {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  count?: number;
  gradient: 'orange' | 'purple' | 'green' | 'gold' | 'blue';
  onViewAll?: () => void;
  showViewAll?: boolean;
}

const gradientMap = {
  orange: {
    bg: 'from-orange-500 to-red-500',
    glow: 'rgba(249, 115, 22, 0.4)',
    shadow: '0 4px 16px rgba(249, 115, 22, 0.3)',
  },
  purple: {
    bg: 'from-purple-500 to-pink-500',
    glow: 'rgba(168, 85, 247, 0.4)',
    shadow: '0 4px 16px rgba(168, 85, 247, 0.3)',
  },
  green: {
    bg: 'from-emerald-500 to-teal-500',
    glow: 'rgba(16, 185, 129, 0.4)',
    shadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
  },
  gold: {
    bg: 'from-amber-500 to-orange-500',
    glow: 'rgba(245, 158, 11, 0.4)',
    shadow: '0 4px 16px rgba(245, 158, 11, 0.3)',
  },
  blue: {
    bg: 'from-sky-500 to-blue-500',
    glow: 'rgba(14, 165, 233, 0.4)',
    shadow: '0 4px 16px rgba(14, 165, 233, 0.3)',
  },
};

const SectionHeaderV2: React.FC<SectionHeaderV2Props> = ({
  title,
  icon,
  subtitle,
  count,
  gradient = 'blue',
  onViewAll,
  showViewAll = true,
}) => {
  const gradientStyle = gradientMap[gradient];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mp-section-header-v2"
    >
      {/* 左侧：图标 + 标题组 */}
      <div className="mp-section-header-left">
        {/* 渐变图标容器 */}
        <div 
          className="mp-section-icon-wrapper"
          style={{
            background: `linear-gradient(135deg, var(--${gradient === 'orange' ? 'orange-500' : gradient === 'purple' ? 'purple-500' : gradient === 'green' ? 'emerald-500' : gradient === 'gold' ? 'amber-500' : 'sky-500'}, var(--${gradient === 'orange' ? 'red-500' : gradient === 'purple' ? 'pink-500' : gradient === 'green' ? 'teal-500' : gradient === 'gold' ? 'orange-500' : 'blue-500'}))`,
            boxShadow: gradientStyle.shadow,
          }}
        >
          <span className="mp-section-icon">{icon}</span>
          {/* 光晕效果 */}
          <div 
            className="mp-section-icon-glow"
            style={{ background: gradientStyle.glow }}
          />
        </div>

        {/* 标题组 */}
        <div className="mp-section-title-group">
          <h2 className="mp-section-title">{title}</h2>
          {subtitle && <p className="mp-section-subtitle">{subtitle}</p>}
        </div>

        {/* 数量徽章 */}
        {count !== undefined && count > 0 && (
          <div className="mp-section-count-badge">
            <span className="mp-section-count-number">{count}</span>
            <span className="mp-section-count-text">件商品</span>
          </div>
        )}
      </div>

      {/* 右侧：查看更多按钮 */}
      {showViewAll && (
        <button
          className="mp-section-more-btn"
          onClick={onViewAll}
        >
          <span>查看更多</span>
          <motion.span
            className="mp-section-arrow-wrapper"
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="mp-section-arrow" />
          </motion.span>
        </button>
      )}
    </motion.div>
  );
};

export default SectionHeaderV2;
