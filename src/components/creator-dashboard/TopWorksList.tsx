import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { WorkPerformance } from '@/services/creatorDashboardService';
import { 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
  Image as ImageIcon,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TopWorksListProps {
  works: WorkPerformance[];
  loading?: boolean;
}

const TopWorksList: React.FC<TopWorksListProps> = ({ works, loading }) => {
  const { isDark } = useTheme();

  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
      case 'down':
        return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
      default:
        return <Minus className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-100'
      } shadow-sm`}>
        <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className={`p-4 rounded-xl animate-pulse ${
                isDark ? 'bg-slate-700/50' : 'bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`} />
                <div className="flex-1">
                  <div className={`h-4 w-32 rounded ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`} />
                  <div className={`h-3 w-24 rounded mt-2 ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (works.length === 0) {
    return (
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-100'
      } shadow-sm`}>
        <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          热门作品
        </h3>
        <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>暂无作品数据</p>
          <Link 
            to="/create"
            className="inline-block mt-4 text-sm text-blue-500 hover:text-blue-600"
          >
            立即创作 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-100'
      } shadow-sm`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
          热门作品
        </h3>
        <Link 
          to="/my-works"
          className={`flex items-center gap-1 text-sm ${
            isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'
          }`}
        >
          查看全部
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {works.map((work, index) => (
          <motion.div
            key={work.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`group p-4 rounded-xl transition-colors cursor-pointer ${
              isDark 
                ? 'bg-slate-700/30 hover:bg-slate-700/50' 
                : 'bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <Link to={`/work/${work.id}`} className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-12 h-12 rounded-lg overflow-hidden ${
                  isDark ? 'bg-slate-600' : 'bg-slate-200'
                }`}>
                  {work.thumbnail ? (
                    <img 
                      src={work.thumbnail} 
                      alt={work.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className={`w-6 h-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </div>
                  )}
                </div>
                <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  index < 3
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                    : isDark
                    ? 'bg-slate-600 text-slate-400'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {index + 1}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className={`font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {work.title}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Eye className="w-3 h-3" />
                    {formatNumber(work.views)}
                  </span>
                  <span className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Heart className="w-3 h-3" />
                    {formatNumber(work.likes)}
                  </span>
                  <span className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <MessageCircle className="w-3 h-3" />
                    {formatNumber(work.comments)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getTrendIcon(work.trend)}
                <span className={`text-xs font-medium ${
                  work.trend === 'up' ? 'text-emerald-500' : 
                  work.trend === 'down' ? 'text-red-500' : 
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {work.engagement.toFixed(1)}%
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default TopWorksList;
