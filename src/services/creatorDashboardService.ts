import { supabase, supabaseAdmin } from '@/lib/supabase';

export type TimeGranularity = 'day' | 'week' | 'month' | 'year';
export type MetricCategory = 'views' | 'likes' | 'comments' | 'shares' | 'favorites' | 'followers' | 'earnings' | 'engagement';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface MetricDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AggregatedMetrics {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TrendData {
  date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  earnings: number;
}

export interface WorkPerformance {
  id: string;
  title: string;
  thumbnail?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
  trend: 'up' | 'down' | 'stable';
  growth: number;
  createdAt: string;
}

export interface AudienceInsight {
  ageGroup: string;
  percentage: number;
  count: number;
}

export interface DeviceDistribution {
  device: string;
  percentage: number;
  count: number;
}

export interface GeographicData {
  region: string;
  count: number;
  percentage: number;
}

export interface DashboardMetrics {
  views: AggregatedMetrics;
  likes: AggregatedMetrics;
  comments: AggregatedMetrics;
  shares: AggregatedMetrics;
  favorites: AggregatedMetrics;
  followers: AggregatedMetrics;
  earnings: AggregatedMetrics;
  engagement: AggregatedMetrics;
}

export interface DashboardReport {
  generatedAt: string;
  dateRange: DateRange;
  summary: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalEarnings: number;
    avgEngagement: number;
  };
  metrics: DashboardMetrics;
  topWorks: WorkPerformance[];
  trendData: TrendData[];
  audienceInsights: AudienceInsight[];
  deviceDistribution: DeviceDistribution[];
  geographicData: GeographicData[];
}

class CreatorDashboardService {
  private getDateRangeFromPeriod(period: string): DateRange {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        startDate.setFullYear(startDate.getFullYear() - 10);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    return { startDate, endDate };
  }

  private getPreviousPeriod(currentRange: DateRange): DateRange {
    const duration = currentRange.endDate.getTime() - currentRange.startDate.getTime();
    const previousEndDate = new Date(currentRange.startDate);
    const previousStartDate = new Date(previousEndDate.getTime() - duration);
    return { startDate: previousStartDate, endDate: previousEndDate };
  }

  private calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
    if (previous === 0) {
      return current > 0 ? 'up' : 'stable';
    }
    const changePercent = ((current - previous) / previous) * 100;
    if (changePercent > 5) return 'up';
    if (changePercent < -5) return 'down';
    return 'stable';
  }

  private calculateAggregatedMetrics(current: number, previous: number): AggregatedMetrics {
    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : (current > 0 ? 100 : 0);
    return {
      current,
      previous,
      change,
      changePercent: Math.round(changePercent * 10) / 10,
      trend: this.calculateTrend(current, previous),
    };
  }

  async getDashboardMetrics(userId: string, period: string = '30d'): Promise<DashboardMetrics> {
    const currentRange = this.getDateRangeFromPeriod(period);
    const previousRange = this.getPreviousPeriod(currentRange);

    const [
      viewsData,
      likesData,
      commentsData,
      sharesData,
      favoritesData,
      followersData,
      earningsData,
    ] = await Promise.all([
      this.getMetricCount(userId, 'views', currentRange),
      this.getMetricCount(userId, 'likes', currentRange),
      this.getMetricCount(userId, 'comments', currentRange),
      this.getMetricCount(userId, 'shares', currentRange),
      this.getMetricCount(userId, 'favorites', currentRange),
      this.getFollowerCount(userId, currentRange),
      this.getEarningsCount(userId, currentRange),
    ]);

    const [
      prevViewsData,
      prevLikesData,
      prevCommentsData,
      prevSharesData,
      prevFavoritesData,
      prevFollowersData,
      prevEarningsData,
    ] = await Promise.all([
      this.getMetricCount(userId, 'views', previousRange),
      this.getMetricCount(userId, 'likes', previousRange),
      this.getMetricCount(userId, 'comments', previousRange),
      this.getMetricCount(userId, 'shares', previousRange),
      this.getMetricCount(userId, 'favorites', previousRange),
      this.getFollowerCount(userId, previousRange),
      this.getEarningsCount(userId, previousRange),
    ]);

    const engagement = this.calculateEngagement(viewsData, likesData, commentsData, sharesData);
    const prevEngagement = this.calculateEngagement(prevViewsData, prevLikesData, prevCommentsData, prevSharesData);

    return {
      views: this.calculateAggregatedMetrics(viewsData, prevViewsData),
      likes: this.calculateAggregatedMetrics(likesData, prevLikesData),
      comments: this.calculateAggregatedMetrics(commentsData, prevCommentsData),
      shares: this.calculateAggregatedMetrics(sharesData, prevSharesData),
      favorites: this.calculateAggregatedMetrics(favoritesData, prevFavoritesData),
      followers: this.calculateAggregatedMetrics(followersData, prevFollowersData),
      earnings: this.calculateAggregatedMetrics(earningsData, prevEarningsData),
      engagement: this.calculateAggregatedMetrics(engagement, prevEngagement),
    };
  }

  private calculateEngagement(views: number, likes: number, comments: number, shares: number): number {
    if (views === 0) return 0;
    return Math.round(((likes + comments + shares) / views) * 10000) / 100;
  }

  private async getMetricCount(userId: string, metric: string, range: DateRange): Promise<number> {
    try {
      const { data: works } = await supabaseAdmin
        .from('works')
        .select('id')
        .eq('creator_id', userId);

      if (!works || works.length === 0) return 0;

      const workIds = works.map(w => w.id);

      switch (metric) {
        case 'views': {
          const { data } = await supabaseAdmin
            .from('works')
            .select('view_count')
            .eq('creator_id', userId);
          return data?.reduce((sum, w) => sum + (w.view_count || 0), 0) || 0;
        }
        case 'likes': {
          const { count } = await supabaseAdmin
            .from('works_likes')
            .select('*', { count: 'exact', head: true })
            .in('work_id', workIds)
            .gte('created_at', range.startDate.toISOString())
            .lte('created_at', range.endDate.toISOString());
          return count || 0;
        }
        case 'comments': {
          const { count } = await supabaseAdmin
            .from('work_comments')
            .select('*', { count: 'exact', head: true })
            .in('work_id', workIds)
            .gte('created_at', range.startDate.toISOString())
            .lte('created_at', range.endDate.toISOString());
          return count || 0;
        }
        case 'shares': {
          const { count } = await supabaseAdmin
            .from('work_shares')
            .select('*', { count: 'exact', head: true })
            .in('work_id', workIds)
            .gte('created_at', range.startDate.toISOString())
            .lte('created_at', range.endDate.toISOString());
          return count || 0;
        }
        case 'favorites': {
          const { count } = await supabaseAdmin
            .from('bookmarks')
            .select('*', { count: 'exact', head: true })
            .in('work_id', workIds)
            .gte('created_at', range.startDate.toISOString())
            .lte('created_at', range.endDate.toISOString());
          return count || 0;
        }
        default:
          return 0;
      }
    } catch (error) {
      console.error(`获取${metric}数据失败:`, error);
      return 0;
    }
  }

  private async getFollowerCount(userId: string, range: DateRange): Promise<number> {
    try {
      const { count } = await supabaseAdmin
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)
        .gte('created_at', range.startDate.toISOString())
        .lte('created_at', range.endDate.toISOString());
      return count || 0;
    } catch (error) {
      console.error('获取粉丝数据失败:', error);
      return 0;
    }
  }

  private async getEarningsCount(userId: string, range: DateRange): Promise<number> {
    try {
      const { data } = await supabaseAdmin
        .from('revenue_records')
        .select('amount')
        .eq('user_id', userId)
        .neq('type', 'withdrawal')
        .neq('status', 'cancelled')
        .gte('created_at', range.startDate.toISOString())
        .lte('created_at', range.endDate.toISOString());
      return data?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
    } catch (error) {
      console.error('获取收入数据失败:', error);
      return 0;
    }
  }

  async getTrendData(
    userId: string,
    period: string = '30d',
    granularity: TimeGranularity = 'day'
  ): Promise<TrendData[]> {
    const range = this.getDateRangeFromPeriod(period);
    const data: TrendData[] = [];

    try {
      const { data: works } = await supabaseAdmin
        .from('works')
        .select('id, view_count, created_at')
        .eq('creator_id', userId);

      if (!works || works.length === 0) {
        return this.generateEmptyTrendData(range, granularity);
      }

      const workIds = works.map(w => w.id);

      const [likes, comments, shares, earnings] = await Promise.all([
        supabaseAdmin
          .from('works_likes')
          .select('work_id, created_at')
          .in('work_id', workIds),
        supabaseAdmin
          .from('work_comments')
          .select('work_id, created_at')
          .in('work_id', workIds),
        supabaseAdmin
          .from('work_shares')
          .select('work_id, created_at')
          .in('work_id', workIds),
        supabaseAdmin
          .from('revenue_records')
          .select('amount, created_at')
          .eq('user_id', userId)
          .neq('type', 'withdrawal'),
      ]);

      const intervals = this.generateIntervals(range, granularity);

      for (const interval of intervals) {
        const intervalStart = interval.start;
        const intervalEnd = interval.end;

        const viewsCount = works.filter(w => {
          const createdAt = new Date(w.created_at);
          return createdAt >= intervalStart && createdAt < intervalEnd;
        }).reduce((sum, w) => sum + (w.view_count || 0), 0);

        const likesCount = likes.data?.filter(l => {
          const createdAt = new Date(l.created_at);
          return createdAt >= intervalStart && createdAt < intervalEnd;
        }).length || 0;

        const commentsCount = comments.data?.filter(c => {
          const createdAt = new Date(c.created_at);
          return createdAt >= intervalStart && createdAt < intervalEnd;
        }).length || 0;

        const sharesCount = shares.data?.filter(s => {
          const createdAt = new Date(s.created_at);
          return createdAt >= intervalStart && createdAt < intervalEnd;
        }).length || 0;

        const earningsCount = earnings.data?.filter(e => {
          const createdAt = new Date(e.created_at);
          return createdAt >= intervalStart && createdAt < intervalEnd;
        }).reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

        data.push({
          date: this.formatDateLabel(intervalStart, granularity),
          views: viewsCount,
          likes: likesCount,
          comments: commentsCount,
          shares: sharesCount,
          earnings: earningsCount,
        });
      }

      return data;
    } catch (error) {
      console.error('获取趋势数据失败:', error);
      return this.generateEmptyTrendData(range, granularity);
    }
  }

  private generateIntervals(range: DateRange, granularity: TimeGranularity): Array<{ start: Date; end: Date }> {
    const intervals: Array<{ start: Date; end: Date }> = [];
    let current = new Date(range.startDate);

    while (current < range.endDate) {
      const start = new Date(current);
      let end: Date;

      switch (granularity) {
        case 'day':
          end = new Date(current);
          end.setDate(end.getDate() + 1);
          break;
        case 'week':
          end = new Date(current);
          end.setDate(end.getDate() + 7);
          break;
        case 'month':
          end = new Date(current);
          end.setMonth(end.getMonth() + 1);
          break;
        case 'year':
          end = new Date(current);
          end.setFullYear(end.getFullYear() + 1);
          break;
        default:
          end = new Date(current);
          end.setDate(end.getDate() + 1);
      }

      if (end > range.endDate) {
        end = new Date(range.endDate);
      }

      intervals.push({ start, end });
      current = end;
    }

    return intervals;
  }

  private formatDateLabel(date: Date, granularity: TimeGranularity): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (granularity) {
      case 'day':
        return `${month}-${day}`;
      case 'week':
        return `${month}-${day}`;
      case 'month':
        return `${year}-${month}`;
      case 'year':
        return `${year}`;
      default:
        return `${month}-${day}`;
    }
  }

  private generateEmptyTrendData(range: DateRange, granularity: TimeGranularity): TrendData[] {
    const intervals = this.generateIntervals(range, granularity);
    return intervals.map(interval => ({
      date: this.formatDateLabel(interval.start, granularity),
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      earnings: 0,
    }));
  }

  async getTopWorks(userId: string, limit: number = 5, period?: string): Promise<WorkPerformance[]> {
    try {
      let query = supabaseAdmin
        .from('works')
        .select('id, title, thumbnail, view_count, created_at, status')
        .eq('creator_id', userId)
        .order('view_count', { ascending: false })
        .limit(limit);

      if (period) {
        const range = this.getDateRangeFromPeriod(period);
        query = query
          .gte('created_at', range.startDate.toISOString())
          .lte('created_at', range.endDate.toISOString());
      }

      const { data: works, error } = await query;

      if (error || !works || works.length === 0) {
        return [];
      }

      const workIds = works.map(w => w.id);

      const [likes, comments, shares] = await Promise.all([
        supabaseAdmin
          .from('works_likes')
          .select('work_id')
          .in('work_id', workIds),
        supabaseAdmin
          .from('work_comments')
          .select('work_id')
          .in('work_id', workIds),
        supabaseAdmin
          .from('work_shares')
          .select('work_id')
          .in('work_id', workIds),
      ]);

      const likesMap: Record<string, number> = {};
      likes.data?.forEach(l => {
        likesMap[l.work_id] = (likesMap[l.work_id] || 0) + 1;
      });

      const commentsMap: Record<string, number> = {};
      comments.data?.forEach(c => {
        commentsMap[c.work_id] = (commentsMap[c.work_id] || 0) + 1;
      });

      const sharesMap: Record<string, number> = {};
      shares.data?.forEach(s => {
        sharesMap[s.work_id] = (sharesMap[s.work_id] || 0) + 1;
      });

      return works.map(work => {
        const views = work.view_count || 0;
        const likesCount = likesMap[work.id] || 0;
        const commentsCount = commentsMap[work.id] || 0;
        const sharesCount = sharesMap[work.id] || 0;
        const engagement = views > 0 ? ((likesCount + commentsCount + sharesCount) / views) * 100 : 0;

        return {
          id: work.id,
          title: work.title || '未命名作品',
          thumbnail: work.thumbnail,
          views,
          likes: likesCount,
          comments: commentsCount,
          shares: sharesCount,
          engagement: Math.round(engagement * 100) / 100,
          trend: 'stable' as const,
          growth: 0,
          createdAt: work.created_at,
        };
      });
    } catch (error) {
      console.error('获取热门作品失败:', error);
      return [];
    }
  }

  async getAudienceInsights(userId: string): Promise<AudienceInsight[]> {
    const defaultInsights: AudienceInsight[] = [
      { ageGroup: '18-24岁', percentage: 35, count: 0 },
      { ageGroup: '25-34岁', percentage: 40, count: 0 },
      { ageGroup: '35-44岁', percentage: 18, count: 0 },
      { ageGroup: '45岁以上', percentage: 7, count: 0 },
    ];

    try {
      const { data: followers } = await supabaseAdmin
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId);

      if (!followers || followers.length === 0) {
        return defaultInsights;
      }

      const followerIds = followers.map(f => f.follower_id);

      const { data: profiles } = await supabaseAdmin
        .from('users')
        .select('id, metadata')
        .in('id', followerIds);

      if (!profiles || profiles.length === 0) {
        return defaultInsights;
      }

      const ageGroups: Record<string, number> = {
        '18-24岁': 0,
        '25-34岁': 0,
        '35-44岁': 0,
        '45岁以上': 0,
      };

      profiles.forEach(profile => {
        const age = profile.metadata?.age;
        if (age) {
          if (age >= 18 && age <= 24) ageGroups['18-24岁']++;
          else if (age >= 25 && age <= 34) ageGroups['25-34岁']++;
          else if (age >= 35 && age <= 44) ageGroups['35-44岁']++;
          else if (age >= 45) ageGroups['45岁以上']++;
        } else {
          ageGroups['25-34岁']++;
        }
      });

      const total = Object.values(ageGroups).reduce((sum, count) => sum + count, 0);

      return Object.entries(ageGroups).map(([ageGroup, count]) => ({
        ageGroup,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        count,
      }));
    } catch (error) {
      console.error('获取受众洞察失败:', error);
      return defaultInsights;
    }
  }

  async getDeviceDistribution(userId: string): Promise<DeviceDistribution[]> {
    try {
      const { data: pageViews } = await supabaseAdmin
        .from('page_views')
        .select('device_type')
        .eq('user_id', userId);

      if (!pageViews || pageViews.length === 0) {
        return [
          { device: '移动端', percentage: 68, count: 0 },
          { device: '桌面端', percentage: 28, count: 0 },
          { device: '平板', percentage: 4, count: 0 },
        ];
      }

      const deviceCounts: Record<string, number> = {};
      pageViews.forEach(pv => {
        const device = pv.device_type || 'desktop';
        deviceCounts[device] = (deviceCounts[device] || 0) + 1;
      });

      const total = Object.values(deviceCounts).reduce((sum, count) => sum + count, 0);

      const deviceNames: Record<string, string> = {
        mobile: '移动端',
        desktop: '桌面端',
        tablet: '平板',
      };

      return Object.entries(deviceCounts).map(([device, count]) => ({
        device: deviceNames[device] || device,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        count,
      }));
    } catch (error) {
      console.error('获取设备分布失败:', error);
      return [
        { device: '移动端', percentage: 68, count: 0 },
        { device: '桌面端', percentage: 28, count: 0 },
        { device: '平板', percentage: 4, count: 0 },
      ];
    }
  }

  async generateReport(userId: string, period: string = '30d'): Promise<DashboardReport> {
    const dateRange = this.getDateRangeFromPeriod(period);

    const [metrics, trendData, topWorks, audienceInsights, deviceDistribution] = await Promise.all([
      this.getDashboardMetrics(userId, period),
      this.getTrendData(userId, period, 'day'),
      this.getTopWorks(userId, 10, period),
      this.getAudienceInsights(userId),
      this.getDeviceDistribution(userId),
    ]);

    const summary = {
      totalViews: metrics.views.current,
      totalLikes: metrics.likes.current,
      totalComments: metrics.comments.current,
      totalShares: metrics.shares.current,
      totalEarnings: metrics.earnings.current,
      avgEngagement: metrics.engagement.current,
    };

    return {
      generatedAt: new Date().toISOString(),
      dateRange,
      summary,
      metrics,
      topWorks,
      trendData,
      audienceInsights,
      deviceDistribution,
      geographicData: [],
    };
  }

  async exportToCSV(data: TrendData[], filename: string = 'dashboard-data'): Promise<void> {
    const headers = ['日期', '浏览量', '点赞数', '评论数', '分享数', '收益'];
    const rows = data.map(d => [
      d.date,
      d.views.toString(),
      d.likes.toString(),
      d.comments.toString(),
      d.shares.toString(),
      d.earnings.toString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async exportToJSON(report: DashboardReport, filename: string = 'dashboard-report'): Promise<void> {
    const jsonContent = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async exportToExcel(data: TrendData[], filename: string = 'dashboard-data'): Promise<void> {
    const headers = ['日期', '浏览量', '点赞数', '评论数', '分享数', '收益'];
    const rows = data.map(d => [
      d.date,
      d.views.toString(),
      d.likes.toString(),
      d.comments.toString(),
      d.shares.toString(),
      d.earnings.toString(),
    ]);

    let tableHTML = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    tableHTML += '<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
    tableHTML += '<x:Name>数据</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>';
    tableHTML += '</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
    tableHTML += '<body><table border="1">';
    tableHTML += '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    rows.forEach(row => {
      tableHTML += '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
    });
    tableHTML += '</table></body></html>';

    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async scheduleReport(userId: string, schedule: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('report_subscriptions')
        .insert({
          user_id: userId,
          schedule,
          enabled: true,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('订阅报告失败:', error);
      throw error;
    }
  }

  async unsubscribeReport(userId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('report_subscriptions')
        .update({ enabled: false })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('取消订阅报告失败:', error);
      throw error;
    }
  }

  async getSubscriptionStatus(userId: string): Promise<{ schedule: string; enabled: boolean } | null> {
    try {
      const { data } = await supabaseAdmin
        .from('report_subscriptions')
        .select('schedule, enabled')
        .eq('user_id', userId)
        .eq('enabled', true)
        .single();

      return data;
    } catch (error) {
      return null;
    }
  }
}

export const creatorDashboardService = new CreatorDashboardService();
export default creatorDashboardService;
