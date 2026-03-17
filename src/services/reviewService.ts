/**
 * 用户评价系统服务 - 提供商品评价、晒单、评价回复等功能
 */
import { supabase } from '@/lib/supabase';

// 评价接口
export interface Review {
  id: string;
  order_id: string;
  order_item_id: string;
  user_id: string;
  product_id: string;
  rating: number; // 1-5 星
  content: string;
  images: string[];
  is_anonymous: boolean;
  is_visible: boolean;
  helpful_count: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  product?: {
    id: string;
    name: string;
    cover_image?: string;
  };
  replies?: ReviewReply[];
}

// 评价回复接口
export interface ReviewReply {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  is_merchant: boolean; // 是否商家回复
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

// 评价统计接口
export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  withImages: number;
  positiveRate: number;
}

// 评价服务类
class ReviewService {
  /**
   * 创建商品评价
   */
  async createReview(
    userId: string,
    data: {
      order_id: string;
      order_item_id: string;
      product_id: string;
      rating: number;
      content: string;
      images?: string[];
      is_anonymous?: boolean;
    }
  ): Promise<{ success: boolean; reviewId?: string; error?: string }> {
    try {
      // 检查是否已经评价过
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('order_item_id', data.order_item_id)
        .single();

      if (existingReview) {
        return {
          success: false,
          error: '您已经评价过该商品'
        };
      }

      // 创建评价
      const { data: review, error } = await supabase
        .from('reviews')
        .insert({
          ...data,
          user_id: userId,
          is_anonymous: data.is_anonymous || false,
          is_visible: true,
          helpful_count: 0,
          reply_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      // 更新订单状态为已完成（如果所有商品都已评价）
      await this.checkAndUpdateOrderStatus(data.order_id);

      // 奖励积分
      await this.rewardReviewPoints(userId, review.id);

      return {
        success: true,
        reviewId: review.id
      };
    } catch (err: any) {
      console.error('[ReviewService] 创建评价失败:', err);
      return {
        success: false,
        error: err.message || '创建评价失败'
      };
    }
  }

  /**
   * 获取商品评价列表
   */
  async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 20,
    options?: {
      rating?: number;
      withImages?: boolean;
      sortBy?: 'created_at' | 'helpful_count' | 'rating';
    }
  ): Promise<{ reviews: Review[]; total: number }> {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          user:user_id(id, username, avatar_url),
          product:product_id(id, name, cover_image)
        `, { count: 'exact' })
        .eq('product_id', productId)
        .eq('is_visible', true)
        .order(options?.sortBy || 'created_at', { ascending: false });

      if (options?.rating) {
        query = query.eq('rating', options.rating);
      }

      if (options?.withImages) {
        query = query.not('images', 'is', null);
      }

      const rangeStart = (page - 1) * limit;
      const rangeEnd = rangeStart + limit - 1;
      query = query.range(rangeStart, rangeEnd);

      const { data: reviews, error, count } = await query;

      if (error) throw error;

      // 获取评价回复
      const reviewsWithReplies = await Promise.all(
        (reviews || []).map(async (review) => {
          const { data: replies } = await supabase
            .from('review_replies')
            .select(`
              *,
              user:user_id(id, username, avatar_url)
            `)
            .eq('review_id', review.id)
            .order('created_at', { ascending: true });

          return {
            ...review,
            replies: replies || []
          };
        })
      );

      return {
        reviews: reviewsWithReplies as Review[],
        total: count || 0
      };
    } catch (err: any) {
      console.error('[ReviewService] 获取评价列表失败:', err);
      return { reviews: [], total: 0 };
    }
  }

  /**
   * 获取用户的评价列表
   */
  async getUserReviews(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ reviews: Review[]; total: number }> {
    try {
      const { data: reviews, error, count } = await supabase
        .from('reviews')
        .select(`
          *,
          user:user_id(id, username, avatar_url),
          product:product_id(id, name, cover_image)
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      return {
        reviews: reviews as Review[],
        total: count || 0
      };
    } catch (err: any) {
      console.error('[ReviewService] 获取用户评价列表失败:', err);
      return { reviews: [], total: 0 };
    }
  }

  /**
   * 获取评价详情
   */
  async getReviewDetail(reviewId: string): Promise<Review | null> {
    try {
      const { data: review, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:user_id(id, username, avatar_url),
          product:product_id(id, name, cover_image)
        `)
        .eq('id', reviewId)
        .single();

      if (error || !review) return null;

      // 获取评价回复
      const { data: replies } = await supabase
        .from('review_replies')
        .select(`
          *,
          user:user_id(id, username, avatar_url)
        `)
        .eq('review_id', reviewId)
        .order('created_at', { ascending: true });

      return {
        ...review,
        replies: replies || []
      } as Review;
    } catch (err: any) {
      console.error('[ReviewService] 获取评价详情失败:', err);
      return null;
    }
  }

  /**
   * 回复评价
   */
  async replyReview(
    reviewId: string,
    userId: string,
    content: string,
    isMerchant: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('review_replies')
        .insert({
          review_id: reviewId,
          user_id: userId,
          content,
          is_merchant: isMerchant
        });

      if (error) throw error;

      // 更新评价的回复数
      await supabase.rpc('increment_review_reply_count', {
        review_id: reviewId
      });

      return { success: true };
    } catch (err: any) {
      console.error('[ReviewService] 回复评价失败:', err);
      return {
        success: false,
        error: err.message || '回复评价失败'
      };
    }
  }

  /**
   * 点赞评价
   */
  async likeReview(
    reviewId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 检查是否已经点过赞
      const { data: existing } = await supabase
        .from('review_likes')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        return {
          success: false,
          error: '您已经点过赞了'
        };
      }

      // 添加点赞记录
      const { error: likeError } = await supabase
        .from('review_likes')
        .insert({
          review_id: reviewId,
          user_id: userId
        });

      if (likeError) throw likeError;

      // 增加点赞数
      await supabase.rpc('increment_review_helpful_count', {
        review_id: reviewId
      });

      return { success: true };
    } catch (err: any) {
      console.error('[ReviewService] 点赞评价失败:', err);
      return {
        success: false,
        error: err.message || '点赞评价失败'
      };
    }
  }

  /**
   * 获取评价统计
   */
  async getReviewStats(productId: string): Promise<ReviewStats> {
    try {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating, images')
        .eq('product_id', productId)
        .eq('is_visible', true);

      if (!reviews || reviews.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          withImages: 0,
          positiveRate: 0
        };
      }

      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
      
      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let withImages = 0;
      let positiveCount = 0;

      reviews.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
        if (review.images && review.images.length > 0) {
          withImages++;
        }
        if (review.rating >= 4) {
          positiveCount++;
        }
      });

      return {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        withImages,
        positiveRate: Math.round((positiveCount / totalReviews) * 100)
      };
    } catch (err: any) {
      console.error('[ReviewService] 获取评价统计失败:', err);
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        withImages: 0,
        positiveRate: 0
      };
    }
  }

  /**
   * 检查并更新订单状态
   */
  private async checkAndUpdateOrderStatus(orderId: string): Promise<void> {
    try {
      // 获取订单所有商品
      const { data: items } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', orderId);

      if (!items || items.length === 0) return;

      // 检查是否所有商品都已评价
      const itemIds = items.map(item => item.id);
      const { data: reviewedItems } = await supabase
        .from('reviews')
        .select('order_item_id')
        .in('order_item_id', itemIds);

      if (reviewedItems && reviewedItems.length === items.length) {
        // 所有商品都已评价，更新订单状态为已完成
        await supabase
          .from('orders')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', orderId);
      }
    } catch (err: any) {
      console.error('[ReviewService] 更新订单状态失败:', err);
    }
  }

  /**
   * 奖励评价积分
   */
  private async rewardReviewPoints(userId: string, reviewId: string): Promise<void> {
    try {
      // 奖励 10 积分
      const points = 10;

      // 记录积分变动
      await supabase
        .from('points_transactions')
        .insert({
          user_id: userId,
          points,
          type: 'earn',
          source: 'review',
          source_id: reviewId,
          description: '评价商品获得积分'
        });

      // 更新用户积分余额
      await supabase.rpc('add_user_points', {
        user_id: userId,
        points_amount: points
      });
    } catch (err: any) {
      console.error('[ReviewService] 奖励积分失败:', err);
    }
  }
}

// 导出单例实例
const reviewService = new ReviewService();
export default reviewService;
