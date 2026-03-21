/**
 * 视频生成 Skill
 * 根据文本描述或图像生成视频
 */

import { CreationSkill } from '../base/BaseSkill';
import { UserIntent, ExecutionContext, SkillResult, Capability, AgentType } from '../../types/skill';
import { aiGenerationService } from '@/services/aiGenerationService';

export interface VideoGenerationConfig {
  defaultDuration?: number;
  defaultResolution?: '720p' | '1080p' | '4k';
  defaultAspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
  defaultModel?: string;
}

export class VideoGenerationSkill extends CreationSkill {
  readonly id = 'video-generation';
  readonly name = '视频生成';
  readonly description = '根据文本描述或图像生成视频，支持多种尺寸和时长';
  readonly version = '1.0.0';

  protected supportedAgents: AgentType[] = ['animator', 'designer', 'director'];

  readonly capabilities: Capability[] = [
    {
      id: 'generate-video',
      name: '生成视频',
      description: '根据文本描述生成视频',
      parameters: [
        { name: 'prompt', type: 'string', required: true, description: '视频描述' },
        { name: 'duration', type: 'number', required: false, defaultValue: 5, description: '视频时长（秒）' },
        { name: 'resolution', type: 'string', required: false, defaultValue: '720p', description: '分辨率' },
        { name: 'aspectRatio', type: 'string', required: false, defaultValue: '16:9', description: '宽高比' }
      ]
    },
    {
      id: 'image-to-video',
      name: '图像转视频',
      description: '基于图像生成视频',
      parameters: [
        { name: 'imageUrl', type: 'string', required: true, description: '源图像URL' },
        { name: 'prompt', type: 'string', required: false, description: '动画描述' },
        { name: 'duration', type: 'number', required: false, defaultValue: 5, description: '视频时长（秒）' }
      ]
    }
  ];

  private videoConfig: VideoGenerationConfig;

  constructor(config: VideoGenerationConfig = {}) {
    super();
    this.videoConfig = {
      defaultDuration: 5,
      defaultResolution: '720p',
      defaultAspectRatio: '16:9',
      defaultModel: 'wan2.6-i2v-flash',
      ...config
    };
  }

  /**
   * 检查是否可以处理该意图
   */
  canHandle(intent: UserIntent): boolean {
    const videoKeywords = ['视频', '动画', '动效', '短片', '影片', 'animation', 'video'];
    const hasVideoKeyword = intent.keywords.some(kw =>
      videoKeywords.some(vk => kw.toLowerCase().includes(vk.toLowerCase()))
    );

    const videoIntentTypes = ['video-generation', 'animation-request'];
    const isVideoIntent = videoIntentTypes.includes(intent.type);

    return hasVideoKeyword || isVideoIntent;
  }

  /**
   * 执行视频生成
   */
  protected async doExecute(context: ExecutionContext): Promise<SkillResult> {
    const { parameters } = context;

    // 判断是基于图像生成还是纯文本生成
    if (parameters?.imageUrl) {
      return this.imageToVideo(parameters);
    }

    return this.generateVideo(parameters || {});
  }

  /**
   * 生成视频
   */
  private async generateVideo(params: Record<string, any>): Promise<SkillResult> {
    try {
      const prompt = params.prompt || '';

      console.log('[VideoGenerationSkill] Generating video:', prompt.substring(0, 50) + '...');

      // 调用视频生成服务
      const task = await aiGenerationService.generateVideo({
        prompt,
        duration: params.duration || this.videoConfig.defaultDuration,
        resolution: params.resolution || this.videoConfig.defaultResolution,
        aspectRatio: params.aspectRatio || this.videoConfig.defaultAspectRatio,
        model: this.videoConfig.defaultModel as any
      });

      // 等待任务完成
      const videoUrl = await this.waitForVideoCompletion(task.id);

      return this.createSuccessResult(
        videoUrl,
        'video',
        {
          prompt,
          duration: params.duration || this.videoConfig.defaultDuration,
          resolution: params.resolution || this.videoConfig.defaultResolution,
          taskId: task.id,
          generatedAt: Date.now()
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '视频生成失败';
      console.error('[VideoGenerationSkill] Error:', errorMessage);
      return this.createErrorResult(errorMessage, true);
    }
  }

  /**
   * 图像转视频
   */
  private async imageToVideo(params: Record<string, any>): Promise<SkillResult> {
    try {
      const { imageUrl, prompt = '' } = params;

      console.log('[VideoGenerationSkill] Converting image to video:', imageUrl);

      // 调用图像转视频服务
      const task = await aiGenerationService.generateVideo({
        prompt: prompt || 'Animate this image',
        imageUrl,
        duration: params.duration || this.videoConfig.defaultDuration,
        resolution: params.resolution || this.videoConfig.defaultResolution,
        aspectRatio: params.aspectRatio || this.videoConfig.defaultAspectRatio,
        model: this.videoConfig.defaultModel as any
      });

      // 等待任务完成
      const videoUrl = await this.waitForVideoCompletion(task.id);

      return this.createSuccessResult(
        videoUrl,
        'video',
        {
          imageUrl,
          prompt,
          duration: params.duration || this.videoConfig.defaultDuration,
          taskId: task.id,
          generatedAt: Date.now()
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '图像转视频失败';
      console.error('[VideoGenerationSkill] Image-to-video error:', errorMessage);
      return this.createErrorResult(errorMessage, true);
    }
  }

  /**
   * 等待视频生成完成
   */
  private async waitForVideoCompletion(taskId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const checkTask = () => {
        const updatedTask = aiGenerationService.getTask(taskId);

        if (!updatedTask) {
          reject(new Error('任务不存在'));
          return;
        }

        if (updatedTask.status === 'completed' && updatedTask.result?.urls?.[0]) {
          resolve(updatedTask.result.urls[0]);
        } else if (updatedTask.status === 'failed') {
          reject(new Error(updatedTask.error || '视频生成失败'));
        } else {
          // 继续轮询
          setTimeout(checkTask, 2000);
        }
      };

      // 开始轮询
      checkTask();

      // 设置超时（5分钟）
      setTimeout(() => {
        reject(new Error('视频生成超时，请稍后重试'));
      }, 300000);
    });
  }

  /**
   * 初始化
   */
  protected async onInitialize(): Promise<void> {
    console.log('[VideoGenerationSkill] Initialized with config:', this.videoConfig);
  }
}
