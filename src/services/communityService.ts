import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export interface Community {
  id: string;
  name: string;
  description: string;
  cover: string;
  tags: string[];
  members_count: number;
  privacy: 'public' | 'private';
  created_at: string;
  is_member?: boolean; // Helper field
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface Message {
  id: string;
  community_id: string;
  user_id: string;
  text: string;
  avatar?: string;
  username?: string; // Joined from users table
  is_pinned: boolean;
  created_at: string;
  reactions?: Record<string, string[]>; // emoji -> user_ids
  reply_to?: {
    id: string;
    username: string;
    text: string;
  };
}

export interface Thread {
  id: string;
  community_id: string;
  user_id: string;
  title: string;
  content: string;
  topic?: string;
  upvotes: number;
  is_pinned: boolean;
  created_at: string;
  author?: {
    username: string;
    avatar_url: string;
  };
  replies_count?: number;
}

export const communityService = {
  /**
   * 获取推荐社群
   */
  async getRecommendedCommunities(): Promise<Community[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('privacy', 'public')
        .order('members_count', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch recommended communities:', error);
      return [];
    }
  },

  /**
   * 获取用户已加入的社群
   */
  async getJoinedCommunities(userId: string): Promise<Community[]> {
    if (!supabase || !userId) return [];

    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          community_id,
          communities:community_id (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      // @ts-ignore
      return data.map(item => item.communities) as Community[];
    } catch (error) {
      console.error('Failed to fetch joined communities:', error);
      return [];
    }
  },

  /**
   * 创建社群
   */
  async createCommunity(communityData: Partial<Community>, userId: string): Promise<Community | null> {
    if (!supabase || !userId) {
      toast.error('请先登录');
      return null;
    }

    try {
      // 1. Create community
      const { data: community, error: createError } = await supabase
        .from('communities')
        .insert([{
          ...communityData,
          id: communityData.id || `c-${Date.now()}`, // Generate ID if not provided
          members_count: 1
        }])
        .select()
        .single();

      if (createError) throw createError;

      // 2. Add creator as owner
      const { error: memberError } = await supabase
        .from('community_members')
        .insert([{
          community_id: community.id,
          user_id: userId,
          role: 'owner'
        }]);

      if (memberError) {
        // Rollback community creation if member addition fails
        await supabase.from('communities').delete().eq('id', community.id);
        throw memberError;
      }

      return community;
    } catch (error: any) {
      console.error('Failed to create community:', error);
      toast.error(error.message || '创建社群失败');
      return null;
    }
  },

  /**
   * 加入社群
   */
  async joinCommunity(communityId: string, userId: string): Promise<boolean> {
    if (!supabase || !userId) return false;

    try {
      const { error } = await supabase
        .from('community_members')
        .insert([{
          community_id: communityId,
          user_id: userId,
          role: 'member'
        }]);

      if (error) throw error;

      // Increment members count
      await supabase.rpc('increment_community_members', { community_id: communityId });
      
      return true;
    } catch (error: any) {
      console.error('Failed to join community:', error);
      toast.error(error.message || '加入社群失败');
      return false;
    }
  },

  /**
   * 退出社群
   */
  async leaveCommunity(communityId: string, userId: string): Promise<boolean> {
    if (!supabase || !userId) return false;

    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId);

      if (error) throw error;

      // Decrement members count
      await supabase.rpc('decrement_community_members', { community_id: communityId });

      return true;
    } catch (error: any) {
      console.error('Failed to leave community:', error);
      toast.error(error.message || '退出社群失败');
      return false;
    }
  },

  /**
   * 获取社群消息
   */
  async getMessages(communityId: string, limit = 50): Promise<Message[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          users:user_id (username, avatar)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map((msg: any) => ({
        ...msg,
        username: msg.users?.username || '未知用户',
        avatar: msg.users?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user_id}`
      })).reverse(); // Return in chronological order
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  },

  /**
   * 发送消息
   */
  async sendMessage(communityId: string, userId: string, text: string): Promise<Message | null> {
    if (!supabase || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          community_id: communityId,
          user_id: userId,
          text
        }])
        .select(`
          *,
          users:user_id (username, avatar)
        `)
        .single();

      if (error) throw error;

      return {
        ...data,
        username: data.users?.username,
        avatar: data.users?.avatar
      };
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error('发送失败');
      return null;
    }
  },

  /**
   * 订阅实时消息
   */
  subscribeToMessages(communityId: string, callback: (msg: Message) => void) {
    if (!supabase) return null;

    return supabase
      .channel(`public:messages:${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `community_id=eq.${communityId}`
        },
        async (payload) => {
          // Fetch user details for the new message
          const { data: user } = await supabase!
            .from('users')
            .select('username, avatar')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage: Message = {
            id: payload.new.id,
            community_id: payload.new.community_id,
            user_id: payload.new.user_id,
            text: payload.new.text,
            is_pinned: payload.new.is_pinned,
            created_at: payload.new.created_at,
            username: user?.username || '未知用户',
            avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${payload.new.user_id}`
          };

          callback(newMessage);
        }
      )
      .subscribe();
  },

  /**
   * 获取社群帖子
   */
  async getThreads(communityId: string, limit = 20): Promise<Thread[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users:user_id (username, avatar)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map((post: any) => ({
        ...post,
        author: {
          username: post.users?.username || '未知用户',
          avatar_url: post.users?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`
        }
      }));
    } catch (error) {
      console.error('Failed to fetch threads:', error);
      return [];
    }
  },

  /**
   * 创建帖子
   */
  async createThread(threadData: Partial<Thread>, userId: string): Promise<Thread | null> {
    if (!supabase || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([{
          ...threadData,
          user_id: userId
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Failed to create thread:', error);
      toast.error('发帖失败');
      return null;
    }
  }
};
