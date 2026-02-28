import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

// 用户信息类型
export interface UserInfo {
  id: string;
  username: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  followersCount?: number;
  followingCount?: number;
  worksCount?: number;
  favoritesCount?: number;
}

// 关注记录类型
export interface FollowRecord {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  user?: UserInfo;
}

// 用户服务
export const userService = {
  /**
   * 关注用户
   */
  async followUser(targetUserId: string): Promise<boolean> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        toast.error('请先登录');
        return false;
      }

      const response = await apiClient.post('/api/follows', { targetUserId });
      
      if (response.ok && response.data?.code === 0) {
        toast.success('关注成功');
        return true;
      } else {
        toast.error(response.data?.message || '关注失败');
        return false;
      }
    } catch (error: any) {
      console.error('[userService] followUser error:', error);
      toast.error(error.message || '关注失败');
      return false;
    }
  },

  /**
   * 取消关注用户
   */
  async unfollowUser(targetUserId: string): Promise<boolean> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        toast.error('请先登录');
        return false;
      }

      const response = await apiClient.delete(`/api/follows/${targetUserId}`);
      
      if (response.ok && response.data?.code === 0) {
        toast.success('已取消关注');
        return true;
      } else {
        toast.error(response.data?.message || '取消关注失败');
        return false;
      }
    } catch (error: any) {
      console.error('[userService] unfollowUser error:', error);
      toast.error(error.message || '取消关注失败');
      return false;
    }
  },

  /**
   * 获取关注列表
   */
  async getFollowing(userId: string): Promise<FollowRecord[]> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        return [];
      }

      const response = await apiClient.get('/api/follows/following');
      
      if (response.ok && response.data?.code === 0) {
        return response.data.data || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('[userService] getFollowing error:', error);
      return [];
    }
  },

  /**
   * 获取粉丝列表
   */
  async getFollowers(userId: string): Promise<FollowRecord[]> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        return [];
      }

      const response = await apiClient.get('/api/follows/followers');
      
      if (response.ok && response.data?.code === 0) {
        return response.data.data || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('[userService] getFollowers error:', error);
      return [];
    }
  },

  /**
   * 检查是否已关注
   */
  async isFollowing(targetUserId: string): Promise<boolean> {
    try {
      const following = await this.getFollowing(targetUserId);
      return following.some(f => f.following_id === targetUserId);
    } catch (error) {
      console.error('[userService] isFollowing error:', error);
      return false;
    }
  },

  /**
   * 获取用户信息
   */
  async getUserInfo(userId: string): Promise<UserInfo | null> {
    try {
      const response = await apiClient.get(`/api/users/${userId}`);
      
      if (response.ok && response.data?.code === 0) {
        return response.data.data;
      } else {
        return null;
      }
    } catch (error) {
      console.error('[userService] getUserInfo error:', error);
      return null;
    }
  },
};

export default userService;
