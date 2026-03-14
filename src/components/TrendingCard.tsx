import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Video,
  Eye,
  Heart,
  Lightbulb,
  Bookmark,
  Share2,
  Flame,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { TrendingTopic } from '@/services/trendingService';

interface TrendingCardProps {
  topic: TrendingTopic;
  onParticipate?: (topic: TrendingTopic) => void;
  onBookmark?: (topic: TrendingTopic) => void;
  onShare?: (topic: TrendingTopic) => void;
  compact?: boolean;
}

/**
 * 热点卡片组件 - 学习抖音"热点宝"设计
 * 展示热点话题的排名、热度、增长率和创作建议
 */
const TrendingCard: React.FC<TrendingCardProps> = ({
  topic,
  onParticipate,
  onBookmark,
  onShare,
  compact = false,
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = useState(false);

  // 格式化数字
  const formatNumber = (num: number): string => {
    if (num >= 100000000) {
      return (num / 100000000).toFixed(1) + '亿';
    }
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toString();
  };

  // 获取趋势图标
  const getTrendIcon = () => {
    switch (topic.trend) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'falling':
        return <TrendingDown className="w-4 h-4 text-rose-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  // 获取排名样式
  const getRankStyle = () => {
    if (!topic.rank) return null;
    
    if (topic.rank <= 3) {
      return 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30';
    }
    return isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500';
  };

  // 获取趋势标签
  const getTrendLabel = () => {
    if (topic.growthRate > 20) return '🔥 爆火';
    if (topic.growthRate > 10) return '📈 上升';
    if (topic.growthRate > 0) return '📊 稳定';
    return '📉 下降';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, shadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isDark
          ? 'bg-gray-800/50 border-gray-700 hover:border-amber-500/50'
          : 'bg-white border-gray-200 hover:border-amber-400'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      {/* 顶部装饰条 */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 ${topic.trend === 'rising' ? 'opacity-100' : 'opacity-50'}`} />

      {/* 主要内容 */}
      <div className="flex items-start gap-3">
        {/* 排名 */}
        {topic.rank && (
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm flex-shrink-0 ${getRankStyle()}`}>
            {topic.rank}
          </div>
        )}

        {/* 封面图 */}
        {topic.coverImage && (
          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative">
            <img
              src={topic.coverImage}
              alt={topic.title}
              className="w-full h-full object-cover"
            />
            {topic.trend === 'rising' && (
              <div className="absolute top-1 right-1">
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
            )}
          </div>
        )}

        {/* 内容区域 */}
        <div className="flex-1 min-w-0">
          {/* 标题和趋势 */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              #{topic.title}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              {getTrendIcon()}
              <span className={`text-xs font-medium ${
                topic.growthRate > 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {topic.growthRate > 0 ? '+' : ''}{topic.growthRate}%
              </span>
            </div>
          </div>

          {/* 描述 */}
          {topic.description && (
            <p className={`text-xs mb-2 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {topic.description}
            </p>
          )}

          {/* 统计数据 */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatNumber(topic.viewCount)}
            </span>
            <span className="flex items-center gap-1">
              <Video className="w-3 h-3" />
              {formatNumber(topic.videoCount)}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {formatNumber(topic.likeCount)}
            </span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
              topic.trend === 'rising'
                ? 'bg-emerald-500/10 text-emerald-500'
                : topic.trend === 'falling'
                ? 'bg-rose-500/10 text-rose-500'
                : 'bg-gray-500/10 text-gray-500'
            }`}>
              {getTrendLabel()}
            </span>
          </div>

          {/* 相关标签 */}
          {topic.relatedTags && topic.relatedTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {topic.relatedTags.slice(0, 4).map((tag, index) => (
                <button
                  key={index}
                  onClick={() => navigate(`/search?query=${encodeURIComponent(tag)}`)}
                  className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                    isDark
                      ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
              {topic.relatedTags.length > 4 && (
                <span className={`text-[10px] px-2 py-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  +{topic.relatedTags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* AI 创作建议 */}
          {topic.suggestedAngles && topic.suggestedAngles.length > 0 && (
            <div className={`mb-3 p-2 rounded-lg ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-center gap-1 mb-1">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                <span className={`text-xs font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  创作建议
                </span>
              </div>
              <ul className="space-y-1">
                {topic.suggestedAngles.slice(0, 2).map((angle, index) => (
                  <li key={index} className={`text-xs ${isDark ? 'text-amber-300/80' : 'text-amber-800'}`}>
                    {index + 1}. {angle}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onParticipate?.(topic)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              <Video className="w-3.5 h-3.5" />
              立即参与
            </button>
            
            {!compact && (
              <>
                <button
                  onClick={() => {
                    setIsBookmarked(!isBookmarked);
                    onBookmark?.(topic);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isBookmarked
                      ? 'bg-amber-500/20 text-amber-500'
                      : isDark
                      ? 'bg-gray-700 text-gray-400 hover:text-amber-400'
                      : 'bg-gray-100 text-gray-500 hover:text-amber-600'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                </button>
                
                <button
                  onClick={() => onShare?.(topic)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-gray-700 text-gray-400 hover:text-blue-400'
                      : 'bg-gray-100 text-gray-500 hover:text-blue-600'
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 热度条 */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>热度值</span>
          <span className={`font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            {formatNumber(topic.heatValue)}
          </span>
        </div>
        <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((topic.heatValue / 300000000) * 100, 100)}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`h-full rounded-full ${
              topic.trend === 'rising'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : topic.trend === 'falling'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default TrendingCard;
