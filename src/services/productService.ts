/**
 * 商品服务 - 提供商品管理和积分兑换功能 (Supabase 版本)
 */

import { supabase } from '@/lib/supabaseClient';

// 商品类型定义
export interface Product {
  id: string;
  name: string;
  description: string;
  points: number;
  stock: number;
  status: 'active' | 'inactive' | 'sold_out';
  category: ProductCategory;
  tags: string[];
  imageUrl: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

// 兑换记录类型定义
export interface ExchangeRecord {
  id: string;
  productId: string;
  productName: string;
  productCategory: string;
  points: number;
  quantity: number;
  date: string;
  userId: string;
  status: 'completed' | 'pending' | 'cancelled' | 'processing' | 'refunded';
  productImage?: string;
  // 管理员查看的额外字段
  userName?: string;
  userEmail?: string;
  shippingAddress?: string;
  contactPhone?: string;
  adminNotes?: string;
  processedAt?: string;
  processedBy?: string;
}

// 商品分类类型
export type ProductCategory = 'virtual' | 'physical' | 'service' | 'rights';

// 商品列表响应
export interface ProductsResponse {
  total: number;
  products: Product[];
  limit: number;
  offset: number;
}

// 兑换记录响应
export interface ExchangeRecordsResponse {
  total: number;
  records: ExchangeRecord[];
  limit: number;
  offset: number;
}

// 兑换结果
export interface ExchangeResult {
  success: boolean;
  exchangeId?: string;
  pointsCost?: number;
  remainingStock?: number;
  errorMessage?: string;
}

// 商品服务类
class ProductService {
  /**
   * 获取所有商品
   */
  async getAllProducts(category?: ProductCategory, search?: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase.rpc('get_products', {
        p_category: category || null,
        p_status: 'active',
        p_search: search || null,
        p_limit: 100,
        p_offset: 0
      });

      if (error) {
        console.error('获取商品列表失败:', error);
        throw error;
      }

      const response = data as { total: number; products: any[]; limit: number; offset: number };
      
      return (response.products || []).map(this.mapDbProductToProduct);
    } catch (error) {
      console.error('获取商品列表失败:', error);
      return [];
    }
  }

  /**
   * 根据ID获取商品
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('获取商品详情失败:', error);
        return null;
      }

      return this.mapDbProductToProduct(data);
    } catch (error) {
      console.error('获取商品详情失败:', error);
      return null;
    }
  }

  /**
   * 获取用户兑换记录
   */
  async getUserExchangeRecords(userId: string, limit: number = 50, offset: number = 0): Promise<ExchangeRecord[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_exchange_records_with_products', {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        console.error('获取兑换记录失败:', error);
        throw error;
      }

      const response = data as { total: number; records: any[]; limit: number; offset: number };
      
      return (response.records || []).map(this.mapDbRecordToExchangeRecord);
    } catch (error) {
      console.error('获取兑换记录失败:', error);
      return [];
    }
  }

  /**
   * 兑换商品
   */
  async exchangeProduct(productId: string, userId: string, quantity: number = 1): Promise<ExchangeResult> {
    try {
      const { data, error } = await supabase.rpc('exchange_product', {
        p_user_id: userId,
        p_product_id: productId,
        p_quantity: quantity
      });

      if (error) {
        console.error('兑换商品失败:', error);
        return {
          success: false,
          errorMessage: error.message || '兑换失败'
        };
      }

      const result = data as ExchangeResult;
      return result;
    } catch (error: any) {
      console.error('兑换商品失败:', error);
      return {
        success: false,
        errorMessage: error.message || '兑换失败'
      };
    }
  }

  /**
   * 添加商品（管理员功能）
   */
  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product | null> {
    try {
      // 数据校验
      if (!product.name || product.name.trim() === '') {
        throw new Error('商品名称不能为空');
      }
      if (product.points <= 0) {
        throw new Error('所需积分必须大于0');
      }
      if (product.stock < 0) {
        throw new Error('库存数量不能为负数');
      }
      if (!product.imageUrl || product.imageUrl.trim() === '') {
        throw new Error('商品图片URL不能为空');
      }
      if (!product.description || product.description.trim() === '') {
        throw new Error('商品描述不能为空');
      }
      if (!product.category || product.category.trim() === '') {
        throw new Error('商品分类不能为空');
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          description: product.description,
          points: product.points,
          stock: product.stock,
          status: product.status,
          category: product.category,
          tags: product.tags || [],
          image_url: product.imageUrl,
          is_featured: product.isFeatured || false
        })
        .select()
        .single();

      if (error) {
        console.error('添加商品失败:', error);
        throw error;
      }

      return this.mapDbProductToProduct(data);
    } catch (error) {
      console.error('添加商品失败:', error);
      throw error;
    }
  }

  /**
   * 更新商品（管理员功能）
   */
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    try {
      // 数据校验
      if (updates.name && updates.name.trim() === '') {
        throw new Error('商品名称不能为空');
      }
      if (updates.points !== undefined && updates.points <= 0) {
        throw new Error('所需积分必须大于0');
      }
      if (updates.stock !== undefined && updates.stock < 0) {
        throw new Error('库存数量不能为负数');
      }

      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.points !== undefined) updateData.points = updates.points;
      if (updates.stock !== undefined) updateData.stock = updates.stock;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
      if (updates.isFeatured !== undefined) updateData.is_featured = updates.isFeatured;

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('更新商品失败:', error);
        return null;
      }

      return this.mapDbProductToProduct(data);
    } catch (error) {
      console.error('更新商品失败:', error);
      return null;
    }
  }

  /**
   * 删除商品（管理员功能）
   */
  async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('删除商品失败:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('删除商品失败:', error);
      return false;
    }
  }

  /**
   * 将数据库商品映射为前端商品类型
   */
  private mapDbProductToProduct(dbProduct: any): Product {
    return {
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description,
      points: dbProduct.points,
      stock: dbProduct.stock,
      status: dbProduct.status,
      category: dbProduct.category,
      tags: dbProduct.tags || [],
      imageUrl: dbProduct.image_url,
      isFeatured: dbProduct.is_featured || false,
      createdAt: dbProduct.created_at,
      updatedAt: dbProduct.updated_at
    };
  }

  /**
   * 将数据库兑换记录映射为前端兑换记录类型
   */
  private mapDbRecordToExchangeRecord(dbRecord: any): ExchangeRecord {
    return {
      id: dbRecord.id,
      productId: dbRecord.product_id,
      productName: dbRecord.product_name,
      productCategory: dbRecord.product_category,
      points: dbRecord.points_cost,
      quantity: dbRecord.quantity || 1,
      date: dbRecord.created_at,
      userId: dbRecord.user_id,
      status: dbRecord.status,
      productImage: dbRecord.product_image
    };
  }

  // ============ 订单管理功能（管理员） ============

  /**
   * 获取所有兑换记录（管理员功能）
   */
  async getAllExchangeRecords(options?: {
    status?: ExchangeRecord['status'];
    userId?: string;
    productId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<ExchangeRecordsResponse> {
    try {
      const { status, userId, productId, startDate, endDate, limit = 50, offset = 0 } = options || {};

      let query = supabase
        .from('exchange_records')
        .select('*', { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }
      if (userId) {
        query = query.eq('user_id', userId);
      }
      if (productId) {
        query = query.eq('product_id', productId);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('获取兑换记录失败:', error);
        throw error;
      }

      // 获取用户信息和商品图片
      const userIds = [...new Set((data || []).map(r => r.user_id))];
      const productIds = [...new Set((data || []).map(r => r.product_id))];
      
      // 获取用户信息
      const { data: usersData } = await supabase
        .from('users')
        .select('id, username, email')
        .in('id', userIds);
      
      // 获取商品图片（product_id 是 text 类型）
      const { data: productsData } = await supabase
        .from('products')
        .select('id, image_url')
        .in('id', productIds);

      const userMap = new Map(usersData?.map(u => [u.id, u]) || []);
      const productMap = new Map(productsData?.map(p => [p.id, p]) || []);

      const records: ExchangeRecord[] = (data || []).map(record => {
        const user = userMap.get(record.user_id);
        const product = productMap.get(record.product_id);
        return {
          id: record.id,
          productId: record.product_id,
          productName: record.product_name || '未知商品',
          productCategory: record.product_category || 'unknown',
          points: record.points_cost,
          quantity: record.quantity || 1,
          date: record.created_at,
          userId: record.user_id,
          status: record.status,
          productImage: product?.image_url,
          userName: user?.username || user?.email?.split('@')[0] || '未知用户',
          userEmail: user?.email
        };
      });

      return {
        total: count || 0,
        records,
        limit,
        offset
      };
    } catch (error) {
      console.error('获取兑换记录失败:', error);
      return { total: 0, records: [], limit: 50, offset: 0 };
    }
  }

  /**
   * 更新订单状态（管理员功能）
   */
  async updateOrderStatus(
    orderId: string,
    status: ExchangeRecord['status'],
    adminNotes?: string,
    processedBy?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        processed_at: new Date().toISOString()
      };

      if (adminNotes !== undefined) {
        updateData.admin_notes = adminNotes;
      }
      if (processedBy) {
        updateData.processed_by = processedBy;
      }

      const { error } = await supabase
        .from('exchange_records')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('更新订单状态失败:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('更新订单状态失败:', error);
      return false;
    }
  }

  /**
   * 获取订单统计（管理员功能）
   */
  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    refunded: number;
    totalPoints: number;
    todayOrders: number;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_exchange_stats');

      if (error) {
        console.error('获取订单统计失败:', error);
        // 降级：手动统计
        const { data: allRecords } = await supabase
          .from('exchange_records')
          .select('status, points_cost, created_at');

        const today = new Date().toISOString().split('T')[0];
        const stats = {
          total: allRecords?.length || 0,
          pending: 0,
          processing: 0,
          completed: 0,
          cancelled: 0,
          refunded: 0,
          totalPoints: 0,
          todayOrders: 0
        };

        allRecords?.forEach(record => {
          stats[record.status as keyof typeof stats]++;
          stats.totalPoints += record.points_cost || 0;
          if (record.created_at?.startsWith(today)) {
            stats.todayOrders++;
          }
        });

        return stats;
      }

      return data as any;
    } catch (error) {
      console.error('获取订单统计失败:', error);
      return {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        cancelled: 0,
        refunded: 0,
        totalPoints: 0,
        todayOrders: 0
      };
    }
  }

  // ============ 以下方法为兼容旧代码的同步方法，已弃用 ============
  
  /**
   * @deprecated 请使用异步的 getAllProducts 方法
   */
  getAllProductsSync(): Product[] {
    console.warn('getAllProductsSync 已弃用，请使用 getAllProducts');
    return [];
  }

  /**
   * @deprecated 请使用异步的 getUserExchangeRecords 方法
   */
  getUserExchangeRecordsSync(userId: string): ExchangeRecord[] {
    console.warn('getUserExchangeRecordsSync 已弃用，请使用 getUserExchangeRecords');
    return [];
  }

  /**
   * @deprecated 请使用异步的 exchangeProduct 方法
   */
  exchangeProductSync(productId: string, userId: string): ExchangeRecord {
    console.warn('exchangeProductSync 已弃用，请使用 exchangeProduct');
    throw new Error('请使用异步的 exchangeProduct 方法');
  }
}

// 导出单例实例
const service = new ProductService();
export default service;
