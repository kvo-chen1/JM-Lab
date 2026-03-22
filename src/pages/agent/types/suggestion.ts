// 建议类型定义 - 避免循环依赖

// 建议类型
export enum SuggestionType {
  // 基础类型
  STYLE = 'style',
  AGENT = 'agent',
  TASK = 'task',
  ACTION = 'action',
  CONTENT = 'content',
  SHORTCUT = 'shortcut',
  
  // 智能内容建议
  PROMPT_OPTIMIZATION = 'prompt_optimization',
  ELEMENT_SUGGESTION = 'element_suggestion',
  REFERENCE_CASE = 'reference_case',
  STYLE_MATCHING = 'style_matching',
  
  // 智能操作建议
  ONE_CLICK_OPTIMIZE = 'one_click_optimize',
  VARIANT_GENERATION = 'variant_generation',
  DERIVATIVE_CREATION = 'derivative_creation',
  COLLABORATION_SUGGESTION = 'collaboration_suggestion',
  
  // 智能学习建议
  SKILL_TIP = 'skill_tip',
  TREND_INSIGHT = 'trend_insight',
  EFFICIENCY_BOOST = 'efficiency_boost',
  
  // 个性化洞察
  STYLE_ANALYSIS = 'style_analysis',
  SKILL_IMPROVEMENT = 'skill_improvement',
  WORK_IMPROVEMENT = 'work_improvement'
}

// 建议触发事件类型
export enum SuggestionTriggerEvent {
  USER_INPUT_IDLE = 'user_input_idle',
  GENERATION_COMPLETE = 'generation_complete',
  USER_HOVER_IMAGE = 'user_hover_image',
  CONVERSATION_PAUSE = 'conversation_pause',
  TASK_STAGE_CHANGE = 'task_stage_change',
  ERROR_OCCURRED = 'error_occurred',
  POSITIVE_FEEDBACK = 'positive_feedback',
  NEGATIVE_FEEDBACK = 'negative_feedback',
  REQUIREMENT_COLLECTED = 'requirement_collected'
}

// 建议项
export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  icon?: string;
  action: {
    type: 'message' | 'switch_agent' | 'generate' | 'navigate';
    payload: any;
  };
  priority: number; // 0-100
  reason: string;
  confidence: number;
  timestamp: number;
  expiresAt?: number;
  metadata?: any;
}

// 建议上下文
export interface SuggestionContext {
  currentAgent: string;
  conversationStage: 'initial' | 'collecting' | 'confirming' | 'executing' | 'reviewing';
  recentMessages: { role: string; content: string }[];
  currentTask?: {
    type?: string;
    requirements?: Record<string, any>;
  };
  userPreferences?: {
    preferredStyles?: string[];
    frequentTasks?: string[];
  };
}
