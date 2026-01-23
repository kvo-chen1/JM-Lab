import React, { useState, useEffect } from 'react';
import { useFriendContext } from '../contexts/friendContext';
import { useChatContext } from '../contexts/chatContext';
import PrivateChatWindow from '@/components/Chat/PrivateChatWindow';
import { Card, Input, Button, LoadingSpinner } from '@/components/ui';
import { MessageSquare } from 'lucide-react';

const FriendsPage: React.FC = () => {
  const { 
    searchUsers, 
    sendFriendRequest, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    getFriendRequests, 
    friendRequests, 
    getFriends, 
    friends, 
    deleteFriend, 
    setFriendNote,
    loading 
  } = useFriendContext();
  
  const { setCurrentChatFriendId, unreadCounts } = useChatContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'search'
  const [noteInput, setNoteInput] = useState('');
  const [editingFriendId, setEditingFriendId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false); // 独立的搜索loading状态
  const [searchError, setSearchError] = useState<string | null>(null); // 搜索错误状态

  // 初始化加载数据
  useEffect(() => {
    getFriendRequests();
    getFriends();
  }, []);

  // 搜索用户
  const handleSearch = async () => {
    // 清空之前的错误
    setSearchError(null);
    
    // 空输入处理
    if (!searchQuery.trim()) {
      setSearchError('请输入搜索内容');
      return;
    }
    
    // 超长文本处理（限制为50个字符）
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length > 50) {
      setSearchError('搜索内容不能超过50个字符');
      return;
    }
    
    setIsSearching(true);
    
    try {
      // 搜索用户
      const results = await searchUsers(trimmedQuery);
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchError('搜索失败，请稍后重试');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 发送好友请求
  const handleSendRequest = async (userId: string) => {
    await sendFriendRequest(userId);
    // 刷新搜索结果
    if (searchQuery.trim()) {
      const results = await searchUsers(searchQuery.trim());
      setSearchResults(results);
    }
  };

  // 接受好友请求
  const handleAcceptRequest = async (requestId: string) => {
    await acceptFriendRequest(requestId);
    await getFriends(); // 刷新好友列表
  };

  // 拒绝好友请求
  const handleRejectRequest = async (requestId: string) => {
    await rejectFriendRequest(requestId);
  };

  // 删除好友
  const handleDeleteFriend = async (friendId: string) => {
    await deleteFriend(friendId);
  };

  // 开始编辑备注
  const handleStartEditNote = (friendId: string, currentNote?: string) => {
    setEditingFriendId(friendId);
    setNoteInput(currentNote || '');
  };

  // 保存备注
  const handleSaveNote = async (friendId: string) => {
    await setFriendNote(friendId, noteInput);
    setEditingFriendId(null);
    setNoteInput('');
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex flex-col gap-6">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">好友管理</h1>
          <p className="text-gray-600 dark:text-gray-400">管理你的好友关系，发现新的创作伙伴</p>
        </div>

        {/* 搜索栏 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="搜索用户名、邮箱或用户ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchError(null); // 输入时清空错误提示
              }}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching && <LoadingSpinner className="mr-2 h-4 w-4" />}
              搜索
            </Button>
          </div>
          {/* 搜索错误提示 */}
          {searchError && (
            <div className="mt-2 text-sm text-red-500 dark:text-red-400">
              {searchError}
            </div>
          )}
        </div>

        {/* 标签页切换 */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'friends' 
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}
            onClick={() => setActiveTab('friends')}
          >
            好友列表
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'requests' 
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}
            onClick={() => {
              getFriendRequests();
              setActiveTab('requests');
            }}
          >
            好友请求
            {friendRequests.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs">
                {friendRequests.length}
              </span>
            )}
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'search' 
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}
            onClick={() => setActiveTab('search')}
          >
            搜索结果
          </button>
        </div>

        {/* 内容区域 */}
        <div className="space-y-4">
          {/* 好友列表 */}
          {activeTab === 'friends' && (
            <div className="grid gap-4">
              {friends.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    <i className="fas fa-users text-4xl mb-2"></i>
                    <p className="text-lg">你还没有好友</p>
                    <p className="text-sm mt-1">使用上方搜索栏查找并添加好友</p>
                  </div>
                </Card>
              ) : (
                friends.map((friend) => (
                  <Card key={friend.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={friend.friend?.avatar || ''}
                          alt={friend.friend?.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-800 dark:text-white">
                              {friend.friend?.username || '未知用户'}
                            </h3>
                            <span className={`inline-flex items-center justify-center w-2 h-2 rounded-full ${(friend.friend as any)?.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} title={(friend.friend as any)?.status}></span>
                          </div>
                          {friend.user_note ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {friend.user_note}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                              暂无备注
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingFriendId === friend.friend_id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              placeholder="输入备注..."
                              value={noteInput}
                              onChange={(e) => setNoteInput(e.target.value)}
                              className="w-40"
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveNote(friend.friend_id)}
                            />
                            <Button size="small" onClick={() => handleSaveNote(friend.friend_id)}>
                              保存
                            </Button>
                            <Button size="small" variant="secondary" onClick={() => {
                              setEditingFriendId(null);
                              setNoteInput('');
                            }}>
                              取消
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button 
                              size="small" 
                              variant="secondary" 
                              onClick={() => handleStartEditNote(friend.friend_id, friend.user_note)}
                            >
                              <i className="fas fa-edit mr-1"></i> 备注
                            </Button>
                            <Button 
                              size="small" 
                              variant="danger" 
                              onClick={() => handleDeleteFriend(friend.friend_id)}
                            >
                              <i className="fas fa-trash mr-1"></i> 删除
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* 好友请求 */}
          {activeTab === 'requests' && (
            <div className="grid gap-4">
              {friendRequests.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    <i className="fas fa-bell text-4xl mb-2"></i>
                    <p className="text-lg">暂无好友请求</p>
                    <p className="text-sm mt-1">当有新的好友请求时，会显示在这里</p>
                  </div>
                </Card>
              ) : (
                friendRequests.map((request) => (
                  <Card key={request.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={request.sender?.avatar || ''}
                          alt={request.sender?.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-white">
                            {request.sender?.username || '未知用户'}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(request.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="small" 
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={loading}
                        >
                          {loading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                          接受
                        </Button>
                        <Button 
                          size="small" 
                          variant="danger" 
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={loading}
                        >
                          {loading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                          拒绝
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* 搜索结果 */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              {/* 搜索结果统计 */}
              {searchResults.length > 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  找到 {searchResults.length} 个匹配的用户
                </div>
              )}
              
              <div className="grid gap-4">
                {searchResults.length === 0 ? (
                  <Card className="p-8 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <i className="fas fa-search text-4xl mb-2"></i>
                      <p className="text-lg">未找到匹配的用户</p>
                      <p className="text-sm mt-1">请尝试以下方法：</p>
                      <ul className="text-sm mt-3 space-y-1 list-disc list-inside text-left max-w-xs mx-auto">
                        <li>检查拼写是否正确</li>
                        <li>尝试使用不同的关键词</li>
                        <li>搜索更短的用户名或邮箱</li>
                      </ul>
                    </div>
                  </Card>
                ) : (
                  searchResults.map((user) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar || ''}
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-800 dark:text-white">
                                {user.username || '未知用户'}
                              </h3>
                              <span className={`inline-flex items-center justify-center w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} title={user.status}></span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="small" 
                          onClick={() => handleSendRequest(user.id)}
                          disabled={loading}
                        >
                          {loading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                          添加好友
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <PrivateChatWindow />
    </div>
  );
};

export default FriendsPage;
