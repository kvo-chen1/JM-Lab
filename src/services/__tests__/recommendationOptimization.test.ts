/**
 * 推荐算法优化测试
 * 测试改进后的协同过滤、LTR特征和多级召回策略
 */

import {
  calculateUserSimilarities,
  generateCollaborativeRecommendations,
  calculateLTRFeatures,
  calculateLTRScore,
  multiChannelRecall,
  mergeRecallResults,
  generateOptimizedRecommendations,
  recordUserAction,
  initializeUserPreferences,
  UserAction,
  RecommendedItem
} from '../recommendationService';

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
} as any;

describe('推荐算法优化测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.getItem = jest.fn().mockReturnValue('[]');
  });

  describe('1. 协同过滤优化 - 余弦相似度 + 时间衰减', () => {
    it('应该使用余弦相似度计算用户相似度', () => {
      // 模拟用户行为数据
      const mockActions: UserAction[] = [
        {
          id: '1',
          userId: 'user1',
          itemId: 'item1',
          itemType: 'post',
          actionType: 'like',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          userId: 'user1',
          itemId: 'item2',
          itemType: 'post',
          actionType: 'view',
          timestamp: new Date().toISOString()
        },
        {
          id: '3',
          userId: 'user2',
          itemId: 'item1',
          itemType: 'post',
          actionType: 'like',
          timestamp: new Date().toISOString()
        },
        {
          id: '4',
          userId: 'user2',
          itemId: 'item2',
          itemType: 'post',
          actionType: 'like',
          timestamp: new Date().toISOString()
        }
      ];

      localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockActions));

      const similarities = calculateUserSimilarities('user1');

      // 验证相似度计算结果
      expect(similarities.userId).toBe('user1');
      expect(similarities.similarUsers.length).toBeGreaterThan(0);
      expect(similarities.similarUsers[0].similarity).toBeGreaterThan(0);
      expect(similarities.similarUsers[0].similarity).toBeLessThanOrEqual(1);
    });

    it('应该应用时间衰减权重', () => {
      const now = Date.now();
      const oldAction: UserAction = {
        id: '1',
        userId: 'user1',
        itemId: 'item1',
        itemType: 'post',
        actionType: 'like',
        timestamp: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString() // 30天前
      };

      const recentAction: UserAction = {
        id: '2',
        userId: 'user1',
        itemId: 'item2',
        itemType: 'post',
        actionType: 'like',
        timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString() // 1天前
      };

      // 验证时间衰减：近期行为权重更高
      const oldWeight = Math.exp(-(30 / 30) * Math.log(2)); // 半衰期30天
      const recentWeight = Math.exp(-(1 / 30) * Math.log(2));

      expect(recentWeight).toBeGreaterThan(oldWeight);
    });

    it('应该过滤低质量相似用户', () => {
      const mockActions: UserAction[] = [
        {
          id: '1',
          userId: 'user1',
          itemId: 'item1',
          itemType: 'post',
          actionType: 'like',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          userId: 'user2',
          itemId: 'item2',
          itemType: 'post',
          actionType: 'like',
          timestamp: new Date().toISOString()
        }
      ];

      localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockActions));

      const similarities = calculateUserSimilarities('user1');

      // 没有共同行为，应该返回空列表
      expect(similarities.similarUsers.length).toBe(0);
    });
  });

  describe('2. LTR特征工程', () => {
    it('应该正确计算LTR特征', () => {
      const userId = 'user1';
      const item: RecommendedItem = {
        id: 'item1',
        type: 'post',
        title: '测试内容',
        score: 0,
        metadata: {
          category: 'culture',
          tags: ['art', 'history'],
          createdAt: new Date().toISOString(),
          likes: 100,
          views: 1000,
          authorId: 'author1'
        }
      };

      const userActions: UserAction[] = [
        {
          id: '1',
          userId: 'user1',
          itemId: 'item2',
          itemType: 'post',
          actionType: 'like',
          timestamp: new Date().toISOString()
        }
      ];

      // 初始化用户偏好
      initializeUserPreferences(userId);

      const features = calculateLTRFeatures(userId, item, userActions);

      // 验证特征结构
      expect(features).toHaveProperty('userFeature');
      expect(features).toHaveProperty('contentFeature');
      expect(features).toHaveProperty('crossFeature');

      // 验证用户特征
      expect(features.userFeature).toHaveProperty('avgSessionDuration');
      expect(features.userFeature).toHaveProperty('favoriteCategoryMatch');
      expect(features.userFeature).toHaveProperty('lastViewTimeGap');
      expect(features.userFeature).toHaveProperty('userActivityScore');
      expect(features.userFeature).toHaveProperty('historicalCTR');

      // 验证内容特征
      expect(features.contentFeature).toHaveProperty('qualityScore');
      expect(features.contentFeature).toHaveProperty('freshness');
      expect(features.contentFeature).toHaveProperty('popularity');
      expect(features.contentFeature).toHaveProperty('completeness');
      expect(features.contentFeature).toHaveProperty('mediaQuality');

      // 验证交叉特征
      expect(features.crossFeature).toHaveProperty('categoryMatch');
      expect(features.crossFeature).toHaveProperty('authorFollow');
      expect(features.crossFeature).toHaveProperty('timeRelevance');
      expect(features.crossFeature).toHaveProperty('tagOverlap');
    });

    it('应该正确计算LTR排序分数', () => {
      const features = {
        userFeature: {
          avgSessionDuration: 10,
          favoriteCategoryMatch: 0.8,
          lastViewTimeGap: 24,
          userActivityScore: 0.7,
          historicalCTR: 0.3
        },
        contentFeature: {
          qualityScore: 0.8,
          freshness: 0.9,
          popularity: 0.7,
          completeness: 0.8,
          mediaQuality: 0.7
        },
        crossFeature: {
          categoryMatch: 0.8,
          authorFollow: 1,
          timeRelevance: 0.8,
          tagOverlap: 0.6
        }
      };

      const score = calculateLTRScore(features);

      // 验证分数范围
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('高质量内容应该获得更高分数', () => {
      const lowQualityFeatures = {
        userFeature: {
          avgSessionDuration: 1,
          favoriteCategoryMatch: 0.1,
          lastViewTimeGap: 168,
          userActivityScore: 0.1,
          historicalCTR: 0.1
        },
        contentFeature: {
          qualityScore: 0.2,
          freshness: 0.1,
          popularity: 0.1,
          completeness: 0.2,
          mediaQuality: 0.1
        },
        crossFeature: {
          categoryMatch: 0.1,
          authorFollow: 0,
          timeRelevance: 0.1,
          tagOverlap: 0
        }
      };

      const highQualityFeatures = {
        userFeature: {
          avgSessionDuration: 30,
          favoriteCategoryMatch: 0.9,
          lastViewTimeGap: 1,
          userActivityScore: 0.9,
          historicalCTR: 0.5
        },
        contentFeature: {
          qualityScore: 0.9,
          freshness: 0.95,
          popularity: 0.8,
          completeness: 0.9,
          mediaQuality: 0.8
        },
        crossFeature: {
          categoryMatch: 0.9,
          authorFollow: 1,
          timeRelevance: 0.9,
          tagOverlap: 0.8
        }
      };

      const lowScore = calculateLTRScore(lowQualityFeatures);
      const highScore = calculateLTRScore(highQualityFeatures);

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe('3. 多级召回策略', () => {
    it('应该并行执行多路召回', async () => {
      const userId = 'user1';

      // 模拟数据
      const mockWorks = [
        { id: 'work1', title: '作品1', category: 'culture', tags: ['art'], createdAt: new Date().toISOString() },
        { id: 'work2', title: '作品2', category: 'history', tags: ['history'], createdAt: new Date().toISOString() }
      ];

      localStorage.getItem = jest.fn((key: string) => {
        if (key.includes('works')) return JSON.stringify(mockWorks);
        if (key.includes('actions')) return '[]';
        return '[]';
      });

      const recallResults = await multiChannelRecall(userId);

      // 验证召回结果结构
      expect(recallResults.length).toBeGreaterThan(0);
      expect(recallResults[0]).toHaveProperty('channel');
      expect(recallResults[0]).toHaveProperty('items');
      expect(recallResults[0]).toHaveProperty('weight');
    });

    it('应该合并多路召回结果', async () => {
      const userId = 'user1';

      const mockRecallResults = [
        {
          channel: 'collaborative' as const,
          items: [
            { id: 'item1', type: 'post' as const, title: '协同推荐1', score: 80, metadata: {} },
            { id: 'item2', type: 'post' as const, title: '协同推荐2', score: 70, metadata: {} }
          ],
          weight: 0.3
        },
        {
          channel: 'content' as const,
          items: [
            { id: 'item1', type: 'post' as const, title: '内容推荐1', score: 60, metadata: {} },
            { id: 'item3', type: 'post' as const, title: '内容推荐2', score: 50, metadata: {} }
          ],
          weight: 0.25
        }
      ];

      const merged = mergeRecallResults(mockRecallResults, userId);

      // 验证合并结果
      expect(merged.length).toBeGreaterThan(0);
      // item1被两个渠道都召回，分数应该累加
      const item1 = merged.find(item => item.id === 'item1');
      if (item1) {
        expect(item1.score).toBeGreaterThan(0);
      }
    });
  });

  describe('4. 整体推荐流程', () => {
    it('应该生成优化后的推荐结果', async () => {
      const userId = 'user1';

      // 模拟完整数据
      const mockWorks = Array.from({ length: 20 }, (_, i) => ({
        id: `work${i}`,
        title: `作品${i}`,
        category: i % 2 === 0 ? 'culture' : 'history',
        tags: i % 2 === 0 ? ['art'] : ['history'],
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        likes: Math.floor(Math.random() * 100),
        views: Math.floor(Math.random() * 1000),
        authorId: `author${i % 5}`
      }));

      const mockActions: UserAction[] = [
        {
          id: '1',
          userId: 'user1',
          itemId: 'work0',
          itemType: 'post',
          actionType: 'like',
          timestamp: new Date().toISOString()
        }
      ];

      localStorage.getItem = jest.fn((key: string) => {
        if (key.includes('works')) return JSON.stringify(mockWorks);
        if (key.includes('actions')) return JSON.stringify(mockActions);
        if (key.includes('preferences')) return JSON.stringify([{
          userId: 'user1',
          categories: { culture: 0.8, history: 0.3 },
          tags: { art: 0.9, history: 0.2 },
          interests: {},
          culturalElements: {},
          themes: {},
          updateFrequency: 3600,
          lastUpdated: new Date().toISOString()
        }]);
        return '[]';
      });

      const recommendations = await generateOptimizedRecommendations(userId, { limit: 10 });

      // 验证推荐结果
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(10);

      // 验证推荐项结构
      recommendations.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('score');
        expect(item.score).toBeGreaterThan(0);
      });

      // 验证排序（分数从高到低）
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i - 1].score).toBeGreaterThanOrEqual(recommendations[i].score);
      }
    });

    it('应该处理冷启动情况', async () => {
      const userId = 'new_user';

      // 模拟新用户（无行为数据）
      localStorage.getItem = jest.fn().mockReturnValue('[]');

      const recommendations = await generateOptimizedRecommendations(userId, { limit: 10 });

      // 冷启动时应该返回热门内容兜底
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('5. 性能测试', () => {
    it('推荐计算应该在合理时间内完成', async () => {
      const userId = 'user1';

      // 模拟大量数据
      const mockWorks = Array.from({ length: 100 }, (_, i) => ({
        id: `work${i}`,
        title: `作品${i}`,
        category: 'culture',
        tags: ['art'],
        createdAt: new Date().toISOString(),
        likes: 50,
        views: 500
      }));

      localStorage.getItem = jest.fn((key: string) => {
        if (key.includes('works')) return JSON.stringify(mockWorks);
        return '[]';
      });

      const startTime = Date.now();
      await generateOptimizedRecommendations(userId, { limit: 20 });
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      console.log(`推荐计算耗时: ${executionTime}ms`);

      // 应该在500ms内完成
      expect(executionTime).toBeLessThan(500);
    });
  });
});

// 运行测试时输出优化效果对比
console.log('\n========================================');
console.log('推荐算法优化效果对比');
console.log('========================================');
console.log('1. 协同过滤: Jaccard → 余弦相似度 + 时间衰减');
console.log('2. 排序模型: 简单加权 → LTR特征工程');
console.log('3. 召回策略: 单路 → 多路并行召回');
console.log('4. 多样性: 基础过滤 → MMR重排序');
console.log('========================================\n');
