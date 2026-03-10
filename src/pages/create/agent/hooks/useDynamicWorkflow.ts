import { useCallback, useState, useRef } from 'react';
import { dynamicWorkflowGenerator, Workflow, WorkflowStep } from '../services/dynamicWorkflowGenerator';
import { useAgentStore } from './useAgentStore';
import { toast } from 'sonner';

/**
 * 动态工作流生成 Hook
 * 根据用户需求自动生成工作流
 */
export function useDynamicWorkflow() {
  const workflowGeneratorRef = useRef(dynamicWorkflowGenerator);
  const { currentAgent, messages, currentTask } = useAgentStore();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<Workflow[]>([]);

  // 分析需求并生成工作流建议
  const analyzeAndSuggest = useCallback(async (requirement: string) => {
    setIsGenerating(true);
    try {
      // 使用 executeWorkflow 来执行分析
      const result = await workflowGeneratorRef.current.executeWorkflow('analyze_requirement', {
        requirement,
        context: { taskType: currentTask?.type }
      });
      if (result.success && result.output?.workflows) {
        setSuggestions(result.output.workflows);
        return result.output.workflows;
      }
      return [];
    } catch (error) {
      console.error('[useDynamicWorkflow] Analysis failed:', error);
      toast.error('工作流分析失败');
      return [];
    } finally {
      setIsGenerating(false);
    }
  }, [currentTask]);

  // 生成工作流
  const generateWorkflow = useCallback(async (workflowData: Partial<Workflow>) => {
    setIsGenerating(true);
    try {
      const workflow = await workflowGeneratorRef.current.generateWorkflow(workflowData);
      toast.success(`已生成工作流: ${workflow.name}`);
      return workflow;
    } catch (error) {
      console.error('[useDynamicWorkflow] Generation failed:', error);
      toast.error('工作流生成失败');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // 获取推荐的工作流模板
  const getRecommendedTemplates = useCallback(async () => {
    try {
      // 获取预定义的工作流模板
      const templates = workflowGeneratorRef.current.getPredefinedWorkflows();
      return templates;
    } catch (error) {
      console.error('[useDynamicWorkflow] Recommendation failed:', error);
      return [];
    }
  }, []);

  // 创建自定义工作流
  const createCustomWorkflow = useCallback(async (
    name: string,
    description: string,
    steps: string[]
  ) => {
    try {
      const workflow = await workflowGeneratorRef.current.createCustomWorkflow(
        name,
        description,
        steps
      );
      toast.success('自定义工作流已创建');
      return workflow;
    } catch (error) {
      console.error('[useDynamicWorkflow] Creation failed:', error);
      toast.error('创建工作流失败');
      return null;
    }
  }, []);

  return {
    isGenerating,
    suggestions,
    analyzeAndSuggest,
    generateWorkflow,
    getRecommendedTemplates,
    createCustomWorkflow
  };
}

export default useDynamicWorkflow;
