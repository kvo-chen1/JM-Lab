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
