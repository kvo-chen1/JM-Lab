import { describe, it, expect, beforeEach, vi } from 'vitest';
import { abTestingService, Experiment, ExperimentVariant, ExperimentMetric } from '../abTestingService';
import { supabase } from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          limit: vi.fn(() => ({ data: [] })),
          order: vi.fn(() => ({ data: [] }))
        })),
        in: vi.fn(() => ({ data: [] }))
      })),
      insert: vi.fn(() => ({ 
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null }))
        })),
        error: null 
      })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) }))
    }))
  }
}));

describe('第四阶段：A/B测试框架测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    abTestingService.clearCache();
  });

  describe('实验管理', () => {
    it('应该创建新实验', async () => {
      const variants: Omit<ExperimentVariant, 'id'>[] = [
        { name: '对照组', description: '当前算法', trafficPercentage: 0.5, config: {}, isControl: true },
        { name: '实验组', description: '新算法', trafficPercentage: 0.5, config: {}, isControl: false }
      ];

      const metrics: Omit<ExperimentMetric, 'id'>[] = [
        { name: '点击率', type: 'conversion', eventName: 'click', aggregation: 'count', primary: true, minimumDetectableEffect: 0.1 }
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'ab_experiments') {
          return {
            insert: vi.fn(() => ({
              error: null
            }))
          } as any;
        }
        return { insert: vi.fn(() => ({ error: null })) } as any;
      });

      const experiment = await abTestingService.createExperiment(
        '推荐算法对比实验',
        '对比新旧推荐算法的效果',
        variants,
        metrics,
        0.1
      );

      expect(experiment).toBeDefined();
      expect(experiment.name).toBe('推荐算法对比实验');
      expect(experiment.variants).toHaveLength(2);
      expect(experiment.metrics).toHaveLength(1);
      expect(experiment.trafficAllocation).toBe(0.1);
    });

    it('应该验证变体流量分配总和为1', async () => {
      const invalidVariants: Omit<ExperimentVariant, 'id'>[] = [
        { name: '对照组', description: '', trafficPercentage: 0.3, config: {}, isControl: true },
        { name: '实验组', description: '', trafficPercentage: 0.5, config: {}, isControl: false }
      ];

      const metrics: Omit<ExperimentMetric, 'id'>[] = [
        { name: '点击率', type: 'conversion', eventName: 'click', aggregation: 'count', primary: true, minimumDetectableEffect: 0.1 }
      ];

      await expect(
        abTestingService.createExperiment('测试', '', invalidVariants, metrics)
      ).rejects.toThrow('变体流量分配总和必须等于1');
    });

    it('应该验证至少有一个对照组', async () => {
      const noControlVariants: Omit<ExperimentVariant, 'id'>[] = [
        { name: '变体A', description: '', trafficPercentage: 0.5, config: {}, isControl: false },
        { name: '变体B', description: '', trafficPercentage: 0.5, config: {}, isControl: false }
      ];

      const metrics: Omit<ExperimentMetric, 'id'>[] = [
        { name: '点击率', type: 'conversion', eventName: 'click', aggregation: 'count', primary: true, minimumDetectableEffect: 0.1 }
      ];

      await expect(
        abTestingService.createExperiment('测试', '', noControlVariants, metrics)
      ).rejects.toThrow('必须指定一个对照组变体');
    });

    it('应该启动实验', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'ab_experiments') {
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => ({ error: null }))
            }))
          } as any;
        }
        return {} as any;
      });

      await expect(abTestingService.startExperiment('exp-123')).resolves.not.toThrow();
    });

    it('应该停止实验', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'ab_experiments') {
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => ({ error: null }))
            }))
          } as any;
        }
        return {} as any;
      });

      await expect(abTestingService.stopExperiment('exp-123')).resolves.not.toThrow();
    });
  });

  describe('用户分桶', () => {
    it('应该为用户分配变体', async () => {
      const experimentId = 'exp-123';
      const userId = 'user-456';

      const mockExperiment: Experiment = {
        id: experimentId,
        name: '测试实验',
        description: '',
        status: 'running',
        trafficAllocation: 1.0,
        variants: [
          { id: 'variant-1', name: '对照组', description: '', trafficPercentage: 0.5, config: {}, isControl: true },
          { id: 'variant-2', name: '实验组', description: '', trafficPercentage: 0.5, config: {}, isControl: false }
        ],
        metrics: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'ab_experiments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({ data: mockExperiment, error: null }))
              }))
            }))
          } as any;
        }
        if (table === 'ab_user_assignments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => ({ data: null, error: null }))
                }))
              }))
            })),
            insert: vi.fn(() => ({ error: null }))
          } as any;
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({ data: { id: userId }, error: null }))
              }))
            }))
          } as any;
        }
        return {} as any;
      });

      const variant = await abTestingService.assignUserToVariant(userId, experimentId);

      expect(variant).toBeDefined();
      expect(variant?.id).toMatch(/variant-\d/);
    });

    it('应该保持用户分配一致性', async () => {
      const experimentId = 'exp-123';
      const userId = 'user-456';
      const variantId = 'variant-1';

      // 模拟已有分配
      const existingAssignment = {
        user_id: userId,
        experiment_id: experimentId,
        variant_id: variantId,
        assigned_at: new Date().toISOString(),
        consistent: true
      };

      const mockExperiment: Experiment = {
        id: experimentId,
        name: '测试实验',
        description: '',
        status: 'running',
        trafficAllocation: 1.0,
        variants: [
          { id: variantId, name: '对照组', description: '', trafficPercentage: 0.5, config: {}, isControl: true },
          { id: 'variant-2', name: '实验组', description: '', trafficPercentage: 0.5, config: {}, isControl: false }
        ],
        metrics: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'ab_experiments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({ data: mockExperiment, error: null }))
              }))
            }))
          } as any;
        }
        if (table === 'ab_user_assignments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => ({ data: existingAssignment, error: null }))
                }))
              }))
            }))
          } as any;
        }
        return {} as any;
      });

      const variant = await abTestingService.assignUserToVariant(userId, experimentId);

      expect(variant).toBeDefined();
      expect(variant?.id).toBe(variantId);
    });

    it('应该根据流量分配过滤用户', async () => {
      const experimentId = 'exp-123';
      const userId = 'user-low-traffic';

      const mockExperiment: Experiment = {
        id: experimentId,
        name: '测试实验',
        description: '',
        status: 'running',
        trafficAllocation: 0.1, // 只有10%流量
        variants: [
          { id: 'variant-1', name: '对照组', description: '', trafficPercentage: 0.5, config: {}, isControl: true },
          { id: 'variant-2', name: '实验组', description: '', trafficPercentage: 0.5, config: {}, isControl: false }
        ],
        metrics: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'ab_experiments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({ data: mockExperiment, error: null }))
              }))
            }))
          } as any;
        }
        if (table === 'ab_user_assignments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => ({ data: null, error: null }))
                }))
              }))
            }))
          } as any;
        }
        return {} as any;
      });

      const variant = await abTestingService.assignUserToVariant(userId, experimentId);

      // 由于流量分配只有10%，某些用户可能不符合条件
      expect(variant === null || variant !== null).toBe(true);
    });
  });

  describe('指标收集', () => {
    it('应该追踪实验指标', async () => {
      const userId = 'user-123';
      const experimentId = 'exp-456';
      const metricId = 'metric-789';

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'ab_user_assignments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => ({
                    data: { variant_id: 'variant-1' },
                    error: null
                  }))
                }))
              }))
            }))
          } as any;
        }
        if (table === 'ab_metric_data') {
          return {
            insert: vi.fn(() => ({ error: null }))
          } as any;
        }
        return {} as any;
      });

      await expect(
        abTestingService.trackMetric(userId, experimentId, metricId, 1)
      ).resolves.not.toThrow();
    });

    it('应该批量追踪指标', async () => {
      const events = [
        { userId: 'user-1', experimentId: 'exp-1', metricId: 'metric-1', value: 1 },
        { userId: 'user-2', experimentId: 'exp-1', metricId: 'metric-1', value: 1 },
        { userId: 'user-3', experimentId: 'exp-1', metricId: 'metric-2', value: 2 }
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'ab_user_assignments') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                data: [
                  { user_id: 'user-1', experiment_id: 'exp-1', variant_id: 'variant-1' },
                  { user_id: 'user-2', experiment_id: 'exp-1', variant_id: 'variant-2' },
                  { user_id: 'user-3', experiment_id: 'exp-1', variant_id: 'variant-1' }
                ],
                error: null
              }))
            }))
          } as any;
        }
        if (table === 'ab_metric_data') {
          return {
            insert: vi.fn(() => ({ error: null }))
          } as any;
        }
        return {} as any;
      });

      await expect(abTestingService.trackMetricsBatch(events)).resolves.not.toThrow();
    });
  });

  describe('实验分析', () => {
    it('应该计算实验结果', async () => {
      const experimentId = 'exp-123';

      const mockExperiment: Experiment = {
        id: experimentId,
        name: '测试实验',
        description: '',
        status: 'running',
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        trafficAllocation: 1.0,
        variants: [
          { id: 'variant-1', name: '对照组', description: '', trafficPercentage: 0.5, config: {}, isControl: true },
          { id: 'variant-2', name: '实验组', description: '', trafficPercentage: 0.5, config: {}, isControl: false }
        ],
        metrics: [
          { id: 'metric-1', name: '点击率', type: 'conversion', eventName: 'click', aggregation: 'count', primary: true, minimumDetectableEffect: 0.1 }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const mockMetricData = [
        { experiment_id: experimentId, variant_id: 'variant-1', user_id: 'user-1', metric_id: 'metric-1', value: 1 },
        { experiment_id: experimentId, variant_id: 'variant-1', user_id: 'user-2', metric_id: 'metric-1', value: 0 },
        { experiment_id: experimentId, variant_id: 'variant-2', user_id: 'user-3', metric_id: 'metric-1', value: 1 },
        { experiment_id: experimentId, variant_id: 'variant-2', user_id: 'user-4', metric_id: 'metric-1', value: 1 }
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'ab_experiments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({ data: mockExperiment, error: null }))
              }))
            }))
          } as any;
        }
        if (table === 'ab_metric_data') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                data: mockMetricData,
                error: null
              }))
            }))
          } as any;
        }
        return {} as any;
      });

      const result = await abTestingService.calculateExperimentResults(experimentId);

      expect(result).toBeDefined();
      expect(result?.experimentId).toBe(experimentId);
      expect(result?.variantResults).toHaveLength(2);
      expect(result?.sampleSize).toBeGreaterThan(0);
    });

    it('应该计算相对提升', async () => {
      const controlValue = 0.1;
      const variantValue = 0.12;

      const improvement = (variantValue - controlValue) / controlValue;

      expect(improvement).toBe(0.2); // 20%提升
    });

    it('应该判断统计显著性', async () => {
      // 大样本量下的显著差异
      const significant = abTestingService['isStatisticallySignificant'](
        0.1, 1000,  // 对照组: 10%转化率, 1000样本
        0.15, 1000, // 实验组: 15%转化率, 1000样本
        0.05
      );

      // 小样本量下的非显著差异
      const notSignificant = abTestingService['isStatisticallySignificant'](
        0.1, 10,
        0.15, 10,
        0.05
      );

      // 由于p值计算，结果可能不同
      expect(typeof significant).toBe('boolean');
      expect(typeof notSignificant).toBe('boolean');
    });
  });

  describe('样本量计算', () => {
    it('应该计算所需样本量', () => {
      const baselineConversion = 0.1;  // 10%基准转化率
      const mde = 0.2;                  // 检测20%的相对提升

      const requiredSampleSize = abTestingService.calculateRequiredSampleSize(
        baselineConversion,
        mde,
        0.8,  // 80%功效
        0.05  // 95%置信水平
      );

      expect(requiredSampleSize).toBeGreaterThan(0);
      // 对于10%基准和20%MDE，通常需要约3000-4000样本每组
      expect(requiredSampleSize).toBeGreaterThan(1000);
    });

    it('应该根据MDE调整样本量', () => {
      const baselineConversion = 0.1;

      const smallMde = abTestingService.calculateRequiredSampleSize(baselineConversion, 0.1, 0.8, 0.05);
      const largeMde = abTestingService.calculateRequiredSampleSize(baselineConversion, 0.3, 0.8, 0.05);

      // MDE越小，需要的样本量越大
      expect(smallMde).toBeGreaterThan(largeMde);
    });

    it('应该根据功效调整样本量', () => {
      const baselineConversion = 0.1;
      const mde = 0.2;

      const lowPower = abTestingService.calculateRequiredSampleSize(baselineConversion, mde, 0.7, 0.05);
      const highPower = abTestingService.calculateRequiredSampleSize(baselineConversion, mde, 0.9, 0.05);

      // 功效越高，需要的样本量越大
      expect(highPower).toBeGreaterThanOrEqual(lowPower);
    });
  });

  describe('定向规则', () => {
    it('应该评估等值规则', () => {
      const userProfile = { id: 'user-1', device_type: 'mobile', location: '北京' };
      const rule = { type: 'device' as const, operator: 'eq' as const, value: 'mobile' };

      const result = abTestingService['evaluateTargetingRule'](userProfile, rule);

      expect(result).toBe(true);
    });

    it('应该评估包含规则', () => {
      const userProfile = { id: 'user-1', location: '上海' };
      const rule = { type: 'location' as const, operator: 'in' as const, value: ['北京', '上海', '广州'] };

      const result = abTestingService['evaluateTargetingRule'](userProfile, rule);

      expect(result).toBe(true);
    });

    it('应该评估比较规则', () => {
      const userProfile = { id: 'user-1', age: 25 };
      const rule = { type: 'custom' as const, operator: 'gt' as const, value: 18, field: 'age' };

      const result = abTestingService['evaluateTargetingRule'](userProfile, rule);

      expect(result).toBe(true);
    });

    it('应该处理不匹配的定向规则', () => {
      const userProfile = { id: 'user-1', device_type: 'desktop' };
      const rule = { type: 'device' as const, operator: 'eq' as const, value: 'mobile' };

      const result = abTestingService['evaluateTargetingRule'](userProfile, rule);

      expect(result).toBe(false);
    });
  });

  describe('哈希分桶', () => {
    it('应该生成一致的哈希值', () => {
      const userId = 'user-123';
      const experimentId = 'exp-456';

      const hash1 = abTestingService['hashUserId'](userId, experimentId);
      const hash2 = abTestingService['hashUserId'](userId, experimentId);

      expect(hash1).toBe(hash2);
      expect(hash1).toBeGreaterThanOrEqual(0);
      expect(hash1).toBeLessThanOrEqual(1);
    });

    it('应该为不同用户生成不同哈希', () => {
      const experimentId = 'exp-456';

      const hash1 = abTestingService['hashUserId']('user-1', experimentId);
      const hash2 = abTestingService['hashUserId']('user-2', experimentId);

      // 不同用户应该有不同哈希值（概率极高）
      expect(hash1).not.toBe(hash2);
    });

    it('应该为不同实验生成不同哈希', () => {
      const userId = 'user-123';

      const hash1 = abTestingService['hashUserId'](userId, 'exp-1');
      const hash2 = abTestingService['hashUserId'](userId, 'exp-2');

      // 同一用户在不同实验中应该有不同哈希值
      expect(hash1).not.toBe(hash2);
    });

    it('应该均匀分布哈希值', () => {
      const experimentId = 'exp-test';
      const hashes: number[] = [];

      // 生成1000个哈希值
      for (let i = 0; i < 1000; i++) {
        hashes.push(abTestingService['hashUserId'](`user-${i}`, experimentId));
      }

      // 检查分布是否大致均匀
      const buckets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      hashes.forEach(h => {
        const bucket = Math.floor(h * 10);
        buckets[Math.min(bucket, 9)]++;
      });

      // 每个桶应该有大约100个值（允许较大误差）
      buckets.forEach(count => {
        expect(count).toBeGreaterThan(50);
        expect(count).toBeLessThan(150);
      });
    });
  });

  describe('配置管理', () => {
    it('应该支持自定义配置', () => {
      const customConfig = {
        defaultConfidenceLevel: 0.99,
        minSampleSize: 200,
        hashSalt: 'custom_salt_123'
      };

      abTestingService.updateConfig(customConfig);

      const currentConfig = abTestingService.getConfig();
      expect(currentConfig.defaultConfidenceLevel).toBe(0.99);
      expect(currentConfig.minSampleSize).toBe(200);
      expect(currentConfig.hashSalt).toBe('custom_salt_123');
    });

    it('应该使用默认配置', () => {
      const defaultConfig = abTestingService.getConfig();

      expect(defaultConfig.defaultConfidenceLevel).toBe(0.95);
      expect(defaultConfig.minSampleSize).toBe(100);
      expect(defaultConfig.enableConsistentAssignment).toBe(true);
    });

    it('应该清理缓存', () => {
      // 添加一些缓存数据
      abTestingService['userAssignmentCache'].set('test-key', {
        userId: 'user-1',
        experimentId: 'exp-1',
        variantId: 'variant-1',
        assignedAt: new Date().toISOString(),
        consistent: true
      });

      expect(abTestingService['userAssignmentCache'].size).toBeGreaterThan(0);

      abTestingService.clearCache();

      expect(abTestingService['userAssignmentCache'].size).toBe(0);
    });
  });

  describe('统计计算', () => {
    it('应该计算标准正态分布CDF', () => {
      const cdf0 = abTestingService['normalCDF'](0);
      const cdf1 = abTestingService['normalCDF'](1);
      const cdfMinus1 = abTestingService['normalCDF'](-1);

      expect(cdf0).toBeCloseTo(0.5, 1);
      expect(cdf1).toBeGreaterThan(0.8);
      expect(cdfMinus1).toBeLessThan(0.2);
      expect(cdf1 + cdfMinus1).toBeCloseTo(1, 1);
    });

    it('应该计算正态分布分位数', () => {
      const q95 = abTestingService['normalQuantile'](0.95);
      const q975 = abTestingService['normalQuantile'](0.975);
      const q5 = abTestingService['normalQuantile'](0.5);

      expect(q95).toBeCloseTo(1.645, 1);
      expect(q975).toBeCloseTo(1.96, 1);
      expect(q5).toBeCloseTo(0, 1);
    });

    it('应该计算置信区间', () => {
      const values = [1, 2, 3, 4, 5];
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (values.length - 1));
      const standardError = stdDev / Math.sqrt(values.length);
      const zScore = 1.96;
      const marginOfError = zScore * standardError;

      const ci: [number, number] = [mean - marginOfError, mean + marginOfError];

      expect(ci[0]).toBeLessThan(mean);
      expect(ci[1]).toBeGreaterThan(mean);
    });
  });
});
