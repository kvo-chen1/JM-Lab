import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, LoadingSpinner } from '@/components/ui';
import { MessageSquare, UserPlus, UserMinus, MessageCircle, Users, Heart } from 'lucide-react';
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

  const [activeTab, setActiveTab] = useState<'following' | 'followers' | 'messages'>('following');
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [chatList, setChatList] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // 加载数据
  useEffect(() => {
    if (activeTab === 'following') {
      loadFollowingList();
    } else if (activeTab === 'followers') {
      loadFollowersList();
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
      const conversations = await getConversations();
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
      loadFollowingList();
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

  // 渲染用户卡片
  const renderUserCard = (user: User, isFollowing: boolean) => (
    <Card key={user.id} className="p-4 hover:shadow-md transition-shadow">
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
          {activeTab === 'following' ? (
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

  // 渲染聊天预览卡片
  const renderChatCard = (chat: Conversation) => {
    // 判断最后一条消息是否是自己发送的
    const isLastMessageFromMe = chat.lastSenderId === currentUser?.id;
    // 判断是否有未读消息
    const hasUnread = chat.unreadCount > 0;

    return (
      <Card
        key={chat.userId}
        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
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

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex flex-col gap-6">
        {/* 页面标题 */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">我的社交</h1>
          <p className="text-gray-600 dark:text-gray-400">管理你的关注、粉丝和私信</p>
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

        {/* 内容区域 */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner className="w-8 h-8" />
            </div>
          ) : (
            <>
              {/* 我的关注 */}
              {activeTab === 'following' && (
                <div className="grid gap-4">
                  {followingList.length === 0 ? (
                    <Card className="p-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">你还没有关注任何人</p>
                        <p className="text-sm mt-2">去发现页关注感兴趣的创作者吧</p>
                        <Button 
                          className="mt-4" 
                          onClick={() => navigate('/square')}
                        >
                          去津脉广场
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    followingList.map((user) => renderUserCard(user, true))
                  )}
                </div>
              )}

              {/* 我的粉丝 */}
              {activeTab === 'followers' && (
                <div className="grid gap-4">
                  {followersList.length === 0 ? (
                    <Card className="p-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">还没有人关注你</p>
                        <p className="text-sm mt-2">多发优质作品，吸引更多粉丝吧</p>
                      </div>
                    </Card>
                  ) : (
                    followersList.map((user) => renderUserCard(user, false))
                  )}
                </div>
              )}

              {/* 私信列表 */}
              {activeTab === 'messages' && (
                <div className="grid gap-4">
                  {chatList.length === 0 ? (
                    <Card className="p-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">暂无私信</p>
                        <p className="text-sm mt-2">关注用户后，可以在这里与他们聊天</p>
                      </div>
                    </Card>
                  ) : (
                    chatList.map((chat) => renderChatCard(chat))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
