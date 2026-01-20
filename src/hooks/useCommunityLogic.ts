import { useState, useEffect, useMemo, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';
import type { Thread, ChatMessage } from '@/pages/Community';
import { Community, recommendedCommunities } from '@/mock/communities';

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
}

export const useCommunityLogic = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // --- State: Navigation ---
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<string>('communities'); // Default to 'communities'
  
  // Derived State: Mode
  const mode: 'community' | 'discovery' = activeCommunityId ? 'community' : 'discovery';

  // --- State: Data ---
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [threads, setThreads] = useState<(Thread & { comments?: Comment[] })[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('国潮');
  const [favoritedThreads, setFavoritedThreads] = useState<string[]>([]); // 收藏的帖子ID列表

  const [allCommunities, setAllCommunities] = useState<Community[]>([]); // For Discovery

  // --- Data Loading and Persistence ---
  useEffect(() => {
    // Load data from localStorage
    const loadData = () => {
      // Load joined communities
      const savedJoinedCommunities = localStorage.getItem(STORAGE_KEYS.JOINED_COMMUNITIES);
      if (savedJoinedCommunities) {
        setJoinedCommunities(JSON.parse(savedJoinedCommunities));
      } else {
        // Initialize with some communities for the sidebar
        const initialCommunities = recommendedCommunities.slice(0, 5);
        setJoinedCommunities(initialCommunities);
        localStorage.setItem(STORAGE_KEYS.JOINED_COMMUNITIES, JSON.stringify(initialCommunities));
      }
      
      // Load all communities for discovery
      setAllCommunities(recommendedCommunities);
      
      // Load Threads with comments
      const savedThreads = localStorage.getItem(STORAGE_KEYS.THREADS);
      if (savedThreads) {
        setThreads(JSON.parse(savedThreads));
      } else {
        // 添加模拟数据，包含评论
        const mockThreads: (Thread & { comments?: Comment[] })[] = [
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
            comments: [
              {
                id: 'c-1',
                content: '太棒了！学到了很多国潮设计的技巧。',
                createdAt: Date.now() - 1200000,
                user: '用户1',
                avatar: '',
                upvotes: 5
              },
              {
                id: 'c-2',
                content: '请问如何选择合适的国潮配色呢？',
                createdAt: Date.now() - 600000,
                user: '用户2',
                avatar: '',
                upvotes: 2,
                replies: [
                  {
                    id: 'c-3',
                    content: '可以参考中国传统色彩体系，比如故宫色卡。',
                    createdAt: Date.now() - 300000,
                    user: '用户1',
                    avatar: '',
                    upvotes: 3,
                    replyTo: 'c-2'
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
            comments: [
              {
                id: 'c-4',
                content: '非遗文化是我们的宝贵财富，应该更多地融入现代设计。',
                createdAt: Date.now() - 3600000,
                user: '用户3',
                avatar: '',
                upvotes: 4
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
            comments: []
          }
        ];
        setThreads(mockThreads);
        localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(mockThreads));
      }

      // Load favorited threads
      const savedFavoritedThreads = localStorage.getItem(STORAGE_KEYS.FAVORITED_THREADS);
      if (savedFavoritedThreads) {
        setFavoritedThreads(JSON.parse(savedFavoritedThreads));
      }

      // Load initial messages
      const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        const initialMessages = [
          { id: 'm1', user: 'System', text: 'Welcome to the new community experience!', avatar: '', createdAt: Date.now() }
        ];
        setMessages(initialMessages);
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(initialMessages));
      }
    };

    loadData();
  }, []);

  // 数据持久化
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.JOINED_COMMUNITIES, JSON.stringify(joinedCommunities));
  }, [joinedCommunities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAVORITED_THREADS, JSON.stringify(favoritedThreads));
  }, [favoritedThreads]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);

  // --- Actions ---

  const handleSelectCommunity = (id: string | null) => {
    setActiveCommunityId(id);
    // Reset channel when switching
    if (id) {
        setActiveChannel('general');
        // Fetch community specific data here
    } else {
        setActiveChannel('communities'); // Default back to communities grid
    }
  };

  const handleSelectChannel = (channel: string) => {
    setActiveChannel(channel);
  };

  const handleUpvote = (id: string) => {
    setThreads(prev => prev.map(t => 
        t.id === id ? { ...t, upvotes: (t.upvotes || 0) + 1 } : t
    ));
    // Sync to local storage if needed
  };

  const handleToggleFavorite = (id: string) => {
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
  };

  // 检查帖子是否被收藏
  const isThreadFavorited = (id: string) => {
    return favoritedThreads.includes(id);
  };

  // 发表评论
  const handleAddComment = (threadId: string, content: string, replyTo?: string) => {
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      content,
      createdAt: Date.now(),
      user: user?.username || 'Guest',
      avatar: user?.avatar || '',
      upvotes: 0,
      replyTo
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
  };

  // 评论点赞
  const handleCommentUpvote = (threadId: string, commentId: string) => {
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
  };

  // 简单的内容审核机制
  const contentModeration = (message: Partial<ChatMessage>): { approved: boolean; reason?: string } => {
      // 敏感词列表（示例）
      const sensitiveWords = ['违规', '敏感', '不良', '色情', '暴力', '政治'];
      
      // 检查文本内容
      const text = message.text || '';
      const hasSensitiveWords = sensitiveWords.some(word => text.includes(word));
      if (hasSensitiveWords) {
          return { approved: false, reason: '消息包含敏感词' };
      }
      
      // 检查图片内容（简化实现）
      if (message.images && message.images.length > 0) {
          // 模拟图片审核，90%通过率
          const imageApproved = Math.random() > 0.1;
          if (!imageApproved) {
              return { approved: false, reason: '图片内容不符合要求' };
          }
      }
      
      // 检查文件内容（简化实现）
      if (message.files && message.files.length > 0) {
          // 模拟文件审核，95%通过率
          const fileApproved = Math.random() > 0.05;
          if (!fileApproved) {
              return { approved: false, reason: '文件内容不符合要求' };
          }
      }
      
      // 检查富文本内容（简化实现）
      if (message.richContent) {
          const richText = message.richContent;
          const hasSensitiveWords = sensitiveWords.some(word => richText.includes(word));
          if (hasSensitiveWords) {
              return { approved: false, reason: '富文本内容包含敏感词' };
          }
      }
      
      return { approved: true };
  };

  const handleSendMessage = (message: Partial<ChatMessage>) => {
      // 内容审核
      const moderationResult = contentModeration(message);
      if (!moderationResult.approved) {
          toast.error(moderationResult.reason || '消息内容不符合要求');
          return;
      }
      
      // 创建新消息，初始状态为发送中
      const newMsg: ChatMessage = {
          id: `m-${Date.now()}`,
          user: user?.username || 'Guest',
          text: message.text || '',
          avatar: user?.avatar || '',
          createdAt: Date.now(),
          type: message.type || 'text',
          images: message.images,
          files: message.files,
          richContent: message.richContent,
          sendStatus: 'sending',
          retryCount: 0
      };
      
      // 添加到消息列表
      setMessages(prev => [...prev, newMsg]);
      
      // 模拟异步发送过程
      setTimeout(() => {
          // 模拟发送结果，80%成功率
          const sendSuccess = Math.random() > 0.2;
          
          setMessages(prev => prev.map(msg => {
              if (msg.id === newMsg.id) {
                  return {
                      ...msg,
                      sendStatus: sendSuccess ? 'sent' : 'failed'
                  };
              }
              return msg;
          }));
      }, 1000);
  };

  // 重试发送失败消息
  const retrySendMessage = (messageId: string) => {
      setMessages(prev => prev.map(msg => {
          if (msg.id === messageId && msg.sendStatus === 'failed') {
              // 更新状态为发送中，并增加重试次数
              return {
                  ...msg,
                  sendStatus: 'sending',
                  retryCount: (msg.retryCount || 0) + 1
              };
          }
          return msg;
      }));
      
      // 模拟重试发送
      setTimeout(() => {
          // 模拟发送结果，90%成功率（重试时成功率更高）
          const sendSuccess = Math.random() > 0.1;
          
          setMessages(prev => prev.map(msg => {
              if (msg.id === messageId) {
                  return {
                      ...msg,
                      sendStatus: sendSuccess ? 'sent' : 'failed'
                  };
              }
              return msg;
          }));
      }, 1000);
  };

  // 添加消息反应
  const handleAddReaction = (messageId: string, reaction: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || {};
        const newReactions = { ...reactions };
        
        if (newReactions[reaction]) {
          // 如果已经有这个反应，就移除用户
          newReactions[reaction] = newReactions[reaction].filter(u => u !== (user?.username || 'Guest'));
          // 如果这个反应没有用户了，就移除这个反应
          if (newReactions[reaction].length === 0) {
            delete newReactions[reaction];
          }
        } else {
          // 如果没有这个反应，就添加用户
          newReactions[reaction] = [user?.username || 'Guest'];
        }
        
        return {
          ...msg,
          reactions: newReactions
        };
      }
      return msg;
    }));
  };

  // 回复消息
  const handleReplyToMessage = (messageId: string, content: string) => {
    // 先获取要回复的消息
    const messageToReply = messages.find(msg => msg.id === messageId);
    if (!messageToReply) return;

    // 创建新消息，包含回复信息
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      user: user?.username || 'Guest',
      text: content,
      avatar: user?.avatar || '',
      createdAt: Date.now(),
      type: 'text',
      sendStatus: 'sending',
      retryCount: 0,
      replyTo: {
        id: messageId,
        user: messageToReply.user,
        text: messageToReply.text || ''
      }
    };
    
    // 添加到消息列表
    setMessages(prev => [...prev, newMsg]);
    
    // 模拟异步发送过程
    setTimeout(() => {
      // 模拟发送结果，80%成功率
      const sendSuccess = Math.random() > 0.2;
      
      setMessages(prev => prev.map(msg => {
        if (msg.id === newMsg.id) {
          return {
            ...msg,
            sendStatus: sendSuccess ? 'sent' : 'failed'
          };
        }
        return msg;
      }));
    }, 1000);
  };

  const handleCreateCommunity = () => {
      setIsCreateCommunityOpen(true);
  };
  
  const submitCreateCommunity = (data: { name: string; description: string; tags: string[] }) => {
      const newCommunity: Community = {
          id: `c-${Date.now()}`,
          name: data.name,
          description: data.description,
          tags: data.tags,
          cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Abstract%20community%20banner',
          members: 1
      };
      setJoinedCommunities(prev => [newCommunity, ...prev]);
      toast.success('社群创建成功！');
      setActiveCommunityId(newCommunity.id);
  };

  const handleCreateThread = () => {
      setIsCreatePostOpen(true);
  }

  const submitCreateThread = (data: { title: string; content: string; topic: string }) => {
      const newThread: Thread = {
          id: `t-${Date.now()}`,
          title: data.title,
          content: data.content,
          topic: data.topic,
          createdAt: Date.now(),
          replies: [],
          upvotes: 0
      };
      setThreads(prev => [newThread, ...prev]);
      toast.success('发布成功！');
  };

  // --- Selectors ---
  
  // Filter threads based on active context
  const activeThreads = useMemo(() => {
      if (mode === 'discovery') {
          // Filter by tag if selected
          if (activeChannel === 'feed') return threads;
          if (activeChannel === 'hot') return [...threads].sort((a,b) => (b.upvotes || 0) - (a.upvotes || 0));
          return threads;
      } else {
          // Filter by community (simulated since we don't have communityId in Thread type yet)
          // In real app: return threads.filter(t => t.communityId === activeCommunityId)
          return threads; 
      }
  }, [threads, mode, activeChannel, activeCommunityId]);

  const activeCommunity = useMemo(() => {
      return joinedCommunities.find(c => c.id === activeCommunityId);
  }, [joinedCommunities, activeCommunityId]);

  const handleJoinCommunity = (id: string) => {
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
  };

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
    tags: RECOMMENDED_TAGS,
    favoritedThreads,
    isThreadFavorited,
    
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
    
    activeCommunity
  };
};
