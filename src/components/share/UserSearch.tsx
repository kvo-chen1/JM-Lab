import { useState, useEffect, useContext, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { Search, User, Check, Loader2, Users, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getFollowingList, getFollowersList } from '@/services/postService';
import type { User as UserType } from '@/types/user';

interface UserSearchProps {
  selectedUser: UserType | null;
  onSelect: (user: UserType) => void;
  onBack: () => void;
  onCancel: () => void;
}

interface FriendWithProfile {
  id: string;
  username: string;
  avatar_url?: string;
  status: string;
}

export function UserSearch({ selectedUser, onSelect, onBack, onCancel }: UserSearchProps) {
  const { isDark } = useTheme();
  const { user: currentUser } = useContext(AuthContext);

  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<FriendWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentChats, setRecentChats] = useState<FriendWithProfile[]>([]);

  // 加载好友列表（互相关注 = 好友）
  useEffect(() => {
    const loadFriends = async () => {
      if (!currentUser?.id) return;

      setIsLoading(true);
      try {
        // 使用与 Friends.tsx 相同的逻辑：互相关注 = 好友
        const [following, followers] = await Promise.all([
          getFollowingList(),
          getFollowersList()
        ]);

        // 计算互相关注的用户（好友）
        const followerIds = new Set(followers.map(u => u.id));
        const mutualFriends = following.filter(user => followerIds.has(user.id));

        const formattedFriends: FriendWithProfile[] = mutualFriends.map(profile => ({
          id: profile.id,
          username: profile.username || '未知用户',
          avatar_url: profile.avatar_url,
          status: 'accepted',
        }));

        setFriends(formattedFriends);

        // 加载最近聊天的好友
        const { data: recentMessages } = await supabase
          .from('direct_messages')
          .select('sender_id, receiver_id, created_at')
          .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
          .order('created_at', { ascending: false })
          .limit(20);

        if (recentMessages) {
          const recentFriendIds = [...new Set(recentMessages.map(msg =>
            msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id
          ))].slice(0, 5);

          const recentFriends = formattedFriends.filter(f => recentFriendIds.includes(f.id));
          setRecentChats(recentFriends);
        }
      } catch (error) {
        console.error('加载好友失败:', error);
        // 如果 API 失败，尝试使用 Supabase 作为备选
        await loadFriendsFromSupabase();
      } finally {
        setIsLoading(false);
      }
    };

    // 备选方案：从 Supabase 加载
    const loadFriendsFromSupabase = async () => {
      try {
        // 获取关注列表
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUser?.id);

        // 获取粉丝列表
        const { data: followersData } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', currentUser?.id);

        const followingIds = new Set(followingData?.map(f => f.following_id) || []);
        const followerIds = new Set(followersData?.map(f => f.follower_id) || []);

        // 计算互相关注
        const mutualIds = [...followingIds].filter(id => followerIds.has(id));

        if (mutualIds.length === 0) {
          setFriends([]);
          return;
        }

        // 获取好友资料
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', mutualIds);

        const formattedFriends: FriendWithProfile[] = profiles?.map(profile => ({
          id: profile.id,
          username: profile.username || '未知用户',
          avatar_url: profile.avatar_url,
          status: 'accepted',
        })) || [];

        setFriends(formattedFriends);
      } catch (error) {
        console.error('从 Supabase 加载好友失败:', error);
        setFriends([]);
      }
    };

    loadFriends();
  }, [currentUser?.id]);

  // 搜索筛选
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFriends(friends);
      return;
    }

    const filtered = friends.filter(friend =>
      friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFriends(filtered);
  }, [friends, searchQuery]);

  const handleSelect = useCallback((friend: FriendWithProfile) => {
    onSelect({
      id: friend.id,
      name: friend.username,
      avatar: friend.avatar_url,
    });
  }, [onSelect]);

  const renderFriendItem = (friend: FriendWithProfile, index: number) => (
    <motion.div
      key={friend.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => handleSelect(friend)}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
        selectedUser?.id === friend.id
          ? 'bg-red-500/10 border-2 border-red-500'
          : isDark
          ? 'bg-gray-700/50 border-2 border-transparent hover:border-gray-600'
          : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
      }`}
    >
      {/* 头像 */}
      {friend.avatar_url ? (
        <img
          src={friend.avatar_url}
          alt={friend.username}
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white font-medium">
          {friend.username.charAt(0).toUpperCase()}
        </div>
      )}

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {friend.username}
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          好友
        </p>
      </div>

      {/* 选中标记 */}
      {selectedUser?.id === friend.id && (
        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          正在加载好友列表...
        </p>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <Users className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        </div>
        <p className={`mt-4 text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          暂无好友
        </p>
        <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          互相关注的用户将成为你的好友
        </p>
        <button
          onClick={onBack}
          className="mt-6 flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        <input
          type="text"
          placeholder="搜索好友..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm transition-all ${
            isDark
              ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 focus:border-red-500'
              : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500'
          } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
        />
      </div>

      {/* 最近聊天 */}
      {!searchQuery && recentChats.length > 0 && (
        <div>
          <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            最近聊天
          </h3>
          <div className="space-y-2">
            {recentChats.map((friend, index) => renderFriendItem(friend, index))}
          </div>
        </div>
      )}

      {/* 全部好友 */}
      <div>
        <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {searchQuery ? `搜索结果 (${filteredFriends.length})` : `全部好友 (${friends.length})`}
        </h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend, index) => renderFriendItem(friend, index))
          ) : (
            <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">未找到匹配的好友</p>
            </div>
          )}
        </div>
      </div>

      {/* 返回按钮 */}
      <button
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        返回上一步
      </button>
    </div>
  );
}

export default UserSearch;
