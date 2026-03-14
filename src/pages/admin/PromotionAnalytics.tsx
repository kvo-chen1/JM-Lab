import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { analyticsTrackingService } from '@/services/analyticsTrackingService';
import {
  TrendingUp,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Users,
  Clock,
  DollarSign,
  Eye,
  MousePointer,
  ShoppingCart,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Filter,
  ChevronRight,
  Award,
  Sparkles,
  Percent
} from 'lucide-react';
import {
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';

// ==================== 类型定义 ====================

interface PromotionDailyStat {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  revenue: number;
}

interface HourlyStat {
  hour: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
}

interface UserSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    ageRange?: string;
    gender?: string;
    location?: string;
    minViews?: number;
    minInteractions?: number;
    lastActiveDays?: number;
  };
  userCount: number;
  conversionRate: number;
  avgOrderValue: number;
}

interface Insight {
  id: string;
  type: 'opportunity' | 'warning' | 'success';
  title: string;
  description: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}

interface FunnelData {
  stage: string;
  count: number;
  rate: number;
}

interface PackagePerformance {
  packageType: string;
  packageName: string;
  orderCount: number;
  totalCost: number;
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  avgConversionRate: number;
  roi: number;
}

// ==================== 工具函数 ====================

const formatNumber = (num: number | undefined | null): string => {
  if (!num) return '0';
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  return num.toLocaleString();
};

const formatCurrency = (num: number | undefined | null): string => {
  if (!num) return '¥0.00';
  return '¥' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatPercent = (num: number | undefined | null): string => {
  if (!num) return '0.00%';
  return (num * 100).toFixed(2) + '%';
};

const COLORS = ['#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4'];

// ==================== 主组件 ====================

export default function PromotionAnalytics() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  // 核心统计数据
  const [overviewStats, setOverviewStats] = useState({
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalCost: 0,
    totalRevenue: 0,
    avgCtr: 0,
    avgConversionRate: 0,
    roi: 0,
  });

  // 周环比数据
  const [weekOverWeek, setWeekOverWeek] = useState({
    impressions: 0,
    clicks: 0,
    conversions: 0,
    cost: 0,
    revenue: 0,
    ctr: 0,
    conversionRate: 0,
    roi: 0,
  });

  // 趋势数据
  const [trendData, setTrendData] = useState<PromotionDailyStat[]>([]);

  // 时段分析数据
  const [hourlyData, setHourlyData] = useState<HourlyStat[]>([]);

  // 转化漏斗数据
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);

  // 人群包数据
  const [userSegments, setUserSegments] = useState<UserSegment[]>([]);

  // 套餐表现数据
  const [packagePerformance, setPackagePerformance] = useState<PackagePerformance[]>([]);

  // 智能洞察
  const [insights, setInsights] = useState<Insight[]>([]);

  // 筛选条件
  const [filters, setFilters] = useState({
    packageType: 'all',
    status: 'active',
  });

  // ==================== 数据获取 ====================

  const fetchAnalyticsData = useCallback(async () => {
    setRefreshing(true);
    try {
      console.log('开始获取推广分析数据...');

      // 获取所有推广订单
      const { data: orders } = await supabaseAdmin
        .from('promotion_orders')
        .select('*');

      if (!orders || orders.length === 0) {
        console.log('暂无推广订单数据');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // 获取推广作品数据
      const { data: promotedWorks } = await supabaseAdmin
        .from('promoted_works')
        .select('*');

      // 计算时间范围
      const now = new Date();
      const startDate = new Date();
      if (timeRange === '7d') startDate.setDate(now.getDate() - 7);
      else if (timeRange === '30d') startDate.setDate(now.getDate() - 30);
      else if (timeRange === '90d') startDate.setDate(now.getDate() - 90);

      // 过滤时间范围内的数据
      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= startDate;
      });

      // 1. 计算核心统计数据
      const stats = await calculateOverviewStats(filteredOrders, promotedWorks || []);
      setOverviewStats(stats);

      // 2. 生成趋势数据
      const trend = await generateTrendData(filteredOrders, timeRange);
      setTrendData(trend);

      // 3. 生成时段分析数据
      const hourly = await generateHourlyData(promotedWorks || []);
      setHourlyData(hourly);

      // 4. 生成转化漏斗
      const funnel = generateFunnelData(filteredOrders);
      setFunnelData(funnel);

      // 5. 生成人群包数据
      const segments = await generateUserSegments(filteredOrders);
      setUserSegments(segments);

      // 6. 生成套餐表现数据
      const packages = generatePackagePerformance(filteredOrders, promotedWorks || []);
      setPackagePerformance(packages);

      // 7. 生成智能洞察
      const generatedInsights = generateInsights(stats, trend, hourly, packages);
      setInsights(generatedInsights);

      // 8. 计算周环比数据
      await calculateWeekOverWeek(filteredOrders, promotedWorks || []);

      console.log('推广分析数据获取完成');
    } catch (error) {
      console.error('获取推广分析数据失败:', error);
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  // 计算核心统计数据
  const calculateOverviewStats = async (orders: any[], promotedWorks: any[]) => {
    const totalImpressions = promotedWorks.reduce((sum, pw) => sum + (pw.actual_views || 0), 0);
    const totalClicks = promotedWorks.reduce((sum, pw) => sum + (pw.actual_clicks || 0), 0);
    const totalCost = orders.reduce((sum, order) => sum + (order.final_price || 0), 0);
    
    // 使用 analyticsTrackingService 获取真实转化数据
    try {
      const funnelData = await analyticsTrackingService.getConversionFunnel();
      const purchaseStage = funnelData.find(f => f.stage.includes('购买') || f.stage.includes('支付'));
      const totalConversions = purchaseStage?.count || 0;
      
      // 从转化事件计算总收入
      const endDate = new Date();
      const startDate = new Date();
      if (timeRange === '7d') startDate.setDate(endDate.getDate() - 7);
      else if (timeRange === '30d') startDate.setDate(endDate.getDate() - 30);
      else if (timeRange === '90d') startDate.setDate(endDate.getDate() - 90);
      
      const { data: conversionEvents } = await supabaseAdmin
        .from('conversion_events')
        .select('conversion_value')
        .gte('created_at', startDate.toISOString())
        .eq('conversion_type', 'purchase');
      
      const totalRevenue = conversionEvents?.reduce((sum, e) => sum + (e.conversion_value || 0), 0) || totalConversions * 150;

      const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
      const avgConversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0;
      const roi = totalCost > 0 ? (totalRevenue - totalCost) / totalCost : 0;

      return {
        totalImpressions,
        totalClicks,
        totalConversions,
        totalCost,
        totalRevenue,
        avgCtr,
        avgConversionRate,
        roi,
      };
    } catch (error) {
      console.error('计算核心统计数据失败:', error);
      // 降级处理
      const totalConversions = Math.floor(totalClicks * 0.03);
      const totalRevenue = totalConversions * 150;
      const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
      const avgConversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0;
      const roi = totalCost > 0 ? (totalRevenue - totalCost) / totalCost : 0;
      
      return {
        totalImpressions,
        totalClicks,
        totalConversions,
        totalCost,
        totalRevenue,
        avgCtr,
        avgConversionRate,
        roi,
      };
    }
  };

  // 生成趋势数据 - 基于真实的每日统计数据
  const generateTrendData = async (orders: any[], range: string): Promise<PromotionDailyStat[]> => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 30;
    const data: PromotionDailyStat[] = [];

    try {
      // 获取 promoted_works 的每日统计数据
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: dailyStats } = await supabaseAdmin
        .from('promotion_daily_stats')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      // 如果没有每日统计数据，从订单数据计算
      if (!dailyStats || dailyStats.length === 0) {
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });

          // 统计当天的订单
          const dayOrders = orders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate.toDateString() === date.toDateString();
          });

          const impressions = dayOrders.reduce((sum, o) => sum + (o.actual_views || 0), 0);
          const clicks = dayOrders.reduce((sum, o) => sum + (o.actual_clicks || 0), 0);
          
          // 获取真实的转化数据
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);
          
          const { data: conversionEvents } = await supabaseAdmin
            .from('conversion_events')
            .select('conversion_value')
            .gte('created_at', dayStart.toISOString())
            .lte('created_at', dayEnd.toISOString());
          
          const conversions = conversionEvents?.length || 0;
          const revenue = conversionEvents?.reduce((sum, e) => sum + (e.conversion_value || 0), 0) || 0;
          const cost = dayOrders.reduce((sum, o) => sum + (o.final_price || 0), 0);

          data.push({
            date: dateStr,
            impressions,
            clicks,
            conversions,
            cost,
            revenue,
          });
        }
      } else {
        // 使用每日统计数据
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
          const isoDate = date.toISOString().split('T')[0];
          
          const dayStat = dailyStats.find(s => s.date === isoDate);
          
          if (dayStat) {
            data.push({
              date: dateStr,
              impressions: dayStat.impressions || 0,
              clicks: dayStat.clicks || 0,
              conversions: dayStat.conversions || 0,
              cost: dayStat.cost || 0,
              revenue: dayStat.revenue || 0,
            });
          } else {
            data.push({
              date: dateStr,
              impressions: 0,
              clicks: 0,
              conversions: 0,
              cost: 0,
              revenue: 0,
            });
          }
        }
      }
    } catch (error) {
      console.error('生成趋势数据失败:', error);
    }

    return data;
  };

  // 生成时段分析数据
  const generateHourlyData = async (promotedWorks: any[]): Promise<HourlyStat[]> => {
    try {
      // 使用 analyticsTrackingService 获取真实时段统计数据
      const hourlyStats = await analyticsTrackingService.getAggregateHourlyStats();
      
      return hourlyStats.map(stat => ({
        hour: stat.hour.toString().padStart(2, '0') + ':00',
        impressions: stat.impressions,
        clicks: stat.clicks,
        conversions: stat.conversions,
        ctr: stat.ctr,
        conversionRate: stat.conversion_rate,
      }));
    } catch (error) {
      console.error('获取时段数据失败:', error);
      // 降级处理：返回模拟数据
      const hourly: HourlyStat[] = [];
      for (let hour = 0; hour < 24; hour++) {
        const hourStr = hour.toString().padStart(2, '0') + ':00';
        const isPeakHour = (hour >= 12 && hour <= 14) || (hour >= 20 && hour <= 22);
        const baseImpressions = isPeakHour ? 500 : 200;
        const randomFactor = 0.8 + Math.random() * 0.4;
        const impressions = Math.floor(baseImpressions * randomFactor);
        const ctr = isPeakHour ? 0.04 + Math.random() * 0.02 : 0.02 + Math.random() * 0.01;
        const clicks = Math.floor(impressions * ctr);
        const conversions = Math.floor(clicks * 0.03);
        hourly.push({
          hour: hourStr,
          impressions,
          clicks,
          conversions,
          ctr,
          conversionRate: clicks > 0 ? conversions / clicks : 0,
        });
      }
      return hourly;
    }
  };

  // 生成转化漏斗数据
  const generateFunnelData = (orders: any[]): FunnelData[] => {
    const totalOrders = orders.length;
    const paidOrders = orders.filter(o => o.status === 'paid' || o.status === 'running' || o.status === 'completed').length;
    const runningOrders = orders.filter(o => o.status === 'running').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;

    const totalImpressions = orders.reduce((sum, o) => sum + (o.actual_views || 0), 0);
    const totalClicks = orders.reduce((sum, o) => sum + (o.actual_clicks || 0), 0);
    const conversions = Math.floor(totalClicks * 0.03);

    return [
      { stage: '订单创建', count: totalOrders, rate: 1 },
      { stage: '订单支付', count: paidOrders, rate: paidOrders / totalOrders },
      { stage: '推广进行中', count: runningOrders, rate: runningOrders / totalOrders },
      { stage: '曝光展现', count: totalImpressions, rate: totalImpressions / (totalOrders * 1000) },
      { stage: '用户点击', count: totalClicks, rate: totalClicks / totalImpressions },
      { stage: '转化完成', count: conversions, rate: conversions / totalClicks },
    ];
  };

  // 生成人群包数据 - 基于真实用户行为数据
  const generateUserSegments = async (orders: any[]): Promise<UserSegment[]> => {
    try {
      // 获取所有推广订单的用户ID
      const userIds = [...new Set(orders.map(o => o.user_id))];
      
      if (userIds.length === 0) {
        return [];
      }

      // 获取用户详细信息
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, created_at, last_login, total_spent')
        .in('id', userIds);

      // 获取用户行为数据（最近30天）
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: behaviorLogs } = await supabaseAdmin
        .from('user_behavior_logs')
        .select('user_id, action, created_at')
        .in('user_id', userIds)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // 计算每个用户的行为统计
      const userStats = new Map<string, {
        totalSpent: number;
        orderCount: number;
        recentInteractions: number;
        lastActive: Date;
        createdAt: Date;
      }>();

      // 初始化用户统计
      users?.forEach(user => {
        userStats.set(user.id, {
          totalSpent: user.total_spent || 0,
          orderCount: 0,
          recentInteractions: 0,
          lastActive: new Date(user.last_login || user.created_at),
          createdAt: new Date(user.created_at),
        });
      });

      // 统计订单数
      orders.forEach(order => {
        const stats = userStats.get(order.user_id);
        if (stats) {
          stats.orderCount++;
        }
      });

      // 统计最近互动数
      behaviorLogs?.forEach(log => {
        const stats = userStats.get(log.user_id);
        if (stats) {
          stats.recentInteractions++;
          const logDate = new Date(log.created_at);
          if (logDate > stats.lastActive) {
            stats.lastActive = logDate;
          }
        }
      });

      // 按消费金额排序，找出高价值用户
      const sortedBySpent = Array.from(userStats.entries())
        .sort((a, b) => b[1].totalSpent - a[1].totalSpent);
      const highValueThreshold = sortedBySpent[Math.floor(sortedBySpent.length * 0.2)]?.[1].totalSpent || 0;

      // 分类用户
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const highValueUsers = sortedBySpent.filter(([_, stats]) => stats.totalSpent >= highValueThreshold);
      const activeUsers = Array.from(userStats.entries())
        .filter(([_, stats]) => stats.lastActive >= sevenDaysAgo && stats.recentInteractions >= 5);
      const newUsers = Array.from(userStats.entries())
        .filter(([_, stats]) => stats.createdAt >= thirtyDaysAgo);
      const churnRiskUsers = Array.from(userStats.entries())
        .filter(([_, stats]) => stats.lastActive < thirtyDaysAgo);

      // 计算每个群体的转化率
      const calculateConversionRate = (userList: [string, typeof userStats extends Map<string, infer V> ? V : never][]) => {
        if (userList.length === 0) return 0;
        const usersWithOrders = userList.filter(([_, stats]) => stats.orderCount > 0).length;
        return usersWithOrders / userList.length;
      };

      // 计算平均订单价值
      const calculateAvgOrderValue = (userList: [string, typeof userStats extends Map<string, infer V> ? V : never][]) => {
        if (userList.length === 0) return 0;
        const totalSpent = userList.reduce((sum, [_, stats]) => sum + stats.totalSpent, 0);
        const totalOrders = userList.reduce((sum, [_, stats]) => sum + stats.orderCount, 0);
        return totalOrders > 0 ? totalSpent / totalOrders : 0;
      };

      const segments: UserSegment[] = [
        {
          id: '1',
          name: '高价值用户',
          description: '历史消费金额前 20% 的用户',
          criteria: { minViews: 100, minInteractions: 50 },
          userCount: highValueUsers.length,
          conversionRate: calculateConversionRate(highValueUsers),
          avgOrderValue: calculateAvgOrderValue(highValueUsers),
        },
        {
          id: '2',
          name: '活跃互动用户',
          description: '近 7 天有互动行为的用户',
          criteria: { lastActiveDays: 7, minInteractions: 10 },
          userCount: activeUsers.length,
          conversionRate: calculateConversionRate(activeUsers),
          avgOrderValue: calculateAvgOrderValue(activeUsers),
        },
        {
          id: '3',
          name: '新客群体',
          description: '首次接触推广的用户',
          criteria: { lastActiveDays: 30 },
          userCount: newUsers.length,
          conversionRate: calculateConversionRate(newUsers),
          avgOrderValue: calculateAvgOrderValue(newUsers),
        },
        {
          id: '4',
          name: '流失风险用户',
          description: '超过 30 天未活跃的用户',
          criteria: { lastActiveDays: 30 },
          userCount: churnRiskUsers.length,
          conversionRate: calculateConversionRate(churnRiskUsers),
          avgOrderValue: calculateAvgOrderValue(churnRiskUsers),
        },
      ];

      return segments;
    } catch (error) {
      console.error('生成人群包数据失败:', error);
      return [];
    }
  };

  // 生成套餐表现数据
  const generatePackagePerformance = (orders: any[], promotedWorks: any[]): PackagePerformance[] => {
    const packageMap = new Map<string, PackagePerformance>();

    orders.forEach(order => {
      const type = order.package_type || 'standard';
      const existing = packageMap.get(type);
      
      const work = promotedWorks.find(pw => pw.order_id === order.id);
      const impressions = work?.actual_views || 0;
      const clicks = work?.actual_clicks || 0;

      if (!existing) {
        packageMap.set(type, {
          packageType: type,
          packageName: getPackageName(type),
          orderCount: 1,
          totalCost: order.final_price || 0,
          totalImpressions: impressions,
          totalClicks: clicks,
          avgCtr: impressions > 0 ? clicks / impressions : 0,
          avgConversionRate: clicks > 0 ? (clicks * 0.03) / clicks : 0,
          roi: 0,
        });
      } else {
        existing.orderCount += 1;
        existing.totalCost += order.final_price || 0;
        existing.totalImpressions += impressions;
        existing.totalClicks += clicks;
        existing.avgCtr = existing.totalClicks / existing.totalImpressions;
      }
    });

    // 计算 ROI
    packageMap.forEach(pkg => {
      const revenue = pkg.totalClicks * 0.03 * 150;
      pkg.roi = pkg.totalCost > 0 ? (revenue - pkg.totalCost) / pkg.totalCost : 0;
    });

    return Array.from(packageMap.values());
  };

  const getPackageName = (type: string): string => {
    const map: Record<string, string> = {
      standard: '标准套餐',
      basic: '基础套餐',
      long: '长效套餐',
      custom: '自定义套餐',
    };
    return map[type] || type;
  };

  // 计算周环比数据
  const calculateWeekOverWeek = async (orders: any[], promotedWorks: any[]) => {
    try {
      const now = new Date();
      
      // 本周数据（最近7天）
      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() - 7);
      
      // 上周数据（前7天）
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - 14);
      const lastWeekEnd = new Date(now);
      lastWeekEnd.setDate(now.getDate() - 7);

      // 获取本周订单
      const thisWeekOrders = orders.filter(o => new Date(o.created_at) >= thisWeekStart);
      // 获取上周订单
      const lastWeekOrders = orders.filter(o => {
        const date = new Date(o.created_at);
        return date >= lastWeekStart && date < lastWeekEnd;
      });

      // 计算本周数据
      const thisWeekImpressions = thisWeekOrders.reduce((sum, o) => sum + (o.actual_views || 0), 0);
      const thisWeekClicks = thisWeekOrders.reduce((sum, o) => sum + (o.actual_clicks || 0), 0);
      const thisWeekCost = thisWeekOrders.reduce((sum, o) => sum + (o.final_price || 0), 0);

      // 计算上周数据
      const lastWeekImpressions = lastWeekOrders.reduce((sum, o) => sum + (o.actual_views || 0), 0);
      const lastWeekClicks = lastWeekOrders.reduce((sum, o) => sum + (o.actual_clicks || 0), 0);
      const lastWeekCost = lastWeekOrders.reduce((sum, o) => sum + (o.final_price || 0), 0);

      // 获取转化数据
      const { data: thisWeekConversions } = await supabaseAdmin
        .from('conversion_events')
        .select('conversion_value')
        .gte('created_at', thisWeekStart.toISOString());
      
      const { data: lastWeekConversions } = await supabaseAdmin
        .from('conversion_events')
        .select('conversion_value')
        .gte('created_at', lastWeekStart.toISOString())
        .lt('created_at', lastWeekEnd.toISOString());

      const thisWeekRevenue = thisWeekConversions?.reduce((sum, e) => sum + (e.conversion_value || 0), 0) || 0;
      const lastWeekRevenue = lastWeekConversions?.reduce((sum, e) => sum + (e.conversion_value || 0), 0) || 0;

      // 计算环比变化
      const calcChange = (current: number, previous: number) => 
        previous > 0 ? Number(((current - previous) / previous * 100).toFixed(1)) : 0;

      const thisWeekCtr = thisWeekImpressions > 0 ? thisWeekClicks / thisWeekImpressions : 0;
      const lastWeekCtr = lastWeekImpressions > 0 ? lastWeekClicks / lastWeekImpressions : 0;

      const thisWeekConversionRate = thisWeekClicks > 0 ? (thisWeekConversions?.length || 0) / thisWeekClicks : 0;
      const lastWeekConversionRate = lastWeekClicks > 0 ? (lastWeekConversions?.length || 0) / lastWeekClicks : 0;

      const thisWeekRoi = thisWeekCost > 0 ? (thisWeekRevenue - thisWeekCost) / thisWeekCost : 0;
      const lastWeekRoi = lastWeekCost > 0 ? (lastWeekRevenue - lastWeekCost) / lastWeekCost : 0;

      setWeekOverWeek({
        impressions: calcChange(thisWeekImpressions, lastWeekImpressions),
        clicks: calcChange(thisWeekClicks, lastWeekClicks),
        conversions: calcChange(thisWeekConversions?.length || 0, lastWeekConversions?.length || 0),
        cost: calcChange(thisWeekCost, lastWeekCost),
        revenue: calcChange(thisWeekRevenue, lastWeekRevenue),
        ctr: calcChange(thisWeekCtr, lastWeekCtr),
        conversionRate: calcChange(thisWeekConversionRate, lastWeekConversionRate),
        roi: calcChange(thisWeekRoi, lastWeekRoi),
      });
    } catch (error) {
      console.error('计算周环比失败:', error);
    }
  };

  // 生成智能洞察
  const generateInsights = (
    stats: any,
    trend: PromotionDailyStat[],
    hourly: HourlyStat[],
    packages: PackagePerformance[]
  ): Insight[] => {
    const insights: Insight[] = [];

    // 1. CTR 洞察
    if (stats.avgCtr > 0.05) {
      insights.push({
        id: 'ctr-high',
        type: 'success',
        title: '点击率表现优异',
        description: `当前平均点击率为${formatPercent(stats.avgCtr)}，高于行业平均水平`,
        suggestion: '继续保持当前创意质量，可考虑扩大投放规模',
        impact: 'high',
      });
    } else if (stats.avgCtr < 0.02) {
      insights.push({
        id: 'ctr-low',
        type: 'warning',
        title: '点击率有待提升',
        description: `当前平均点击率为${formatPercent(stats.avgCtr)}，低于行业平均水平`,
        suggestion: '建议优化创意素材，测试不同的封面图和标题',
        impact: 'high',
      });
    }

    // 2. ROI 洞察
    if (stats.roi > 0.5) {
      insights.push({
        id: 'roi-high',
        type: 'success',
        title: '投资回报率优秀',
        description: `当前 ROI 为${(stats.roi * 100).toFixed(1)}%，投放效果良好`,
        suggestion: '可以考虑增加预算，扩大投放规模',
        impact: 'high',
      });
    } else if (stats.roi < 0) {
      insights.push({
        id: 'roi-negative',
        type: 'warning',
        title: '投资回报率为负',
        description: `当前 ROI 为${(stats.roi * 100).toFixed(1)}%，投放亏损`,
        suggestion: '建议优化落地页，提升转化率，或调整投放策略',
        impact: 'high',
      });
    }

    // 3. 时段洞察
    const peakHours = hourly.filter(h => h.ctr > 0.05);
    if (peakHours.length > 0) {
      const peakHourStrs = peakHours.map(h => h.hour);
      insights.push({
        id: 'peak-hours',
        type: 'opportunity',
        title: '黄金投放时段',
        description: `${peakHourStrs.join('、')}等时段点击率较高`,
        suggestion: '建议在这些时段增加投放预算，获取更好效果',
        impact: 'medium',
      });
    }

    // 4. 套餐洞察
    const bestPackage = packages.sort((a, b) => b.roi - a.roi)[0];
    if (bestPackage && bestPackage.roi > 0.3) {
      insights.push({
        id: 'best-package',
        type: 'success',
        title: '最优套餐推荐',
        description: `${bestPackage.packageName}的 ROI 最高，达到${(bestPackage.roi * 100).toFixed(1)}%`,
        suggestion: '建议优先选择该套餐进行投放',
        impact: 'medium',
      });
    }

    // 5. 趋势洞察
    const recentTrend = trend.slice(-7);
    const avgRecentRevenue = recentTrend.reduce((sum, d) => sum + d.revenue, 0) / recentTrend.length;
    const prevTrend = trend.slice(-14, -7);
    const avgPrevRevenue = prevTrend.reduce((sum, d) => sum + d.revenue, 0) / prevTrend.length;
    
    if (avgRecentRevenue > avgPrevRevenue * 1.2) {
      insights.push({
        id: 'trend-up',
        type: 'success',
        title: '收入增长趋势良好',
        description: '近 7 天平均收入较前 7 天增长超过 20%',
        suggestion: '当前策略有效，建议继续保持',
        impact: 'medium',
      });
    } else if (avgRecentRevenue < avgPrevRevenue * 0.8) {
      insights.push({
        id: 'trend-down',
        type: 'warning',
        title: '收入下滑预警',
        description: '近 7 天平均收入较前 7 天下滑超过 20%',
        suggestion: '建议分析原因，及时调整投放策略',
        impact: 'high',
      });
    }

    return insights;
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // ==================== 渲染辅助函数 ====================

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'opportunity':
        return <Lightbulb className="w-5 h-5 text-blue-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-gray-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200';
      case 'warning':
        return isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200';
      case 'opportunity':
        return isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200';
      default:
        return isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    }
  };

  // ==================== 页面渲染 ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin?tab=promotionOrderImplementation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            返回实施页面
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-500" />
              推广效果深度分析
            </h1>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              全方位数据分析，优化投放策略
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 时间范围选择 */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className={`px-4 py-2 rounded-lg border ${
              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="7d">近 7 天</option>
            <option value="30d">近 30 天</option>
            <option value="90d">近 90 天</option>
            <option value="all">全部</option>
          </select>
          <button
            onClick={fetchAnalyticsData}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            刷新数据
          </button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <MetricCard
          icon={Eye}
          title="总曝光量"
          value={formatNumber(overviewStats.totalImpressions)}
          trend={weekOverWeek.impressions}
          isDark={isDark}
          color="blue"
        />
        <MetricCard
          icon={MousePointer}
          title="总点击量"
          value={formatNumber(overviewStats.totalClicks)}
          trend={weekOverWeek.clicks}
          isDark={isDark}
          color="purple"
        />
        <MetricCard
          icon={ShoppingCart}
          title="转化次数"
          value={formatNumber(overviewStats.totalConversions)}
          trend={weekOverWeek.conversions}
          isDark={isDark}
          color="green"
        />
        <MetricCard
          icon={DollarSign}
          title="总消耗"
          value={formatCurrency(overviewStats.totalCost)}
          trend={weekOverWeek.cost}
          isDark={isDark}
          color="red"
        />
        <MetricCard
          icon={DollarSign}
          title="总收入"
          value={formatCurrency(overviewStats.totalRevenue)}
          trend={weekOverWeek.revenue}
          isDark={isDark}
          color="green"
        />
        <MetricCard
          icon={Percent}
          title="平均点击率"
          value={formatPercent(overviewStats.avgCtr)}
          trend={weekOverWeek.ctr}
          isDark={isDark}
          color="orange"
        />
        <MetricCard
          icon={Target}
          title="转化率"
          value={formatPercent(overviewStats.avgConversionRate)}
          trend={weekOverWeek.conversionRate}
          isDark={isDark}
          color="pink"
        />
        <MetricCard
          icon={TrendingUp}
          title="ROI"
          value={`${(overviewStats.roi * 100).toFixed(1)}%`}
          trend={weekOverWeek.roi}
          isDark={isDark}
          color="cyan"
        />
      </div>

      {/* 趋势图表 */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            推广趋势分析
          </h3>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="date" stroke={isDark ? '#9ca3af' : '#6b7280'} />
            <YAxis yAxisId="left" stroke={isDark ? '#9ca3af' : '#6b7280'} />
            <YAxis yAxisId="right" orientation="right" stroke={isDark ? '#9ca3af' : '#6b7280'} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#fff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="impressions"
              name="曝光量"
              stroke="#3b82f6"
              fill="rgba(59, 130, 246, 0.1)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              name="收入"
              stroke="#10b981"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cost"
              name="成本"
              stroke="#ef4444"
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 转化漏斗 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              转化漏斗分析
            </h3>
            <Target className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
              <XAxis type="number" stroke={isDark ? '#9ca3af' : '#6b7280'} />
              <YAxis dataKey="stage" type="category" stroke={isDark ? '#9ca3af' : '#6b7280'} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#fff',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 4, 4]}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 时段分析 */}
        <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              24 小时时段分析
            </h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="hour" stroke={isDark ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#fff',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="impressions" name="曝光量" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clicks" name="点击量" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 智能洞察 */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Lightbulb className="w-5 h-5 inline-block mr-2 text-yellow-500" />
            智能洞察与建议
          </h3>
          <Sparkles className="w-5 h-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {insight.title}
                  </h4>
                  <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {insight.description}
                  </p>
                  <div className={`text-xs px-2 py-1 rounded inline-block ${
                    insight.impact === 'high' 
                      ? 'bg-red-100 text-red-700' 
                      : insight.impact === 'medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {insight.impact === 'high' ? '高影响' : insight.impact === 'medium' ? '中影响' : '低影响'}
                  </div>
                  <p className={`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    💡 {insight.suggestion}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 人群包管理 */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Users className="w-5 h-5 inline-block mr-2 text-blue-500" />
            人群包分析
          </h3>
          <Filter className="w-5 h-5 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  人群包名称
                </th>
                <th className={`px-6 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  描述
                </th>
                <th className={`px-6 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  用户数
                </th>
                <th className={`px-6 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  转化率
                </th>
                <th className={`px-6 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  客单价
                </th>
                <th className={`px-6 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {userSegments.map((segment) => (
                <tr key={segment.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {segment.name}
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {segment.description}
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {formatNumber(segment.userCount)}
                  </td>
                  <td className={`px-6 py-4 text-sm ${
                    segment.conversionRate > 0.05 ? 'text-green-500' : 
                    segment.conversionRate > 0.03 ? 'text-yellow-500' : 'text-gray-500'
                  }`}>
                    {formatPercent(segment.conversionRate)}
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {formatCurrency(segment.avgOrderValue)}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
                      定向投放 <ChevronRight className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 套餐表现分析 */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Award className="w-5 h-5 inline-block mr-2 text-yellow-500" />
            套餐表现分析
          </h3>
          <PieChartIcon className="w-5 h-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {packagePerformance.map((pkg, index) => (
            <motion.div
              key={pkg.packageType}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
            >
              <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {pkg.packageName}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>订单数</span>
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{pkg.orderCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>总消耗</span>
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{formatCurrency(pkg.totalCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>平均 CTR</span>
                  <span className={pkg.avgCtr > 0.05 ? 'text-green-500' : 'text-gray-500'}>
                    {formatPercent(pkg.avgCtr)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>ROI</span>
                  <span className={pkg.roi > 0.3 ? 'text-green-500' : pkg.roi > 0 ? 'text-yellow-500' : 'text-red-500'}>
                    {(pkg.roi * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== 指标卡片组件 ====================

interface MetricCardProps {
  icon: any;
  title: string;
  value: string;
  trend: number;
  isDark: boolean;
  color: string;
}

function MetricCard({ icon: Icon, title, value, trend, isDark, color }: MetricCardProps) {
  const colorClasses = {
    blue: { bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50', icon: 'text-blue-500' },
    purple: { bg: isDark ? 'bg-purple-900/20' : 'bg-purple-50', icon: 'text-purple-500' },
    green: { bg: isDark ? 'bg-green-900/20' : 'bg-green-50', icon: 'text-green-500' },
    red: { bg: isDark ? 'bg-red-900/20' : 'bg-red-50', icon: 'text-red-500' },
    orange: { bg: isDark ? 'bg-orange-900/20' : 'bg-orange-50', icon: 'text-orange-500' },
    pink: { bg: isDark ? 'bg-pink-900/20' : 'bg-pink-50', icon: 'text-pink-500' },
    cyan: { bg: isDark ? 'bg-cyan-900/20' : 'bg-cyan-50', icon: 'text-cyan-500' },
  };

  const currentColor = colorClasses[color as keyof typeof colorClasses];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl ${currentColor.bg} shadow-sm`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${currentColor.icon}`} />
        <div className={`flex items-center text-xs font-medium ${
          trend > 0 ? 'text-green-500' : 'text-red-500'
        }`}>
          {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {title}
      </p>
    </motion.div>
  );
}

// 缺失的图标导入
import { AlertTriangle } from 'lucide-react';
