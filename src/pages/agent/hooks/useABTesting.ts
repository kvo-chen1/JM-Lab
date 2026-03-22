import { useEffect, useState, useCallback, useRef } from 'react';
import { abTestingFramework, Experiment, Variant } from '../services/abTesting';

// 定义实验配置
const EXPERIMENTS: Record<string, Partial<Experiment>> = {
  // 建议面板位置实验
  'suggestion-panel-position': {
    id: 'suggestion-panel-position',
    name: '建议面板位置',
    description: '测试建议面板在顶部还是底部效果更好',
    variants: [
      { id: 'top', name: '顶部', type: 'control', trafficPercentage: 50, config: {} } as Variant,
      { id: 'bottom', name: '底部', type: 'treatment', trafficPercentage: 50, config: {} } as Variant
    ],
    status: 'running',
    type: 'ab_test',
    metrics: [
      { name: 'click_rate', type: 'conversion', isPrimary: true, description: '点击率' }
    ],
    audience: { type: 'all' },
    trafficAllocation: { type: 'percentage', percentage: 100 },
    schedule: { startDate: new Date().toISOString(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
  },
  // 智能建议数量实验
  'suggestion-count': {
    id: 'suggestion-count',
    name: '智能建议数量',
    description: '测试显示多少条建议效果最好',
    variants: [
      { id: '2', name: '2条', type: 'control', trafficPercentage: 33, config: {} } as Variant,
      { id: '3', name: '3条', type: 'treatment', trafficPercentage: 33, config: {} } as Variant,
      { id: '5', name: '5条', type: 'treatment', trafficPercentage: 34, config: {} } as Variant
    ],
    status: 'running',
    type: 'ab_test',
    metrics: [
      { name: 'engagement', type: 'conversion', isPrimary: true, description: '用户参与度' }
    ],
    audience: { type: 'all' },
    trafficAllocation: { type: 'percentage', percentage: 100 },
    schedule: { startDate: new Date().toISOString(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
  },
  // 消息样式实验
  'message-style': {
    id: 'message-style',
    name: '消息样式',
    description: '测试不同的消息气泡样式',
    variants: [
      { id: 'modern', name: '现代风格', type: 'control', trafficPercentage: 50, config: {} } as Variant,
      { id: 'classic', name: '经典风格', type: 'treatment', trafficPercentage: 50, config: {} } as Variant
    ],
    status: 'running',
    type: 'ab_test',
    metrics: [
      { name: 'satisfaction', type: 'conversion', isPrimary: true, description: '用户满意度' }
    ],
    audience: { type: 'all' },
    trafficAllocation: { type: 'percentage', percentage: 100 },
    schedule: { startDate: new Date().toISOString(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
  },
  // 智能建议类型实验 - 新增
  'intelligent-suggestion-types': {
    id: 'intelligent-suggestion-types',
    name: '智能建议类型效果',
    description: '测试不同类型的智能建议（Prompt优化、元素推荐、案例匹配）的点击率',
    variants: [
      { 
        id: 'all-types', 
        name: '全部类型', 
        type: 'control', 
        trafficPercentage: 34, 
        config: { enabledTypes: ['prompt_optimization', 'element_suggestion', 'reference_case'] } 
      } as Variant,
      { 
        id: 'content-only', 
        name: '仅内容建议', 
        type: 'treatment', 
        trafficPercentage: 33, 
        config: { enabledTypes: ['prompt_optimization', 'reference_case'] } 
      } as Variant,
      { 
        id: 'action-only', 
        name: '仅操作建议', 
        type: 'treatment', 
        trafficPercentage: 33, 
        config: { enabledTypes: ['element_suggestion', 'one_click_optimize'] } 
      } as Variant
    ],
    status: 'running',
    type: 'ab_test',
    metrics: [
      { name: 'suggestion_click_rate', type: 'conversion', isPrimary: true, description: '建议点击率' },
      { name: 'suggestion_execute_rate', type: 'conversion', isPrimary: false, description: '建议执行率' }
    ],
    audience: { type: 'all' },
    trafficAllocation: { type: 'percentage', percentage: 100 },
    schedule: { startDate: new Date().toISOString(), endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString() }
  },
  // 建议触发时机实验 - 新增
  'suggestion-trigger-timing': {
    id: 'suggestion-trigger-timing',
    name: '建议触发时机',
    description: '测试不同触发时机（实时vs延迟）对用户体验的影响',
    variants: [
      { id: 'realtime', name: '实时触发', type: 'control', trafficPercentage: 50, config: { triggerDelay: 0 } } as Variant,
      { id: 'delayed', name: '延迟3秒', type: 'treatment', trafficPercentage: 50, config: { triggerDelay: 3000 } } as Variant
    ],
    status: 'running',
    type: 'ab_test',
    metrics: [
      { name: 'user_engagement', type: 'conversion', isPrimary: true, description: '用户参与度' },
      { name: 'suggestion_attention', type: 'conversion', isPrimary: false, description: '建议关注度' }
    ],
    audience: { type: 'all' },
    trafficAllocation: { type: 'percentage', percentage: 100 },
    schedule: { startDate: new Date().toISOString(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
  },
  // 建议展示样式实验 - 新增
  'suggestion-display-style': {
    id: 'suggestion-display-style',
    name: '建议展示样式',
    description: '测试不同展示样式（卡片vs列表）的效果',
    variants: [
      { id: 'card', name: '卡片式', type: 'control', trafficPercentage: 50, config: { displayMode: 'card' } } as Variant,
      { id: 'compact', name: '紧凑式', type: 'treatment', trafficPercentage: 50, config: { displayMode: 'compact' } } as Variant
    ],
    status: 'running',
    type: 'ab_test',
    metrics: [
      { name: 'click_rate', type: 'conversion', isPrimary: true, description: '点击率' },
      { name: 'dismiss_rate', type: 'conversion', isPrimary: false, description: '关闭率' }
    ],
    audience: { type: 'all' },
    trafficAllocation: { type: 'percentage', percentage: 100 },
    schedule: { startDate: new Date().toISOString(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
  }
};

/**
 * A/B 测试 Hook
 */
export function useABTesting() {
  const abTestingRef = useRef(abTestingFramework);
  const [isReady, setIsReady] = useState(false);

  // 初始化实验
  useEffect(() => {
    // 注册实验
    Object.values(EXPERIMENTS).forEach(config => {
      abTestingRef.current.createExperiment(config as Experiment);
    });

    setIsReady(true);
  }, []);

  // 获取实验分组
  const getVariant = useCallback((experimentId: string): Variant | null => {
    if (!isReady) return null;
    return abTestingRef.current.assignVariant(experimentId);
  }, [isReady]);

  // 追踪事件
  const trackEvent = useCallback((experimentId: string, event: string, data?: any) => {
    if (!isReady) return;
    abTestingRef.current.trackConversion(experimentId, event, data);
  }, [isReady]);

  // 获取实验结果
  const getResults = useCallback((experimentId: string) => {
    if (!isReady) return null;
    return abTestingRef.current.getExperiment(experimentId)?.results || null;
  }, [isReady]);

  return {
    isReady,
    getVariant,
    trackEvent,
    getResults,
    experiments: EXPERIMENTS
  };
}

export default useABTesting;
