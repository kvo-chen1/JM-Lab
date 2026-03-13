import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Input, Button, HamsterWheelLoader } from '@/components/ui';
import { MessageSquare, UserPlus, UserMinus, MessageCircle, Users, Heart, UserCheck } from 'lucide-react';
import { getFollowingList, getFollowersList, followUser, unfollowUser } from '@/services/postService';
import { getConversations, getUnreadMessageCounts, Conversation } from '@/services/messageService';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  avatar_url: string;
  bio?: string;
}

const FriendsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState<'following' | 'followers' | 'friends' | 'messages'>('following');
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [chatList, setChatList] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // 计算好友列表（互相关注 = 我关注的人 ∩ 关注我的人）
  const friendsList = useMemo(() => {
    const followerIds = new Set(followersList.map(u => u.id));
    return followingList.filter(user => followerIds.has(user.id));
  }, [followingList, followersList]);

  // 加载数据
  useEffect(() => {
    if (activeTab === 'following') {
      loadFollowingList();
    } else if (activeTab === 'followers') {
      loadFollowersList();
    } else if (activeTab === 'friends') {
      // 好友需要同时加载关注和粉丝列表
      loadFriendsData();
    } else if (activeTab === 'messages') {
      loadChatList();
    }
  }, [activeTab]);

  // 当在私信标签页时，定期刷新列表
  useEffect(() => {
    if (activeTab !== 'messages') return;
    
    // 立即刷新一次
    loadChatList();
    
    // 每5秒刷新一次
    const interval = setInterval(() => {
      loadChatList();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeTab, currentUser?.id]);

  // 加载关注列表
  const loadFollowingList = async () => {
    setLoading(true);
    try {
      const list = await getFollowingList();
      setFollowingList(list);
    } catch (error: any) {
      console.error('加载关注列表失败:', error);
      toast.error('加载关注列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载粉丝列表
  const loadFollowersList = async () => {
    setLoading(true);
    try {
      const list = await getFollowersList();
      setFollowersList(list);
    } catch (error: any) {
      console.error('加载粉丝列表失败:', error);
      toast.error('加载粉丝列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载好友数据（同时加载关注和粉丝）
  const loadFriendsData = async () => {
    setLoading(true);
    try {
      const [following, followers] = await Promise.all([
        getFollowingList(),
        getFollowersList()
      ]);
      setFollowingList(following);
      setFollowersList(followers);
    } catch (error: any) {
      console.error('加载好友数据失败:', error);
      toast.error('加载好友数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载私信列表
  const loadChatList = async () => {
    console.log('[Friends] loadChatList 被调用, currentUser:', currentUser?.id);
    if (!currentUser?.id) {
      console.log('[Friends] 用户未登录，不加载私信列表');
      return;
    }

    setLoading(true);
    try {
      // 获取未读消息数
      const counts = await getUnreadMessageCounts(currentUser.id);
      console.log('[Friends] 未读消息数:', counts);
      setUnreadCounts(counts);

      // 获取会话列表（包含最后一条消息预览）
      const conversations = await getConversations(currentUser.id);
      console.log('[Friends] 会话列表:', conversations);
      setChatList(conversations);
    } catch (error: any) {
      console.error('加载私信列表失败:', error);
      toast.error('加载私信列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 取消关注
  const handleUnfollow = async (userId: string) => {
    try {
      await unfollowUser(currentUser?.id || '', userId);
      toast.success('已取消关注');
      if (activeTab === 'friends') {
        loadFriendsData();
      } else {
        loadFollowingList();
      }
    } catch (error: any) {
      toast.error('操作失败');
    }
  };

  // 回关
  const handleFollowBack = async (userId: string) => {
    try {
      await followUser(currentUser?.id || '', userId);
      toast.success('关注成功');
      loadFollowersList();
    } catch (error: any) {
      toast.error('操作失败');
    }
  };

  // 跳转到用户主页
  const goToUserProfile = (userId: string) => {
    navigate(`/author/${userId}`);
  };

  // 跳转到私信页面
  const goToChat = (userId: string) => {
    navigate(`/chat/${userId}`);
  };

  // 渲染用户卡片 - 移动端优化版
  const renderUserCard = (user: User, isFollowing: boolean, isFriend: boolean = false) => (
    <motion.div
      key={user.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className="md:hidden"
    >
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        {/* 头像 */}
        <div 
          className="relative flex-shrink-0"
          onClick={() => goToUserProfile(user.id)}
        >
          <img
            src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
            alt={user.username}
            className="w-14 h-14 rounded-full object-cover bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 ring-2 ring-white dark:ring-gray-700 shadow-md"
          />
          {isFriend && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
              <UserCheck className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        
        {/* 用户信息 */}
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => goToUserProfile(user.id)}
        >
          <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
            {user.username || '未知用户'}
          </h3>
          {user.bio ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
              {user.bio}
            </p>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              {isFriend ? '互相关注' : isFollowing ? '已关注' : '关注了你'}
            </p>
          )}
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => goToChat(user.id)}
            className="w-9 h-9 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </motion.button>
          
          {activeTab === 'followers' && !isFollowing ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleFollowBack(user.id)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-medium shadow-md shadow-violet-500/25"
            >
              回关
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleUnfollow(user.id)}
              className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {isFriend ? '解除' : '取消'}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );

  // 渲染用户卡片 - PC端原版
  const renderUserCardDesktop = (user: User, isFollowing: boolean, isFriend: boolean = false) => (
    <Card key={user.id} className="hidden md:block p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer flex-1"
          onClick={() => goToUserProfile(user.id)}
        >
          <img
            src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
            alt={user.username}
            className="w-12 h-12 rounded-full object-cover bg-gray-100"
          />
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">
              {user.username || '未知用户'}
            </h3>
            {user.bio && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                {user.bio}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="small" 
            variant="secondary"
            onClick={() => goToChat(user.id)}
            title="发私信"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            私信
          </Button>
          {isFriend ? (
            <Button 
              size="small" 
              variant="danger"
              onClick={() => handleUnfollow(user.id)}
            >
              <UserMinus className="w-4 h-4 mr-1" />
              解除好友
            </Button>
          ) : activeTab === 'following' ? (
            <Button 
              size="small" 
              variant="danger"
              onClick={() => handleUnfollow(user.id)}
            >
              <UserMinus className="w-4 h-4 mr-1" />
              取消关注
            </Button>
          ) : (
            <Button 
              size="small"
              onClick={() => handleFollowBack(user.id)}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              回关
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  // 渲染聊天预览卡片 - 移动端优化版
  const renderChatCard = (chat: Conversation) => {
    const isLastMessageFromMe = chat.lastSenderId === currentUser?.id;
    const hasUnread = chat.unreadCount > 0;

    return (
      <motion.div
        key={chat.userId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => goToChat(chat.userId)}
        className="md:hidden"
      >
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors">
          {/* 头像 */}
          <div className="relative flex-shrink-0">
            <img
              src={chat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.userId}`}
              alt={chat.username}
              className="w-14 h-14 rounded-full object-cover bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 ring-2 ring-white dark:ring-gray-700 shadow-md"
            />
            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
              </span>
            )}
          </div>
          
          {/* 消息内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className={`font-semibold truncate ${hasUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                {chat.username || '未知用户'}
              </h3>
              {chat.lastMessageTime && (
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                  {formatTime(chat.lastMessageTime)}
                </span>
              )}
            </div>
            <p className={`text-sm truncate ${hasUnread ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
              {isLastMessageFromMe ? (
                <span className="text-gray-400">我: </span>
              ) : hasUnread ? (
                <span className="text-violet-500"></span>
              ) : null}
              {chat.lastMessage || '暂无消息'}
            </p>
          </div>
          
          {/* 未读指示器 */}
          {hasUnread && (
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex-shrink-0" />
          )}
        </div>
      </motion.div>
    );
  };

  // 格式化时间
  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 今天
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }
    
    // 一周内
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ['日', '一', '二', '三', '四', '五', '六'];
      return `周${days[date.getDay()]}`;
    }
    
    // 更早
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  };

  // 渲染聊天预览卡片 - PC端原版
  const renderChatCardDesktop = (chat: Conversation) => {
    const isLastMessageFromMe = chat.lastSenderId === currentUser?.id;
    const hasUnread = chat.unreadCount > 0;

    return (
      <Card
        key={chat.userId}
        className="hidden md:block p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => goToChat(chat.userId)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={chat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.userId}`}
              alt={chat.username}
              className="w-12 h-12 rounded-full object-cover bg-gray-100"
            />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {chat.unreadCount}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {chat.username || '未知用户'}
              </h3>
              {chat.lastMessageTime && (
                <span className="text-xs text-gray-400">
                  {new Date(chat.lastMessageTime).toLocaleDateString()}
                </span>
              )}
            </div>
            <p className={`text-sm truncate ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
              {isLastMessageFromMe ? '我: ' : ''}{chat.lastMessage || '暂无消息'}
            </p>
          </div>
        </div>
      </Card>
    );
  };

  // Tab 配置
  const tabs = [
    { id: 'following' as const, label: '关注', icon: Heart, count: followingList.length, color: 'from-pink-500 to-rose-500' },
    { id: 'followers' as const, label: '粉丝', icon: Users, count: followersList.length, color: 'from-blue-500 to-cyan-500' },
    { id: 'friends' as const, label: '好友', icon: UserCheck, count: friendsList.length, color: 'from-violet-500 to-purple-500' },
    { id: 'messages' as const, label: '私信', icon: MessageCircle, count: Object.values(unreadCounts).reduce((a, b) => a + b, 0), color: 'from-emerald-500 to-teal-500', isUnread: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      {/* 移动端头部 - 现代简约风格 */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="px-4 pt-12 pb-6">
          {/* 标题区域 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">我的社交</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理你的关注、粉丝和私信</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          
          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-3">
            {tabs.slice(0, 3).map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`p-3 rounded-2xl text-center transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r ' + tab.color + ' text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                <tab.icon className={`w-5 h-5 mx-auto mb-1 ${activeTab === tab.id ? 'text-white' : ''}`} />
                <div className="text-lg font-bold">{tab.count}</div>
                <div className="text-xs opacity-80">{tab.label}</div>
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Tab 切换 - 私信单独显示 */}
        <div className="px-4 pb-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
              activeTab === 'messages'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeTab === 'messages' ? 'bg-white/20' : 'bg-emerald-100 dark:bg-emerald-900/30'
              }`}>
                <MessageCircle className={`w-5 h-5 ${activeTab === 'messages' ? 'text-white' : 'text-emerald-500'}`} />
              </div>
              <div className="text-left">
                <div className="font-semibold">私信消息</div>
                <div className={`text-xs ${activeTab === 'messages' ? 'text-white/80' : 'text-gray-500'}`}>
                  {tabs[3].count > 0 ? `${tabs[3].count} 条未读` : '暂无新消息'}
                </div>
              </div>
            </div>
            {tabs[3].count > 0 && (
              <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {tabs[3].count > 9 ? '9+' : tabs[3].count}
              </span>
            )}
          </motion.button>
        </div>
      </div>

      {/* PC端头部 - 保持原版 */}
      <div className="hidden md:block container mx-auto p-4 max-w-4xl">
        <div className="flex flex-col gap-6">
          {/* 页面标题 */}
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">我的社交</h1>
            <p className="text-gray-600 dark:text-gray-400">管理你的关注、粉丝、好友和私信</p>
          </div>

          {/* 标签页切换 */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={`flex items-center gap-2 py-3 px-6 font-medium text-sm ${activeTab === 'following' 
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}
              onClick={() => setActiveTab('following')}
            >
              <Heart className="w-4 h-4" />
              我的关注
              {followingList.length > 0 && (
                <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {followingList.length}
                </span>
              )}
            </button>
            <button
              className={`flex items-center gap-2 py-3 px-6 font-medium text-sm ${activeTab === 'followers' 
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}
              onClick={() => setActiveTab('followers')}
            >
              <Users className="w-4 h-4" />
              我的粉丝
              {followersList.length > 0 && (
                <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {followersList.length}
                </span>
              )}
            </button>
            <button
              className={`flex items-center gap-2 py-3 px-6 font-medium text-sm ${activeTab === 'friends' 
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}
              onClick={() => setActiveTab('friends')}
            >
              <UserCheck className="w-4 h-4" />
              好友
              {friendsList.length > 0 && (
                <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {friendsList.length}
                </span>
              )}
            </button>
            <button
              className={`flex items-center gap-2 py-3 px-6 font-medium text-sm ${activeTab === 'messages' 
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}
              onClick={() => setActiveTab('messages')}
            >
              <MessageCircle className="w-4 h-4" />
              私信
              {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
                <span className="ml-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="px-4 py-4 md:container md:mx-auto md:max-w-4xl md:p-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-12"
            >
              <HamsterWheelLoader size="medium" text="加载中..." />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3 md:space-y-4"
            >
              {/* 我的关注 */}
              {activeTab === 'following' && (
                <>
                  {followingList.length === 0 ? (
                    <EmptyState 
                      icon={Heart}
                      title="你还没有关注任何人"
                      subtitle="去发现页关注感兴趣的创作者吧"
                      action={{ label: '去津脉广场', onClick: () => navigate('/square') }}
                    />
                  ) : (
                    followingList.map((user) => (
                      <React.Fragment key={user.id}>
                        {renderUserCard(user, true)}
                        {renderUserCardDesktop(user, true)}
                      </React.Fragment>
                    ))
                  )}
                </>
              )}

              {/* 我的粉丝 */}
              {activeTab === 'followers' && (
                <>
                  {followersList.length === 0 ? (
                    <EmptyState 
                      icon={Users}
                      title="还没有人关注你"
                      subtitle="多发优质作品，吸引更多粉丝吧"
                    />
                  ) : (
                    followersList.map((user) => (
                      <React.Fragment key={user.id}>
                        {renderUserCard(user, false)}
                        {renderUserCardDesktop(user, false)}
                      </React.Fragment>
                    ))
                  )}
                </>
              )}

              {/* 好友列表 */}
              {activeTab === 'friends' && (
                <>
                  {friendsList.length === 0 ? (
                    <EmptyState 
                      icon={UserCheck}
                      title="你还没有好友"
                      subtitle="互相关注的用户将成为你的好友"
                      action={{ label: '去津脉广场', onClick: () => navigate('/square') }}
                    />
                  ) : (
                    friendsList.map((user) => (
                      <React.Fragment key={user.id}>
                        {renderUserCard(user, true, true)}
                        {renderUserCardDesktop(user, true, true)}
                      </React.Fragment>
                    ))
                  )}
                </>
              )}

              {/* 私信列表 */}
              {activeTab === 'messages' && (
                <>
                  {chatList.length === 0 ? (
                    <EmptyState 
                      icon={MessageCircle}
                      title="暂无私信"
                      subtitle="关注用户后，可以在这里与他们聊天"
                    />
                  ) : (
                    chatList.map((chat) => (
                      <React.Fragment key={chat.userId}>
                        {renderChatCard(chat)}
                        {renderChatCardDesktop(chat)}
                      </React.Fragment>
                    ))
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// 空状态组件 - 移动端优化
interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  action?: { label: string; onClick: () => void };
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, subtitle, action }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="py-16 px-4"
  >
    <div className="text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
        <Icon className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{subtitle}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-medium shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  </motion.div>
);

export default FriendsPage;
