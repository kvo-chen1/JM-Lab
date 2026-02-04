import { supabase } from '../lib/supabase';
import type { PostWithAuthor, UserProfile, CommentWithAuthor } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

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
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(community => ({
      id: community.id,
      name: community.name,
      description: community.description,
      memberCount: community.members_count || 0,
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
    try {
      // 首先尝试使用 Supabase API
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
        throw supabaseError;
      }
    } catch (error) {
      console.error('getUserCommunities failed:', error);
      // 捕获所有错误，返回空数组而不是抛出错误
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

    // 获取当前真实的 Supabase 用户 ID，以防止前端存储的 ID 与数据库不一致
    let realUserId = userId;
    let currentUser = null;
    let supabaseAuthenticated = false;
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id) {
            realUserId = user.id;
            currentUser = user;
            supabaseAuthenticated = true;
        } else {
             // 如果 getUser 失败，尝试刷新 session
             try {
               const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
               if (session && session.user) {
                 realUserId = session.user.id;
                 currentUser = session.user;
                 supabaseAuthenticated = true;
               } else {
                 console.warn('No Supabase session found, will use local user data');
               }
             } catch (refreshError) {
               console.warn('Failed to refresh auth session, will use local user data:', refreshError);
             }
        }
    } catch (e) {
        console.warn('Failed to get supabase user, will use local user data:', e);
    }
    
    // 如果没有 Supabase 认证，尝试从 localStorage 获取用户信息
    if (!supabaseAuthenticated) {
        try {
            const localUserStr = localStorage.getItem('user');
            if (localUserStr) {
                const localUser = JSON.parse(localUserStr);
                if (localUser.id === userId) {
                    console.log('Using local user data for community creation:', localUser.id);
                    realUserId = localUser.id;
                    currentUser = {
                        id: localUser.id,
                        email: localUser.email,
                        user_metadata: {
                            username: localUser.username,
                            avatar: localUser.avatar
                        }
                    };
                }
            }
        } catch (localError) {
            console.warn('Failed to get local user data:', localError);
        }
    }

    // 尝试修复 23503 错误：确保用户存在于 public.users 表中
    // 某些外键约束可能指向 public.users 而不是 auth.users，或者触发器未执行
    let profileSynced = false;
    let syncAttempts = 0;
    const maxSyncAttempts = 3;
    
    while (!profileSynced && syncAttempts < maxSyncAttempts) {
        syncAttempts++;
        try {
            // 检查 public.users 是否存在该用户
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('id')
                .eq('id', realUserId)
                .maybeSingle();
            
            if (profile) {
                console.log('User profile exists in public.users:', realUserId);
                profileSynced = true;
                break;
            }
            
            console.log(`User profile missing in public.users (attempt ${syncAttempts}), attempting to sync/create...`, realUserId);
            
            // 准备用户数据
            let email = `missing_${realUserId}@example.com`; // 默认占位邮箱
            let username = `User_${realUserId.substring(0, 8)}`;
            let avatarUrl = '';
            
            if (currentUser) {
                const metadata = currentUser.user_metadata || {};
                email = currentUser.email || email;
                username = metadata.username || metadata.name || currentUser.email?.split('@')[0] || username;
                avatarUrl = metadata.avatar_url || metadata.avatar || '';
            }
            
            // 尝试从 localStorage 获取用户信息（补充或替代 currentUser）
            try {
                const localUserStr = localStorage.getItem('user');
                if (localUserStr) {
                    const localUser = JSON.parse(localUserStr);
                    // 如果 localStorage 中的用户ID与当前用户匹配，或者 currentUser 为空
                    if (localUser.id === realUserId || !currentUser) {
                        email = localUser.email || email;
                        username = localUser.username || username;
                        avatarUrl = localUser.avatar || avatarUrl;
                        console.log('Using localStorage user data:', { username, email });
                    }
                }
            } catch (e) {
                // 忽略 localStorage 读取错误
                console.warn('Failed to read user from localStorage:', e);
            }
            
            // 尝试插入用户资料
            const { error: insertError } = await supabase
                .from('users')
                .insert({
                    id: realUserId,
                    email: email,
                    username: username,
                    avatar_url: avatarUrl,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
                
            if (insertError) {
                console.error(`Failed to insert user profile (attempt ${syncAttempts}):`, insertError);
                // 如果是重复键错误，说明用户已存在
                if (insertError.code === '23505') {
                    console.log('User already exists, considering sync successful');
                    profileSynced = true;
                    break;
                }
                // 等待一下再重试
                if (syncAttempts < maxSyncAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 500 * syncAttempts));
                }
            } else {
                console.log('User profile inserted successfully');
                // 验证插入是否成功
                const { data: verifyProfile } = await supabase
                    .from('users')
                    .select('id')
                    .eq('id', realUserId)
                    .maybeSingle();
                
                if (verifyProfile) {
                    console.log('User profile verified in database');
                    profileSynced = true;
                    break;
                } else {
                    console.warn('User profile insert reported success but not found in verification');
                }
            }
        } catch (syncError) {
            console.error(`Error during profile sync check (attempt ${syncAttempts}):`, syncError);
            if (syncAttempts < maxSyncAttempts) {
                await new Promise(resolve => setTimeout(resolve, 500 * syncAttempts));
            }
        }
    }
    
    if (!profileSynced) {
        console.error('Failed to sync user profile after all attempts');
    }

    // 准备插入的数据，适配数据库表实际存在的列
    const insertData: any = {
        name: data.name,
        description: data.description,
        cover: data.coverImage,
        avatar: data.avatar,
        tags: data.tags,
        member_count: 1, // 使用正确的列名
        privacy: data.visibility || 'public',
        is_active: true,
        is_special: false,
        creator_id: realUserId,
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
        // 处理 409 冲突错误 (通常是名称重复)
        if (error.code === '23505' || error.message?.includes('duplicate key') || error.details?.includes('already exists')) {
            throw new Error('社群名称已存在，请换个名字试试');
        }
        // 处理外键约束错误 (用户ID不存在)
        if (error.code === '23503') {
             throw new Error('用户认证状态异常，请尝试退出后重新登录');
        }
        throw error;
    }
    
    // 添加创建者为成员（添加错误处理，确保即使失败也不影响主流程）
    try {
      const { error: memberInsertError } = await supabase
        .from('community_members')
        .insert({
          community_id: newCommunity.id,
          user_id: realUserId,
          role: 'owner'
          // 移除 status 字段，因为表中不存在
        });
      
      if (memberInsertError) {
        console.error('Error adding community member:', memberInsertError);
        // 如果是重复键错误，说明成员已存在，不算错误
        if (memberInsertError.code === '23505') {
          console.log('Creator already exists as member, continuing...');
        } else {
          console.error('Failed to add creator as member:', memberInsertError);
        }
      } else {
        console.log('Creator added as member successfully');
      }
    } catch (memberError) {
      console.error('Exception adding community member:', memberError);
      // 继续执行，不抛出错误，确保社群创建成功
    }
    
    return {
      id: newCommunity.id,
      name: newCommunity.name,
      description: newCommunity.description,
      memberCount: newCommunity.member_count || newCommunity.members_count || 1,
      topic: newCommunity.topic || '',
      avatar: newCommunity.avatar || data.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=community%20avatar%20placeholder&image_size=square',
      cover: newCommunity.cover,
      isActive: newCommunity.is_active || true,
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
      creatorId: realUserId,
      createdAt: newCommunity.created_at,
      updatedAt: newCommunity.updated_at
    };
  },

  async joinCommunity(communityId: string, userId: string): Promise<{ requiresApproval: boolean; status: string }> {
    try {
      // 首先尝试使用 Supabase API
      try {
        // 检查是否已经加入
        const { data: existing, error: checkError } = await supabase
          .from('community_members')
          .select('id')
          .eq('community_id', communityId)
          .eq('user_id', userId)
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
              user_id: userId,
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
      } catch (supabaseError) {
        console.error('Supabase API failed:', supabaseError);
        throw supabaseError;
      }
    } catch (error) {
      console.error('joinCommunity 整体错误:', error);
      throw error;
    }
  },

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    try {
      // 首先尝试使用 Supabase API
      try {
        // 检查是否是成员
        let existing: any = null;
        let checkError: any = null;
        
        try {
          // 尝试不使用status列
          const { data, error } = await supabase
            .from('community_members')
            .select('id')
            .eq('community_id', communityId)
            .eq('user_id', userId)
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
          .eq('user_id', userId);

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
      } catch (supabaseError) {
        console.error('Supabase API failed:', supabaseError);
        throw supabaseError;
      }
    } catch (error) {
      console.error('leaveCommunity 整体错误:', error);
      throw error;
    }
  },

  async getCommunity(communityId: string): Promise<Community> {
    const { data: community, error } = await supabase
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .single();
    
    if (error) throw error;
    
    return {
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
      updatedAt: community.updated_at,
      joinApprovalRequired: community.join_approval_required || false
    };
  },

  // 获取社群的待审核加入请求
  async getPendingJoinRequests(communityId: string): Promise<any[]> {
    const { data: requests, error } = await supabase
      .from('community_members')
      .select(`
        id,
        user_id,
        status,
        joined_at,
        user:users(username, avatar)
      `)
      .eq('community_id', communityId)
      .eq('status', 'pending')
      .order('joined_at', { ascending: false });
    
    if (error) throw error;
    
    return requests;
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

  // 帖子管理功能
  async createThread(data: {
    title: string;
    content: string;
    topic: string;
    communityId: string;
    images?: Array<string>;
  }, userId: string, username: string, avatar: string): Promise<Thread> {
    // 验证用户ID
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      const error = new Error('Invalid user ID: User must be properly authenticated');
      console.error('Invalid user ID for thread creation:', userId);
      throw error;
    }

    // 获取当前真实的 Supabase 用户 ID，以防止前端存储的 ID 与数据库不一致
    let realUserId = userId;
    let currentUser = null;
    let authVerified = false;
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id) {
            realUserId = user.id;
            currentUser = user;
            authVerified = true;
            console.log('Supabase auth verified, userId:', realUserId);
        } else {
            // 如果 getUser 失败，尝试刷新 session
            try {
                const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
                if (session && session.user) {
                    realUserId = session.user.id;
                    currentUser = session.user;
                    authVerified = true;
                    console.log('Supabase session refreshed, userId:', realUserId);
                } else {
                    console.warn('No supabase session available, using provided userId');
                }
            } catch (refreshError) {
                console.warn('Failed to refresh auth session, using provided userId:', refreshError);
            }
        }
    } catch (e) {
        console.warn('Failed to get supabase user, using provided userId:', e);
    }
    
    // 如果 Supabase 认证失败，但前端传入了有效的 userId，则信任前端
    // 这种情况可能发生在开发环境或某些特殊情况下
    if (!authVerified && userId && typeof userId === 'string' && userId.trim() !== '') {
        console.log('Using frontend provided userId:', userId);
        realUserId = userId;
    }

    // 尝试修复 23503 错误：确保用户存在于 public.users 表中
    let profileSynced = false;
    let syncAttempts = 0;
    const maxSyncAttempts = 3;
    
    while (!profileSynced && syncAttempts < maxSyncAttempts) {
        syncAttempts++;
        try {
            // 检查 public.users 是否存在该用户
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('id')
                .eq('id', realUserId)
                .maybeSingle();
            
            if (profile) {
                console.log('User profile exists in public.users:', realUserId);
                profileSynced = true;
                break;
            }
            
            console.log(`User profile missing in public.users (attempt ${syncAttempts}), attempting to sync/create...`, realUserId);
            
            // 准备用户数据
            let email = `missing_${realUserId}@example.com`; // 默认占位邮箱
            let username = `User_${realUserId.substring(0, 8)}`;
            let avatarUrl = '';
            
            if (currentUser) {
                const metadata = currentUser.user_metadata || {};
                email = currentUser.email || email;
                username = metadata.username || metadata.name || currentUser.email?.split('@')[0] || username;
                avatarUrl = metadata.avatar_url || metadata.avatar || '';
            }
            
            // 尝试从 localStorage 获取用户信息（补充或替代 currentUser）
            try {
                const localUserStr = localStorage.getItem('user');
                if (localUserStr) {
                    const localUser = JSON.parse(localUserStr);
                    // 如果 localStorage 中的用户ID与当前用户匹配，或者 currentUser 为空
                    if (localUser.id === realUserId || !currentUser) {
                        email = localUser.email || email;
                        username = localUser.username || username;
                        avatarUrl = localUser.avatar || avatarUrl;
                        console.log('Using localStorage user data for thread creation:', { username, email });
                    }
                }
            } catch (e) {
                // 忽略 localStorage 读取错误
                console.warn('Failed to read user from localStorage:', e);
            }
            
            // 尝试插入用户数据
            const insertData: any = {
                id: realUserId,
                email: email,
                username: username,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // 只在 avatarUrl 存在时添加 avatar 字段
            if (avatarUrl) {
                insertData.avatar_url = avatarUrl;
            }
            
            const { error: insertError } = await supabase
                .from('users')
                .insert(insertData);
                
            if (insertError) {
                console.error(`Failed to insert user profile (attempt ${syncAttempts}):`, insertError);
                // 如果是重复键错误，说明用户已存在
                if (insertError.code === '23505') {
                    console.log('User already exists, considering sync successful');
                    profileSynced = true;
                    break;
                }
                // 等待一下再重试
                if (syncAttempts < maxSyncAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 500 * syncAttempts));
                }
            } else {
                console.log('User profile inserted successfully');
                // 验证插入是否成功
                const { data: verifyProfile } = await supabase
                    .from('users')
                    .select('id')
                    .eq('id', realUserId)
                    .maybeSingle();
                
                if (verifyProfile) {
                    console.log('User profile verified in database');
                    profileSynced = true;
                    break;
                } else {
                    console.warn('User profile insert reported success but not found in verification');
                }
            }
        } catch (syncError) {
            console.error(`Error during profile sync check (attempt ${syncAttempts}):`, syncError);
            if (syncAttempts < maxSyncAttempts) {
                await new Promise(resolve => setTimeout(resolve, 500 * syncAttempts));
            }
        }
    }
    
    if (!profileSynced) {
        console.error('Failed to sync user profile after all attempts');
    }

    const { data: newThread, error } = await supabase
      .from('posts')
      .insert({
        title: data.title,
        content: data.content,
        topic: data.topic,
        community_id: data.communityId,
        user_id: realUserId,
        images: data.images
      })
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
      topic: newThread.topic,
      upvotes: 0,
      images: newThread.images,
      communityId: newThread.community_id,
      author: username,
      authorAvatar: avatar,
      authorId: realUserId,
      comments: []
    };
  },

  async getThreadsByCommunity(communityId: string): Promise<Thread[]> {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *, 
        user:users(*),
        comments:comments(*)
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: new Date(post.created_at).getTime(),
      replies: post.comments?.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: new Date(comment.created_at).getTime()
      })) || [],
      topic: post.topic || post.category,
      upvotes: post.upvotes || 0,
      images: post.images,
      communityId: post.community_id,
      author: post.user?.username || '未知用户',
      authorAvatar: post.user?.avatar || '',
      authorId: post.user?.id,
      comments: post.comments
    }));
  },

  async getThread(threadId: string): Promise<Thread> {
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *, 
        user:users(*),
        comments:comments(*)
      `)
      .eq('id', threadId)
      .single();
    
    if (error) throw error;
    
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: new Date(post.created_at).getTime(),
      replies: post.comments?.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: new Date(comment.created_at).getTime()
      })) || [],
      topic: post.topic || post.category,
      upvotes: post.upvotes || 0,
      images: post.images,
      communityId: post.community_id,
      author: post.user?.username || '未知用户',
      authorAvatar: post.user?.avatar || '',
      authorId: post.user?.id,
      comments: post.comments
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
    // 这里需要根据实际的数据模型来实现
    // 示例实现：获取所有已接受的好友请求对应的用户
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        sender:users!sender_id(*),
        receiver:users!receiver_id(*)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted');
    
    if (error) return { data: null, error };
    
    // 处理数据，提取好友列表
    const friends: UserProfile[] = [];
    data.forEach((request: any) => {
      if (request.sender && request.sender.id !== userId) {
        friends.push(request.sender as UserProfile);
      }
      if (request.receiver && request.receiver.id !== userId) {
        friends.push(request.receiver as UserProfile);
      }
    });
    
    return { data: friends, error: null };
  },

  async getSentFriendRequests(userId: string): Promise<{ data: any[] | null; error: any }> {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *, 
        receiver:users!receiver_id(*)
      `)
      .eq('sender_id', userId)
      .eq('status', 'pending');
    
    return { data, error };
  },

  async getReceivedFriendRequests(userId: string): Promise<{ data: any[] | null; error: any }> {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *, 
        sender:users!sender_id(*)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending');
    
    return { data, error };
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
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *, 
        sender:users!sender_id(*),
        receiver:users!receiver_id(*)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .or(`sender_id.eq.${friendId},receiver_id.eq.${friendId}`)
      .order('created_at', { ascending: true });
    
    return { data, error };
  },

  async getChatSessions(userId: string): Promise<{ data: any[] | null; error: any }> {
    // 这里需要根据实际的数据模型来实现
    // 示例实现：获取与所有好友的最新消息
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *, 
        sender:users!sender_id(*),
        receiver:users!receiver_id(*)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) return { data: null, error };
    
    // 处理数据，按对话分组并获取最新消息
    const sessionsMap = new Map<string, any>();
    
    data.forEach(message => {
      const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
      if (!sessionsMap.has(otherUserId)) {
        sessionsMap.set(otherUserId, message);
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
  }
};
