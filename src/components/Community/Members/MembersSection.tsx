import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { communityService } from '@/services/communityService';
import { Crown, User, Shield, MoreHorizontal, MessageCircle } from 'lucide-react';

interface Member {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  is_online?: boolean;
}

interface MembersSectionProps {
  communityId: string;
  isDark?: boolean;
}

export const MembersSection: React.FC<MembersSectionProps> = ({ communityId, isDark: propIsDark }) => {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark ?? themeIsDark;
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [communityId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await communityService.getCommunityMembers(communityId);
      setMembers(data || []);
    } catch (err) {
      setError('获取成员列表失败');
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'moderator':
        return '版主';
      default:
        return '成员';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm`}>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex items-center gap-4 p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-4 w-32 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`} />
                <div className={`h-3 w-20 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 text-center rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm`}>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
        <button
          onClick={fetchMembers}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  const admins = members.filter(m => m.role === 'admin');
  const moderators = members.filter(m => m.role === 'moderator');
  const regularMembers = members.filter(m => m.role === 'member');

  return (
    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm`}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            社区成员
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            共 {members.length} 位成员
          </p>
        </div>
      </div>

      {/* 成员列表 */}
      <div className="space-y-6">
        {/* 管理员 */}
        {admins.length > 0 && (
          <div>
            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              管理员 ({admins.length})
            </h3>
            <div className="space-y-2">
              {admins.map((member) => (
                <MemberCard key={member.id} member={member} isDark={isDark} />
              ))}
            </div>
          </div>
        )}

        {/* 版主 */}
        {moderators.length > 0 && (
          <div>
            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              版主 ({moderators.length})
            </h3>
            <div className="space-y-2">
              {moderators.map((member) => (
                <MemberCard key={member.id} member={member} isDark={isDark} />
              ))}
            </div>
          </div>
        )}

        {/* 普通成员 */}
        {regularMembers.length > 0 && (
          <div>
            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              成员 ({regularMembers.length})
            </h3>
            <div className="space-y-2">
              {regularMembers.map((member) => (
                <MemberCard key={member.id} member={member} isDark={isDark} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface MemberCardProps {
  member: Member;
  isDark: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, isDark }) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'moderator':
        return '版主';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
        isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={member.avatar_url || '/default-avatar.jpg'}
            alt={member.username}
            className="w-12 h-12 rounded-full object-cover"
          />
          {member.is_online && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {member.username}
            </span>
            {getRoleIcon(member.role)}
          </div>
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {getRoleLabel(member.role) || `加入于 ${new Date(member.joined_at).toLocaleDateString()}`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
        </button>
        <button
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
          }`}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
