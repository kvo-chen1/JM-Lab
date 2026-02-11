/**
 * AI用户长记忆服务
 * 管理用户的对话历史、长记忆和用户画像
 */

import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

// 记忆类型
export type MemoryType = 'preference' | 'fact' | 'habit' | 'goal' | 'context';

// 用户记忆
export interface UserMemory {
  id: string;
  user_id: string;
  memory_type: MemoryType;
  content: string;
  importance: number;
  source_conversation_id?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
}

// 对话会话
export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  model_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  context_summary?: string;
  message_count: number;
  metadata?: Record<string, any>;
}

// 对话消息
export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  is_error?: boolean;
  feedback_rating?: number;
  feedback_comment?: string;
  metadata?: Record<string, any>;
}

// 用户AI设置
export interface AIUserSettings {
  id: string;
  user_id: string;
  personality: string;
  theme: string;
  enable_memory: boolean;
  enable_typing_effect: boolean;
  auto_scroll: boolean;
  show_preset_questions: boolean;
  shortcut_key: string;
  preferred_model: string;
  custom_settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// 用户画像
export interface UserProfile {
  preferences: {
    topics: string[];
    content_types: string[];
    interaction_style: string;
  };
  habits: {
    active_hours: string[];
    frequent_actions: string[];
    preferred_features: string[];
  };
  goals: {
    short_term: string[];
    long_term: string[];
  };
  context: {
    last_visit: string;
    total_conversations: number;
    total_messages: number;
  };
}

class AIMemoryService {
  private currentUser: User | null = null;
  private currentConversation: Conversation | null = null;
  private memoryCache: Map<string, UserMemory[]> = new Map();
  private cacheExpiry = 10 * 60 * 1000; // 10分钟缓存

  /**
   * 设置当前用户
   */
  setCurrentUser(user: User | null): void {
    this.currentUser = user;
    if (user) {
      this.loadUserSettings();
    }
  }

  /**
   * 获取当前用户ID
   */
  private getUserId(): string | null {
    return this.currentUser?.id || null;
  }

  /**
   * 创建新对话
   */
  async createConversation(title: string = '新对话', modelId: string = 'qwen'): Promise<Conversation | null> {
    const userId = this.getUserId();
    if (!userId) return null;

    try {
      // 先将其他对话设为非活跃
      await supabase
        .from('ai_conversations')
        .update({ is_active: false })
        .eq('user_id', userId);

      // 创建新对话
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          title,
          model_id: modelId,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('创建对话失败:', error);
        return null;
      }

      this.currentConversation = data;
      return data;
    } catch (error) {
      console.error('创建对话异常:', error);
      return null;
    }
  }

  /**
   * 获取用户的对话列表
   */
  async getConversations(limit: number = 20, offset: number = 0): Promise<Conversation[]> {
    const userId = this.getUserId();
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .rpc('get_user_conversations', {
          p_user_id: userId,
          p_limit: limit,
          p_offset: offset
        });

      if (error) {
        console.error('获取对话列表失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取对话列表异常:', error);
      return [];
    }
  }

  /**
   * 切换对话
   */
  async switchConversation(conversationId: string): Promise<Conversation | null> {
    const userId = this.getUserId();
    if (!userId) return null;

    try {
      // 先将所有对话设为非活跃
      await supabase
        .from('ai_conversations')
        .update({ is_active: false })
        .eq('user_id', userId);

      // 将目标对话设为活跃
      const { data, error } = await supabase
        .from('ai_conversations')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('切换对话失败:', error);
        return null;
      }

      this.currentConversation = data;
      return data;
    } catch (error) {
      console.error('切换对话异常:', error);
      return null;
    }
  }

  /**
   * 获取当前活跃对话
   */
  async getActiveConversation(): Promise<Conversation | null> {
    const userId = this.getUserId();
    if (!userId) return null;

    // 如果已经有缓存的当前对话，直接返回
    if (this.currentConversation) {
      return this.currentConversation;
    }

    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 没有找到活跃对话，创建一个新的
          return this.createConversation();
        }
        console.error('获取活跃对话失败:', error);
        return null;
      }

      this.currentConversation = data;
      return data;
    } catch (error) {
      console.error('获取活跃对话异常:', error);
      return null;
    }
  }

  /**
   * 获取对话的消息历史
   */
  async getConversationMessages(conversationId: string, limit: number = 50): Promise<ConversationMessage[]> {
    const userId = this.getUserId();
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('获取消息历史失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取消息历史异常:', error);
      return [];
    }
  }

  /**
   * 保存消息
   */
  async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    isError: boolean = false
  ): Promise<ConversationMessage | null> {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          is_error: isError,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('保存消息失败:', error);
        return null;
      }

      // 更新对话的更新时间
      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('保存消息异常:', error);
      return null;
    }
  }

  /**
   * 更新消息反馈
   */
  async updateMessageFeedback(
    messageId: string,
    rating: number,
    comment?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_messages')
        .update({
          feedback_rating: rating,
          feedback_comment: comment
        })
        .eq('id', messageId);

      if (error) {
        console.error('更新消息反馈失败:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('更新消息反馈异常:', error);
      return false;
    }
  }

  /**
   * 删除对话
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    const userId = this.getUserId();
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) {
        console.error('删除对话失败:', error);
        return false;
      }

      // 如果删除的是当前对话，清空缓存
      if (this.currentConversation?.id === conversationId) {
        this.currentConversation = null;
      }

      return true;
    } catch (error) {
      console.error('删除对话异常:', error);
      return false;
    }
  }

  /**
   * 重命名对话
   */
  async renameConversation(conversationId: string, newTitle: string): Promise<boolean> {
    const userId = this.getUserId();
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ title: newTitle })
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) {
        console.error('重命名对话失败:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('重命名对话异常:', error);
      return false;
    }
  }

  /**
   * 添加用户记忆
   */
  async addMemory(
    content: string,
    type: MemoryType,
    importance: number = 5,
    expiresAt?: Date,
    sourceConversationId?: string
  ): Promise<UserMemory | null> {
    const userId = this.getUserId();
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('ai_user_memories')
        .insert({
          user_id: userId,
          memory_type: type,
          content,
          importance,
          expires_at: expiresAt?.toISOString(),
          source_conversation_id: sourceConversationId
        })
        .select()
        .single();

      if (error) {
        console.error('添加记忆失败:', error);
        return null;
      }

      // 清除缓存
      this.memoryCache.delete(userId);

      return data;
    } catch (error) {
      console.error('添加记忆异常:', error);
      return null;
    }
  }

  /**
   * 获取用户记忆
   */
  async getMemories(type?: MemoryType, limit: number = 10): Promise<UserMemory[]> {
    const userId = this.getUserId();
    if (!userId) return [];

    // 检查缓存
    const cacheKey = `${userId}_${type || 'all'}`;
    const cached = this.memoryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_memories', {
          p_user_id: userId,
          p_memory_type: type || null,
          p_limit: limit
        });

      if (error) {
        console.error('获取记忆失败:', error);
        return [];
      }

      const memories = data || [];
      this.memoryCache.set(cacheKey, memories);

      return memories;
    } catch (error) {
      console.error('获取记忆异常:', error);
      return [];
    }
  }

  /**
   * 从对话中提取并保存记忆
   */
  async extractAndSaveMemories(conversationId: string, messages: ConversationMessage[]): Promise<void> {
    const userId = this.getUserId();
    if (!userId) return;

    // 简单的记忆提取逻辑
    const userMessages = messages.filter(m => m.role === 'user');
    
    for (const message of userMessages) {
      const content = message.content.toLowerCase();

      // 提取偏好
      if (content.includes('喜欢') || content.includes('偏好') || content.includes('感兴趣')) {
        const preference = this.extractPreference(message.content);
        if (preference) {
          await this.addMemory(preference, 'preference', 7, undefined, conversationId);
        }
      }

      // 提取目标
      if (content.includes('想') || content.includes('希望') || content.includes('目标')) {
        const goal = this.extractGoal(message.content);
        if (goal) {
          await this.addMemory(goal, 'goal', 8, undefined, conversationId);
        }
      }

      // 提取习惯
      if (content.includes('经常') || content.includes('通常') || content.includes('习惯')) {
        const habit = this.extractHabit(message.content);
        if (habit) {
          await this.addMemory(habit, 'habit', 6, undefined, conversationId);
        }
      }
    }
  }

  /**
   * 提取偏好
   */
  private extractPreference(message: string): string | null {
    // 简单的偏好提取
    const patterns = [
      /我喜欢(.+?)[，。]/,
      /我对(.+?)感兴趣/,
      /我偏好(.+?)[，。]/,
      /我喜欢用(.+?)[，。]/,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return `用户偏好: ${match[1].trim()}`;
      }
    }

    return null;
  }

  /**
   * 提取目标
   */
  private extractGoal(message: string): string | null {
    const patterns = [
      /我想(.+?)[，。]/,
      /我希望(.+?)[，。]/,
      /我的目标是(.+?)[，。]/,
      /我想要(.+?)[，。]/,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return `用户目标: ${match[1].trim()}`;
      }
    }

    return null;
  }

  /**
   * 提取习惯
   */
  private extractHabit(message: string): string | null {
    const patterns = [
      /我经常(.+?)[，。]/,
      /我通常(.+?)[，。]/,
      /我习惯(.+?)[，。]/,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return `用户习惯: ${match[1].trim()}`;
      }
    }

    return null;
  }

  /**
   * 获取用户画像
   */
  async getUserProfile(): Promise<UserProfile | null> {
    const userId = this.getUserId();
    if (!userId) return null;

    try {
      const memories = await this.getMemories(undefined, 50);
      const conversations = await this.getConversations(100);

      // 计算总消息数
      let totalMessages = 0;
      for (const conv of conversations) {
        totalMessages += conv.message_count;
      }

      const profile: UserProfile = {
        preferences: {
          topics: [],
          content_types: [],
          interaction_style: 'friendly'
        },
        habits: {
          active_hours: [],
          frequent_actions: [],
          preferred_features: []
        },
        goals: {
          short_term: [],
          long_term: []
        },
        context: {
          last_visit: new Date().toISOString(),
          total_conversations: conversations.length,
          total_messages: totalMessages
        }
      };

      // 分析记忆构建画像
      for (const memory of memories) {
        switch (memory.memory_type) {
          case 'preference':
            profile.preferences.topics.push(memory.content);
            break;
          case 'goal':
            profile.goals.short_term.push(memory.content);
            break;
          case 'habit':
            profile.habits.frequent_actions.push(memory.content);
            break;
        }
      }

      return profile;
    } catch (error) {
      console.error('获取用户画像异常:', error);
      return null;
    }
  }

  /**
   * 获取用户设置
   */
  async getUserSettings(): Promise<AIUserSettings | null> {
    const userId = this.getUserId();
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('ai_user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 没有找到设置，创建默认设置
          return this.createDefaultSettings();
        }
        console.error('获取用户设置失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('获取用户设置异常:', error);
      return null;
    }
  }

  /**
   * 创建默认设置
   */
  private async createDefaultSettings(): Promise<AIUserSettings | null> {
    const userId = this.getUserId();
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('ai_user_settings')
        .insert({
          user_id: userId,
          personality: 'friendly',
          theme: 'auto',
          enable_memory: true,
          enable_typing_effect: true,
          auto_scroll: true,
          show_preset_questions: true,
          shortcut_key: 'ctrl+k',
          preferred_model: 'qwen'
        })
        .select()
        .single();

      if (error) {
        console.error('创建默认设置失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('创建默认设置异常:', error);
      return null;
    }
  }

  /**
   * 更新用户设置
   */
  async updateUserSettings(settings: Partial<AIUserSettings>): Promise<boolean> {
    const userId = this.getUserId();
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('ai_user_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('更新用户设置失败:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('更新用户设置异常:', error);
      return false;
    }
  }

  /**
   * 生成记忆上下文提示
   */
  async generateMemoryContext(): Promise<string> {
    const userId = this.getUserId();
    if (!userId) return '';

    const memories = await this.getMemories(undefined, 10);
    const profile = await this.getUserProfile();

    if (memories.length === 0 && !profile) {
      return '';
    }

    let context = '\n\n【用户背景信息】\n';

    if (profile) {
      context += `- 对话历史: ${profile.context.total_conversations}次对话，${profile.context.total_messages}条消息\n`;
      
      if (profile.preferences.topics.length > 0) {
        context += `- 兴趣偏好: ${profile.preferences.topics.slice(0, 3).join('、')}\n`;
      }
      
      if (profile.goals.short_term.length > 0) {
        context += `- 近期目标: ${profile.goals.short_term.slice(0, 2).join('、')}\n`;
      }
    }

    if (memories.length > 0) {
      context += '\n【重要记忆】\n';
      memories.slice(0, 5).forEach(memory => {
        context += `- ${memory.content}\n`;
      });
    }

    return context;
  }

  /**
   * 导出用户数据
   */
  async exportUserData(): Promise<{
    conversations: Conversation[];
    messages: ConversationMessage[];
    memories: UserMemory[];
    settings: AIUserSettings | null;
  } | null> {
    const userId = this.getUserId();
    if (!userId) return null;

    try {
      const conversations = await this.getConversations(1000);
      const memories = await this.getMemories(undefined, 1000);
      const settings = await this.getUserSettings();

      // 获取所有对话的消息
      const allMessages: ConversationMessage[] = [];
      for (const conv of conversations) {
        const messages = await this.getConversationMessages(conv.id, 1000);
        allMessages.push(...messages);
      }

      return {
        conversations,
        messages: allMessages,
        memories,
        settings
      };
    } catch (error) {
      console.error('导出用户数据异常:', error);
      return null;
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.memoryCache.clear();
  }
}

// 导出单例实例
export const aiMemoryService = new AIMemoryService();
