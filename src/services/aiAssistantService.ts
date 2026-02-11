/**
 * AI助手增强服务
 * 整合知识库、记忆和LLM服务，提供完整的AI助手功能
 */

import { aiKnowledgeService, NavigationTarget, KnowledgeItem } from './aiKnowledgeService';
import { aiMemoryService, Conversation, ConversationMessage } from './aiMemoryService';
import { llmService, Message as LLMMessage } from './llmService';
import { supabase } from '@/lib/supabase';

export interface AIResponse {
  type: 'navigation' | 'guide' | 'chat' | 'error';
  content: string;
  target?: NavigationTarget;
  knowledge?: KnowledgeItem;
  shouldNavigate?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isError?: boolean;
}

class AIAssistantService {
  private currentConversationId: string | null = null;
  private isInitialized: boolean = false;

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser();
    
    // 设置记忆服务的当前用户
    aiMemoryService.setCurrentUser(user);

    // 获取或创建活跃对话
    const conversation = await aiMemoryService.getActiveConversation();
    if (conversation) {
      this.currentConversationId = conversation.id;
    }

    this.isInitialized = true;
  }

  /**
   * 处理用户消息
   */
  async processMessage(
    message: string,
    currentPath: string,
    onTyping?: (text: string) => void
  ): Promise<AIResponse> {
    // 确保已初始化
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 1. 首先尝试知识库匹配（导航、操作指导等）
    const knowledgeResponse = await aiKnowledgeService.generateSmartResponse(message, currentPath);
    
    if (knowledgeResponse.type === 'navigation' && knowledgeResponse.target) {
      // 保存用户消息
      await this.saveMessage('user', message);
      
      // 保存助手回复
      await this.saveMessage('assistant', knowledgeResponse.content);
      
      return {
        type: 'navigation',
        content: knowledgeResponse.content,
        target: knowledgeResponse.target,
        shouldNavigate: true
      };
    }

    if (knowledgeResponse.type === 'guide' && knowledgeResponse.knowledge) {
      // 保存用户消息
      await this.saveMessage('user', message);
      
      // 保存助手回复
      await this.saveMessage('assistant', knowledgeResponse.content);
      
      return {
        type: 'guide',
        content: knowledgeResponse.content,
        knowledge: knowledgeResponse.knowledge
      };
    }

    // 2. 使用LLM生成回复
    return this.generateLLMResponse(message, currentPath, onTyping);
  }

  /**
   * 使用LLM生成回复
   */
  private async generateLLMResponse(
    message: string,
    currentPath: string,
    onTyping?: (text: string) => void
  ): Promise<AIResponse> {
    try {
      // 保存用户消息到数据库
      await this.saveMessage('user', message);

      // 获取记忆上下文
      const memoryContext = await aiMemoryService.generateMemoryContext();

      // 构建增强的提示词
      const enhancedPrompt = this.buildEnhancedPrompt(message, currentPath, memoryContext);

      // 调用LLM
      const response = await llmService.directGenerateResponse(enhancedPrompt, {
        context: {
          page: this.getPageName(currentPath),
          path: currentPath,
          hasMemory: memoryContext.length > 0
        }
      });

      // 保存助手回复
      await this.saveMessage('assistant', response);

      // 提取记忆
      await this.extractMemoriesFromConversation();

      return {
        type: 'chat',
        content: response
      };
    } catch (error) {
      console.error('LLM响应生成失败:', error);
      
      const errorMessage = '抱歉，我暂时无法回答您的问题。请稍后再试或联系客服。';
      await this.saveMessage('assistant', errorMessage, true);
      
      return {
        type: 'error',
        content: errorMessage
      };
    }
  }

  /**
   * 构建增强的提示词
   */
  private buildEnhancedPrompt(message: string, currentPath: string, memoryContext: string): string {
    let prompt = message;

    // 添加页面上下文
    const pageName = this.getPageName(currentPath);
    if (pageName) {
      prompt += `\n\n[当前页面: ${pageName}]`;
    }

    // 添加记忆上下文
    if (memoryContext) {
      prompt += memoryContext;
    }

    return prompt;
  }

  /**
   * 获取页面名称
   */
  private getPageName(path: string): string {
    const pageNames: Record<string, string> = {
      '/': '首页',
      '/create': '创作中心',
      '/creation-workshop': '创作工坊',
      '/square': '津脉广场',
      '/cultural-knowledge': '文化知识',
      '/marketplace': '文创市集',
      '/my-works': '我的作品',
      '/neo': '灵感引擎',
      '/dashboard': '仪表盘',
      '/settings': '设置',
      '/profile': '个人中心',
      '/explore': '探索',
      '/cultural-events': '文化活动',
      '/notifications': '消息通知',
      '/help': '帮助中心',
      '/about': '关于我们',
      '/tianjin': '天津特色',
      '/leaderboard': '排行榜',
      '/news': '新闻资讯',
      '/wizard': '共创向导',
    };

    return pageNames[path] || '未知页面';
  }

  /**
   * 保存消息
   */
  private async saveMessage(
    role: 'user' | 'assistant' | 'system',
    content: string,
    isError: boolean = false
  ): Promise<void> {
    if (!this.currentConversationId) {
      const conversation = await aiMemoryService.getActiveConversation();
      if (conversation) {
        this.currentConversationId = conversation.id;
      } else {
        return;
      }
    }

    await aiMemoryService.saveMessage(this.currentConversationId, role, content, isError);
  }

  /**
   * 从对话中提取记忆
   */
  private async extractMemoriesFromConversation(): Promise<void> {
    if (!this.currentConversationId) return;

    const messages = await aiMemoryService.getConversationMessages(this.currentConversationId, 10);
    await aiMemoryService.extractAndSaveMemories(this.currentConversationId, messages);
  }

  /**
   * 获取对话历史
   */
  async getConversationHistory(): Promise<ChatMessage[]> {
    if (!this.currentConversationId) {
      const conversation = await aiMemoryService.getActiveConversation();
      if (conversation) {
        this.currentConversationId = conversation.id;
      } else {
        return [];
      }
    }

    const messages = await aiMemoryService.getConversationMessages(this.currentConversationId, 50);
    
    return messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp).getTime(),
      isError: m.is_error
    }));
  }

  /**
   * 获取预设问题
   */
  async getPresetQuestions(currentPath: string): Promise<string[]> {
    return aiKnowledgeService.getContextualQuestions(currentPath);
  }

  /**
   * 创建新对话
   */
  async createNewConversation(): Promise<void> {
    const conversation = await aiMemoryService.createConversation();
    if (conversation) {
      this.currentConversationId = conversation.id;
    }
  }

  /**
   * 切换对话
   */
  async switchConversation(conversationId: string): Promise<void> {
    const conversation = await aiMemoryService.switchConversation(conversationId);
    if (conversation) {
      this.currentConversationId = conversation.id;
    }
  }

  /**
   * 获取所有对话
   */
  async getAllConversations(): Promise<Conversation[]> {
    return aiMemoryService.getConversations(20);
  }

  /**
   * 删除对话
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    return aiMemoryService.deleteConversation(conversationId);
  }

  /**
   * 重命名对话
   */
  async renameConversation(conversationId: string, newTitle: string): Promise<boolean> {
    return aiMemoryService.renameConversation(conversationId, newTitle);
  }

  /**
   * 清空当前对话
   */
  async clearCurrentConversation(): Promise<void> {
    if (!this.currentConversationId) return;
    
    // 删除当前对话
    await this.deleteConversation(this.currentConversationId);
    
    // 创建新对话
    await this.createNewConversation();
  }

  /**
   * 更新消息反馈
   */
  async submitFeedback(messageId: string, rating: number, comment?: string): Promise<boolean> {
    return aiMemoryService.updateMessageFeedback(messageId, rating, comment);
  }

  /**
   * 获取用户画像
   */
  async getUserProfile() {
    return aiMemoryService.getUserProfile();
  }

  /**
   * 导出用户数据
   */
  async exportUserData() {
    return aiMemoryService.exportUserData();
  }

  /**
   * 识别导航意图
   */
  recognizeNavigation(message: string): NavigationTarget | null {
    return aiKnowledgeService.recognizeNavigationIntent(message);
  }
}

// 导出单例实例
export const aiAssistantService = new AIAssistantService();
