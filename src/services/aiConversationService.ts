/**
 * AI 对话服务 - 保存对话历史到 Supabase 数据库
 */

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// 消息类型
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isError?: boolean;
}

// 对话会话类型
export interface ConversationSession {
  id: string;
  userId: string;
  title: string;
  modelId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  contextSummary?: string;
  messageCount: number;
}

class AIConversationService {
  private readonly CONVERSATIONS_TABLE = 'ai_conversations';
  private readonly MESSAGES_TABLE = 'ai_messages';

  /**
   * 获取当前登录用户
   */
  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  /**
   * 创建新对话
   */
  async createConversation(title: string = '新对话', modelId: string = 'qwen'): Promise<ConversationSession | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[AIConversation] User not logged in, skipping conversation creation');
        return null;
      }

      // 先将用户的所有对话设为非活跃
      await supabase
        .from(this.CONVERSATIONS_TABLE)
        .update({ is_active: false })
        .eq('user_id', user.id);

      // 创建新对话
      const { data, error } = await supabase
        .from(this.CONVERSATIONS_TABLE)
        .insert({
          user_id: user.id,
          title,
          model_id: modelId,
          is_active: true,
          message_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('[AIConversation] Failed to create conversation:', error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        modelId: data.model_id,
        messages: [],
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime(),
        isActive: data.is_active,
        contextSummary: data.context_summary,
        messageCount: data.message_count
      };
    } catch (error) {
      console.error('[AIConversation] Error creating conversation:', error);
      return null;
    }
  }

  /**
   * 保存消息到对话
   */
  async saveMessage(
    conversationId: string,
    message: Message
  ): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[AIConversation] User not logged in, skipping message save');
        return false;
      }

      const { error } = await supabase
        .from(this.MESSAGES_TABLE)
        .insert({
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          timestamp: new Date(message.timestamp).toISOString(),
          is_error: message.isError || false
        });

      if (error) {
        console.error('[AIConversation] Failed to save message:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[AIConversation] Error saving message:', error);
      return false;
    }
  }

  /**
   * 批量保存消息
   */
  async saveMessages(
    conversationId: string,
    messages: Message[]
  ): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[AIConversation] User not logged in, skipping messages save');
        return false;
      }

      const messagesToInsert = messages.map(msg => ({
        conversation_id: conversationId,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).toISOString(),
        is_error: msg.isError || false
      }));

      const { error } = await supabase
        .from(this.MESSAGES_TABLE)
        .insert(messagesToInsert);

      if (error) {
        console.error('[AIConversation] Failed to save messages:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[AIConversation] Error saving messages:', error);
      return false;
    }
  }

  /**
   * 获取用户的所有对话
   */
  async getUserConversations(limit: number = 20): Promise<ConversationSession[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[AIConversation] User not logged in, returning empty conversations');
        return [];
      }

      const { data, error } = await supabase
        .from(this.CONVERSATIONS_TABLE)
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[AIConversation] Failed to get conversations:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        title: item.title,
        modelId: item.model_id,
        messages: [],
        createdAt: new Date(item.created_at).getTime(),
        updatedAt: new Date(item.updated_at).getTime(),
        isActive: item.is_active,
        contextSummary: item.context_summary,
        messageCount: item.message_count
      }));
    } catch (error) {
      console.error('[AIConversation] Error getting conversations:', error);
      return [];
    }
  }

  /**
   * 获取对话的所有消息
   */
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[AIConversation] User not logged in, returning empty messages');
        return [];
      }

      const { data, error } = await supabase
        .from(this.MESSAGES_TABLE)
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('[AIConversation] Failed to get messages:', error);
        return [];
      }

      return (data || []).map(item => ({
        role: item.role as 'user' | 'assistant' | 'system',
        content: item.content,
        timestamp: new Date(item.timestamp).getTime(),
        isError: item.is_error
      }));
    } catch (error) {
      console.error('[AIConversation] Error getting messages:', error);
      return [];
    }
  }

  /**
   * 获取活跃的对话
   */
  async getActiveConversation(): Promise<ConversationSession | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[AIConversation] User not logged in, no active conversation');
        return null;
      }

      const { data, error } = await supabase
        .from(this.CONVERSATIONS_TABLE)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 没有找到活跃对话
          return null;
        }
        console.error('[AIConversation] Failed to get active conversation:', error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        modelId: data.model_id,
        messages: [],
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime(),
        isActive: data.is_active,
        contextSummary: data.context_summary,
        messageCount: data.message_count
      };
    } catch (error) {
      console.error('[AIConversation] Error getting active conversation:', error);
      return null;
    }
  }

  /**
   * 切换活跃对话
   */
  async switchConversation(conversationId: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[AIConversation] User not logged in, cannot switch conversation');
        return false;
      }

      const { error } = await supabase.rpc('switch_user_conversation', {
        p_user_id: user.id,
        p_conversation_id: conversationId
      });

      if (error) {
        console.error('[AIConversation] Failed to switch conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[AIConversation] Error switching conversation:', error);
      return false;
    }
  }

  /**
   * 删除对话
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[AIConversation] User not logged in, cannot delete conversation');
        return false;
      }

      const { error } = await supabase
        .from(this.CONVERSATIONS_TABLE)
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('[AIConversation] Failed to delete conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[AIConversation] Error deleting conversation:', error);
      return false;
    }
  }

  /**
   * 更新对话标题
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[AIConversation] User not logged in, cannot update title');
        return false;
      }

      const { error } = await supabase
        .from(this.CONVERSATIONS_TABLE)
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('[AIConversation] Failed to update title:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[AIConversation] Error updating title:', error);
      return false;
    }
  }

  /**
   * 同步本地会话到云端
   * 用于将 localStorage 中的会话同步到数据库
   */
  async syncLocalSessionToCloud(
    sessionId: string,
    title: string,
    modelId: string,
    messages: Message[]
  ): Promise<string | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[AIConversation] User not logged in, skipping sync');
        return null;
      }

      // 创建新对话
      const conversation = await this.createConversation(title, modelId);
      if (!conversation) {
        return null;
      }

      // 保存所有消息
      if (messages.length > 0) {
        await this.saveMessages(conversation.id, messages);
      }

      console.log('[AIConversation] Synced local session to cloud:', conversation.id);
      return conversation.id;
    } catch (error) {
      console.error('[AIConversation] Error syncing to cloud:', error);
      return null;
    }
  }
}

export const aiConversationService = new AIConversationService();
export default aiConversationService;
