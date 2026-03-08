// Agent类型定义

export type AgentRole = 'user' | 'director' | 'designer' | 'system';
export type MessageType = 'text' | 'image' | 'style-options' | 'satisfaction-check' | 'derivative-options' | 'thinking';
export type TaskType = 'ip-character' | 'brand-packaging' | 'poster' | 'custom';
export type TaskStage = 'requirement' | 'design' | 'review' | 'derivative' | 'completed';

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: number;
  type: MessageType;
  metadata?: {
    images?: string[];
    styles?: StyleOption[];
    thinking?: string;
    toolCalls?: ToolCall[];
    derivativeOptions?: DerivativeOption[];
  };
}

export interface StyleOption {
  id: string;
  name: string;
  thumbnail: string;
  description?: string;
  prompt?: string;
}

export interface ToolCall {
  id: string;
  tool: 'search' | 'generate-image' | 'generate-video' | 'analyze';
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
}

export interface DerivativeOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'video' | 'short-film' | 'merchandise' | 'poster' | 'animation';
}

export interface DesignTask {
  id: string;
  type: TaskType;
  title: string;
  requirements: {
    description: string;
    style?: string;
    targetAudience?: string;
    usage?: string;
    brandInfo?: string;
    preferences?: string[];
  };
  status: TaskStage;
  outputs: GeneratedOutput[];
  createdAt: number;
  updatedAt: number;
}

export interface GeneratedOutput {
  id: string;
  type: 'image' | 'video' | 'text';
  url: string;
  thumbnail?: string;
  prompt?: string;
  style?: string;
  createdAt: number;
  metadata?: Record<string, any>;
}

export interface AgentState {
  // 对话状态
  messages: AgentMessage[];
  currentAgent: 'director' | 'designer';
  isTyping: boolean;
  
  // 设计任务状态
  currentTask: DesignTask | null;
  taskStage: TaskStage;
  
  // 生成内容
  generatedOutputs: GeneratedOutput[];
  selectedOutput: string | null;
  selectedStyle: string | null;
  
  // 画布状态
  canvasZoom: number;
  canvasPosition: { x: number; y: number };
  selectedTool: 'select' | 'move' | 'hand';
  
  // UI状态
  showStyleSelector: boolean;
  showSatisfactionModal: boolean;
  showThinkingProcess: boolean;
  isChatCollapsed: boolean;
  
  // 工具调用状态
  activeToolCalls: ToolCall[];
}

export interface AgentConfig {
  director: {
    name: string;
    avatar: string;
    color: string;
    description: string;
  };
  designer: {
    name: string;
    avatar: string;
    color: string;
    description: string;
  };
}

// 预设风格选项
export const PRESET_STYLES: StyleOption[] = [
  {
    id: 'color-pencil',
    name: '彩铅素描插画',
    thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&h=200&fit=crop',
    description: '柔和细腻的彩铅风格',
    prompt: 'colored pencil sketch style, soft textures, artistic illustration'
  },
  {
    id: 'fantasy-picture-book',
    name: '诡萌幻想绘本',
    thumbnail: 'https://images.unsplash.com/photo-1633479399362-75121048d4c6?w=200&h=200&fit=crop',
    description: '奇幻可爱的绘本风格',
    prompt: 'whimsical fantasy picture book style, cute and mysterious, storybook illustration'
  },
  {
    id: 'mori-girl',
    name: '辛逝季-芙莉',
    thumbnail: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=200&h=200&fit=crop',
    description: '森系少女风格',
    prompt: 'mori girl style, nature inspired, soft and ethereal, floral elements'
  },
  {
    id: 'warm-color',
    name: '温馨彩绘',
    thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200&h=200&fit=crop',
    description: '温暖治愈的彩绘风格',
    prompt: 'warm color painting style, cozy and healing, soft color palette'
  },
  {
    id: 'adventure-comic',
    name: '治愈冒险漫画',
    thumbnail: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=200&h=200&fit=crop',
    description: '温馨冒险的漫画风格',
    prompt: 'healing adventure comic style, warm storytelling, manga inspired'
  },
  {
    id: 'grainy-cute',
    name: '颗粒粉彩童话',
    thumbnail: 'https://images.unsplash.com/photo-1560964645-6c9e2c3c5b8e?w=200&h=200&fit=crop',
    description: '复古颗粒感的粉彩风格',
    prompt: 'grainy pastel fairy tale style, retro texture, dreamy atmosphere'
  },
  {
    id: 'dreamy-pastel',
    name: '虹彩梦幻治愈',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
    description: '彩虹色调梦幻风格',
    prompt: 'rainbow dreamy pastel style, iridescent colors, healing atmosphere'
  },
  {
    id: 'crayon-cute',
    name: '童趣蜡笔插画',
    thumbnail: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop',
    description: '童真可爱的蜡笔画风',
    prompt: 'childlike crayon illustration style, playful and cute, naive art'
  }
];

// 衍生内容选项
export const DERIVATIVE_OPTIONS: DerivativeOption[] = [
  {
    id: 'short-video',
    title: '快速生成视频',
    description: '15秒以下的短视频，适合社交媒体传播',
    icon: 'video',
    type: 'video'
  },
  {
    id: 'short-film',
    title: '制作剧情故事短片',
    description: '有情节的动画短片，讲述品牌故事',
    icon: 'film',
    type: 'short-film'
  },
  {
    id: 'merchandise',
    title: '制作衍生品',
    description: '文创周边、产品包装等实物设计',
    icon: 'gift',
    type: 'merchandise'
  },
  {
    id: 'poster',
    title: '生成宣传海报',
    description: '多尺寸宣传海报设计',
    icon: 'image',
    type: 'poster'
  },
  {
    id: 'animation',
    title: '制作动态表情包',
    description: '可爱的动态表情，增强品牌互动',
    icon: 'smile',
    type: 'animation'
  }
];

// Agent配置
export const AGENT_CONFIG: AgentConfig = {
  director: {
    name: '津脉设计总监',
    avatar: '总',
    color: 'from-amber-500 to-orange-600',
    description: '统领全局，理解需求，协调资源'
  },
  designer: {
    name: '津脉品牌设计师',
    avatar: '设',
    color: 'from-cyan-500 to-blue-600',
    description: '专注设计执行，调用AI工具创作'
  }
};
