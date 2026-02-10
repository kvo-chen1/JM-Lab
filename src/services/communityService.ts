import { supabase, supabaseAdmin } from '../lib/supabase';
import type { PostWithAuthor, UserProfile, CommentWithAuthor } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// 辅助函数：获取社区真实成员数
async function getCommunityMemberCount(communityId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('community_members')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', communityId);
    
    if (error) {
      console.error('Error getting member count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Error in getCommunityMemberCount:', error);
    return 0;
  }
}

// 辅助函数：批量获取社区成员数
async function getCommunityMemberCounts(communityIds: string[]): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('community_members')
      .select('community_id')
      .in('community_id', communityIds);
    
    if (error) {
      console.error('Error getting member counts:', error);
      return {};
    }
    
    // 统计每个社区的成员数
    const counts: Record<string, number> = {};
    data?.forEach((member: any) => {
      counts[member.community_id] = (counts[member.community_id] || 0) + 1;
    });
    
    return counts;
  } catch (error) {
    console.error('Error in getCommunityMemberCounts:', error);
    return {};
  }
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
  bookmarks?: Array<{ id: string; name: string; icon: string }>;
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
}

export const communityService = {
  // 社区管理功能
  async getCommunities(): Promise<Community[]> {
    // 优先尝试从后端API获取社群列表
    try {
      const response = await fetch('/api/communities');
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          console.log('[getCommunities] Fetched from backend API:', result.data.length);
          return result.data.map((community: any) => ({
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
        }
      }
    } catch (error) {
      console.warn('[getCommunities] Backend API failed, falling back to Supabase:', error);
    }

    // 如果后端API失败，尝试从Supabase获取
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 获取所有社区的真实成员数
    const communityIds = data.map(c => c.id);
    const memberCounts = await getCommunityMemberCounts(communityIds);

    return data.map(community => ({
      id: community.id,
      name: community.name,
      description: community.description,
      memberCount: memberCounts[community.id] || 0,
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
      creatorId: '',
      createdAt: community.created_at,
      updatedAt: community.updated_at
    }));
  },

  async getUserCommunities(userId: string): Promise<Community[]> {
    // 首先尝试使用后端API获取用户加入的社群
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
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
        console.log('[getUserCommunities] Backend API failed, falling back to Supabase');
      } catch (backendError) {
        console.log('[getUserCommunities] Backend API error, falling back to Supabase:', backendError);
      }
    }

    // 回退到 Supabase
    try {
      // 分步查询以避免联表查询可能出现的问题
      // 1. 获取用户加入的社区ID列表（不使用status列，因为可能不存在）
      let members: any[] = [];
      let membersError: any = null;
      
      try {
        // 尝试不使用status列
        const { data, error } = await supabase
          .from('community_members')
          .select('community_id, joined_at')
          .eq('user_id', userId)
          .order('joined_at', { ascending: false });
        members = data || [];
        membersError = error;
      } catch (err) {
        console.error('Error fetching community members without status:', err);
        membersError = err;
      }
      
      if (membersError && members.length === 0) {
        console.error('Error fetching community members:', membersError);
        return [];
      }
      
      // 如果 Supabase 返回空数组，说明用户没有加入任何社区，直接返回空数组
      if (!members || members.length === 0) {
        console.log('User has no communities');
        return [];
      }

      const communityIds = members.map(m => m.community_id);

      // 2. 获取社区详情
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select('*')
        .in('id', communityIds);
      
      if (communitiesError) {
        console.error('Error fetching communities details:', communitiesError);
        return [];
      }

      // 建立ID到社区数据的映射，以便保持排序
      const communityMap = new Map(communitiesData.map(c => [c.id, c]));

      // 3. 组合数据并返回
      return members
        .map((item): Community | null => {
          const community = communityMap.get(item.community_id);
          if (!community) return null;
          
          return {
            id: community.id,
            name: community.name,
            description: community.description,
            memberCount: community.members_count || community.member_count || 0,
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
          };
        })
        .filter((item): item is Community => item !== null);
    } catch (supabaseError) {
      console.error('Supabase API failed:', supabaseError);
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

    console.log('[createCommunity] Starting with userId:', userId);

    // 优先尝试使用后端API创建社群
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
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
        console.warn('[createCommunity] Backend API failed, falling back to Supabase...');
      } catch (error) {
        console.error('[createCommunity] Backend API error:', error);
      }
    }

    // 如果没有token或后端API失败，尝试使用Supabase
    console.log('[createCommunity] Trying Supabase...');
    
    // 检查是否有有效的Supabase会话
    try {
      // 首先尝试获取当前Supabase用户
      const { data: { user: authUser } } = await supabase.auth.getUser();
      let currentUser = authUser;
      
      if (!currentUser) {
        console.error('[createCommunity] No Supabase session, trying to restore...');
        // 尝试使用Supabase token恢复会话
        const supabaseToken = typeof window !== 'undefined' ? localStorage.getItem('supabaseToken') : null;
        const supabaseRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('supabaseRefreshToken') : null;
        
        if (supabaseToken && supabaseRefreshToken) {
          console.log('[createCommunity] Trying to restore Supabase session from localStorage');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: supabaseToken,
            refresh_token: supabaseRefreshToken
          });
          
          if (sessionError) {
            console.error('[createCommunity] Failed to restore Supabase session:', sessionError);
            throw new Error('请先登录后再创建社群');
          }
          
          // 重新检查会话
          const { data: { user: restoredUser } } = await supabase.auth.getUser();
          if (!restoredUser) {
            console.error('[createCommunity] Still no Supabase session after restoration');
            throw new Error('请先登录后再创建社群');
          }
          currentUser = restoredUser;
        } else {
          throw new Error('请先登录后再创建社群');
        }
      }

      // 准备插入的数据
      const insertData: any = {
        name: data.name,
        description: data.description,
        cover: data.coverImage,
        avatar: data.avatar,
        tags: data.tags,
        member_count: 1,
        privacy: data.visibility || 'public',
        is_active: true,
        is_special: false,
        creator_id: currentUser.id,
        theme: data.theme || {
          primaryColor: '#3b82f6',
          secondaryColor: '#60a5fa',
          backgroundColor: '#f3f4f6',
          textColor: '#1f2937'
        },
        layout_type: data.layoutType || 'standard',
        enabled_modules: data.enabledModules || {
          posts: true,
          chat: true,
          members: true,
          announcements: true
        },
        bookmarks: data.bookmarks || []
      };
      
      const { data: newCommunity, error } = await supabase
        .from('communities')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase create community error:', error);
        if (error.code === '23505') {
          throw new Error('社群名称已存在，请换个名字试试');
        }
        throw error;
      }
      
      // 添加创建者为成员
      try {
        await supabase.from('community_members').insert({
          community_id: newCommunity.id,
          user_id: currentUser.id,
          role: 'owner'
        });
      } catch (memberError) {
        console.error('Error adding community member:', memberError);
      }
      
      return {
        id: newCommunity.id,
        name: newCommunity.name,
        description: newCommunity.description,
        memberCount: newCommunity.member_count || 1,
        topic: newCommunity.topic || '',
        avatar: newCommunity.avatar || data.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=community%20avatar%20placeholder&image_size=square',
        cover: newCommunity.cover,
        isActive: newCommunity.is_active !== false,
        tags: newCommunity.tags || [],
        bookmarks: newCommunity.bookmarks || [],
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
        isSpecial: newCommunity.is_special || false,
        creatorId: currentUser.id,
        createdAt: newCommunity.created_at,
        updatedAt: newCommunity.updated_at
      };
    } catch (error) {
      console.error('[createCommunity] Supabase error:', error);
      throw error;
    }
  },

  async joinCommunity(communityId: string, userId: string): Promise<{ requiresApproval: boolean; status: string }> {
    try {
      // 首先尝试使用后端API
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      console.log('[joinCommunity] Token:', token ? 'exists' : 'null');
      if (token) {
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
        } catch (backendError) {
          console.error('[joinCommunity] Backend API error:', backendError);
          throw backendError;
        }
      }
      
      // 如果没有 token，尝试使用 Supabase API
      // 验证用户会话
      let { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      // 如果 Supabase 会话不存在，尝试从 localStorage 恢复
      if (authError || !authUser) {
        console.log('[joinCommunity] Supabase session missing, trying to restore from localStorage...');
        const supabaseToken = typeof window !== 'undefined' ? localStorage.getItem('supabaseToken') : null;
        const supabaseRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('supabaseRefreshToken') : null;
        
        if (supabaseToken && supabaseRefreshToken) {
          try {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: supabaseToken,
              refresh_token: supabaseRefreshToken
            });
            
            if (!setSessionError) {
              // 重新获取用户
              const { data: { user: restoredUser } } = await supabase.auth.getUser();
              if (restoredUser) {
                console.log('[joinCommunity] Successfully restored Supabase session');
                authUser = restoredUser;
              }
            }
          } catch (restoreError) {
            console.error('[joinCommunity] Failed to restore Supabase session:', restoreError);
          }
        }
        
        // 如果仍然无法获取用户，尝试使用 localStorage 中的 user
        if (!authUser) {
          const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              if (user && user.id) {
                console.log('[joinCommunity] Using user from localStorage:', user.id);
                // 创建一个临时用户对象
                authUser = { id: user.id } as any;
              }
            } catch (e) {
              console.error('[joinCommunity] Failed to parse user from localStorage:', e);
            }
          }
        }
        
        if (!authUser) {
          console.error('用户未登录或会话已过期:', authError);
          throw new Error('请先登录后再加入社群');
        }
      }
      
      // 使用认证用户的ID，确保与 Supabase 会话一致
      const effectiveUserId = authUser.id;
      
      // 检查是否已经加入
      const { data: existing, error: checkError } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('community_id', communityId)
        .eq('user_id', effectiveUserId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('检查是否已加入失败:', checkError);
        // 即使检查失败，也继续执行，避免因数据库结构问题阻塞功能
      }
      
      if (existing) throw new Error('已经加入该社区');
      
      // 获取社区信息，检查是否需要审核
      let requiresApproval = false;
      try {
        const { data: community, error: communityError } = await supabase
          .from('communities')
          .select('join_approval_required')
          .eq('id', communityId)
          .single();
        
        if (!communityError && community) {
          requiresApproval = community.join_approval_required || false;
        }
      } catch (err) {
        console.error('获取社区审核设置失败:', err);
        // 即使获取失败，也默认为不需要审核
        requiresApproval = false;
      }
      
      const status = requiresApproval ? 'pending' : 'approved';
      
      // 添加成员
      let joinError: any = null;
      try {
        // 尝试不使用status列
        const { error } = await supabase
          .from('community_members')
          .insert({
            community_id: communityId,
            user_id: effectiveUserId,
            role: 'member'
          });
        joinError = error;
      } catch (err) {
        console.error('加入社区失败（不使用status列）:', err);
        joinError = err;
      }
      
      if (joinError) {
        console.error('加入社区失败:', joinError);
        throw joinError;
      }
      
      // 如果不需要审核，尝试更新成员计数
      if (!requiresApproval) {
        try {
          // 获取当前计数
          const { data: current, error: fetchError } = await supabase
            .from('communities')
            .select('member_count, members_count')
            .eq('id', communityId)
            .single();
            
          if (!fetchError && current) {
              // 尝试更新 member_count
              const { error: countError } = await supabase
              .from('communities')
              .update({ member_count: (current.member_count || 0) + 1 })
              .eq('id', communityId);
              
              if (countError) {
                  console.error('更新 member_count 失败:', countError);
                  // 尝试更新 members_count（向后兼容）
                  try {
                      await supabase
                      .from('communities')
                      .update({ members_count: (current.members_count || 0) + 1 })
                      .eq('id', communityId);
                  } catch (err) {
                      console.error('更新 members_count 失败:', err);
                  }
              }
          }
        } catch (err) {
          console.error('更新成员计数失败:', err);
          // 不抛出错误，因为加入已经成功
        }
      }
      
      return { requiresApproval, status };
    } catch (error) {
      console.error('joinCommunity 整体错误:', error);
      throw error;
    }
  },

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    try {
      // 首先尝试使用后端API
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
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
          console.log('[leaveCommunity] Backend API failed, falling back to Supabase');
        } catch (backendError) {
          console.log('[leaveCommunity] Backend API error, falling back to Supabase:', backendError);
        }
      }
      
      // 尝试使用 Supabase API
      // 验证用户会话
      let { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      // 如果 Supabase 会话不存在，尝试从 localStorage 恢复
      if (authError || !authUser) {
        console.log('[leaveCommunity] Supabase session missing, trying to restore from localStorage...');
        const supabaseToken = typeof window !== 'undefined' ? localStorage.getItem('supabaseToken') : null;
        const supabaseRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('supabaseRefreshToken') : null;
        
        if (supabaseToken && supabaseRefreshToken) {
          try {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: supabaseToken,
              refresh_token: supabaseRefreshToken
            });
            
            if (!setSessionError) {
              // 重新获取用户
              const { data: { user: restoredUser } } = await supabase.auth.getUser();
              if (restoredUser) {
                console.log('[leaveCommunity] Successfully restored Supabase session');
                authUser = restoredUser;
              }
            }
          } catch (restoreError) {
            console.error('[leaveCommunity] Failed to restore Supabase session:', restoreError);
          }
        }
        
        // 如果仍然无法获取用户，尝试使用 localStorage 中的 user
        if (!authUser) {
          const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              if (user && user.id) {
                console.log('[leaveCommunity] Using user from localStorage:', user.id);
                // 创建一个临时用户对象
                authUser = { id: user.id } as any;
              }
            } catch (e) {
              console.error('[leaveCommunity] Failed to parse user from localStorage:', e);
            }
          }
        }
        
        if (!authUser) {
          console.error('用户未登录或会话已过期:', authError);
          throw new Error('请先登录后再操作');
        }
      }
      
      // 使用认证用户的ID，确保与 Supabase 会话一致
      const effectiveUserId = authUser.id;
      
      // 检查是否是成员
      let existing: any = null;
      let checkError: any = null;
      
      try {
        // 尝试不使用status列
        const { data, error } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('community_id', communityId)
          .eq('user_id', effectiveUserId)
          .single();
        existing = data;
        checkError = error;
      } catch (err) {
        console.error('检查成员状态失败（不使用status列）:', err);
        checkError = err;
      }

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('检查成员状态失败:', checkError);
        // 即使检查失败，也继续执行，避免因数据库结构问题阻塞功能
      }

      // 移除成员
      const { error: leaveError } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', effectiveUserId);

      if (leaveError) {
        console.error('退出社区失败:', leaveError);
        throw leaveError;
      }

      // 尝试更新成员计数
      try {
        // 获取当前计数
        const { data: current, error: fetchError } = await supabase
          .from('communities')
          .select('member_count, members_count')
          .eq('id', communityId)
          .single();

        if (!fetchError && current) {
          // 尝试更新 member_count
          const { error: countError } = await supabase
              .from('communities')
              .update({ member_count: Math.max(0, (current.member_count || 0) - 1) })
              .eq('id', communityId);
          
          if (countError) {
              console.error('更新 member_count 失败:', countError);
              // 尝试更新 members_count（向后兼容）
              try {
              await supabase
                  .from('communities')
                  .update({ members_count: Math.max(0, (current.members_count || 0) - 1) })
                  .eq('id', communityId);
              } catch (err) {
              console.error('更新 members_count 失败:', err);
              }
          }
        }
      } catch (err) {
        console.error('更新成员计数失败:', err);
        // 不抛出错误，因为退出已经成功
      }
    } catch (error) {
      console.error('leaveCommunity 整体错误:', error);
      throw error;
    }
  },

  async getCommunity(communityId: string): Promise<Community> {
    // 首先尝试使用后端API
    try {
      const response = await fetch(`/api/communities/${communityId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && result.data) {
          const community = result.data;
          // 获取真实成员数
          const realMemberCount = await getCommunityMemberCount(communityId);
          return {
            id: community.id,
            name: community.name,
            description: community.description,
            memberCount: realMemberCount,
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
          };
        }
      }
    } catch (apiError) {
      console.log('[getCommunity] Backend API failed, falling back to Supabase:', apiError);
    }

    // 回退到 Supabase
    const { data: community, error } = await supabase
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .single();

    if (error) throw error;

    // 获取真实成员数
    const realMemberCount = await getCommunityMemberCount(communityId);

    return {
      id: community.id,
      name: community.name,
      description: community.description,
      memberCount: realMemberCount,
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
  },

  // 获取社群的待审核加入请求
  async getPendingJoinRequests(communityId: string): Promise<any[]> {
    // 先获取加入请求
    const { data: requests, error } = await supabase
      .from('community_members')
      .select('community_id, user_id, status, joined_at')
      .eq('community_id', communityId)
      .eq('status', 'pending')
      .order('joined_at', { ascending: false });

    if (error) throw error;
    if (!requests || requests.length === 0) return [];

    // 获取用户信息（转换为字符串以匹配 users.id 的 TEXT 类型）
    const userIds = [...new Set(requests.map(r => r.user_id).filter(Boolean))].map(id => String(id));
    let users: any[] = [];
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds);
      if (!usersError && usersData) {
        users = usersData;
      }
    }

    // 合并数据
    return requests.map(request => ({
      ...request,
      user: users.find(u => u.id === request.user_id) || null
    }));
  },

  // 批准加入请求
  async approveJoinRequest(requestId: string, communityId: string): Promise<void> {
    // 更新成员状态
    const { error: updateError } = await supabase
      .from('community_members')
      .update({ status: 'approved' })
      .eq('id', requestId);
    
    if (updateError) throw updateError;
    
    // 更新成员计数
    const { data: current } = await supabase
      .from('communities')
      .select('member_count')
      .eq('id', communityId)
      .single();
      
    if (current) {
        await supabase
        .from('communities')
        .update({ member_count: (current.member_count || 0) + 1 })
        .eq('id', communityId);
    }
  },

  // 拒绝加入请求
  async rejectJoinRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from('community_members')
      .update({ status: 'rejected' })
      .eq('id', requestId);
    
    if (error) throw error;
  },

  // 更新社群的审核设置
  async updateJoinApprovalSetting(communityId: string, requireApproval: boolean): Promise<void> {
    const { error } = await supabase
      .from('communities')
      .update({ join_approval_required: requireApproval })
      .eq('id', communityId);
    
    if (error) throw error;
  },

  async updateCommunity(communityId: string, data: Partial<Community> & { joinApprovalRequired?: boolean }): Promise<Community> {
    // 准备更新数据，转换字段名
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.cover !== undefined) updateData.cover = data.cover;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.joinApprovalRequired !== undefined) updateData.join_approval_required = data.joinApprovalRequired;
    
    const { data: updatedCommunity, error } = await supabase
      .from('communities')
      .update(updateData)
      .eq('id', communityId)
      .select()
      .single();
    
    if (error) throw error;
    
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
  }): Promise<Thread[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user || !user.id) {
      throw new Error('请先登录后再分享作品');
    }

    const createdThreads: Thread[] = [];

    // 为每个选中的社群创建帖子
    for (const communityId of data.communityIds) {
      try {
        // 优先尝试使用后端API
        if (token) {
          try {
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
                continue;
              }
            }
          } catch (apiError) {
            console.warn('[createPost] Backend API failed:', apiError);
          }
        }

        // 回退到 Supabase
        const { data: newPost, error } = await supabase
          .from('posts')
          .insert({
            title: data.title,
            content: data.content + (data.workId ? `\n\n[分享作品ID: ${data.workId}]` : ''),
            community_id: communityId,
            user_id: user.id,
            images: data.images || [],
            videos: data.videos || []
          })
          .select()
          .single();

        if (error) {
          console.error('[createPost] Supabase error:', error);
          throw error;
        }

        createdThreads.push({
          id: newPost.id,
          title: newPost.title,
          content: newPost.content,
          createdAt: new Date(newPost.created_at).getTime(),
          replies: [],
          topic: data.topic,
          upvotes: 0,
          images: newPost.images || [],
          videos: newPost.videos || [],
          communityId: communityId,
          author: user.username || user.name || '用户',
          authorAvatar: user.avatar_url || user.avatar,
          authorId: user.id,
          comments: []
        });
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
  }, userId: string, username: string, avatar: string): Promise<Thread> {
    // 验证用户ID
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      const error = new Error('Invalid user ID: User must be properly authenticated');
      console.error('Invalid user ID for thread creation:', userId);
      throw error;
    }

    // 首先尝试使用后端API创建帖子
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
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
        
        console.log('[createThread] Backend API failed:', result.message);
      } catch (backendError) {
        console.error('[createThread] Backend API error:', backendError);
      }
    }

    // 如果后端API失败，回退到Supabase
    console.log('[createThread] Falling back to Supabase...');
    
    // 获取当前真实的 Supabase 用户 ID
    let realUserId = userId;
    
    // 尝试从 localStorage 恢复 Supabase 会话
    const supabaseToken = typeof window !== 'undefined' ? localStorage.getItem('supabaseToken') : null;
    const supabaseRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('supabaseRefreshToken') : null;
    
    if (supabaseToken && supabaseRefreshToken) {
      try {
        await supabase.auth.setSession({
          access_token: supabaseToken,
          refresh_token: supabaseRefreshToken
        });
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          realUserId = user.id;
          console.log('[createThread] Restored Supabase session, userId:', realUserId);
        }
      } catch (e) {
        console.warn('[createThread] Failed to restore Supabase session:', e);
      }
    }

    // 构建插入数据
    const insertData: any = {
      title: data.title,
      content: data.content,
      community_id: data.communityId,
      user_id: realUserId
    };
    
    // 可选字段：只在有值时添加
    if (data.images && data.images.length > 0) {
      insertData.images = data.images;
    }
    
    if (data.videos && data.videos.length > 0) {
      insertData.videos = data.videos;
    }
    
    if (data.audios && data.audios.length > 0) {
      insertData.audios = data.audios;
    }
    
    const { data: newThread, error } = await supabase
      .from('posts')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
        console.error('Supabase create thread error:', error);
        // 处理外键约束错误 (用户ID不存在)
        if (error.code === '23503') {
             throw new Error('用户认证状态异常，请尝试退出后重新登录');
        }
        throw error;
    }
    
    return {
      id: newThread.id,
      title: newThread.title,
      content: newThread.content,
      createdAt: new Date(newThread.created_at).getTime(),
      replies: [],
      topic: data.topic || '', // 使用传入的topic，数据库可能没有存储
      upvotes: 0,
      images: newThread.images || [],
      videos: newThread.videos || [],
      audios: newThread.audios || [],
      communityId: newThread.community_id,
      author: username,
      authorAvatar: avatar,
      authorId: realUserId,
      comments: []
    };
  },

  async getThreadsByCommunity(communityId: string): Promise<Thread[]> {
    // 优先使用后端 API 获取帖子列表
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      try {
        const response = await fetch(`/api/communities/${communityId}/posts`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const result = await response.json();
          if (result.code === 0 && result.data) {
            return result.data.map((post: any) => ({
              id: post.id,
              title: post.title,
              content: post.content,
              createdAt: post.created_at ? new Date(post.created_at * 1000).getTime() : Date.now(),
              replies: [],
              topic: post.topic,
              upvotes: post.likes || 0,
              images: post.images,
              videos: post.videos,
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
            }));
          }
        }
      } catch (error) {
        console.warn('[getThreadsByCommunity] Backend API failed, falling back to Supabase:', error);
      }
    }

    // 如果后端 API 失败，回退到 Supabase
    // 同时获取帖子列表和作品列表
    const [{ data: posts, error: postsError }, { data: works, error: worksError }] = await Promise.all([
      supabase
        .from('posts')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false }),
      supabase
        .from('works')
        .select('*')
        .eq('category', communityId)
        .order('created_at', { ascending: false })
    ]);

    if (postsError) throw postsError;

    // 合并 posts 和 works
    const allItems = [
      ...(posts || []).map(p => ({ ...p, type: 'post' })),
      ...(works || []).map(w => ({ 
        ...w, 
        type: 'work',
        author_id: w.creator_id,
        content: w.description,
        upvotes: w.likes || 0
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (allItems.length === 0) return [];

    // 获取所有作者ID（转换为字符串以匹配 users.id 的 TEXT 类型）
    const authorIds = [...new Set(allItems.map(p => p.author_id).filter(Boolean))].map(id => String(id));

    // 获取作者信息
    let users: any[] = [];
    if (authorIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', authorIds);
      if (!usersError && usersData) {
        users = usersData;
      }
    }

    // 获取所有帖子ID（用于查询评论）
    const postIds = (posts || []).map(p => p.id);

    // 获取评论（只对 posts 查询评论）
    let comments: any[] = [];
    if (postIds.length > 0) {
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .in('post_id', postIds);
      if (!commentsError && commentsData) {
        comments = commentsData;
      }
    }

    return allItems.map(item => {
      const user = users.find(u => u.id === item.author_id);
      const postComments = item.type === 'post' 
        ? comments.filter(c => c.post_id === item.id)
        : [];

      return {
        id: item.id,
        title: item.title,
        content: item.content || item.description,
        createdAt: new Date(item.created_at).getTime(),
        replies: postComments.map(comment => ({
          id: comment.id,
          content: comment.content,
          createdAt: new Date(comment.created_at).getTime()
        })) || [],
        topic: item.topic || item.category,
        upvotes: item.upvotes || item.likes || 0,
        images: item.images || (item.thumbnail ? [item.thumbnail] : undefined),
        videos: item.videos,
        audios: item.audios,
        communityId: item.community_id || item.category,
        author: user?.username || '未知用户',
        authorAvatar: user?.avatar_url || '',
        type: item.type,
        authorId: user?.id,
        comments: postComments
      };
    });
  },

  async getThread(threadId: string): Promise<Thread> {
    // 先获取帖子
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', threadId)
      .single();
    
    if (error) throw error;

    // 获取作者信息
    let user: any = null;
    if (post.author_id) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .eq('id', post.author_id)
        .single();
      if (!userError && userData) {
        user = userData;
      }
    }

    // 获取评论
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', post.id);

    const postComments = commentsError ? [] : (comments || []);

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: new Date(post.created_at).getTime(),
      replies: postComments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: new Date(comment.created_at).getTime()
      })) || [],
      topic: post.topic || post.category,
      upvotes: post.upvotes || 0,
      images: post.images,
      communityId: post.community_id,
      author: user?.username || '未知用户',
      authorAvatar: user?.avatar_url || '',
      authorId: user?.id,
      comments: postComments
    };
  },

  // 点赞功能
  async toggleLike(postId: string, userId: string, action: 'like' | 'unlike'): Promise<void> {
    if (action === 'unlike') {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: userId });
        
      if (error) throw error;
    }
  },

  // 评论功能
  async addComment(postId: string, content: string, userId: string, replyTo?: string): Promise<any> {
    const { data: newComment, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content: content,
        reply_to: replyTo
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return newComment;
  },

  // 好友相关功能
  async sendFriendRequest(senderId: string, receiverId: string): Promise<void> {
    const { error } = await supabase
      .from('friend_requests')
      .insert({ sender_id: senderId, receiver_id: receiverId, status: 'pending' });
    
    if (error) throw error;
  },

  async acceptFriendRequest(requestId: string): Promise<void> {
    // 1. 更新好友请求状态
    const { data: request, error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    if (!request) throw new Error('好友请求不存在');
    
    // 2. 可以在这里添加好友关系表的记录
    // 例如：在friends表中插入两条记录，方便双向查询
    // await supabase.from('friends').insert([
    //   { user_id: request.sender_id, friend_id: request.receiver_id },
    //   { user_id: request.receiver_id, friend_id: request.sender_id }
    // ]);
  },

  async rejectFriendRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);
    
    if (error) throw error;
  },

  async removeFriend(userId: string, friendId: string): Promise<void> {
    // 这里需要根据实际的数据模型来实现
    // 例如：从friends表中删除关系记录
    // 或者从friend_requests表中删除已接受的请求
    
    // 示例实现（假设使用friend_requests表）
    // 删除方向1
    const { error: error1 } = await supabase
      .from('friend_requests')
      .delete()
      .match({ sender_id: userId, receiver_id: friendId });
      
    if (error1) throw error1;

    // 删除方向2
    const { error: error2 } = await supabase
      .from('friend_requests')
      .delete()
      .match({ sender_id: friendId, receiver_id: userId });
    
    if (error2) throw error2;
  },

  async getFriends(userId: string): Promise<{ data: UserProfile[] | null; error: any }> {
    // 先获取好友请求
    const { data: requests, error } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) return { data: null, error };
    if (!requests || requests.length === 0) return { data: [], error: null };

    // 获取所有相关用户ID（转换为字符串以匹配 users.id 的 TEXT 类型）
    const userIds = [...new Set(requests.flatMap(r => [r.sender_id, r.receiver_id]))].map(id => String(id));

    // 获取用户信息
    let users: any[] = [];
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds);
      if (!usersError && usersData) {
        users = usersData;
      }
    }

    // 处理数据，提取好友列表
    const friends: UserProfile[] = [];
    requests.forEach((request: any) => {
      const sender = users.find(u => u.id === request.sender_id);
      const receiver = users.find(u => u.id === request.receiver_id);

      if (sender && sender.id !== userId) {
        friends.push(sender as UserProfile);
      }
      if (receiver && receiver.id !== userId) {
        friends.push(receiver as UserProfile);
      }
    });

    return { data: friends, error: null };
  },

  async getSentFriendRequests(userId: string): Promise<{ data: any[] | null; error: any }> {
    // 先获取发送的请求
    const { data: requests, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('sender_id', userId)
      .eq('status', 'pending');

    if (error) return { data: null, error };
    if (!requests || requests.length === 0) return { data: [], error: null };

    // 获取接收者信息（转换为字符串以匹配 users.id 的 TEXT 类型）
    const receiverIds = [...new Set(requests.map(r => r.receiver_id).filter(Boolean))].map(id => String(id));
    let users: any[] = [];
    if (receiverIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', receiverIds);
      if (!usersError && usersData) {
        users = usersData;
      }
    }

    // 合并数据
    const enrichedRequests = requests.map(request => ({
      ...request,
      receiver: users.find(u => u.id === request.receiver_id) || null
    }));

    return { data: enrichedRequests, error: null };
  },

  async getReceivedFriendRequests(userId: string): Promise<{ data: any[] | null; error: any }> {
    // 先获取接收的请求
    const { data: requests, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (error) return { data: null, error };
    if (!requests || requests.length === 0) return { data: [], error: null };

    // 获取发送者信息
    const senderIds = [...new Set(requests.map(r => r.sender_id).filter(Boolean))];
    let users: any[] = [];
    if (senderIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', senderIds);
      if (!usersError && usersData) {
        users = usersData;
      }
    }

    // 合并数据
    const enrichedRequests = requests.map(request => ({
      ...request,
      sender: users.find(u => u.id === request.sender_id) || null
    }));

    return { data: enrichedRequests, error: null };
  },

  // 私信相关功能
  async sendMessage(senderId: string, receiverId: string, content: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        is_read: false,
        role: 'user' // Required by database constraint
      });
    
    if (error) throw error;
  },

  async getChatMessages(userId: string, friendId: string): Promise<{ data: any[] | null; error: any }> {
    // 先获取消息
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) return { data: null, error };
    if (!messages || messages.length === 0) return { data: [], error: null };

    // 获取所有相关用户ID
    const userIds = [...new Set(messages.flatMap(m => [m.sender_id, m.receiver_id]))];

    // 获取用户信息
    let users: any[] = [];
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds);
      if (!usersError && usersData) {
        users = usersData;
      }
    }

    // 合并数据
    const enrichedMessages = messages.map(message => ({
      ...message,
      sender: users.find(u => u.id === message.sender_id) || null,
      receiver: users.find(u => u.id === message.receiver_id) || null
    }));

    return { data: enrichedMessages, error: null };
  },

  async getChatSessions(userId: string): Promise<{ data: any[] | null; error: any }> {
    // 这里需要根据实际的数据模型来实现
    // 示例实现：获取与所有好友的最新消息
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error };
    if (!messages || messages.length === 0) return { data: [], error: null };

    // 获取所有相关用户ID
    const userIds = [...new Set(messages.flatMap(m => [m.sender_id, m.receiver_id]))];

    // 获取用户信息
    let users: any[] = [];
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds);
      if (!usersError && usersData) {
        users = usersData;
      }
    }

    // 处理数据，按对话分组并获取最新消息
    const sessionsMap = new Map<string, any>();

    messages.forEach(message => {
      const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
      if (!sessionsMap.has(otherUserId)) {
        const sender = users.find(u => u.id === message.sender_id);
        const receiver = users.find(u => u.id === message.receiver_id);
        sessionsMap.set(otherUserId, {
          ...message,
          sender,
          receiver
        });
      }
    });

    const sessions = Array.from(sessionsMap.values());
    return { data: sessions, error: null };
  },

  async markMessagesAsRead(userId: string, friendId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', friendId);
    
    if (error) throw error;
  },

  // 通知系统功能
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(notification => ({
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
      color: this.getNotificationColor(notification.type)
    }));
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    if (error) throw error;
  },

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    if (error) throw error;
  },

  async createNotification(data: {
    type: Notification['type'];
    title: string;
    content: string;
    userId: string;
    relatedId?: string;
    relatedType?: string;
  }): Promise<Notification> {
    const { data: newNotification, error } = await supabase
      .from('notifications')
      .insert({
        type: data.type,
        title: data.title,
        content: data.content,
        user_id: data.userId,
        related_id: data.relatedId,
        related_type: data.relatedType,
        is_read: false
      })
      .select()
      .single();
    
    if (error) throw error;
    
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
      color: this.getNotificationColor(newNotification.type)
    };
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
    // 首先删除社区成员关联
    try {
      const { error: membersError } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId);
      
      if (membersError) {
        console.error('删除社区成员失败:', membersError);
        // 继续执行，不因为成员删除失败而中断
      }
    } catch (error) {
      console.error('删除社区成员时发生错误:', error);
    }

    // 删除社区相关的帖子
    try {
      const { error: postsError } = await supabase
        .from('posts')
        .delete()
        .eq('community_id', communityId);
      
      if (postsError) {
        console.error('删除社区帖子失败:', postsError);
        // 继续执行，不因为帖子删除失败而中断
      }
    } catch (error) {
      console.error('删除社区帖子时发生错误:', error);
    }

    // 删除社区本身
    const { error: communityError } = await supabase
      .from('communities')
      .delete()
      .eq('id', communityId);
    
    if (communityError) {
      console.error('删除社区失败:', communityError);
      throw communityError;
    }
  },

  // 获取社区成员列表
  async getCommunityMembers(communityId: string): Promise<any[]> {
    try {
      // 首先尝试使用后端API获取成员列表（后端使用service_role可以绕过RLS）
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
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
        } catch (apiError) {
          console.warn('[getCommunityMembers] Backend API failed, falling back to Supabase:', apiError);
        }
      }

      // 回退到Supabase直接查询
      console.log('[getCommunityMembers] Falling back to Supabase...');
      
      // 先获取成员列表
      const { data: membersData, error: membersError } = await supabase
        .from('community_members')
        .select('community_id, user_id, role, joined_at')
        .eq('community_id', communityId)
        .order('joined_at', { ascending: false });

      if (membersError) {
        console.error('Error getting community members:', membersError);
        return [];
      }

      if (!membersData || membersData.length === 0) {
        return [];
      }

      // 获取所有用户ID
      const userIds = membersData.map(m => m.user_id).filter(Boolean);
      console.log('[getCommunityMembers] User IDs:', userIds);

      // 单独获取用户信息 - 使用 in 查询
      let usersMap = new Map();
      if (userIds.length > 0) {
        // 首先尝试从 public.users 获取
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, username, avatar_url')
          .in('id', userIds);

        console.log('[getCommunityMembers] Users query result:', { usersData, usersError });

        if (usersError) {
          console.error('Error getting users:', usersError);
        } else {
          usersData?.forEach((user: any) => {
            usersMap.set(user.id, user);
          });
        }

        // 对于没有从 public.users 找到的用户，尝试从后端API获取
        const missingUserIds = userIds.filter(id => !usersMap.has(id));
        if (missingUserIds.length > 0) {
          console.log('[getCommunityMembers] Missing user IDs, trying backend API:', missingUserIds);
          try {
            // 使用后端API获取用户信息
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (token) {
              // 逐个获取用户信息
              for (const userId of missingUserIds) {
                try {
                  const response = await fetch(`/api/users/${userId}`, {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    if (result.code === 0 && result.data) {
                      const user = result.data;
                      usersMap.set(userId, {
                        id: userId,
                        username: user.username || user.name || user.email?.split('@')[0] || '用户',
                        avatar_url: user.avatar_url || user.avatar
                      });
                    }
                  }
                } catch (userError) {
                  console.warn(`[getCommunityMembers] Failed to get user ${userId}:`, userError);
                }
              }
            }
          } catch (e) {
            console.warn('[getCommunityMembers] Failed to get users from backend:', e);
          }
        }
      }

      const result = membersData.map((member: any) => {
        const user = usersMap.get(member.user_id);
        return {
          id: `${member.community_id}-${member.user_id}`, // 使用复合键作为 id
          user_id: member.user_id,
          username: user?.username || '未知用户',
          avatar_url: user?.avatar_url,
          role: member.role,
          joined_at: member.joined_at,
          is_online: false,
        };
      });
      
      console.log('[getCommunityMembers] Final result:', result);
      return result;
    } catch (error) {
      console.error('Error in getCommunityMembers:', error);
      return [];
    }
  },

  // 获取社区公告列表
  async getCommunityAnnouncements(communityId: string): Promise<any[]> {
    try {
      // 先获取公告列表（根据实际表结构：id, community_id, content, created_by, created_at, updated_at）
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('community_announcements')
        .select('id, community_id, content, created_by, created_at, updated_at')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (announcementsError) {
        console.error('Error getting community announcements:', announcementsError);
        return [];
      }

      if (!announcementsData || announcementsData.length === 0) {
        return [];
      }

      // 获取所有作者ID
      const authorIds = announcementsData.map(a => a.created_by).filter(Boolean);

      // 单独获取作者信息
      let authorsMap = new Map();
      if (authorIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, username, avatar_url')
          .in('id', authorIds);

        if (usersError) {
          console.error('Error getting authors:', usersError);
        } else {
          usersData?.forEach((user: any) => {
            authorsMap.set(user.id, user);
          });
        }
      }

      return announcementsData.map((announcement: any) => {
        const author = authorsMap.get(announcement.created_by);
        return {
          id: announcement.id,
          title: '社区公告', // 表中没有 title 列，使用默认标题
          content: announcement.content,
          author_id: announcement.created_by,
          author_name: author?.username || '未知用户',
          author_avatar: author?.avatar_url,
          is_pinned: false, // 表中没有 is_pinned 列，默认 false
          created_at: announcement.created_at,
          updated_at: announcement.updated_at,
        };
      });
    } catch (error) {
      console.error('Error in getCommunityAnnouncements:', error);
      return [];
    }
  }
};