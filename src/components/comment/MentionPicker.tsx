import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Search, User, Loader2 } from 'lucide-react';
import { getFollowingList, getFollowersList } from '@/services/postService';

interface MentionUser {
  id: string;
  username: string;
  avatar_url?: string;
}

interface MentionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: MentionUser) => void;
  searchQuery: string;
}

export function MentionPicker({ isOpen, onClose, onSelect, searchQuery }: MentionPickerProps) {
  const { isDark } = useTheme();
  const [friends, setFriends] = useState<MentionUser[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<MentionUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // 加载好友列表
  useEffect(() => {
    const loadFriends = async () => {
      setIsLoading(true);
      try {
        // 获取互相关注的好友
        const [following, followers] = await Promise.all([
          getFollowingList(),
          getFollowersList()
        ]);

        const followerIds = new Set(followers.map(u => u.id));
        const mutualFriends = following.filter(user => followerIds.has(user.id));

        const formattedFriends: MentionUser[] = mutualFriends.map(profile => ({
          id: profile.id,
          username: profile.username || '未知用户',
          avatar_url: profile.avatar_url,
        }));

        setFriends(formattedFriends);
      } catch (error) {
        console.error('加载好友失败:', error);
        setFriends([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  // 根据搜索词筛选好友
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

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSelect = useCallback((friend: MentionUser) => {
    onSelect(friend);
    onClose();
  }, [onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`absolute bottom-full left-0 mb-2 w-72 rounded-xl shadow-2xl overflow-hidden z-50 ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}
    >
      {/* 搜索框 */}
      <div className={`p-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          isDark ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <Search className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {searchQuery ? `搜索: "${searchQuery}"` : '选择要@的好友'}
          </span>
        </div>
      </div>

      {/* 好友列表 */}
      <div className="max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              加载中...
            </span>
          </div>
        ) : filteredFriends.length > 0 ? (
          <div className="p-2">
            {filteredFriends.map((friend, index) => (
              <motion.button
                key={friend.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleSelect(friend)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left ${
                  isDark
                    ? 'hover:bg-gray-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                {friend.avatar_url ? (
                  <img
                    src={friend.avatar_url}
                    alt={friend.username}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    isDark ? 'bg-gradient-to-br from-blue-500 to-purple-500' : 'bg-gradient-to-br from-blue-400 to-purple-400'
                  }`}>
                    {friend.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {friend.username}
                </span>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <User className={`w-10 h-10 mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchQuery ? '未找到匹配的好友' : '暂无好友'}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default MentionPicker;
