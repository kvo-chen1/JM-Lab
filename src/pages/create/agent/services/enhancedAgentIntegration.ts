/**
 * 增强版Agent服务集成示例
 * 展示如何在现有AgentService中集成新的智能化功能
 */

import { AgentMessage, AgentType } from '../types/agent';
import { AIResponse, callAgent } from './agentService';

// 意图识别增强
import { getSemanticIntentAnalyzer } from './semanticIntentAnalyzer';
import { getEntityExtractor, EntityType } from './entityExtractor';

// 上下文理解增强
import { getDialogStateTracker, DialogState } from './dialogStateTracker';
import { getSmartContextCompressor } from './smartContextCompressor';
import { getCoreferenceResolver } from './coreferenceResolver';

// 记忆和学习
import { getUserProfileService } from './userProfileService';
import { getLongTermMemory, MemoryType, Memory } from './longTermMemory';
import { getFeedbackLearning, FeedbackType } from './feedbackLearning';

// 增强版Agent响应
export interface EnhancedAIResponse extends AIResponse {
  detectedIntent?: string;
  extractedEntities?: Array<{ type: string; value: string }>;
  dialogState?: string;
  usedMemory?: boolean;
  personalized?: boolean;
  suggestedActions?: Array<{ label: string; value: string; type?: string }>;
}

/**
 * 增强版Agent调用 - 集成所有智能化功能
 */
export async function callEnhancedAgent(
  systemPrompt: string,
  history: AgentMessage[],
  userMessage: string,
  agent: AgentType,
  options: {
    userId: string;
    sessionId: string;
    enableIntentRecognition?: boolean;
    enableEntityExtraction?: boolean;
    enableContextTracking?: boolean;
    enablePersonalization?: boolean;
    enableMemory?: boolean;
  }
): Promise<EnhancedAIResponse> {
  const {
    userId,
    sessionId,
    enableIntentRecognition = true,
    enableEntityExtraction = true,
    enableContextTracking = true,
    enablePersonalization = true,
    enableMemory = true
  } = options;

  console.log(`[EnhancedAgent] Processing message for user ${userId}`);

  let processedMessage = userMessage;
  let detectedIntent: string | undefined;
  let extractedEntities: Array<{ type: string; value: string }> = [];
  let dialogState: string | undefined;
  let usedMemory = false;
  let personalized = false;

  // ========== 1. 指代消解 ==========
  const corefResolver = getCoreferenceResolver();
  const corefResult = await corefResolver.resolve(userMessage, history);
  if (corefResult.resolvedText !== userMessage) {
    console.log(`[EnhancedAgent] Coreference resolved: "${userMessage}" -> "${corefResult.resolvedText}"`);
    processedMessage = corefResult.resolvedText;
  }

  // ========== 2. 语义意图识别 ==========
  if (enableIntentRecognition) {
    const intentAnalyzer = getSemanticIntentAnalyzer();
    const intentResult = await intentAnalyzer.analyze(processedMessage);
    detectedIntent = intentResult.primaryIntent;
    console.log(`[EnhancedAgent] Detected intent: ${detectedIntent} (confidence: ${intentResult.confidence})`);
  }

  // ========== 3. 实体提取 ==========
  if (enableEntityExtraction) {
    const entityExtractor = getEntityExtractor();
    const entityResult = await entityExtractor.extract(processedMessage);
    extractedEntities = entityResult.entities.map(e => ({
      type: e.type,
      value: e.normalizedValue || e.value
    }));
    console.log(`[EnhancedAgent] Extracted ${extractedEntities.length} entities:`, extractedEntities);

    // 更新用户画像中的偏好
    if (enablePersonalization && extractedEntities.length > 0) {
      const profileService = getUserProfileService();
      for (const entity of entityResult.entities) {
        const category = mapEntityTypeToPreference(entity.type);
        if (category) {
          profileService.updatePreference(userId, category, entity.value, entity.confidence);
        }
      }
    }
  }

  // ========== 4. 对话状态追踪 ==========
  let nextAction: string = 'CONTINUE';
  if (enableContextTracking) {
    const stateTracker = getDialogStateTracker(sessionId);
    const stateResult = await stateTracker.processUserMessage({
      id: Date.now().toString(),
      role: 'user',
      content: processedMessage
    });
    dialogState = stateResult.context.state;
    nextAction = stateResult.nextAction;
    console.log(`[EnhancedAgent] Dialog state: ${dialogState}, Next action: ${nextAction}`);
  }

  // ========== 5. 智能上下文压缩 ==========
  let compressedHistory = history;
  let contextSummary = '';
  if (history.length > 10) {
    const compressor = getSmartContextCompressor();
    const compressionResult = await compressor.compress(history);
    compressedHistory = compressionResult.compressed;
    contextSummary = compressionResult.summary;
    console.log(`[EnhancedAgent] Context compressed: ${history.length} -> ${compressedHistory.length} messages`);
  }

  // ========== 6. 长期记忆检索 ==========
  let memoryContext = '';
  if (enableMemory) {
    const longTermMemory = getLongTermMemory();

    // 语义搜索相关记忆
    const relatedMemories = await longTermMemory.search(processedMessage, {
      userId,
      limit: 3,
      threshold: 0.7
    });

    // 获取最近记忆
    const recentMemories = await longTermMemory.getRecentMemories(userId, {
      limit: 3,
      hours: 24
    });

    if (relatedMemories.length > 0 || recentMemories.length > 0) {
      usedMemory = true;
      memoryContext = buildMemoryContext(relatedMemories, recentMemories);
      console.log(`[EnhancedAgent] Retrieved ${relatedMemories.length} related memories`);
    }
  }

  // ========== 7. 个性化增强 ==========
  let personalizedPrompt = systemPrompt;
  if (enablePersonalization) {
    const profileService = getUserProfileService();
    const profile = profileService.getProfile(userId);

    // 根据用户偏好调整Prompt
    if (profile.preferences.styles.length > 0) {
      const preferredStyles = profile.preferences.styles
        .slice(0, 3)
        .map(s => s.value)
        .join('、');
      personalizedPrompt += `\n\n用户历史偏好风格：${preferredStyles}`;
      personalized = true;
    }

    // 根据行为模式调整语气
    if (profile.behavior.preferredInteractionStyle === 'concise') {
      personalizedPrompt += '\n\n注意：该用户偏好简洁的回答，请尽量精简。';
    } else if (profile.behavior.preferredInteractionStyle === 'detailed') {
      personalizedPrompt += '\n\n注意：该用户偏好详细的回答，请提供充分的信息。';
    }
  }

  // ========== 8. 构建增强的System Prompt ==========
  const enhancedSystemPrompt = buildEnhancedSystemPrompt(
    personalizedPrompt,
    detectedIntent,
    extractedEntities,
    dialogState,
    contextSummary,
    memoryContext
  );

  // ========== 9. 调用基础Agent服务 ==========
  const response = await callAgent(
    enhancedSystemPrompt,
    compressedHistory,
    processedMessage,
    agent
  );

  // ========== 10. 存储对话记忆 ==========
  if (enableMemory) {
    const longTermMemory = getLongTermMemory();
    await longTermMemory.store({
      userId,
      sessionId,
      type: MemoryType.CONVERSATION,
      content: `用户: ${processedMessage}\n助手: ${response.content}`,
      entities: extractedEntities.map(e => ({ type: e.type as EntityType, value: e.value, confidence: 0.8 })),
      importance: calculateImportance(detectedIntent, extractedEntities),
      metadata: {
        intent: detectedIntent,
        agent,
        responseType: response.type
      }
    });
  }

  // ========== 11. 生成建议操作 ==========
  const suggestedActions = generateSuggestedActions(
    nextAction,
    extractedEntities,
    userId,
    enablePersonalization
  );

  return {
    ...response,
    detectedIntent,
    extractedEntities,
    dialogState,
    usedMemory,
    personalized,
    suggestedActions
  };
}

/**
 * 收集用户反馈
 */
export async function collectUserFeedback(
  userId: string,
  sessionId: string,
  messageId: string,
  type: 'THUMB_UP' | 'THUMB_DOWN' | 'RATING',
  data: {
    rating?: number;
    comment?: string;
  },
  context: {
    userInput: string;
    agentResponse: string;
  }
): Promise<void> {
  const feedbackLearning = getFeedbackLearning();

  await feedbackLearning.collectFeedback(
    userId,
    sessionId,
    messageId,
    type as FeedbackType,
    data,
    context
  );

  console.log(`[EnhancedAgent] Feedback collected: ${type}`);
}

// ========== 辅助函数 ==========

/**
 * 构建增强的System Prompt
 */
function buildEnhancedSystemPrompt(
  basePrompt: string,
  intent?: string,
  entities?: Array<{ type: string; value: string }>,
  dialogState?: string,
  contextSummary?: string,
  memoryContext?: string
): string {
  let enhanced = basePrompt;

  // 添加意图信息
  if (intent) {
    enhanced += `\n\n【检测到的用户意图】${intent}`;
  }

  // 添加实体信息
  if (entities && entities.length > 0) {
    enhanced += `\n\n【提取到的关键信息】`;
    for (const entity of entities) {
      enhanced += `\n- ${entity.type}: ${entity.value}`;
    }
  }

  // 添加对话状态
  if (dialogState) {
    enhanced += `\n\n【当前对话状态】${dialogState}`;
  }

  // 添加上下文摘要
  if (contextSummary) {
    enhanced += `\n\n【对话历史摘要】${contextSummary}`;
  }

  // 添加记忆上下文
  if (memoryContext) {
    enhanced += `\n\n【相关记忆】${memoryContext}`;
  }

  return enhanced;
}

/**
 * 构建记忆上下文
 */
function buildMemoryContext(
  relatedMemories: Array<Memory & { similarity: number }>,
  recentMemories: Memory[]
): string {
  const parts: string[] = [];

  if (relatedMemories.length > 0) {
    parts.push('相关历史:');
    for (const memory of relatedMemories.slice(0, 2)) {
      parts.push(`- ${memory.content.substring(0, 100)}...`);
    }
  }

  if (recentMemories.length > 0) {
    parts.push('最近对话:');
    for (const memory of recentMemories.slice(0, 2)) {
      parts.push(`- ${memory.content.substring(0, 100)}...`);
    }
  }

  return parts.join('\n');
}

/**
 * 生成建议操作
 */
function generateSuggestedActions(
  nextAction: string,
  entities: Array<{ type: string; value: string }>,
  userId: string,
  enablePersonalization: boolean
): Array<{ label: string; value: string; type?: string }> {
  const actions: Array<{ label: string; value: string; type?: string }> = [];

  // 根据对话状态生成建议
  switch (nextAction) {
    case 'ASK_STYLE':
      if (enablePersonalization) {
        const profileService = getUserProfileService();
        const recommendedStyles = profileService.getRecommendedStyles(userId, 3);
        for (const style of recommendedStyles) {
          actions.push({ label: style, value: style, type: 'style' });
        }
      }
      actions.push({ label: '其他风格', value: 'other', type: 'style' });
      break;

    case 'ASK_COLOR':
      actions.push(
        { label: '暖色调', value: 'warm', type: 'color' },
        { label: '冷色调', value: 'cool', type: 'color' },
        { label: '单色', value: 'monochrome', type: 'color' }
      );
      break;

    case 'SUMMARIZE_AND_CONFIRM':
      actions.push(
        { label: '对的，开始设计', value: 'confirm', type: 'action' },
        { label: '需要修改', value: 'modify', type: 'action' }
      );
      break;

    case 'SHOW_RESULT_AND_ASK_FEEDBACK':
      actions.push(
        { label: '👍 满意', value: 'thumbs_up', type: 'feedback' },
        { label: '👎 不满意', value: 'thumbs_down', type: 'feedback' },
        { label: '修改', value: 'modify', type: 'action' }
      );
      break;
  }

  return actions;
}

/**
 * 计算重要性
 */
function calculateImportance(
  intent?: string,
  entities?: Array<{ type: string; value: string }>
): number {
  let importance = 0.5;

  // 意图影响重要性
  if (intent) {
    importance += 0.1;
  }

  // 实体数量影响重要性
  if (entities && entities.length > 0) {
    importance += Math.min(entities.length * 0.05, 0.2);
  }

  return Math.min(importance, 1);
}

/**
 * 映射实体类型到偏好类别
 */
function mapEntityTypeToPreference(entityType: EntityType): 'styles' | 'colors' | 'designTypes' | 'elements' | 'audiences' | null {
  const mapping: Record<EntityType, 'styles' | 'colors' | 'designTypes' | 'elements' | 'audiences' | null> = {
    [EntityType.STYLE]: 'styles',
    [EntityType.COLOR]: 'colors',
    [EntityType.DESIGN_TYPE]: 'designTypes',
    [EntityType.ELEMENT]: 'elements',
    [EntityType.AUDIENCE]: 'audiences',
    [EntityType.USAGE_SCENARIO]: null,
    [EntityType.BRAND]: null,
    [EntityType.SIZE]: null,
    [EntityType.TIME]: null,
    [EntityType.BUDGET]: null,
    [EntityType.REFERENCE]: null,
    [EntityType.EMOTION]: null,
    [EntityType.MATERIAL]: null,
    [EntityType.TECHNIQUE]: null,
    [EntityType.THEME]: null
  };

  return mapping[entityType];
}
