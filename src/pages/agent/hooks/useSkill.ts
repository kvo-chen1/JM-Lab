/**
 * useSkill Hook
 * 在前端使用 Skill 架构的 React Hook
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ISkill, UserIntent, ExecutionContext, SkillResult, SkillCategory, SkillMatchResult } from '../types/skill';
import type { AgentMessage, AgentType } from '../types/agent';
import {
  getSkillRegistry,
  getSkillMatcher,
  SkillRegistry,
  SkillMatcher
} from '../skills/registry';
import { getAgentSkills, isSkillSupportedByAgent } from '../config/agentSkillConfig';

// Hook 返回的状态类型
interface UseSkillState {
  isProcessing: boolean;
  error: string | null;
  lastResult: SkillResult | null;
}

// Hook 配置选项
interface UseSkillOptions {
  userId?: string;
  sessionId?: string;
  currentAgent?: AgentType;  // 当前 Agent 类型，用于 Skill 匹配
  autoRegisterDefaultSkills?: boolean;
}

// 执行选项
interface ExecuteOptions {
  message: string;
  history?: AgentMessage[];
  parameters?: Record<string, any>;
  currentAgent?: AgentType;
}

export function useSkill(options: UseSkillOptions = {}) {
  const {
    userId = 'anonymous',
    sessionId = 'default',
    currentAgent,
    autoRegisterDefaultSkills = true
  } = options;

  // 状态
  const [state, setState] = useState<UseSkillState>({
    isProcessing: false,
    error: null,
    lastResult: null
  });

  // 使用 ref 保持 registry 和 matcher 的稳定性
  const registryRef = useRef<SkillRegistry>(getSkillRegistry());
  const matcherRef = useRef<SkillMatcher>(getSkillMatcher(registryRef.current));

  // 自动注册默认 Skill
  useEffect(() => {
    if (autoRegisterDefaultSkills) {
      // 延迟加载以避免循环依赖
      import('../services').then(({ 
        IntentRecognitionSkill, 
        ImageGenerationSkill,
        TextGenerationSkill,
        RequirementAnalysisSkill 
      }) => {
        const registry = registryRef.current;
        
        // 只注册尚未存在的 Skill
        if (!registry.hasSkill('intent-recognition')) {
          registry.register(new IntentRecognitionSkill(), 100);
        }
        if (!registry.hasSkill('image-generation')) {
          registry.register(new ImageGenerationSkill(), 90);
        }
        if (!registry.hasSkill('text-generation')) {
          registry.register(new TextGenerationSkill(), 80);
        }
        if (!registry.hasSkill('requirement-analysis')) {
          registry.register(new RequirementAnalysisSkill(), 70);
        }
      });
    }
  }, [autoRegisterDefaultSkills]);

  /**
   * 执行 Skill
   */
  const executeSkill = useCallback(async (
    skillId: string,
    executeOptions: ExecuteOptions
  ): Promise<SkillResult> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const skill = registryRef.current.getSkill(skillId);
      
      if (!skill) {
        throw new Error(`Skill not found: ${skillId}`);
      }

      const context: ExecutionContext = {
        userId,
        sessionId,
        message: executeOptions.message,
        history: executeOptions.history || [],
        currentAgent: executeOptions.currentAgent as any,
        parameters: executeOptions.parameters
      };

      const result = await skill.execute(context);

      setState({
        isProcessing: false,
        error: null,
        lastResult: result
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '执行失败';
      
      setState({
        isProcessing: false,
        error: errorMessage,
        lastResult: null
      });

      throw err;
    }
  }, [userId, sessionId]);

  /**
   * 识别意图并执行最佳匹配的 Skill
   */
  const processMessage = useCallback(async (
    message: string,
    processOptions: Omit<ExecuteOptions, 'message'> = {}
  ): Promise<SkillResult> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // 1. 先使用意图识别 Skill
      const intentSkill = registryRef.current.getSkill('intent-recognition');
      
      if (!intentSkill) {
        throw new Error('意图识别 Skill 未注册');
      }

      const intentContext: ExecutionContext = {
        userId,
        sessionId,
        message,
        history: processOptions.history || []
      };

      const intentResult = await intentSkill.execute(intentContext);

      if (!intentResult.success || !intentResult.metadata) {
        throw new Error('意图识别失败');
      }

      const userIntent: UserIntent = {
        type: intentResult.metadata.intent,
        confidence: intentResult.metadata.confidence,
        keywords: intentResult.metadata.keywords || [],
        entities: intentResult.metadata.entities || {},
        rawMessage: message,
        clarificationNeeded: intentResult.metadata.clarificationNeeded,
        suggestedResponse: intentResult.metadata.suggestedResponse
      };

      // 2. 如果需要澄清，直接返回
      if (userIntent.clarificationNeeded) {
        const clarificationResult: SkillResult = {
          success: true,
          content: userIntent.suggestedResponse || '能否详细描述一下您的需求？',
          type: 'text',
          metadata: { 
            intent: userIntent.type,
            clarificationNeeded: true 
          }
        };

        setState({
          isProcessing: false,
          error: null,
          lastResult: clarificationResult
        });

        return clarificationResult;
      }

      // 3. 匹配最佳 Skill（传入 currentAgent 进行过滤）
      const executionContextForMatch: ExecutionContext = {
        userId,
        sessionId,
        message,
        history: processOptions.history || [],
        currentAgent: processOptions.currentAgent || currentAgent,
        parameters: processOptions.parameters
      };
      
      const matches = matcherRef.current.match(userIntent, executionContextForMatch);
      
      if (matches.length === 0) {
        throw new Error('未找到匹配的 Skill');
      }

      const bestMatch = matches[0];

      // 4. 执行最佳匹配的 Skill
      const context: ExecutionContext = {
        userId,
        sessionId,
        message,
        history: processOptions.history || [],
        currentAgent: processOptions.currentAgent as any,
        parameters: {
          ...processOptions.parameters,
          ...userIntent.entities
        }
      };

      const result = await bestMatch.skill.execute(context);

      setState({
        isProcessing: false,
        error: null,
        lastResult: result
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '处理失败';
      
      setState({
        isProcessing: false,
        error: errorMessage,
        lastResult: null
      });

      throw err;
    }
  }, [userId, sessionId]);

  /**
   * 获取所有可用的 Skill
   */
  const getAvailableSkills = useCallback((): ISkill[] => {
    return registryRef.current.getAllSkills();
  }, []);

  /**
   * 获取当前 Agent 可用的 Skill
   */
  const getAgentAvailableSkills = useCallback((): ISkill[] => {
    const agent = currentAgent;
    if (!agent || agent === 'system' || agent === 'user') {
      return registryRef.current.getAllSkills();
    }
    
    const allSkills = registryRef.current.getAllSkills();
    return allSkills.filter(skill => {
      const metadata = skill.getMetadata();
      return metadata.supportedAgents.includes(agent) ||
             metadata.supportedAgents.includes('system');
    });
  }, [currentAgent]);

  /**
   * 按分类获取 Skill
   */
  const getSkillsByCategory = useCallback((category: SkillCategory): ISkill[] => {
    return registryRef.current.getSkillsByCategory(category);
  }, []);

  /**
   * 匹配意图（不执行）
   */
  const matchIntent = useCallback((intent: UserIntent): SkillMatchResult[] => {
    return matcherRef.current.match(intent);
  }, []);

  /**
   * 注册自定义 Skill
   */
  const registerSkill = useCallback((skill: ISkill, priority?: number): void => {
    registryRef.current.register(skill, priority);
  }, []);

  /**
   * 获取 Skill 统计
   */
  const getSkillStats = useCallback((skillId: string) => {
    return registryRef.current.getStats(skillId);
  }, []);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // 状态
    isProcessing: state.isProcessing,
    error: state.error,
    lastResult: state.lastResult,
    currentAgent,  // 暴露当前 Agent

    // 方法
    executeSkill,
    processMessage,
    getAvailableSkills,
    getAgentAvailableSkills,  // 获取当前 Agent 可用的 Skill
    getSkillsByCategory,
    matchIntent,
    registerSkill,
    getSkillStats,
    clearError,

    // 原始对象（高级使用）
    registry: registryRef.current,
    matcher: matcherRef.current
  };
}

export default useSkill;
