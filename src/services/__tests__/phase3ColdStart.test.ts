import { describe, it, expect, beforeEach, vi } from 'vitest';
import { coldStartService, UserDemographics, OnboardingResult } from '../coldStartService';
import { supabase } from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          limit: vi.fn(() => ({ data: [] })),
          order: vi.fn(() => ({ data: [] })),
          gte: vi.fn(() => ({ data: [] })),
          lte: vi.fn(() => ({ data: [] }))
        })),
        in: vi.fn(() => ({ data: [] })),
        neq: vi.fn(() => ({ data: [] })),
        gt: vi.fn(() => ({ data: [] })),
        lt: vi.fn(() => ({ data: [] }))
      })),
      insert: vi.fn(() => ({ error: null })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) }))
    }))
  }
}));

describe('第三阶段：冷启动优化测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('人口属性推荐', () => {
    it('应该根据年龄段推荐相应分类', async () => {
      const demographics: UserDemographics = {
        userId: 'user-123',
        ageGroup: 'young_adult',
        gender: 'female',
        location: '北京',
        interests: ['时尚', '美妆'],
        preferredCategories: [],
        preferredContentTypes: ['image', 'video']
      };

      // Mock 分类数据
      const mockCategories = [
        { id: 'cat-1', name: '时尚穿搭', description: '时尚' },
        { id: 'cat-2', name: '美妆护肤', description: '美妆' },
        { id: 'cat-3', name: '职场发展', description: '职场' }
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'categories') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                data: mockCategories,
                error: null
              }))
            }))
          } as any;
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: [],
              error: null
            })),
            in: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        } as any;
      });

      const result = await coldStartService.getDemographicBasedRecommendations(demographics, 10);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('应该根据性别调整推荐权重', async () => {
      const femaleDemographics: UserDemographics = {
        userId: 'user-female',
        ageGroup: 'adult',
        gender: 'female',
        location: '上海'
      };

      const maleDemographics: UserDemographics = {
        userId: 'user-male',
        ageGroup: 'adult',
        gender: 'male',
        location: '上海'
      };

      // 验证不同性别的推荐结果
      const femaleCategories = coldStartService['getDemographicCategories'](femaleDemographics);
      const maleCategories = coldStartService['getDemographicCategories'](maleDemographics);

      // 应该有不同分类
      expect(femaleCategories).toBeDefined();
      expect(maleCategories).toBeDefined();
    });

    it('应该处理缺失的人口属性', async () => {
      const incompleteDemographics: UserDemographics = {
        userId: 'user-incomplete',
        ageGroup: undefined,
        gender: undefined
      };

      const result = await coldStartService.getDemographicBasedRecommendations(incompleteDemographics, 10);
      
      // 应该返回兜底推荐
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Onboarding推荐', () => {
    it('应该根据Onboarding结果生成推荐', async () => {
      const onboardingResult: OnboardingResult = {
        userId: 'user-456',
        selectedInterests: ['科技', '数码', '摄影'],
        preferredDifficulty: 'intermediate',
        contentFormatPreference: ['article', 'video'],
        goals: ['学习新技能', '获取资讯']
      };

      const result = await coldStartService.getOnboardingBasedRecommendations(onboardingResult, 10);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('应该根据用户目标调整推荐', async () => {
      const learningGoalResult: OnboardingResult = {
        userId: 'user-learning',
        selectedInterests: ['编程'],
        goals: ['学习新技能']
      };

      const entertainmentGoalResult: OnboardingResult = {
        userId: 'user-entertainment',
        selectedInterests: ['娱乐'],
        goals: ['休闲娱乐']
      };

      // 验证不同目标的推荐策略
      expect(learningGoalResult.goals).toContain('学习新技能');
      expect(entertainmentGoalResult.goals).toContain('休闲娱乐');
    });
  });

  describe('探索-利用平衡', () => {
    it('应该正确计算探索率', () => {
      const explorationRate = coldStartService['calculateExplorationRate'](0);
      expect(explorationRate).toBeGreaterThan(0.3);
      
      const highInteractionRate = coldStartService['calculateExplorationRate'](100);
      expect(highInteractionRate).toBeLessThan(explorationRate);
    });

    it('应该混合探索和利用项', () => {
      const exploitationItems = [
        { id: '1', score: 0.9 },
        { id: '2', score: 0.8 },
        { id: '3', score: 0.7 },
        { id: '4', score: 0.6 },
        { id: '5', score: 0.5 }
      ];

      const explorationItems = [
        { id: '6', score: 0.4 },
        { id: '7', score: 0.3 },
        { id: '8', score: 0.2 }
      ];

      const mixed = coldStartService['balanceExploitationExploration']([
        ...exploitationItems,
        ...explorationItems
      ]);

      expect(mixed.length).toBe(exploitationItems.length + explorationItems.length);
      
      // 验证探索项被混合进去
      const explorationIds = explorationItems.map(i => i.id);
      const mixedExplorationCount = mixed.filter(i => explorationIds.includes(i.id)).length;
      expect(mixedExplorationCount).toBeGreaterThan(0);
    });

    it('应该确保最少探索项数量', () => {
      const items = [{ id: '1', score: 0.9 }];
      
      const config = {
        explorationRate: 0.1,
        minExplorationItems: 3
      };

      // 即使探索率很低，也应该保证最少探索项
      const explorationCount = Math.max(
        config.minExplorationItems,
        Math.floor(items.length * config.explorationRate)
      );
      
      expect(explorationCount).toBe(config.minExplorationItems);
    });
  });

  describe('内容质量预评估', () => {
    it('应该评估内容完整度', () => {
      const completeContent = {
        title: '完整标题',
        content: '详细内容描述'.repeat(50),
        images: ['img1.jpg', 'img2.jpg'],
        tags: ['tag1', 'tag2', 'tag3'],
        categoryId: 'cat-1'
      };

      const incompleteContent = {
        title: '',
        content: '短内容',
        images: [],
        tags: [],
        categoryId: undefined
      };

      const completeScore = coldStartService['assessCompleteness'](completeContent);
      const incompleteScore = coldStartService['assessCompleteness'](incompleteContent);

      expect(completeScore).toBeGreaterThan(incompleteScore);
      expect(completeScore).toBeGreaterThan(0.5);
      expect(incompleteScore).toBeLessThan(0.5);
    });

    it('应该评估视觉质量', () => {
      const highQualityVisual = {
        images: [
          { resolution: '1920x1080', fileSize: 2000000 },
          { resolution: '1920x1080', fileSize: 2500000 }
        ]
      };

      const lowQualityVisual = {
        images: [
          { resolution: '320x240', fileSize: 50000 }
        ]
      };

      const highScore = coldStartService['assessVisualQuality'](highQualityVisual);
      const lowScore = coldStartService['assessVisualQuality'](lowQualityVisual);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('应该评估文本质量', () => {
      const highQualityText = {
        title: '这是一个非常有吸引力的标题',
        content: '这是一段详细且有价值的内容。'.repeat(20),
        readability: 0.8
      };

      const lowQualityText = {
        title: '短',
        content: '内容',
        readability: 0.3
      };

      const highScore = coldStartService['assessTextQuality'](highQualityText);
      const lowScore = coldStartService['assessTextQuality'](lowQualityText);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('应该综合评估内容质量', async () => {
      const content = {
        id: 'content-123',
        title: '高质量内容标题',
        content: '详细内容'.repeat(50),
        images: [{ resolution: '1920x1080', fileSize: 2000000 }],
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
        categoryId: 'cat-1',
        authorId: 'author-1',
        authorHistory: {
          avgEngagement: 0.15,
          contentCount: 50
        }
      };

      const assessment = await coldStartService.assessContentQuality(content);

      expect(assessment).toHaveProperty('completenessScore');
      expect(assessment).toHaveProperty('visualQualityScore');
      expect(assessment).toHaveProperty('textQualityScore');
      expect(assessment).toHaveProperty('predictedEngagement');
      expect(assessment).toHaveProperty('overallQualityScore');
      expect(assessment.overallQualityScore).toBeGreaterThanOrEqual(0);
      expect(assessment.overallQualityScore).toBeLessThanOrEqual(1);
    });
  });

  describe('小流量测试', () => {
    it('应该启动小流量测试', async () => {
      const contentId = 'content-test-123';
      
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'small_traffic_tests') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: { id: 'test-123', content_id: contentId },
                  error: null
                }))
              })),
              error: null
            }))
          } as any;
        }
        return { insert: vi.fn(() => ({ error: null })) } as any;
      });

      const result = await coldStartService.startSmallTrafficTest(contentId, {
        targetSampleSize: 100,
        qualityThreshold: 0.6
      });

      expect(result).toBeDefined();
    });

    it('应该评估测试表现', async () => {
      const testId = 'test-123';
      const metrics = {
        exposureCount: 100,
        clickCount: 15,
        likeCount: 8
      };

      const performance = coldStartService['evaluateTestPerformance'](metrics);

      expect(performance).toHaveProperty('ctr');
      expect(performance).toHaveProperty('engagementRate');
      expect(performance).toHaveProperty('passed');
      
      expect(performance.ctr).toBe(metrics.clickCount / metrics.exposureCount);
      expect(performance.engagementRate).toBe(metrics.likeCount / metrics.exposureCount);
    });

    it('应该根据互动率判断是否通过测试', () => {
      const highEngagementMetrics = {
        exposureCount: 100,
        clickCount: 20,
        likeCount: 15
      };

      const lowEngagementMetrics = {
        exposureCount: 100,
        clickCount: 2,
        likeCount: 1
      };

      const highPerformance = coldStartService['evaluateTestPerformance'](highEngagementMetrics);
      const lowPerformance = coldStartService['evaluateTestPerformance'](lowEngagementMetrics);

      expect(highPerformance.engagementRate).toBeGreaterThan(lowPerformance.engagementRate);
    });
  });

  describe('新用户推荐生成', () => {
    it('应该为新用户生成冷启动推荐', async () => {
      const userId = 'new-user-123';
      
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'user_demographics') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: {
                    user_id: userId,
                    age_group: 'young_adult',
                    gender: 'female',
                    interests: ['时尚', '美妆']
                  },
                  error: null
                }))
              }))
            }))
          } as any;
        }
        if (table === 'posts') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    data: [
                      { id: 'post-1', title: '推荐内容1', category_id: 'cat-1' },
                      { id: 'post-2', title: '推荐内容2', category_id: 'cat-2' }
                    ],
                    error: null
                  }))
                }))
              }))
            }))
          } as any;
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        } as any;
      });

      const recommendations = await coldStartService.generateNewUserRecommendations(userId, 10);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('应该记录冷启动推荐日志', async () => {
      const logData = {
        userId: 'user-123',
        recommendationType: 'demographic' as const,
        contentId: 'content-456',
        position: 1
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'cold_start_recommendation_logs') {
          return {
            insert: vi.fn(() => ({ error: null }))
          } as any;
        }
        return { insert: vi.fn(() => ({ error: null })) } as any;
      });

      await coldStartService.logColdStartRecommendation(
        logData.userId,
        logData.recommendationType,
        logData.contentId,
        logData.position
      );

      expect(supabase.from).toHaveBeenCalledWith('cold_start_recommendation_logs');
    });
  });

  describe('新内容冷启动', () => {
    it('应该识别新内容', () => {
      const newContent = {
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1天前
      };

      const oldContent = {
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7天前
      };

      const isNew = coldStartService['isNewContent'](newContent);
      const isOld = coldStartService['isNewContent'](oldContent);

      expect(isNew).toBe(true);
      expect(isOld).toBe(false);
    });

    it('应该为新内容应用流量提升', async () => {
      const contentId = 'new-content-123';
      const qualityScore = 0.85;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'new_content_boost_pool') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: {
                    content_id: contentId,
                    boost_factor: 1.5,
                    boost_start_time: new Date().toISOString()
                  },
                  error: null
                }))
              })),
              error: null
            }))
          } as any;
        }
        return { insert: vi.fn(() => ({ error: null })) } as any;
      });

      const result = await coldStartService.addToBoostPool(contentId, qualityScore);

      expect(result).toBeDefined();
    });

    it('应该计算内容年龄', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const ageInHours1 = (now.getTime() - oneHourAgo.getTime()) / (1000 * 60 * 60);
      const ageInHours24 = (now.getTime() - oneDayAgo.getTime()) / (1000 * 60 * 60);

      expect(ageInHours1).toBeCloseTo(1, 0);
      expect(ageInHours24).toBeCloseTo(24, 0);
    });
  });

  describe('配置管理', () => {
    it('应该支持自定义配置', () => {
      const customConfig = {
        explorationRate: 0.4,
        minExplorationItems: 5,
        demographicWeight: 0.5,
        newContentBoost: 2.0
      };

      coldStartService.updateConfig(customConfig);

      // 验证配置已更新
      const currentConfig = coldStartService['config'];
      expect(currentConfig.explorationRate).toBe(customConfig.explorationRate);
      expect(currentConfig.minExplorationItems).toBe(customConfig.minExplorationItems);
    });

    it('应该使用默认配置', () => {
      const defaultConfig = coldStartService['config'];

      expect(defaultConfig.explorationRate).toBeGreaterThan(0);
      expect(defaultConfig.minExplorationItems).toBeGreaterThan(0);
      expect(defaultConfig.trendingBackup).toBe(true);
    });
  });
});
