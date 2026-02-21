/**
 * AI生成服务模块
 * 提供与千问API的集成功能，支持图片生成和视频生成
 * 支持后台生成：用户关闭页面后，生成任务仍会继续执行
 */

import apiClient from '@/lib/apiClient';
import { llmService } from './llmService';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { toast } from 'sonner';

// 辅助函数：恢复 Supabase 会话
async function restoreSupabaseSession(): Promise<boolean> {
  try {
    // 先检查当前是否有有效会话
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession) {
      return true;
    }

    // 尝试从 localStorage 恢复会话
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!token || !refreshToken) {
      console.error('[AIGeneration] No tokens found in localStorage');
      return false;
    }

    // 尝试设置会话
    const { data, error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: refreshToken
    });

    if (error) {
      console.error('[AIGeneration] Failed to set session:', error);
      return false;
    }

    if (data.session) {
      console.log('[AIGeneration] Session restored successfully');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[AIGeneration] Error restoring session:', error);
    return false;
  }
}

// 生成任务类型
export type GenerationType = 'image' | 'video' | 'text';

// 生成任务状态
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// 图片生成参数
export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  size?: '1024x1024' | '1024x768' | '768x1024' | '1280x720' | '720x1280';
  n?: number;
  style?: 'auto' | 'photography' | 'illustration' | '3d' | 'painting' | 'sketch';
  quality?: 'standard' | 'hd' | 'ultra';
  seed?: number;
}

// 视频生成参数
export interface VideoGenerationParams {
  prompt: string;
  imageUrl?: string;
  duration?: 5 | 10 | 15;
  resolution?: '720p' | '1080p';
  aspectRatio?: '16:9' | '9:16' | '1:1';
  model?: string;
}

// 生成任务
export interface GenerationTask {
  id: string;
  type: GenerationType;
  status: GenerationStatus;
  params: ImageGenerationParams | VideoGenerationParams;
  progress: number;
  result?: GenerationResult;
  error?: string;
  errorType?: 'content_policy' | 'timeout' | 'auth' | 'general';  // 错误类型
  createdAt: number;
  updatedAt: number;
  estimatedTime?: number;
  // 数据库相关字段
  userId?: string;
  startedAt?: string;
  completedAt?: string;
}

// 生成结果
export interface GenerationResult {
  urls: string[];
  revisedPrompt?: string;
  seed?: number;
  metadata?: Record<string, any>;
}

// 历史记录项
export interface GenerationHistoryItem {
  id: string;
  type: GenerationType;
  prompt: string;
  thumbnail: string;
  createdAt: number;
  isFavorite: boolean;
  tags: string[];
}

// 风格预设
export interface StylePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
  category: 'traditional' | 'modern' | 'artistic' | 'commercial';
}

// 默认风格预设
export const DEFAULT_STYLE_PRESETS: StylePreset[] = [
  {
    id: 'guochao',
    name: '国潮风尚',
    description: '传统与现代的完美融合',
    icon: 'dragon',
    prompt: '国潮风格，中国传统元素，现代设计手法，鲜艳色彩，精美细节',
    category: 'traditional'
  },
  {
    id: 'traditional-painting',
    name: '水墨意境',
    description: '东方美学，意境深远',
    icon: 'paint-brush',
    prompt: '中国水墨画风格，黑白灰调，意境深远，留白艺术，东方美学',
    category: 'traditional'
  },
  {
    id: 'minimalist',
    name: '极简主义',
    description: '少即是多，纯净美学',
    icon: 'minus',
    prompt: '极简主义风格，大量留白，简洁线条，中性色调，高端大气',
    category: 'modern'
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    description: '未来科技，霓虹都市',
    icon: 'microchip',
    prompt: '赛博朋克风格，霓虹灯光，未来科技，高对比度，城市夜景',
    category: 'modern'
  },
  {
    id: 'oil-painting',
    name: '油画质感',
    description: '经典油画，艺术气息',
    icon: 'palette',
    prompt: '油画风格，丰富色彩，厚重质感，艺术光影，经典绘画',
    category: 'artistic'
  },
  {
    id: 'watercolor',
    name: '水彩清新',
    description: '柔和透明，自然清新',
    icon: 'tint',
    prompt: '水彩画风格，柔和色彩，透明质感，自然晕染，清新明亮',
    category: 'artistic'
  },
  {
    id: 'product',
    name: '产品摄影',
    description: '专业产品展示',
    icon: 'camera',
    prompt: '专业产品摄影，柔和灯光，精致细节，商业质感，高端大气',
    category: 'commercial'
  },
  {
    id: 'poster',
    name: '海报设计',
    description: '视觉冲击，吸引眼球',
    icon: 'image',
    prompt: '海报设计风格，视觉冲击力强，文字排版精美，色彩鲜明，吸引眼球',
    category: 'commercial'
  }
];

// 尺寸预设
export const SIZE_PRESETS = [
  { value: '1024x1024', label: '1:1 方形', description: '适合社交媒体头像、产品展示' },
  { value: '1024x768', label: '4:3 横版', description: '适合PPT、文档插图' },
  { value: '768x1024', label: '3:4 竖版', description: '适合海报、封面' },
  { value: '1280x720', label: '16:9 宽屏', description: '适合视频封面、横幅' },
  { value: '720x1280', label: '9:16 竖屏', description: '适合短视频、手机壁纸' }
];

// 质量预设
export const QUALITY_PRESETS = [
  { value: 'standard', label: '标准', description: '快速生成，适合预览' },
  { value: 'hd', label: '高清', description: '高质量，适合一般用途' },
  { value: 'ultra', label: '超清', description: '最高质量，适合印刷' }
];

/**
 * AI生成服务类
 * 支持后台生成：任务持久化到数据库，用户关闭页面后继续执行
 */
class AIGenerationService {
  private tasks: Map<string, GenerationTask> = new Map();
  private taskListeners: Array<(task: GenerationTask) => void> = [];
  private historyListeners: Array<(items: GenerationHistoryItem[]) => void> = [];
  private pollingIntervals: Map<string, number> = new Map();

  constructor() {
    // 初始化时恢复未完成的任务
    this.restoreActiveTasks();
  }

  /**
   * 恢复未完成的生成任务
   * 页面刷新后自动恢复正在进行的任务
   */
  private async restoreActiveTasks(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 获取用户的活跃任务
      const { data: activeTasks, error } = await supabase
        .from('generation_tasks')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false });

      if (error || !activeTasks || activeTasks.length === 0) return;

      console.log('[AIGeneration] Restoring', activeTasks.length, 'active tasks');

      // 恢复每个任务到内存并启动轮询
      for (const dbTask of activeTasks) {
        const task: GenerationTask = {
          id: dbTask.id,
          type: dbTask.type as GenerationType,
          status: dbTask.status as GenerationStatus,
          params: dbTask.params,
          progress: dbTask.progress || 0,
          result: dbTask.result,
          error: dbTask.error,
          errorType: dbTask.error_type,
          createdAt: new Date(dbTask.created_at).getTime(),
          updatedAt: new Date(dbTask.updated_at).getTime(),
          userId: dbTask.user_id,
          startedAt: dbTask.started_at,
          completedAt: dbTask.completed_at
        };

        this.tasks.set(task.id, task);
        this.notifyTaskUpdate(task);

        // 启动轮询
        this.startTaskPolling(task.id);

        // 显示恢复提示
        if (task.status === 'processing') {
          toast.info(`恢复进行中的生成任务：${task.params.prompt?.substring(0, 20)}...`, {
            duration: 3000
          });
        }
      }
    } catch (error) {
      console.error('[AIGeneration] Failed to restore tasks:', error);
    }
  }

  /**
   * 生成图片（支持后台生成）
   */
  async generateImage(params: ImageGenerationParams): Promise<GenerationTask> {
    // 先尝试恢复会话
    const sessionRestored = await restoreSupabaseSession();
    if (!sessionRestored) {
      throw new Error('登录状态已过期，请刷新页面后重试');
    }
    
    // 获取会话
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('登录状态已过期，请刷新页面后重试');
    }
    
    const user = session.user;
    if (!user) {
      throw new Error('用户未登录');
    }

    // 1. 创建数据库任务记录
    const { data: dbTask, error } = await supabase
      .from('generation_tasks')
      .insert({
        user_id: user.id,
        type: 'image',
        status: 'pending',
        params: params as any,
        progress: 0
      })
      .select()
      .single();

    if (error || !dbTask) {
      throw new Error('创建生成任务失败: ' + (error?.message || '未知错误'));
    }

    // 2. 创建内存任务对象
    const task: GenerationTask = {
      id: dbTask.id,
      type: 'image',
      status: 'pending',
      params,
      progress: 0,
      createdAt: new Date(dbTask.created_at).getTime(),
      updatedAt: new Date(dbTask.updated_at).getTime(),
      estimatedTime: 30000,
      userId: user.id
    };

    this.tasks.set(task.id, task);
    this.notifyTaskUpdate(task);

    // 3. 调用 Edge Function 启动后台生成
    this.startBackgroundGeneration(task.id);

    // 4. 启动轮询
    this.startTaskPolling(task.id);

    return task;
  }

  /**
   * 启动后台生成（调用 Edge Function）
   */
  private async startBackgroundGeneration(taskId: string): Promise<void> {
    try {
      // 先尝试恢复会话
      const sessionRestored = await restoreSupabaseSession();
      if (!sessionRestored) {
        console.error('[AIGeneration] Failed to restore session');
        return;
      }
      
      // 获取会话
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[AIGeneration] No session available');
        return;
      }

      // 调用 Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ taskId })
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('[AIGeneration] Background generation failed:', error);
      }
    } catch (error) {
      console.error('[AIGeneration] Failed to start background generation:', error);
    }
  }

  /**
   * 启动任务状态轮询
   */
  private startTaskPolling(taskId: string): void {
    // 清除已有的轮询
    if (this.pollingIntervals.has(taskId)) {
      window.clearInterval(this.pollingIntervals.get(taskId));
    }

    // 每3秒轮询一次
    const intervalId = window.setInterval(async () => {
      await this.pollTaskStatus(taskId);
    }, 3000);

    this.pollingIntervals.set(taskId, intervalId);

    // 立即执行一次
    this.pollTaskStatus(taskId);
  }

  /**
   * 轮询任务状态
   */
  private async pollTaskStatus(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // 如果任务已完成或失败，停止轮询
    if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
      this.stopTaskPolling(taskId);
      return;
    }

    try {
      const { data: dbTask, error } = await supabase
        .from('generation_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error || !dbTask) return;

      // 更新内存中的任务状态
      const updatedTask: GenerationTask = {
        ...task,
        status: dbTask.status as GenerationStatus,
        progress: dbTask.progress || 0,
        result: dbTask.result,
        error: dbTask.error,
        errorType: dbTask.error_type,
        updatedAt: new Date(dbTask.updated_at).getTime(),
        completedAt: dbTask.completed_at
      };

      this.tasks.set(taskId, updatedTask);
      this.notifyTaskUpdate(updatedTask);

      // 如果任务完成，添加到历史记录
      if (dbTask.status === 'completed' && task.status !== 'completed') {
        this.addToHistory(updatedTask);
        toast.success('图片生成完成！');
        this.stopTaskPolling(taskId);
      } else if (dbTask.status === 'failed' && task.status !== 'failed') {
        toast.error('生成失败: ' + (dbTask.error || '未知错误'));
        this.stopTaskPolling(taskId);
      }
    } catch (error) {
      console.error('[AIGeneration] Polling error:', error);
    }
  }

  /**
   * 停止任务轮询
   */
  private stopTaskPolling(taskId: string): void {
    const intervalId = this.pollingIntervals.get(taskId);
    if (intervalId) {
      window.clearInterval(intervalId);
      this.pollingIntervals.delete(taskId);
    }
  }

  /**
   * 生成视频
   */
  async generateVideo(params: VideoGenerationParams): Promise<GenerationTask> {
    // 先尝试恢复会话
    const sessionRestored = await restoreSupabaseSession();
    if (!sessionRestored) {
      throw new Error('登录状态已过期，请刷新页面后重试');
    }
    
    // 获取会话
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('登录状态已过期，请刷新页面后重试');
    }
    
    const user = session.user;
    if (!user) {
      throw new Error('用户未登录');
    }

    // 1. 创建数据库任务记录
    const { data: dbTask, error } = await supabase
      .from('generation_tasks')
      .insert({
        user_id: user.id,
        type: 'video',
        status: 'pending',
        params: params as any,
        progress: 0
      })
      .select()
      .single();

    if (error || !dbTask) {
      throw new Error('创建生成任务失败: ' + (error?.message || '未知错误'));
    }

    // 2. 创建内存任务对象
    const task: GenerationTask = {
      id: dbTask.id,
      type: 'video',
      status: 'pending',
      params,
      progress: 0,
      createdAt: new Date(dbTask.created_at).getTime(),
      updatedAt: new Date(dbTask.updated_at).getTime(),
      estimatedTime: 180000,
      userId: user.id
    };

    this.tasks.set(task.id, task);
    this.notifyTaskUpdate(task);

    // 3. 启动后台生成（视频生成使用原来的方式，后续可以改为 Edge Function）
    this.executeVideoGeneration(task);

    return task;
  }

  /**
   * 执行视频生成
   */
  private async executeVideoGeneration(task: GenerationTask): Promise<void> {
    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      // 更新状态为 processing
      await supabase
        .from('generation_tasks')
        .update({
          status: 'processing',
          progress: 5,
          started_at: new Date().toISOString()
        })
        .eq('id', task.id);

      const params = task.params as VideoGenerationParams;

      // 启动进度条动画
      let currentProgress = 5;
      const maxProgressBeforeResult = 40;
      const estimatedSubmitTime = 10000;
      const updateInterval = 1000;
      const progressIncrement = (maxProgressBeforeResult - currentProgress) / (estimatedSubmitTime / updateInterval);

      progressInterval = setInterval(async () => {
        if (currentProgress < maxProgressBeforeResult) {
          currentProgress += progressIncrement + (Math.random() * 2 - 1);
          currentProgress = Math.min(currentProgress, maxProgressBeforeResult);

          await supabase
            .from('generation_tasks')
            .update({ progress: Math.round(currentProgress) })
            .eq('id', task.id);
        }
      }, updateInterval);

      // 调用 llmService 生成视频
      const result = await llmService.generateVideo({
        prompt: params.prompt,
        imageUrl: params.imageUrl,
        duration: params.duration || 5,
        resolution: params.resolution || '720p',
        aspectRatio: params.aspectRatio || '16:9',
        model: params.model || 'wanx2.1-t2v-turbo'
      });

      // 清除进度动画
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      if (result.ok && result.data) {
        // 轮询检查视频生成状态
        const videoUrl = await this.pollVideoStatusWithProgress(
          result.data.task_id || result.data,
          task.id,
          40,
          90
        );

        // 更新任务为完成状态
        await supabase
          .from('generation_tasks')
          .update({
            status: 'completed',
            progress: 100,
            result: {
              urls: [videoUrl],
              metadata: result.data
            },
            completed_at: new Date().toISOString()
          })
          .eq('id', task.id);

        // 更新内存任务
        task.status = 'completed';
        task.progress = 100;
        task.result = {
          urls: [videoUrl],
          metadata: result.data
        };
        this.notifyTaskUpdate(task);
        this.addToHistory(task);
      } else {
        throw new Error(result.error || '视频生成失败');
      }
    } catch (error) {
      // 清除进度动画
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      console.error('[AIGeneration] Video generation failed:', error);

      // 更新任务为失败状态
      await supabase
        .from('generation_tasks')
        .update({
          status: 'failed',
          error: error instanceof Error ? error.message : '生成失败',
          completed_at: new Date().toISOString()
        })
        .eq('id', task.id);

      task.error = error instanceof Error ? error.message : '生成失败';
      task.status = 'failed';
      this.notifyTaskUpdate(task);
    }
  }

  /**
   * 轮询视频生成状态（带进度更新）
   */
  private async pollVideoStatusWithProgress(
    taskId: string,
    internalTaskId: string,
    startProgress: number,
    maxProgress: number
  ): Promise<string> {
    const maxAttempts = 60;
    const interval = 5000;

    for (let i = 0; i < maxAttempts; i++) {
      // 计算并更新进度
      const progressRange = maxProgress - startProgress;
      const currentProgress = startProgress + (progressRange * (i / maxAttempts));

      await supabase
        .from('generation_tasks')
        .update({ progress: Math.round(currentProgress) })
        .eq('id', internalTaskId);

      try {
        const response = await fetch(`/api/qwen/videos/status/${taskId}`);
        if (!response.ok) {
          throw new Error('Failed to check video status');
        }

        const result = await response.json();

        if (result.ok) {
          if (result.data.status === 'completed' && result.data.videoUrl) {
            return result.data.videoUrl;
          } else if (result.data.status === 'failed') {
            throw new Error(result.data.error || '视频生成失败');
          }
        }
      } catch (error) {
        console.warn('[AIGeneration] Poll status error:', error);
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('视频生成超时');
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): GenerationTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): GenerationTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task || (task.status !== 'pending' && task.status !== 'processing')) {
      return false;
    }

    try {
      // 更新数据库状态
      await supabase
        .from('generation_tasks')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      // 更新内存状态
      task.status = 'cancelled';
      task.updatedAt = Date.now();
      this.notifyTaskUpdate(task);

      // 停止轮询
      this.stopTaskPolling(taskId);

      return true;
    } catch (error) {
      console.error('[AIGeneration] Failed to cancel task:', error);
      return false;
    }
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: string): Promise<boolean> {
    try {
      // 从数据库删除
      await supabase
        .from('generation_tasks')
        .delete()
        .eq('id', taskId);

      // 停止轮询
      this.stopTaskPolling(taskId);

      // 从内存删除
      return this.tasks.delete(taskId);
    } catch (error) {
      console.error('[AIGeneration] Failed to delete task:', error);
      return false;
    }
  }

  /**
   * 添加任务监听器
   */
  addTaskListener(listener: (task: GenerationTask) => void): () => void {
    this.taskListeners.push(listener);
    return () => {
      const index = this.taskListeners.indexOf(listener);
      if (index > -1) {
        this.taskListeners.splice(index, 1);
      }
    };
  }

  /**
   * 通知任务更新
   */
  private notifyTaskUpdate(task: GenerationTask): void {
    this.taskListeners.forEach(listener => listener(task));
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(task: GenerationTask): void {
    const historyItem: GenerationHistoryItem = {
      id: task.id,
      type: task.type,
      prompt: (task.params as any).prompt || '',
      thumbnail: task.result?.urls[0] || '',
      createdAt: task.createdAt,
      isFavorite: false,
      tags: []
    };

    // 保存到 localStorage
    const history = this.getHistory();
    history.unshift(historyItem);

    // 限制历史记录数量
    if (history.length > 100) {
      history.pop();
    }

    localStorage.setItem('ai_generation_history', JSON.stringify(history));
    this.notifyHistoryUpdate(history);
  }

  /**
   * 获取历史记录
   */
  getHistory(): GenerationHistoryItem[] {
    try {
      const history = localStorage.getItem('ai_generation_history');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }

  /**
   * 添加收藏
   */
  addToFavorites(taskId: string): void {
    const history = this.getHistory();
    const item = history.find(h => h.id === taskId);
    if (item) {
      item.isFavorite = true;
      localStorage.setItem('ai_generation_history', JSON.stringify(history));
      this.notifyHistoryUpdate(history);
    }
  }

  /**
   * 移除收藏
   */
  removeFromFavorites(taskId: string): void {
    const history = this.getHistory();
    const item = history.find(h => h.id === taskId);
    if (item) {
      item.isFavorite = false;
      localStorage.setItem('ai_generation_history', JSON.stringify(history));
      this.notifyHistoryUpdate(history);
    }
  }

  /**
   * 获取收藏列表
   */
  getFavorites(): GenerationHistoryItem[] {
    return this.getHistory().filter(item => item.isFavorite);
  }

  /**
   * 删除历史记录
   */
  deleteHistoryItem(taskId: string): void {
    const history = this.getHistory().filter(h => h.id !== taskId);
    localStorage.setItem('ai_generation_history', JSON.stringify(history));
    this.notifyHistoryUpdate(history);
  }

  /**
   * 清空历史记录
   */
  clearHistory(): void {
    localStorage.removeItem('ai_generation_history');
    this.notifyHistoryUpdate([]);
  }

  /**
   * 添加历史记录监听器
   */
  addHistoryListener(listener: (items: GenerationHistoryItem[]) => void): () => void {
    this.historyListeners.push(listener);
    // 立即通知当前历史记录
    listener(this.getHistory());
    return () => {
      const index = this.historyListeners.indexOf(listener);
      if (index > -1) {
        this.historyListeners.splice(index, 1);
      }
    };
  }

  /**
   * 通知历史记录更新
   */
  private notifyHistoryUpdate(items: GenerationHistoryItem[]): void {
    this.historyListeners.forEach(listener => listener(items));
  }

  /**
   * 优化提示词
   */
  async optimizePrompt(prompt: string, type: GenerationType): Promise<string> {
    try {
      const optimizationPrompt = `请优化以下${type === 'image' ? '图片' : '视频'}生成提示词，使其更加详细、具体，能够生成更好的效果。

原始提示词：${prompt}

请返回优化后的提示词，要求：
1. 添加更多细节描述
2. 明确风格、光影、构图等要素
3. 使用英文（如果是中文提示词）
4. 保持核心创意不变

只返回优化后的提示词，不要其他解释。`;

      const result = await llmService.generateResponse(optimizationPrompt, {
        priority: 'high'
      });

      return result.trim() || prompt;
    } catch (error) {
      console.error('[AIGeneration] Prompt optimization failed:', error);
      return prompt;
    }
  }

  /**
   * 生成提示词建议
   */
  async generatePromptSuggestions(keyword: string): Promise<string[]> {
    try {
      const suggestionPrompt = `基于关键词"${keyword}"，生成5个不同风格的${keyword}相关提示词建议。

要求：
1. 每个提示词都要包含具体的风格、场景、细节描述
2. 涵盖不同的艺术风格（如写实、插画、油画等）
3. 适合AI图像生成

请直接返回5个提示词，每行一个，不要编号或其他格式。`;

      const result = await llmService.generateResponse(suggestionPrompt, {
        priority: 'medium'
      });

      return result.split('\n').filter(line => line.trim()).slice(0, 5);
    } catch (error) {
      console.error('[AIGeneration] Prompt suggestion failed:', error);
      return [];
    }
  }

  /**
   * 获取用户的生成历史（从数据库）
   */
  async getUserGenerationHistoryFromDB(limit: number = 50, offset: number = 0): Promise<GenerationTask[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .rpc('get_user_generation_history', {
          p_user_id: user.id,
          p_limit: limit,
          p_offset: offset
        });

      if (error || !data) return [];

      return data.map((dbTask: any) => ({
        id: dbTask.id,
        type: dbTask.type as GenerationType,
        status: dbTask.status as GenerationStatus,
        params: dbTask.params,
        progress: dbTask.progress || 0,
        result: dbTask.result,
        error: dbTask.error,
        errorType: dbTask.error_type,
        createdAt: new Date(dbTask.created_at).getTime(),
        updatedAt: new Date(dbTask.updated_at).getTime(),
        userId: dbTask.user_id,
        startedAt: dbTask.started_at,
        completedAt: dbTask.completed_at
      }));
    } catch (error) {
      console.error('[AIGeneration] Failed to get history from DB:', error);
      return [];
    }
  }
}

// 导出服务实例
export const aiGenerationService = new AIGenerationService();
