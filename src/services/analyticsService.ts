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

// 数据分析服务类
class AnalyticsService {
  // 模拟数据存储
  private dataPoints: DataPoint[] = [];
  private nextDataPointId = 1;

  constructor() {
    this.initMockData();
  }

  // 初始化模拟数据
  private initMockData(): void {
    // 禁用模拟数据，初始为空数组
    this.dataPoints = [];
    
    // 如果需要保留模拟数据逻辑，可以加一个开关
    // const enableMock = false;
    // if (!enableMock) return;

    /* Original Mock Logic - Commented Out
    const now = Date.now();
    const daysInYear = 365;
    const categories = ['国潮设计', '非遗传承', '老字号品牌', 'IP设计', '插画设计'];
    const themes = ['中国红', '青花瓷', '京剧', '回纹', '泥人张', '海河', '同仁堂'];

    // 生成一年的模拟数据
    for (let i = 0; i < daysInYear; i++) {
      const timestamp = now - (daysInYear - i) * 24 * 60 * 60 * 1000;
      
      // 为每个指标生成数据点
      const metrics: MetricType[] = ['works', 'likes', 'views', 'comments', 'shares', 'followers', 'participation'];
      
      metrics.forEach(metric => {
        // 生成随机值，带有一定的趋势
        const baseValue = 100 + Math.sin(i / 30) * 50;
        const randomFactor = Math.random() * 30;
        const value = Math.max(0, Math.round(baseValue + randomFactor));

        // 随机选择分类和主题
        const category = categories[Math.floor(Math.random() * categories.length)];
        const theme = themes[Math.floor(Math.random() * themes.length)];

        this.dataPoints.push({
          timestamp,
          value,
          label: new Date(timestamp).toLocaleDateString('zh-CN'),
          category,
          theme
        });
      });
    }
    */
  }

  // 获取数据点
  getMetricsData(query: AnalyticsQueryParams): DataPoint[] {
    // 基础过滤
    let filteredData = this.dataPoints;

    // 应用时间范围过滤
    const now = Date.now();
    let timeRangeStart = 0;

    switch (query.timeRange) {
      case '7d':
        timeRangeStart = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        timeRangeStart = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case '90d':
        timeRangeStart = now - 90 * 24 * 60 * 60 * 1000;
        break;
      case '1y':
        timeRangeStart = now - 365 * 24 * 60 * 60 * 1000;
        break;
      case 'all':
      default:
        timeRangeStart = 0;
    }

    filteredData = filteredData.filter(point => point.timestamp >= timeRangeStart);

    // 应用自定义日期范围过滤
    const dateRange = query.filters?.dateRange;
    if (dateRange) {
      filteredData = filteredData.filter(point => 
        point.timestamp >= dateRange.start && 
        point.timestamp <= dateRange.end
      );
    }

    // 应用分类过滤
    if (query.filters?.category) {
      filteredData = filteredData.filter(point => point.category === query.filters?.category);
    }

    // 应用主题过滤
    if (query.filters?.theme) {
      filteredData = filteredData.filter(point => point.theme === query.filters?.theme);
    }

    // 分组和聚合逻辑
    const groupedData: Record<string, number> = {};

    filteredData.forEach(point => {
      let key: string;
      const date = new Date(point.timestamp);

      // 根据分组类型生成键
      switch (query.groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekNumber = Math.ceil(date.getDate() / 7);
          key = `${date.getFullYear()}-W${weekNumber}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        case 'year':
          key = `${date.getFullYear()}`;
          break;
        case 'category':
          key = point.category || '未分类';
          break;
        case 'theme':
          key = point.theme || '未分类';
          break;
        case 'user':
          key = point.userId || '匿名用户';
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      // 聚合数据
      if (!groupedData[key]) {
        groupedData[key] = 0;
      }
      groupedData[key] += point.value;
    });

    // 转换为DataPoint数组
    return Object.entries(groupedData).map(([key, value]) => ({
      timestamp: new Date(key).getTime() || now,
      value,
      label: key,
    }));
  }

  // 获取数据统计
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

    const values = data.map(point => point.value);
    const total = values.reduce((sum, value) => sum + value, 0);
    const average = total / data.length;
    const peak = Math.max(...values);
    const trough = Math.min(...values);

    // 计算增长率
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstHalfAvg = firstHalf.reduce((sum, value) => sum + value, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, value) => sum + value, 0) / secondHalf.length;
    const growth = firstHalfAvg === 0 ? 0 : ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    // 确定趋势
    let trend: 'up' | 'down' | 'stable';
    if (growth > 5) trend = 'up';
    else if (growth < -5) trend = 'down';
    else trend = 'stable';

    return {
      total,
      average,
      growth,
      peak,
      trough,
      trend
    };
  }

  // 获取作品表现数据
  getWorksPerformance(limit: number = 10): WorkPerformance[] {
    // 如果没有数据，返回空数组而不是模拟数据
    // 在实际应用中，这里应该请求后端API
    return [];
  }

  // 获取用户活动数据
  getUserActivity(limit: number = 10): UserActivity[] {
    // 返回空数组
    return [];
  }

  // 获取主题趋势数据
  getThemeTrends(limit: number = 10): ThemeTrend[] {
    // 返回空数组
    return [];
  }

  // 导出数据分析报告
  exportAnalyticsReport(params: AnalyticsQueryParams): Blob {
    const data = this.getMetricsData(params);
    const stats = this.getMetricsStats(data);

    // 创建报告内容
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

    // 创建JSON Blob
    return new Blob([JSON.stringify(reportContent, null, 2)], {
      type: 'application/json'
    });
  }
}

// 导出单例实例
const analyticsService = new AnalyticsService();
export default analyticsService;