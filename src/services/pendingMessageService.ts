/**
 * 待发送消息服务
 * 用于保存用户未发送的消息草稿，类似于微信的草稿功能
 * 数据持久化到 Supabase 数据库
 */
import { supabase } from '@/lib/supabase';

// 待发送消息类型
export interface PendingMessage {
  id?: string;
  user_id: string;
  content: string;
  context?: string; // 消息上下文，如页面路径、来源等
  metadata?: Record<string, any>; // 额外元数据
  created_at?: string;
  updated_at?: string;
}

class PendingMessageService {
  private readonly STORAGE_KEY = 'aiAssistantPendingMessage';

  /**
   * 保存待发送消息到数据库
   * @param content 消息内容
   * @param context 消息上下文（如页面路径）
   * @param metadata 额外元数据
   */
  async savePendingMessage(
    content: string,
    context?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.warn('[PendingMessageService] 用户未登录，保存到 localStorage');
        localStorage.setItem(this.STORAGE_KEY, content);
        return true;
      }

      const userId = userData.user.id;

      // 检查是否已有待发送消息
      const { data: existingData } = await supabase
        .from('pending_messages')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const pendingMessage: Partial<PendingMessage> = {
        user_id: userId,
        content,
        context: context || window.location.pathname,
        metadata: metadata || {},
        updated_at: new Date().toISOString(),
      };

      if (existingData?.id) {
        // 更新现有记录
        const { error } = await supabase
          .from('pending_messages')
          .update(pendingMessage)
          .eq('id', existingData.id);

        if (error) throw error;
      } else {
        // 创建新记录
        pendingMessage.created_at = new Date().toISOString();
        const { error } = await supabase
          .from('pending_messages')
          .insert(pendingMessage);

        if (error) throw error;
      }

      // 同时保存到 localStorage 作为缓存
      localStorage.setItem(this.STORAGE_KEY, content);

      console.log('[PendingMessageService] 待发送消息已保存到数据库');
      return true;
    } catch (error) {
      console.error('[PendingMessageService] 保存待发送消息失败:', error);
      // 失败时保存到 localStorage
      localStorage.setItem(this.STORAGE_KEY, content);
      return false;
    }
  }

  /**
   * 获取用户的待发送消息
   * @returns 消息内容或 null
   */
  async getPendingMessage(): Promise<string | null> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        // 用户未登录，从 localStorage 获取
        return localStorage.getItem(this.STORAGE_KEY);
      }

      const userId = userData.user.id;

      const { data, error } = await supabase
        .from('pending_messages')
        .select('content')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[PendingMessageService] 获取待发送消息失败:', error);
        // 从 localStorage 回退
        return localStorage.getItem(this.STORAGE_KEY);
      }

      return data?.content || null;
    } catch (error) {
      console.error('[PendingMessageService] 获取待发送消息失败:', error);
      // 从 localStorage 回退
      return localStorage.getItem(this.STORAGE_KEY);
    }
  }

  /**
   * 获取完整的待发送消息记录
   */
  async getPendingMessageFull(): Promise<PendingMessage | null> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const userId = userData.user.id;

      const { data, error } = await supabase
        .from('pending_messages')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[PendingMessageService] 获取待发送消息失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[PendingMessageService] 获取待发送消息失败:', error);
      return null;
    }
  }

  /**
   * 清除待发送消息
   */
  async clearPendingMessage(): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // 清除 localStorage
      localStorage.removeItem(this.STORAGE_KEY);

      if (!userData.user) {
        return true;
      }

      const userId = userData.user.id;

      const { error } = await supabase
        .from('pending_messages')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      console.log('[PendingMessageService] 待发送消息已清除');
      return true;
    } catch (error) {
      console.error('[PendingMessageService] 清除待发送消息失败:', error);
      return false;
    }
  }

  /**
   * 同步 localStorage 中的待发送消息到数据库
   * 用于用户登录后同步数据
   */
  async syncFromLocalStorage(): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;

      const localContent = localStorage.getItem(this.STORAGE_KEY);
      if (!localContent) return false;

      // 保存到数据库
      await this.savePendingMessage(localContent);

      // 清除 localStorage
      localStorage.removeItem(this.STORAGE_KEY);

      console.log('[PendingMessageService] 已从 localStorage 同步到数据库');
      return true;
    } catch (error) {
      console.error('[PendingMessageService] 同步失败:', error);
      return false;
    }
  }
}

// 导出单例实例
const service = new PendingMessageService();
export default service;
