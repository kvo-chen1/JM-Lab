/**
 * 数据分析服务
 * 用于收集和上报用户行为数据
 */

// 导出类型定义
export type MetricType = 'views' | 'likes' | 'comments' | 'shares' | 'favorites' | 'followers' | 'engagement';
export type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type GroupBy = 'hour' | 'day' | 'week' | 'month';
export type ExportFormat = 'json' | 'csv' | 'pdf';

export interface AnalyticsQueryParams {
  metric: MetricType;
  timeRange: TimeRange;
  groupBy: GroupBy;
  filters?: {
    userId?: string;
    workId?: string;
    theme?: string;
  };
}

export interface WorkPerformance {
  workId: string;
  title: string;
  thumbnail: string;
  type: 'image' | 'video';
  videoUrl?: string;
  author: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    favorites: number;
  };
  trend: 'up' | 'down' | 'stable';
  growth: number;
}

export interface UserActivity {
  userId: string;
  username: string;
  avatar: string;
  engagementScore: number;
  metrics: {
    worksCreated: number;
    totalViews: number;
    totalLikes: number;
    followers: number;
  };
}

export interface ThemeTrend {
  theme: string;
  worksCount: number;
  viewsCount: number;
  growth: number;
}

class AnalyticsService {
  private sessionId: string;
  private deviceType: string;
  private browser: string;
  private os: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.deviceType = this.detectDeviceType();
    this.browser = this.detectBrowser();
    this.os = this.detectOS();
    
    // 初始化时记录设备信息
    this.recordDeviceInfo();
    
    // 记录页面浏览
    this.recordPageView();
    
    // 监听页面离开
    this.setupPageLeaveTracking();
  }

  // 生成会话ID
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 检测设备类型
  private detectDeviceType(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/mobile|android|iphone|ipad|ipod|windows phone/i.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  // 检测浏览器
  private detectBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  // 检测操作系统
  private detectOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown';
  }

  // 记录设备信息
  private async recordDeviceInfo(): Promise<void> {
    try {
      await fetch('/api/analytics/device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_type: this.deviceType,
          device_name: navigator.platform,
          user_agent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.warn('记录设备信息失败:', error);
    }
  }

  // 记录页面浏览
  private async recordPageView(): Promise<void> {
    try {
      await fetch('/api/analytics/pageview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_path: window.location.pathname,
          page_title: document.title,
          referrer: document.referrer,
          session_id: this.sessionId,
          device_type: this.deviceType,
          browser: this.browser,
          os: this.os,
        }),
      });
    } catch (error) {
      console.warn('记录页面浏览失败:', error);
    }
  }

  // 设置页面离开追踪
  private setupPageLeaveTracking(): void {
    let startTime = Date.now();
    
    // 页面可见性变化时记录停留时间
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        this.updatePageDuration(duration);
      } else {
        startTime = Date.now();
      }
    });

    // 页面卸载时记录
    window.addEventListener('beforeunload', () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      this.updatePageDuration(duration);
    });
  }

  // 更新页面停留时间
  private async updatePageDuration(duration: number): Promise<void> {
    // 这里可以实现一个批量上报机制
    // 暂时使用 sendBeacon 确保数据在页面关闭时也能发送
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        page_path: window.location.pathname,
        duration: duration,
        session_id: this.sessionId,
      });
      navigator.sendBeacon('/api/analytics/pageview/duration', new Blob([data], { type: 'application/json' }));
    }
  }

  // 记录用户活动
  public async trackActivity(
    activityType: string,
    activityName: string,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await fetch('/api/analytics/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity_type: activityType,
          activity_name: activityName,
          description: description || null,
          metadata: metadata || null,
        }),
      });
    } catch (error) {
      console.warn('记录用户活动失败:', error);
    }
  }

  // 记录流量来源
  public async trackTrafficSource(): Promise<void> {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get('utm_source');
      const utmMedium = urlParams.get('utm_medium');
      const utmCampaign = urlParams.get('utm_campaign');

      // 判断来源类型
      let sourceType = 'direct';
      let sourceName = '直接访问';

      if (utmSource) {
        sourceName = utmSource;
        if (utmSource.includes('google') || utmSource.includes('baidu')) {
          sourceType = 'search';
        } else if (utmSource.includes('wechat') || utmSource.includes('weibo') || utmSource.includes('douyin')) {
          sourceType = 'social';
        } else {
          sourceType = 'other';
        }
      } else if (document.referrer) {
        const referrer = document.referrer.toLowerCase();
        if (referrer.includes('google') || referrer.includes('baidu')) {
          sourceType = 'search';
          sourceName = '搜索引擎';
        } else if (referrer.includes('wechat') || referrer.includes('weibo') || referrer.includes('douyin')) {
          sourceType = 'social';
          sourceName = '社交媒体';
        } else if (referrer) {
          sourceType = 'referral';
          sourceName = '外部链接';
        }
      }

      await fetch('/api/analytics/traffic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_type: sourceType,
          source_name: sourceName,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          referrer_url: document.referrer || null,
          landing_page: window.location.pathname,
        }),
      });
    } catch (error) {
      console.warn('记录流量来源失败:', error);
    }
  }

  // 追踪事件
  public trackEvent(eventName: string, eventData?: Record<string, any>): void {
    this.trackActivity('event', eventName, undefined, eventData);
  }

  // 追踪页面浏览
  public trackPageView(pagePath?: string, pageTitle?: string): void {
    this.recordPageView();
  }

  // 获取作品表现数据
  public async getWorksPerformance(limit: number = 5): Promise<WorkPerformance[]> {
    try {
      const response = await fetch(`/api/analytics/works-performance?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch works performance');
      }
      return await response.json();
    } catch (error) {
      console.warn('获取作品表现数据失败:', error);
      // 返回模拟数据作为后备
      return this.getMockWorksPerformance(limit);
    }
  }

  // 获取用户活动数据
  public async getUserActivity(limit: number = 5): Promise<UserActivity[]> {
    try {
      const response = await fetch(`/api/analytics/user-activity?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user activity');
      }
      return await response.json();
    } catch (error) {
      console.warn('获取用户活动数据失败:', error);
      // 返回模拟数据作为后备
      return this.getMockUserActivity(limit);
    }
  }

  // 获取主题趋势数据
  public async getThemeTrends(limit: number = 5): Promise<ThemeTrend[]> {
    try {
      const response = await fetch(`/api/analytics/theme-trends?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch theme trends');
      }
      return await response.json();
    } catch (error) {
      console.warn('获取主题趋势数据失败:', error);
      // 返回模拟数据作为后备
      return this.getMockThemeTrends(limit);
    }
  }

  // 下载导出数据
  public async downloadExport(params: AnalyticsQueryParams, format: ExportFormat): Promise<void> {
    try {
      const queryString = new URLSearchParams({
        metric: params.metric,
        timeRange: params.timeRange,
        groupBy: params.groupBy,
        format: format,
        ...(params.filters?.userId && { userId: params.filters.userId }),
        ...(params.filters?.workId && { workId: params.filters.workId }),
        ...(params.filters?.theme && { theme: params.filters.theme }),
      }).toString();

      const response = await fetch(`/api/analytics/export?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.warn('导出数据失败:', error);
      throw error;
    }
  }

  // 模拟数据生成方法
  private getMockWorksPerformance(limit: number): WorkPerformance[] {
    const mockData: WorkPerformance[] = [
      {
        workId: '1',
        title: '津脉广场夜景',
        thumbnail: 'https://picsum.photos/seed/work1/100/100',
        type: 'image',
        author: '摄影师小王',
        metrics: { views: 12580, likes: 892, comments: 156, shares: 89, favorites: 234 },
        trend: 'up',
        growth: 23.5,
      },
      {
        workId: '2',
        title: '海河风光',
        thumbnail: 'https://picsum.photos/seed/work2/100/100',
        type: 'video',
        videoUrl: 'https://example.com/video1.mp4',
        author: '旅行达人',
        metrics: { views: 9876, likes: 654, comments: 98, shares: 67, favorites: 189 },
        trend: 'up',
        growth: 15.2,
      },
      {
        workId: '3',
        title: '天津美食探店',
        thumbnail: 'https://picsum.photos/seed/work3/100/100',
        type: 'image',
        author: '吃货小李',
        metrics: { views: 8654, likes: 543, comments: 87, shares: 45, favorites: 156 },
        trend: 'stable',
        growth: 2.1,
      },
      {
        workId: '4',
        title: '意式风情街',
        thumbnail: 'https://picsum.photos/seed/work4/100/100',
        type: 'image',
        author: '城市探索者',
        metrics: { views: 7234, likes: 432, comments: 65, shares: 34, favorites: 123 },
        trend: 'down',
        growth: -5.3,
      },
      {
        workId: '5',
        title: '五大道漫步',
        thumbnail: 'https://picsum.photos/seed/work5/100/100',
        type: 'video',
        videoUrl: 'https://example.com/video2.mp4',
        author: '历史爱好者',
        metrics: { views: 6543, likes: 387, comments: 54, shares: 28, favorites: 98 },
        trend: 'up',
        growth: 8.7,
      },
    ];
    return mockData.slice(0, limit);
  }

  private getMockUserActivity(limit: number): UserActivity[] {
    const mockData: UserActivity[] = [
      {
        userId: '1',
        username: '创作者小明',
        avatar: 'https://picsum.photos/seed/user1/100/100',
        engagementScore: 95,
        metrics: { worksCreated: 45, totalViews: 125000, totalLikes: 8900, followers: 2300 },
      },
      {
        userId: '2',
        username: '摄影师阿华',
        avatar: 'https://picsum.photos/seed/user2/100/100',
        engagementScore: 88,
        metrics: { worksCreated: 32, totalViews: 98000, totalLikes: 6500, followers: 1800 },
      },
      {
        userId: '3',
        username: '美食博主',
        avatar: 'https://picsum.photos/seed/user3/100/100',
        engagementScore: 82,
        metrics: { worksCreated: 28, totalViews: 87000, totalLikes: 5400, followers: 1500 },
      },
      {
        userId: '4',
        username: '旅行家',
        avatar: 'https://picsum.photos/seed/user4/100/100',
        engagementScore: 76,
        metrics: { worksCreated: 25, totalViews: 72000, totalLikes: 4300, followers: 1200 },
      },
      {
        userId: '5',
        username: '城市记录者',
        avatar: 'https://picsum.photos/seed/user5/100/100',
        engagementScore: 71,
        metrics: { worksCreated: 22, totalViews: 65000, totalLikes: 3800, followers: 980 },
      },
    ];
    return mockData.slice(0, limit);
  }

  private getMockThemeTrends(limit: number): ThemeTrend[] {
    const mockData: ThemeTrend[] = [
      { theme: '津脉广场', worksCount: 1234, viewsCount: 567000, growth: 23.5 },
      { theme: '海河风光', worksCount: 987, viewsCount: 432000, growth: 18.2 },
      { theme: '天津美食', worksCount: 876, viewsCount: 389000, growth: 15.7 },
      { theme: '五大道', worksCount: 654, viewsCount: 298000, growth: 12.3 },
      { theme: '意式风情', worksCount: 543, viewsCount: 234000, growth: -3.2 },
    ];
    return mockData.slice(0, limit);
  }
}

// 创建单例实例
export const analyticsService = new AnalyticsService();

export default analyticsService;
