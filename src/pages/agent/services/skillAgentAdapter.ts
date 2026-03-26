/**
 * Skill Agent 适配器
 * 已弃用 - 所有功能已移至 AgentOrchestrator
 * 保留此文件是为了避免其他地方的导入错误
 */

import { OrchestratorResponse } from '../types/agent';
import { ConversationContext } from './agentOrchestrator';

/**
 * 智能处理消息
 * @deprecated 不再使用，直接返回 null 让 Orchestrator 处理
 */
export async function smartProcessMessage(
  message: string,
  context: ConversationContext
): Promise<OrchestratorResponse | null> {
  // 不再使用 Skill 快速模式，直接返回 null
  // 所有请求都由 orchestrator 处理
  return null;
}

/**
 * 使用 Agent 的 Skill 快速处理消息
 * @deprecated 不再使用
 */
export async function processWithAgentSkill(
  message: string,
  context: ConversationContext
): Promise<OrchestratorResponse | null> {
  return null;
}

/**
 * 检查是否是快速生成请求
 * @deprecated 不再使用
 */
export function isQuickGenerationRequest(message: string): boolean {
  return false;
}

/**
 * 根据意图匹配最佳 Agent
 * @deprecated 不再使用
 */
export function matchAgentByIntent(
  intentType: string,
  currentAgent: string
): string {
  return currentAgent;
}
