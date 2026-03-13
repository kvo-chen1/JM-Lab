/**
 * 积分商城服务 - 商品管理、库存管理、兑换记录
 */

import { supabase } from '@/lib/supabase';
import eventBus from '@/lib/eventBus';
import pointsService from './pointsService';

export type ProductType = 
  | 'virtual'
  | 'physical'
  | 'coupon'
  | 'membership'
  | 'service'
  | 'digital'
  | 'gift_card';

export type ProductCategory = 
  | 'hot'
  | 'digital'
  | 'lifestyle'
  | 'entertainment'
  | 'membership'
  | 'coupon'
  | 'limited';

export type ProductStatus = 
  | 'available'
  | 'out_of_stock'
  | 'discontinued'
  | 'coming_soon';

export type ExchangeStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface PointsProduct {
  id: string;
  name: string;
  description: string;
  type: ProductType;
  category: ProductCategory;
  points: number;
  originalPrice?: number;
  imageUrl: string;
  images?: string[];
  stock: number;
  totalStock: number;
  status: ProductStatus;
  limitPerUser: number;
  limitPerDay: number;
  memberOnly: boolean;
  memberLevels?: string[];
  startTime?: string;
  endTime?: string;
  sortOrder: number;
  tags: string[];
  specifications?: ProductSpecification[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSpecification {
  id: string;
  name: string;
  value: string;
  stock?: number;
  price?: number;
}

export interface ProductCategoryConfig {
  id: ProductCategory;
  name: string;
  icon: string;
  description: string;
  sortOrder: number;
}

export interface ExchangeRecord {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productType: ProductType;
  points: number;
  quantity: number;
  status: ExchangeStatus;
  exchangeCode: string;
  shippingInfo?: ShippingInfo;
  virtualItemInfo?: VirtualItemInfo;
  couponInfo?: CouponInfo;
  membershipInfo?: MembershipInfo;
  notes?: string;
  processedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  refundPoints?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingInfo {
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  postalCode?: string;
  trackingNumber?: string;
  courier?: string;
}

export interface VirtualItemInfo {
  type: 'digital_content' | 'game_item' | 'account';
  code?: string;
  link?: string;
  account?: string;
  password?: string;
  expiresAt?: string;
}

export interface CouponInfo {
  code: string;
  type: 'percentage' | 'fixed' | 'gift';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  applicableScope: 'all' | 'category' | 'product';
  applicableIds?: string[];
}

export interface MembershipInfo {
  type: 'upgrade' | 'extend' | 'trial';
  level: string;
  duration: number;
  durationUnit: 'days' | 'months';
  startDate?: string;
  endDate?: string;
}

export interface StockReservation {
  id: string;
  userId: string;
  productId: string;
  specificationId?: string;
  quantity: number;
  reservedAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'completed' | 'cancelled';
}

class PointsMallService {
  private readonly CACHE_KEY = 'POINTS_MALL_CACHE';
  private cache: {
    products: PointsProduct[] | null;
    categories: ProductCategoryConfig[] | null;
    lastUpdated: number;
  } = {
    products: null,
    categories: null,
    lastUpdated: 0,
  };

  private readonly CACHE_TTL = 5 * 60 * 1000;
  private readonly RESERVATION_TTL = 15 * 60 * 1000;

  private readonly DEFAULT_CATEGORIES: ProductCategoryConfig[] = [
    { id: 'hot', name: '热门兑换', icon: 'Flame', description: '最受欢迎的商品', sortOrder: 1 },
    { id: 'digital', name: '数码电子', icon: 'Smartphone', description: '数码产品与配件', sortOrder: 2 },
    { id: 'lifestyle', name: '生活家居', icon: 'Home', description: '品质生活用品', sortOrder: 3 },
    { id: 'entertainment', name: '娱乐影音', icon: 'Music', description: '娱乐与影音产品', sortOrder: 4 },
    { id: 'membership', name: '会员权益', icon: 'Crown', description: '会员专属福利', sortOrder: 5 },
    { id: 'coupon', name: '优惠券', icon: 'Ticket', description: '购物优惠券', sortOrder: 6 },
    { id: 'limited', name: '限量特供', icon: 'Sparkles', description: '限量商品专区', sortOrder: 7 },
  ];

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = { ...this.cache, ...parsed };
      }
    } catch (error) {
      console.warn('[PointsMallService] 加载缓存失败:', error);
    }
  }

  private saveCache() {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('[PointsMallService] 保存缓存失败:', error);
    }
  }

  private isCacheValid(): boolean {
    return Date.now() - this.cache.lastUpdated < this.CACHE_TTL;
  }

  async getCategories(): Promise<ProductCategoryConfig[]> {
    if (this.cache.categories && this.isCacheValid()) {
      return this.cache.categories;
    }

    try {
      const { data, error } = await supabase
        .from('points_product_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const categories: ProductCategoryConfig[] = data.map((item) => ({
          id: item.id as ProductCategory,
          name: item.name,
          icon: item.icon,
          description: item.description,
          sortOrder: item.sort_order,
        }));

        this.cache.categories = categories;
        this.cache.lastUpdated = Date.now();
        this.saveCache();
        return categories;
      }

      return this.DEFAULT_CATEGORIES;
    } catch (error) {
      console.error('[PointsMallService] 获取分类失败:', error);
      return this.DEFAULT_CATEGORIES;
    }
  }

  async getProducts(options: {
    category?: ProductCategory;
    type?: ProductType;
    status?: ProductStatus;
    memberOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ products: PointsProduct[]; total: number }> {
    try {
      let query = supabase
        .from('points_products')
        .select('*', { count: 'exact' })
        .eq('status', options.status || 'available')
        .order('sort_order', { ascending: true });

      if (options.category) {
        query = query.eq('category', options.category);
      }
      if (options.type) {
        query = query.eq('type', options.type);
      }
      if (options.memberOnly !== undefined) {
        query = query.eq('member_only', options.memberOnly);
      }

      const limit = options.limit || 20;
      const offset = options.offset || 0;

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (error) throw error;

      const products: PointsProduct[] = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        type: item.type as ProductType,
        category: item.category as ProductCategory,
        points: item.points,
        originalPrice: item.original_price,
        imageUrl: item.image_url,
        images: item.images || [],
        stock: item.stock,
        totalStock: item.total_stock,
        status: item.status as ProductStatus,
        limitPerUser: item.limit_per_user,
        limitPerDay: item.limit_per_day,
        memberOnly: item.member_only,
        memberLevels: item.member_levels || [],
        startTime: item.start_time,
        endTime: item.end_time,
        sortOrder: item.sort_order,
        tags: item.tags || [],
        specifications: item.specifications || [],
        metadata: item.metadata || {},
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { products, total: count || 0 };
    } catch (error) {
      console.error('[PointsMallService] 获取商品失败:', error);
      return { products: [], total: 0 };
    }
  }

  async getProduct(productId: string): Promise<PointsProduct | null> {
    try {
      const { data, error } = await supabase
        .from('points_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        type: data.type as ProductType,
        category: data.category as ProductCategory,
        points: data.points,
        originalPrice: data.original_price,
        imageUrl: data.image_url,
        images: data.images || [],
        stock: data.stock,
        totalStock: data.total_stock,
        status: data.status as ProductStatus,
        limitPerUser: data.limit_per_user,
        limitPerDay: data.limit_per_day,
        memberOnly: data.member_only,
        memberLevels: data.member_levels || [],
        startTime: data.start_time,
        endTime: data.end_time,
        sortOrder: data.sort_order,
        tags: data.tags || [],
        specifications: data.specifications || [],
        metadata: data.metadata || {},
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('[PointsMallService] 获取商品详情失败:', error);
      return null;
    }
  }

  async checkStock(productId: string, quantity: number = 1): Promise<{
    available: boolean;
    stock: number;
    message?: string;
  }> {
    try {
      const product = await this.getProduct(productId);
      if (!product) {
        return { available: false, stock: 0, message: '商品不存在' };
      }

      if (product.status !== 'available') {
        return { available: false, stock: 0, message: '商品暂不可兑换' };
      }

      if (product.stock < quantity) {
        return {
          available: false,
          stock: product.stock,
          message: `库存不足，当前库存：${product.stock}`,
        };
      }

      return { available: true, stock: product.stock };
    } catch (error) {
      console.error('[PointsMallService] 检查库存失败:', error);
      return { available: false, stock: 0, message: '检查库存失败' };
    }
  }

  async reserveStock(
    userId: string,
    productId: string,
    quantity: number,
    specificationId?: string
  ): Promise<{ success: boolean; reservationId?: string; error?: string }> {
    try {
      const stockCheck = await this.checkStock(productId, quantity);
      if (!stockCheck.available) {
        return { success: false, error: stockCheck.message };
      }

      const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + this.RESERVATION_TTL).toISOString();

      const { error } = await supabase.from('points_stock_reservations').insert({
        id: reservationId,
        user_id: userId,
        product_id: productId,
        specification_id: specificationId,
        quantity,
        reserved_at: new Date().toISOString(),
        expires_at: expiresAt,
        status: 'active',
      });

      if (error) throw error;

      await supabase.rpc('decrement_product_stock', {
        p_product_id: productId,
        p_quantity: quantity,
      });

      return { success: true, reservationId };
    } catch (error: any) {
      console.error('[PointsMallService] 预留库存失败:', error);
      return { success: false, error: error.message };
    }
  }

  async releaseReservation(reservationId: string): Promise<boolean> {
    try {
      const { data: reservation } = await supabase
        .from('points_stock_reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (!reservation) return false;

      await supabase.rpc('increment_product_stock', {
        p_product_id: reservation.product_id,
        p_quantity: reservation.quantity,
      });

      await supabase
        .from('points_stock_reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId);

      return true;
    } catch (error) {
      console.error('[PointsMallService] 释放预留失败:', error);
      return false;
    }
  }

  async checkUserExchangeLimit(
    userId: string,
    productId: string
  ): Promise<{ canExchange: boolean; exchanged: number; limit: number }> {
    try {
      const product = await this.getProduct(productId);
      if (!product) {
        return { canExchange: false, exchanged: 0, limit: 0 };
      }

      const { count } = await supabase
        .from('points_exchange_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('product_id', productId)
        .neq('status', 'cancelled');

      const exchanged = count || 0;
      const limit = product.limitPerUser;

      return {
        canExchange: exchanged < limit,
        exchanged,
        limit,
      };
    } catch (error) {
      console.error('[PointsMallService] 检查兑换限制失败:', error);
      return { canExchange: false, exchanged: 0, limit: 0 };
    }
  }

  async exchangeProduct(
    userId: string,
    productId: string,
    options: {
      quantity?: number;
      specificationId?: string;
      shippingInfo?: ShippingInfo;
    } = {}
  ): Promise<{
    success: boolean;
    record?: ExchangeRecord;
    error?: string;
  }> {
    try {
      const quantity = options.quantity || 1;
      const product = await this.getProduct(productId);

      if (!product) {
        return { success: false, error: '商品不存在' };
      }

      if (product.memberOnly) {
        const { data: userData } = await supabase
          .from('users')
          .select('membership_level')
          .eq('id', userId)
          .single();

        if (!userData || !product.memberLevels?.includes(userData.membership_level)) {
          return { success: false, error: '该商品仅限特定会员兑换' };
        }
      }

      const limitCheck = await this.checkUserExchangeLimit(userId, productId);
      if (!limitCheck.canExchange) {
        return { success: false, error: `每人限兑${limitCheck.limit}件` };
      }

      const stockCheck = await this.checkStock(productId, quantity);
      if (!stockCheck.available) {
        return { success: false, error: stockCheck.message };
      }

      const totalPoints = product.points * quantity;
      const currentPoints = pointsService.getCurrentPoints();

      if (currentPoints < totalPoints) {
        return { success: false, error: `积分不足，需要${totalPoints}积分` };
      }

      const reservation = await this.reserveStock(userId, productId, quantity, options.specificationId);
      if (!reservation.success) {
        return { success: false, error: reservation.error };
      }

      try {
        const exchangeCode = `EX${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const record: Partial<ExchangeRecord> = {
          user_id: userId,
          product_id: productId,
          product_name: product.name,
          product_type: product.type,
          points: totalPoints,
          quantity,
          status: 'pending',
          exchange_code: exchangeCode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (product.type === 'physical' && options.shippingInfo) {
          record.shipping_info = options.shippingInfo;
        }

        const { data: insertedRecord, error: insertError } = await supabase
          .from('points_exchange_records')
          .insert(record)
          .select()
          .single();

        if (insertError) throw insertError;

        pointsService.consumePoints(
          totalPoints,
          '积分商城兑换',
          'exchange',
          `兑换商品：${product.name}`,
          insertedRecord.id
        );

        await supabase
          .from('points_stock_reservations')
          .update({ status: 'completed' })
          .eq('id', reservation.reservationId);

        const exchangeRecord: ExchangeRecord = {
          id: insertedRecord.id,
          userId: insertedRecord.user_id,
          productId: insertedRecord.product_id,
          productName: insertedRecord.product_name,
          productType: insertedRecord.product_type,
          points: insertedRecord.points,
          quantity: insertedRecord.quantity,
          status: insertedRecord.status as ExchangeStatus,
          exchangeCode: insertedRecord.exchange_code,
          shippingInfo: insertedRecord.shipping_info,
          virtualItemInfo: insertedRecord.virtual_item_info,
          couponInfo: insertedRecord.coupon_info,
          membershipInfo: insertedRecord.membership_info,
          notes: insertedRecord.notes,
          processedAt: insertedRecord.processed_at,
          completedAt: insertedRecord.completed_at,
          cancelledAt: insertedRecord.cancelled_at,
          refundPoints: insertedRecord.refund_points,
          createdAt: insertedRecord.created_at,
          updatedAt: insertedRecord.updated_at,
        };

        if (product.type === 'coupon') {
          await this.generateCoupon(userId, exchangeRecord);
        } else if (product.type === 'membership') {
          await this.processMembershipExchange(userId, exchangeRecord, product);
        } else if (product.type === 'virtual') {
          await this.processVirtualItem(userId, exchangeRecord, product);
        }

        eventBus.emit('points:exchange', {
          userId,
          productId,
          points: totalPoints,
          quantity,
          exchangeCode,
        });

        return { success: true, record: exchangeRecord };
      } catch (error) {
        await this.releaseReservation(reservation.reservationId!);
        throw error;
      }
    } catch (error: any) {
      console.error('[PointsMallService] 兑换失败:', error);
      return { success: false, error: error.message || '兑换失败' };
    }
  }

  private async generateCoupon(userId: string, record: ExchangeRecord): Promise<void> {
    try {
      const couponCode = `CP${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

      const couponInfo: CouponInfo = {
        code: couponCode,
        type: 'fixed',
        value: record.metadata?.couponValue || 50,
        minPurchase: record.metadata?.minPurchase || 0,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        applicableScope: 'all',
      };

      await supabase
        .from('points_exchange_records')
        .update({ coupon_info: couponInfo, status: 'completed' })
        .eq('id', record.id);

      await supabase.from('user_coupons').insert({
        user_id: userId,
        code: couponCode,
        type: couponInfo.type,
        value: couponInfo.value,
        min_purchase: couponInfo.minPurchase,
        valid_from: couponInfo.validFrom,
        valid_until: couponInfo.validUntil,
        source: 'points_exchange',
        source_id: record.id,
      });
    } catch (error) {
      console.error('[PointsMallService] 生成优惠券失败:', error);
    }
  }

  private async processMembershipExchange(
    userId: string,
    record: ExchangeRecord,
    product: PointsProduct
  ): Promise<void> {
    try {
      const membershipInfo: MembershipInfo = {
        type: product.metadata?.membershipType || 'extend',
        level: product.metadata?.membershipLevel || 'premium',
        duration: product.metadata?.duration || 1,
        durationUnit: product.metadata?.durationUnit || 'months',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await supabase
        .from('points_exchange_records')
        .update({ membership_info: membershipInfo, status: 'completed' })
        .eq('id', record.id);

      const { data: userData } = await supabase
        .from('users')
        .select('membership_end')
        .eq('id', userId)
        .single();

      let newEndDate: Date;
      if (userData?.membership_end && new Date(userData.membership_end) > new Date()) {
        newEndDate = new Date(userData.membership_end);
      } else {
        newEndDate = new Date();
      }

      if (membershipInfo.durationUnit === 'months') {
        newEndDate.setMonth(newEndDate.getMonth() + membershipInfo.duration);
      } else {
        newEndDate.setDate(newEndDate.getDate() + membershipInfo.duration);
      }

      await supabase
        .from('users')
        .update({
          membership_level: membershipInfo.level,
          membership_end: newEndDate.toISOString(),
        })
        .eq('id', userId);
    } catch (error) {
      console.error('[PointsMallService] 处理会员兑换失败:', error);
    }
  }

  private async processVirtualItem(
    userId: string,
    record: ExchangeRecord,
    product: PointsProduct
  ): Promise<void> {
    try {
      const virtualInfo: VirtualItemInfo = {
        type: product.metadata?.virtualType || 'digital_content',
        code: `VC${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await supabase
        .from('points_exchange_records')
        .update({ virtual_item_info: virtualInfo, status: 'completed' })
        .eq('id', record.id);
    } catch (error) {
      console.error('[PointsMallService] 处理虚拟商品失败:', error);
    }
  }

  async getExchangeRecords(
    userId: string,
    options: {
      status?: ExchangeStatus;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ records: ExchangeRecord[]; total: number }> {
    try {
      let query = supabase
        .from('points_exchange_records')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      const limit = options.limit || 20;
      const offset = options.offset || 0;

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (error) throw error;

      const records: ExchangeRecord[] = (data || []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        productId: item.product_id,
        productName: item.product_name,
        productType: item.product_type,
        points: item.points,
        quantity: item.quantity,
        status: item.status as ExchangeStatus,
        exchangeCode: item.exchange_code,
        shippingInfo: item.shipping_info,
        virtualItemInfo: item.virtual_item_info,
        couponInfo: item.coupon_info,
        membershipInfo: item.membership_info,
        notes: item.notes,
        processedAt: item.processed_at,
        completedAt: item.completed_at,
        cancelledAt: item.cancelled_at,
        refundPoints: item.refund_points,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { records, total: count || 0 };
    } catch (error) {
      console.error('[PointsMallService] 获取兑换记录失败:', error);
      return { records: [], total: 0 };
    }
  }

  async cancelExchange(
    userId: string,
    recordId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: record } = await supabase
        .from('points_exchange_records')
        .select('*')
        .eq('id', recordId)
        .eq('user_id', userId)
        .single();

      if (!record) {
        return { success: false, error: '兑换记录不存在' };
      }

      if (record.status !== 'pending') {
        return { success: false, error: '该订单无法取消' };
      }

      await supabase
        .from('points_exchange_records')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          refund_points: record.points,
        })
        .eq('id', recordId);

      await supabase.rpc('increment_product_stock', {
        p_product_id: record.product_id,
        p_quantity: record.quantity,
      });

      pointsService.addPoints(
        record.points,
        '取消兑换退款',
        'system',
        `取消兑换：${record.product_name}`,
        `refund_${recordId}`
      );

      return { success: true };
    } catch (error: any) {
      console.error('[PointsMallService] 取消兑换失败:', error);
      return { success: false, error: error.message };
    }
  }

  clearCache() {
    this.cache = {
      products: null,
      categories: null,
      lastUpdated: 0,
    };
    localStorage.removeItem(this.CACHE_KEY);
  }
}

export const pointsMallService = new PointsMallService();
export default pointsMallService;
