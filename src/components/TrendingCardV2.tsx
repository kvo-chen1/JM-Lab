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
  Bookmark,
  Share2,
  Flame,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { TrendingTopic } from '@/services/trendingService';

interface TrendingCardV2Props {
  topic: TrendingTopic;
  onParticipate?: (topic: TrendingTopic) => void;
  onBookmark?: (topic: TrendingTopic) => void;
  onShare?: (topic: TrendingTopic) => void;
  layout?: 'compact' | 'comfortable' | 'detailed';
}

/**
 * 热点卡片组件 V2 - 改进版设计
 * 优化点：
 * 1. 更简洁的配色方案 - 使用蓝色系主色调
 * 2. 更清晰的视觉层次
 * 3. 减少信息密度，突出核心内容
 * 4. 更现代的卡片设计
 */
const TrendingCardV2: React.FC<TrendingCardV2Props> = ({
  topic,
  onParticipate,
  onBookmark,
  onShare,
  layout = 'comfortable',
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const formatNumber = (num: number): string => {
    if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return num.toString();
  };

  const getTrendIcon = () => {
    switch (topic.trend) {
      case 'rising':
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
      case 'falling':
        return <TrendingDown className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <Minus className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getRankBadge = () => {
    if (!topic.rank) return null;

    const rankColors = {
      1: 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-amber-500/25',
      2: 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-slate-400/25',
      3: 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-orange-500/25',
    };

    const colorClass = rankColors[topic.rank as keyof typeof rankColors] || (
      isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
    );

    return (
      <div className={`flex items-center justify-center w-7 h-7 rounded-lg font-bold text-sm shadow-lg ${colorClass}`}>
        {topic.rank}
      </div>
    );
  };

  const getHeatLevel = () => {
    const heat = topic.heatValue;
    if (heat > 100000000) return { label: '🔥 爆火', color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' };
    if (heat > 50000000) return { label: '🔥 热门', color: 'text-orange-500 bg-orange-50 dark:bg-orange-500/10' };
    if (heat > 10000000) return { label: '🔥 上升', color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' };
    return { label: '稳定', color: 'text-slate-500 bg-slate-100 dark:bg-slate-700/50' };
  };

  const heatInfo = getHeatLevel();

  if (layout === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className={`group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
          isDark
            ? 'bg-slate-800/80 border-slate-700 hover:border-blue-500/50 hover:bg-slate-800'
            : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10'
        }`}
      >
        <div className="p-3">
          <div className="flex items-center gap-3">
            {getRankBadge()}
            
            {topic.coverImage && (
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                <img src={topic.coverImage} alt={topic.title} className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium text-sm truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                #{topic.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${heatInfo.color}`}>
                  {heatInfo.label}
                </span>
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {formatNumber(topic.viewCount)} 浏览
                </span>
              </div>
            </div>
            
            <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isDark
          ? 'bg-slate-800/80 border-slate-700 hover:border-blue-500/50 hover:bg-slate-800'
          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10'
      }`}
    >
      {/* 顶部渐变条 - 更 subtle */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${
        topic.trend === 'rising' 
          ? 'bg-gradient-to-r from-emerald-400 to-teal-400' 
          : 'bg-gradient-to-r from-blue-400 to-indigo-400'
      }`} />

      <div className="p-4">
        {/* Header: 排名 + 标题 + 热度标签 */}
        <div className="flex items-start gap-3 mb-3">
          {getRankBadge()}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-semibold text-base leading-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                #{topic.title}
              </h3>
              {topic.trend === 'rising' && (
                <Flame className="w-4 h-4 text-rose-500" />
              )}
            </div>
            
            {topic.description && (
              <p className={`text-sm mt-1 line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {topic.description}
              </p>
            )}
          </div>
        </div>

        {/* 封面图 + 核心数据 */}
        <div className="flex gap-4 mb-4">
          {topic.coverImage && (
            <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 relative group/image">
              <img 
                src={topic.coverImage} 
                alt={topic.title} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          )}

          <div className="flex-1 flex flex-col justify-between">
            {/* 热度标签 */}
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${heatInfo.color}`}>
                {heatInfo.label}
              </span>
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={`text-xs font-medium ${
                  topic.growthRate > 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {topic.growthRate > 0 ? '+' : ''}{topic.growthRate}%
                </span>
              </div>
            </div>

            {/* 统计数据 - 更简洁 */}
            <div className="flex items-center gap-4 text-xs">
              <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <Eye className="w-3.5 h-3.5" />
                <span>{formatNumber(topic.viewCount)}</span>
              </div>
              <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <Video className="w-3.5 h-3.5" />
                <span>{formatNumber(topic.videoCount)}</span>
              </div>
              <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <Heart className="w-3.5 h-3.5" />
                <span>{formatNumber(topic.likeCount)}</span>
              </div>
            </div>

            {/* 热度进度条 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>热度</span>
                <span className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  {formatNumber(topic.heatValue)}
                </span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((topic.heatValue / 300000000) * 100, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className={`h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 相关标签 - 更 subtle */}
        {topic.relatedTags && topic.relatedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {topic.relatedTags.slice(0, 3).map((tag, index) => (
              <button
                key={index}
                onClick={() => navigate(`/search?query=${encodeURIComponent(tag)}`)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                #{tag}
              </button>
            ))}
            {topic.relatedTags.length > 3 && (
              <span className={`text-xs px-2 py-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                +{topic.relatedTags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 创作建议 - 可折叠 */}
        {topic.suggestedAngles && topic.suggestedAngles.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium flex-1">AI 创作建议</span>
              <motion.div
                animate={{ rotate: showSuggestions ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4 rotate-90" />
              </motion.div>
            </button>
            
            <motion.div
              initial={false}
              animate={{ height: showSuggestions ? 'auto' : 0, opacity: showSuggestions ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <ul className={`mt-2 space-y-1.5 px-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {topic.suggestedAngles.map((angle, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className={`text-xs mt-0.5 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}>
                      {index + 1}.
                    </span>
                    <span className="flex-1">{angle}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        )}

        {/* 操作按钮 - 更现代的设计 */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onParticipate?.(topic)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            <Video className="w-4 h-4" />
            立即参与
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsBookmarked(!isBookmarked);
              onBookmark?.(topic);
            }}
            className={`p-2.5 rounded-xl transition-all ${
              isBookmarked
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                : isDark
                ? 'bg-slate-700 text-slate-400 hover:text-rose-400 hover:bg-slate-600'
                : 'bg-slate-100 text-slate-500 hover:text-rose-500 hover:bg-rose-50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onShare?.(topic)}
            className={`p-2.5 rounded-xl transition-all ${
              isDark
                ? 'bg-slate-700 text-slate-400 hover:text-blue-400 hover:bg-slate-600'
                : 'bg-slate-100 text-slate-500 hover:text-blue-500 hover:bg-blue-50'
            }`}
          >
            <Share2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default TrendingCardV2;
