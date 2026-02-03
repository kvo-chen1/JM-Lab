import { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';
import { useNotifications, useNotificationWithNavigate } from '@/contexts/NotificationContext';
import type { Thread, ChatMessage } from '@/pages/Community';
import { useChatStore } from '@/stores/chatStore';
import { apiService } from '@/services/apiService';
import { communityService } from '@/services/communityService';
import { websocketService } from '@/services/websocketService';
import recommendationService from '@/services/recommendationService';
import type { Community } from '@/services/communityService';

// 本地存储键名
const STORAGE_KEYS = {
  JOINED_COMMUNITIES: 'jmzf_joined_communities',
  FAVORITED_THREADS: 'jmzf_favorited_threads'
};

// 津脉社区默认数据 - 从API获取，这里只定义结构
export interface JinmaiCommunityData {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  topic: string;
  avatar: string;
  isActive: boolean;
  isSpecial: boolean;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
  layoutType: 'standard' | 'compact' | 'expanded';
  enabledModules: {
    posts: boolean;
    chat: boolean;
    members: boolean;
    announcements: boolean;
  };
}

// 推荐标签
const RECOMMENDED_TAGS = ['国潮', '非遗', '极简', '赛博朋克', '3D艺术', '插画', 'UI设计'];

// 评论类型扩展
interface Comment {
  id: string;
  content: string;
  createdAt: number;
  user: string;
  avatar: string;
  upvotes: number;
  replies?: Comment[];
  replyTo?: string;
  communityId: string; // 添加社群ID字段，关联到所属社群
}

// 本地存储工具函数
const localStorageUtils = {
  // 安全获取本地存储数据
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  // 安全设置本地存储数据
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }
};

// 社区数据更新工具函数
const communityUtils = {
  // 更新社区列表中的特定社区
  updateCommunityInList: (communities: Community[], community: Community): Community[] => {
    const existingIndex = communities.findIndex(c => c.id === community.id);
    if (existingIndex >= 0) {
      const updated = [...communities];
      updated[existingIndex] = community;
      return updated;
    }
    return [community, ...communities];
  }
};

// 通知工具函数
const notificationUtils = {
  // 发送帖子相关通知
  sendPostNotification: (
    addNotification: any,
    addNotificationWithNavigate: ((notification: any, navigateFn: (path: string) => void) => void) | null,
    navigate: (path: string) => void,
    user: any,
    type: string,
    title: string,
    content: string,
    thread: any
  ) => {
    if (!user || !thread) return;
    
    const notification = {
      type,
      title,
      content,
      senderId: user.id,
      senderName: user.username,
      recipientId: thread.authorId || 'community',
      communityId: thread.communityId,
      postId: thread.id,
      priority: type === 'post_liked' ? 'low' : 'medium',
      link: `/community/${thread.communityId}/post/${thread.id}`
    };
    
    if (addNotificationWithNavigate) {
      addNotificationWithNavigate(notification, navigate);
    } else {
      addNotification(notification);
    }
  },
  
  // 发送社群相关通知
  sendCommunityNotification: (
    addNotification: any,
    addNotificationWithNavigate: ((notification: any, navigateFn: (path: string) => void) => void) | null,
    navigate: (path: string) => void,
    user: any,
    type: string,
    title: string,
    content: string,
    communityId: string
  ) => {
    if (!user || !communityId) return;
    
    const notification = {
      type,
      title,
      content,
      senderId: user.id,
      senderName: user.username,
      recipientId: 'admin',
      communityId,
      priority: 'medium',
      link: `/community/${communityId}`
    };
    
    if (addNotificationWithNavigate) {
      addNotificationWithNavigate(notification, navigate);
    } else {
      addNotification(notification);
    }
  }
};

export const useCommunityLogic = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  // 通知系统 - 使用带导航功能的 hook
  let notificationsContext;
  let addNotificationWithNavigate: ((notification: any, navigateFn: (path: string) => void) => void) | null = null;
  try {
    notificationsContext = useNotificationWithNavigate();
    addNotificationWithNavigate = notificationsContext.addNotificationWithNavigate;
  } catch (error) {
    // 如果不在NotificationProvider内，使用默认值
    notificationsContext = {
      addNotification: () => {},
      unreadCount: 0
    };
  }
  const { addNotification, unreadCount } = notificationsContext;

  // --- State: Navigation ---
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<string>('communities'); // Default to 'communities'
  
  // Derived State: Mode
  const mode: 'community' | 'discovery' = activeCommunityId ? 'community' : 'discovery';

  // --- State: Data ---
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [threads, setThreads] = useState<(Thread & { comments?: Comment[] })[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('国潮');
  const [favoritedThreads, setFavoritedThreads] = useState<string[]>([]); // 收藏的帖子ID列表
  const [search, setSearch] = useState(''); // 搜索关键词
  const [allCommunities, setAllCommunities] = useState<Community[]>([]); // For Discovery
  
  // Loading and Error States
  const [loading, setLoading] = useState({
    communities: false,
    threads: false,
    comments: false
  });
  const [errors, setErrors] = useState({
    communities: null as string | null,
    threads: null as string | null,
    comments: null as string | null
  });

  // 确保津脉社区数据从API获取，失败时使用默认数据
  // useEffect(() => {
  //   const fetchCreatorCommunity = async () => {
  //     // Removed Creator Community logic
  //   };
  //   fetchCreatorCommunity();
  // }, []);

  // 确保页面加载时就有默认数据 - 已移除，使用真实数据

  // --- Chat Store Integration ---
  const [chatStoreError, setChatStoreError] = useState<Error | null>(null);
  
  const { 
    messages: chatStoreMessages = [], 
    sendMessage: storeSendMessage = async () => {}, 
    setActiveChannel: storeSetActiveChannel = () => {},
    subscribeToChannel: storeSubscribe = () => {},
    fetchMessages: storeFetchMessages = async () => {}
  } = useChatStore();

  // Modal States
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);

  // --- Data Loading and Persistence ---
  useEffect(() => {
    // Load data from localStorage and API
    const loadData = async () => {
      try {
        // Load favorited threads from localStorage
        const savedFavoritedThreads = localStorageUtils.get<string[]>(STORAGE_KEYS.FAVORITED_THREADS, []);
        setFavoritedThreads(savedFavoritedThreads);
        
        // Fetch communities from API
        setLoading(prev => ({ ...prev, communities: true }));
        setErrors(prev => ({ ...prev, communities: null }));
        
        const communitiesData = await communityService.getCommunities();
        if (communitiesData) {
          setAllCommunities(communitiesData);
        }

        // Fetch user joined communities if logged in
        if (user?.id) {
          try {
            const userCommunities = await communityService.getUserCommunities(user.id);
            if (userCommunities) {
              setJoinedCommunities(userCommunities);
            }
          } catch (err) {
            console.error('Failed to fetch user communities:', err);
            toast.error('加载已加入社区失败');
          }
        } else {
            setJoinedCommunities([]);
        }
        
        // Fetch threads from API if in a community
        if (activeCommunityId) {
          setLoading(prev => ({ ...prev, threads: true }));
          setErrors(prev => ({ ...prev, threads: null }));
          
          try {
            const threadsData = await communityService.getThreadsByCommunity(activeCommunityId);
            if (threadsData) {
              setThreads(threadsData);
            }
          } catch (err) {
            console.error('Failed to fetch threads:', err);
            setErrors(prev => ({ ...prev, threads: '加载帖子数据失败' }));
          } finally {
            setLoading(prev => ({ ...prev, threads: false }));
          }
        }
      } catch (error) {
        console.error('Error loading community data:', error);
        setErrors(prev => ({
          ...prev,
          communities: '加载社区数据失败',
          threads: '加载帖子数据失败'
        }));
        toast.error('加载社区数据失败，请刷新页面重试');
      } finally {
        setLoading(prev => ({ ...prev, communities: false }));
      }
    };

    loadData();
  }, [user?.id, activeCommunityId]); // Add user and activeCommunityId dependency

  // 数据持久化 - 使用useCallback优化性能
  const saveJoinedCommunities = useCallback((communities: Community[]) => {
    localStorageUtils.set(STORAGE_KEYS.JOINED_COMMUNITIES, communities);
  }, []);

  const saveFavoritedThreads = useCallback((favorites: string[]) => {
    localStorageUtils.set(STORAGE_KEYS.FAVORITED_THREADS, favorites);
  }, []);

  // 优化localStorage写入，减少不必要的写入操作
  // 使用防抖函数减少频繁写入
  useEffect(() => {
    const timer = setTimeout(() => {
      saveJoinedCommunities(joinedCommunities);
    }, 500);
    return () => clearTimeout(timer);
  }, [joinedCommunities, saveJoinedCommunities]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveFavoritedThreads(favoritedThreads);
    }, 500);
    return () => clearTimeout(timer);
  }, [favoritedThreads, saveFavoritedThreads]);

  // Map store messages to UI ChatMessage type
  // 使用useMemo缓存计算结果，减少不必要的重新计算
  const messages: ChatMessage[] = useMemo(() => {
    // 限制消息数量，只显示最近的100条消息
    const recentMessages = chatStoreMessages.slice(-100);
    return recentMessages.map(msg => ({
      id: msg.id,
      user: msg.sender?.username || 'Unknown',
      text: msg.content,
      avatar: msg.sender?.avatar_url || '',
      createdAt: new Date(msg.created_at).getTime(),
      type: msg.type || 'text',
      images: msg.images,
      files: msg.files,
      richContent: msg.richContent,
      sendStatus: msg.sendStatus || 'sent'
    }));
  }, [chatStoreMessages]);
  
  // WebSocket连接管理
  useEffect(() => {
    if (user) {
      // 连接WebSocket
      websocketService.connect();
      
      // 监听消息事件
      websocketService.on('message:new', (data) => {
        console.log('收到新消息:', data);
        // 消息已通过chatStore处理，这里可以添加额外的逻辑
      });
      
      // 监听消息状态更新事件
      websocketService.on('message:status', (data) => {
        console.log('消息状态更新:', data);
        // 处理消息状态更新
      });
      
      // 监听社群更新事件
      websocketService.on('community:updated', (data) => {
        console.log('社群更新:', data);
        // 重新加载社群数据
        apiService.getCommunity(data.communityId).then(({ data: updatedCommunity }) => {
          if (updatedCommunity) {
            setJoinedCommunities(prev => prev.map(c => 
              c.id === data.communityId ? updatedCommunity : c
            ));
          }
        });
      });
    }
    
    return () => {
      // 组件卸载时断开WebSocket连接
      websocketService.disconnect();
    };
  }, [user]);

  // Sync active channel with ChatStore
  useEffect(() => {
    if (activeCommunityId && (activeChannel === 'general' || activeChannel === 'chat')) {
      const channelId = `community:${activeCommunityId}:${activeChannel}`;
      storeSetActiveChannel(channelId);
      storeFetchMessages(channelId);
      storeSubscribe(channelId);
    }
  }, [activeCommunityId, activeChannel, storeSetActiveChannel, storeFetchMessages, storeSubscribe]);

  // --- Actions ---

  const handleSelectCommunity = useCallback(async (id: string | null) => {
    if (id) {
      // 检查用户是否已经加入该社群
      const isJoined = joinedCommunities.some(c => c.id === id);
      if (isJoined) {
        setActiveCommunityId(id);
        // 切换社群后，useEffect 会自动触发 loadData 加载帖子数据
      } else {
        // 用户未加入该社群，不允许进入
        toast.error('请先加入该社群');
        return;
      }
    } else {
      setActiveCommunityId(id);
      setActiveChannel('communities'); // Default back to communities grid
    }
  }, [joinedCommunities]);

  const handleSelectChannel = useCallback((channel: string) => {
    setActiveChannel(channel);
    // Removed creator community switch
  }, []);

  const handleUpvote = useCallback(async (id: string) => {
    try {
      // 乐观更新
      setThreads(prev => prev.map(t => 
          t.id === id ? { ...t, upvotes: (t.upvotes || 0) + 1 } : t
      ));
      
      // 调用API
      await apiService.upvoteThread(id);
      
      // 记录用户行为，用于推荐系统
      if (user) {
        const thread = threads.find(t => t.id === id);
        if (thread) {
          recommendationService.recordUserAction({
            userId: user.id,
            itemId: id,
            itemType: 'post',
            actionType: 'like',
            metadata: thread
          });
          
          // 发送通知给帖子作者
          if (thread.authorId && thread.authorId !== user.id) {
            notificationUtils.sendPostNotification(
              addNotification,
              addNotificationWithNavigate,
              navigate,
              user,
              'post_liked',
              '帖子被点赞',
              `${user.username} 点赞了你的帖子《${thread.title}》`,
              thread
            );
          }
        }
      }
    } catch (error) {
      console.error('Error upvoting thread:', error);
      // 回滚更新
      setThreads(prev => prev.map(t => 
          t.id === id ? { ...t, upvotes: Math.max(0, (t.upvotes || 1) - 1) } : t
      ));
      toast.error('点赞失败');
    }
  }, [threads, user, addNotification]);

  const handleToggleFavorite = useCallback(async (id: string) => {
    try {
      const isCurrentlyFavorited = favoritedThreads.includes(id);
      
      // 乐观更新
      const newFavorites = isCurrentlyFavorited 
        ? favoritedThreads.filter(threadId => threadId !== id)
        : [...favoritedThreads, id];
      
      setFavoritedThreads(newFavorites);
      
      // 调用API
      if (isCurrentlyFavorited) {
        await apiService.unfavoriteThread(id);
        toast.success('已取消收藏');
        
        // 记录用户取消收藏行为
        if (user) {
          recommendationService.recordUserAction({
            userId: user.id,
            itemId: id,
            itemType: 'post',
            actionType: 'dislike',
            value: -5
          });
        }
      } else {
        await apiService.favoriteThread(id);
        toast.success('收藏成功');
        
        // 记录用户收藏行为
        if (user) {
          const thread = threads.find(t => t.id === id);
          if (thread) {
            recommendationService.recordUserAction({
              userId: user.id,
              itemId: id,
              itemType: 'post',
              actionType: 'save',
              metadata: thread
            });
          }
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // 回滚更新
      toast.error('操作失败');
    }
  }, [favoritedThreads, threads, user]);

  // 检查帖子是否被收藏
  const isThreadFavorited = useCallback((id: string) => {
    return favoritedThreads.includes(id);
  }, [favoritedThreads]);

  // 发表评论
  const handleAddComment = useCallback(async (threadId: string, content: string, replyTo?: string) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }
    
    // 查找帖子，获取所属社群ID
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;
    
    try {
      setLoading(prev => ({ ...prev, comments: true }));
      
      // 调用API
      const newComment = await apiService.addComment(threadId, content, replyTo);
      
      if (newComment) {
        const commentObj: Comment = {
          id: newComment.id,
          content: newComment.content,
          createdAt: new Date(newComment.created_at).getTime(),
          user: user.username || 'Guest',
          avatar: user.avatar || '',
          upvotes: 0,
          replyTo,
          communityId: thread.communityId // 关联到帖子所属的社群ID
        };

        setThreads(prev => prev.map(thread => {
          if (thread.id === threadId) {
            if (!thread.comments) {
              return {
                ...thread,
                comments: [commentObj]
              };
            } else if (replyTo) {
              // 查找并回复指定评论
              const findAndReply = (comments: Comment[]): Comment[] => {
                return comments.map(comment => {
                  if (comment.id === replyTo) {
                    return {
                      ...comment,
                      replies: [...(comment.replies || []), commentObj]
                    };
                  } else if (comment.replies) {
                    return {
                      ...comment,
                      replies: findAndReply(comment.replies)
                    };
                  }
                  return comment;
                });
              };

              return {
                ...thread,
                comments: findAndReply(thread.comments)
              };
            } else {
              // 添加新评论
              return {
                ...thread,
                comments: [commentObj, ...thread.comments]
              };
            }
          }
          return thread;
        }));

        toast.success('评论成功！');
        
        // 记录用户评论行为，用于推荐系统
        recommendationService.recordUserAction({
          userId: user.id,
          itemId: threadId,
          itemType: 'post',
          actionType: 'comment',
          metadata: thread
        });
        
        // 发送通知给帖子作者
        if (thread.authorId && thread.authorId !== user.id) {
          notificationUtils.sendPostNotification(
            addNotification,
            addNotificationWithNavigate,
            navigate,
            user,
            'post_commented',
            '帖子被评论',
            `${user.username} 评论了你的帖子《${thread.title}》`,
            thread
          );
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('评论失败');
    } finally {
      setLoading(prev => ({ ...prev, comments: false }));
    }
  }, [user, threads, addNotification]);

  // 评论点赞
  const handleCommentUpvote = useCallback(async (threadId: string, commentId: string) => {
    try {
      // 乐观更新
      const findAndUpvote = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              upvotes: comment.upvotes + 1
            };
          } else if (comment.replies) {
            return {
              ...comment,
              replies: findAndUpvote(comment.replies)
            };
          }
          return comment;
        });
      };

      setThreads(prev => prev.map(thread => {
        if (thread.id === threadId && thread.comments) {
          return {
            ...thread,
            comments: findAndUpvote(thread.comments)
          };
        }
        return thread;
      }));
      
      // 调用API
      await apiService.upvoteComment(commentId);
    } catch (error) {
      console.error('Error upvoting comment:', error);
      // 回滚更新
      toast.error('点赞失败');
    }
  }, []);

    // 权限管理功能
  const checkPermission = useCallback((communityId: string, permission: string): boolean => {
    // 简化的权限检查逻辑，实际应用中应该从后端获取用户在该社群的角色和权限
    // 这里假设：
    // 1. 用户是自己创建的社群的管理员
    // 2. 管理员拥有所有权限
    // 3. 普通用户拥有基本权限
    const isCommunityCreator = joinedCommunities.some(c => c.id === communityId && c.creatorId === user?.id);
    const isAdmin = isCommunityCreator || user?.role === 'admin';
    
    const permissions = {
      'create_post': true, // 所有用户都可以创建帖子
      'comment': true, // 所有用户都可以评论
      'upvote': true, // 所有用户都可以点赞
      'manage_posts': isAdmin, // 只有管理员可以管理帖子
      'manage_members': isAdmin, // 只有管理员可以管理成员
      'manage_community': isAdmin, // 只有管理员可以管理社群
      'moderate_content': isAdmin // 只有管理员可以审核内容
    };
    
    return permissions[permission as keyof typeof permissions] || false;
  }, [user, joinedCommunities]);
  
  // 增强的内容审核机制，支持自定义规则
  const contentModeration = useCallback((message: Partial<ChatMessage>, communityId?: string): { approved: boolean; reason?: string } => {
      // 敏感词列表（增强版）
      const sensitiveWords = [
        // 违法违规
        '违规', '违法', '犯罪', '赌博', '吸毒', '贩毒', '嫖娼', '卖淫',
        // 色情内容
        '色情', '黄色', '情色', '成人', '裸露', '性感', '艳照', '淫荡',
        // 暴力内容
        '暴力', '血腥', '恐怖', '杀人', '自杀', '自残', '打架', '斗殴',
        // 政治敏感
        '政治', '政府', '国家', '领导人', '抗议', '游行', '示威', '颠覆',
        // 不良信息
        '不良', '垃圾', '广告', '推广', '营销', '诈骗', '骗人', '虚假',
        // 侮辱诽谤
        '侮辱', '诽谤', '辱骂', '诅咒', '歧视', '偏见', '仇恨', '攻击',
        // 其他敏感
        '敏感', '保密', '隐私', '个人信息', '身份证', '手机号', '银行卡'
      ];
      
      // 检查文本内容
      const text = message.text || '';
      const hasSensitiveWords = sensitiveWords.some(word => text.includes(word));
      if (hasSensitiveWords) {
          return { approved: false, reason: '消息包含敏感词' };
      }
      
      // 检查消息长度
      if (text.length > 1000) {
          return { approved: false, reason: '消息长度超过限制' };
      }
      
      // 检查链接
      const urlRegex = /(https?:\/\/[\w\-]+(\.[\w\-]+)+([\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?)/gi;
      const urls = text.match(urlRegex);
      if (urls && urls.length > 3) {
          return { approved: false, reason: '消息包含过多链接' };
      }
      
      // 检查重复内容
      const repeatedPattern = /(\w+)\1{4,}/;
      if (repeatedPattern.test(text)) {
          return { approved: false, reason: '消息包含重复内容' };
      }
      
      // 预留社群自定义审核规则的接口
      // 实际应用中，这里可以根据社群ID获取该社群的自定义审核规则
      if (communityId) {
        // 示例：某些社群可能有更严格的审核规则
        const strictCommunities = ['community-1', 'community-2'];
        if (strictCommunities.includes(communityId)) {
          // 更严格的审核逻辑
          const strictSensitiveWords = ['广告', '推广', '营销', '链接', '网址'];
          const hasStrictSensitiveWords = strictSensitiveWords.some(word => text.includes(word));
          if (hasStrictSensitiveWords) {
              return { approved: false, reason: '该社群不允许此类内容' };
          }
        }
      }
      
      return { approved: true };
  }, []);
  
  // 个性化推荐接口，使用推荐服务实现
  const getRecommendedPosts = useCallback((communityId: string, limit: number = 10) => {
    if (!user) {
      // 如果用户未登录，返回热门帖子
      const communityPosts = threads.filter(t => t.communityId === communityId);
      return [...communityPosts]
        .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
        .slice(0, limit);
    }
    
    try {
      // 使用推荐服务生成个性化推荐
      const recommendations = recommendationService.getRecommendations(user.id, {
        limit,
        strategy: 'hybrid',
        includeDiverse: true
      });
      
      // 过滤出当前社群的推荐内容
      const communityRecommendations = recommendations
        .filter(item => item.type === 'post' && item.metadata?.communityId === communityId)
        .map(item => item.metadata);
      
      return communityRecommendations.length > 0 ? communityRecommendations : [
        // 回退：如果没有推荐，返回热门帖子
        ...threads
          .filter(t => t.communityId === communityId)
          .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
          .slice(0, limit)
      ];
    } catch (error) {
      console.error('Error getting recommendations:', error);
      // 出错时返回热门帖子
      const communityPosts = threads.filter(t => t.communityId === communityId);
      return [...communityPosts]
        .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
        .slice(0, limit);
    }
  }, [threads, user]);

  const handleSendMessage = useCallback(async (message: Partial<ChatMessage>) => {
      if (!user) {
        toast.error('请先登录');
        return;
      }

      if (!activeCommunityId) {
        toast.error('请先选择社群');
        return;
      }

      // 检查创建消息的权限
      const canCreateMessage = checkPermission(activeCommunityId, 'comment');
      if (!canCreateMessage) {
        toast.error('您没有发送消息的权限');
        return;
      }

      // 内容审核，传递社群ID
      const moderationResult = contentModeration(message, activeCommunityId);
      if (!moderationResult.approved) {
          toast.error(moderationResult.reason || '消息内容不符合要求');
          return;
      }
      
      try {
        await storeSendMessage(user.id, message.text || '');
        // Toast is not needed here as UI will update via subscription/optimistic update
      } catch (error) {
        toast.error('发送失败');
      }
  }, [user, contentModeration, storeSendMessage, activeCommunityId, checkPermission]);
  
  const submitCreateThread = useCallback(async (data: { title: string; content: string; topic: string; contentType: string; images?: Array<string> }) => {
      // 确保有活跃社群ID
      if (!activeCommunityId) {
        toast.error('请先选择社群');
        return;
      }
      const currentCommunityId = activeCommunityId;
      
      // 确保用户已登录
      if (!user?.id) {
        toast.error('请先登录后再发布帖子');
        return;
      }
      
      // 检查创建帖子的权限
      const canCreatePost = checkPermission(currentCommunityId, 'create_post');
      if (!canCreatePost) {
        toast.error('您没有发布帖子的权限');
        return;
      }
      
      // 内容审核
      const moderationResult = contentModeration({ text: data.title + ' ' + data.content }, currentCommunityId);
      if (!moderationResult.approved) {
        toast.error(moderationResult.reason || '帖子内容不符合要求');
        return;
      }
      
      try {
        // 调用API创建帖子
        const newThread = await communityService.createThread({
          title: data.title,
          content: data.content,
          topic: data.topic,
          communityId: currentCommunityId,
          images: data.images
        }, user.id, user.username || '用户', user.avatar || '');
        
        if (newThread) {
          setThreads(prev => [newThread, ...prev]);
          toast.success('发布成功！');
          setIsCreatePostOpen(false);

          // 发送通知给社群成员（这里简化处理，实际应该获取社群成员列表并发送通知）
          if (user && addNotificationWithNavigate) {
            addNotificationWithNavigate({
              type: 'post_created',
              title: '新帖子发布',
              content: `${user.username} 发布了新帖子《${data.title}》`,
              senderId: user.id,
              senderName: user.username,
              recipientId: 'community', // 社群通知
              communityId: currentCommunityId,
              postId: newThread.id,
              priority: 'low',
              link: `/community/${currentCommunityId}/post/${newThread.id}`
            }, navigate);
          } else if (user) {
            addNotification({
              type: 'post_created',
              title: '新帖子发布',
              content: `${user.username} 发布了新帖子《${data.title}》`,
              senderId: user.id,
              senderName: user.username,
              recipientId: 'community', // 社群通知
              communityId: currentCommunityId,
              postId: newThread.id,
              priority: 'low',
              link: `/community/${currentCommunityId}/post/${newThread.id}`
            });
          }
        }
      } catch (error) {
        console.error('Error creating thread:', error);
        const message = error instanceof Error ? error.message : '发布失败';
        toast.error(message);
      }
  }, [activeCommunityId, contentModeration, checkPermission, user, addNotification, navigate, addNotificationWithNavigate]);

  // 重试发送失败消息
  const retrySendMessage = useCallback((messageId: string) => {
      toast.info('重试功能开发中...');
  }, []);

  // 添加消息反应
  const handleAddReaction = useCallback(async (messageId: string, reaction: string) => {
    try {
      // 调用API添加反应
      const result = await apiService.addReaction(messageId, reaction, user?.id || '');
      
      if (result) {
        // 这里可以添加乐观更新逻辑，直接更新本地状态
        // 实际应用中，消息会通过WebSocket实时更新
        toast.success('添加反应成功');
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('添加反应失败');
    }
  }, [user?.id]);

  // 回复消息
  const handleReplyToMessage = useCallback(async (messageId: string, content: string) => {
    try {
      // 调用API回复消息
      const result = await apiService.replyToMessage(messageId, content, user?.id || '');
      
      if (result) {
        // 这里可以添加乐观更新逻辑，直接更新本地状态
        // 实际应用中，消息会通过WebSocket实时更新
        toast.success('回复消息成功');
      }
    } catch (error) {
      console.error('Error replying to message:', error);
      toast.error('回复消息失败');
    }
  }, [user?.id]);

  const handleCreateCommunity = useCallback(() => {
      setIsCreateCommunityOpen(true);
  }, []);
  
  const submitCreateCommunity = useCallback(async (data: {
    name: string; 
    description: string; 
    tags: string[];
    bookmarks?: Array<{ id: string; name: string; icon: string }>;
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
    };
    layoutType?: 'standard' | 'compact' | 'expanded';
    enabledModules?: {
      posts?: boolean;
      chat?: boolean;
      members?: boolean;
      announcements?: boolean;
    };
    visibility?: 'public' | 'private' | 'invite-only';
    avatar?: string;
    coverImage?: string;
    guidelines?: string[];
  }) => {
    if (!user?.id) {
      toast.error('请先登录后再创建社群');
      return;
    }

    // 检查用户ID是否为临时ID
    if (user.id.includes('user_') && user.id.includes('_')) {
      toast.error('登录状态异常，请重新登录后再创建社群');
      return;
    }

    // 检查图片大小，避免Base64过长导致请求失败
    // 限制为 100KB (约 133333 个字符)
    const MAX_IMAGE_SIZE = 100 * 1024; 
    if (data.avatar && data.avatar.length > MAX_IMAGE_SIZE * 1.37) { // Base64 膨胀系数约 1.37
        toast.error('头像图片过大，请使用小于 100KB 的图片');
        return;
    }
    if (data.coverImage && data.coverImage.length > MAX_IMAGE_SIZE * 1.37) {
        toast.error('封面图片过大，请使用小于 100KB 的图片');
        return;
    }

    try {
      console.log('Submitting community data:', data);
      console.log('User ID:', user.id);
      
      // 调用API创建社群
      const newCommunity = await communityService.createCommunity({
        name: data.name,
        description: data.description,
        tags: data.tags,
        theme: data.theme,
        layoutType: data.layoutType,
        enabledModules: data.enabledModules,
        avatar: data.avatar,
        coverImage: data.coverImage,
        // 传递额外字段，即使 communityService 可能暂时忽略它们
        visibility: data.visibility,
        guidelines: data.guidelines,
        bookmarks: data.bookmarks
      }, user.id);
      
      if (newCommunity) {
        setJoinedCommunities(prev => [newCommunity, ...prev]);
        setAllCommunities(prev => [newCommunity, ...prev]);
        toast.success('社群创建成功！');
        setActiveCommunityId(newCommunity.id);
        setIsCreateCommunityOpen(false);
      }
    } catch (error) {
      console.error('Error creating community:', error);
      const message = error instanceof Error ? error.message : '社群创建失败';
      if (message.includes('未授权') || message.toUpperCase().includes('UNAUTHORIZED') || message.includes('401')) {
        toast.error('登录状态已失效，请重新登录');
        return;
      }
      if (message.includes('foreign key constraint') || message.includes('creator_id_fkey') || message.includes('Key is not present in table "users"')) {
        toast.error('登录状态异常，请重新登录后再创建社群');
        return;
      }
      toast.error(message || '社群创建失败');
    }
  }, [user?.id]);

  const handleCreateThread = useCallback(() => {
      setIsCreatePostOpen(true);
  }, []);



  const handleJoinCommunity = useCallback(async (id: string) => {
      const community = allCommunities.find(c => c.id === id);
      if (!community) return;

      if (!user?.id) {
        toast.error('请先登录后再操作');
        return;
      }

      const isJoined = joinedCommunities.some(c => c.id === id);
      try {
        if (isJoined) {
          // Leave
          await communityService.leaveCommunity(id, user.id);
          setJoinedCommunities(prev => prev.filter(c => c.id !== id));
          toast.success('已退出社群');
        } else {
          // Join
          const result = await communityService.joinCommunity(id, user.id);
          
          if (result.status === 'approved') {
            setJoinedCommunities(prev => [...prev, community]);
            toast.success('已加入社群');
          } else {
            toast.success('加入请求已提交，等待管理员审核');
          }
          
          // 发送通知给社群管理员（这里简化处理，实际应该获取社群管理员并发送通知）
          if (user) {
            notificationUtils.sendCommunityNotification(
              addNotification,
              addNotificationWithNavigate,
              navigate,
              user,
              'member_joined',
              '新成员加入',
              `${user.username} ${result.requiresApproval ? '申请加入' : '加入了'}社群 ${community.name}`,
              id
            );
          }
        }
      } catch (error) {
        console.error('Error joining/leaving community:', error);
        const message = error instanceof Error ? error.message : (isJoined ? '退出社群失败' : '加入社群失败');
        toast.error(message);
      }
  }, [allCommunities, joinedCommunities, user, addNotification, navigate, addNotificationWithNavigate]);

  const handleDeleteCommunity = useCallback(async (id: string) => {
      if (!user?.id) {
        toast.error('请先登录后再操作');
        return;
      }

      // 检查用户是否有权限删除该社群
      const community = joinedCommunities.find(c => c.id === id);
      if (!community) {
        toast.error('社群不存在或您不是成员');
        return;
      }

      const isCreator = community.creatorId === user.id;
      const isAdmin = user.role === 'admin';
      
      if (!isCreator && !isAdmin) {
        toast.error('您没有权限删除该社群');
        return;
      }

      if (!confirm('确定要删除该社群吗？此操作不可恢复。')) {
        return;
      }

      try {
        await communityService.deleteCommunity(id);
        
        // 更新本地状态
        setJoinedCommunities(prev => prev.filter(c => c.id !== id));
        setAllCommunities(prev => prev.filter(c => c.id !== id));
        
        // 如果删除的是当前活跃社群，切换到发现模式
        if (activeCommunityId === id) {
          setActiveCommunityId(null);
          setActiveChannel('communities');
        }
        
        toast.success('社群删除成功');
      } catch (error) {
        console.error('Error deleting community:', error);
        const message = error instanceof Error ? error.message : '删除社群失败';
        toast.error(message);
      }
  }, [user, joinedCommunities, activeCommunityId]);

  // --- Selectors ---
  
  // Filter threads based on active context
  const activeThreads = useMemo(() => {
      if (mode === 'discovery') {
          let filtered = threads;
          
          // 先应用频道筛选
          if (activeChannel === 'feed') {
              // 综合动态 - 返回所有帖子
              filtered = threads;
          } else if (activeChannel === 'hot') {
              // 热门话题 - 按点赞数排序
              filtered = [...threads].sort((a,b) => (b.upvotes || 0) - (a.upvotes || 0));
          } else if (activeChannel === 'fresh') {
              // 最新发布 - 按创建时间排序
              filtered = [...threads].sort((a,b) => b.createdAt - a.createdAt);
          }
          
          // 然后应用标签筛选
          if (selectedTag) {
            filtered = filtered.filter(thread => thread.topic === selectedTag);
          }
          
          return filtered;
      } else {
          // 在社群模式下，只显示当前社群的帖子
          return threads.filter(thread => thread.communityId === activeCommunityId);
      }
  }, [threads, mode, activeChannel, activeCommunityId, selectedTag]);

  // 从所有帖子中动态提取唯一的话题
  const allTags = useMemo(() => {
    // 从帖子中提取所有话题
    const threadTopics = threads.map(thread => thread.topic || '').filter(Boolean);
    // 合并推荐标签和帖子话题，去重并保持推荐标签在前
    const uniqueTags = [...new Set([...RECOMMENDED_TAGS, ...threadTopics])];
    return uniqueTags;
  }, [threads]); // 注意：threads是activeThreads，已经是useMemo缓存的结果

  const activeCommunity = useMemo(() => {
      return joinedCommunities.find(c => c.id === activeCommunityId) || allCommunities.find(c => c.id === activeCommunityId);
  }, [joinedCommunities, allCommunities, activeCommunityId]);

  return {
    user,
    activeCommunityId,
    activeChannel,
    mode,
    joinedCommunities,
    setJoinedCommunities,
    allCommunities, // Export this
    threads: activeThreads,
    messages,
    selectedTag,
    setSelectedTag,
    tags: allTags,
    favoritedThreads,
    isThreadFavorited,
    search,
    setSearch,
    
    // Loading and Error States
    loading,
    errors,
    
    // Modal States
    isCreatePostOpen,
    setIsCreatePostOpen,
    isCreateCommunityOpen,
    setIsCreateCommunityOpen,

    // Actions
    onSelectCommunity: handleSelectCommunity,
    onSelectChannel: handleSelectChannel,
    onCreateCommunity: handleCreateCommunity,
    onJoinCommunity: handleJoinCommunity, // Export this
    onDeleteCommunity: handleDeleteCommunity, // Export delete community method
    submitCreateCommunity,
    onUpvote: handleUpvote,
    onToggleFavorite: handleToggleFavorite,
    onSendMessage: handleSendMessage,
    retrySendMessage,
    onAddReaction: handleAddReaction,
    onReplyToMessage: handleReplyToMessage,
    onCreateThread: handleCreateThread,
    submitCreateThread,
    onAddComment: handleAddComment,
    onCommentUpvote: handleCommentUpvote,
    
    // 新增：权限管理和内容审核相关方法
    checkPermission,
    contentModeration,
    getRecommendedPosts,
    
    activeCommunity,
    unreadNotificationCount: unreadCount
  };
};
