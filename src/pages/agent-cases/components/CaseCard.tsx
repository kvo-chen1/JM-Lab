// 案例卡片组件

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AgentCase } from '../types';
import { Heart, Eye } from 'lucide-react';

interface CaseCardProps {
  caseData: AgentCase;
  index?: number;
  onClick?: () => void;
  onAuthorClick?: (e: React.MouseEvent) => void;
}

export const CaseCard: React.FC<CaseCardProps> = ({
  caseData,
  index = 0,
  onClick,
  onAuthorClick,
}) => {
  const { isDark } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? '刚刚' : `${minutes}分钟前`;
      }
      return `${hours}小时前`;
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else if (days < 30) {
      return `${Math.floor(days / 7)}周前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`
        group relative rounded-2xl overflow-hidden cursor-pointer
        transition-shadow duration-300
        ${isDark 
          ? 'bg-[#1a1f1a] shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30' 
          : 'bg-white shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-300/50'
        }
      `}
    >
      {/* 图片区域 */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800">
        {/* 加载占位 */}
        {!imageLoaded && !imageError && (
          <div className={`
            absolute inset-0 flex items-center justify-center
            ${isDark ? 'bg-[#1a1f1a]' : 'bg-gray-100'}
          `}>
            <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* 错误状态 */}
        {imageError && (
          <div className={`
            absolute inset-0 flex items-center justify-center
            ${isDark ? 'bg-[#1a1f1a]' : 'bg-gray-100'}
          `}>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-400 text-xl">🖼️</span>
              </div>
              <span className="text-xs text-gray-400">加载失败</span>
            </div>
          </div>
        )}

        {/* 图片 */}
        <img
          src={caseData.coverImage}
          alt={caseData.title}
          className={`
            w-full h-full object-cover
            transition-transform duration-500 ease-out
            group-hover:scale-105
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          loading="lazy"
        />

        {/* 悬停遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className={`
            absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
            flex items-end justify-between p-4
          `}
        >
          <div className="flex items-center gap-3 text-white">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">{caseData.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">{caseData.views}</span>
            </div>
          </div>
        </motion.div>

        {/* 标签 */}
        {caseData.tags.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {caseData.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="
                  px-2 py-0.5 rounded-full text-xs font-medium
                  bg-black/40 backdrop-blur-sm text-white
                "
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {/* 标题 */}
        <h3 className={`
          font-semibold text-base mb-3 line-clamp-1
          ${isDark ? 'text-gray-100' : 'text-gray-900'}
        `}>
          {caseData.title}
        </h3>

        {/* 作者信息 */}
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-2"
            onClick={onAuthorClick}
          >
            {caseData.author.avatar ? (
              <img
                src={caseData.author.avatar}
                alt={caseData.author.name}
                className="w-6 h-6 rounded-full object-cover ring-2 ring-transparent hover:ring-primary-400 transition-all"
              />
            ) : (
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                ${isDark 
                  ? 'bg-gradient-to-br from-gray-700 to-gray-600 text-gray-300' 
                  : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600'
                }
              `}>
                {caseData.author.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className={`
              text-sm truncate max-w-[100px]
              ${isDark ? 'text-gray-400' : 'text-gray-600'}
            `}>
              {caseData.author.name}
            </span>
          </div>

          {/* 发布时间 */}
          <span className={`
            text-xs
            ${isDark ? 'text-gray-500' : 'text-gray-400'}
          `}>
            {formatDate(caseData.createdAt)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default CaseCard;
