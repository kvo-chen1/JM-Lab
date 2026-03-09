/**
 * AI生成服务模块
 * 简化版本：直接调用后端代理API，不依赖 Supabase Edge Function
 */

import { llmService } from './llmService';
import { eventSubmissionService } from './eventSubmissionService';
import { aiGenerationSaveService } from './aiGenerationSaveService';
import { toast } from 'sonner';

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

// 活动提交选项
export interface ActivitySubmissionOptions {
  eventId: string;
  userId: string;
  participationId: string;
  title?: string;
  description?: string;
}

// 生成任务（兼容旧版本接口）
export interface GenerationTask {
  id: string;
  type: GenerationType;
  status: GenerationStatus;
  params: ImageGenerationParams | VideoGenerationParams;
  progress: number;
  result?: GenerationResult;
  error?: string;
  errorType?: string;
  createdAt: number;
  updatedAt: number;
  userId?: string;
  startedAt?: string;
  completedAt?: string;
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
 * AI生成服务类 - 简化版本
 * 直接调用后端代理API，无需 Edge Function
 */
class AIGenerationService {
  private historyListeners: Array<(items: GenerationHistoryItem[]) => void> = [];
  private taskListeners: Array<(task: GenerationTask) => void> = [];
  private tasks: Map<string, GenerationTask> = new Map();

  /**
   * 生成图片 - 简化版本，直接调用后端API
   * 返回 GenerationTask 以兼容旧接口
   */
  async generateImage(params: ImageGenerationParams, submissionOptions?: ActivitySubmissionOptions): Promise<GenerationTask> {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const now = Date.now();

    // 创建任务对象
    const task: GenerationTask = {
      id,
      type: 'image',
      status: 'processing',
      params,
      progress: 0,
      createdAt: now,
      updatedAt: now
    };

    this.tasks.set(id, task);
    this.notifyTaskUpdate(task);

    // 启动进度模拟
    const progressInterval = setInterval(() => {
      if (task.progress < 90) {
        task.progress += Math.random() * 15 + 5;
        if (task.progress > 90) task.progress = 90;
        task.updatedAt = Date.now();
        this.notifyTaskUpdate(task);
      }
    }, 1000);

    // 直接调用 llmService 的 generateImage 方法
    try {
      const result = await llmService.generateImage({
        prompt: params.prompt,
        size: params.size || '1024x1024',
        n: params.n || 1,
        model: 'wanx-v1'
      });

      // 停止进度模拟
      clearInterval(progressInterval);

      if (!result.ok || !result.data) {
        throw new Error(result.error || '图片生成失败');
      }

      // 提取图片URL
      const urls = result.data.data?.map((item: any) => item.url) || [];

      if (urls.length === 0) {
        throw new Error('未获取到生成的图片');
      }

      // 更新任务为完成状态
      task.status = 'completed';
      task.progress = 100;
      task.result = { urls };
      task.updatedAt = Date.now();
      task.completedAt = new Date().toISOString();

      this.tasks.set(id, task);
      this.notifyTaskUpdate(task);

      // 添加到历史记录
      this.addToHistory({
        id,
        type: 'image',
        prompt: params.prompt,
        thumbnail: urls[0],
        createdAt: now,
        isFavorite: false,
        tags: []
      });

      // 保存到数据库（所有AI生成都要保存）
      await aiGenerationSaveService.saveImageGeneration(params.prompt, urls[0], {
        source: submissionOptions ? 'activity' : 'ai_generation',
        sourceId: submissionOptions?.eventId,
        metadata: {
          generationId: id,
          type: 'image',
          size: params.size,
          quality: params.quality,
          style: params.style,
          aiGenerated: true
        }
      });

      // 如果提供了活动提交选项，自动提交到活动
      if (submissionOptions) {
        await this.submitToActivity(submissionOptions, urls[0], 'image', params.prompt);
      }

      return task;
    } catch (error) {
      // 停止进度模拟
      clearInterval(progressInterval);

      // 更新任务为失败状态
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : '生成失败';
      task.updatedAt = Date.now();
      task.completedAt = new Date().toISOString();

      this.tasks.set(id, task);
      this.notifyTaskUpdate(task);

      throw error;
    }
  }

  /**
   * 生成视频
   */
  async generateVideo(params: VideoGenerationParams, submissionOptions?: ActivitySubmissionOptions): Promise<GenerationTask> {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const now = Date.now();

    // 创建任务对象
    const task: GenerationTask = {
      id,
      type: 'video',
      status: 'processing',
      params,
      progress: 0,
      createdAt: now,
      updatedAt: now
    };

    this.tasks.set(id, task);
    this.notifyTaskUpdate(task);

    try {
      const result = await llmService.generateVideo({
        prompt: params.prompt,
        imageUrl: params.imageUrl,
        duration: params.duration || 5,
        resolution: params.resolution || '720p',
        aspectRatio: params.aspectRatio || '16:9',
        model: params.model || 'wan2.6-i2v-flash'
      });

      if (!result.ok || !result.data) {
        throw new Error(result.error || '视频生成失败');
      }

      // 轮询获取视频URL
      const qwenTaskId = result.data.task_id || result.data;
      const videoUrl = await this.pollVideoStatus(qwenTaskId);

      // 更新任务为完成状态
      task.status = 'completed';
      task.progress = 100;
      task.result = { urls: [videoUrl] };
      task.updatedAt = Date.now();
      task.completedAt = new Date().toISOString();

      this.tasks.set(id, task);
      this.notifyTaskUpdate(task);

      this.addToHistory({
        id,
        type: 'video',
        prompt: params.prompt,
        thumbnail: videoUrl,
        createdAt: now,
        isFavorite: false,
        tags: []
      });

      // 保存到数据库（所有AI生成都要保存）
      await aiGenerationSaveService.saveVideoGeneration(params.prompt, videoUrl, videoUrl, {
        source: submissionOptions ? 'activity' : 'ai_generation',
        sourceId: submissionOptions?.eventId,
        metadata: {
          generationId: id,
          type: 'video',
          duration: params.duration,
          resolution: params.resolution,
          aspectRatio: params.aspectRatio,
          aiGenerated: true
        }
      });

      // 如果提供了活动提交选项，自动提交到活动
      if (submissionOptions) {
        await this.submitToActivity(submissionOptions, videoUrl, 'video', params.prompt);
      }

      return task;
    } catch (error) {
      // 更新任务为失败状态
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : '生成失败';
      task.updatedAt = Date.now();
      task.completedAt = new Date().toISOString();

      this.tasks.set(id, task);
      this.notifyTaskUpdate(task);

      throw error;
    }
  }

  /**
   * 轮询视频生成状态
   */
  private async pollVideoStatus(taskId: string): Promise<string> {
    const maxAttempts = 60;
    const interval = 5000;

    for (let i = 0; i < maxAttempts; i++) {
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
   * 提交AI生成内容到活动
   */
  private async submitToActivity(
    options: ActivitySubmissionOptions,
    mediaUrl: string,
    type: 'image' | 'video',
    prompt: string
  ): Promise<void> {
    try {
      console.log('[AIGeneration] Submitting to activity:', {
        eventId: options.eventId,
        type,
        mediaUrl: mediaUrl.substring(0, 50) + '...'
      });

      const result = await eventSubmissionService.submitWork(
        options.eventId,
        options.userId,
        options.participationId,
        {
          title: options.title || `AI生成${type === 'image' ? '图片' : '视频'}作品`,
          description: options.description || `使用AI生成的${type === 'image' ? '图片' : '视频'}作品\n提示词: ${prompt}`,
          files: [{
            id: `${Date.now()}_${type}`,
            name: `ai_generated_${type}.${type === 'image' ? 'jpg' : 'mp4'}`,
            url: mediaUrl,
            type: type === 'image' ? 'image/jpeg' : 'video/mp4',
            size: 0,
            thumbnailUrl: type === 'image' ? mediaUrl : undefined
          }],
          metadata: {
            aiGenerated: true,
            prompt,
            generatedAt: new Date().toISOString()
          }
        }
      );

      if (result.success) {
        console.log('[AIGeneration] Successfully submitted to activity:', result.submissionId);
        toast.success(`AI生成${type === 'image' ? '图片' : '视频'}已自动提交到活动`);
      } else {
        console.error('[AIGeneration] Failed to submit to activity:', result.error);
        toast.error(`提交到活动失败: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('[AIGeneration] Error submitting to activity:', error);
      toast.error('提交到活动时发生错误');
    }
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(item: GenerationHistoryItem): void {
    const history = this.getHistory();
    history.unshift(item);

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
   * 获取任务状态
   */
  getTask(taskId: string): GenerationTask | undefined {
    return this.tasks.get(taskId);
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
