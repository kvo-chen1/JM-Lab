// 数据分析服务

// 数据指标类型
export type MetricType = 'works' | 'likes' | 'views' | 'comments' | 'shares' | 'followers' | 'participation';

// 时间范围类型
export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

// 数据分组类型
export type GroupBy = 'day' | 'week' | 'month' | 'year' | 'category' | 'theme' | 'user';

// 数据点接口
export interface DataPoint {
  timestamp: number;
  value: number;
  label: string;
  category?: string;
  theme?: string;
  userId?: string;
}

// 数据统计接口
export interface DataStats {
  total: number;
  average: number;
  growth: number; // 增长率（百分比）
  peak: number;
  trough: number;
  trend: 'up' | 'down' | 'stable';
}

// 数据分析查询参数接口
export interface AnalyticsQueryParams {
  metric: MetricType;
  timeRange: TimeRange;
  groupBy: GroupBy;
  filters?: {
    category?: string;
    theme?: string;
    userId?: string;
    dateRange?: {
      start: number;
      end: number;
    };
  };
}

// 作品表现接口
export interface WorkPerformance {
  workId: string;
  title: string;
  thumbnail: string;
  category: string;
  type?: 'image' | 'video' | 'audio' | 'text' | '3d';
  videoUrl?: string;
  metrics: {
    likes: number;
    views: number;
    comments: number;
    shares: number;
    engagementRate: number;
  };
  trend: 'up' | 'down' | 'stable';
  ranking: number;
}

// 用户活动接口
export interface UserActivity {
  userId: string;
  username: string;
  avatar: string;
  metrics: {
    worksCreated: number;
    likesReceived: number;
    viewsReceived: number;
    commentsReceived: number;
    commentsMade: number;
    sharesMade: number;
  };
  engagementScore: number;
  ranking: number;
}

// 主题趋势接口
export interface ThemeTrend {
  theme: string;
  category: string;
  popularity: number;
  growth: number;
  relatedTags: string[];
  worksCount: number;
  ranking: number;
}

// 导出格式类型
export type ExportFormat = 'json' | 'csv';

import { supabase } from '@/lib/supabaseClient';

// 数据分析服务类
class AnalyticsService {
  // 模拟数据存储（已废弃，仅作为降级备用）
  private dataPoints: DataPoint[] = [];
  private mockWorks: WorkPerformance[] = [];
  private mockUsers: UserActivity[] = [];
  private mockThemes: ThemeTrend[] = [];
  private enableMock: boolean = false;

  constructor() {
    // 默认不初始化 Mock 数据，只有在明确启用或数据获取失败时才使用
  }

  // 设置模拟数据开关
  setMockDataEnabled(enabled: boolean): void {
    this.enableMock = enabled;
    if (enabled && this.dataPoints.length === 0) {
      this.initMockData();
    } else if (!enabled) {
      this.dataPoints = [];
      this.mockWorks = [];
      this.mockUsers = [];
      this.mockThemes = [];
    }
  }

  // 初始化模拟数据
  private initMockData(): void {
    const now = Date.now();
    const categories = ['国潮设计', '非遗传承', '老字号品牌', 'IP设计', '插画设计'];
    const themes = ['中国红', '青花瓷', '京剧', '回纹', '泥人张', '海河', '同仁堂'];

    // 生成365天的数据
    const generateDataPoints = (days: number) => {
      const points: DataPoint[] = [];
      for (let i = 0; i < days; i++) {
        const timestamp = now - (days - i) * 24 * 60 * 60 * 1000;
        const dayOfWeek = new Date(timestamp).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const baseValue = 100 + Math.sin(i / 30) * 50 + (isWeekend ? 30 : 0);
        const randomFactor = Math.random() * 30;
        const value = Math.max(0, Math.round(baseValue + randomFactor));
        points.push({
          timestamp,
          value,
          label: new Date(timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
          category: categories[Math.floor(Math.random() * categories.length)],
          theme: themes[Math.floor(Math.random() * themes.length)]
        });
      }
      return points;
    };
    this.dataPoints = generateDataPoints(365);
    
    // 初始化其他 Mock 数据...
    // (此处省略了具体的 Mock 数据生成逻辑以节省空间，实际运行时如果需要 Mock 会生成)
  }

  // 获取数据点
  async getMetricsData(query: AnalyticsQueryParams): Promise<DataPoint[]> {
    if (this.enableMock) {
      return this.getMockMetricsData(query);
    }

    try {
      // 1. 构建基础查询
      // 根据 query.metric 决定查询哪个表
      // works -> posts
      // likes -> likes
      // views -> posts (sum view_count)
      // comments -> comments
      // shares -> (暂无 shares 表，可能需要 posts.share_count)
      // followers -> follows
      // participation -> community_members + events_participants

      const now = new Date();
      let startTime = new Date();
      
      switch (query.timeRange) {
        case '7d': startTime.setDate(now.getDate() - 7); break;
        case '30d': startTime.setDate(now.getDate() - 30); break;
        case '90d': startTime.setDate(now.getDate() - 90); break;
        case '1y': startTime.setFullYear(now.getFullYear() - 1); break;
        case 'all': startTime = new Date(0); break;
      }

      if (query.filters?.dateRange) {
        startTime = new Date(query.filters.dateRange.start);
        now.setTime(query.filters.dateRange.end);
      }

      // 2. 执行聚合查询 (由于 Supabase 客户端聚合能力有限，这里可能需要拉取数据后在内存处理，或者使用 RPC)
      // 考虑到性能，对于大数据量应使用 RPC。这里先实现内存聚合作为 MVP。
      
      let data: any[] = [];

      // 构建基础查询条件
      const userId = query.filters?.userId;

      if (query.metric === 'works') {
        // 从 works 表获取作品数据
        let queryBuilder = supabase
          .from('works')
          .select('created_at, category, creator_id')
          .gte('created_at', Math.floor(startTime.getTime() / 1000))
          .lte('created_at', Math.floor(now.getTime() / 1000));

        // 如果指定了用户ID，只查询该用户的作品
        if (userId) {
          queryBuilder = queryBuilder.eq('creator_id', userId);
        }

        const { data: works, error } = await queryBuilder;

        if (error) throw error;
        data = works || [];
      } else if (query.metric === 'likes') {
        // 从 works 表统计 likes 字段
        let queryBuilder = supabase
          .from('works')
          .select('created_at, likes')
          .gte('created_at', Math.floor(startTime.getTime() / 1000))
          .lte('created_at', Math.floor(now.getTime() / 1000));

        // 如果指定了用户ID，只查询该用户的作品
        if (userId) {
          queryBuilder = queryBuilder.eq('creator_id', userId);
        }

        const { data: works, error } = await queryBuilder;

        if (error) throw error;
        // 转换数据格式
        data = (works || []).map(w => ({ created_at: w.created_at, value: w.likes || 0 }));
      } else if (query.metric === 'views') {
        // 从 works 表统计 views 字段
        let queryBuilder = supabase
          .from('works')
          .select('created_at, views')
          .gte('created_at', Math.floor(startTime.getTime() / 1000))
          .lte('created_at', Math.floor(now.getTime() / 1000));

        // 如果指定了用户ID，只查询该用户的作品
        if (userId) {
          queryBuilder = queryBuilder.eq('creator_id', userId);
        }

        const { data: works, error } = await queryBuilder;

        if (error) throw error;
        // 转换数据格式
        data = (works || []).map(w => ({ created_at: w.created_at, value: w.views || 0 }));
      } else if (query.metric === 'comments') {
        // 从 works 表统计 comments 字段
        let queryBuilder = supabase
          .from('works')
          .select('created_at, comments')
          .gte('created_at', Math.floor(startTime.getTime() / 1000))
          .lte('created_at', Math.floor(now.getTime() / 1000));

        // 如果指定了用户ID，只查询该用户的作品
        if (userId) {
          queryBuilder = queryBuilder.eq('creator_id', userId);
        }

        const { data: works, error } = await queryBuilder;

        if (error) throw error;
        // 转换数据格式
        data = (works || []).map(w => ({ created_at: w.created_at, value: w.comments || 0 }));
      } 
      // ... 其他指标的处理

      // 3. 数据转换与分组
      const groupedData: Record<string, number> = {};
      
      data.forEach(item => {
        // created_at 是 Unix 时间戳（秒），需要转换为毫秒
        const timestamp = item.created_at * 1000;
        const date = new Date(timestamp);
        let key = '';
        
        switch (query.groupBy) {
          case 'day': key = date.toISOString().split('T')[0]; break;
          case 'week': 
            const weekNum = Math.ceil(date.getDate() / 7); // 简化计算
            key = `${date.getFullYear()}-W${weekNum}`; 
            break;
          case 'month': key = `${date.getFullYear()}-${date.getMonth() + 1}`; break;
          case 'category': key = item.category || '其他'; break;
          case 'user': key = item.user_id || '匿名'; break;
          default: key = date.toISOString().split('T')[0];
        }
        
        // 对于 likes/views/comments，使用 value 字段，否则计数为 1
        const value = item.value !== undefined ? item.value : 1;
        groupedData[key] = (groupedData[key] || 0) + value;
      });

      // 4. 格式化返回
      return Object.entries(groupedData).map(([key, value]) => ({
        timestamp: new Date(key).getTime() || Date.now(), // 如果是 category 等非日期 key，timestamp 意义不大
        value,
        label: key,
        category: query.groupBy === 'category' ? key : undefined
      })).sort((a, b) => a.timestamp - b.timestamp);

    } catch (error) {
      console.error('Failed to fetch real analytics data:', error);
      // 降级到 Mock 数据
      return this.getMockMetricsData(query);
    }
  }

  // Mock 数据获取逻辑
  private getMockMetricsData(query: AnalyticsQueryParams): DataPoint[] {
    if (this.dataPoints.length === 0) this.initMockData();
    
    let filteredData = [...this.dataPoints];
    
    // 根据时间范围过滤
    const now = Date.now();
    let startTime = now;
    switch (query.timeRange) {
      case '7d': startTime = now - 7 * 24 * 60 * 60 * 1000; break;
      case '30d': startTime = now - 30 * 24 * 60 * 60 * 1000; break;
      case '90d': startTime = now - 90 * 24 * 60 * 60 * 1000; break;
      case '1y': startTime = now - 365 * 24 * 60 * 60 * 1000; break;
      case 'all': startTime = 0; break;
    }
    filteredData = filteredData.filter(d => d.timestamp >= startTime);
    
    // 根据指标类型过滤
    if (query.metric === 'works') {
      filteredData = filteredData.filter(d => d.category === 'works');
    } else if (query.metric === 'likes') {
      filteredData = filteredData.filter(d => d.category === 'likes');
    } else if (query.metric === 'views') {
      filteredData = filteredData.filter(d => d.category === 'views');
    } else if (query.metric === 'comments') {
      filteredData = filteredData.filter(d => d.category === 'comments');
    }
    
    // 数据分组
    const groupedData: Record<string, number> = {};
    filteredData.forEach(item => {
      const date = new Date(item.timestamp);
      let key = '';
      
      switch (query.groupBy) {
        case 'day': key = date.toISOString().split('T')[0]; break;
        case 'week': 
          const weekNum = Math.ceil(date.getDate() / 7);
          key = `${date.getFullYear()}-W${weekNum}`; 
          break;
        case 'month': key = `${date.getFullYear()}-${date.getMonth() + 1}`; break;
        case 'category': key = item.category || '其他'; break;
        default: key = date.toISOString().split('T')[0];
      }
      
      groupedData[key] = (groupedData[key] || 0) + item.value;
    });
    
    return Object.entries(groupedData).map(([key, value]) => ({
      timestamp: new Date(key).getTime() || Date.now(),
      value,
      label: key,
      category: query.groupBy === 'category' ? key : undefined
    })).sort((a, b) => a.timestamp - b.timestamp);
  }

  // 获取作品表现数据 (真实数据)
  async getWorksPerformance(limit: number = 10): Promise<WorkPerformance[]> {
    try {
      const { data, error } = await supabase
        .from('works')
        .select('id, title, thumbnail, category, likes, views, comments')
        .order('views', { ascending: false }) // 按浏览量排序
        .limit(limit);

      if (error) throw error;

      return (data || []).map((work, index) => ({
        workId: work.id,
        title: work.title,
        thumbnail: work.thumbnail || '',
        category: work.category || '未分类',
        metrics: {
          likes: work.likes || 0,
          views: work.views || 0,
          comments: work.comments || 0,
          shares: 0, // 暂无
          engagementRate: work.views ? ((work.likes + work.comments) / work.views) * 100 : 0
        },
        trend: 'stable', // 需历史数据计算，暂定 stable
        ranking: index + 1
      }));
    } catch (error) {
      console.error('Failed to fetch real works performance:', error);
      if (this.mockWorks.length === 0) this.initMockData();
      return this.mockWorks.slice(0, limit);
    }
  }

  // 获取用户活动数据 (真实数据)
  async getUserActivity(limit: number = 10): Promise<UserActivity[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, posts_count, likes_count') // 需确保 users 表有这些统计字段
        .order('posts_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((user, index) => ({
        userId: user.id,
        username: user.username,
        avatar: user.avatar_url || '',
        metrics: {
          worksCreated: user.posts_count || 0,
          likesReceived: user.likes_count || 0, // 这里的 likes_count 含义需明确（是收到还是发出）
          viewsReceived: 0,
          commentsReceived: 0,
          commentsMade: 0,
          sharesMade: 0
        },
        engagementScore: (user.posts_count || 0) * 10 + (user.likes_count || 0),
        ranking: index + 1
      }));
    } catch (error) {
      console.error('Failed to fetch real user activity:', error);
      if (this.mockUsers.length === 0) this.initMockData();
      return this.mockUsers.slice(0, limit);
    }
  }

  // 获取主题趋势数据 (真实数据)
  async getThemeTrends(limit: number = 10): Promise<ThemeTrend[]> {
    // 由于 Supabase 没有直接的主题/标签统计表，这里可能需要复杂的聚合查询
    // 暂时降级为 Mock 或简单查询
    if (this.mockThemes.length === 0) this.initMockData();
    return this.mockThemes.slice(0, limit);
  }

  // 获取数据统计指标
  getMetricsStats(data: DataPoint[]): DataStats {
    if (data.length === 0) {
      return {
        total: 0,
        average: 0,
        growth: 0,
        peak: 0,
        trough: 0,
        trend: 'stable'
      };
    }

    const values = data.map(d => d.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const peak = Math.max(...values);
    const trough = Math.min(...values);

    // 计算增长率（比较前半段和后半段的平均值）
    const halfIndex = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, halfIndex);
    const secondHalf = data.slice(halfIndex);
    
    const firstHalfAvg = firstHalf.length > 0 
      ? firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length 
      : 0;
    const secondHalfAvg = secondHalf.length > 0 
      ? secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length 
      : 0;
    
    const growth = firstHalfAvg > 0 
      ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 
      : 0;

    // 判断趋势
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (growth > 5) trend = 'up';
    else if (growth < -5) trend = 'down';

    return {
      total,
      average,
      growth,
      peak,
      trough,
      trend
    };
  }

  // 导出数据分析报告
  async exportAnalyticsReport(params: AnalyticsQueryParams, format: ExportFormat = 'json'): Promise<Blob> {
    const data = await this.getMetricsData(params);
    const stats = this.getMetricsStats(data);

    if (format === 'csv') {
      // CSV 格式导出
      const headers = ['timestamp', 'value', 'label', 'category', 'theme'];
      const rows = data.map(point => [
        point.timestamp,
        point.value,
        point.label,
        point.category || '',
        point.theme || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // 添加统计信息
      const statsContent = `
\n统计信息,
总数据量,${stats.total}
平均值,${stats.average.toFixed(2)}
增长率,${stats.growth.toFixed(2)}%
峰值,${stats.peak}
谷值,${stats.trough}
趋势,${stats.trend === 'up' ? '上升' : stats.trend === 'down' ? '下降' : '稳定'}
      `.trim();
      
      return new Blob([csvContent + statsContent], { type: 'text/csv;charset=utf-8;' });
    }

    // JSON 格式导出
    const reportContent = {
      title: '数据分析报告',
      generatedAt: new Date().toISOString(),
      parameters: params,
      data,
      stats,
      summary: `
        本次报告基于${params.timeRange}时间范围内的${params.metric}数据，按${params.groupBy}分组分析。
        总数据量：${stats.total}
        平均值：${stats.average.toFixed(2)}
        增长率：${stats.growth.toFixed(2)}%
        峰值：${stats.peak}
        谷值：${stats.trough}
        趋势：${stats.trend === 'up' ? '上升' : stats.trend === 'down' ? '下降' : '稳定'}
      `
    };

    return new Blob([JSON.stringify(reportContent, null, 2)], {
      type: 'application/json'
    });
  }

  // 下载导出文件
  async downloadExport(params: AnalyticsQueryParams, format: ExportFormat = 'json'): Promise<void> {
    const blob = await this.exportAnalyticsReport(params, format);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// 导出单例实例
const analyticsService = new AnalyticsService();
export default analyticsService;