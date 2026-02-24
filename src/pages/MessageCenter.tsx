import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import {
  MessageSquare,
  AtSign,
  ThumbsUp,
  Bell,
  Settings,
  ChevronRight,
  Search,
  MoreHorizontal,
  Trash2,
  CheckCheck,
  Filter,
  Inbox,
  Send,
  Heart,
  MessageCircle,
  UserPlus,
  Megaphone,
  Sparkles,
  ChevronLeft,
  RefreshCw
} from 'lucide-react';
import {
  messageService,
  type Message,
  type MessageType,
  type MessageStats
} from '@/services/messageService';

// 左侧导航菜单项
interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  count?: number;
  badge?: number;
}

// 格式化相对时间
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// 消息类型配置
const messageTypeConfig: Record<MessageType, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  private: {
    icon: MessageSquare,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: '私信',
  },
  reply: {
    icon: MessageCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    label: '回复',
  },
  mention: {
    icon: AtSign,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    label: '@我',
  },
  like: {
    icon: Heart,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    borderColor: 'border-pink-200 dark:border-pink-800',
    label: '点赞',
  },
  follow: {
    icon: UserPlus,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    label: '关注',
  },
  system: {
    icon: Megaphone,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: '系统',
  },
};

export default function MessageCenter() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageStats, setMessageStats] = useState<MessageStats | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查登录状态
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  // 从URL参数获取初始分类
  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setActiveCategory(category);
    }
  }, [searchParams]);

  // 加载消息数据
  const loadMessages = useCallback(async (showRefreshing = false) => {
    if (!user?.id) return;

    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // 获取消息列表
      const filter: { type?: MessageType; unreadOnly?: boolean; searchQuery?: string } = {};
      
      if (activeCategory !== 'all' && activeCategory !== 'unread') {
        filter.type = activeCategory as MessageType;
      } else if (activeCategory === 'unread') {
        filter.unreadOnly = true;
      }
      
      if (searchQuery) {
        filter.searchQuery = searchQuery;
      }

      const [messagesData, statsData] = await Promise.all([
        messageService.getMessages(user.id, filter, { limit: 50 }),
        messageService.getMessageStats(user.id)
      ]);

      setMessages(messagesData);
      setMessageStats(statsData);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('加载消息失败，请稍后重试');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, activeCategory, searchQuery]);

  // 初始加载和分类/搜索变化时重新加载
  useEffect(() => {
    if (user?.id) {
      loadMessages();
    }
  }, [loadMessages, user?.id]);

  // 订阅实时消息
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = messageService.subscribeToMessages(user.id, (newMessage) => {
      // 新消息到达时，添加到列表顶部
      setMessages(prev => [newMessage, ...prev]);
      // 更新统计
      setMessageStats(prev => prev ? {
        ...prev,
        total: prev.total + 1,
        unread: prev.unread + 1,
        [newMessage.type]: prev[newMessage.type] + 1
      } : null);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  // 计算各分类消息数量
  const categoryCounts = useMemo(() => {
    if (!messageStats) {
      return {
        all: 0,
        unread: 0,
        private: 0,
        reply: 0,
        mention: 0,
        like: 0,
        follow: 0,
        system: 0,
      };
    }
    return {
      all: messageStats.total,
      unread: messageStats.unread,
      private: messageStats.private,
      reply: messageStats.reply,
      mention: messageStats.mention,
      like: messageStats.like,
      follow: messageStats.follow,
      system: messageStats.system,
    };
  }, [messageStats]);

  // 导航菜单项
  const navItems: NavItem[] = [
    { id: 'all', label: '全部消息', icon: Inbox, count: categoryCounts.all, badge: categoryCounts.unread },
    { id: 'unread', label: '未读消息', icon: Sparkles, badge: categoryCounts.unread },
    { id: 'reply', label: '回复我的', icon: MessageCircle, count: categoryCounts.reply },
    { id: 'mention', label: '@我的', icon: AtSign, count: categoryCounts.mention },
    { id: 'like', label: '收到的赞', icon: ThumbsUp, count: categoryCounts.like },
    { id: 'follow', label: '新增关注', icon: UserPlus, count: categoryCounts.follow },
    { id: 'system', label: '系统通知', icon: Bell, count: categoryCounts.system },
  ];

  // 标记消息为已读
  const handleMarkAsRead = async (messageId: string) => {
    if (!user?.id) return;
    
    const success = await messageService.markAsRead(messageId, user.id);
    if (success) {
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, read: true } : m))
      );
      // 更新统计
      setMessageStats(prev => prev ? {
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      } : null);
    }
  };

  // 标记所有为已读
  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    
    const success = await messageService.markAllAsRead(user.id);
    if (success) {
      setMessages(prev => prev.map(m => ({ ...m, read: true })));
      setMessageStats(prev => prev ? {
        ...prev,
        unread: 0
      } : null);
    }
  };

  // 删除消息
  const handleDeleteMessage = async (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;
    
    const success = await messageService.deleteMessage(messageId, user.id);
    if (success) {
      const deletedMessage = messages.find(m => m.id === messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      // 更新统计
      if (deletedMessage && messageStats) {
        setMessageStats({
          ...messageStats,
          total: Math.max(0, messageStats.total - 1),
          unread: deletedMessage.read ? messageStats.unread : Math.max(0, messageStats.unread - 1),
          [deletedMessage.type]: Math.max(0, messageStats[deletedMessage.type] - 1)
        });
      }
    }
  };

  // 处理消息点击
  const handleMessageClick = async (message: Message) => {
    if (!message.read) {
      await handleMarkAsRead(message.id);
    }
    setSelectedMessage(message);
    setIsMobileMenuOpen(false);
  };

  // 处理分类切换
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setSearchParams({ category: categoryId });
    setSelectedMessage(null);
    setIsMobileMenuOpen(false);
  };

  // 渲染左侧导航
  const renderSidebar = () => (
    <div className={`w-64 flex-shrink-0 border-r ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'} flex flex-col h-full`}>
      {/* 头部 */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            消息中心
          </h2>
          <button
            onClick={() => navigate('/settings')}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="消息设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeCategory === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleCategoryChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? `${isDark ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'} border-l-4 border-primary`
                  : `${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1">
                {item.badge && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full min-w-[18px] text-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && !item.badge && (
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {item.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* 底部 - 消息设置 */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={handleMarkAllAsRead}
          disabled={categoryCounts.unread === 0}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            categoryCounts.unread === 0
              ? `${isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'}`
              : `${isDark ? 'text-primary hover:bg-primary/10' : 'text-primary hover:bg-primary/5'}`
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          全部已读
        </button>
      </div>
    </div>
  );

  // 渲染消息列表
  const renderMessageList = () => (
    <div className={`flex-1 flex flex-col min-w-0 border-r ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* 搜索栏 */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          {/* 移动端返回按钮 */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索消息..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 ${isDark ? 'text-white' : 'text-gray-900'}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">清除</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <button
            onClick={() => loadMessages(true)}
            disabled={isRefreshing}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${isRefreshing ? 'animate-spin' : ''}`}
            title="刷新"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="筛选"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
              <Megaphone className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="font-medium mb-1 text-red-500">{error}</h3>
            <button
              onClick={() => loadMessages()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              重试
            </button>
          </div>
        ) : messages.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <AnimatePresence>
              {messages.map((message, index) => {
                const config = messageTypeConfig[message.type];
                const isSelected = selectedMessage?.id === message.id;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleMessageClick(message)}
                    className={`group relative p-4 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? `${isDark ? 'bg-primary/10' : 'bg-primary/5'} border-l-4 border-primary`
                        : message.read
                        ? `${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`
                        : `${isDark ? 'bg-gray-700/30' : 'bg-blue-50/50'} border-l-4 border-primary`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 头像或图标 */}
                      {message.sender ? (
                        <div className="relative flex-shrink-0">
                          <Avatar
                            src={message.sender.avatar}
                            alt={message.sender.username}
                            size="small"
                            shape="circle"
                          />
                          {message.sender.verified && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          {/* 未读指示器 */}
                          {!message.read && (
                            <div className="absolute -top-0.5 -left-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
                          )}
                        </div>
                      ) : (
                        <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <config.icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                      )}

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`font-medium truncate ${!message.read ? 'text-primary' : ''}`}>
                            {message.title}
                          </h4>
                          <span className={`text-xs flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {formatRelativeTime(message.timestamp)}
                          </span>
                        </div>

                        <p className={`text-sm mt-0.5 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {message.content}
                        </p>

                        {/* 目标内容预览 */}
                        {message.targetContent && (
                          <div className={`mt-2 flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                            {message.targetContent.thumbnail && (
                              <img
                                src={message.targetContent.thumbnail}
                                alt=""
                                className="w-10 h-10 rounded object-cover flex-shrink-0"
                              />
                            )}
                            <p className="text-xs line-clamp-1">{message.targetContent.preview}</p>
                          </div>
                        )}

                        {/* 消息数量标记 */}
                        {message.count && message.count > 1 && (
                          <div className="mt-2">
                            <Badge variant="destructive" size="small">
                              {message.count}条新消息
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={(e) => handleDeleteMessage(message.id, e)}
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium mb-1">
              {searchQuery ? '未找到匹配的消息' : '暂无消息'}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchQuery ? '尝试使用其他关键词搜索' : '当有新消息时，会显示在这里'}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // 渲染详情区域
  const renderDetailPanel = () => (
    <div className={`hidden lg:flex flex-1 flex-col ${isDark ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
      {selectedMessage ? (
        <>
          {/* 详情头部 */}
          <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              {selectedMessage.sender ? (
                <Avatar
                  src={selectedMessage.sender.avatar}
                  alt={selectedMessage.sender.username}
                  size="medium"
                  shape="circle"
                />
              ) : (
                <div className={`w-10 h-10 rounded-full ${messageTypeConfig[selectedMessage.type].bgColor} flex items-center justify-center`}>
                  {(() => {
                    const Icon = messageTypeConfig[selectedMessage.type].icon;
                    return <Icon className={`w-5 h-5 ${messageTypeConfig[selectedMessage.type].color}`} />;
                  })()}
                </div>
              )}
              <div>
                <h3 className="font-medium">{selectedMessage.title}</h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatRelativeTime(selectedMessage.timestamp)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedMessage(null)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 详情内容 */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className={`max-w-2xl mx-auto ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm`}>
              {/* 消息类型标签 */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${messageTypeConfig[selectedMessage.type].bgColor} ${messageTypeConfig[selectedMessage.type].color}`}>
                  {(() => {
                    const Icon = messageTypeConfig[selectedMessage.type].icon;
                    return <Icon className="w-3.5 h-3.5" />;
                  })()}
                  {messageTypeConfig[selectedMessage.type].label}
                </span>
                {!selectedMessage.read && (
                  <Badge variant="destructive" size="small">未读</Badge>
                )}
              </div>

              {/* 消息内容 */}
              <h2 className="text-xl font-bold mb-4">{selectedMessage.title}</h2>
              <p className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {selectedMessage.content}
              </p>

              {/* 目标内容 */}
              {selectedMessage.targetContent && (
                <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    相关内容
                  </p>
                  <div className="flex items-center gap-3">
                    {selectedMessage.targetContent.thumbnail && (
                      <img
                        src={selectedMessage.targetContent.thumbnail}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <p className="text-sm">{selectedMessage.targetContent.preview}</p>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                {selectedMessage.type === 'private' && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                    <Send className="w-4 h-4" />
                    回复
                  </button>
                )}
                {selectedMessage.link && (
                  <button 
                    onClick={() => navigate(selectedMessage.link!)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                    查看详情
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* 空状态 */
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            {/* 装饰性插图 */}
            <div className="relative mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-48 h-48 mx-auto relative"
              >
                {/* 背景装饰 */}
                <div className={`absolute inset-0 rounded-full ${isDark ? 'bg-gray-700/30' : 'bg-gray-100'}`} />

                {/* 主图标 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <MessageSquare className={`w-20 h-20 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                </div>

                {/* 浮动装饰元素 */}
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-4 right-4"
                >
                  <Sparkles className={`w-8 h-8 ${isDark ? 'text-yellow-600/50' : 'text-yellow-400/50'}`} />
                </motion.div>

                <motion.div
                  animate={{ y: [5, -5, 5] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute bottom-8 left-4"
                >
                  <Heart className={`w-6 h-6 ${isDark ? 'text-pink-600/50' : 'text-pink-400/50'}`} />
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-bold mb-2">
                {activeCategory === 'all' ? '快找小伙伴聊天吧' : '选择一条消息查看详情'}
              </h3>
              <p className={`text-sm max-w-xs mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {activeCategory === 'all'
                  ? '消息中心是您与社区互动的枢纽，在这里可以查看所有通知和私信'
                  : '点击左侧列表中的消息，即可在此处查看详细内容'}
              </p>
            </motion.div>

            {/* 快捷操作 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-3 mt-6"
            >
              <button
                onClick={() => handleCategoryChange('private')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50 shadow-sm'
                }`}
              >
                <Send className="w-4 h-4 text-blue-500" />
                发私信
              </button>
              <button
                onClick={() => navigate('/community')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50 shadow-sm'
                }`}
              >
                <MessageCircle className="w-4 h-4 text-green-500" />
                去社区
              </button>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <main className={`h-[calc(100vh-4rem)] flex overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* 移动端侧边栏遮罩 */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* 移动端侧边栏 */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isMobileMenuOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 left-0 z-50 lg:hidden"
      >
        {renderSidebar()}
      </motion.div>

      {/* 桌面端侧边栏 */}
      <div className="hidden lg:block">
        {renderSidebar()}
      </div>

      {/* 消息列表 */}
      {renderMessageList()}

      {/* 详情面板 */}
      {renderDetailPanel()}
    </main>
  );
}
