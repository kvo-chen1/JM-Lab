import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, SkillCallInfo, RequirementPhase, Attachment, ThinkingStep } from '../types';
import { PastedImage } from '@/components/ImagePasteInput';
import {
  createChatContext,
  sendMessageStream,
  generateImage
} from '../services/chatService';
import { editImage } from '@/services/imageGenerationService';
import { recognizeIntent, getIntentDisplayName, IntentType, isConfirmationIntent, isRejectionIntent } from '../services/intentService';
import { analyzeRequirements, isRequirementsComplete, detectIntentSwitch, filterVisibleFields, RequirementField, MerchandiseCategory, IntentSwitchInfo } from '../services/requirementService';
import { uploadPastedImages } from '../services/imageUploadService';
import { performWebSearch, formatSearchResults, buildSearchContext } from '../services/webSearchService';
import {
  taskFlowManager,
  parseComplexTask,
  createDesignTaskFlow,
  extractBrandNameFromMessage,
  detectCompoundTask,
  type TaskFlow,
  type TaskProgress,
} from '../services/taskOrchestrationService';
import { toast } from 'sonner';

// 多轮对话状态
interface ConversationState {
  intent?: IntentType;
  collectedInfo: Record<string, string>;
  missingFields: RequirementField[];
  phase: RequirementPhase;
  pendingIntent?: IntentType;
  intentSwitch?: IntentSwitchInfo;
  // 新增：保存上下文引用
  lastImageAttachment?: {
    url: string;
    type: string;
    title?: string;
  };
  lastTextAttachment?: {
    content: string;
    title?: string;
  };
  // 新增：保存上一次执行的结果，用于多Skill联动
  lastExecutionResult?: {
    intent: IntentType;
    content: string;
    attachments?: Attachment[];
  };
  // 新增：设计上下文 - 保存设计元素用于后续引用
  designContext?: {
    brandName?: string;
    colors?: string[];
    style?: string;
    logoUrl?: string;
    lastPrompt?: string;
    lastOutputUrl?: string;
  };
  // 新增：当前任务流
  currentTaskFlow?: {
    flowId: string;
    name: string;
  };
}

// 进度预估
interface ProgressEstimate {
  currentStep: number;
  totalSteps: number;
  estimatedTime: number;
  isBlocked: boolean;
  blockReason?: string;
}

// 草稿保存键名
const DRAFT_STORAGE_KEY = 'skill-chat-draft';
const EXECUTION_PROGRESS_KEY = 'skill-chat-execution-progress';

interface ExecutionProgress {
  flowId: string;
  currentStageIndex: number;
  completedStages: number[];
  stageStatuses: Record<string, 'pending' | 'running' | 'completed' | 'failed'>;
  savedAt: number;
}

// 保存草稿到 localStorage
const saveDraft = (state: ConversationState, messages: ChatMessage[]) => {
  try {
    const draft = {
      state,
      messages: messages.slice(-20),
      savedAt: Date.now(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.warn('[useSkillChat] 保存草稿失败:', error);
  }
};

// 从 localStorage 恢复草稿
const restoreDraft = (): { state: ConversationState; messages: ChatMessage[] } | null => {
  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      const draft = JSON.parse(saved);
      const state: ConversationState = {
        ...draft.state,
        phase: draft.state.phase || 'collecting',
      };
      return { state, messages: draft.messages };
    }
  } catch (error) {
    console.warn('[useSkillChat] 恢复草稿失败:', error);
  }
  return null;
};

// 清除草稿
const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    localStorage.removeItem(EXECUTION_PROGRESS_KEY);
  } catch (error) {
    console.warn('[useSkillChat] 清除草稿失败:', error);
  }
};

// 保存执行进度
const saveExecutionProgress = (flow: TaskFlow) => {
  try {
    const stageStatuses: Record<string, 'pending' | 'running' | 'completed' | 'failed'> = {};
    flow.stages.forEach(stage => {
      stageStatuses[stage.id] = stage.status;
    });

    const progress: ExecutionProgress = {
      flowId: flow.id,
      currentStageIndex: flow.currentStageIndex,
      completedStages: flow.stages
        .map((s, i) => s.status === 'completed' ? i : -1)
        .filter(i => i !== -1),
      stageStatuses,
      savedAt: Date.now(),
    };

    localStorage.setItem(EXECUTION_PROGRESS_KEY, JSON.stringify(progress));
    console.log('[useSkillChat] 执行进度已保存:', progress);
  } catch (error) {
    console.warn('[useSkillChat] 保存执行进度失败:', error);
  }
};

// 恢复执行进度
const restoreExecutionProgress = (): ExecutionProgress | null => {
  try {
    const saved = localStorage.getItem(EXECUTION_PROGRESS_KEY);
    if (saved) {
      const progress: ExecutionProgress = JSON.parse(saved);

      // 检查是否过期（超过1小时）
      if (Date.now() - progress.savedAt > 60 * 60 * 1000) {
        console.log('[useSkillChat] 执行进度已过期');
        localStorage.removeItem(EXECUTION_PROGRESS_KEY);
        return null;
      }

      return progress;
    }
  } catch (error) {
    console.warn('[useSkillChat] 恢复执行进度失败:', error);
  }
  return null;
};

// 清除执行进度
const clearExecutionProgress = () => {
  try {
    localStorage.removeItem(EXECUTION_PROGRESS_KEY);
  } catch (error) {
    console.warn('[useSkillChat] 清除执行进度失败:', error);
  }
};

// 计算进度预估
const calculateProgressEstimate = (
  intent: IntentType,
  collectedInfo: Record<string, string>,
  missingFields: RequirementField[]
): ProgressEstimate => {
  const requirements = filterVisibleFields(
    missingFields.concat(Object.keys(collectedInfo).map(key => ({ key, required: true } as RequirementField))),
    collectedInfo
  );

  const visibleRequired = requirements.filter(r => r.required);
  const currentStep = Object.keys(collectedInfo).filter(key =>
    visibleRequired.some(r => r.key === key) && collectedInfo[key]?.trim()
  ).length;
  const totalSteps = visibleRequired.length;
  const estimatedTime = (totalSteps - currentStep) * 15;
  const lastField = missingFields[0];
  const isBlocked = currentStep === 0 && totalSteps > 0 && !lastField;
  const blockReason = isBlocked ? '需要更多信息才能继续' : undefined;

  return {
    currentStep,
    totalSteps,
    estimatedTime,
    isBlocked,
    blockReason,
  };
};

// 生成意图识别思考步骤
const generateIntentRecognitionSteps = (
  userMessage: string,
  intentResult: { intent: IntentType; confidence: number; reasoning: string; reasoningSteps?: string[] }
): ThinkingStep[] => {
  const steps: ThinkingStep[] = [
    {
      id: `intent-1-${Date.now()}`,
      type: 'intent-recognition',
      status: 'completed',
      title: '正在分析用户输入',
      content: `"${userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage}"`,
      timestamp: Date.now(),
    },
  ];

  if (intentResult.reasoningSteps && intentResult.reasoningSteps.length > 0) {
    intentResult.reasoningSteps.forEach((step, index) => {
      steps.push({
        id: `intent-2-${Date.now()}-${index}`,
        type: 'intent-recognition',
        status: 'completed',
        title: `识别步骤 ${index + 1}`,
        content: step,
        timestamp: Date.now(),
      });
    });
  }

  steps.push({
    id: `intent-3-${Date.now()}`,
    type: 'intent-recognition',
    status: 'completed',
    title: '意图识别结果',
    content: `${getIntentDisplayName(intentResult.intent)}（置信度 ${Math.round(intentResult.confidence * 100)}%）`,
    details: {
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      reasoning: intentResult.reasoning,
    },
    timestamp: Date.now(),
  });

  return steps;
};

// 生成需求分析思考步骤
const generateRequirementAnalysisSteps = (
  collectedInfo: Record<string, string>,
  missingFields: RequirementField[],
  analysisDetails?: Array<{ field: string; label: string; value?: string; source: string; reasoning?: string }>
): ThinkingStep[] => {
  const steps: ThinkingStep[] = [];

  if (Object.keys(collectedInfo).length > 0) {
    steps.push({
      id: `req-1-${Date.now()}`,
      type: 'requirement-analysis',
      status: 'completed',
      title: '已提取的信息',
      content: `从用户消息中成功提取了 ${Object.keys(collectedInfo).length} 项信息`,
      details: collectedInfo,
      timestamp: Date.now(),
    });
  }

  if (analysisDetails && analysisDetails.length > 0) {
    const collectedDetails = analysisDetails.filter(d => d.value && d.value.trim());
    const missingDetails = analysisDetails.filter(d => !d.value || !d.value.trim());

    if (collectedDetails.length > 0) {
      collectedDetails.forEach((detail, index) => {
        const sourceText = detail.source === 'explicit' ? '用户明确说的' : detail.source === 'inferred' ? 'AI推断的' : '从上下文导入的';
        steps.push({
          id: `req-2-${Date.now()}-${index}`,
          type: 'info-collection',
          status: 'completed',
          title: `提取: ${detail.label}`,
          content: `${detail.value}${detail.reasoning ? `\n💭 ${detail.reasoning}` : ''}`,
          details: { source: sourceText, confidence: detail.source },
          timestamp: Date.now(),
        });
      });
    }

    if (missingDetails.length > 0) {
      steps.push({
        id: `req-3-${Date.now()}`,
        type: 'info-collection',
        status: 'completed',
        title: '待补充信息',
        content: `还需要补充 ${missingDetails.length} 项信息才能完成任务`,
        timestamp: Date.now(),
      });

      missingDetails.slice(0, 3).forEach((detail, index) => {
        steps.push({
          id: `req-4-${Date.now()}-${index}`,
          type: 'info-collection',
          status: 'completed',
          title: `待补充: ${detail.label}`,
          content: detail.reasoning || '请提供此信息',
          timestamp: Date.now(),
        });
      });
    }
  } else if (missingFields.length > 0) {
    steps.push({
      id: `req-5-${Date.now()}`,
      type: 'requirement-analysis',
      status: 'completed',
      title: '需求分析完成',
      content: `已了解您的需求，还需补充 ${missingFields.length} 项信息`,
      timestamp: Date.now(),
    });
  }

  return steps;
};

// 生成技能执行思考步骤
const generateSkillExecutionSteps = (
  intent: IntentType,
  collectedInfo: Record<string, string>
): ThinkingStep[] => {
  return [
    {
      id: `exec-1-${Date.now()}`,
      type: 'skill-execution',
      status: 'processing',
      title: '开始执行技能',
      content: `正在为您进行${getIntentDisplayName(intent)}...`,
      timestamp: Date.now(),
    },
    {
      id: `exec-2-${Date.now()}`,
      type: 'skill-execution',
      status: 'completed',
      title: '使用的信息',
      content: Object.keys(collectedInfo).length > 0
        ? Object.entries(collectedInfo).map(([k, v]) => `${k}: ${v}`).join('\n')
        : '使用默认参数',
      timestamp: Date.now(),
    },
  ];
};

// 错误信息映射 - 将技术错误转换为用户友好的提示
const ERROR_MESSAGES: Record<string, string> = {
  '图片生成失败：返回 URL 为空': '图片生成遇到了问题，可能是描述太复杂或网络不稳定',
  '图片生成失败': '生成图片时出错了，请稍后重试或简化描述',
  '请求已取消': '操作已取消',
  '网络错误': '网络连接不稳定，请检查网络后重试',
  'timeout': '生成时间过长，请稍后重试或简化需求',
  '未知错误': '发生了意外错误，请稍后重试',
};

// 错误恢复建议
const ERROR_RECOVERY: Record<string, string[]> = {
  'image-generation': [
    '简化描述，突出重点',
    '尝试不同的关键词',
    '分步骤描述需求',
  ],
  'logo-design': [
    '提供更具体的品牌信息',
    '描述想要的风格（如简约、科技感）',
    '说明目标受众',
  ],
  'poster-design': [
    '明确海报用途（宣传、促销、活动）',
    '提供关键文案内容',
    '描述期望的视觉风格',
  ],
  'text-generation': [
    '明确文案用途',
    '提供核心卖点或关键信息',
    '说明目标读者群体',
  ],
  'batch-generation': [
    '减少批量生成的数量',
    '简化每个项目的要求',
    '分批次进行生成',
  ],
};

// 获取用户友好的错误信息
const getUserFriendlyError = (error: Error | string, intent?: string): { message: string; suggestions: string[] } => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // 查找匹配的错误映射
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.includes(key)) {
      return {
        message: value,
        suggestions: intent ? ERROR_RECOVERY[intent] || [] : [],
      };
    }
  }
  
  // 默认错误处理
  return {
    message: errorMessage || '操作失败，请稍后重试',
    suggestions: intent ? ERROR_RECOVERY[intent] || [] : [],
  };
};

// 增强版批量物品解析（保留原函数作为降级方案）
const extractBatchItemsEnhanced = (
  message: string,
  previousImageUrl?: string
): string[] => {
  // 优先使用任务编排服务的解析结果
  const parsed = parseComplexTask(message, {
    previousImageUrl,
  });

  if (parsed.tasks.length > 0) {
    return parsed.tasks.map(t => t.name);
  }

  // 降级：使用原有逻辑
  return extractBatchItems(message);
};

// 任务进度回调类型
interface TaskProgressCallback {
  onMessage: (message: string) => void;
  onAttachment?: (attachment: Attachment) => void;
  onSubStep?: (stageIndex: number, subStepIndex: number, subStepName: string, status: 'running' | 'completed') => void;
  onStageComplete?: (stageIndex: number, stageName: string) => void;
}

// 模拟子步骤进度（用于提供更好的用户体验）
const simulateSubSteps = async (
  skill: IntentType,
  onSubStep: (index: number, name: string, status: 'running' | 'completed') => void,
  totalDuration: number = 3000
): Promise<void> => {
  const { getSubStepsForSkill } = await import('../services/taskOrchestrationService');
  const subSteps = getSubStepsForSkill(skill);
  const stepDuration = totalDuration / subSteps.length;

  for (let i = 0; i < subSteps.length; i++) {
    // 开始子步骤
    onSubStep(i, subSteps[i], 'running');

    // 模拟执行时间
    await new Promise(resolve => setTimeout(resolve, stepDuration * 0.7));

    // 完成子步骤
    onSubStep(i, subSteps[i], 'completed');

    // 短暂停顿
    await new Promise(resolve => setTimeout(resolve, stepDuration * 0.3));
  }
};

// 执行任务流（带进度跟踪，支持渐进式展示）
const executeTaskFlowWithProgress = async (
  flow: TaskFlow,
  previousImageUrl: string | undefined,
  callbacks: TaskProgressCallback
): Promise<{ content: string; attachments: Attachment[] }> => {
  const { onMessage, onAttachment, onSubStep, onStageComplete } = callbacks;
  console.log('[executeTaskFlow] 开始执行任务流:', flow.name);

  // 启动任务流
  taskFlowManager.startFlow(flow.id);

  // 获取子步骤配置
  const { getSubStepsForSkill } = await import('../services/taskOrchestrationService');

  // 发送初始进度消息
  const initialMessage = `🚀 **开始批量生成**\n\n共 ${flow.stages.length} 个任务，正在逐个生成...\n\n` +
    flow.stages.map((s, i) => `${i + 1}. ⏳ ${s.name}`).join('\n');
  onMessage(initialMessage);

  const allAttachments: Attachment[] = [];
  const failedTasks: Array<{ name: string; error: string }> = [];

  // 追踪每个任务的子步骤状态
  const stageSubSteps: Map<number, Array<{ name: string; status: 'pending' | 'running' | 'completed' }>> = new Map();

  try {
    for (let i = 0; i < flow.stages.length; i++) {
      // 检查是否已取消
      if (taskFlowManager.isCancelled(flow.id)) {
        return {
          content: `❌ **任务已取消**\n\n已生成 ${allAttachments.length} 个设计`,
          attachments: allAttachments,
        };
      }

      const stage = flow.stages[i];
      const subSteps = getSubStepsForSkill(stage.skill).map(name => ({ name, status: 'pending' as const }));
      stageSubSteps.set(i, subSteps);

      // 更新阶段状态
      taskFlowManager.updateStage(flow.id, stage.id, {
        status: 'running',
        startTime: Date.now(),
        progress: 0,
      });

      console.log(`[executeTaskFlow] 执行阶段 ${i + 1}/${flow.stages.length}: ${stage.name}`);

      // 发送带进度条的当前进度更新
      const progressPercent = Math.round((i / flow.stages.length) * 100);
      const progressBar = '█'.repeat(Math.round(progressPercent / 5)) + '░'.repeat(20 - Math.round(progressPercent / 5));

      const generateProgressMessage = () => {
        let message = `🚀 **批量生成进行中** (${i + 1}/${flow.stages.length})\n\n`;
        message += `[${progressBar}] ${progressPercent}%\n\n`;
        message += `🔄 正在生成：${stage.name}\n\n`;

        // 显示子步骤进度
        subSteps.forEach((step, idx) => {
          const icon = step.status === 'completed' ? '✓' : step.status === 'running' ? '⟳' : '○';
          message += `    ${icon} ${step.name}${step.status === 'running' ? '...' : step.status === 'completed' ? '' : ''}\n`;
        });

        message += '\n';

        // 显示任务列表
        flow.stages.forEach((s, idx) => {
          if (idx < i) message += `${idx + 1}. ✅ ${s.name}\n`;
          else if (idx === i) message += `${idx + 1}. 🔄 ${s.name}...\n`;
          else message += `${idx + 1}. ⏳ ${s.name}\n`;
        });

        return message;
      };

      onMessage(generateProgressMessage());

      try {
        // 并行执行：子步骤模拟 + 实际任务执行
        const subStepPromise = simulateSubSteps(
          stage.skill,
          (subIdx, subName, subStatus) => {
            subSteps[subIdx].status = subStatus;
            onSubStep?.(i, subIdx, subName, subStatus);
            onMessage(generateProgressMessage());
          },
          4000 // 4秒子步骤动画
        );

        const taskPromise = executeStageTask(stage, previousImageUrl, (progress) => {
          taskFlowManager.updateStage(flow.id, stage.id, { progress });
        });

        // 等待两者完成
        const [, result] = await Promise.all([subStepPromise, taskPromise]);

        // 保存输出
        taskFlowManager.updateStage(flow.id, stage.id, {
          status: 'completed',
          output: {
            content: result.content,
            imageUrl: result.imageUrl,
            attachments: result.attachments,
          },
          progress: 100,
          endTime: Date.now(),
        });

        // 收集附件并立即通知
        if (result.attachments) {
          for (const attachment of result.attachments) {
            allAttachments.push(attachment);
            // 立即通知新附件
            onAttachment?.(attachment);
          }
        }

        // 将当前输出作为下一个阶段的输入参考
        if (result.imageUrl) {
          previousImageUrl = result.imageUrl;
        }

        onStageComplete?.(i, stage.name);

        // 发送完成该任务的消息
        const completedProgressPercent = Math.round(((i + 1) / flow.stages.length) * 100);
        const completedProgressBar = '█'.repeat(Math.round(completedProgressPercent / 5)) + '░'.repeat(20 - Math.round(completedProgressPercent / 5));

        const completedMessage = `✅ **${stage.name} 完成！** (${i + 1}/${flow.stages.length})\n\n` +
          `[${completedProgressBar}] ${completedProgressPercent}%\n\n` +
          flow.stages.map((s, idx) => {
            if (idx <= i) return `${idx + 1}. ✅ ${s.name}`;
            return `${idx + 1}. ⏳ ${s.name}`;
          }).join('\n');
        onMessage(completedMessage);

      } catch (error) {
        console.error(`[executeTaskFlow] 阶段 ${stage.name} 执行失败:`, error);
        taskFlowManager.updateStage(flow.id, stage.id, {
          status: 'failed',
          error: error instanceof Error ? error.message : '未知错误',
          endTime: Date.now(),
        });
        failedTasks.push({
          name: stage.name,
          error: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    // 生成最终消息
    let finalMessage = `✅ **${flow.name}完成！**\n\n`;

    if (flow.stages.length > 0) {
      finalMessage += `共 ${flow.stages.length} 个任务：\n`;
      flow.stages.forEach((stage, idx) => {
        const statusEmoji = stage.status === 'completed' ? '✅' : stage.status === 'failed' ? '❌' : '⏳';
        finalMessage += `${idx + 1}. ${statusEmoji} ${stage.name}`;
        if (stage.status === 'failed' && stage.error) {
          finalMessage += ` - ${stage.error}`;
        }
        finalMessage += '\n';
      });
    }

    if (allAttachments.length > 0) {
      finalMessage += `\n📦 共生成 ${allAttachments.length} 个设计`;
    }

    if (failedTasks.length > 0) {
      finalMessage += `\n❌ 失败 ${failedTasks.length} 个任务`;
    }

    return {
      content: finalMessage,
      attachments: allAttachments,
    };

  } finally {
    // 取消订阅
  }
};

// 带重试机制的图片生成
const generateImageWithRetry = async (
  prompt: string,
  maxRetries: number = 2
): Promise<string> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[generateImageWithRetry] 第 ${attempt + 1} 次重试...`);
        // 重试前等待一段时间（指数退避）
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }

      const imageUrl = await generateImage(prompt);
      return imageUrl;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('未知错误');
      console.error(`[generateImageWithRetry] 第 ${attempt + 1} 次尝试失败:`, lastError.message);

      if (attempt === maxRetries) {
        throw new Error(`图片生成失败（已重试 ${maxRetries} 次）：${lastError.message}`);
      }
    }
  }

  throw lastError || new Error('图片生成失败');
};

// 执行单个阶段任务
const executeStageTask = async (
  stage: { name: string; skill: IntentType; input: Record<string, any> },
  previousImageUrl: string | undefined,
  onProgress: (progress: number) => void
): Promise<{ content?: string; imageUrl?: string; attachments?: Attachment[] }> => {
  const { skill, input } = stage;

  onProgress(10);

  switch (skill) {
    case 'logo-design':
    case 'poster-design':
    case 'image-generation': {
      // 构建生成提示词
      const prompt = buildGenerationPrompt(input.prompt, input.brandName, input.style, previousImageUrl, stage.skill);
      onProgress(30);

      // 使用带重试机制的图片生成
      const imageUrl = await generateImageWithRetry(prompt, 2);
      onProgress(90);

      const attachment: Attachment = {
        id: `img_${Date.now()}`,
        type: 'image',
        url: imageUrl,
        thumbnailUrl: imageUrl,
        title: stage.name,
        status: 'completed',
      };

      return {
        content: `✅ ${stage.name}完成`,
        imageUrl,
        attachments: [attachment],
      };
    }

    case 'color-scheme': {
      // 配色方案返回文本
      return {
        content: `🎨 **配色方案建议**\n\n主色：#2563EB（蓝色系）\n辅色：#10B981（绿色系）\n强调色：#F59E0B（橙色）`,
        attachments: [],
      };
    }

    case 'brand-copy':
    case 'marketing-copy':
    case 'social-copy':
    case 'video-script':
    case 'text-generation': {
      // 文本生成 - 调用LLM服务
      onProgress(30);

      // 构建文本生成提示词
      let textPrompt = input.prompt;
      if (input.brandName) {
        textPrompt = `为品牌"${input.brandName}"生成${stage.name}：${textPrompt}`;
      }

      // 添加风格要求
      if (input.style) {
        textPrompt += `\n\n风格要求：${input.style}`;
      }

      // 添加任务类型特定的要求
      const taskRequirements: Record<string, string> = {
        'brand-copy': '要求：富有感染力，突出品牌特色，适合品牌传播',
        'marketing-copy': '要求：具有营销转化力，突出产品卖点，吸引目标客户',
        'social-copy': '要求：符合社交媒体传播特点，有互动性，易于传播',
        'video-script': '要求：有画面感，节奏流畅，适合视频拍摄',
        'text-generation': '要求：内容完整，表达清晰，符合场景需求',
      };

      const requirement = taskRequirements[skill] || taskRequirements['text-generation'];
      textPrompt += `\n\n${requirement}`;

      onProgress(60);

      try {
        // 调用文本生成服务
        const { callQwenChat } = await import('@/services/llm/chatProviders');
        const response = await callQwenChat([
          {
            role: 'system',
            content: '你是一位专业的文案策划师，擅长撰写各类品牌文案、营销文案和创意内容。请根据要求生成高质量的文案。',
          },
          {
            role: 'user',
            content: textPrompt,
          },
        ]);

        onProgress(90);

        const generatedText = response.choices[0]?.message?.content || '文案生成失败';

        return {
          content: `📝 **${stage.name}**\n\n${generatedText}`,
          attachments: [],
        };
      } catch (error) {
        console.error('[executeStageTask] 文本生成失败:', error);
        return {
          content: `❌ **${stage.name}生成失败**\n\n${error instanceof Error ? error.message : '未知错误'}`,
          attachments: [],
        };
      }
    }

    default: {
      // 默认当作图片生成处理
      const prompt = buildGenerationPrompt(input.prompt, input.brandName, input.style, previousImageUrl, stage.skill);
      // 使用带重试机制的图片生成
      const imageUrl = await generateImageWithRetry(prompt, 2);

      return {
        imageUrl,
        attachments: [{
          id: `img_${Date.now()}`,
          type: 'image',
          url: imageUrl,
          thumbnailUrl: imageUrl,
          title: stage.name,
          status: 'completed',
        }],
      };
    }
  }
};

// 构建生成提示词
const buildGenerationPrompt = (
  basePrompt: string,
  brandName?: string,
  style?: string,
  referenceImageUrl?: string,
  taskType?: string
): string => {
  let prompt = basePrompt;

  // 添加品牌名
  if (brandName) {
    prompt = `${brandName}品牌，${prompt}`;
  }

  // 添加风格
  if (style) {
    prompt = `${prompt}，风格：${style}`;
  }

  // 添加参考图
  if (referenceImageUrl) {
    prompt = `${prompt}，参考风格：${referenceImageUrl}`;
  }

  // 根据任务类型添加质量增强提示词
  const qualityEnhancements: Record<string, string> = {
    'logo-design': '，专业Logo设计，矢量风格，简洁现代，高辨识度，白色背景，4K高清',
    'poster-design': '，海报设计，视觉冲击力，排版精美，色彩和谐，印刷品质，4K高清',
    'color-scheme': '，配色方案展示，色彩和谐，专业设计，色值标注，4K高清',
    'image-generation': '，插画设计，细节丰富，色彩饱满，艺术感强，4K高清',
    'ui-design': '，UI界面设计，现代简约，用户体验友好，高保真，4K高清',
    'illustration': '，商业插画，创意独特，色彩丰富，细节精致，4K高清',
    'default': '，专业设计，高品质，细节精致，4K高清',
  };

  const enhancement = qualityEnhancements[taskType || 'default'] || qualityEnhancements['default'];
  prompt = `${prompt}${enhancement}`;

  return prompt;
};

// 执行批量生成（带进度）
const executeBatchGeneration = async (
  items: string[],
  originalMessage: string,
  previousImageUrl: string | undefined,
  onDelta: (message: string) => void,
  isCancelled?: () => boolean
): Promise<{ content: string; attachments: Attachment[] }> => {
  console.log('[executeBatchGeneration] 开始批量生成:', items);

  onDelta(`📦 **批量生成**\n\n正在为您生成 ${items.length} 个设计...\n\n目标：${items.join('、')}`);

  const results: Array<{ item: string; url?: string; content?: string; error?: string }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // 检查是否已取消
    if (isCancelled?.()) {
      break;
    }

    const progress = Math.round(((i + 0.5) / items.length) * 100);
    onDelta(`📦 **批量生成**\n\n正在生成 ${i + 1}/${items.length}：${item}...\n\n进度：${progress}%`);

    try {
      const itemPrompt = `${item}，${originalMessage.replace(/一套|一组|多个|批量|全套|所有的/g, '')}`;
      const imageUrl = await generateImage(itemPrompt);
      results.push({ item, url: imageUrl });
    } catch (error) {
      results.push({ item, error: error instanceof Error ? error.message : '生成失败' });
    }
  }

  // 生成结果
  const successResults = results.filter(r => r.url);
  const failedResults = results.filter(r => r.error);

  const attachments = successResults.map((r, idx) => ({
    id: `img_batch_${Date.now()}_${idx}`,
    type: 'image' as const,
    url: r.url!,
    thumbnailUrl: r.url!,
    title: r.item,
    status: 'completed' as const,
  }));

  let message = `✅ **批量生成完成！**\n\n成功生成 ${successResults.length}/${items.length} 个设计：\n\n`;
  successResults.forEach((r, idx) => {
    message += `${idx + 1}. ${r.item} ✅\n`;
  });

  if (failedResults.length > 0) {
    message += `\n❌ 生成失败 ${failedResults.length} 个：\n`;
    failedResults.forEach((r, idx) => {
      message += `${idx + 1}. ${r.item}：${r.error}\n`;
    });
  }

  return {
    content: message,
    attachments,
  };
};

// 解析批量生成的物品列表
const extractBatchItems = (message: string): string[] => {
  const items: string[] = [];

  // VI系统物料列表
  const viItems = ['名片', '信纸', '信封', '文件夹', '工牌', '胸牌', '马克杯', '笔记本', '帆布袋', 'T恤', '帽子', '包装盒', '手提袋', '贴纸', '标签'];

  // 检测VI系统批量生成
  if (message.includes('VI') || message.includes('vi') || message.includes('VIs')) {
    const viKeywords = ['系统', '整套', '全套', '一套'];
    if (viKeywords.some(k => message.includes(k))) {
      // 检查是否指定了具体物料
      for (const item of viItems) {
        if (message.includes(item)) {
          items.push(item);
        }
      }
      // 如果没有指定具体物料，返回常用物料
      if (items.length === 0) {
        return ['名片', '信纸', '工牌'];
      }
    }
  }

  // 检测多平台文案批量生成
  const platforms = ['朋友圈', '微博', '小红书', '抖音', 'B站', '知乎', '微信'];
  const mentionedPlatforms = platforms.filter(p => message.includes(p));
  if (mentionedPlatforms.length > 1) {
    return mentionedPlatforms.map(p => `${p}文案`);
  }

  // 检测多个物品罗列（如：海报、名片、信纸）
  const separators = /、|,|和|与|及/;
  const parts = message.split(separators);
  for (const part of parts) {
    const trimmed = part.trim();
    // 排除数量词和连接词
    if (/^一|^二|^三|^几|^多个|套|组|系列|批量|^全套$/.test(trimmed)) continue;
    if (trimmed.length >= 2 && trimmed.length <= 10) {
      items.push(trimmed);
    }
  }

  return items;
};

export const useSkillChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const draft = restoreDraft();
    if (draft) {
      console.log('[useSkillChat] 已恢复草稿');
      return draft.messages;
    }
    return [];
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSkillCall, setCurrentSkillCall] = useState<SkillCallInfo | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageIdRef = useRef(0);

  // 多轮对话状态
  const conversationStateRef = useRef<ConversationState | null>(null);

  const generateMessageId = () => `msg_${++messageIdRef.current}`;

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const updateLastMessage = useCallback((updates: Partial<ChatMessage>) => {
    setMessages((prev) => {
      if (prev.length === 0) {
        console.warn('[updateLastMessage] 消息列表为空，无法更新');
        return prev;
      }
      const lastIndex = prev.length - 1;
      const lastMessage = prev[lastIndex];
      
      // 只允许更新 agent 角色的消息
      if (lastMessage.role !== 'agent') {
        console.warn('[updateLastMessage] 最后一条消息不是 agent 消息，角色:', lastMessage.role);
        // 如果不是 agent 消息，添加一条新的 agent 消息
        const newAgentMessage: ChatMessage = {
          role: 'agent',
          content: '',
          timestamp: Date.now(),
          id: generateMessageId(),
          ...updates,
        };
        return [...prev, newAgentMessage];
      }
      
      return [
        ...prev.slice(0, lastIndex),
        { ...lastMessage, ...updates },
      ];
    });
  }, []);

  // 根据消息 ID 更新消息
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) => {
      const messageIndex = prev.findIndex(m => m.id === messageId);
      if (messageIndex === -1) {
        console.warn('[updateMessage] 未找到消息 ID:', messageId);
        return prev;
      }
      
      return [
        ...prev.slice(0, messageIndex),
        { ...prev[messageIndex], ...updates },
        ...prev.slice(messageIndex + 1),
      ];
    });
  }, []);

  // 执行技能
  const executeSkill = async (
    intent: IntentType,
    userMessage: string,
    collectedInfo: Record<string, string>,
    onDelta: (content: string) => void,
    onAttachment?: (attachment: Attachment) => void
  ): Promise<{ content: string; attachments?: ChatMessage['attachments'] }> => {
    const context = createChatContext(messages);
    
    // 构建完整的提示词
    const fullPrompt = Object.keys(collectedInfo).length > 0
      ? `${userMessage}\n\n【已收集的信息】\n${Object.entries(collectedInfo).map(([k, v]) => `${k}: ${v}`).join('\n')}`
      : userMessage;
    
    switch (intent) {
      case 'image-generation':
      case 'logo-design':
      case 'poster-design': {
        try {
          console.log('[executeSkill] 开始生成图片，intent:', intent);
          console.log('[executeSkill] fullPrompt:', fullPrompt);
          
          // 先发送思考中的消息
          const thinkingContent = `🎨 **${getIntentDisplayName(intent)}**\n\n正在根据您的需求生成图片...\n\n${Object.entries(collectedInfo).map(([k, v]) => `• ${k}: ${v}`).join('\n')}`;
          onDelta(thinkingContent);
          
          // 调用图片生成
          const imageUrl = await generateImage(fullPrompt);
          console.log('[executeSkill] 图片 URL:', imageUrl);
          
          if (!imageUrl) {
            throw new Error('图片生成失败：返回 URL 为空');
          }
          
          // 生成描述文字
          let description = '';
          await sendMessageStream(
            `请为这张图片写一段简短的描述，说明这是根据以下需求生成的：${fullPrompt}`,
            context,
            (delta) => {
              description += delta;
            },
            abortControllerRef.current?.signal
          );
          
          const attachment = {
            id: `img_${Date.now()}`,
            type: 'image' as const,
            url: imageUrl,
            thumbnailUrl: imageUrl,
            title: getIntentDisplayName(intent),
            status: 'completed' as const,
          };
          
          console.log('[executeSkill] 返回 attachment:', attachment);
          
          return {
            content: `✅ **${getIntentDisplayName(intent)}完成**\n\n${description}`,
            attachments: [attachment],
          };
        } catch (error) {
          console.error('[executeSkill] 图片生成失败:', error);
          return {
            content: `❌ **${getIntentDisplayName(intent)}失败**\n\n${error instanceof Error ? error.message : '未知错误'}`,
            attachments: [],
          };
        }
      }

      case 'text-generation':
      case 'brand-copy':
      case 'marketing-copy':
      case 'social-copy':
      case 'color-scheme':
      case 'creative-idea': {
        let generatedContent = '';
        
        // 构建增强的提示词，要求返回格式化的 Markdown 内容
        const enhancedPrompt = `${fullPrompt}

请使用 Markdown 格式返回内容，包括：
- 使用 ## 或 ### 作为标题
- 使用 **粗体** 强调重点
- 使用 - 或 1. 2. 3. 组织列表
- 适当分段，让内容更易读`;
        
        await sendMessageStream(
          enhancedPrompt,
          context,
          (delta) => {
            generatedContent += delta;
            onDelta(generatedContent);
          },
          abortControllerRef.current?.signal
        );

        // 确保内容有适当的标题
        let formattedContent = generatedContent;
        const intentDisplayName = getIntentDisplayName(intent);
        
        // 如果内容没有以 # 开头，添加一个标题
        if (!formattedContent.trim().startsWith('#')) {
          formattedContent = `## ${intentDisplayName}\n\n${formattedContent}`;
        }

        // 将生成的文案作为文本附件返回，以便在画布上显示
        const attachment = {
          type: 'text' as const,
          content: formattedContent,
          title: intentDisplayName,
        };

        return {
          content: formattedContent,
          attachments: [attachment],
        };
      }

      case 'greeting': {
        return {
          content: '你好！我是津小脉 Skill Agent，很高兴为你服务。😊\n\n我可以帮助你完成以下任务：\n\n🎨 **图片生成** - Logo设计、海报设计、创意图片\n📝 **文案创作** - 品牌文案、营销文案、社媒内容\n🎨 **配色方案** - 品牌配色、设计配色建议\n💡 **创意点子** - 营销创意、活动方案\n\n请告诉我你需要什么帮助？',
        };
      }

      case 'web-search': {
        try {
          // 1. 显示搜索中的状态
          onDelta(`🔍 **正在搜索**\n\n正在搜索："${userMessage}"...`);

          // 2. 调用联网搜索服务
          const searchResponse = await performWebSearch(userMessage, {
            limit: 5,
            includeAnswer: true,
            signal: abortControllerRef.current?.signal,
          });

          console.log('[executeSkill] 搜索结果:', searchResponse);

          // 3. 如果有搜索结果，使用 LLM 生成基于搜索结果的回答
          if (searchResponse.results.length > 0) {
            const searchContext = buildSearchContext(searchResponse);

            // 构建提示词
            const prompt = `基于以下搜索结果，回答用户的问题："${userMessage}"\n\n${searchContext}\n\n请综合以上信息，提供一个全面、准确的回答。在回答中适当标注信息来源。`;

            let content = '';
            await sendMessageStream(
              prompt,
              context,
              (delta) => {
                content += delta;
                onDelta(content);
              },
              abortControllerRef.current?.signal
            );

            return { content };
          } else {
            // 没有搜索结果，使用 LLM 直接回答
            let content = '';
            await sendMessageStream(
              `用户询问："${userMessage}"\n\n未找到相关网络搜索结果。请基于你的知识回答，并告知用户未找到实时信息。`,
              context,
              (delta) => {
                content += delta;
                onDelta(content);
              },
              abortControllerRef.current?.signal
            );

            return { content };
          }
        } catch (error) {
          console.error('[executeSkill] 联网搜索失败:', error);
          return {
            content: `❌ **搜索失败**\n\n${error instanceof Error ? error.message : '未知错误'}\n\n请稍后重试，或尝试换一种方式描述您的搜索需求。`,
          };
        }
      }

      case 'help': {
        // 检查用户是否需要实际的帮助操作（如查资料）
        const isQueryRequest = userMessage.includes('查') || userMessage.includes('搜索') ||
                               userMessage.includes('找') || userMessage.includes('资料') ||
                               userMessage.includes('信息') || userMessage.includes('数据');

        if (isQueryRequest) {
          // 执行实际的帮助操作（使用流式输出）
          let responseContent = '';
          const helpPrompt = `用户请求帮助："${userMessage}"

请根据用户的需求提供详细的帮助。如果用户要求查资料，请提供相关的信息和建议。
请用中文回答，保持友好和专业的语气。`;

          await sendMessageStream(
            helpPrompt,
            context,
            (delta) => {
              responseContent += delta;
              onDelta(responseContent);
            },
            abortControllerRef.current?.signal
          );

          return { content: responseContent };
        }

        // 否则显示帮助指南
        return {
          content: '**津小脉 Skill Agent 使用指南**\n\n🎯 **如何使用**\n直接在对话框中描述你的需求，例如：\n- "帮我设计一个科技公司的Logo"\n- "写一段品牌宣传文案"\n- "推荐一套适合电商的配色方案"\n- "帮我搜索最新的AI技术资讯"\n\n🛠️ **支持的技能**\n- 图片生成（Logo、海报、创意图）\n- 文案创作（品牌、营销、社媒）\n- 配色方案推荐\n- 创意点子生成\n- 联网搜索（查资料、获取最新资讯）\n\n💡 **小贴士**\n- 描述越详细，生成效果越好\n- 可以多次调整直到满意\n- 生成的作品会显示在左侧画布中\n\n有什么我可以帮你的吗？',
        };
      }

      case 'image-editing': {
        // 获取上下文中的原图
        const previousState = conversationStateRef.current;
        const originalImageUrl = previousState?.lastImageAttachment?.url ||
                                 collectedInfo['originalImageUrl'];

        if (!originalImageUrl) {
          return {
            content: `❌ **图片编辑失败**\n\n找不到原图。请先上传或生成一张图片，然后告诉我你想要如何修改。`,
            attachments: [],
          };
        }

        try {
          console.log('[executeSkill] 开始图片编辑，原图:', originalImageUrl);
          console.log('[executeSkill] 用户请求:', userMessage);

          // 构建编辑提示词
          const editPrompt = `基于以下原图，根据用户的要求进行编辑或二次创作：

原图 URL: ${originalImageUrl}
用户要求：${userMessage}

请保持原图的主要元素和构图，但按照用户的要求进行修改或风格转换。`;

          onDelta(`🖼️ **图片编辑**\n\n正在基于原图进行编辑...\n\n要求：${userMessage}`);

          // 调用图片编辑 API
          const { editImage } = await import('@/services/imageGenerationService');
          const editResult = await editImage({
            prompt: editPrompt,
            imageUrl: originalImageUrl,
            size: '1024x1024',
          });

          const editedImageUrl = editResult.data?.[0]?.url;

          if (!editedImageUrl) {
            throw new Error('图片编辑失败：未返回图片 URL');
          }

          const attachment = {
            id: `img_${Date.now()}`,
            type: 'image' as const,
            url: editedImageUrl,
            thumbnailUrl: editedImageUrl,
            title: '编辑后的图片',
            status: 'completed' as const,
          };

          return {
            content: `✅ **图片编辑完成！**\n\n已根据您的要求完成编辑。`,
            attachments: [attachment],
          };
        } catch (error) {
          console.error('[executeSkill] 图片编辑失败:', error);
          return {
            content: `❌ **图片编辑失败**\n\n${error instanceof Error ? error.message : '未知错误'}`,
            attachments: [],
          };
        }
      }

      case 'batch-generation': {
        // 使用任务编排服务处理批量生成
        try {
          console.log('[executeSkill] 开始批量生成，请求:', userMessage);
          console.log('[executeSkill] 已收集信息:', collectedInfo);

          // 获取上下文信息
          const previousState = conversationStateRef.current;
          const previousImageUrl = previousState?.lastImageAttachment?.url ||
                                  previousState?.designContext?.logoUrl ||
                                  previousState?.designContext?.lastOutputUrl;
          const brandName = collectedInfo['brandName'] ||
                           previousState?.designContext?.brandName ||
                           extractBrandNameFromMessage(userMessage);
          const designStyle = previousState?.designContext?.style;

          // ===== 优先使用 collectedInfo 中的 batchTasks =====
          if (collectedInfo['batchTasks']) {
            try {
              const batchTasks = JSON.parse(collectedInfo['batchTasks']);
              console.log('[executeSkill] 使用预解析的 batchTasks:', batchTasks);

              if (batchTasks.length > 0) {
                const flow = taskFlowManager.createFlow(
                  `批量生成 - ${batchTasks.length}个任务`
                );

                // 添加所有子任务
                batchTasks.forEach((task: any, index: number) => {
                  taskFlowManager.addStage(flow.id, {
                    name: task.name,
                    skill: task.skill || 'poster-design',
                    input: {
                      prompt: `${task.prompt}，品牌名：${brandName || '待定'}`,
                      imageUrl: previousImageUrl,
                      brandName,
                      style: designStyle,
                      referenceFromPrevious: !!previousImageUrl,
                    },
                  });
                });

                // 保存当前任务流
                conversationStateRef.current = {
                  ...previousState,
                  currentTaskFlow: { flowId: flow.id, name: flow.name },
                };

                // 开始执行任务流
                return await executeTaskFlowWithProgress(flow, previousImageUrl, {
                  onMessage: onDelta,
                  onAttachment,
                });
              }
            } catch (e) {
              console.error('[executeSkill] 解析 batchTasks 失败:', e);
            }
          }

          // 如果没有预解析的任务，使用 parseComplexTask
          const parsedTask = parseComplexTask(userMessage, {
            previousIntent: previousState?.intent,
            previousImageUrl,
            brandName,
            designStyle,
          });

          console.log('[executeSkill] 任务解析结果:', parsedTask);

          // 如果是批量生成任务（包括编号列表解析出的任务）
          if ((parsedTask.isBatch || parsedTask.isComplex) && parsedTask.tasks.length > 0) {
            const flow = taskFlowManager.createFlow(
              `批量生成 - ${parsedTask.tasks.length}个任务`
            );

            // 添加所有子任务
            parsedTask.tasks.forEach(task => {
              taskFlowManager.addStage(flow.id, {
                name: task.name,
                skill: task.skill,
                input: {
                  prompt: task.prompt,
                  imageUrl: previousImageUrl,
                  brandName,
                  style: designStyle,
                  referenceFromPrevious: !!previousImageUrl,
                },
              });
            });

            // 保存当前任务流
            conversationStateRef.current = {
              ...previousState,
              currentTaskFlow: { flowId: flow.id, name: flow.name },
            };

            // 开始执行任务流
            return await executeTaskFlowWithProgress(flow, previousImageUrl, {
              onMessage: onDelta,
              onAttachment,
            });
          }

          // 如果是复杂多步骤任务（有flow但没有tasks）
          if (parsedTask.isComplex && parsedTask.flow) {
            const stages = parsedTask.flow.stages.map(stage => ({
              name: stage.name,
              skill: stage.skill,
              input: {
                prompt: `${stage.description}，品牌名：${brandName || '待定'}`,
                imageUrl: previousImageUrl,
                style: designStyle,
                referenceFromPrevious: !!previousImageUrl,
              },
            }));

            const flow = createDesignTaskFlow(
              `品牌设计流程 - ${brandName || '新品牌'}`,
              stages
            );

            // 保存当前任务流
            conversationStateRef.current = {
              ...previousState,
              currentTaskFlow: { flowId: flow.id, name: flow.name },
            };

            // 开始执行任务流
            return await executeTaskFlowWithProgress(flow, previousImageUrl, {
              onMessage: onDelta,
              onAttachment,
            });
          }

          // 如果没有解析到具体任务，使用原来的简单批量逻辑
          const items = extractBatchItemsEnhanced(userMessage, previousImageUrl);

          if (items.length === 0) {
            // 如果没有解析到具体物品，作为普通图片生成处理
            const imageUrl = await generateImage(userMessage);
            if (!imageUrl) {
              throw new Error('图片生成失败');
            }
            const attachment = {
              id: `img_${Date.now()}`,
              type: 'image' as const,
              url: imageUrl,
              thumbnailUrl: imageUrl,
              title: '生成的图片',
              status: 'completed' as const,
            };
            return {
              content: `✅ **生成完成**`,
              attachments: [attachment],
            };
          }

          // 批量生成多个物品
          // 创建取消检查函数
          let cancelled = false;
          const cancelCheck = () => {
            if (cancelled) return true;
            const flow = taskFlowManager.getFlow(batchFlowId);
            return flow ? taskFlowManager.isCancelled(flow.id) : false;
          };

          // 先创建临时流用于取消检查（实际任务在 executeBatchGeneration 内部创建）
          const batchFlowId = `batch_${Date.now()}`;

          return await executeBatchGeneration(
            items,
            userMessage,
            previousImageUrl,
            onDelta,
            cancelCheck
          );
        } catch (error) {
          console.error('[executeSkill] 批量生成失败:', error);
          return {
            content: `❌ **批量生成失败**\n\n${error instanceof Error ? error.message : '未知错误'}`,
            attachments: [],
          };
        }
      }

      case 'general':
      default: {
        // 一般对话，使用流式输出
        let content = '';
        await sendMessageStream(
          userMessage,
          context,
          (delta) => {
            content += delta;
            onDelta(content);
          },
          abortControllerRef.current?.signal
        );

        return { content };
      }

      case 'compound-generation': {
        try {
          console.log('[executeSkill] 开始复合任务处理:', userMessage);

          const previousState = conversationStateRef.current;
          const brandName = collectedInfo['brandName'] ||
                           previousState?.designContext?.brandName ||
                           extractBrandNameFromMessage(userMessage);

          // 使用detectCompoundTask解析复合任务
          const compoundInfo = detectCompoundTask(userMessage, {
            previousIntent: previousState?.intent,
            previousImageUrl: previousState?.lastImageAttachment?.url,
          });

          if (!compoundInfo.isCompound || compoundInfo.tasks.length === 0) {
            // 如果无法解析为复合任务，降级为批量生成
            console.log('[executeSkill] 无法解析为复合任务，降级为批量生成');
            return await executeSkill('batch-generation', userMessage, collectedInfo, onDelta, onAttachment);
          }

          console.log('[executeSkill] 解析到复合任务:', compoundInfo.tasks);

          // 创建任务流
          const flow = taskFlowManager.createFlow(
            `复合任务 - ${compoundInfo.tasks.length}个不同类型任务`
          );

          compoundInfo.tasks.forEach((task, index) => {
            taskFlowManager.addStage(flow.id, {
              name: task.name,
              skill: task.skill,
              input: {
                prompt: task.prompt,
                brandName: brandName || compoundInfo.brandName,
                referenceFromPrevious: index > 0,
              },
            });
          });

          // 保存当前任务流
          conversationStateRef.current = {
            ...previousState,
            currentTaskFlow: { flowId: flow.id, name: flow.name },
          };

          // 执行任务流
          return await executeTaskFlowWithProgress(flow, previousState?.lastImageAttachment?.url, {
            onMessage: onDelta,
            onAttachment,
          });

        } catch (error) {
          console.error('[executeSkill] 复合任务处理失败:', error);
          return {
            content: `❌ **复合任务处理失败**\n\n${error instanceof Error ? error.message : '未知错误'}`,
            attachments: [],
          };
        }
      }

      case 'refinement': {
        try {
          console.log('[executeSkill] 开始优化迭代处理:', userMessage);

          const previousState = conversationStateRef.current;
          const lastExecution = previousState?.lastExecutionResult;

          if (!lastExecution) {
            return {
              content: `🤔 **优化迭代**\n\n我需要先为您生成一些内容，然后才能进行优化。请先告诉我您想要什么内容的设计或创作。`,
              attachments: [],
            };
          }

          // 导入refinementService
          const { parseRefinementRequest, applyRefinement, buildRefinedPrompt } = await import('../services/refinementService');

          // 构建refinement上下文
          const refinementContext = {
            originalIntent: lastExecution.intent as IntentType,
            originalParams: collectedInfo,
            originalResult: {
              imageUrl: lastExecution.attachments?.[0]?.url,
              textContent: lastExecution.content,
            },
          };

          // 解析优化请求
          const refinementRequest = parseRefinementRequest(userMessage, refinementContext);

          console.log('[executeSkill] 解析到优化请求:', refinementRequest);

          if (Object.keys(refinementRequest.modifiedFields).length === 0) {
            return {
              content: `🤔 **优化迭代**\n\n我理解您想要优化，但不确定要修改什么。您可以告诉我：\n- "颜色换成蓝色系"\n- "风格更简约一些"\n- "尺寸调大一点"\n\n请告诉我您想要怎么调整？`,
              attachments: [],
            };
          }

          // 应用优化请求到原始参数
          const refinementResult = applyRefinement(
            collectedInfo,
            refinementRequest,
            refinementContext
          );

          console.log('[executeSkill] 应用优化结果:', refinementResult);

          // 更新collectedInfo
          const refinedCollectedInfo = {
            ...collectedInfo,
            ...refinementResult.newParams,
          };

          // 如果是部分修改，需要重新构建prompt
          let refinedPrompt = userMessage;
          if (refinementResult.partialOnly && lastExecution.content) {
            refinedPrompt = buildRefinedPrompt(
              lastExecution.content,
              refinementRequest,
              refinementContext
            );
          }

          // 显示优化进度
          onDelta(`🔄 **优化迭代**\n\n正在根据您的要求进行调整...\n\n修改内容：${Object.entries(refinementRequest.modifiedFields).map(([k, v]) => `${k}: ${v}`).join(', ')}`);

          // 重新执行原始类型的任务
          const result = await executeSkill(
            refinementContext.originalIntent,
            refinedPrompt,
            refinedCollectedInfo,
            onDelta,
            onAttachment
          );

          return result;

        } catch (error) {
          console.error('[executeSkill] 优化迭代处理失败:', error);
          return {
            content: `❌ **优化迭代失败**\n\n${error instanceof Error ? error.message : '未知错误'}`,
            attachments: [],
          };
        }
      }
    }
  };

  // 执行图片处理（美化或风格转换）
  const executeImageProcessing = async (
    imageUrl: string,
    content: string,
    skillCall: SkillCallInfo,
    isStyleTransfer: boolean
  ) => {
    console.log(`[sendMessage] 自动执行图片${isStyleTransfer ? '风格转换' : '美化'}`);

    // 步骤1：分析图片内容
    const analyzingMessageId = generateMessageId();
    addMessage({
      id: analyzingMessageId,
      role: 'agent',
      content: isStyleTransfer
        ? '🔍 **步骤 1/3：分析原图内容**\n\n正在识别图片中的元素和风格特征...'
        : '🔍 **步骤 1/3：分析原图内容**\n\n正在识别图片中的元素和特征，为美化做准备...',
      skillCall: {
        ...skillCall,
        status: 'executing',
        phase: 'executing',
      },
    } as Omit<ChatMessage, 'timestamp'>);

    try {
      // 首先识别原图内容
      const recognitionPrompt = `请简要描述这张图片的内容，包括主要物体、风格、颜色等。图片 URL: ${imageUrl}`;
      const context = createChatContext(messages);
      let imageDescription = '';

      await sendMessageStream(
        recognitionPrompt,
        context,
        (delta) => {
          imageDescription = delta;
        },
        abortControllerRef.current?.signal
      );

      // 更新消息为步骤2
      updateMessage(analyzingMessageId, {
        content: isStyleTransfer
          ? `🔍 **步骤 1/3：分析原图内容**\n\n✅ 已识别：${imageDescription.slice(0, 100)}${imageDescription.length > 100 ? '...' : ''}\n\n🎨 **步骤 2/3：准备风格转换**\n\n正在根据您的要求准备转换方案...`
          : `🔍 **步骤 1/3：分析原图内容**\n\n✅ 已识别：${imageDescription.slice(0, 100)}${imageDescription.length > 100 ? '...' : ''}\n\n✨ **步骤 2/3：准备美化方案**\n\n正在制定专业的美化策略...`,
      });

      // 构建图片生成提示词
      let generationPrompt: string;

      if (isStyleTransfer) {
        generationPrompt = `基于以下图片描述，将图片转换为指定风格：${imageDescription}。用户要求：${content}`;
      } else {
        // 美化提示词 - 更具体、更有针对性
        generationPrompt = `请对以下图片进行专业级美化处理，创建一张视觉效果显著提升的版本：

原图描述：${imageDescription}

请执行以下优化（根据图片情况选择适用的）：
1. **色彩增强**：提升色彩饱和度和对比度，让画面更鲜艳生动
2. **光影优化**：改善光线分布，增强立体感，修复过曝或欠曝区域
3. **细节锐化**：增强边缘清晰度，提升纹理细节
4. **质感提升**：增加画面通透感，让整体看起来更专业
5. **肤色优化**（如有人物）：美化肤色，让人物看起来更健康自然

重要要求：
- 保持原图的主体内容和构图不变
- 美化效果要明显可见，不能只是轻微调整
- 输出高质量的精美图片

用户原始要求：${content}`;
      }

      // 更新消息为步骤3
      updateMessage(analyzingMessageId, {
        content: isStyleTransfer
          ? `🔍 **步骤 1/3：分析原图内容** ✅\n\n🎨 **步骤 2/3：准备风格转换** ✅\n\n✨ **步骤 3/3：生成新图片**\n\n正在应用风格转换，请稍候...`
          : `🔍 **步骤 1/3：分析原图内容** ✅\n\n✨ **步骤 2/3：准备美化方案** ✅\n\n🎨 **步骤 3/3：应用美化效果**\n\n正在增强色彩、优化光影、锐化细节...`,
      });

      console.log('[sendMessage] 调用图片编辑 API，提示词:', generationPrompt);
      console.log('[sendMessage] 参考图片 URL:', imageUrl);

      // 调用图片编辑 API（基于原图进行编辑）
      const editResult = await editImage({
        prompt: generationPrompt,
        imageUrl: imageUrl,
        size: '1024x1024',
      });

      const generatedImageUrl = editResult.data?.[0]?.url;

      if (!generatedImageUrl) {
        throw new Error('未能获取编辑后的图片 URL');
      }

      console.log('[sendMessage] 图片编辑完成，URL:', generatedImageUrl);

      // 显示生成的图片
      addMessage({
        role: 'agent',
        content: isStyleTransfer 
          ? '✅ **风格转换完成！**\n\n已为您将图片转换为指定风格，效果如下：' 
          : '✅ **美化完成！**\n\n已为您应用专业级美化效果，包括色彩增强、光影优化和细节锐化：',
        attachments: [
          {
            type: 'image',
            url: generatedImageUrl,
            status: 'completed',
            title: isStyleTransfer ? '转换风格后的图片' : '美化后的图片',
          },
        ],
        skillCall: {
          ...skillCall,
          status: 'completed',
          phase: 'completed',
        },
      });

      toast.success('图片处理完成');
    } catch (error) {
      console.error('[sendMessage] 图片处理失败:', error);
      toast.error('图片处理失败，请稍后重试');
      updateLastMessage({
        content: '❌ **图片处理失败**\n\n抱歉，处理图片时遇到了问题，请稍后重试。',
        skillCall: {
          ...skillCall,
          status: 'error',
          phase: 'error',
        },
      });
    }
  };

  // 收集信息阶段
  const collectRequirements = async (
    intent: IntentType,
    userMessage: string,
    preCollectedInfo?: Record<string, string>
  ): Promise<{
    ready: boolean;
    collectedInfo: Record<string, string>;
    skillCall: SkillCallInfo;
  }> => {
    // 获取当前对话状态
    const currentState = conversationStateRef.current;

    // 检查是否是确认词（如"好的"、"是的"、"没错"等）
    // 注意：只有在已经处于收集阶段时才检查确认词，避免第一条消息被误判
    const confirmationPatterns = [
      /^好的?$/i, /^是的?$/i, /^没错?$/i, /^正确?$/i,
      /^ok$/i, /^okay$/i, /^yep$/i, /^yeah$/i, /^yes$/i,
      /^好$/i, /^行$/i, /^可以$/i, /^同意$/i,
    ];

    // 只有在已经处于收集阶段且用户发送的是简短确认词时才认为是确认
    const isConfirmation = currentState?.phase === 'collecting' &&
                           confirmationPatterns.some(p => p.test(userMessage.trim()));

    // 如果是确认词，检查之前是否有已推断的信息
    let analysis;
    if (isConfirmation && currentState?.collectedInfo &&
        Object.keys(currentState.collectedInfo).length > 0) {
      // 用户确认了之前的推断，使用之前的状态继续收集
      const previousCollectedInfo = currentState.collectedInfo;

      // 重新分析，传入历史信息以便继续收集缺失字段
      analysis = await analyzeRequirements(
        intent,
        userMessage,
        messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        abortControllerRef.current?.signal
      );

      // 合并之前收集的信息和新分析的信息
      analysis.collectedInfo = { ...previousCollectedInfo, ...analysis.collectedInfo };
    } else {
      // 正常分析
      analysis = await analyzeRequirements(
        intent,
        userMessage,
        messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        abortControllerRef.current?.signal
      );
    }

    // 合并预收集的信息（如果有）
    if (preCollectedInfo && Object.keys(preCollectedInfo).length > 0) {
      analysis.collectedInfo = { ...analysis.collectedInfo, ...preCollectedInfo };
      console.log('[collectRequirements] 合并预收集信息:', preCollectedInfo);
    }

    // 使用 isRequirementsComplete 进行二次验证，确保所有必填字段都已收集
    const actuallyReady = isRequirementsComplete(intent, analysis.collectedInfo);
    const finalReady = analysis.ready && actuallyReady;

    // 更新对话状态
    conversationStateRef.current = {
      intent,
      collectedInfo: analysis.collectedInfo,
      missingFields: analysis.missingFields,
      phase: finalReady ? 'confirming' : 'collecting',
    };

    const progress = {
      current: Object.keys(analysis.collectedInfo).length,
      total: Object.keys(analysis.collectedInfo).length + analysis.missingFields.length,
    };

    // 检查是否需要收集周边类型信息
    const merchandiseField = analysis.missingFields?.find(f => f.key === 'merchandiseType');
    let merchandiseSelection: SkillCallInfo['merchandiseSelection'];

    if (merchandiseField && merchandiseField.categories) {
      merchandiseSelection = {
        categories: merchandiseField.categories,
        selectedIds: [],
      };
    }

    // 生成思考步骤
    const requirementThinkingSteps = generateRequirementAnalysisSteps(
      analysis.collectedInfo,
      analysis.missingFields,
      analysis.analysisDetails
    );

    const skillCall: SkillCallInfo = {
      skillId: 'requirement-collection',
      skillName: 'RequirementCollectionSkill',
      intent,
      confidence: 0.9,
      status: 'calling',
      phase: finalReady ? 'confirming' : 'collecting',
      collectedInfo: analysis.collectedInfo,
      missingFields: analysis.missingFields,
      currentQuestion: analysis.nextQuestion,
      suggestions: analysis.suggestions,
      summary: analysis.summary,
      progress,
      thinkingSteps: requirementThinkingSteps,
      analysisDetails: analysis.analysisDetails,
      ...(merchandiseSelection && { merchandiseSelection }),
    };

    return {
      ready: finalReady,
      collectedInfo: analysis.collectedInfo,
      skillCall,
    };
  }

  // 从历史消息中提取图片描述
  const extractImagePrompt = (msgs: ChatMessage[]): string => {
    // 查找包含"图片描述"的消息
    for (let i = msgs.length - 1; i >= 0; i--) {
      const msg = msgs[i];
      if (msg.content.includes('图片描述') || msg.content.includes('图片生成')) {
        // 提取描述内容
        const match = msg.content.match(/(?:图片描述|生成).*?(?::|：)?\s*([\s\S]+)/);
        if (match) {
          return match[1].trim();
        }
      }
    }
    return '现代风格的设计';
  };

  const sendMessage = useCallback(
    async (content: string, images?: PastedImage[]) => {
      // 空消息校验（允许只发送图片）
      const trimmedContent = content.trim();
      const hasImages = images && images.length > 0;
      
      if (!trimmedContent && !hasImages) {
        toast.warning('请输入内容或粘贴图片');
        return;
      }

      // 输入长度限制（最大 2000 字符）
      const MAX_INPUT_LENGTH = 2000;
      if (trimmedContent.length > MAX_INPUT_LENGTH) {
        toast.warning(`输入内容过长，请控制在 ${MAX_INPUT_LENGTH} 字符以内`);
        return;
      }

      if (isProcessing) {
        toast.warning('请等待当前任务完成');
        return;
      }

      // 特殊处理：检查是否是对"是否需要生成图片"的回复
      const lastAgentMessage = messages.filter(m => m.role === 'agent').pop();
      // 扩展匹配条件，支持更多类似的询问语句
      const isGenerationRequest = lastAgentMessage?.content.includes('是否需要我生成') ||
                                  lastAgentMessage?.content.includes('您是否希望我立即生成') ||
                                  lastAgentMessage?.content.includes('是否希望我生成') ||
                                  lastAgentMessage?.content.includes('是否需要生成');
      if (isGenerationRequest &&
          (content === '需要' || content === '是的' || content === '好' || content === 'ok' || content === 'OK')) {
        
        console.log('[sendMessage] 检测到图片生成确认，开始提取描述并生成图片');
        
        // 从历史消息中提取图片描述
        const imagePrompt = extractImagePrompt(messages);
        console.log('[sendMessage] 提取到的图片描述:', imagePrompt);
        
        if (imagePrompt) {
          // 添加用户消息
          addMessage({
            role: 'user',
            content,
          });
          setIsProcessing(true);
          
          // 直接执行图片生成
          try {
            const imageUrl = await generateImage(imagePrompt);
            console.log('[sendMessage] 图片 URL:', imageUrl);
            
            if (!imageUrl) {
              throw new Error('图片生成失败：返回 URL 为空');
            }
            
            addMessage({
              role: 'agent',
              content: `✅ **图片生成完成**\n\n已为您生成预览图。`,
              attachments: [{
                id: `img_${Date.now()}`,
                type: 'image',
                url: imageUrl,
                thumbnailUrl: imageUrl,
                title: '生成的预览图',
                status: 'completed',
              }],
            });
            
            toast.success('图片生成完成！');
            setIsProcessing(false);
            return;
          } catch (error) {
            console.error('[sendMessage] 图片生成失败:', error);
            addMessage({
              role: 'agent',
              content: `❌ **图片生成失败**\n\n${error instanceof Error ? error.message : '请稍后重试'}`,
            });
            setIsProcessing(false);
            return;
          }
        }
      }

      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsProcessing(true);

      // 处理图片上传
      let attachments: Attachment[] = [];
      if (hasImages) {
        console.log('[sendMessage] 开始上传图片，数量:', images.length);
        try {
          const userId = 'anonymous'; // TODO: 从用户认证中获取
          attachments = await uploadPastedImages(images, userId);
          console.log('[sendMessage] 图片上传完成，成功数量:', attachments.length);
        } catch (error) {
          console.error('[sendMessage] 上传图片失败:', error);
          toast.error('图片上传失败，请重试');
          setIsProcessing(false);
          return;
        }
      }

      // 添加用户消息（包含附件）
      const userMessage = {
        role: 'user' as const,
        content: trimmedContent,
        attachments: attachments.length > 0 ? attachments : undefined,
      };
      console.log('[sendMessage] 添加用户消息:', userMessage);
      addMessage(userMessage);

      try {
        // 检查是否处于信息收集阶段
        const currentState = conversationStateRef.current;
        
        if (currentState && currentState.phase === 'collecting' && currentState.intent) {
          // 特殊处理：如果是风格转换意图，且用户发送的是风格关键词，直接收集
          let preCollectedInfo = { ...currentState.collectedInfo };
          if (currentState.intent === 'image-style-transfer') {
            const styleKeywords = ['油画', '水彩', '素描', '卡通', '赛博朋克', '国风'];
            const matchedStyle = styleKeywords.find(style => content.includes(style));
            if (matchedStyle) {
              preCollectedInfo['targetStyle'] = matchedStyle;
              console.log('[sendMessage] 从用户消息中提取到目标风格:', matchedStyle);
            }
          }
          
          // 继续收集信息
          const { ready, collectedInfo, skillCall } = await collectRequirements(
            currentState.intent,
            content,
            preCollectedInfo
          );

          if (ready) {
            // 信息收集完成，显示确认
            conversationStateRef.current = {
              ...currentState,
              collectedInfo,
              phase: 'confirming',
            };

            // 构建需求确认消息
            const collectedEntries = Object.entries(collectedInfo);
            let confirmMessage: string;
            
            if (collectedEntries.length === 0) {
              // 如果没有收集到具体信息（如一般对话），显示简化消息
              confirmMessage = `📋 **信息收集完成**\n\n我将为您进行${getIntentDisplayName(currentState.intent)}。\n\n请问有什么我可以帮您的吗？`;
            } else {
              // 有收集到信息，显示详细信息
              confirmMessage = `📋 **信息收集完成**\n\n我已了解您的需求：\n\n${collectedEntries.map(([k, v]) => `• ${k}: ${v}`).join('\n')}\n\n请确认以上信息是否正确，如果没问题我将开始为您${getIntentDisplayName(currentState.intent)}。`;
            }

            addMessage({
              role: 'agent',
              content: confirmMessage,
              skillCall: {
                ...skillCall,
                phase: 'confirming',
              },
            });
          } else {
            // 继续询问
            addMessage({
              role: 'agent',
              content: skillCall.currentQuestion || '请提供更多信息',
              skillCall,
            });
          }
          
          setIsProcessing(false);
          return;
        }

        if (currentState && currentState.phase === 'confirming' && currentState.intent) {
          // 优先检测确认/拒绝词汇
          const isConfirm = isConfirmationIntent(content);
          const isReject = isRejectionIntent(content);

          console.log('[sendMessage] 确认阶段，用户输入:', content);
          console.log('[sendMessage] 是否确认:', isConfirm);
          console.log('[sendMessage] 是否拒绝:', isReject);

          // 如果不是确认也不是拒绝，可能是用户想修改需求
          if (!isConfirm && !isReject) {
            // 用户输入了其他内容，视为修改需求或新意图
            console.log('[sendMessage] 用户未确认也未拒绝，重新进行意图识别');
            // 继续执行下面的意图识别逻辑，不在这里返回
          } else if (isReject) {
            // 用户拒绝了，重置状态
            conversationStateRef.current = null;
            addMessage({
              role: 'agent',
              content: '好的，已取消当前任务。请问有什么其他我可以帮您的吗？',
            });
            setIsProcessing(false);
            return;
          }

          // 用户确认了信息，开始执行
          const intent = currentState.intent;
          const collectedInfo = currentState.collectedInfo;

          console.log('[sendMessage] 确认阶段执行，intent:', intent);
          console.log('[sendMessage] collectedInfo:', collectedInfo);
          console.log('[sendMessage] batchTasks:', collectedInfo['batchTasks']);

          // 重置对话状态
          conversationStateRef.current = null;

          // 开始执行
          const executingSkillCall: SkillCallInfo = {
            skillId: 'skill-execution',
            skillName: 'SkillExecutionSkill',
            intent,
            confidence: 0.95,
            status: 'executing',
            phase: 'executing',
            collectedInfo,
          };
          setCurrentSkillCall(executingSkillCall);

          // 更新最后一条消息为"开始执行..."
          updateLastMessage({
            content: `⚙️ **开始执行${getIntentDisplayName(intent)}**\n\n正在为您生成...`,
            skillCall: executingSkillCall,
          });

          // 执行技能
          let finalContent = '';
          const progressiveAttachments: Attachment[] = [];

          const result = await executeSkill(
            intent,
            content,
            collectedInfo,
            (delta) => {
              finalContent = delta;
              updateLastMessage({
                content: delta,
                skillCall: executingSkillCall,
                attachments: progressiveAttachments.length > 0 ? [...progressiveAttachments] : undefined,
              });
            },
            (attachment) => {
              // 渐进式添加附件
              progressiveAttachments.push(attachment);
              console.log('[sendMessage] 渐进式添加附件:', attachment.id, attachment.title);
              updateLastMessage({
                content: finalContent || `🚀 **批量生成进行中**\n\n已生成 ${progressiveAttachments.length} 个设计...`,
                skillCall: executingSkillCall,
                attachments: [...progressiveAttachments],
              });
            }
          );

          // 完成
          const completedSkillCall: SkillCallInfo = {
            ...executingSkillCall,
            status: 'completed',
            phase: 'completed',
            result,
          };
          setCurrentSkillCall(completedSkillCall);

          // 保存执行结果到上下文（用于多Skill联动）
          const imageAttachment = result.attachments?.find(att => att.type === 'image');
          const textAttachment = result.attachments?.find(att => att.type === 'text');

          // 提取附件中的图片URL
          let lastImageUrl: string | undefined;
          if (imageAttachment?.url) {
            lastImageUrl = imageAttachment.url;
          } else if (result.attachments?.[0]?.type === 'image') {
            lastImageUrl = result.attachments[0].url;
          }

          // 提取附件中的文本内容
          let lastTextContent: string | undefined;
          if (textAttachment?.content) {
            lastTextContent = textAttachment.content;
          }

          // 保存上下文（而不是重置），支持后续引用
          conversationStateRef.current = {
            intent,
            collectedInfo,
            missingFields: [],
            phase: 'completed',
            lastImageAttachment: lastImageUrl ? {
              url: lastImageUrl,
              type: 'image',
              title: getIntentDisplayName(intent),
            } : currentState.lastImageAttachment,
            lastTextAttachment: lastTextContent ? {
              content: lastTextContent,
              title: getIntentDisplayName(intent),
            } : currentState.lastTextAttachment,
            lastExecutionResult: {
              intent,
              content: finalContent,
              attachments: result.attachments,
            },
          };

          // 使用函数形式更新消息，确保能访问最新的 messages 状态
          setMessages((prevMessages) => {
            const lastMessageIsAgent = prevMessages.length > 0 && prevMessages[prevMessages.length - 1].role === 'agent';
            
            if (lastMessageIsAgent) {
              // 更新最后一条消息，添加附件
              const lastIndex = prevMessages.length - 1;
              return [
                ...prevMessages.slice(0, lastIndex),
                { 
                  ...prevMessages[lastIndex],
                  content: result.content,
                  skillCall: completedSkillCall,
                  attachments: result.attachments,
                },
              ];
            } else {
              // 添加新的 agent 消息
              const newMessage: ChatMessage = {
                id: generateMessageId(),
                role: 'agent',
                content: result.content,
                skillCall: completedSkillCall,
                attachments: result.attachments,
                timestamp: Date.now(),
              };
              return [...prevMessages, newMessage];
            }
          });

          toast.success(`${getIntentDisplayName(intent)}完成！`);
          setIsProcessing(false);
          return;
        }

        // 新对话，开始意图识别
        const skillCallInfo: SkillCallInfo = {
          skillId: 'intent-recognition',
          skillName: 'IntentRecognitionSkill',
          intent: 'analyzing',
          confidence: 0,
          status: 'thinking',
          phase: 'analyzing',
        };
        setCurrentSkillCall(skillCallInfo);

        addMessage({
          role: 'agent',
          content: '🤖 正在分析您的需求...',
          skillCall: skillCallInfo,
        });

        // 构建历史消息（包含附件信息）
        const historyWithAttachments = messages.map(m => ({
          role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.content,
          attachments: m.attachments,
        }));

        // 识别意图（传入历史消息以支持上下文引用）
        const intentResult = await recognizeIntent(
          content,
          abortControllerRef.current.signal,
          historyWithAttachments
        );

        // 检测意图切换
        const previousState = conversationStateRef.current;
        if (previousState && previousState.intent && previousState.intent !== intentResult.intent) {
          const intentSwitch = detectIntentSwitch(
            previousState.intent,
            intentResult.intent,
            content,
            messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
          );

          if (intentSwitch && intentSwitch.needsConfirmation) {
            // 需要确认意图切换
            updateLastMessage({
              content: `🔄 **检测到意图切换**\n\n您似乎想从「${getIntentDisplayName(previousState.intent)}」切换到「${getIntentDisplayName(intentResult.intent as IntentType)}」。\n\n是否确认切换到新任务？\n\n• **继续新任务**：请说"好的"或"确认"\n• **继续当前任务**：请继续提供当前任务所需的信息`,
              skillCall: {
                ...skillCallInfo,
                intent: intentResult.intent,
                confidence: intentResult.confidence,
                status: 'waiting',
                phase: 'analyzing',
              },
            });

            // 保存新意图，等待用户确认
            conversationStateRef.current = {
              ...previousState,
              pendingIntent: intentResult.intent as IntentType,
              intentSwitch,
            };

            setIsProcessing(false);
            return;
          }
        }

        // 更新意图识别状态
        const intentThinkingSteps = generateIntentRecognitionSteps(content, intentResult);

        const recognizingSkillCall: SkillCallInfo = {
          ...skillCallInfo,
          intent: intentResult.intent,
          confidence: intentResult.confidence,
          status: 'recognizing',
          phase: 'analyzing',
          params: intentResult.params,
          reasoning: intentResult.reasoning,
          thinkingSteps: intentThinkingSteps,
        };
        setCurrentSkillCall(recognizingSkillCall);

        updateLastMessage({
          content: `🔍 **意图识别**\n\n识别到意图：**${getIntentDisplayName(intentResult.intent as IntentType)}**\n置信度：**${Math.round(intentResult.confidence * 100)}%**`,
          skillCall: recognizingSkillCall,
        });

        // 短暂延迟让用户看到识别结果
        await new Promise((resolve) => setTimeout(resolve, 600));

        // 如果有图片附件，根据意图自动处理
        if (attachments && attachments.length > 0) {
          const firstImage = attachments.find(att => att.type === 'image');
          if (firstImage && firstImage.url) {
            console.log('[sendMessage] 检测到图片，当前意图:', intentResult.intent);
            
            // 根据意图类型自动执行对应的操作
            if (intentResult.intent === 'image-beautification' || intentResult.intent === 'image-style-transfer') {
              // 对于风格转换，检查是否指定了具体风格
              if (intentResult.intent === 'image-style-transfer') {
                const styleKeywords = ['油画', '水彩', '素描', '卡通', '赛博朋克', '国风'];
                // 检查是否包含风格关键词（包括"卡通风格"、"油画风格"等组合词）
                const hasSpecifiedStyle = styleKeywords.some(style => {
                  return content.includes(style) || // 单独的词，如"卡通"
                         content.includes(`${style}风格`) || // 组合词，如"卡通风格"
                         content.includes(`${style}样式`) || // 组合词，如"卡通样式"
                         content.includes(`${style}效果`); // 组合词，如"卡通效果"
                });

                if (!hasSpecifiedStyle) {
                  // 没有指定风格，不自动执行，进入需求收集流程
                  console.log('[sendMessage] 风格转换但未指定具体风格，进入需求收集');
                  // 跳过自动处理，让代码继续执行到需求收集逻辑
                } else {
                  // 指定了风格，执行自动处理
                  await executeImageProcessing(firstImage.url, content, recognizingSkillCall, true);
                  return; // 添加 return，防止继续执行需求收集
                }
              } else {
                // 图片美化可以直接执行
                await executeImageProcessing(firstImage.url, content, recognizingSkillCall, false);
                return; // 添加 return
              }
            } else if (intentResult.intent === 'image-recognition' || content.includes('识别') || content.includes('分析') || content.includes('描述')) {
              // 执行图片识别
              console.log('[sendMessage] 自动触发图片识别');
              
              // 发送图片识别的提示
              addMessage({
                role: 'agent',
                content: '🖼️ **检测到图片**\n\n我正在分析这张图片...',
              });
              
              try {
                // 调用图片识别服务
                const recognitionPrompt = `请详细描述这张图片的内容，包括：\n1. 主要物体和元素\n2. 场景和环境\n3. 颜色和风格\n4. 可能的用途或主题\n\n图片 URL: ${firstImage.url}`;
                
                const context = createChatContext(messages);
                let recognitionResult = '';
                
                await sendMessageStream(
                  recognitionPrompt,
                  context,
                  (delta) => {
                    recognitionResult = delta;
                    updateLastMessage({
                      content: `🖼️ **图片识别结果**\n\n${recognitionResult}`,
                    });
                  },
                  abortControllerRef.current?.signal
                );
                
                toast.success('图片识别完成');
              } catch (error) {
                console.error('[sendMessage] 图片识别失败:', error);
                toast.error('图片识别失败，请稍后重试');
              }
            } else {
              // 默认行为：只识别不执行其他操作
              console.log('[sendMessage] 默认图片识别');
              
              addMessage({
                role: 'agent',
                content: '🖼️ **检测到图片**\n\n我正在分析这张图片...',
              });
              
              try {
                const recognitionPrompt = `请详细描述这张图片的内容。\n\n图片 URL: ${firstImage.url}`;
                
                const context = createChatContext(messages);
                let recognitionResult = '';
                
                await sendMessageStream(
                  recognitionPrompt,
                  context,
                  (delta) => {
                    recognitionResult = delta;
                    updateLastMessage({
                      content: `🖼️ **图片识别结果**\n\n${recognitionResult}`,
                    });
                  },
                  abortControllerRef.current?.signal
                );
                
                toast.success('图片识别完成');
              } catch (error) {
                console.error('[sendMessage] 图片识别失败:', error);
                toast.error('图片识别失败，请稍后重试');
              }
            }
          }
        }

        // 如果是问候、帮助、一般对话或联网搜索，直接回复，不走需求收集流程
        if (intentResult.intent === 'greeting' || intentResult.intent === 'help' || intentResult.intent === 'general' || intentResult.intent === 'web-search') {
          const result = await executeSkill(
            intentResult.intent as IntentType,
            content,
            {},
            (delta) => {
              updateLastMessage({
                content: delta,
                skillCall: recognizingSkillCall,
              });
            }
          );

          const completedSkillCall: SkillCallInfo = {
            ...recognizingSkillCall,
            status: 'completed',
            phase: 'completed',
            result,
          };
          setCurrentSkillCall(completedSkillCall);

          // 更新最后一条消息，添加附件
          updateLastMessage({
            content: result.content,
            skillCall: completedSkillCall,
            attachments: result.attachments,
          });

          setIsProcessing(false);
          return;
        }

        // 开始收集需求（只对需要收集需求的意图）
        const { ready, collectedInfo, skillCall } = await collectRequirements(
          intentResult.intent as IntentType,
          content
        );

        if (ready) {
          // 信息已完整，显示确认
          conversationStateRef.current = {
            intent: intentResult.intent as IntentType,
            collectedInfo,
            missingFields: [],
            phase: 'confirming',
          };

          // 构建需求确认消息
          const collectedEntries = Object.entries(collectedInfo);
          let confirmMessage: string;
          
          if (collectedEntries.length === 0) {
            // 如果没有收集到具体信息（如一般对话），显示简化消息
            confirmMessage = `📋 **需求已明确**\n\n我将为您进行${getIntentDisplayName(intentResult.intent as IntentType)}。\n\n请问有什么我可以帮您的吗？`;
          } else {
            // 有收集到信息，显示详细信息
            confirmMessage = `📋 **需求已明确**\n\n我已了解您的需求：\n\n${collectedEntries.map(([k, v]) => `• ${k}: ${v}`).join('\n')}\n\n请确认以上信息是否正确，如果没问题我将开始为您${getIntentDisplayName(intentResult.intent as IntentType)}。`;
          }

          addMessage({
            role: 'agent',
            content: confirmMessage,
            skillCall: {
              ...skillCall,
              phase: 'confirming',
            },
          });
        } else {
          // 需要收集更多信息
          conversationStateRef.current = {
            intent: intentResult.intent as IntentType,
            collectedInfo,
            missingFields: skillCall.missingFields || [],
            phase: 'collecting',
          };

          addMessage({
            role: 'agent',
            content: `📝 **需求分析**\n\n${skillCall.currentQuestion || '为了更好地完成您的需求，我需要了解一些信息：'}`,
            skillCall,
          });
        }

      } catch (error: any) {
        console.error('[useSkillChat] Error:', error);
        
        const errorMessage = error.message || '执行失败';
        const errorSkillCall: SkillCallInfo = {
          skillId: currentSkillCall?.skillId || 'unknown',
          skillName: currentSkillCall?.skillName || 'Unknown',
          intent: currentSkillCall?.intent || 'error',
          confidence: 0,
          status: 'error',
          phase: 'error',
          error: errorMessage,
        };
        
        setCurrentSkillCall(errorSkillCall);
        conversationStateRef.current = null;

        if (errorMessage === '请求已取消') {
          updateLastMessage({
            content: '❌ 请求已取消',
            skillCall: errorSkillCall,
          });
        } else {
          updateLastMessage({
            content: `❌ **执行失败**\n\n${errorMessage}\n\n请稍后重试，或尝试换一种方式描述您的需求。`,
            skillCall: errorSkillCall,
          });
          toast.error('执行失败：' + errorMessage);
        }
      } finally {
        setIsProcessing(false);
        abortControllerRef.current = null;
      }
    },
    [isProcessing, messages, addMessage, updateLastMessage, currentSkillCall]
  );

  const clearMessages = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages([]);
    setCurrentSkillCall(null);
    conversationStateRef.current = null;
    setIsProcessing(false);
  }, []);

  // 加载消息（用于切换会话时恢复历史消息）
  const loadMessages = useCallback((newMessages: ChatMessage[]) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages(newMessages);
    setCurrentSkillCall(null);
    conversationStateRef.current = null;
    setIsProcessing(false);
  }, []);

  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setCurrentSkillCall(null);
  }, []);

  return {
    messages,
    isProcessing,
    currentSkillCall,
    sendMessage,
    clearMessages,
    loadMessages,
    cancelProcessing,
  };
};

export default useSkillChat;
