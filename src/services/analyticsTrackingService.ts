/**
 * 用户行为追踪服务
 * 用于收集和分析用户行为数据，为数据分析提供真实依据
 */

import { supabaseAdmin } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

// ==================== 类型定义 ====================

export interface UserBehaviorLog {
  id?: string;
  user_id: string;
  action: UserAction;
  work_id?: string;
  promoted_work_id?: string;
  event_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export type UserAction = 
  | 'view_work'
  | 'click_work'
  | 'like_work'
  | 'comment_work'
  | 'share_work'
  | 'view_promoted_work'
  | 'click_promoted_work'
  | 'purchase'
  | 'add_to_cart'
  | 'view_event'
  | 'join_event'
  | 'submit_to_event'
  | 'view_profile'
  | 'follow_user'
  | 'search'
  | 'page_view';

export interface ConversionEvent {
  id?: string;
  user_id: string;
  promoted_work_id: string;
  conversion_type: ConversionType;
  conversion_value?: number;
  order_id?: string;
  work_id?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export type ConversionType = 
  | 'purchase'
  | 'signup'
  | 'download'
  | 'engagement'
  | 'follow'
  | 'share';

export interface HourlyStats {
  hour: number;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  unique_users: number;
}

export interface UserRetention {
  cohort_date: string;
  cohort_users: number;
  day1_retention: number;
  day7_retention: number;
  day14_retention: number;
  day30_retention: number;
}

export interface UserDemographics {
  user_id: string;
  age_group?: string;
  gender?: string;
  city?: string;
  province?: string;
  country?: string;
  interests?: string[];
}

export interface WorkPropagationNode {
  work_id: string;
  work_title: string;
  creator_id: string;
  creator_name: string;
  view_count: number;
  share_count: number;
  like_count: number;
  comment_count: number;
  propagation_score: number;
  propagation_path: string[];
  created_at: string;
}

export interface PropagationChain {
  id: string;
  work_id: string;
  user_id: string;
  action: string;
  referrer_user_id?: string;
  created_at: string;
}

export interface BrandCollaborationAnalysis {
  brand_name: string;
  total_campaigns: number;
  total_works: number;
  total_views: number;
  total_engagement: number;
  avg_engagement_rate: number;
  total_revenue: number;
  roi: number;
  top_performing_works: Array<{
    work_id: string;
    work_title: string;
    views: number;
    engagement: number;
  }>;
}

export interface CreatorRevenueAnalysis {
  creator_id: string;
  creator_name: string;
  total_revenue: number;
  monthly_revenue: number;
  revenue_sources: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>;
  revenue_trend: Array<{
    date: string;
    amount: number;
  }>;
  top_works: Array<{
    work_id: string;
    work_title: string;
    revenue: number;
  }>;
}

// ==================== 服务类 ====================

class AnalyticsTrackingService {
  /**
   * 记录用户行为
   */
  async trackBehavior(behavior: UserBehaviorLog): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('user_behavior_logs')
        .insert({
          user_id: behavior.user_id,
          action: behavior.action,
          work_id: behavior.work_id,
          promoted_work_id: behavior.promoted_work_id,
          event_id: behavior.event_id,
          metadata: behavior.metadata || {},
          ip_address: behavior.ip_address,
          user_agent: behavior.user_agent,
          created_at: behavior.created_at || new Date().toISOString(),
        });

      if (error) {
        console.error('记录用户行为失败:', error);
      }
    } catch (error) {
      console.error('记录用户行为异常:', error);
    }
  }

  /**
   * 记录转化事件
   */
  async trackConversion(conversion: ConversionEvent): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('conversion_events')
        .insert({
          user_id: conversion.user_id,
          promoted_work_id: conversion.promoted_work_id,
          conversion_type: conversion.conversion_type,
          conversion_value: conversion.conversion_value,
          order_id: conversion.order_id,
          work_id: conversion.work_id,
          metadata: conversion.metadata || {},
          created_at: conversion.created_at || new Date().toISOString(),
        });

      if (error) {
        console.error('记录转化事件失败:', error);
      }
    } catch (error) {
      console.error('记录转化事件异常:', error);
    }
  }

  /**
   * 获取推广作品的曝光和点击数据（按小时统计）
   */
  async getHourlyStats(
    promotedWorkId: string,
    startDate: Date,
    endDate: Date
  ): Promise<HourlyStats[]> {
    try {
      // 获取曝光数据
      const { data: impressions } = await supabaseAdmin
        .from('user_behavior_logs')
        .select('created_at')
        .eq('promoted_work_id', promotedWorkId)
        .eq('action', 'view_promoted_work')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // 获取点击数据
      const { data: clicks } = await supabaseAdmin
        .from('user_behavior_logs')
        .select('created_at')
        .eq('promoted_work_id', promotedWorkId)
        .eq('action', 'click_promoted_work')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // 获取转化数据
      const { data: conversions } = await supabaseAdmin
        .from('conversion_events')
        .select('created_at')
        .eq('promoted_work_id', promotedWorkId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // 按小时聚合数据
      const hourlyData: Map<number, HourlyStats> = new Map();
      
      for (let hour = 0; hour < 24; hour++) {
        hourlyData.set(hour, {
          hour,
          date: startDate.toISOString().split('T')[0],
          impressions: 0,
          clicks: 0,
          conversions: 0,
          unique_users: 0,
        });
      }

      // 统计曝光
      impressions?.forEach(log => {
        const hour = new Date(log.created_at).getHours();
        const data = hourlyData.get(hour);
        if (data) {
          data.impressions++;
        }
      });

      // 统计点击
      clicks?.forEach(log => {
        const hour = new Date(log.created_at).getHours();
        const data = hourlyData.get(hour);
        if (data) {
          data.clicks++;
        }
      });

      // 统计转化
      conversions?.forEach(event => {
        const hour = new Date(event.created_at).getHours();
        const data = hourlyData.get(hour);
        if (data) {
          data.conversions++;
        }
      });

      return Array.from(hourlyData.values());
    } catch (error) {
      console.error('获取小时统计数据失败:', error);
      return [];
    }
  }

  /**
   * 获取所有推广作品的时段分析（聚合数据）
   */
  async getAggregateHourlyStats(days: number = 7): Promise<HourlyStats[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 获取所有推广作品的行为日志
      const { data: logs } = await supabaseAdmin
        .from('user_behavior_logs')
        .select('action, created_at, user_id')
        .not('promoted_work_id', 'is', null)
        .gte('created_at', startDate.toISOString());

      // 按小时聚合
      const hourlyMap: Map<number, { impressions: number; clicks: number; users: Set<string> }> = new Map();
      
      for (let i = 0; i < 24; i++) {
        hourlyMap.set(i, { impressions: 0, clicks: 0, users: new Set() });
      }

      logs?.forEach(log => {
        const hour = new Date(log.created_at).getHours();
        const data = hourlyMap.get(hour);
        if (data) {
          if (log.action === 'view_promoted_work') {
            data.impressions++;
          } else if (log.action === 'click_promoted_work') {
            data.clicks++;
          }
          data.users.add(log.user_id);
        }
      });

      const result: HourlyStats[] = [];
      hourlyMap.forEach((data, hour) => {
        result.push({
          hour,
          date: new Date().toISOString().split('T')[0],
          impressions: data.impressions,
          clicks: data.clicks,
          conversions: 0, // 需要关联 conversion_events 表
          unique_users: data.users.size,
        });
      });

      return result;
    } catch (error) {
      console.error('获取聚合时段数据失败:', error);
      return [];
    }
  }

  /**
   * 计算用户留存率（Cohort Analysis）
   */
  async getRetentionRate(months: number = 6): Promise<{
    period: string;
    total_users: number;
    day1_retention: number;
    day7_retention: number;
    day14_retention: number;
    day30_retention: number;
  }[]> {
    try {
      const now = new Date();
      const retentions: {
        period: string;
        total_users: number;
        day1_retention: number;
        day7_retention: number;
        day14_retention: number;
        day30_retention: number;
      }[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const cohortDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(cohortDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        // 获取该月新增用户
        const { data: newUsers } = await supabaseAdmin
          .from('users')
          .select('id, created_at')
          .gte('created_at', cohortDate.toISOString())
          .lt('created_at', nextMonth.toISOString());

        if (!newUsers || newUsers.length === 0) {
          continue;
        }

        const userIds = newUsers.map(u => u.id);
        const totalUsers = newUsers.length;

        // 计算次日留存率
        const day1Date = new Date(cohortDate);
        day1Date.setDate(day1Date.getDate() + 1);
        const day1ActiveUsers = await this.getActiveUsers(userIds, day1Date, new Date(day1Date.getTime() + 24 * 60 * 60 * 1000));
        const day1Retention = totalUsers > 0 ? day1ActiveUsers / totalUsers : 0;

        // 计算 7 日留存率
        const day7Date = new Date(cohortDate);
        day7Date.setDate(day7Date.getDate() + 7);
        const day7ActiveUsers = await this.getActiveUsers(userIds, day7Date, new Date(day7Date.getTime() + 24 * 60 * 60 * 1000));
        const day7Retention = totalUsers > 0 ? day7ActiveUsers / totalUsers : 0;

        // 计算 14 日留存率
        const day14Date = new Date(cohortDate);
        day14Date.setDate(day14Date.getDate() + 14);
        const day14ActiveUsers = await this.getActiveUsers(userIds, day14Date, new Date(day14Date.getTime() + 24 * 60 * 60 * 1000));
        const day14Retention = totalUsers > 0 ? day14ActiveUsers / totalUsers : 0;

        // 计算 30 日留存率
        const day30Date = new Date(cohortDate);
        day30Date.setDate(day30Date.getDate() + 30);
        const day30ActiveUsers = await this.getActiveUsers(userIds, day30Date, new Date(day30Date.getTime() + 24 * 60 * 60 * 1000));
        const day30Retention = totalUsers > 0 ? day30ActiveUsers / totalUsers : 0;

        retentions.push({
          period: cohortDate.toISOString().split('T')[0].slice(0, 7), // YYYY-MM
          total_users: totalUsers,
          day1_retention: day1Retention,
          day7_retention: day7Retention,
          day14_retention: day14Retention,
          day30_retention: day30Retention,
        });
      }

      return retentions;
    } catch (error) {
      console.error('计算留存率失败:', error);
      return [];
    }
  }

  /**
   * 获取活跃用户数（在指定日期范围内）
   */
  private async getActiveUsers(
    userIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      const { count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .in('id', userIds)
        .gte('last_login', startDate.toISOString())
        .lt('last_login', endDate.toISOString());

      return count || 0;
    } catch (error) {
      console.error('获取活跃用户失败:', error);
      return 0;
    }
  }

  /**
   * 获取用户画像数据
   */
  async getUserDemographics(): Promise<{
    age_groups: { group: string; percentage: number }[];
    gender_distribution: { type: string; percentage: number }[];
    top_cities: { city: string; percentage: number }[];
    active_hours: { hour: number; percentage: number }[];
    interests: { interest: string; count: number; percentage: number }[];
  }> {
    try {
      // 获取所有用户
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, age, gender, city, province, last_login, interests');

      if (!users || users.length === 0) {
        return { age_groups: [], gender_distribution: [], top_cities: [], active_hours: [], interests: [] };
      }

      const totalUsers = users.length;

      // 年龄分组
      const ageMap = new Map<string, number>();
      users.forEach(user => {
        const age = user.age;
        let group = '未知';
        if (age) {
          if (age < 18) group = '18 岁以下';
          else if (age < 25) group = '18-24 岁';
          else if (age < 31) group = '25-30 岁';
          else if (age < 41) group = '31-40 岁';
          else if (age < 51) group = '41-50 岁';
          else group = '50 岁以上';
        }
        ageMap.set(group, (ageMap.get(group) || 0) + 1);
      });

      const age_groups = Array.from(ageMap.entries()).map(([group, count]) => ({
        group,
        percentage: count / totalUsers,
      })).sort((a, b) => b.percentage - a.percentage);

      // 性别分布
      const genderMap = new Map<string, number>();
      users.forEach(user => {
        const gender = user.gender || '未知';
        genderMap.set(gender, (genderMap.get(gender) || 0) + 1);
      });

      const gender_distribution = Array.from(genderMap.entries()).map(([type, count]) => ({
        type,
        percentage: count / totalUsers,
      })).sort((a, b) => b.percentage - a.percentage);

      // 城市分布 - 取前 5
      const cityMap = new Map<string, number>();
      users.forEach(user => {
        const city = user.city;
        if (city) {
          cityMap.set(city, (cityMap.get(city) || 0) + 1);
        }
      });

      const top_cities = Array.from(cityMap.entries())
        .map(([city, count]) => ({ city, percentage: count / totalUsers }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5);

      // 活跃时段分析（基于用户最后登录时间）
      const hourMap = new Map<number, number>();
      users.forEach(user => {
        if (user.last_login) {
          const hour = new Date(user.last_login).getHours();
          hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
        }
      });

      const active_hours = Array.from(hourMap.entries())
        .map(([hour, count]) => ({ hour, percentage: count / totalUsers }))
        .sort((a, b) => a.hour - b.hour);

      // 兴趣分布
      const interestMap = new Map<string, number>();
      users.forEach(user => {
        const interests = user.interests || [];
        interests.forEach(interest => {
          interestMap.set(interest, (interestMap.get(interest) || 0) + 1);
        });
      });

      const interests = Array.from(interestMap.entries())
        .map(([interest, count]) => ({ interest, count, percentage: count / totalUsers }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      return { age_groups, gender_distribution, top_cities, active_hours, interests };
    } catch (error) {
      console.error('获取用户画像失败:', error);
      return { age_groups: [], gender_distribution: [], top_cities: [], active_hours: [], interests: [] };
    }
  }

  /**
   * 获取转化漏斗数据
   */
  async getConversionFunnel(): Promise<{
    stage: string;
    count: number;
    conversion_rate: number;
  }[]> {
    try {
      // 1. 获取总用户数
      const { count: totalUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true });

      // 2. 获取有作品的用户数（创作用户）
      const { data: creators } = await supabaseAdmin
        .from('works')
        .select('creator_id')
        .group('creator_id');
      const creatorCount = creators?.length || 0;

      // 3. 获取发布过作品的用户数
      const { data: publishedWorks } = await supabaseAdmin
        .from('works')
        .select('creator_id')
        .eq('status', 'approved');
      const publishingCreators = new Set(publishedWorks?.map(w => w.creator_id));
      const publishingCount = publishingCreators.size;

      // 4. 获取有互动的用户数（从行为日志统计）
      const { data: interactions } = await supabaseAdmin
        .from('user_behavior_logs')
        .select('user_id')
        .in('action', ['like_work', 'comment_work', 'share_work']);
      const interactingUsers = new Set(interactions?.map(i => i.user_id));
      const interactionCount = interactingUsers.size;

      return [
        {
          stage: '注册用户',
          count: totalUsers || 0,
          conversion_rate: 1,
        },
        {
          stage: '创作用户',
          count: creatorCount,
          conversion_rate: creatorCount / (totalUsers || 1),
        },
        {
          stage: '发布用户',
          count: publishingCount,
          conversion_rate: publishingCount / (totalUsers || 1),
        },
        {
          stage: '互动用户',
          count: interactionCount,
          conversion_rate: interactionCount / (totalUsers || 1),
        },
      ];
    } catch (error) {
      console.error('获取转化漏斗失败:', error);
      return [];
    }
  }

  /**
   * 获取热点话题数据（基于作品标签和浏览量）
   */
  async getHotTopics(limit: number = 10): Promise<{
    tag: string;
    heat_score: number;
    trend: 'rising' | 'falling' | 'stable';
    growth_rate: number;
    work_count: number;
  }[]> {
    try {
      // 获取所有作品的标签和浏览量
      const { data: works } = await supabaseAdmin
        .from('works')
        .select('tags, view_count, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!works || works.length === 0) {
        return [];
      }

      // 统计标签热度
      const tagMap = new Map<string, { count: number; views: number; recentCount: number }>();

      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

      works.forEach(work => {
        const tags = work.tags || [];
        const isRecent = new Date(work.created_at).getTime() > sevenDaysAgo;

        tags.forEach((tag: string) => {
          const existing = tagMap.get(tag) || { count: 0, views: 0, recentCount: 0 };
          existing.count++;
          existing.views += work.view_count || 0;
          if (isRecent) {
            existing.recentCount++;
          }
          tagMap.set(tag, existing);
        });
      });

      // 计算热度分数并排序
      const topics = Array.from(tagMap.entries())
        .map(([tag, data]) => {
          // 热度 = 作品数 * 0.4 + 浏览量/100 * 0.4 + 近期作品数 * 0.2
          const heat_score = Math.min(100, Math.round(
            data.count * 0.4 +
            (data.views / 100) * 0.4 +
            data.recentCount * 0.2
          ));

          // 计算增长率（近期 vs 全部）
          const growth_rate = data.count > 0
            ? ((data.recentCount / data.count) * 7 - 1) * 100
            : 0;

          // 判断趋势
          let trend: 'rising' | 'falling' | 'stable' = 'stable';
          if (growth_rate > 20) trend = 'rising';
          else if (growth_rate < -20) trend = 'falling';

          return {
            tag,
            heat_score,
            trend,
            growth_rate: Math.round(growth_rate),
            work_count: data.count,
          };
        })
        .sort((a, b) => b.heat_score - a.heat_score)
        .slice(0, limit);

      return topics;
    } catch (error) {
      console.error('获取热点话题失败:', error);
      return [];
    }
  }

  /**
   * 记录页面浏览
   */
  async trackPageView(page: string, userId?: string): Promise<void> {
    await this.trackBehavior({
      user_id: userId || 'anonymous',
      action: 'page_view',
      metadata: { page },
    });
  }

  /**
   * 记录推广作品曝光
   */
  async trackPromotedWorkView(
    userId: string,
    promotedWorkId: string,
    workId?: string
  ): Promise<void> {
    await this.trackBehavior({
      user_id: userId,
      action: 'view_promoted_work',
      promoted_work_id: promotedWorkId,
      work_id: workId,
    });
  }

  /**
   * 记录推广作品点击
   */
  async trackPromotedWorkClick(
    userId: string,
    promotedWorkId: string,
    workId?: string
  ): Promise<void> {
    await this.trackBehavior({
      user_id: userId,
      action: 'click_promoted_work',
      promoted_work_id: promotedWorkId,
      work_id: workId,
    });
  }

  /**
   * 追踪作品传播链路
   */
  async trackWorkPropagation(
    workId: string,
    userId: string,
    action: 'view' | 'share' | 'like' | 'comment',
    referrerUserId?: string
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('user_behavior_logs')
        .insert({
          user_id: userId,
          action: `work_${action}` as UserAction,
          work_id: workId,
          metadata: {
            referrer_user_id: referrerUserId,
            timestamp: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('记录作品传播行为失败:', error);
      }
    } catch (error) {
      console.error('记录作品传播行为异常:', error);
    }
  }

  /**
   * 获取作品传播路径分析
   */
  async getWorkPropagation(workId: string): Promise<{
    nodes: WorkPropagationNode[];
    chains: PropagationChain[];
    totalViews: number;
    totalShares: number;
    reachEstimate: number;
    propagationScore: number;
  }> {
    try {
      // 获取作品基础信息
      const { data: work } = await supabaseAdmin
        .from('works')
        .select('id, title, creator_id, created_at')
        .eq('id', workId)
        .single();

      if (!work) {
        throw new Error('作品不存在');
      }

      // 获取作品相关行为日志
      const { data: behaviors } = await supabaseAdmin
        .from('user_behavior_logs')
        .select('*')
        .eq('work_id', workId)
        .in('action', ['view_work', 'share_work', 'like_work', 'comment_work'])
        .order('created_at', { ascending: true });

      // 统计基础数据
      let totalViews = 0;
      let totalShares = 0;
      let totalLikes = 0;
      let totalComments = 0;

      behaviors?.forEach(behavior => {
        switch (behavior.action) {
          case 'view_work':
            totalViews++;
            break;
          case 'share_work':
            totalShares++;
            break;
          case 'like_work':
            totalLikes++;
            break;
          case 'comment_work':
            totalComments++;
            break;
        }
      });

      // 构建传播链路
      const chains: PropagationChain[] = (behaviors || []).map(behavior => ({
        id: behavior.id,
        work_id: behavior.work_id,
        user_id: behavior.user_id,
        action: behavior.action.replace('work_', ''),
        referrer_user_id: behavior.metadata?.referrer_user_id,
        created_at: behavior.created_at,
      }));

      // 获取创作者信息
      const { data: creator } = await supabaseAdmin
        .from('users')
        .select('raw_user_meta_data')
        .eq('id', work.creator_id)
        .single();

      const creatorName = creator?.raw_user_meta_data?.username || '未知创作者';

      // 计算传播分数（基于分享次数、互动数等）
      const propagationScore = Math.round(
        (totalShares * 3 + totalLikes * 0.5 + totalComments * 1) * 
        Math.log(totalViews + 1)
      );

      // 估算影响范围（基于传播深度和广度）
      const reachEstimate = Math.max(totalViews, Math.round(totalShares * 10));

      // 构建传播节点
      const nodeMap = new Map<string, WorkPropagationNode>();
      
      // 添加原始作品节点
      nodeMap.set(workId, {
        work_id: work.id,
        work_title: work.title,
        creator_id: work.creator_id,
        creator_name: creatorName,
        view_count: totalViews,
        share_count: totalShares,
        like_count: totalLikes,
        comment_count: totalComments,
        propagation_score: propagationScore,
        propagation_path: [work.creator_id],
        created_at: work.created_at,
      });

      return {
        nodes: Array.from(nodeMap.values()),
        chains,
        totalViews,
        totalShares,
        reachEstimate,
        propagationScore,
      };
    } catch (error) {
      console.error('获取作品传播路径失败:', error);
      return {
        nodes: [],
        chains: [],
        totalViews: 0,
        totalShares: 0,
        reachEstimate: 0,
        propagationScore: 0,
      };
    }
  }

  /**
   * 获取热门传播作品
   */
  async getHotPropagationWorks(limit: number = 10): Promise<WorkPropagationNode[]> {
    try {
      // 获取近期热门作品
      const { data: works } = await supabaseAdmin
        .from('works')
        .select(`
          id,
          title,
          creator_id,
          created_at,
          view_count
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!works || works.length === 0) {
        return [];
      }

      // 获取所有作品的点赞数
      const workIds = works.map(w => w.id);
      const { data: likesData } = await supabaseAdmin
        .from('works_likes')
        .select('work_id')
        .in('work_id', workIds);

      // 统计每个作品的点赞数
      const likesCount = new Map<string, number>();
      likesData?.forEach(like => {
        likesCount.set(like.work_id, (likesCount.get(like.work_id) || 0) + 1);
      });

      // 获取行为日志数据来丰富传播信息
      const { data: behaviors } = await supabaseAdmin
        .from('user_behavior_logs')
        .select('work_id, action, user_id')
        .in('work_id', workIds)
        .in('action', ['share_work', 'like_work', 'comment_work']);

      // 统计每个作品的传播数据
      const workStats = new Map<string, {
        share_count: number;
        like_count: number;
        comment_count: number;
        unique_viewers: Set<string>;
      }>();

      works.forEach(work => {
        workStats.set(work.id, {
          share_count: 0,
          like_count: 0,
          comment_count: 0,
          unique_viewers: new Set<string>(),
        });
      });

      behaviors?.forEach(behavior => {
        const stats = workStats.get(behavior.work_id);
        if (stats) {
          switch (behavior.action) {
            case 'share_work':
              stats.share_count++;
              break;
            case 'like_work':
              stats.like_count++;
              break;
            case 'comment_work':
              stats.comment_count++;
              break;
          }
          stats.unique_viewers.add(behavior.user_id);
        }
      });

      // 计算传播分数并排序
      const propagationWorks = works
        .map(work => {
          const stats = workStats.get(work.id)!;
          const workLikes = likesCount.get(work.id) || 0;
          const totalInteractions = stats.share_count + workLikes + stats.comment_count;
          const propagationScore = Math.round(
            (stats.share_count * 3 + workLikes * 0.5 + stats.comment_count * 1) *
            Math.log(stats.unique_viewers.size + work.view_count + 1)
          );

          return {
            work_id: work.id,
            work_title: work.title,
            creator_id: work.creator_id,
            creator_name: '创作者',
            view_count: work.view_count || stats.unique_viewers.size,
            share_count: stats.share_count,
            like_count: workLikes,
            comment_count: stats.comment_count,
            propagation_score: propagationScore,
            propagation_path: [work.creator_id],
            created_at: work.created_at,
          };
        })
        .sort((a, b) => b.propagation_score - a.propagation_score)
        .slice(0, limit);

      // 获取创作者姓名
      for (const work of propagationWorks) {
        const { data: creator } = await supabaseAdmin
          .from('users')
          .select('username')
          .eq('id', work.creator_id)
          .single();

        work.creator_name = creator?.username || '未知创作者';
      }

      return propagationWorks;
    } catch (error) {
      console.error('获取热门传播作品失败:', error);
      return [];
    }
  }

  /**
   * 获取品牌合作效果分析
   */
  async getBrandCollaborationAnalysis(brandName?: string): Promise<BrandCollaborationAnalysis[]> {
    try {
      // 获取所有推广订单（品牌合作）
      let query = supabaseAdmin
        .from('promotion_orders')
        .select(`
          id,
          brand_name,
          final_price,
          created_at,
          works!inner(id, title, views, likes)
        `);

      if (brandName) {
        query = query.eq('brand_name', brandName);
      }

      const { data: orders } = await query;

      if (!orders || orders.length === 0) {
        return [];
      }

      // 按品牌分组统计
      const brandMap = new Map<string, BrandCollaborationAnalysis>();

      orders.forEach(order => {
        const brand = order.brand_name || '未知品牌';
        if (!brandMap.has(brand)) {
          brandMap.set(brand, {
            brand_name: brand,
            total_campaigns: 0,
            total_works: 0,
            total_views: 0,
            total_engagement: 0,
            avg_engagement_rate: 0,
            total_revenue: 0,
            roi: 0,
            top_performing_works: [],
          });
        }

        const brandData = brandMap.get(brand)!;
        brandData.total_campaigns++;
        brandData.total_works += (order.works as any[])?.length || 0;
        brandData.total_revenue += order.final_price || 0;

        (order.works as any[])?.forEach((work: any) => {
          brandData.total_views += work.view_count || 0;
          brandData.total_engagement += work.likes || 0;
          brandData.top_performing_works.push({
            work_id: work.id,
            work_title: work.title,
            views: work.view_count || 0,
            engagement: work.likes || 0,
          });
        });
      });

      // 计算平均互动率和 ROI
      const results = Array.from(brandMap.values()).map(brand => {
        const avg_engagement_rate = brand.total_views > 0 
          ? brand.total_engagement / brand.total_views 
          : 0;

        // 简单计算 ROI（收入/成本，假设成本为收入的 30%）
        const estimated_cost = brand.total_revenue * 0.3;
        const roi = estimated_cost > 0 
          ? (brand.total_revenue - estimated_cost) / estimated_cost 
          : 0;

        // 按表现排序 top works
        brand.top_performing_works = brand.top_performing_works
          .sort((a, b) => b.views + b.engagement - (a.views + a.engagement))
          .slice(0, 5);

        return {
          ...brand,
          avg_engagement_rate,
          roi,
        };
      });

      return results.sort((a, b) => b.total_revenue - a.total_revenue);
    } catch (error) {
      console.error('获取品牌合作分析失败:', error);
      return [];
    }
  }

  /**
   * 获取创作者收益分析
   */
  async getCreatorRevenueAnalysis(creatorId?: string): Promise<CreatorRevenueAnalysis[]> {
    try {
      // 获取所有创作者的收益数据
      let query = supabaseAdmin
        .from('creator_revenue')
        .select(`
          *,
          user:users!inner(id, raw_user_meta_data),
          revenue_records!inner(
            id,
            amount,
            type,
            created_at,
            work_id,
            work:works(id, title)
          )
        `);

      if (creatorId) {
        query = query.eq('user_id', creatorId);
      }

      const { data: creators } = await query;

      if (!creators || creators.length === 0) {
        return [];
      }

      // 分析每个创作者的收益
      const results: CreatorRevenueAnalysis[] = creators.map(creator => {
        const creatorName = (creator.user as any)?.raw_user_meta_data?.username || '未知创作者';
        
        // 统计收益来源
        const sourceMap = new Map<string, number>();
        const trendMap = new Map<string, number>();
        const workRevenueMap = new Map<string, { title: string; revenue: number }>();

        creator.revenue_records?.forEach((record: any) => {
          // 按来源统计
          const source = record.type || 'other';
          sourceMap.set(source, (sourceMap.get(source) || 0) + (record.amount || 0));

          // 按日期统计趋势
          const date = new Date(record.created_at).toISOString().split('T')[0];
          trendMap.set(date, (trendMap.get(date) || 0) + (record.amount || 0));

          // 按作品统计
          if (record.work_id && record.work) {
            workRevenueMap.set(record.work_id, {
              title: record.work.title,
              revenue: (workRevenueMap.get(record.work_id)?.revenue || 0) + (record.amount || 0),
            });
          }
        });

        // 计算月度收益（最近 30 天）
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        let monthly_revenue = 0;
        creator.revenue_records?.forEach((record: any) => {
          if (new Date(record.created_at) >= thirtyDaysAgo) {
            monthly_revenue += record.amount || 0;
          }
        });

        // 构建收益来源数组
        const total_revenue = creator.total_revenue || 0;
        const revenue_sources = Array.from(sourceMap.entries()).map(([source, amount]) => ({
          source,
          amount,
          percentage: total_revenue > 0 ? amount / total_revenue : 0,
        }));

        // 构建收益趋势数组
        const revenue_trend = Array.from(trendMap.entries())
          .map(([date, amount]) => ({ date, amount }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-30);

        // 构建 top works
        const top_works = Array.from(workRevenueMap.entries())
          .map(([work_id, data]) => ({
            work_id,
            work_title: data.title,
            revenue: data.revenue,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        return {
          creator_id: creator.user_id,
          creator_name: creatorName,
          total_revenue,
          monthly_revenue,
          revenue_sources,
          revenue_trend,
          top_works,
        };
      });

      return results.sort((a, b) => b.total_revenue - a.total_revenue);
    } catch (error) {
      console.error('获取创作者收益分析失败:', error);
      return [];
    }
  }

  /**
   * 获取平台收入趋势预测
   */
  async getRevenueTrendPrediction(days: number = 30): Promise<{
    historical: Array<{ date: string; amount: number }>;
    predicted: Array<{ date: string; amount: number; lower?: number; upper?: number }>;
    totalRevenue: number;
    growthRate: number;
  }> {
    try {
      // 获取历史收入数据（过去 90 天）
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // 从多个收入来源聚合数据
      const [memberships, blindBoxes, promotions] = await Promise.all([
        supabaseAdmin
          .from('memberships')
          .select('amount, created_at')
          .gte('created_at', ninetyDaysAgo.toISOString())
          .eq('status', 'active'),
        
        supabaseAdmin
          .from('blind_box_sales')
          .select('price, created_at')
          .gte('created_at', ninetyDaysAgo.toISOString())
          .eq('status', 'completed'),
        
        supabaseAdmin
          .from('promotion_orders')
          .select('final_price, created_at')
          .gte('created_at', ninetyDaysAgo.toISOString())
          .eq('status', 'paid'),
      ]);

      // 按日期聚合收入
      const revenueMap = new Map<string, number>();

      memberships.data?.forEach(m => {
        const date = new Date(m.created_at).toISOString().split('T')[0];
        revenueMap.set(date, (revenueMap.get(date) || 0) + (m.amount || 0));
      });

      blindBoxes.data?.forEach(b => {
        const date = new Date(b.created_at).toISOString().split('T')[0];
        revenueMap.set(date, (revenueMap.get(date) || 0) + (b.price || 0));
      });

      promotions.data?.forEach(p => {
        const date = new Date(p.created_at).toISOString().split('T')[0];
        revenueMap.set(date, (revenueMap.get(date) || 0) + (p.final_price || 0));
      });

      // 构建历史数据数组
      const historical = Array.from(revenueMap.entries())
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // 计算总收益和增长率
      const totalRevenue = historical.reduce((sum, item) => sum + item.amount, 0);
      
      // 计算最近 30 天 vs 之前 30 天的增长率
      const recent30Days = historical.slice(-30);
      const previous30Days = historical.slice(-60, -30);
      
      const recentSum = recent30Days.reduce((sum, item) => sum + item.amount, 0);
      const previousSum = previous30Days.reduce((sum, item) => sum + item.amount, 0);
      
      const growthRate = previousSum > 0 ? (recentSum - previousSum) / previousSum : 0;

      // 简单预测（使用移动平均）
      const last7Days = historical.slice(-7);
      const avgDaily = last7Days.reduce((sum, item) => sum + item.amount, 0) / 7;

      const predicted = [];
      const today = new Date();
      
      for (let i = 1; i <= days; i++) {
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + i);
        const dateStr = futureDate.toISOString().split('T')[0];
        
        // 简单线性预测 + 一些随机性
        const predictedAmount = avgDaily * (1 + (growthRate / 30) * i);
        const variance = predictedAmount * 0.15; // 15% 的误差范围
        
        predicted.push({
          date: dateStr,
          amount: Math.round(predictedAmount),
          lower: Math.round(predictedAmount - variance),
          upper: Math.round(predictedAmount + variance),
        });
      }

      return {
        historical,
        predicted,
        totalRevenue,
        growthRate,
      };
    } catch (error) {
      console.error('获取收入趋势预测失败:', error);
      return {
        historical: [],
        predicted: [],
        totalRevenue: 0,
        growthRate: 0,
      };
    }
  }
}

export const analyticsTrackingService = new AnalyticsTrackingService();
export default analyticsTrackingService;
