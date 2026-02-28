/**
 * 热点数据服务 - 学习抖音"热点宝"功能
 * 提供实时热点追踪、趋势分析、个性化推荐
 * 优先使用真实数据库数据，无数据时使用模拟数据
 */

import { supabase } from '@/lib/supabase';

/**
 * 热点话题接口
 */
export interface TrendingTopic {
  id: string;
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  heatValue: number;          // 热度值
  growthRate: number;         // 增长率 (%)
  videoCount: number;         // 参与作品数
  viewCount: number;          // 总播放量
  likeCount: number;          // 总点赞数
  trend: 'rising' | 'falling' | 'stable';
  
  // 关联信息
  relatedTags: string[];
  relatedMusic?: string[];
  suggestedAngles?: string[]; // AI 生成的创作角度
  
  // 时间信息
  timeRange: '1h' | '24h' | '7d' | '30d';
  startsAt?: string;
  peaksAt?: string;
  
  // 元数据
  rank?: number;
  coverImage?: string;
}

/**
 * 热点查询参数
 */
export interface TrendingQueryParams {
  category?: string;
  subcategory?: string;
  timeRange?: '1h' | '24h' | '7d' | '30d';
  trend?: 'rising' | 'falling' | 'stable';
  limit?: number;
  offset?: number;
}

/**
 * 热点统计信息
 */
export interface TrendingStats {
  totalTopics: number;
  risingCount: number;
  fallingCount: number;
  stableCount: number;
  totalViews: number;
  totalVideos: number;
  avgGrowthRate: number;
}

/**
 * 热点数据服务类
 */
class TrendingService {
  /**
   * 获取热点话题列表
   */
  async getTrendingTopics(params: TrendingQueryParams = {}): Promise<TrendingTopic[]> {
    const {
      category,
      subcategory,
      timeRange = '24h',
      trend,
      limit = 20,
      offset = 0,
    } = params;

    try {
      let query = supabase
        .from('trending_topics')
        .select('*')
        .eq('time_range', timeRange)
        .order('heat_value', { ascending: false })
        .range(offset, offset + limit - 1);

      // 分类筛选
      if (category) {
        query = query.eq('category', category);
      }

      // 子分类筛选
      if (subcategory) {
        query = query.eq('subcategory', subcategory);
      }

      // 趋势筛选
      if (trend) {
        query = query.eq('trend', trend);
      }

      const { data, error } = await query;

      if (error) throw error;

      // 如果数据库有真实数据，使用真实数据；否则使用模拟数据
      if (data && data.length > 0) {
        return (data || []).map((item: any, index: number) => this.mapToTrendingTopic(item, index + 1));
      }
      
      // 数据库为空，返回模拟数据
      console.log('数据库无数据，使用模拟数据');
      return this.getMockTrendingTopics(params);
    } catch (error: any) {
      console.error('获取热点话题失败，使用模拟数据:', error);
      
      // 出错时返回模拟数据（开发/演示用）
      return this.getMockTrendingTopics(params);
    }
  }

  /**
   * 获取上升热点（增长率最高）
   */
  async getRisingStars(limit = 10): Promise<TrendingTopic[]> {
    try {
      const { data, error } = await supabase
        .from('trending_topics')
        .select('*')
        .eq('trend', 'rising')
        .order('growth_rate', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // 如果数据库有真实数据，使用真实数据；否则使用模拟数据
      if (data && data.length > 0) {
        return (data || []).map((item: any, index: number) => 
          this.mapToTrendingTopic(item, index + 1)
        );
      }
      
      // 数据库为空，返回模拟上升热点
      console.log('数据库无上升热点数据，使用模拟数据');
      return this.getMockRisingStars(limit);
    } catch (error: any) {
      console.error('获取上升热点失败，使用模拟数据:', error);
      return this.getMockRisingStars(limit);
    }
  }

  /**
   * 获取热点详情
   */
  async getTrendingTopicById(id: string): Promise<TrendingTopic | null> {
    try {
      const { data, error } = await supabase
        .from('trending_topics')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return this.mapToTrendingTopic(data, 0);
    } catch (error: any) {
      console.error('获取热点详情失败:', error);
      return null;
    }
  }

  /**
   * 获取热点统计信息
   */
  async getTrendingStats(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<TrendingStats> {
    try {
      const { data, error } = await supabase
        .from('trending_topics')
        .select('trend, heat_value, video_count, view_count, growth_rate')
        .eq('time_range', timeRange);

      if (error) throw error;

      const stats: TrendingStats = {
        totalTopics: data?.length || 0,
        risingCount: data?.filter(i => i.trend === 'rising').length || 0,
        fallingCount: data?.filter(i => i.trend === 'falling').length || 0,
        stableCount: data?.filter(i => i.trend === 'stable').length || 0,
        totalViews: data?.reduce((sum, i) => sum + (i.view_count || 0), 0) || 0,
        totalVideos: data?.reduce((sum, i) => sum + (i.video_count || 0), 0) || 0,
        avgGrowthRate: data?.reduce((sum, i) => sum + (i.growth_rate || 0), 0) / (data?.length || 1),
      };

      return stats;
    } catch (error: any) {
      console.error('获取热点统计失败:', error);
      return this.getMockTrendingStats(timeRange);
    }
  }

  /**
   * 搜索热点话题
   */
  async searchTrendingTopics(query: string, limit = 10): Promise<TrendingTopic[]> {
    try {
      const { data, error } = await supabase.rpc('search_trending_topics', {
        search_query: query,
        result_limit: limit,
      });

      if (error) throw error;

      return (data || []).map((item: any, index: number) => 
        this.mapToTrendingTopic(item, index + 1)
      );
    } catch (error: any) {
      console.error('搜索热点话题失败:', error);
      return [];
    }
  }

  /**
   * 记录用户行为（用于个性化推荐）
   */
  async trackUserBehavior(
    userId: string,
    topicId: string,
    actionType: 'view' | 'use' | 'complete' | 'share'
  ): Promise<void> {
    try {
      await supabase
        .from('inspiration_usage_logs')
        .insert({
          user_id: userId,
          inspiration_id: topicId,
          inspiration_type: 'trending',
          action_type: actionType,
          created_at: new Date().toISOString(),
        });
    } catch (error: any) {
      console.error('记录用户行为失败:', error);
    }
  }

  /**
   * 获取个性化热点推荐
   */
  async getPersonalizedTrending(
    userId: string,
    limit = 10
  ): Promise<TrendingTopic[]> {
    try {
      // 1. 获取用户历史行为
      const { data: userBehaviors } = await supabase
        .from('inspiration_usage_logs')
        .select('inspiration_id, action_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!userBehaviors || userBehaviors.length === 0) {
        // 新用户返回热门
        return this.getTrendingTopics({ limit });
      }

      // 2. 基于用户偏好推荐（简化版）
      const viewedTopics = userBehaviors.map(b => b.inspiration_id);
      
      const { data, error } = await supabase
        .from('trending_topics')
        .select('*')
        .not('id', 'in', `(${viewedTopics.join(',')})`)
        .order('heat_value', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((item: any, index: number) => 
        this.mapToTrendingTopic(item, index + 1)
      );
    } catch (error: any) {
      console.error('获取个性化推荐失败:', error);
      return this.getTrendingTopics({ limit });
    }
  }

  /**
   * 映射数据库对象到 TrendingTopic
   */
  private mapToTrendingTopic(item: any, rank: number): TrendingTopic {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      subcategory: item.subcategory,
      heatValue: item.heat_value || 0,
      growthRate: item.growth_rate || 0,
      videoCount: item.video_count || 0,
      viewCount: item.view_count || 0,
      likeCount: item.like_count || 0,
      trend: item.trend as 'rising' | 'falling' | 'stable',
      relatedTags: item.related_tags || [],
      relatedMusic: item.related_music || [],
      suggestedAngles: item.suggested_angles || [],
      timeRange: item.time_range as '1h' | '24h' | '7d' | '30d',
      startsAt: item.starts_at,
      peaksAt: item.peaks_at,
      rank,
      coverImage: item.cover_image,
    };
  }

  /**
   * 获取模拟数据（开发/演示用）
   */
  private getMockTrendingTopics(params: TrendingQueryParams = {}): TrendingTopic[] {
    const { category, timeRange = '24h' } = params;
    
    // 天津文化平台特色热点数据
    const mockData: TrendingTopic[] = [
      {
        id: '1',
        title: '狗不理包子制作技艺',
        description: '传承百年的天津味道，探索非遗美食的制作工艺',
        category: 'tianjin-culture',
        subcategory: 'food',
        heatValue: 280000000,
        growthRate: 15.5,
        videoCount: 1563000,
        viewCount: 680000,
        likeCount: 48000,
        trend: 'rising',
        relatedTags: ['狗不理', '包子', '传统美食', '老字号', '非遗'],
        suggestedAngles: [
          '拍摄包子制作的 18 个褶细节',
          '采访老字号传承人讲述历史',
          '对比传统与现代制作工艺',
        ],
        timeRange: timeRange,
        rank: 1,
        coverImage: '/images/trending/goubuli.jpg',
      },
      {
        id: '2',
        title: '天津之眼夜景航拍',
        description: '海河两岸灯火辉煌，展现现代天津的璀璨夜景',
        category: 'tianjin-culture',
        subcategory: 'river',
        heatValue: 190000000,
        growthRate: 12.3,
        videoCount: 982000,
        viewCount: 524000,
        likeCount: 36000,
        trend: 'rising',
        relatedTags: ['天津之眼', '夜景', '海河', '航拍', '城市风光'],
        suggestedAngles: [
          '无人机航拍天津之眼全景',
          '结合海河游船视角',
          '延时摄影展现夜景变化',
        ],
        timeRange: timeRange,
        rank: 2,
        coverImage: '/images/trending/tianjin-eye.jpg',
      },
      {
        id: '3',
        title: '天津话方言教学',
        description: '听相声学天津话，地道方言趣味教学',
        category: 'tianjin-culture',
        subcategory: 'dialect',
        heatValue: 120000000,
        growthRate: 20.8,
        videoCount: 678000,
        viewCount: 458000,
        likeCount: 32000,
        trend: 'rising',
        relatedTags: ['天津话', '方言', '相声', '教学', '传统文化'],
        suggestedAngles: [
          '相声演员教经典天津话',
          '外地人学天津话的趣事',
          '天津话与普通话对比',
        ],
        timeRange: timeRange,
        rank: 3,
        coverImage: '/images/trending/tianjin-dialect.jpg',
      },
      {
        id: '4',
        title: '泥人张非遗技艺',
        description: '一双手捏出万千世界，传统手工艺的匠心传承',
        category: 'tianjin-culture',
        subcategory: 'craft',
        heatValue: 98000000,
        growthRate: 8.5,
        videoCount: 345000,
        viewCount: 386000,
        likeCount: 29000,
        trend: 'stable',
        relatedTags: ['泥人张', '非遗', '手工艺', '泥塑', '传统技艺'],
        suggestedAngles: [
          '记录泥人张制作全过程',
          '展示经典作品背后的故事',
          '年轻传承人创新演绎',
        ],
        timeRange: timeRange,
        rank: 4,
        coverImage: '/images/trending/nirenzhang.jpg',
      },
      {
        id: '5',
        title: '五大道历史建筑',
        description: '百年洋楼故事多，探寻天津的历史印记',
        category: 'tianjin-culture',
        subcategory: 'history',
        heatValue: 75000000,
        growthRate: 10.2,
        videoCount: 456000,
        viewCount: 321000,
        likeCount: 23000,
        trend: 'rising',
        relatedTags: ['五大道', '洋楼', '历史', '建筑', '天津故事'],
        suggestedAngles: [
          '探访五大道名人故居',
          '讲述建筑背后的历史故事',
          '四季变换中的五大道美景',
        ],
        timeRange: timeRange,
        rank: 5,
        coverImage: '/images/trending/five-avenues.jpg',
      },
      {
        id: '6',
        title: '十八街麻花制作',
        description: '酥脆香甜的传统味道，老字号美食的创新之路',
        category: 'tianjin-culture',
        subcategory: 'food',
        heatValue: 62000000,
        growthRate: 5.8,
        videoCount: 289000,
        viewCount: 289000,
        likeCount: 21000,
        trend: 'stable',
        relatedTags: ['十八街麻花', '小吃', '传统', '美食', '老字号'],
        suggestedAngles: [
          '展示麻花制作的独特工艺',
          '品尝不同口味的麻花',
          '老字号的创新产品',
        ],
        timeRange: timeRange,
        rank: 6,
        coverImage: '/images/trending/mahua.jpg',
      },
      // 品牌任务数据
      {
        id: 'brand-1',
        title: '海河乳业品牌宣传视频创作',
        description: '展示海河牛奶与天津早餐文化的结合',
        category: 'brand-tasks',
        subcategory: 'food-brand',
        heatValue: 15000000,
        growthRate: 25.6,
        videoCount: 156,
        viewCount: 89000,
        likeCount: 5600,
        trend: 'rising',
        relatedTags: ['海河乳业', '品牌宣传', '短视频', '天津美食'],
        suggestedAngles: [
          '展示海河牛奶配煎饼果子的天津早餐',
          '采访海河牛奶工厂了解生产工艺',
          '创意牛奶饮品制作教程',
        ],
        timeRange: timeRange,
        rank: 1,
      },
      {
        id: 'brand-2',
        title: '天津之眼景区推广内容创作',
        description: '拍摄天津之眼夜景及周边美食推荐',
        category: 'brand-tasks',
        subcategory: 'tourism-brand',
        heatValue: 12000000,
        growthRate: 18.3,
        videoCount: 234,
        viewCount: 67000,
        likeCount: 4200,
        trend: 'rising',
        relatedTags: ['天津之眼', '景区推广', '夜景', '旅游'],
        suggestedAngles: [
          '无人机航拍天津之眼全景',
          '海河游船视角游览',
          '周边美食和住宿推荐',
        ],
        timeRange: timeRange,
        rank: 2,
      },
      {
        id: 'brand-3',
        title: '桂发祥十八街麻花创意短视频',
        description: '创意展示麻花制作过程或食用场景',
        category: 'brand-tasks',
        subcategory: 'food-brand',
        heatValue: 9800000,
        growthRate: 12.5,
        videoCount: 189,
        viewCount: 45000,
        likeCount: 3100,
        trend: 'stable',
        relatedTags: ['桂发祥', '十八街麻花', '老字号', '美食'],
        suggestedAngles: [
          '展示麻花制作的独特工艺',
          '创意麻花新吃法',
          '老字号品牌故事',
        ],
        timeRange: timeRange,
        rank: 3,
      },
      // 创作活动数据
      {
        id: 'event-1',
        title: '"津门记忆"摄影大赛',
        description: '用镜头记录天津的历史建筑与人文风情',
        category: 'creative-events',
        subcategory: 'photo',
        heatValue: 25000000,
        growthRate: 35.2,
        videoCount: 1234,
        viewCount: 156000,
        likeCount: 12500,
        trend: 'rising',
        relatedTags: ['摄影大赛', '津门记忆', '历史建筑', '人文'],
        suggestedAngles: [
          '五大道欧式建筑摄影',
          '海河两岸夜景拍摄',
          '天津老胡同纪实',
        ],
        timeRange: timeRange,
        rank: 1,
      },
      {
        id: 'event-2',
        title: '天津话创意表情包设计征集',
        description: '设计有趣的天津方言表情包，传播本土文化',
        category: 'creative-events',
        subcategory: 'design',
        heatValue: 18000000,
        growthRate: 28.6,
        videoCount: 856,
        viewCount: 98000,
        likeCount: 8900,
        trend: 'rising',
        relatedTags: ['表情包', '天津话', '方言', '创意设计'],
        suggestedAngles: [
          '经典天津话词汇表情包',
          '天津人日常对话系列',
          '方言谐音梗图文',
        ],
        timeRange: timeRange,
        rank: 2,
      },
      {
        id: 'event-3',
        title: '"海河之夜"短视频创作大赛',
        description: '拍摄海河两岸夜景及市民生活',
        category: 'creative-events',
        subcategory: 'video',
        heatValue: 15000000,
        growthRate: 22.1,
        videoCount: 567,
        viewCount: 78000,
        likeCount: 7200,
        trend: 'rising',
        relatedTags: ['短视频', '海河之夜', '夜景', '市民生活'],
        suggestedAngles: [
          '海河灯光秀延时摄影',
          '夜游海河 vlog',
          '海河两岸生活纪实',
        ],
        timeRange: timeRange,
        rank: 3,
      },
      // AI 灵感数据
      {
        id: 'ai-1',
        title: 'AI生成天津风景水墨画',
        description: '利用 AI 绘图工具创作天津地标的水墨风格作品',
        category: 'ai-inspiration',
        subcategory: 'image',
        heatValue: 8500000,
        growthRate: 45.2,
        videoCount: 2340,
        viewCount: 156000,
        likeCount: 18900,
        trend: 'rising',
        relatedTags: ['AI绘图', '水墨画', '天津风景', '数字艺术'],
        suggestedAngles: [
          '天津之眼水墨风格',
          '古文化街水墨长卷',
          '海河夜景水墨意境',
        ],
        timeRange: timeRange,
        rank: 1,
      },
      {
        id: 'ai-2',
        title: 'AI创作天津美食文案',
        description: 'AI 生成天津美食的创意文案和脚本',
        category: 'ai-inspiration',
        subcategory: 'copy',
        heatValue: 6200000,
        growthRate: 38.5,
        videoCount: 1856,
        viewCount: 98000,
        likeCount: 12300,
        trend: 'rising',
        relatedTags: ['AI文案', '天津美食', '脚本创作', '文案生成'],
        suggestedAngles: [
          '狗不理包子创意文案',
          '天津早餐文化脚本',
          '老字号品牌故事',
        ],
        timeRange: timeRange,
        rank: 2,
      },
      // 模板数据
      {
        id: 'template-1',
        title: '津门印象海报模板',
        description: '天津文化主题的海报设计模板',
        category: 'templates',
        subcategory: 'poster',
        heatValue: 12000000,
        growthRate: 15.8,
        videoCount: 23000,
        viewCount: 89000,
        likeCount: 6700,
        trend: 'stable',
        relatedTags: ['海报模板', '津门印象', '文化主题', '设计素材'],
        suggestedAngles: [
          '天津地标建筑模板',
          '传统纹样设计素材',
          '节日节气海报',
        ],
        timeRange: timeRange,
        rank: 1,
      },
      {
        id: 'template-2',
        title: '天津话搞笑配音模板',
        description: '天津方言配音的短视频模板',
        category: 'templates',
        subcategory: 'video',
        heatValue: 9800000,
        growthRate: 22.3,
        videoCount: 18000,
        viewCount: 67000,
        likeCount: 8900,
        trend: 'rising',
        relatedTags: ['视频模板', '天津话', '搞笑配音', '配音素材'],
        suggestedAngles: [
          '日常对话配音模板',
          '天津话挑战系列',
          '方言教学视频模板',
        ],
        timeRange: timeRange,
        rank: 2,
      },
    ];

    // 筛选
    let filtered = mockData;
    if (category) {
      filtered = filtered.filter(item => item.category === category);
    }

    // 按热度排序
    filtered.sort((a, b) => b.heatValue - a.heatValue);

    return filtered;
  }

  /**
   * 获取模拟上升热点
   */
  private getMockRisingStars(limit = 10): TrendingTopic[] {
    const allTrending = this.getMockTrendingTopics();
    return allTrending
      .filter(item => item.trend === 'rising')
      .sort((a, b) => b.growthRate - a.growthRate)
      .slice(0, limit);
  }

  /**
   * 获取模拟统计信息
   */
  private getMockTrendingStats(timeRange: '24h' | '7d' | '30d'): TrendingStats {
    const allTrending = this.getMockTrendingTopics({ timeRange });
    
    return {
      totalTopics: allTrending.length,
      risingCount: allTrending.filter(i => i.trend === 'rising').length,
      fallingCount: allTrending.filter(i => i.trend === 'falling').length,
      stableCount: allTrending.filter(i => i.trend === 'stable').length,
      totalViews: allTrending.reduce((sum, i) => sum + i.viewCount, 0),
      totalVideos: allTrending.reduce((sum, i) => sum + i.videoCount, 0),
      avgGrowthRate: allTrending.reduce((sum, i) => sum + i.growthRate, 0) / allTrending.length,
    };
  }
}

// 导出单例
export const trendingService = new TrendingService();
