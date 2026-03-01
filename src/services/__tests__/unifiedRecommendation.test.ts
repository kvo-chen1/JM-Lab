import { describe, it, expect, beforeEach, vi } from 'vitest';
import { unifiedRecommendationService } from '../unifiedRecommendationService';
import { coldStartService } from '../coldStartService';
import { realtimeRecommendationService } from '../realtimeRecommendationService';
import { diversityRerankService } from '../diversityRerankService';
import { abTestingService } from '../abTestingService';
import { feedService } from '../feedService';
import { supabase } from '../../lib/supabase';

// Mock所有依赖
vi.mock('../coldStartService', () => ({
  coldStartService: {
    generateNewUserRecommendations: vi.fn()
  }
}));

vi.mock('../realtimeRecommendationService', () => ({
  realtimeRecommendationService: {
    getRealtimeRecommendations: vi.fn(),
    collectEvent: vi.fn()
  }
}));

vi.mock('../diversityRerankService', () => ({
  diversityRerankService: {
    rerankWithMMR: vi.fn(),
    slidingWindowDiversity: vi.fn()
  }
}));

vi.mock('../abTestingService', () => ({
  abTestingService: {
    getRunningExperiments: vi.fn(),
    assignUserToVariant: vi.fn(),
    trackMetric: vi.fn()
  }
}));

vi.mock('../feedService', () => ({
  feedService: {
    getPersonalizedFeed: vi.fn()
  }
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({ data: [], error: null })),
            single: vi.fn(() => ({ data: null, error: null }))
          })),
          single: vi.fn(() => ({ data: null, error: null }))
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({ data: [], error: null }))
        }))
      })),
      insert: vi.fn(() => ({ error: null }))
    }))
  }
}));

describe('统一推荐服务集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('主推荐流程', () => {
    it('应该为新用户返回冷启动推荐', async () => {
      const userId = 'new-user-123';
      
      // Mock用户类型判断 - 新用户
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'user_actions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    data: [], // 无互动记录
                    error: null
                  }))
                })),
                single: vi.fn(() => ({
                  data: { count: 0 },
                  error: null
                }))
              }))
            }))
          } as any;
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({ data: null, error: null }))
            }))
          })),
          insert: vi.fn(() => ({ error: null }))
        } as any;
      });

      // Mock冷启动服务
      vi.mocked(coldStartService.generateNewUserRecommendations).mockResolvedValue([
        { id: 'item-1', title: '冷启动内容1', type: 'post', score: 0.8 },
        { id: 'item-2', title: '冷启动内容2', type: 'post', score: 0.7 }
      ]);

      // Mock多样性服务
      vi.mocked(diversityRerankService.slidingWindowDiversity).mockImplementation(items => items);

      // MockA/B测试
      vi.mocked(abTestingService.getRunningExperiments).mockResolvedValue([]);

      const result = await unifiedRecommendationService.getRecommendations({
        userId,
        limit: 10
      });

      expect(result).toBeDefined();
      expect(result.strategy).toBe('coldstart');
      expect(result.items).toHaveLength(2);
      expect(coldStartService.generateNewUserRecommendations).toHaveBeenCalledWith(userId, 10);
    });

    it('应该为活跃用户返回个性化推荐', async () => {
      const userId = 'active-user-123';
      
      // Mock用户类型判断 - 活跃用户
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'user_actions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    data: [{ timestamp: new Date().toISOString() }],
                    error: null
                  }))
                })),
                single: vi.fn(() => ({
                  data: { count: 100 },
                  error: null
                }))
              }))
            }))
          } as any;
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({ data: null, error: null }))
            }))
          })),
          insert: vi.fn(() => ({ error: null }))
        } as any;
      });

      // MockFeed服务
      vi.mocked(feedService.getPersonalizedFeed).mockResolvedValue({
        items: [
          { id: 'item-1', title: '个性化内容1', type: 'post', score: 0.9, source: 'collaborative' },
          { id: 'item-2', title: '个性化内容2', type: 'post', score: 0.85, source: 'content' }
        ],
        total: 2
      });

      // Mock多样性服务
      vi.mocked(diversityRerankService.slidingWindowDiversity).mockImplementation(items => items);

      // MockA/B测试
      vi.mocked(abTestingService.getRunningExperiments).mockResolvedValue([]);

      const result = await unifiedRecommendationService.getRecommendations({
        userId,
        limit: 10
      });

      expect(result).toBeDefined();
      expect(result.strategy).toBe('personalized');
      expect(feedService.getPersonalizedFeed).toHaveBeenCalled();
    });

    it('应该为休眠用户返回热门推荐', async () => {
      const userId = 'dormant-user-123';
      
      // Mock用户类型判断 - 休眠用户（30天无活动）
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'user_actions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    data: [{ timestamp: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() }],
                    error: null
                  }))
                })),
                single: vi.fn(() => ({
                  data: { count: 50 },
                  error: null
                }))
              }))
            }))
          } as any;
        }
        if (table === 'posts') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  data: [
                    { id: 'trending-1', title: '热门内容1', view_count: 5000 },
                    { id: 'trending-2', title: '热门内容2', view_count: 4000 }
                  ],
                  error: null
                }))
              }))
            }))
          } as any;
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({ data: null, error: null }))
            }))
          })),
          insert: vi.fn(() => ({ error: null }))
        } as any;
      });

      // Mock多样性服务
      vi.mocked(diversityRerankService.slidingWindowDiversity).mockImplementation(items => items);

      // MockA/B测试
      vi.mocked(abTestingService.getRunningExperiments).mockResolvedValue([]);

      const result = await unifiedRecommendationService.getRecommendations({
        userId,
        limit: 10
      });

      expect(result).toBeDefined();
      expect(result.strategy).toBe('trending');
      expect(result.items.length).toBeGreaterThan(0);
    });
  });

  describe('A/B测试集成', () => {
    it('应该检查并应用A/B测试实验', async () => {
      const userId = 'test-user-123';
      
      // MockA/B测试实验
      const mockExperiment = {
        id: 'exp-123',
        name: '推荐算法对比',
        status: 'running',
        trafficAllocation: 1.0
      };

      const mockVariant = {
        id: 'variant-1',
        name: '实验组',
        config: { strategy: 'diverse' }
      };

      vi.mocked(abTestingService.getRunningExperiments).mockResolvedValue([mockExperiment as any]);
      vi.mocked(abTestingService.assignUserToVariant).mockResolvedValue(mockVariant as any);
      vi.mocked(abTestingService.trackMetric).mockResolvedValue();

      // Mock用户类型
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'user_actions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    data: [{ timestamp: new Date().toISOString() }],
                    error: null
                  }))
                })),
                single: vi.fn(() => ({
                  data: { count: 100 },
                  error: null
                }))
              }))
            }))
          } as any;
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({ data: null, error: null }))
            }))
          })),
          insert: vi.fn(() => ({ error: null }))
        } as any;
      });

      // MockFeed服务
      vi.mocked(feedService.getPersonalizedFeed).mockResolvedValue({
        items: [{ id: 'item-1', title: '测试内容', type: 'post', score: 0.9 }],
        total: 1
      });

      vi.mocked(diversityRerankService.slidingWindowDiversity).mockImplementation(items => items);

      const result = await unifiedRecommendationService.getRecommendations({
        userId,
        limit: 10
      });

      expect(result.experimentId).toBe('exp-123');
      expect(result.variantId).toBe('variant-1');
      expect(abTestingService.trackMetric).toHaveBeenCalled();
    });
  });

  describe('多样性重排序', () => {
    it('应该应用多样性重排序', async () => {
      const userId = 'test-user-123';
      
      const mockItems = [
        { id: 'item-1', title: '内容1', type: 'post', score: 0.9, source: 'collaborative' },
        { id: 'item-2', title: '内容2', type: 'post', score: 0.85, source: 'content' },
        { id: 'item-3', title: '内容3', type: 'challenge', score: 0.8, source: 'trending' }
      ];

      // Mock用户类型
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'user_actions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    data: [{ timestamp: new Date().toISOString() }],
                    error: null
                  }))
                })),
                single: vi.fn(() => ({
                  data: { count: 100 },
                  error: null
                }))
              }))
            }))
          } as any;
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({ data: null, error: null }))
            }))
          })),
          insert: vi.fn(() => ({ error: null }))
        } as any;
      });

      vi.mocked(feedService.getPersonalizedFeed).mockResolvedValue({
        items: mockItems,
        total: 3
      });

      vi.mocked(diversityRerankService.slidingWindowDiversity).mockImplementation(items => {
        // 模拟重排序：反转顺序
        return [...items].reverse();
      });

      vi.mocked(abTestingService.getRunningExperiments).mockResolvedValue([]);

      const result = await unifiedRecommendationService.getRecommendations({
        userId,
        limit: 10
      });

      expect(diversityRerankService.slidingWindowDiversity).toHaveBeenCalled();
      expect(result.items.length).toBe(3);
    });
  });

  describe('反馈处理', () => {
    it('应该处理推荐反馈', async () => {
      const userId = 'test-user-123';
      const itemId = 'item-456';

      vi.mocked(abTestingService.getRunningExperiments).mockResolvedValue([]);
      vi.mocked(abTestingService.trackMetric).mockResolvedValue();

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        return {
          insert: vi.fn(() => ({ error: null })),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({ data: null, error: null }))
              }))
            }))
          }))
        } as any;
      });

      await unifiedRecommendationService.handleFeedback(userId, itemId, 'like');

      expect(realtimeRecommendationService.collectEvent).toHaveBeenCalledWith({
        userId,
        itemId,
        eventType: 'like',
        timestamp: expect.any(Number)
      });
    });
  });

  describe('健康检查', () => {
    it('应该返回服务健康状态', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({ data: { count: 100 }, error: null }))
            }))
          }))
        } as any;
      });

      const health = await unifiedRecommendationService.healthCheck();

      expect(health).toBeDefined();
      expect(health.status).toBe('healthy');
      expect(health.services.database).toBe(true);
      expect(health.latency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('降级策略', () => {
    it('应该在错误时降级到热门推荐', async () => {
      const userId = 'test-user-123';

      // Mock错误情况
      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error('数据库错误');
      });

      const result = await unifiedRecommendationService.getRecommendations({
        userId,
        limit: 10
      });

      expect(result).toBeDefined();
      expect(result.strategy).toBe('fallback_trending');
    });
  });

  describe('元数据计算', () => {
    it('应该正确计算多样性分数', async () => {
      const userId = 'test-user-123';
      
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'user_actions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    data: [{ timestamp: new Date().toISOString() }],
                    error: null
                  }))
                })),
                single: vi.fn(() => ({
                  data: { count: 100 },
                  error: null
                }))
              }))
            }))
          } as any;
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({ data: null, error: null }))
            }))
          })),
          insert: vi.fn(() => ({ error: null }))
        } as any;
      });

      vi.mocked(feedService.getPersonalizedFeed).mockResolvedValue({
        items: [
          { id: '1', title: '内容1', type: 'post', score: 0.9, source: 'collaborative' },
          { id: '2', title: '内容2', type: 'work', score: 0.8, source: 'content' },
          { id: '3', title: '内容3', type: 'challenge', score: 0.7, source: 'trending' }
        ],
        total: 3
      });

      vi.mocked(diversityRerankService.slidingWindowDiversity).mockImplementation(items => items);
      vi.mocked(abTestingService.getRunningExperiments).mockResolvedValue([]);

      const result = await unifiedRecommendationService.getRecommendations({
        userId,
        limit: 10
      });

      expect(result.metadata.diversityScore).toBeGreaterThan(0);
      expect(result.metadata.freshnessScore).toBeGreaterThanOrEqual(0);
      expect(result.metadata.latency).toBeGreaterThanOrEqual(0);
    });
  });
});
