/**
 * Agent 模块统一导出
 */

// 类型定义
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  color?: string;
}

export interface AgentResponse {
  content: string;
  type: 'text' | 'image' | 'video' | 'structured';
  metadata?: Record<string, any>;
  suggestedSkills?: string[];
}

// Agent 信息
export interface AgentInfo {
  type: import('../types/agent').AgentType;
  name: string;
  description: string;
  avatar?: string;
  color?: string;
}

// 导出类
export { BaseAgent } from './BaseAgent';
export { DirectorAgent } from './DirectorAgent';
export { DesignerAgent } from './DesignerAgent';
export { IllustratorAgent } from './IllustratorAgent';
export { CopywriterAgent } from './CopywriterAgent';
export { AnimatorAgent } from './AnimatorAgent';
export { ResearcherAgent } from './ResearcherAgent';

// 导入类型用于函数
import type { AgentType } from '../types/agent';
import { BaseAgent } from './BaseAgent';
import { DirectorAgent } from './DirectorAgent';
import { DesignerAgent } from './DesignerAgent';
import { IllustratorAgent } from './IllustratorAgent';
import { CopywriterAgent } from './CopywriterAgent';
import { AnimatorAgent } from './AnimatorAgent';
import { ResearcherAgent } from './ResearcherAgent';

// Agent 工厂
export function createAgent(type: AgentType): BaseAgent {
  switch (type) {
    case 'director':
      return new DirectorAgent();
    case 'designer':
      return new DesignerAgent();
    case 'illustrator':
      return new IllustratorAgent();
    case 'copywriter':
      return new CopywriterAgent();
    case 'animator':
      return new AnimatorAgent();
    case 'researcher':
      return new ResearcherAgent();
    default:
      throw new Error(`Unknown agent type: ${type}`);
  }
}

// 获取所有 Agent 类型
export function getAllAgentTypes(): AgentType[] {
  return ['director', 'designer', 'illustrator', 'copywriter', 'animator', 'researcher'];
}

// 获取所有 Agent 信息
export function getAllAgentInfo(): AgentInfo[] {
  return [
    {
      type: 'director',
      name: '津脉设计总监',
      description: '统筹全局，负责需求分析、任务分配和项目质量把控',
      color: '#FFD700'
    },
    {
      type: 'designer',
      name: '津脉品牌设计师',
      description: '专注视觉设计和图像生成，擅长品牌视觉、海报设计、包装设计等',
      color: '#4A90E2'
    },
    {
      type: 'illustrator',
      name: '津脉插画师',
      description: '擅长手绘风格、角色设计和概念插画',
      color: '#E74C3C'
    },
    {
      type: 'copywriter',
      name: '津脉文案策划',
      description: '专注品牌文案、标语创作和内容策划',
      color: '#9B59B6'
    },
    {
      type: 'animator',
      name: '津脉动画师',
      description: '擅长动效设计、视频制作和表情包创作',
      color: '#1ABC9C'
    },
    {
      type: 'researcher',
      name: '津脉研究员',
      description: '专注市场调研、竞品分析和趋势研究',
      color: '#34495E'
    }
  ];
}
