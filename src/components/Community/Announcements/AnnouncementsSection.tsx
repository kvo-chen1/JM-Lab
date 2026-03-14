import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { communityService } from '@/services/communityService';
import { Megaphone, Pin, Calendar, ChevronRight, Bell } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  is_pinned: boolean;
  created_at: string;
  updated_at?: string;
}

interface AnnouncementsSectionProps {
  communityId: string;
  isDark?: boolean;
}

export const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = ({ communityId, isDark: propIsDark }) => {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark ?? themeIsDark;
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [communityId]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await communityService.getCommunityAnnouncements(communityId);
      setAnnouncements(data || []);
    } catch (err) {
      setError('获取公告列表失败');
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm`}>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className={`h-5 w-3/4 rounded mb-3 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`} />
              <div className={`h-4 w-full rounded mb-2 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`} />
              <div className={`h-4 w-2/3 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 text-center rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm`}>
        <Bell className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
        <button
          onClick={fetchAnnouncements}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  const pinnedAnnouncements = announcements.filter(a => a.is_pinned);
  const regularAnnouncements = announcements.filter(a => !a.is_pinned);

  return (
    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm`}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
            <Megaphone className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              社区公告
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              共 {announcements.length} 条公告
            </p>
          </div>
        </div>
      </div>

      {/* 公告列表 */}
      <div className="space-y-4">
        {/* 置顶公告 */}
        {pinnedAnnouncements.length > 0 && (
          <div className="space-y-3">
            <h3 className={`text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
              置顶公告
            </h3>
            {pinnedAnnouncements.map((announcement) => (
              <AnnouncementCard 
                key={announcement.id} 
                announcement={announcement} 
                isDark={isDark} 
                isPinned
              />
            ))}
          </div>
        )}

        {/* 普通公告 */}
        {regularAnnouncements.length > 0 && (
          <div className="space-y-3">
            {pinnedAnnouncements.length > 0 && (
              <h3 className={`text-sm font-semibold uppercase tracking-wider mt-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                历史公告
              </h3>
            )}
            {regularAnnouncements.map((announcement) => (
              <AnnouncementCard 
                key={announcement.id} 
                announcement={announcement} 
                isDark={isDark} 
              />
            ))}
          </div>
        )}

        {/* 空状态 */}
        {announcements.length === 0 && (
          <div className={`text-center py-12 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
            <Bell className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              暂无公告
            </p>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              社区管理员还没有发布公告
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface AnnouncementCardProps {
  announcement: Announcement;
  isDark: boolean;
  isPinned?: boolean;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement, isDark, isPinned }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-5 rounded-xl transition-all duration-200 ${
        isPinned
          ? isDark
            ? 'bg-yellow-500/10 border border-yellow-500/30'
            : 'bg-yellow-50 border border-yellow-200'
          : isDark
            ? 'bg-gray-700/50 hover:bg-gray-700'
            : 'bg-gray-50 hover:bg-gray-100'
      }`}
    >
      {/* 置顶标识 */}
      {isPinned && (
        <div className={`absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
        }`}>
          <Pin className="w-3 h-3" />
          置顶
        </div>
      )}

      {/* 标题 */}
      <h3 className={`text-lg font-semibold mb-3 pr-20 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {announcement.title}
      </h3>

      {/* 内容 */}
      <div className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        {isExpanded ? (
          <div dangerouslySetInnerHTML={{ __html: announcement.content.replace(/\n/g, '<br/>') }} />
        ) : (
          <div className="line-clamp-3">
            {announcement.content}
          </div>
        )}
      </div>

      {/* 展开/收起按钮 */}
      {announcement.content.length > 150 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`text-sm font-medium mb-4 transition-colors ${
            isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          {isExpanded ? '收起' : '展开全文'}
          <ChevronRight className={`w-4 h-4 inline-block ml-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      )}

      {/* 作者和时间 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200/20">
        <div className="flex items-center gap-2">
          <img
            src={announcement.author_avatar || '/default-avatar.jpg'}
            alt={announcement.author_name}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {announcement.author_name}
          </span>
        </div>
        <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <Calendar className="w-3 h-3" />
          {formatDate(announcement.created_at)}
        </div>
      </div>
    </motion.div>
  );
};
