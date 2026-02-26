/**
 * 用户状态服务 - 保存用户操作状态到 Supabase 数据库
 * 包括：Neo 页面状态、历史记录、收藏、工作流进度等
 */

import { supabase } from '@/lib/supabase';

// Neo 页面创作状态
export interface NeoCreationState {
  prompt: string;
  brand: string;
  tags: string[];
  customBrand: string;
  useCustomBrand: boolean;
  textStyle: string;
  videoParams: {
    duration: number;
    resolution: string;
    cameraFixed: boolean;
  };
  engine: string;
}

// 历史记录项
export interface UserHistoryItem {
  id: string;
  userId: string;
  type: 'video' | 'image' | 'text' | 'audio';
  url: string;
  thumbnail?: string;
  title?: string;
  prompt?: string;
  metadata?: Record<string, any>;
  isFavorite: boolean;
  createdAt: number;
}

// 工作流进度
export interface UserWorkflowProgress {
  id: string;
  userId: string;
  workflowType: string;
  currentStep: number;
  totalSteps: number;
  data: Record<string, any>;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

// 用户偏好设置
export interface UserPreferences {
  id?: string;
  userId: string;
  theme?: string;
  language?: string;
  fontSize?: number;
  layoutCompactness?: string;
  notificationsEnabled?: boolean;
  notificationSound?: boolean;
  notificationFrequency?: string;
  dataCollectionEnabled?: boolean;
  customSettings?: Record<string, any>;
  updatedAt: number;
}

class UserStateService {
  private readonly NEO_STATE_TABLE = 'user_neo_state';
  private readonly HISTORY_TABLE = 'user_history';
  private readonly WORKFLOW_TABLE = 'user_workflows';
  private readonly PREFERENCES_TABLE = 'user_preferences';

  /**
   * 获取当前登录用户
   */
  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // ==================== Neo 页面状态 ====================

  /**
   * 保存 Neo 页面创作状态
   */
  async saveNeoCreationState(state: NeoCreationState): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[UserState] User not logged in, skipping Neo state save');
        return false;
      }

      const { error } = await supabase
        .from(this.NEO_STATE_TABLE)
        .upsert({
          user_id: user.id,
          prompt: state.prompt,
          brand: state.brand,
          tags: state.tags,
          custom_brand: state.customBrand,
          use_custom_brand: state.useCustomBrand,
          text_style: state.textStyle,
          video_params: state.videoParams,
          engine: state.engine,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[UserState] Failed to save Neo state:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[UserState] Error saving Neo state:', error);
      return false;
    }
  }

  /**
   * 获取 Neo 页面创作状态
   */
  async getNeoCreationState(): Promise<NeoCreationState | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[UserState] User not logged in, no Neo state');
        return null;
      }

      const { data, error } = await supabase
        .from(this.NEO_STATE_TABLE)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('[UserState] Failed to get Neo state:', error);
        return null;
      }

      return {
        prompt: data.prompt || '',
        brand: data.brand || 'mahua',
        tags: data.tags || [],
        customBrand: data.custom_brand || '',
        useCustomBrand: data.use_custom_brand || false,
        textStyle: data.text_style || 'creative',
        videoParams: data.video_params || {
          duration: 5,
          resolution: '720p',
          cameraFixed: false
        },
        engine: data.engine || 'sdxl'
      };
    } catch (error) {
      console.error('[UserState] Error getting Neo state:', error);
      return null;
    }
  }

  // ==================== 历史记录 ====================

  /**
   * 保存历史记录
   */
  async saveHistoryItem(item: Omit<UserHistoryItem, 'id' | 'userId'>): Promise<UserHistoryItem | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[UserState] User not logged in, skipping history save');
        return null;
      }

      const newItem = {
        user_id: user.id,
        type: item.type,
        url: item.url,
        thumbnail: item.thumbnail,
        title: item.title,
        prompt: item.prompt,
        metadata: item.metadata,
        is_favorite: item.isFavorite,
        created_at: new Date(item.createdAt).toISOString()
      };

      const { data, error } = await supabase
        .from(this.HISTORY_TABLE)
        .insert(newItem)
        .select()
        .single();

      if (error) {
        console.error('[UserState] Failed to save history:', error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        type: data.type,
        url: data.url,
        thumbnail: data.thumbnail,
        title: data.title,
        prompt: data.prompt,
        metadata: data.metadata,
        isFavorite: data.is_favorite,
        createdAt: new Date(data.created_at).getTime()
      };
    } catch (error) {
      console.error('[UserState] Error saving history:', error);
      return null;
    }
  }

  /**
   * 获取用户历史记录
   */
  async getUserHistory(type?: 'video' | 'image' | 'text' | 'audio', limit: number = 30): Promise<UserHistoryItem[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[UserState] User not logged in, returning empty history');
        return [];
      }

      let query = supabase
        .from(this.HISTORY_TABLE)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[UserState] Failed to get history:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        type: item.type,
        url: item.url,
        thumbnail: item.thumbnail,
        title: item.title,
        prompt: item.prompt,
        metadata: item.metadata,
        isFavorite: item.is_favorite,
        createdAt: new Date(item.created_at).getTime()
      }));
    } catch (error) {
      console.error('[UserState] Error getting history:', error);
      return [];
    }
  }

  /**
   * 更新历史记录收藏状态
   */
  async toggleHistoryFavorite(itemId: string, isFavorite: boolean): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[UserState] User not logged in, cannot toggle favorite');
        return false;
      }

      const { error } = await supabase
        .from(this.HISTORY_TABLE)
        .update({ is_favorite: isFavorite })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) {
        console.error('[UserState] Failed to toggle favorite:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[UserState] Error toggling favorite:', error);
      return false;
    }
  }

  /**
   * 删除历史记录
   */
  async deleteHistoryItem(itemId: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[UserState] User not logged in, cannot delete history');
        return false;
      }

      const { error } = await supabase
        .from(this.HISTORY_TABLE)
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) {
        console.error('[UserState] Failed to delete history:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[UserState] Error deleting history:', error);
      return false;
    }
  }

  // ==================== 工作流进度 ====================

  /**
   * 保存工作流进度
   */
  async saveWorkflowProgress(
    workflowType: string,
    currentStep: number,
    totalSteps: number,
    data: Record<string, any>,
    isCompleted: boolean = false
  ): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[UserState] User not logged in, skipping workflow save');
        return false;
      }

      const { error } = await supabase
        .from(this.WORKFLOW_TABLE)
        .upsert({
          user_id: user.id,
          workflow_type: workflowType,
          current_step: currentStep,
          total_steps: totalSteps,
          data: data,
          is_completed: isCompleted,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,workflow_type'
        });

      if (error) {
        console.error('[UserState] Failed to save workflow:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[UserState] Error saving workflow:', error);
      return false;
    }
  }

  /**
   * 获取工作流进度
   */
  async getWorkflowProgress(workflowType: string): Promise<UserWorkflowProgress | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[UserState] User not logged in, no workflow progress');
        return null;
      }

      const { data, error } = await supabase
        .from(this.WORKFLOW_TABLE)
        .select('*')
        .eq('user_id', user.id)
        .eq('workflow_type', workflowType)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('[UserState] Failed to get workflow:', error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        workflowType: data.workflow_type,
        currentStep: data.current_step,
        totalSteps: data.total_steps,
        data: data.data,
        isCompleted: data.is_completed,
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime()
      };
    } catch (error) {
      console.error('[UserState] Error getting workflow:', error);
      return null;
    }
  }

  // ==================== 用户偏好设置 ====================

  /**
   * 保存用户偏好设置
   */
  async savePreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[UserState] User not logged in, skipping preferences save');
        return false;
      }

      const { error } = await supabase
        .from(this.PREFERENCES_TABLE)
        .upsert({
          user_id: user.id,
          theme: preferences.theme,
          language: preferences.language,
          font_size: preferences.fontSize,
          layout_compactness: preferences.layoutCompactness,
          notifications_enabled: preferences.notificationsEnabled,
          notification_sound: preferences.notificationSound,
          notification_frequency: preferences.notificationFrequency,
          data_collection_enabled: preferences.dataCollectionEnabled,
          custom_settings: preferences.customSettings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[UserState] Failed to save preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[UserState] Error saving preferences:', error);
      return false;
    }
  }

  /**
   * 获取用户偏好设置
   */
  async getPreferences(): Promise<UserPreferences | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[UserState] User not logged in, no preferences');
        return null;
      }

      const { data, error } = await supabase
        .from(this.PREFERENCES_TABLE)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('[UserState] Failed to get preferences:', error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        theme: data.theme,
        language: data.language,
        fontSize: data.font_size,
        layoutCompactness: data.layout_compactness,
        notificationsEnabled: data.notifications_enabled,
        notificationSound: data.notification_sound,
        notificationFrequency: data.notification_frequency,
        dataCollectionEnabled: data.data_collection_enabled,
        customSettings: data.custom_settings,
        updatedAt: new Date(data.updated_at).getTime()
      };
    } catch (error) {
      console.error('[UserState] Error getting preferences:', error);
      return null;
    }
  }
}

export const userStateService = new UserStateService();
export default userStateService;
