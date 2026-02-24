/**
 * 动态页面右侧边栏组件
 * 包含热搜、推荐用户、推荐社群、社区中心
 */

import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import type { 
  HotSearchItem, 
  RecommendedUser, 
  RecommendedCommunity,
  CommunityAnnouncement 
} from '@/types/feed';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Sparkles,
  Users,
  MessageSquare,
  ChevronRight,
  Bell,
  Megaphone,
  Gift,
} from 'lucide-react';

interface RightSidebarProps {
  hotSearch: HotSearchItem[];
  recommendedUsers: RecommendedUser[];
  recommendedCommunities: RecommendedCommunity[];
  announcements: CommunityAnnouncement[];
  onFollowUser: (userId: string, isFollowing: boolean) => void;
  onJoinCommunity: (communityId: string, isJoined: boolean) => void;
}

// 热搜趋势图标
function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-3 h-3 text-red-500" />;
    case 'down':
      return <TrendingDown className="w-3 h-3 text-green-500" />;
    default:
      return <Minus className="w-3 h-3 text-gray-400" />;
  }
}

// 获取排名样式
function getRankStyle(rank: number, isDark: boolean) {
  if (rank === 1) return 'text-red-500 font-bold';
  if (rank === 2) return 'text-orange-500 font-bold';
  if (rank === 3) return 'text-yellow-500 font-bold';
  return isDark ? 'text-gray-500' : 'text-gray-400';
}

export function RightSidebar({
  hotSearch,
  recommendedUsers,
  recommendedCommunities,
  announcements,
  onFollowUser,
  onJoinCommunity,
}: RightSidebarProps) {
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      {/* 社区中心卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl overflow-hidden ${
          isDark 
            ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30' 
            : 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100'
        }`}
      >
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-blue-500/20' : 'bg-blue-100'
            }`}>
              <Bell className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                社区中心
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                最新活动与公告
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            {announcements.slice(0, 2).map((announcement) => (
              <div
                key={announcement.id}
                className={`p-3 rounded-xl cursor-pointer transition-colors ${
                  isDark 
                    ? 'bg-gray-900/50 hover:bg-gray-900' 
                    : 'bg-white/70 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {announcement.type === 'activity' ? (
                    <Gift className="w-3.5 h-3.5 text-pink-500" />
                  ) : announcement.type === 'feature' ? (
                    <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                  ) : (
                    <Megaphone className="w-3.5 h-3.5 text-blue-500" />
                  )}
                  <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {announcement.title}
                  </span>
                </div>
                <p className={`text-xs line-clamp-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {announcement.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 热搜榜 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl overflow-hidden ${
          isDark 
            ? 'bg-gray-900 border border-gray-800' 
            : 'bg-white border border-gray-100 shadow-sm'
        }`}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                热搜榜
              </h3>
            </div>
            <button className={`text-xs flex items-center gap-1 transition-colors ${
              isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}>
              查看全部
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        <div className="p-2">
          {hotSearch.slice(0, 10).map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                isDark 
                  ? 'hover:bg-gray-800' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className={`w-5 text-center text-sm ${getRankStyle(item.rank, isDark)}`}>
                {item.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {item.title}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {item.isHot && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    热
                  </span>
                )}
                {item.isNew && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    新
                  </span>
                )}
                <TrendIcon trend={item.trend} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 推荐关注 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-2xl overflow-hidden ${
          isDark 
            ? 'bg-gray-900 border border-gray-800' 
            : 'bg-white border border-gray-100 shadow-sm'
        }`}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              推荐关注
            </h3>
            <button className={`text-xs transition-colors ${
              isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}>
              换一换
            </button>
          </div>
        </div>
        
        <div className="p-3 space-y-3">
          {recommendedUsers.slice(0, 4).map((user) => (
            <div key={user.id} className="flex items-center gap-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {user.name}
                </h4>
                <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {user.bio}
                </p>
              </div>
              <button
                onClick={() => onFollowUser(user.id, !!user.isFollowing)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  user.isFollowing
                    ? isDark
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-gray-100 text-gray-600'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {user.isFollowing ? '已关注' : '关注'}
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 推荐社群 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`rounded-2xl overflow-hidden ${
          isDark 
            ? 'bg-gray-900 border border-gray-800' 
            : 'bg-white border border-gray-100 shadow-sm'
        }`}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            推荐社群
          </h3>
        </div>
        
        <div className="p-3 space-y-3">
          {recommendedCommunities.slice(0, 3).map((community) => (
            <div 
              key={community.id} 
              className={`p-3 rounded-xl transition-colors ${
                isDark 
                  ? 'hover:bg-gray-800' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={community.avatar}
                  alt={community.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {community.name}
                  </h4>
                  <div className={`flex items-center gap-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {community.membersCount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {community.postsCount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onJoinCommunity(community.id, !!community.isJoined)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    community.isJoined
                      ? isDark
                        ? 'bg-gray-800 text-gray-400'
                        : 'bg-gray-100 text-gray-600'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {community.isJoined ? '已加入' : '加入'}
                </button>
              </div>
              <p className={`mt-2 text-xs line-clamp-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {community.description}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 底部链接 */}
      <div className={`flex flex-wrap gap-x-4 gap-y-2 text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
        <a href="#" className="hover:underline">关于我们</a>
        <a href="#" className="hover:underline">联系方式</a>
        <a href="#" className="hover:underline">用户协议</a>
        <a href="#" className="hover:underline">隐私政策</a>
        <a href="#" className="hover:underline">帮助中心</a>
      </div>
    </div>
  );
}
