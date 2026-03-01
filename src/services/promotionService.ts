/**
 * 必火推广服务
 * 处理推广相关的数据获取和操作
 */

import { supabase } from '@/lib/supabase';

// 推广订单状态
type PromotionOrderStatus = 'pending' | 'paid' | 'running' | 'completed' | 'reviewing' | 'rejected' | 'waiting' | 'stopped' | 'cancelled';

// 推广订单接口
export interface PromotionOrder {
  id: string;
  userId: string;
  workId: string;
  workTitle: string;
  workThumbnail?: string;
  packageType: 'standard' | 'basic' | 'long' | 'custom';
  packageName: string;
  targetType: 'account' | 'transaction' | 'live';
  boostMetric: 'views' | 'fans' | 'interactions' | 'hot';
  price: number;
  discountAmount: number;
  finalPrice: number;
  expectedViews: string;
  actualViews: number;
  status: PromotionOrderStatus;
  createdAt: string;
  paidAt?: string;
  startAt?: string;
  endAt?: string;
}

// 推广统计数据接口
export interface PromotionStats {
  totalSpent: number;
  totalOrders: number;
  totalViews: number;
  totalFans: number;
  totalInteractions: number;
  avgClickRate: number;
  runningOrders: number;
  completedOrders: number;
}

// 推广趋势数据点
export interface PromotionTrendPoint {
  date: string;
  spent: number;
  views: number;
  fans: number;
  interactions: number;
}

// 用户作品接口（用于推广选择）
export interface UserWorkForPromotion {
  id: string;
  title: string;
  thumbnail?: string;
  videoUrl?: string;
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
  type: 'image' | 'video' | 'text';
  duration?: string;
}

// 优惠券接口
export interface PromotionCoupon {
  id: string;
  userId: string;
  discount: number; // 折扣率，如 0.7 表示7折
  maxDeduction: number;
  minOrderAmount: number;
  validUntil: string;
  used: boolean;
  usedAt?: string;
  description: string;
}

// 推广金账户接口
export interface PromotionWallet {
  userId: string;
  balance: number;
  totalRecharged: number;
  totalSpent: number;
}

// 推广作品接口
export interface PromotedWork {
  id: string;
  orderId: string;
  workId: string;
  userId: string;
  packageType: 'standard' | 'basic' | 'long' | 'custom';
  targetType: string;
  metricType: string;
  startTime: string;
  endTime: string;
  targetViews: number;
  actualViews: number;
  targetClicks: number;
  actualClicks: number;
  promotionWeight: number;
  priorityScore: number;
  displayPosition: number;
  isFeatured: boolean;
  status: 'active' | 'paused' | 'completed' | 'expired';
  dailyViews: number;
  dailyClicks: number;
  workTitle: string;
  workThumbnail: string;
  finalPrice: number;
  orderNo: string;
}

// 推广摘要接口
export interface PromotionSummary {
  active_promotions: number;
  total_impressions: number;
  total_clicks: number;
  avg_ctr: number;
  total_spent: number;
  today_impressions: number;
  today_clicks: number;
}

// 活跃推广作品接口（用于广场展示）
export interface ActivePromotedWork {
  promotedWorkId: string;
  orderId: string;
  workId: string;
  userId: string;
  promotionWeight: number;
  priorityScore: number;
  displayPosition: number;
  isFeatured: boolean;
  packageType: 'standard' | 'basic' | 'long' | 'custom';
  remainingHours: number;
}

class PromotionService {
  /**
   * 获取用户的推广订单列表
   */
  async getUserOrders(userId: string, status?: PromotionOrderStatus): Promise<PromotionOrder[]> {
    try {
      let query = supabase
        .from('promotion_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('获取推广订单失败:', error);
        return [];
      }

      return (data || []).map(order => ({
        id: order.id,
        userId: order.user_id,
        workId: order.work_id,
        workTitle: order.work_title,
        workThumbnail: order.work_thumbnail,
        packageType: order.package_type,
        packageName: order.package_name,
        targetType: order.target_type,
        boostMetric: order.boost_metric,
        price: order.original_price,
        discountAmount: order.discount_amount,
        finalPrice: order.final_price,
        expectedViews: order.expected_views,
        actualViews: order.actual_views || 0,
        status: order.status,
        createdAt: order.created_at,
        paidAt: order.payment_time,
        startAt: order.start_at,
        endAt: order.end_at,
      }));
    } catch (err) {
      console.error('获取推广订单失败:', err);
      return [];
    }
  }

  /**
   * 获取推广统计数据
   */
  async getPromotionStats(userId: string): Promise<PromotionStats> {
    try {
      // 获取所有订单
      const { data: orders, error } = await supabase
        .from('promotion_orders')
        .select('final_price, actual_views, status')
        .eq('user_id', userId);

      if (error) {
        console.warn('获取推广统计失败:', error);
        return this.getDefaultStats();
      }

      const stats = (orders || []).reduce((acc, order) => {
        acc.totalSpent += order.final_price || 0;
        acc.totalViews += order.actual_views || 0;
        acc.totalOrders += 1;
        
        if (order.status === 'running') {
          acc.runningOrders += 1;
        } else if (order.status === 'completed') {
          acc.completedOrders += 1;
        }
        
        return acc;
      }, {
        totalSpent: 0,
        totalOrders: 0,
        totalViews: 0,
        totalFans: 0,
        totalInteractions: 0,
        avgClickRate: 0,
        runningOrders: 0,
        completedOrders: 0,
      });

      // 计算平均点击率（模拟计算）
      stats.avgClickRate = stats.totalViews > 0 ? Math.min((stats.totalOrders * 100) / stats.totalViews, 100) : 0;

      return stats;
    } catch (err) {
      console.error('获取推广统计失败:', err);
      return this.getDefaultStats();
    }
  }

  /**
   * 获取推广趋势数据
   */
  async getPromotionTrend(userId: string, days: number = 7): Promise<PromotionTrendPoint[]> {
    try {
      const data: PromotionTrendPoint[] = [];
      
      // 获取所有订单数据
      const { data: orders, error } = await supabase
        .from('promotion_orders')
        .select('final_price, actual_views, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.warn('获取推广趋势失败:', error);
        return this.generateEmptyTrend(days);
      }

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dayStart = date.getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;

        // 统计当天的数据
        const dayOrders = (orders || []).filter(o => {
          const orderTime = new Date(o.created_at).getTime();
          return orderTime >= dayStart && orderTime < dayEnd;
        });

        data.push({
          date: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
          spent: dayOrders.reduce((sum, o) => sum + (o.final_price || 0), 0),
          views: dayOrders.reduce((sum, o) => sum + (o.actual_views || 0), 0),
          fans: Math.floor(Math.random() * 10), // 模拟数据
          interactions: Math.floor(Math.random() * 50), // 模拟数据
        });
      }

      return data;
    } catch (err) {
      console.error('获取推广趋势失败:', err);
      return this.generateEmptyTrend(days);
    }
  }

  /**
   * 获取用户可用于推广的作品列表（从 works 表获取）
   */
  async getUserWorksForPromotion(userId: string): Promise<UserWorkForPromotion[]> {
    console.log('[PromotionService] getUserWorksForPromotion called with userId:', userId);
    try {
      // 首先尝试从 API 获取
      const token = localStorage.getItem('token');
      console.log('[PromotionService] Token exists:', !!token);
      let loadedWorks: UserWorkForPromotion[] = [];

      if (token) {
        try {
          // 获取所有作品（不限制状态），与 MyWorks 保持一致
          const response = await fetch(`/api/works?creator_id=${userId}&limit=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const result = await response.json();
            console.log('[PromotionService] API returned', result.data?.length, 'works');
            console.log('[PromotionService] Sample work status:', result.data?.[0]?.status);
            if (result.code === 0 && Array.isArray(result.data)) {
              // 显示所有作品（包括草稿），与"我的作品"页面保持一致
              const allWorks = result.data;
              console.log('[PromotionService] All works count:', allWorks.length);
              loadedWorks = allWorks.map((w: any, index: number) => {
                // 调试前3个作品的缩略图
                if (index < 3) {
                  console.log(`[PromotionService] Work ${index} keys:`, Object.keys(w));
                  console.log(`[PromotionService] Work ${index} thumbnail:`, w.thumbnail?.substring(0, 50));
                  console.log(`[PromotionService] Work ${index} cover_url:`, w.cover_url?.substring(0, 50));
                  console.log(`[PromotionService] Work ${index} videoUrl:`, w.videoUrl?.substring(0, 50));
                  console.log(`[PromotionService] Work ${index} video_url:`, w.video_url?.substring(0, 50));
                  console.log(`[PromotionService] Work ${index} type:`, w.type);
                }

                // 处理 created_at 时间戳
                let createdAt: string;
                if (w.created_at) {
                  if (typeof w.created_at === 'string') {
                    // 如果是 ISO 字符串，直接使用
                    createdAt = new Date(w.created_at).toISOString();
                  } else if (typeof w.created_at === 'number') {
                    // 如果是数字时间戳，判断是秒还是毫秒
                    createdAt = new Date(w.created_at > 10000000000 ? w.created_at : w.created_at * 1000).toISOString();
                  } else {
                    createdAt = new Date().toISOString();
                  }
                } else {
                  createdAt = new Date().toISOString();
                }

                // 获取缩略图，优先使用 thumbnail，其次 cover_url
                let thumbnail = w.thumbnail || w.cover_url || '';

                return {
                  id: w.id?.toString() || '',
                  title: w.title || '未命名作品',
                  thumbnail,
                  videoUrl: w.video_url || w.videoUrl || '',
                  views: w.views || 0,
                  likes: w.likes || 0,
                  comments: w.comments || 0,
                  createdAt,
                  type: w.type || 'image',
                  duration: w.video_url ? '03:45' : undefined,
                };
              });
              return loadedWorks;
            }
          }
        } catch (apiError) {
          console.warn('Backend API failed, falling back to Supabase:', apiError);
        }
      }

      // 如果 API 失败，使用 Supabase 从 works 表获取
      const { data: works, error } = await supabase
        .from('works')
        .select('id, title, thumbnail, cover_url, video_url, view_count, likes, comments, created_at, type, status')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('获取用户作品失败:', error);
        return [];
      }

      return (works || []).map(work => ({
        id: work.id,
        title: work.title || '未命名作品',
        thumbnail: work.thumbnail || work.cover_url || '',
        videoUrl: work.video_url || '',
        views: work.view_count || 0,
        likes: work.likes || 0,
        comments: work.comments || 0,
        createdAt: work.created_at ? new Date(work.created_at * 1000).toISOString() : new Date().toISOString(),
        type: work.type || 'image',
        duration: work.video_url ? '03:45' : undefined,
      }));
    } catch (err) {
      console.error('获取用户作品失败:', err);
      return [];
    }
  }

  /**
   * 获取用户的优惠券列表
   */
  async getUserCoupons(userId: string): Promise<PromotionCoupon[]> {
    try {
      const { data, error } = await supabase
        .from('promotion_coupons')
        .select('*')
        .eq('user_id', userId)
        .eq('used', false)
        .gte('valid_until', new Date().toISOString())
        .order('valid_until', { ascending: true });

      if (error) {
        console.warn('获取优惠券失败:', error);
        return this.getDefaultCoupons();
      }

      if (!data || data.length === 0) {
        return this.getDefaultCoupons();
      }

      return data.map(coupon => ({
        id: coupon.id,
        userId: coupon.user_id,
        discount: coupon.discount,
        maxDeduction: coupon.max_deduction,
        minOrderAmount: coupon.min_order_amount,
        validUntil: coupon.valid_until,
        used: coupon.used,
        usedAt: coupon.used_at,
        description: coupon.description,
      }));
    } catch (err) {
      console.error('获取优惠券失败:', err);
      return this.getDefaultCoupons();
    }
  }

  /**
   * 获取推广金账户信息
   */
  async getPromotionWallet(userId: string): Promise<PromotionWallet> {
    try {
      const { data, error } = await supabase
        .from('promotion_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.warn('获取推广金账户失败:', error);
        return this.getDefaultWallet(userId);
      }

      return {
        userId: data.user_id,
        balance: data.balance || 0,
        totalRecharged: data.total_recharged || 0,
        totalSpent: data.total_spent || 0,
      };
    } catch (err) {
      console.error('获取推广金账户失败:', err);
      return this.getDefaultWallet(userId);
    }
  }

  /**
   * 创建推广订单
   */
  async createOrder(orderData: {
    userId: string;
    workId: string;
    workTitle?: string;
    workThumbnail?: string;
    packageType: string;
    packageName?: string;
    expectedViews?: string;
    target: string;
    metric: string;
    couponId?: string;
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
  }): Promise<{ id: string; orderNo: string } | null> {
    try {
      // 生成订单号
      const orderNo = 'PRO' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + 
        Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

      // 构建插入数据
      const insertData: any = {
        user_id: orderData.userId,
        order_no: orderNo,
        work_id: orderData.workId,
        work_title: orderData.workTitle || '',
        work_thumbnail: orderData.workThumbnail || '',
        package_type: orderData.packageType,
        target_type: orderData.target,
        metric_type: orderData.metric,
        original_price: orderData.originalPrice,
        discount_amount: orderData.discountAmount,
        final_price: orderData.finalPrice,
        coupon_id: orderData.couponId || null,
        metadata: {
          target: orderData.target,
          metric: orderData.metric,
          package_name: orderData.packageName,
          expected_views: orderData.expectedViews,
        },
        status: 'pending',
      };

      // 直接使用 INSERT 绕过 RPC 函数
      const { data, error } = await supabase
        .from('promotion_orders')
        .insert(insertData)
        .select('id, order_no')
        .single();

      if (error) {
        console.error('创建推广订单失败:', error);
        return null;
      }

      if (data) {
        return {
          id: data.id,
          orderNo: data.order_no,
        };
      }

      return null;
    } catch (err) {
      console.error('创建推广订单失败:', err);
      return null;
    }
  }

  /**
   * 支付推广订单
   */
  async payOrder(orderId: string, couponId?: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('pay_promotion_order', {
          p_order_id: orderId,
          p_payment_method: 'wechat', // 默认微信支付
          p_transaction_id: null,
        });

      if (error) {
        console.error('支付订单失败:', error);
        return false;
      }

      // 如果使用优惠券，标记为已使用
      if (couponId) {
        await supabase
          .from('promotion_coupons')
          .update({
            used: true,
            used_at: new Date().toISOString(),
          })
          .eq('id', couponId);
      }

      // 注意：支付成功后不自动激活推广，需要管理员人工审核
      // 订单状态保持为 'paid'，等待管理员审核后激活

      return true;
    } catch (err) {
      console.error('支付订单失败:', err);
      return false;
    }
  }

  /**
   * 激活推广订单（支付后调用）
   */
  async activatePromotion(orderId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .rpc('activate_promotion_order', {
          p_order_id: orderId,
          p_start_time: new Date().toISOString(),
        });

      if (error) {
        console.error('激活推广失败:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('激活推广失败:', err);
      return null;
    }
  }

  /**
   * 获取用户的推广作品列表（正在推广中）
   */
  async getUserPromotedWorks(userId: string): Promise<PromotedWork[]> {
    try {
      const { data, error } = await supabase
        .from('promoted_works')
        .select(`
          *,
          promotion_orders!inner(work_title, work_thumbnail, final_price, order_no)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('获取推广作品失败:', error);
        return [];
      }

      return (data || []).map(pw => ({
        id: pw.id,
        orderId: pw.order_id,
        workId: pw.work_id,
        userId: pw.user_id,
        packageType: pw.package_type,
        targetType: pw.target_type,
        metricType: pw.metric_type,
        startTime: pw.start_time,
        endTime: pw.end_time,
        targetViews: pw.target_views,
        actualViews: pw.actual_views,
        targetClicks: pw.target_clicks,
        actualClicks: pw.actual_clicks,
        promotionWeight: pw.promotion_weight,
        priorityScore: pw.priority_score,
        displayPosition: pw.display_position,
        isFeatured: pw.is_featured,
        status: pw.status,
        dailyViews: pw.daily_views,
        dailyClicks: pw.daily_clicks,
        workTitle: pw.promotion_orders?.work_title || '',
        workThumbnail: pw.promotion_orders?.work_thumbnail || '',
        finalPrice: pw.promotion_orders?.final_price || 0,
        orderNo: pw.promotion_orders?.order_no || '',
      }));
    } catch (err) {
      console.error('获取推广作品失败:', err);
      return [];
    }
  }

  /**
   * 获取推广效果摘要
   */
  async getPromotionSummary(userId: string): Promise<PromotionSummary | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_promotion_summary', {
          p_user_id: userId,
        });

      if (error) {
        console.warn('获取推广摘要失败:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('获取推广摘要失败:', err);
      return null;
    }
  }

  /**
   * 获取活跃推广作品（用于广场展示）
   */
  async getActivePromotedWorks(limit: number = 10, offset: number = 0): Promise<ActivePromotedWork[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_active_promoted_works', {
          p_limit: limit,
          p_offset: offset,
        });

      if (error) {
        console.warn('获取活跃推广作品失败:', error);
        return [];
      }

      return (data || []).map((pw: any) => ({
        promotedWorkId: pw.promoted_work_id,
        orderId: pw.order_id,
        workId: pw.work_id,
        userId: pw.user_id,
        promotionWeight: pw.promotion_weight,
        priorityScore: pw.priority_score,
        displayPosition: pw.display_position,
        isFeatured: pw.is_featured,
        packageType: pw.package_type,
        remainingHours: pw.remaining_hours,
      }));
    } catch (err) {
      console.error('获取活跃推广作品失败:', err);
      return [];
    }
  }

  // 默认统计数据
  private getDefaultStats(): PromotionStats {
    return {
      totalSpent: 0,
      totalOrders: 0,
      totalViews: 0,
      totalFans: 0,
      totalInteractions: 0,
      avgClickRate: 0,
      runningOrders: 0,
      completedOrders: 0,
    };
  }

  // 生成空趋势数据
  private generateEmptyTrend(days: number): PromotionTrendPoint[] {
    const data: PromotionTrendPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
        spent: 0,
        views: 0,
        fans: 0,
        interactions: 0,
      });
    }
    return data;
  }

  // 默认优惠券（新人券）
  private getDefaultCoupons(): PromotionCoupon[] {
    return [
      {
        id: 'new_user_7',
        userId: '',
        discount: 0.7,
        maxDeduction: 200,
        minOrderAmount: 50,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        used: false,
        description: '新人7折券，最高减200元',
      },
      {
        id: 'new_user_8_1',
        userId: '',
        discount: 0.8,
        maxDeduction: 200,
        minOrderAmount: 50,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        used: false,
        description: '二单8折券，最高减200元',
      },
      {
        id: 'new_user_8_2',
        userId: '',
        discount: 0.8,
        maxDeduction: 200,
        minOrderAmount: 50,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        used: false,
        description: '三单8折券，最高减200元',
      },
    ];
  }

  // 默认钱包
  private getDefaultWallet(userId: string): PromotionWallet {
    return {
      userId,
      balance: 0,
      totalRecharged: 0,
      totalSpent: 0,
    };
  }

  // ==================== 管理员功能 ====================

  /**
   * 获取所有推广订单（管理员用）
   */
  async getAllOrders(status?: string): Promise<PromotionOrder[]> {
    try {
      let query = supabase
        .from('promotion_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('获取所有推广订单失败:', error);
        return [];
      }

      return (data || []).map(order => ({
        id: order.id,
        userId: order.user_id,
        workId: order.work_id,
        workTitle: order.work_title,
        workThumbnail: order.work_thumbnail,
        packageType: order.package_type,
        packageName: order.package_name,
        targetType: order.target_type,
        boostMetric: order.metric_type,
        price: order.original_price,
        discountAmount: order.discount_amount,
        finalPrice: order.final_price,
        expectedViews: order.expected_views,
        actualViews: order.actual_views || 0,
        status: order.status,
        createdAt: order.created_at,
        paidAt: order.payment_time,
        startAt: order.start_at,
        endAt: order.end_at,
      }));
    } catch (err) {
      console.error('获取所有推广订单失败:', err);
      return [];
    }
  }

  /**
   * 审核推广订单
   * @param orderId 订单ID
   * @param approved 是否通过
   * @param notes 审核备注
   */
  async auditOrder(orderId: string, approved: boolean, notes?: string): Promise<boolean> {
    try {
      // 使用数据库函数进行审核
      const { data, error } = await supabase
        .rpc('audit_promotion_order', {
          p_order_id: orderId,
          p_approved: approved,
          p_notes: notes || ''
        });

      if (error) {
        console.error('审核订单失败:', error);
        return false;
      }

      return data === true;
    } catch (err) {
      console.error('审核订单失败:', err);
      return false;
    }
  }

  /**
   * 创建推广作品记录（审核通过后调用）
   */
  private async createPromotedWork(orderId: string): Promise<boolean> {
    try {
      // 获取订单信息
      const { data: order, error: orderError } = await supabase
        .from('promotion_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('获取订单信息失败:', orderError);
        return false;
      }

      // 计算推广时长（根据套餐类型）
      const durationHours = this.getPackageDuration(order.package_type);
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

      // 计算目标曝光量
      const targetViews = this.getPackageTargetViews(order.package_type);

      // 创建推广作品记录
      const { error } = await supabase
        .from('promoted_works')
        .insert({
          order_id: orderId,
          work_id: order.work_id,
          user_id: order.user_id,
          package_type: order.package_type,
          target_type: order.target_type || 'account',
          metric_type: order.metric_type || 'views',
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          target_views: targetViews,
          actual_views: 0,
          target_clicks: Math.floor(targetViews * 0.05), // 假设5%点击率
          actual_clicks: 0,
          promotion_weight: this.getPackageWeight(order.package_type),
          priority_score: 0,
          display_position: 0,
          is_featured: order.package_type === 'long' || order.package_type === 'custom',
          status: 'active',
          daily_views: 0,
          daily_clicks: 0,
          total_cost: 0,
        });

      if (error) {
        console.error('创建推广作品记录失败:', error);
        return false;
      }

      // 更新订单状态为推广中
      await supabase
        .from('promotion_orders')
        .update({
          status: 'running',
          start_at: startTime.toISOString(),
          end_at: endTime.toISOString(),
        })
        .eq('id', orderId);

      return true;
    } catch (err) {
      console.error('创建推广作品记录失败:', err);
      return false;
    }
  }

  /**
   * 获取套餐时长（小时）
   */
  private getPackageDuration(packageType: string): number {
    const durations: Record<string, number> = {
      standard: 24,
      basic: 24,
      long: 48,
      custom: 72,
    };
    return durations[packageType] || 24;
  }

  /**
   * 获取套餐目标曝光量
   */
  private getPackageTargetViews(packageType: string): number {
    const views: Record<string, number> = {
      standard: 1000,
      basic: 2500,
      long: 7500,
      custom: 15000,
    };
    return views[packageType] || 1000;
  }

  /**
   * 获取套餐权重
   */
  private getPackageWeight(packageType: string): number {
    const weights: Record<string, number> = {
      standard: 1.0,
      basic: 1.5,
      long: 2.0,
      custom: 3.0,
    };
    return weights[packageType] || 1.0;
  }

  /**
   * 获取所有推广作品（管理员用）
   */
  async getAllPromotedWorks(status?: string): Promise<PromotedWork[]> {
    try {
      // 首先检查表是否存在
      const { data: testData, error: testError } = await supabase
        .from('promoted_works')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.warn('promoted_works 表可能不存在:', testError);
        return [];
      }

      let query = supabase
        .from('promoted_works')
        .select(`
          *,
          promotion_orders(work_title, work_thumbnail, final_price, order_no, user_id)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('获取所有推广作品失败:', error);
        return [];
      }

      return (data || []).map(pw => ({
        id: pw.id,
        orderId: pw.order_id,
        workId: pw.work_id,
        userId: pw.user_id,
        packageType: pw.package_type,
        targetType: pw.target_type,
        metricType: pw.metric_type,
        startTime: pw.start_time,
        endTime: pw.end_time,
        targetViews: pw.target_views,
        actualViews: pw.actual_views,
        targetClicks: pw.target_clicks,
        actualClicks: pw.actual_clicks,
        promotionWeight: pw.promotion_weight,
        priorityScore: pw.priority_score,
        displayPosition: pw.display_position,
        isFeatured: pw.is_featured,
        status: pw.status,
        dailyViews: pw.daily_views,
        dailyClicks: pw.daily_clicks,
        workTitle: pw.promotion_orders?.work_title || '',
        workThumbnail: pw.promotion_orders?.work_thumbnail || '',
        finalPrice: pw.promotion_orders?.final_price || 0,
        orderNo: pw.promotion_orders?.order_no || '',
      }));
    } catch (err) {
      console.error('获取所有推广作品失败:', err);
      return [];
    }
  }

  /**
   * 获取推广作品的每日统计数据
   */
  async getPromotedWorkDailyStats(promotedWorkId: string, days: number = 7): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('promotion_daily_stats')
        .select('*')
        .eq('promoted_work_id', promotedWorkId)
        .order('date', { ascending: false })
        .limit(days);

      if (error) {
        console.warn('获取推广作品每日统计失败:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('获取推广作品每日统计失败:', err);
      return [];
    }
  }

  /**
   * 模拟增加曝光量（用于测试）
   */
  async simulateImpression(promotedWorkId: string): Promise<boolean> {
    try {
      // 获取当前数据
      const { data: pw, error: pwError } = await supabase
        .from('promoted_works')
        .select('*')
        .eq('id', promotedWorkId)
        .single();

      if (pwError || !pw) {
        console.error('获取推广作品失败:', pwError);
        return false;
      }

      // 随机决定是否点击（5%概率）
      const isClicked = Math.random() < 0.05;

      // 更新推广作品数据
      const { error } = await supabase
        .from('promoted_works')
        .update({
          actual_views: (pw.actual_views || 0) + 1,
          actual_clicks: (pw.actual_clicks || 0) + (isClicked ? 1 : 0),
          daily_views: (pw.daily_views || 0) + 1,
          daily_clicks: (pw.daily_clicks || 0) + (isClicked ? 1 : 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', promotedWorkId);

      if (error) {
        console.error('更新曝光量失败:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('模拟曝光失败:', err);
      return false;
    }
  }

  // ==================== 曝光机制 API ====================

  /**
   * 增加推广作品的曝光量
   * @param workId 推广作品ID
   * @param viewCount 增加的曝光数，默认1
   */
  async incrementViews(workId: string, viewCount: number = 1): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('increment_promotion_views', {
          p_work_id: workId,
          p_view_count: viewCount
        });

      if (error) {
        console.error('增加曝光量失败:', error);
        return false;
      }

      return data === true;
    } catch (err) {
      console.error('增加曝光量失败:', err);
      return false;
    }
  }

  /**
   * 增加推广作品的点击量
   * @param workId 推广作品ID
   * @param clickCount 增加的点击数，默认1
   */
  async incrementClicks(workId: string, clickCount: number = 1): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('increment_promotion_clicks', {
          p_work_id: workId,
          p_click_count: clickCount
        });

      if (error) {
        console.error('增加点击量失败:', error);
        return false;
      }

      return data === true;
    } catch (err) {
      console.error('增加点击量失败:', err);
      return false;
    }
  }

  /**
   * 模拟推广曝光（为所有活跃推广增加曝光）
   * 管理员手动触发或定时任务调用
   */
  async simulatePromotionExposure(): Promise<Array<{workId: string; workTitle: string; viewsAdded: number; clicksAdded: number}>> {
    try {
      const { data, error } = await supabase
        .rpc('simulate_promotion_exposure');

      if (error) {
        console.error('模拟推广曝光失败:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        workId: item.work_id,
        workTitle: item.work_title,
        viewsAdded: item.views_added,
        clicksAdded: item.clicks_added
      }));
    } catch (err) {
      console.error('模拟推广曝光失败:', err);
      return [];
    }
  }

  /**
   * 自动曝光任务 - 为活跃推广批量增加曝光
   * 前端定时调用此方法来模拟真实曝光
   */
  async autoExposureBatch(): Promise<{
    processed: number;
    totalViewsAdded: number;
    totalClicksAdded: number;
  }> {
    try {
      // 获取所有活跃推广
      const { data: activeWorks, error } = await supabase
        .from('promoted_works')
        .select('id, actual_views, target_views, order_id')
        .eq('status', 'active')
        .gt('end_time', new Date().toISOString());

      if (error || !activeWorks || activeWorks.length === 0) {
        return { processed: 0, totalViewsAdded: 0, totalClicksAdded: 0 };
      }

      let totalViews = 0;
      let totalClicks = 0;

      // 为每个活跃推广增加曝光
      for (const work of activeWorks) {
        // 计算剩余需要曝光的数量
        const remainingViews = Math.max(0, (work.target_views || 1000) - (work.actual_views || 0));
        
        if (remainingViews <= 0) continue;

        // 随机增加 1-10 次曝光
        const viewsToAdd = Math.min(remainingViews, Math.floor(Math.random() * 10) + 1);
        
        // 点击率 1%-5%
        const ctr = 0.01 + Math.random() * 0.04;
        const clicksToAdd = Math.max(0, Math.round(viewsToAdd * ctr));

        // 更新数据库
        const { error: updateError } = await supabase
          .from('promoted_works')
          .update({
            actual_views: (work.actual_views || 0) + viewsToAdd,
            actual_clicks: (work.actual_clicks || 0) + clicksToAdd,
            updated_at: new Date().toISOString(),
            // 如果达到目标，自动完成
            status: (work.actual_views || 0) + viewsToAdd >= (work.target_views || 1000) ? 'completed' : 'active',
            end_time: (work.actual_views || 0) + viewsToAdd >= (work.target_views || 1000) ? new Date().toISOString() : undefined
          })
          .eq('id', work.id);

        if (!updateError) {
          totalViews += viewsToAdd;
          totalClicks += clicksToAdd;

          // 同时更新订单表
          await supabase
            .from('promotion_orders')
            .update({
              actual_views: (work.actual_views || 0) + viewsToAdd,
              actual_clicks: (work.actual_clicks || 0) + clicksToAdd
            })
            .eq('id', work.order_id);
        }
      }

      return {
        processed: activeWorks.length,
        totalViewsAdded: totalViews,
        totalClicksAdded: totalClicks
      };
    } catch (err) {
      console.error('自动曝光批处理失败:', err);
      return { processed: 0, totalViewsAdded: 0, totalClicksAdded: 0 };
    }
  }
}

export const promotionService = new PromotionService();
export default promotionService;
