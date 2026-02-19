/**
 * AI生成服务模块
 * 提供与千问API的集成功能，支持图片生成和视频生成
 */

import apiClient from '@/lib/apiClient';
import { llmService } from './llmService';

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
 */
class AIGenerationService {
  private tasks: Map<string, GenerationTask> = new Map();
  private taskListeners: Array<(task: GenerationTask) => void> = [];
  private historyListeners: Array<(items: GenerationHistoryItem[]) => void> = [];

  /**
   * 生成图片
   */
  async generateImage(params: ImageGenerationParams): Promise<GenerationTask> {
    const taskId = this.generateTaskId();
    
    // 创建任务
    const task: GenerationTask = {
      id: taskId,
      type: 'image',
      status: 'pending',
      params,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      estimatedTime: 30000 // 预估30秒
    };

    this.tasks.set(taskId, task);
    this.notifyTaskUpdate(task);

    // 异步执行生成
    this.executeImageGeneration(task);

    return task;
  }

  /**
   * 执行图片生成
   */
  private async executeImageGeneration(task: GenerationTask): Promise<void> {
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    
    try {
      this.updateTaskStatus(task.id, 'processing', 5);

      const params = task.params as ImageGenerationParams;
      
      // 启动进度条动画 - 模拟平滑进度增长
      let currentProgress = 5;
      const maxProgressBeforeResult = 85; // 在结果返回前最大进度
      const estimatedTime = 30000; // 预估30秒
      const updateInterval = 1000; // 每秒更新一次
      const progressIncrement = (maxProgressBeforeResult - currentProgress) / (estimatedTime / updateInterval);
      
      progressInterval = setInterval(() => {
        if (currentProgress < maxProgressBeforeResult) {
          currentProgress += progressIncrement + (Math.random() * 2 - 1); // 添加随机波动
          currentProgress = Math.min(currentProgress, maxProgressBeforeResult);
          this.updateTaskStatus(task.id, 'processing', Math.round(currentProgress));
        }
      }, updateInterval);
      
      // 调用llmService的generateImage方法
      const result = await llmService.generateImage({
        prompt: params.prompt,
        size: params.size || '1024x1024',
        n: params.n || 1,
        model: 'wanx2.1-t2i-turbo',
        quality: params.quality || 'standard',
        style: params.style || 'auto'
      });

      // 清除进度动画
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      if (result.ok && result.data) {
        const imageUrls = result.data.data.map((item: any) => item.url);
        
        // 直接更新任务对象的属性
        task.result = {
          urls: imageUrls,
          revisedPrompt: result.data.data[0]?.revised_prompt || params.prompt,
          seed: params.seed
        };
        task.status = 'completed';
        task.progress = 100;
        task.updatedAt = Date.now();
        this.notifyTaskUpdate(task);
        
        // 添加到历史记录
        this.addToHistory(task);
      } else {
        throw new Error(result.error || '图片生成失败');
      }
    } catch (error) {
      // 清除进度动画
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      
      console.error('[AIGeneration] Image generation failed:', error);
      
      // 直接更新任务对象的错误状态
      task.error = error instanceof Error ? error.message : '生成失败';
      task.status = 'failed';
      task.progress = 0;
      task.updatedAt = Date.now();
      this.notifyTaskUpdate(task);
    }
  }

  /**
   * 生成视频
   */
  async generateVideo(params: VideoGenerationParams): Promise<GenerationTask> {
    const taskId = this.generateTaskId();
    
    const task: GenerationTask = {
      id: taskId,
      type: 'video',
      status: 'pending',
      params,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      estimatedTime: 180000 // 预估3分钟
    };

    this.tasks.set(taskId, task);
    this.notifyTaskUpdate(task);

    // 异步执行生成
    this.executeVideoGeneration(task);

    return task;
  }

  /**
   * 执行视频生成
   */
  private async executeVideoGeneration(task: GenerationTask): Promise<void> {
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    
    try {
      this.updateTaskStatus(task.id, 'processing', 5);

      const params = task.params as VideoGenerationParams;
      
      // 启动进度条动画
      let currentProgress = 5;
      const maxProgressBeforeResult = 40; // 提交任务前最大进度
      const estimatedSubmitTime = 10000; // 预估提交时间10秒
      const updateInterval = 1000;
      const progressIncrement = (maxProgressBeforeResult - currentProgress) / (estimatedSubmitTime / updateInterval);
      
      progressInterval = setInterval(() => {
        if (currentProgress < maxProgressBeforeResult) {
          currentProgress += progressIncrement + (Math.random() * 2 - 1);
          currentProgress = Math.min(currentProgress, maxProgressBeforeResult);
          this.updateTaskStatus(task.id, 'processing', Math.round(currentProgress));
        }
      }, updateInterval);
      
      // 调用llmService的generateVideo方法
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
        // 轮询检查视频生成状态，同时更新进度
        const videoUrl = await this.pollVideoStatusWithProgress(
          result.data.task_id || result.data, 
          task.id,
          40,  // 起始进度
          90   // 轮询阶段最大进度
        );
        
        // 直接更新任务对象的属性
        task.result = {
          urls: [videoUrl],
          metadata: result.data
        };
        task.status = 'completed';
        task.progress = 100;
        task.updatedAt = Date.now();
        this.notifyTaskUpdate(task);
        
        // 添加到历史记录
        this.addToHistory(task);
      } else {
        throw new Error(result.error || '视频生成失败');
      }
    } catch (error) {
      // 清除进度动画
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      
      console.error('[AIGeneration] Video generation failed:', error);
      
      // 直接更新任务对象的错误状态
      task.error = error instanceof Error ? error.message : '生成失败';
      task.status = 'failed';
      task.progress = 0;
      task.updatedAt = Date.now();
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
    const maxAttempts = 60; // 最多轮询60次
    const interval = 5000; // 每5秒检查一次

    for (let i = 0; i < maxAttempts; i++) {
      // 计算并更新进度
      const progressRange = maxProgress - startProgress;
      const currentProgress = startProgress + (progressRange * (i / maxAttempts));
      this.updateTaskStatus(internalTaskId, 'processing', Math.round(currentProgress));
      
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
   * 轮询视频生成状态（旧方法，保留用于兼容）
   */
  private async pollVideoStatus(taskId: string): Promise<string> {
    return this.pollVideoStatusWithProgress(taskId, '', 40, 90);
  }

  /**
   * 更新任务状态
   */
  private updateTaskStatus(taskId: string, status: GenerationStatus, progress: number): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      task.progress = progress;
      task.updatedAt = Date.now();
      this.notifyTaskUpdate(task);
    }
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task && (task.status === 'pending' || task.status === 'processing')) {
      task.status = 'cancelled';
      task.updatedAt = Date.now();
      this.notifyTaskUpdate(task);
      return true;
    }
    return false;
  }

  /**
   * 删除任务
   */
  deleteTask(taskId: string): boolean {
    return this.tasks.delete(taskId);
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

    // 保存到localStorage
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
}

// 导出服务实例
export const aiGenerationService = new AIGenerationService();
