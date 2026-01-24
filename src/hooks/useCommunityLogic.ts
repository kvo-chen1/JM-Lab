import { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';
import type { Thread, ChatMessage } from '@/pages/Community';
import { Community, recommendedCommunities } from '@/mock/communities';
import { useChatStore } from '@/stores/chatStore';

export const CREATOR_COMMUNITY_ID = 'creator-community';

export const CREATOR_COMMUNITY_DATA = {
  id: CREATOR_COMMUNITY_ID,
  name: '创作者社区',
  description: '分享创作灵感，交流创作经验',
  memberCount: 1234,
  topic: '创作',
  avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=creator',
  isActive: true,
  isSpecial: true, // Mark as special to handle differently if needed
  theme: {
    primaryColor: '#3B82F6', // 蓝色主题
    secondaryColor: '#60A5FA',
    backgroundColor: '', // 使用默认背景色
    textColor: '' // 使用默认文字颜色
  },
  layoutType: 'standard',
  enabledModules: {
    posts: true,
    chat: true,
    members: true,
    announcements: true
  }
};

// Mock Data for Discovery
const RECOMMENDED_TAGS = ['国潮', '非遗', '极简', '赛博朋克', '3D艺术', '插画', 'UI设计'];

// 本地存储键名
const STORAGE_KEYS = {
  JOINED_COMMUNITIES: 'jmzf_joined_communities',
  THREADS: 'jmzf_threads',
  FAVORITED_THREADS: 'jmzf_favorited_threads',
  MESSAGES: 'jmzf_messages'
};

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

// 模拟线程数据
const MOCK_THREADS: (Thread & { comments?: Comment[] })[] = [
  {
    id: 't-1',
    title: '如何创建高质量的国潮设计作品？',
    content: '分享一些国潮设计的技巧和经验，希望能帮助大家创作更好的作品。',
    topic: '国潮',
    createdAt: Date.now() - 3600000, // 1小时前
    replies: [
      { id: 'r-1', content: '非常有用的建议，谢谢分享！', createdAt: Date.now() - 1800000 }
    ],
    upvotes: 15,
    communityId: CREATOR_COMMUNITY_ID, // 关联到创作者社区
    comments: [
      {
        id: 'c-1',
        content: '太棒了！学到了很多国潮设计的技巧。',
        createdAt: Date.now() - 1200000,
        user: '用户1',
        avatar: '',
        upvotes: 5,
        communityId: CREATOR_COMMUNITY_ID // 评论关联到同一社群
      },
      {
        id: 'c-2',
        content: '请问如何选择合适的国潮配色呢？',
        createdAt: Date.now() - 600000,
        user: '用户2',
        avatar: '',
        upvotes: 2,
        communityId: CREATOR_COMMUNITY_ID, // 评论关联到同一社群
        replies: [
          {
            id: 'c-3',
            content: '可以参考中国传统色彩体系，比如故宫色卡。',
            createdAt: Date.now() - 300000,
            user: '用户1',
            avatar: '',
            upvotes: 3,
            replyTo: 'c-2',
            communityId: CREATOR_COMMUNITY_ID // 回复也关联到同一社群
          }
        ]
      }
    ]
  },
  {
    id: 't-2',
    title: '非遗文化元素在现代设计中的应用',
    content: '探讨非遗文化元素如何更好地融入现代设计中。',
    topic: '非遗',
    createdAt: Date.now() - 7200000, // 2小时前
    replies: [],
    upvotes: 10,
    communityId: CREATOR_COMMUNITY_ID, // 关联到创作者社区
    comments: [
      {
        id: 'c-4',
        content: '非遗文化是我们的宝贵财富，应该更多地融入现代设计。',
        createdAt: Date.now() - 3600000,
        user: '用户3',
        avatar: '',
        upvotes: 4,
        communityId: CREATOR_COMMUNITY_ID // 评论关联到同一社群
      }
    ]
  },
  {
    id: 't-3',
    title: '极简设计的核心原则',
    content: '极简设计不仅仅是简单，而是在简单中追求完美。',
    topic: '极简',
    createdAt: Date.now() - 10800000, // 3小时前
    replies: [
      { id: 'r-2', content: '说得很对，极简设计需要更多的思考和细节打磨。', createdAt: Date.now() - 5400000 }
    ],
    upvotes: 8,
    communityId: 'community-1', // 关联到其他社群
    comments: []
  },
  {
    id: 't-4',
    title: '赛博朋克风格的色彩搭配技巧',
    content: '分享赛博朋克风格设计中的色彩运用方法。',
    topic: '赛博朋克',
    createdAt: Date.now() - 14400000, // 4小时前
    replies: [],
    upvotes: 12,
    communityId: 'community-2', // 关联到其他社群
    comments: []
  },
  {
    id: 't-5',
    title: '3D艺术创作的新趋势',
    content: '探讨3D艺术在设计领域的最新应用和趋势。',
    topic: '3D艺术',
    createdAt: Date.now() - 18000000, // 5小时前
    replies: [],
    upvotes: 6,
    communityId: 'community-3', // 关联到其他社群
    comments: []
  },
  {
    id: 't-6',
    title: '插画创作中的故事性表达',
    content: '如何在插画中更好地讲述故事。',
    topic: '插画',
    createdAt: Date.now() - 21600000, // 6小时前
    replies: [
      { id: 'r-3', content: '这个主题很有趣，期待更多的分享！', createdAt: Date.now() - 10800000 }
    ],
    upvotes: 9,
    communityId: CREATOR_COMMUNITY_ID, // 关联到创作者社区
    comments: []
  },
  {
    id: 't-7',
    title: 'UI设计中的用户体验优化',
    content: '分享一些UI设计中提升用户体验的小技巧。',
    topic: 'UI设计',
    createdAt: Date.now() - 25200000, // 7小时前
    replies: [],
    upvotes: 11,
    communityId: CREATOR_COMMUNITY_ID, // 关联到创作者社区
    comments: []
  }
];

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

export const useCommunityLogic = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // --- State: Navigation ---
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<string>('communities'); // Default to 'communities'
  
  // Derived State: Mode
  const mode: 'community' | 'discovery' = (activeCommunityId && activeCommunityId !== CREATOR_COMMUNITY_ID) ? 'community' : 'discovery';

  // --- State: Data ---
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [threads, setThreads] = useState<(Thread & { comments?: Comment[] })[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('国潮');
  const [favoritedThreads, setFavoritedThreads] = useState<string[]>([]); // 收藏的帖子ID列表
  const [search, setSearch] = useState(''); // 搜索关键词

  // 直接使用mock数据作为初始值，确保每次刷新都能获取最新的社群列表
  const [allCommunities, setAllCommunities] = useState<Community[]>(JSON.parse(JSON.stringify(recommendedCommunities))); // For Discovery

  // Ensure Creator Community is always in the lists or accessible
  useEffect(() => {
    // We can ensure it's in allCommunities if not present
    setAllCommunities(prev => {
      if (prev.find(c => c.id === CREATOR_COMMUNITY_ID)) return prev;
      return [CREATOR_COMMUNITY_DATA as any, ...prev];
    });
    
    // We can also ensure it's in joinedCommunities if we want it pinned, 
    // or just let the user join it. For now, let's auto-join/pin it for visibility
    setJoinedCommunities(prev => {
      if (prev.find(c => c.id === CREATOR_COMMUNITY_ID)) return prev;
      return [CREATOR_COMMUNITY_DATA as any, ...prev];
    });
  }, []);

  // --- Chat Store Integration ---
  const { 
    messages: chatStoreMessages, 
    sendMessage: storeSendMessage, 
    setActiveChannel: storeSetActiveChannel,
    subscribeToChannel: storeSubscribe,
    fetchMessages: storeFetchMessages
  } = useChatStore();

  // Modal States
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);

  // --- Data Loading and Persistence ---
  useEffect(() => {
    // Load data from localStorage
    const loadData = () => {
      // 使用安全的recommendedCommunities，确保它不是undefined
      const safeRecommendedCommunities = recommendedCommunities || [];
      
      // Load joined communities
      const savedJoinedCommunities = localStorageUtils.get<Community[]>(STORAGE_KEYS.JOINED_COMMUNITIES, []);
      if (savedJoinedCommunities.length > 0) {
        setJoinedCommunities(savedJoinedCommunities);
      } else {
        // Initialize with some communities for the sidebar
        const initialCommunities = safeRecommendedCommunities.slice(0, 5);
        setJoinedCommunities(initialCommunities);
        localStorageUtils.set(STORAGE_KEYS.JOINED_COMMUNITIES, initialCommunities);
      }
      
      // Load all communities for discovery - 使用深拷贝确保数据独立性
      setAllCommunities(JSON.parse(JSON.stringify(safeRecommendedCommunities)));
      
      // Load Threads with comments
      const savedThreads = localStorageUtils.get<(Thread & { comments?: Comment[] })[]>(STORAGE_KEYS.THREADS, []);
      if (savedThreads.length > 0) {
        setThreads(savedThreads);
      } else {
        // 添加模拟数据，包含评论
        setThreads(MOCK_THREADS);
        localStorageUtils.set(STORAGE_KEYS.THREADS, MOCK_THREADS);
      }

      // Load favorited threads
      const savedFavoritedThreads = localStorageUtils.get<string[]>(STORAGE_KEYS.FAVORITED_THREADS, []);
      setFavoritedThreads(savedFavoritedThreads);
    };

    loadData();
  }, []);

  // 数据持久化 - 使用useCallback优化性能
  const saveJoinedCommunities = useCallback((communities: Community[]) => {
    localStorageUtils.set(STORAGE_KEYS.JOINED_COMMUNITIES, communities);
  }, []);

  const saveThreads = useCallback((threadsData: (Thread & { comments?: Comment[] })[]) => {
    localStorageUtils.set(STORAGE_KEYS.THREADS, threadsData);
  }, []);

  const saveFavoritedThreads = useCallback((favorites: string[]) => {
    localStorageUtils.set(STORAGE_KEYS.FAVORITED_THREADS, favorites);
  }, []);

  // 优化localStorage写入，减少不必要的写入操作
  useEffect(() => {
    saveJoinedCommunities(joinedCommunities);
  }, [joinedCommunities, saveJoinedCommunities]);

  useEffect(() => {
    saveThreads(threads);
  }, [threads, saveThreads]);

  useEffect(() => {
    saveFavoritedThreads(favoritedThreads);
  }, [favoritedThreads, saveFavoritedThreads]);

  // Map store messages to UI ChatMessage type
  const messages: ChatMessage[] = useMemo(() => {
    return chatStoreMessages.map(msg => ({
      id: msg.id,
      user: msg.sender?.username || 'Unknown',
      text: msg.content,
      avatar: msg.sender?.avatar_url || '',
      createdAt: new Date(msg.created_at).getTime(),
      type: 'text', // Default to text for now
      sendStatus: 'sent'
    }));
  }, [chatStoreMessages]);

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

  const handleSelectCommunity = useCallback((id: string | null) => {
    if (id) {
      // 检查用户是否已经加入该社群
      const isJoined = joinedCommunities.some(c => c.id === id);
      if (isJoined) {
        setActiveCommunityId(id);
        // 不再设置channel，使用默认值
        // Fetch community specific data here
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
    if (channel === 'creators') {
      setActiveCommunityId(CREATOR_COMMUNITY_ID);
    }
  }, []);

  const handleUpvote = useCallback((id: string) => {
    setThreads(prev => prev.map(t => 
        t.id === id ? { ...t, upvotes: (t.upvotes || 0) + 1 } : t
    ));
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    setFavoritedThreads(prev => {
      if (prev.includes(id)) {
        // 取消收藏
        const newFavorites = prev.filter(threadId => threadId !== id);
        toast.success('已取消收藏');
        return newFavorites;
      } else {
        // 添加收藏
        const newFavorites = [...prev, id];
        toast.success('收藏成功');
        return newFavorites;
      }
    });
  }, []);

  // 检查帖子是否被收藏
  const isThreadFavorited = useCallback((id: string) => {
    return favoritedThreads.includes(id);
  }, [favoritedThreads]);

  // 发表评论
  const handleAddComment = useCallback((threadId: string, content: string, replyTo?: string) => {
    // 查找帖子，获取所属社群ID
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;
    
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      content,
      createdAt: Date.now(),
      user: user?.username || 'Guest',
      avatar: user?.avatar || '',
      upvotes: 0,
      replyTo,
      communityId: thread.communityId // 关联到帖子所属的社群ID
    };

    setThreads(prev => prev.map(thread => {
      if (thread.id === threadId) {
        if (!thread.comments) {
          return {
            ...thread,
            comments: [newComment]
          };
        } else if (replyTo) {
          // 查找并回复指定评论
          const findAndReply = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
              if (comment.id === replyTo) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newComment]
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
            comments: [newComment, ...thread.comments]
          };
        }
      }
      return thread;
    }));

    toast.success('评论成功！');
  }, [user, threads]);

  // 评论点赞
  const handleCommentUpvote = useCallback((threadId: string, commentId: string) => {
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
      // 敏感词列表（示例）
      const sensitiveWords = ['违规', '敏感', '不良', '色情', '暴力', '政治'];
      
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
      
      // 预留社群自定义审核规则的接口
      // 实际应用中，这里可以根据社群ID获取该社群的自定义审核规则
      if (communityId) {
        // 示例：某些社群可能有更严格的审核规则
        const strictCommunities = ['community-1', 'community-2'];
        if (strictCommunities.includes(communityId)) {
          // 更严格的审核逻辑
        }
      }
      
      return { approved: true };
  }, []);
  
  // 个性化推荐接口，预留用于未来扩展
  const getRecommendedPosts = useCallback((communityId: string, limit: number = 10) => {
    // 简化的推荐逻辑，实际应用中应该使用推荐算法
    // 这里简单返回该社群的热门帖子
    const communityPosts = threads.filter(t => t.communityId === communityId);
    return [...communityPosts]
      .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
      .slice(0, limit);
  }, [threads]);

  const handleSendMessage = useCallback(async (message: Partial<ChatMessage>) => {
      if (!user) {
        toast.error('请先登录');
        return;
      }

      // 检查创建消息的权限
      const canCreateMessage = checkPermission(activeCommunityId || CREATOR_COMMUNITY_ID, 'comment');
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
  
  const submitCreateThread = useCallback((data: { title: string; content: string; topic: string; contentType: string; images?: Array<string> }) => {
      // 确保有活跃社群ID，如果没有则使用创作者社区ID作为默认值
      const currentCommunityId = activeCommunityId || CREATOR_COMMUNITY_ID;
      
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
      
      const newThread: Thread = {
          id: `t-${Date.now()}`,
          title: data.title,
          content: data.content,
          topic: data.topic,
          createdAt: Date.now(),
          replies: [],
          upvotes: 0,
          images: data.images,
          communityId: currentCommunityId // 自动关联当前活跃社群ID
      };
      setThreads(prev => [newThread, ...prev]);
      toast.success('发布成功！');
  }, [activeCommunityId, contentModeration, checkPermission]);

  // 重试发送失败消息
  const retrySendMessage = useCallback((messageId: string) => {
      toast.info('重试功能开发中...');
  }, []);

  // 添加消息反应
  const handleAddReaction = useCallback((messageId: string, reaction: string) => {
    toast.info('表情互动功能开发中...');
  }, []);

  // 回复消息
  const handleReplyToMessage = useCallback((messageId: string, content: string) => {
    toast.info('回复功能开发中...');
  }, []);

  const handleCreateCommunity = useCallback(() => {
      setIsCreateCommunityOpen(true);
  }, []);
  
  const submitCreateCommunity = useCallback((data: {
    name: string; 
    description: string; 
    tags: string[];
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
  }) => {
      const newCommunity: Community = {
          id: `c-${Date.now()}`,
          name: data.name,
          description: data.description,
          memberCount: 1,
          topic: data.tags[0] || '其他',
          avatar: 'https://picsum.photos/seed/community/200/200',
          isActive: true,
          // 添加自定义风格字段
          theme: data.theme,
          layoutType: data.layoutType,
          enabledModules: data.enabledModules
      };
      setJoinedCommunities(prev => [newCommunity, ...prev]);
      toast.success('社群创建成功！');
      setActiveCommunityId(newCommunity.id);
  }, []);

  const handleCreateThread = useCallback(() => {
      setIsCreatePostOpen(true);
  }, []);



  const handleJoinCommunity = useCallback((id: string) => {
      const community = allCommunities.find(c => c.id === id);
      if (!community) return;

      const isJoined = joinedCommunities.some(c => c.id === id);
      if (isJoined) {
          // Leave
          setJoinedCommunities(prev => prev.filter(c => c.id !== id));
          toast.success('已退出社群');
      } else {
          // Join
          setJoinedCommunities(prev => [...prev, community]);
          toast.success('已加入社群');
      }
  }, [allCommunities, joinedCommunities]);

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
  }, [threads]);

  const activeCommunity = useMemo(() => {
      return joinedCommunities.find(c => c.id === activeCommunityId);
  }, [joinedCommunities, activeCommunityId]);

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
    
    activeCommunity
  };
};
