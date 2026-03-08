import { mentionService } from './mentionService';

// 社区类型定义
export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
}



// 社区类型定义
export interface Community {
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
  creatorId?: string;
  createdAt?: string;
  updatedAt?: string;
  joinApprovalRequired?: boolean;
  cover?: string;
  tags?: string[];
  bookmarks?: Array<{ id: string; name: string; icon: string; url?: string }>;
  guidelines?: string[];
}

// 帖子类型定义
export interface Thread {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  replies: Array<{ id: string; content: string; createdAt: number }>;
  pinned?: boolean;
  topic?: string;
  upvotes?: number;
  images?: Array<string>;
  videos?: Array<string>;
  audios?: Array<string>;
  communityId: string;
  author?: string;
  authorAvatar?: string;
  authorId?: string;
  comments?: Array<any>;
}

// 消息类型定义
export interface Message {
  id: string;
  text: string;
  user: string;
  userId: string;
  avatar?: string;
  timestamp: number;
  type?: 'text' | 'image' | 'emoji';
  images?: Array<{ url: string; name: string; size: number }>;
  sender?: {
    username: string;
    avatar_url?: string;
  };
  created_at?: number;
  reactions?: Record<string, string[]>;
  is_pinned?: boolean;
  username?: string;
}

// 通知类型定义
export interface Notification {
  id: string;
  type: 'post_like' | 'post_comment' | 'comment_reply' | 'community_join' | 'community_announcement' | 'friend_request' | 'message';
  title: string;
  content: string;
  userId: string;
  relatedId?: string; // 相关内容ID，如帖子ID、评论ID等
  relatedType?: string; // 相关内容类型
  isRead: boolean;
  createdAt: string;
  icon?: string;
  color?: string;
  link?: string; // 跳转链接
}

export const communityService = {
  // 社区管理功能
  async getCommunities(includeInactive = false): Promise<Community[]> {
    try {
      const response = await fetch('/api/communities');
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          console.log('[getCommunities] Fetched from backend API:', result.data.length);
          let communities = result.data.map((community: any) => ({
            id: community.id,
            name: community.name,
            description: community.description,
            memberCount: community.member_count || community.members_count || 0,
            topic: community.tags?.join(',') || '',
            avatar: community.avatar || community.avatar_url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=community%20avatar%20placeholder&image_size=square',
            cover: community.cover,
            isActive: community.is_active !== false,
            tags: community.tags || [],
            bookmarks: community.bookmarks || [],
            theme: {
              primaryColor: community.theme?.primaryColor || '#3b82f6',
              secondaryColor: community.theme?.secondaryColor || '#60a5fa',
              backgroundColor: community.theme?.backgroundColor || '#f3f4f6',
              textColor: community.theme?.textColor || '#1f2937'
            },
            layoutType: (community.layout_type as 'standard' | 'compact' | 'expanded') || 'standard',
            enabledModules: {
              posts: true,
              chat: true,
              members: true,
              announcements: true
            },
            isSpecial: community.is_special || false,
            creatorId: community.creator_id || '',
            createdAt: community.created_at,
            updatedAt: community.updated_at
          }));
          
          // 过滤掉禁用的社群（除非明确要求包含）
          if (!includeInactive) {
            communities = communities.filter(c => c.isActive !== false);
          }
          return communities;
        }
      }
      throw new Error('Failed to fetch communities from API');
    } catch (error) {
      console.error('[getCommunities] Error:', error);
      return [];
    }
  },

  async getUserCommunities(userId: string): Promise<Community[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      console.error('[getUserCommunities] No token found');
      return [];
    }

    try {
      console.log('[getUserCommunities] Trying backend API...');
      const response = await fetch('/api/user/communities', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          const communities = result.data;
          
          const joinedCommunities: Community[] = communities.map(community => ({
            id: community.id,
            name: community.name,
            description: community.description,
            memberCount: community.member_count || 0,
            topic: community.tags?.join(',') || '',
            avatar: community.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=community%20avatar%20placeholder&image_size=square',
            cover: community.cover,
            isActive: true,
            tags: community.tags || [],
            bookmarks: community.bookmarks || [],
            theme: {
              primaryColor: community.theme?.primaryColor || '#3b82f6',
              secondaryColor: community.theme?.secondaryColor || '#60a5fa',
              backgroundColor: community.theme?.backgroundColor || '#f3f4f6',
              textColor: community.theme?.textColor || '#1f2937'
            },
            layoutType: (community.layout_type as 'standard' | 'compact' | 'expanded') || 'standard',
            enabledModules: {
              posts: true,
              chat: true,
              members: true,
              announcements: true
            },
            isSpecial: false,
            creatorId: community.creator_id || '',
            createdAt: community.created_at,
            updatedAt: community.updated_at
          }));
          
          console.log('[getUserCommunities] Backend API success, joined communities:', joinedCommunities.length);
          return joinedCommunities;
        }
      }
      throw new Error('Failed to fetch user communities from API');
    } catch (error) {
      console.error('[getUserCommunities] Error:', error);
      return [];
    }
  },

  async createCommunity(data: {
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
    visibility?: 'public' | 'private' | 'invite-only';
    avatar?: string;
    coverImage?: string;
    guidelines?: string[];
    bookmarks?: Array<{ id: string; name: string; icon: string }>;
    joinApprovalRequired?: boolean;
  }, userId: string): Promise<Community> {
    // 验证用户ID
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      const error = new Error('Invalid user ID: User must be properly authenticated');
      console.error('Invalid user ID for community creation:', userId);
      throw error;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再创建社群');
    }

    try {
      console.log('[createCommunity] Trying backend API...');
      const response = await fetch('/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          tags: data.tags,
          avatar: data.avatar,
          coverImage: data.coverImage,
          theme: data.theme,
          layoutType: data.layoutType,
          enabledModules: data.enabledModules,
          visibility: data.visibility,
          bookmarks: data.bookmarks
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && result.data) {
          console.log('[createCommunity] Success via backend API:', result.data);
          const community = result.data;
          return {
            id: community.id,
            name: community.name,
            description: community.description,
            memberCount: community.member_count || 1,
            topic: community.topic || '',
            avatar: community.avatar || data.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=community%20avatar%20placeholder&image_size=square',
            cover: community.cover,
            isActive: community.is_active !== false,
            tags: community.tags || [],
            bookmarks: community.bookmarks || [],
            theme: {
              primaryColor: data.theme?.primaryColor || '#3b82f6',
              secondaryColor: data.theme?.secondaryColor || '#60a5fa',
              backgroundColor: '#f3f4f6',
              textColor: '#1f2937'
            },
            layoutType: (data.layoutType as 'standard' | 'compact' | 'expanded') || 'standard',
            enabledModules: {
              posts: data.enabledModules?.posts ?? true,
              chat: data.enabledModules?.chat ?? true,
              members: data.enabledModules?.members ?? true,
              announcements: data.enabledModules?.announcements ?? true
            },
            isSpecial: false,
            creatorId: userId,
            createdAt: community.created_at || new Date().toISOString(),
            updatedAt: community.updated_at || new Date().toISOString()
          };
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '创建社群失败，请稍后重试');
    } catch (error) {
      console.error('[createCommunity] Error:', error);
      throw error;
    }
  },

  async joinCommunity(communityId: string, userId: string): Promise<{ requiresApproval: boolean; status: string }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再加入社群');
    }

    try {
      console.log('[joinCommunity] Calling backend API:', `/api/communities/${communityId}/join`);
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('[joinCommunity] Backend API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('[joinCommunity] Backend API result:', result);
        if (result.code === 0) {
          console.log('[joinCommunity] Successfully joined via backend API');
          return { 
            requiresApproval: result.data?.requiresApproval || false, 
            status: result.data?.status || 'approved' 
          };
        }
      }
      // 后端 API 失败，抛出错误
      const errorData = await response.json().catch(() => ({}));
      console.error('[joinCommunity] Backend API failed:', response.status, errorData);
      throw new Error(errorData.message || '加入社群失败，请稍后重试');
    } catch (error) {
      console.error('joinCommunity 整体错误:', error);
      throw error;
    }
  },

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch(`/api/communities/${communityId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          console.log('[leaveCommunity] Successfully left via backend API');
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '退出社群失败，请稍后重试');
    } catch (error) {
      console.error('leaveCommunity 整体错误:', error);
      throw error;
    }
  },

  async getCommunity(communityId: string): Promise<Community> {
    try {
      const response = await fetch(`/api/communities/${communityId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && result.data) {
          const community = result.data;
          return {
            id: community.id,
            name: community.name,
            description: community.description,
            memberCount: community.member_count || community.members_count || 0,
            topic: community.tags?.join(',') || '',
            avatar: community.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=community%20avatar%20placeholder&image_size=square',
            cover: community.cover,
            isActive: true,
            tags: community.tags || [],
            bookmarks: community.bookmarks || [],
            theme: {
              primaryColor: community.theme?.primaryColor || '#3b82f6',
              secondaryColor: community.theme?.secondaryColor || '#60a5fa',
              backgroundColor: community.theme?.backgroundColor || '#f3f4f6',
              textColor: community.theme?.textColor || '#1f2937'
            },
            layoutType: (community.layout_type as 'standard' | 'compact' | 'expanded') || 'standard',
            enabledModules: {
              posts: true,
              chat: true,
              members: true,
              announcements: true
            },
            isSpecial: false,
            creatorId: community.creator_id || '',
            createdAt: community.created_at,
            updatedAt: community.updated_at,
            joinApprovalRequired: community.join_approval_required || false
          };
        }
      }
      throw new Error('Failed to fetch community from API');
    } catch (error) {
      console.error('[getCommunity] Error:', error);
      throw error;
    }
  },

  // 获取社群的待审核加入请求
  async getPendingJoinRequests(communityId: string): Promise<any[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch(`/api/communities/${communityId}/join-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          return result.data;
        }
      }
      throw new Error('Failed to fetch pending join requests');
    } catch (error) {
      console.error('[getPendingJoinRequests] Error:', error);
      return [];
    }
  },

  // 批准加入请求
  async approveJoinRequest(requestId: string, communityId: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch(`/api/communities/${communityId}/join-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '批准加入请求失败');
    } catch (error) {
      console.error('[approveJoinRequest] Error:', error);
      throw error;
    }
  },

  // 拒绝加入请求
  async rejectJoinRequest(requestId: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch(`/api/join-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '拒绝加入请求失败');
    } catch (error) {
      console.error('[rejectJoinRequest] Error:', error);
      throw error;
    }
  },

  // 更新社群的审核设置
  async updateJoinApprovalSetting(communityId: string, requireApproval: boolean): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch(`/api/communities/${communityId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ join_approval_required: requireApproval })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '更新审核设置失败');
    } catch (error) {
      console.error('[updateJoinApprovalSetting] Error:', error);
      throw error;
    }
  },

  async updateCommunity(communityId: string, data: Partial<Community> & { joinApprovalRequired?: boolean }): Promise<Community> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    // 准备更新数据，转换字段名
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.cover !== undefined) updateData.cover = data.cover;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.joinApprovalRequired !== undefined) updateData.join_approval_required = data.joinApprovalRequired;

    try {
      const response = await fetch(`/api/communities/${communityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && result.data) {
          const updatedCommunity = result.data;
          return {
            id: updatedCommunity.id,
            name: updatedCommunity.name,
            description: updatedCommunity.description,
            memberCount: updatedCommunity.member_count || 0,
            topic: updatedCommunity.tags?.join(',') || '',
            avatar: updatedCommunity.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=community%20avatar%20placeholder&image_size=square',
            cover: updatedCommunity.cover,
            isActive: true,
            tags: updatedCommunity.tags || [],
            bookmarks: updatedCommunity.bookmarks || [],
            theme: {
              primaryColor: updatedCommunity.theme?.primaryColor || '#3b82f6',
              secondaryColor: updatedCommunity.theme?.secondaryColor || '#60a5fa',
              backgroundColor: updatedCommunity.theme?.backgroundColor || '#f3f4f6',
              textColor: updatedCommunity.theme?.textColor || '#1f2937'
            },
            layoutType: (updatedCommunity.layout_type as 'standard' | 'compact' | 'expanded') || 'standard',
            enabledModules: updatedCommunity.enabled_modules || {
              posts: true,
              chat: true,
              members: true,
              announcements: true
            },
            isSpecial: false,
            creatorId: updatedCommunity.creator_id || '',
            createdAt: updatedCommunity.created_at,
            updatedAt: updatedCommunity.updated_at
          };
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '更新社区失败');
    } catch (error) {
      console.error('[updateCommunity] Error:', error);
      throw error;
    }
  },

  // 创建帖子（用于分享作品到社群）
  async createPost(data: {
    title: string;
    content: string;
    topic: string;
    communityIds: string[];
    workId?: string;
    images?: string[];
    videos?: string[];
    mentionedUserIds?: string[];
  }): Promise<Thread[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user || !user.id) {
      throw new Error('请先登录后再分享作品');
    }

    if (!token) {
      throw new Error('请先登录后再分享作品');
    }

    const createdThreads: Thread[] = [];

    // 为每个选中的社群创建帖子
    for (const communityId of data.communityIds) {
      try {
        let newPostId: string;
        
        const response = await fetch(`/api/communities/${communityId}/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: data.title,
            content: data.content + (data.workId ? `\n\n[分享作品ID: ${data.workId}]` : ''),
            images: data.images,
            videos: data.videos
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.code === 0) {
            newPostId = result.data.id;
            createdThreads.push({
              id: result.data.id,
              title: result.data.title,
              content: result.data.content,
              createdAt: new Date(result.data.created_at).getTime(),
              replies: [],
              topic: data.topic,
              upvotes: 0,
              images: result.data.images || [],
              videos: result.data.videos || [],
              communityId: communityId,
              author: user.username || user.name || '用户',
              authorAvatar: user.avatar_url || user.avatar,
              authorId: user.id,
              comments: []
            });
            
            // 处理@提及
            if (data.mentionedUserIds && data.mentionedUserIds.length > 0) {
              try {
                await mentionService.processContentMentions(
                  data.content,
                  user.id,
                  'post',
                  newPostId,
                  'post',
                  communityId
                );
              } catch (mentionError) {
                console.error('[createPost] Error processing mentions:', mentionError);
              }
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || '创建帖子失败');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || '创建帖子失败');
        }
      } catch (error) {
        console.error(`[createPost] Failed to create post for community ${communityId}:`, error);
        throw error;
      }
    }

    return createdThreads;
  },

  // 帖子管理功能
  async createThread(data: {
    title: string;
    content: string;
    topic: string;
    communityId: string;
    images?: Array<string>;
    videos?: Array<string>;
    audios?: Array<string>;
    mentionedUserIds?: string[];
  }, userId: string, username: string, avatar: string): Promise<Thread> {
    // 验证用户ID
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      const error = new Error('Invalid user ID: User must be properly authenticated');
      console.error('Invalid user ID for thread creation:', userId);
      throw error;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再创建帖子');
    }

    try {
      console.log('[createThread] Trying to create post via backend API...');
      const response = await fetch(`/api/communities/${data.communityId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          images: data.images,
          videos: data.videos,
          audios: data.audios
        })
      });

      const result = await response.json();

      if (response.ok && result.code === 0) {
        console.log('[createThread] Successfully created post via backend API');
        const newThread = result.data;
        
        // 处理@提及
        if (data.mentionedUserIds && data.mentionedUserIds.length > 0) {
          try {
            await mentionService.processContentMentions(
              data.content,
              userId,
              'post',
              newThread.id,
              'post',
              data.communityId
            );
          } catch (mentionError) {
            console.error('[createThread] Error processing mentions:', mentionError);
          }
        }
        
        return {
          id: newThread.id,
          title: newThread.title,
          content: newThread.content,
          createdAt: new Date(newThread.created_at).getTime(),
          replies: [],
          topic: data.topic || '',
          upvotes: 0,
          images: newThread.images || [],
          videos: newThread.videos || [],
          audios: newThread.audios || [],
          communityId: newThread.community_id,
          author: username,
          authorAvatar: avatar,
          authorId: userId,
          comments: []
        };
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '创建帖子失败');
    } catch (error) {
      console.error('[createThread] Error:', error);
      throw error;
    }
  },

  async getThreadsByCommunity(communityId: string): Promise<Thread[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      return [];
    }

    try {
      const response = await fetch(`/api/communities/${communityId}/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        console.log('[getThreadsByCommunity] API response:', result);
        if (result.code === 0 && result.data) {
          return result.data.map((post: any) => {
            console.log('[getThreadsByCommunity] Post data:', {
              id: post.id,
              title: post.title,
              hasImages: post.images && post.images.length > 0,
              images: post.images,
              thumbnail: post.thumbnail,
              media: post.media
            });
            // 处理图片 URL，保留完整 URL（包括签名参数）
            let images: string[] = [];
            if (post.images && post.images.length > 0) {
              images = post.images;
            } else if (post.media) {
              try {
                images = JSON.parse(post.media);
              } catch (e) {
                images = [];
              }
            } else if (post.thumbnail) {
              images = [post.thumbnail];
            }
            return {
            id: post.id,
            title: post.title,
            content: post.content,
            createdAt: post.created_at ? new Date(post.created_at * 1000).getTime() : Date.now(),
            replies: [],
            topic: post.topic,
            upvotes: post.likes || 0,
            images: images,
            videos: post.videos || [],
            communityId: post.community_id,
            author: post.author_name || '未知用户',
            authorAvatar: post.author_avatar || '',
            type: post.type || 'post',
            authorId: post.author_id,
            comments: (post.comments || []).map((c: any) => ({
              id: c.id,
              content: c.content,
              user: c.user || c.author || '用户',
              author: c.author || c.user || '用户',
              authorAvatar: c.authorAvatar || c.userAvatar || '',
              userAvatar: c.userAvatar || c.authorAvatar || '',
              userId: c.userId,
              date: c.date,
              likes: c.likes || 0
            })),
            commentCount: post.comments_count || 0
          }});
        }
      }
      throw new Error('Failed to fetch threads from API');
    } catch (error) {
      console.error('[getThreadsByCommunity] Error:', error);
      return [];
    }
  },

  async getThread(threadId: string): Promise<Thread> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再查看帖子');
    }

    try {
      const response = await fetch(`/api/posts/${threadId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && result.data) {
          const post = result.data;
          return {
            id: post.id,
            title: post.title,
            content: post.content,
            createdAt: new Date(post.created_at).getTime(),
            replies: (post.comments || []).map((comment: any) => ({
              id: comment.id,
              content: comment.content,
              createdAt: new Date(comment.created_at).getTime()
            })) || [],
            topic: post.topic || post.category,
            upvotes: post.likes || 0,
            images: post.images,
            communityId: post.community_id,
            author: post.author_name || '未知用户',
            authorAvatar: post.author_avatar || '',
            authorId: post.author_id,
            comments: post.comments || []
          };
        }
      }
      throw new Error('Failed to fetch thread from API');
    } catch (error) {
      console.error('[getThread] Error:', error);
      throw error;
    }
  },

  // 点赞功能
  async toggleLike(postId: string, userId: string, action: 'like' | 'unlike'): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '操作失败');
    } catch (error) {
      console.error('[toggleLike] Error:', error);
      throw error;
    }
  },

  // 评论功能
  async addComment(postId: string, content: string, userId: string, replyTo?: string): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再评论');
    }

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, reply_to: replyTo })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && result.data) {
          return result.data;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '添加评论失败');
    } catch (error) {
      console.error('[addComment] Error:', error);
      throw error;
    }
  },

  // 好友相关功能
  async sendFriendRequest(senderId: string, receiverId: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再发送好友请求');
    }

    try {
      const response = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ receiver_id: receiverId })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '发送好友请求失败');
    } catch (error) {
      console.error('[sendFriendRequest] Error:', error);
      throw error;
    }
  },

  async acceptFriendRequest(requestId: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch(`/api/friends/requests/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '接受好友请求失败');
    } catch (error) {
      console.error('[acceptFriendRequest] Error:', error);
      throw error;
    }
  },

  async rejectFriendRequest(requestId: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch(`/api/friends/requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '拒绝好友请求失败');
    } catch (error) {
      console.error('[rejectFriendRequest] Error:', error);
      throw error;
    }
  },

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '移除好友失败');
    } catch (error) {
      console.error('[removeFriend] Error:', error);
      throw error;
    }
  },

  async getFriends(userId: string): Promise<{ data: UserProfile[] | null; error: any }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      return { data: null, error: new Error('请先登录后再操作') };
    }

    try {
      const response = await fetch('/api/friends', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          return { data: result.data, error: null };
        }
      }
      throw new Error('Failed to fetch friends');
    } catch (error) {
      console.error('[getFriends] Error:', error);
      return { data: null, error };
    }
  },

  async getSentFriendRequests(userId: string): Promise<{ data: any[] | null; error: any }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      return { data: null, error: new Error('请先登录后再操作') };
    }

    try {
      const response = await fetch('/api/friends/requests/sent', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          return { data: result.data, error: null };
        }
      }
      throw new Error('Failed to fetch sent friend requests');
    } catch (error) {
      console.error('[getSentFriendRequests] Error:', error);
      return { data: null, error };
    }
  },

  async getReceivedFriendRequests(userId: string): Promise<{ data: any[] | null; error: any }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      return { data: null, error: new Error('请先登录后再操作') };
    }

    try {
      const response = await fetch('/api/friends/requests/received', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          return { data: result.data, error: null };
        }
      }
      throw new Error('Failed to fetch received friend requests');
    } catch (error) {
      console.error('[getReceivedFriendRequests] Error:', error);
      return { data: null, error };
    }
  },

  // 私信相关功能
  async sendMessage(senderId: string, receiverId: string, content: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再发送消息');
    }

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ receiver_id: receiverId, content })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '发送消息失败');
    } catch (error) {
      console.error('[sendMessage] Error:', error);
      throw error;
    }
  },

  async getChatMessages(userId: string, friendId: string): Promise<{ data: any[] | null; error: any }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      return { data: null, error: new Error('请先登录后再查看消息') };
    }

    try {
      const response = await fetch(`/api/messages/${friendId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          return { data: result.data, error: null };
        }
      }
      throw new Error('Failed to fetch chat messages');
    } catch (error) {
      console.error('[getChatMessages] Error:', error);
      return { data: null, error };
    }
  },

  async getChatSessions(userId: string): Promise<{ data: any[] | null; error: any }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      return { data: null, error: new Error('请先登录后再查看会话') };
    }

    try {
      const response = await fetch('/api/messages/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          return { data: result.data, error: null };
        }
      }
      throw new Error('Failed to fetch chat sessions');
    } catch (error) {
      console.error('[getChatSessions] Error:', error);
      return { data: null, error };
    }
  },

  async markMessagesAsRead(userId: string, friendId: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch(`/api/messages/${friendId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '标记消息为已读失败');
    } catch (error) {
      console.error('[markMessagesAsRead] Error:', error);
      throw error;
    }
  },

  // 通知系统功能
  async getNotifications(userId: string): Promise<Notification[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再查看通知');
    }

    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          return result.data.map(notification => ({
            id: notification.id,
            type: notification.type as Notification['type'],
            title: notification.title,
            content: notification.content,
            userId: notification.user_id,
            relatedId: notification.related_id,
            relatedType: notification.related_type,
            isRead: notification.is_read,
            createdAt: notification.created_at,
            icon: this.getNotificationIcon(notification.type),
            color: this.getNotificationColor(notification.type),
            link: notification.link
          }));
        }
      }
      throw new Error('Failed to fetch notifications');
    } catch (error) {
      console.error('[getNotifications] Error:', error);
      return [];
    }
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '标记通知为已读失败');
    } catch (error) {
      console.error('[markNotificationAsRead] Error:', error);
      throw error;
    }
  },

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '标记所有通知为已读失败');
    } catch (error) {
      console.error('[markAllNotificationsAsRead] Error:', error);
      throw error;
    }
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '删除通知失败');
    } catch (error) {
      console.error('[deleteNotification] Error:', error);
      throw error;
    }
  },

  async createNotification(data: {
    type: Notification['type'];
    title: string;
    content: string;
    userId: string;
    relatedId?: string;
    relatedType?: string;
    link?: string;
  }): Promise<Notification> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    // 如果没有提供link，根据类型生成默认链接
    let link = data.link;
    if (!link && data.relatedId) {
      switch (data.type) {
        case 'post_like':
        case 'post_comment':
        case 'comment_reply':
          link = `/community/post/${data.relatedId}`;
          break;
        case 'community_join':
        case 'community_announcement':
          link = `/community/${data.relatedId}`;
          break;
        case 'friend_request':
          link = '/friends';
          break;
        case 'message':
          link = '/messages';
          break;
      }
    }

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: data.type,
          title: data.title,
          content: data.content,
          user_id: data.userId,
          related_id: data.relatedId,
          related_type: data.relatedType,
          link: link
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && result.data) {
          const newNotification = result.data;
          return {
            id: newNotification.id,
            type: newNotification.type as Notification['type'],
            title: newNotification.title,
            content: newNotification.content,
            userId: newNotification.user_id,
            relatedId: newNotification.related_id,
            relatedType: newNotification.related_type,
            isRead: newNotification.is_read,
            createdAt: newNotification.created_at,
            icon: this.getNotificationIcon(newNotification.type),
            color: this.getNotificationColor(newNotification.type),
            link: newNotification.link
          };
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '创建通知失败');
    } catch (error) {
      console.error('[createNotification] Error:', error);
      throw error;
    }
  },

  // 辅助方法：获取通知图标
  getNotificationIcon(type: Notification['type']): string {
    const iconMap: Record<Notification['type'], string> = {
      post_like: 'fas fa-heart',
      post_comment: 'fas fa-comment',
      comment_reply: 'fas fa-reply',
      community_join: 'fas fa-users',
      community_announcement: 'fas fa-bullhorn',
      friend_request: 'fas fa-user-plus',
      message: 'fas fa-envelope'
    };
    return iconMap[type] || 'fas fa-bell';
  },

  // 辅助方法：获取通知颜色
  getNotificationColor(type: Notification['type']): string {
    const colorMap: Record<Notification['type'], string> = {
      post_like: '#ef4444',
      post_comment: '#3b82f6',
      comment_reply: '#6366f1',
      community_join: '#10b981',
      community_announcement: '#f59e0b',
      friend_request: '#8b5cf6',
      message: '#ec4899'
    };
    return colorMap[type] || '#6b7280';
  },

  // 删除社区功能
  async deleteCommunity(communityId: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch(`/api/communities/${communityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '删除社区失败');
    } catch (error) {
      console.error('[deleteCommunity] Error:', error);
      throw error;
    }
  },

  // 获取社区成员列表
  async getCommunityMembers(communityId: string): Promise<any[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      return [];
    }

    try {
      const response = await fetch(`/api/communities/${communityId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          console.log('[getCommunityMembers] Fetched from backend API:', result.data.length);
          return result.data;
        }
      }
      throw new Error('Failed to fetch community members');
    } catch (error) {
      console.error('[getCommunityMembers] Error:', error);
      return [];
    }
  },

  // 获取社区公告列表
  async getCommunityAnnouncements(communityId: string): Promise<any[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      return [];
    }

    try {
      const response = await fetch(`/api/communities/${communityId}/announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          return result.data;
        }
      }
      throw new Error('Failed to fetch community announcements');
    } catch (error) {
      console.error('[getCommunityAnnouncements] Error:', error);
      return [];
    }
  },

  // 关注/取消关注用户
  async toggleFollow(currentUserId: string, targetUserId: string, action: 'follow' | 'unfollow'): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '操作失败');
    } catch (error) {
      console.error('[toggleFollow] Error:', error);
      throw error;
    }
  },

  // 删除帖子
  async deleteThread(threadId: string, userId: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch(`/api/posts/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          console.log('[deleteThread] Thread deleted successfully:', threadId);
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '删除帖子失败');
    } catch (error) {
      console.error('[deleteThread] Error:', error);
      throw error;
    }
  },

  // 删除评论
  async deleteComment(commentId: string, userId: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          console.log('[deleteComment] Comment deleted successfully:', commentId);
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '删除评论失败');
    } catch (error) {
      console.error('[deleteComment] Error:', error);
      throw error;
    }
  },

  // 删除消息
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录后再操作');
    }

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          console.log('[deleteMessage] Message deleted successfully:', messageId);
          return;
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '删除消息失败');
    } catch (error) {
      console.error('[deleteMessage] Error:', error);
      throw error;
    }
  }
};