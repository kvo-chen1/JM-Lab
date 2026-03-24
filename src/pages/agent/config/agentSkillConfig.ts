/**
 * Agent-Skill 映射配置
 * 定义每个 Agent 拥有的 Skill 能力
 */

import { AgentType } from '../types/agent';

/**
 * Agent 专属 Skill 配置
 * 每个 Agent 类型对应一组 Skill ID 列表
 */
export const AGENT_SKILL_CONFIG: Record<Exclude<AgentType, 'system' | 'user'>, string[]> = {
  director: [
    'intent-recognition',
    'requirement-analysis',
    'requirement-collection',
    'task-orchestration',
    'delegation-decision',
    'conversation-management'
  ],
  designer: [
    'intent-recognition',
    'image-generation',
    'style-recommendation',
    'design-analysis',
    'brand-design',
    'packaging-design'
  ],
  illustrator: [
    'intent-recognition',
    'image-generation',
    'illustration-style',
    'character-design',
    'hand-drawn-style',
    'concept-art'
  ],
  copywriter: [
    'intent-recognition',
    'text-generation',
    'copy-optimization',
    'brand-voice',
    'slogan-creation',
    'story-writing'
  ],
  animator: [
    'intent-recognition',
    'video-generation',
    'animation-design',
    'motion-graphics',
    'short-film',
    'gif-creation'
  ],
  researcher: [
    'intent-recognition',
    'market-research',
    'competitor-analysis',
    'trend-analysis',
    'data-analysis',
    'report-generation'
  ]
};

/**
 * 获取 Agent 的 Skill 列表
 */
export function getAgentSkills(agentType: AgentType): string[] {
  if (agentType === 'system' || agentType === 'user') {
    return [];
  }
  return AGENT_SKILL_CONFIG[agentType] || [];
}

/**
 * 检查 Skill 是否支持指定 Agent
 */
export function isSkillSupportedByAgent(skillId: string, agentType: AgentType): boolean {
  if (agentType === 'system' || agentType === 'user') {
    return false;
  }
  const agentSkills = AGENT_SKILL_CONFIG[agentType];
  return agentSkills.includes(skillId);
}

/**
 * 获取支持指定 Skill 的所有 Agent
 */
export function getAgentsBySkill(skillId: string): Exclude<AgentType, 'system' | 'user'>[] {
  const agents: Exclude<AgentType, 'system' | 'user'>[] = [];
  
  for (const [agent, skills] of Object.entries(AGENT_SKILL_CONFIG)) {
    if (skills.includes(skillId)) {
      agents.push(agent as Exclude<AgentType, 'system' | 'user'>);
    }
  }
  
  return agents;
}

/**
 * Skill 优先级配置
 * 用于 SkillMatcher 的匹配排序
 */
export const SKILL_PRIORITY_CONFIG: Record<string, number> = {
  // 分析类 Skill 优先级最高
  'intent-recognition': 100,
  'requirement-analysis': 95,
  'requirement-collection': 90,
  
  // 编排类 Skill
  'task-orchestration': 85,
  'delegation-decision': 80,
  'conversation-management': 75,
  
  // 创作类 Skill
  'image-generation': 70,
  'video-generation': 65,
  'text-generation': 60,
  
  // 设计类 Skill
  'style-recommendation': 55,
  'design-analysis': 50,
  'brand-design': 45,
  'packaging-design': 45,
  'illustration-style': 45,
  'character-design': 45,
  'hand-drawn-style': 45,
  'concept-art': 45,
  
  // 文案类 Skill
  'copy-optimization': 40,
  'brand-voice': 40,
  'slogan-creation': 40,
  'story-writing': 40,
  
  // 动画类 Skill
  'animation-design': 40,
  'motion-graphics': 40,
  'short-film': 40,
  'gif-creation': 40,
  
  // 研究类 Skill
  'market-research': 40,
  'competitor-analysis': 40,
  'trend-analysis': 40,
  'data-analysis': 40,
  'report-generation': 40
};

/**
 * 获取 Skill 优先级
 */
export function getSkillPriority(skillId: string): number {
  return SKILL_PRIORITY_CONFIG[skillId] || 50;
}

/**
 * Agent 能力描述
 * 用于 UI 展示
 */
export const AGENT_CAPABILITY_DESCRIPTIONS: Record<Exclude<AgentType, 'system' | 'user'>, {
  title: string;
  description: string;
  skills: { id: string; name: string; description: string }[];
}> = {
  director: {
    title: '设计总监',
    description: '统筹全局，理解需求，协调资源，负责任务分配和质量把控',
    skills: [
      { id: 'intent-recognition', name: '意图识别', description: '理解用户需求和意图' },
      { id: 'requirement-analysis', name: '需求分析', description: '分析项目需求和目标' },
      { id: 'requirement-collection', name: '需求收集', description: '收集和整理需求信息' },
      { id: 'task-orchestration', name: '任务编排', description: '规划和安排设计任务' },
      { id: 'delegation-decision', name: '委派决策', description: '决定任务分配给哪位设计师' }
    ]
  },
  designer: {
    title: '品牌设计师',
    description: '专注视觉设计，擅长品牌设计、包装设计和图像生成',
    skills: [
      { id: 'intent-recognition', name: '意图识别', description: '理解设计需求' },
      { id: 'image-generation', name: '图像生成', description: '生成设计概念图' },
      { id: 'style-recommendation', name: '风格推荐', description: '推荐合适的设计风格' },
      { id: 'design-analysis', name: '设计分析', description: '分析设计方案的优缺点' },
      { id: 'brand-design', name: '品牌设计', description: '设计品牌视觉系统' },
      { id: 'packaging-design', name: '包装设计', description: '设计产品包装' }
    ]
  },
  illustrator: {
    title: '插画师',
    description: '擅长手绘风格、角色设计和插画创作',
    skills: [
      { id: 'intent-recognition', name: '意图识别', description: '理解插画需求' },
      { id: 'image-generation', name: '图像生成', description: '生成插画作品' },
      { id: 'illustration-style', name: '插画风格', description: '应用各种插画风格' },
      { id: 'character-design', name: '角色设计', description: '设计独特角色形象' },
      { id: 'hand-drawn-style', name: '手绘风格', description: '创作手绘风格作品' },
      { id: 'concept-art', name: '概念艺术', description: '创作概念艺术图' }
    ]
  },
  copywriter: {
    title: '文案策划',
    description: '品牌文案、标语创作与故事编写专家',
    skills: [
      { id: 'intent-recognition', name: '意图识别', description: '理解文案需求' },
      { id: 'text-generation', name: '文本生成', description: '生成品牌文案' },
      { id: 'copy-optimization', name: '文案优化', description: '优化文案表达' },
      { id: 'brand-voice', name: '品牌声音', description: '塑造品牌语调' },
      { id: 'slogan-creation', name: '标语创作', description: '创作品牌标语' },
      { id: 'story-writing', name: '故事编写', description: '编写品牌故事' }
    ]
  },
  animator: {
    title: '动画师',
    description: '动效设计与视频制作专家',
    skills: [
      { id: 'intent-recognition', name: '意图识别', description: '理解动画需求' },
      { id: 'video-generation', name: '视频生成', description: '生成动画视频' },
      { id: 'animation-design', name: '动画设计', description: '设计动画效果' },
      { id: 'motion-graphics', name: '动态图形', description: '创作动态图形' },
      { id: 'short-film', name: '短片制作', description: '制作剧情短片' },
      { id: 'gif-creation', name: 'GIF创作', description: '制作动态表情包' }
    ]
  },
  researcher: {
    title: '研究员',
    description: '市场调研、竞品分析与趋势研究',
    skills: [
      { id: 'intent-recognition', name: '意图识别', description: '理解研究需求' },
      { id: 'market-research', name: '市场调研', description: '进行市场分析' },
      { id: 'competitor-analysis', name: '竞品分析', description: '分析竞争对手' },
      { id: 'trend-analysis', name: '趋势分析', description: '分析行业趋势' },
      { id: 'data-analysis', name: '数据分析', description: '分析数据信息' },
      { id: 'report-generation', name: '报告生成', description: '生成研究报告' }
    ]
  }
};
