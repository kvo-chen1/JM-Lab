/**
 * 商家服务层
 * 处理商家相关的所有API调用和数据操作
 */

import { supabase } from '@/lib/supabase';

// ==================== 辅助函数 ====================

/**
 * 获取当前用户ID
 * 优先从 supabase 获取，失败则从 localStorage 获取
 */
function getCurrentUserId(): string | null {
  // 尝试从 localStorage 获取（因为 supabase.auth.getUser() 可能返回 null）
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      if (userData?.id) {
        return userData.id;
      }
    }
  } catch (e) {
    console.error('[MerchantService] 解析用户信息失败:', e);
  }
  
  return null;
}

// ==================== 类型定义 ====================

export interface Merchant {
  id: string;
  user_id: string;
  store_name: string;
  store_logo?: string;
  store_description?: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  business_license?: string;
  id_card_front?: string;
  id_card_back?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  rating: number;
  total_sales: number;
  total_orders: number;
}

export interface Product {
  id: string;
  merchant_id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  stock: number;
  category: string;
  images: string[];
  status: 'active' | 'inactive' | 'out_of_stock';
  sales_count: number;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_no: string;
  merchant_id: string;
  customer_id: string;
  customer_name: string;
  customer_avatar?: string;
  total_amount: number;
  status: 'pending_payment' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunding' | 'refunded';
  items: OrderItem[];
  shipping_address: ShippingAddress;
  shipping_company?: string;
  tracking_number?: string;
  remark?: string;
  created_at: string;
  paid_at?: string;
  shipped_at?: string;
  completed_at?: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  price: number;
  quantity: number;
  specs?: Record<string, string>;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  zip_code?: string;
}

export interface AfterSalesRequest {
  id: string;
  order_id: string;
  order_no: string;
  merchant_id: string;
  customer_id: string;
  customer_name: string;
  type: 'refund' | 'return' | 'exchange';
  reason: string;
  description: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  amount: number;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  customer_id: string;
  customer_name: string;
  customer_avatar?: string;
  rating: number;
  content: string;
  images: string[];
  merchant_reply?: string;
  reply_at?: string;
  is_anonymous: boolean;
  created_at: string;
}

export interface DashboardStats {
  // 今日数据
  today_sales: number;
  today_orders: number;
  today_visitors: number;
  today_conversion_rate: number;
  // 昨日数据（用于计算环比）
  yesterday_sales: number;
  yesterday_orders: number;
  yesterday_visitors: number;
  yesterday_conversion_rate: number;
  // 待办事项
  pending_orders: number;
  pending_aftersales: number;
  pending_reviews: number;
  low_stock_products: number;
  // 商品统计
  total_products: number;
  active_products: number;
  inactive_products: number;
}

export interface SalesTrend {
  date: string;
  sales: number;
  orders: number;
  visitors: number;
}

export interface ProductRanking {
  id: string;
  name: string;
  image: string;
  sales: number;
  revenue: number;
}

export interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
}

export interface ConversionFunnel {
  stage: string;
  count: number;
  conversion_rate: number;
}

export interface TodoItem {
  id: string;
  type: 'order' | 'aftersales' | 'review' | 'product';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  created_at: string;
}

export interface Notification {
  id: string;
  type: 'system' | 'order' | 'aftersales' | 'review';
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

// ==================== Mock 数据 ====================

const mockMerchant: Merchant = {
  id: 'merchant_001',
  user_id: 'user_001',
  store_name: '津门文创旗舰店',
  store_logo: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200',
  store_description: '专注天津特色文创产品，传承津门文化',
  contact_name: '张经理',
  contact_phone: '13800138000',
  contact_email: 'merchant@example.com',
  status: 'approved',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-03-08T00:00:00Z',
  rating: 4.8,
  total_sales: 125680,
  total_orders: 3420
};

const mockProducts: Product[] = [
  {
    id: 'prod_001',
    merchant_id: 'merchant_001',
    name: '天津之眼摩天轮模型',
    description: '精致复刻天津地标建筑，采用环保材质制作',
    price: 128,
    original_price: 168,
    stock: 50,
    category: '地标模型',
    images: ['https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400'],
    status: 'active',
    sales_count: 328,
    rating: 4.9,
    review_count: 156,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z'
  },
  {
    id: 'prod_002',
    merchant_id: 'merchant_001',
    name: '泥人张彩塑-京剧脸谱',
    description: '传统泥人张工艺，手工绘制京剧脸谱',
    price: 268,
    stock: 20,
    category: '非遗手作',
    images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'],
    status: 'active',
    sales_count: 89,
    rating: 4.8,
    review_count: 45,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-03-05T00:00:00Z'
  },
  {
    id: 'prod_003',
    merchant_id: 'merchant_001',
    name: '杨柳青年画-连年有余',
    description: '传统木版年画，寓意吉祥',
    price: 88,
    stock: 5,
    category: '传统书画',
    images: ['https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=400'],
    status: 'active',
    sales_count: 256,
    rating: 4.7,
    review_count: 128,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-03-07T00:00:00Z'
  }
];

const mockOrders: Order[] = [
  {
    id: 'order_001',
    order_no: 'ORD202403080001',
    merchant_id: 'merchant_001',
    customer_id: 'cust_001',
    customer_name: '李先生',
    total_amount: 256,
    status: 'paid',
    items: [
      {
        id: 'item_001',
        product_id: 'prod_001',
        product_name: '天津之眼摩天轮模型',
        product_image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100',
        price: 128,
        quantity: 2
      }
    ],
    shipping_address: {
      name: '李先生',
      phone: '13900139000',
      province: '天津市',
      city: '天津市',
      district: '和平区',
      address: '南京路123号'
    },
    created_at: '2024-03-08T10:30:00Z',
    paid_at: '2024-03-08T10:35:00Z'
  },
  {
    id: 'order_002',
    order_no: 'ORD202403080002',
    merchant_id: 'merchant_001',
    customer_id: 'cust_002',
    customer_name: '王女士',
    total_amount: 268,
    status: 'pending_payment',
    items: [
      {
        id: 'item_002',
        product_id: 'prod_002',
        product_name: '泥人张彩塑-京剧脸谱',
        product_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100',
        price: 268,
        quantity: 1
      }
    ],
    shipping_address: {
      name: '王女士',
      phone: '13800138001',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      address: '建国路456号'
    },
    created_at: '2024-03-08T09:15:00Z'
  }
];

const mockAfterSales: AfterSalesRequest[] = [
  {
    id: 'as_001',
    order_id: 'order_003',
    order_no: 'ORD202403070001',
    merchant_id: 'merchant_001',
    customer_id: 'cust_003',
    customer_name: '张先生',
    type: 'return',
    reason: '商品与描述不符',
    description: '收到的商品颜色与图片有差异，希望退货退款',
    images: [],
    status: 'pending',
    amount: 128,
    created_at: '2024-03-08T08:00:00Z',
    updated_at: '2024-03-08T08:00:00Z'
  }
];

const mockReviews: Review[] = [
  {
    id: 'rev_001',
    product_id: 'prod_001',
    product_name: '天津之眼摩天轮模型',
    product_image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100',
    customer_id: 'cust_001',
    customer_name: '李先生',
    rating: 5,
    content: '做工非常精致，细节处理得很好，送礼很有面子！',
    images: [],
    is_anonymous: false,
    created_at: '2024-03-07T14:30:00Z'
  },
  {
    id: 'rev_002',
    product_id: 'prod_002',
    product_name: '泥人张彩塑-京剧脸谱',
    product_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100',
    customer_id: 'cust_004',
    customer_name: '陈女士',
    rating: 4,
    content: '整体不错，就是包装可以再精致一些',
    images: [],
    is_anonymous: false,
    created_at: '2024-03-06T16:45:00Z'
  }
];

const mockDashboardStats: DashboardStats = {
  today_sales: 3680,
  today_orders: 12,
  today_visitors: 156,
  today_conversion_rate: 7.69,
  pending_orders: 8,
  pending_aftersales: 3,
  pending_reviews: 5,
  low_stock_products: 2
};

const mockSalesTrend: SalesTrend[] = [
  { date: '03-02', sales: 2100, orders: 8, visitors: 120 },
  { date: '03-03', sales: 2800, orders: 10, visitors: 145 },
  { date: '03-04', sales: 1950, orders: 7, visitors: 98 },
  { date: '03-05', sales: 3200, orders: 12, visitors: 168 },
  { date: '03-06', sales: 2650, orders: 9, visitors: 134 },
  { date: '03-07', sales: 3100, orders: 11, visitors: 152 },
  { date: '03-08', sales: 3680, orders: 12, visitors: 156 }
];

const mockProductRanking: ProductRanking[] = [
  { id: 'prod_001', name: '天津之眼摩天轮模型', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100', sales: 328, revenue: 41984 },
  { id: 'prod_003', name: '杨柳青年画-连年有余', image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=100', sales: 256, revenue: 22528 },
  { id: 'prod_002', name: '泥人张彩塑-京剧脸谱', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100', sales: 89, revenue: 23852 }
];

const mockTrafficSources: TrafficSource[] = [
  { source: '搜索', visitors: 520, percentage: 35 },
  { source: '直接访问', visitors: 380, percentage: 25 },
  { source: '社交媒体', visitors: 300, percentage: 20 },
  { source: '广告推广', visitors: 180, percentage: 12 },
  { source: '其他', visitors: 120, percentage: 8 }
];

const mockConversionFunnel: ConversionFunnel[] = [
  { stage: '浏览商品', count: 1250, conversion_rate: 100 },
  { stage: '加入购物车', count: 380, conversion_rate: 30.4 },
  { stage: '提交订单', count: 156, conversion_rate: 12.5 },
  { stage: '完成支付', count: 142, conversion_rate: 11.4 }
];

const mockTodos: TodoItem[] = [
  { id: 'todo_001', type: 'order', title: '待发货订单', description: '您有 8 个订单待发货', priority: 'high', created_at: '2024-03-08T00:00:00Z' },
  { id: 'todo_002', type: 'aftersales', title: '售后申请待处理', description: '您有 3 个售后申请需要处理', priority: 'high', created_at: '2024-03-08T00:00:00Z' },
  { id: 'todo_003', type: 'review', title: '新评价待回复', description: '您有 5 条新评价待回复', priority: 'medium', created_at: '2024-03-08T00:00:00Z' },
  { id: 'todo_004', type: 'product', title: '库存预警', description: '2 个商品库存不足，请及时补货', priority: 'medium', created_at: '2024-03-08T00:00:00Z' }
];

const mockNotifications: Notification[] = [
  { id: 'notif_001', type: 'order', title: '新订单提醒', content: '您收到一个新订单，订单号：ORD202403080003', is_read: false, created_at: '2024-03-08T11:00:00Z' },
  { id: 'notif_002', type: 'system', title: '平台公告', content: '商家工作台新功能上线，快来体验吧！', is_read: false, created_at: '2024-03-08T09:00:00Z' },
  { id: 'notif_003', type: 'review', title: '新评价提醒', content: '您的商品收到一条新评价', is_read: true, created_at: '2024-03-07T15:30:00Z' }
];

// ==================== 商家服务类 ====================

class MerchantService {
  private isMockMode = false; // 使用真实数据库数据

  // ==================== 商家信息 ====================

  async getCurrentMerchant(): Promise<Merchant | null> {
    if (this.isMockMode) {
      return mockMerchant;
    }

    // 获取当前用户ID
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('[MerchantService] 无法获取用户ID');
      return null;
    }

    console.log('[MerchantService] 获取商家信息，用户ID:', userId);

    // 先尝试获取现有商家记录
    const { data: existingMerchants, error: fetchError } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', userId);

    console.log('[MerchantService] 查询结果:', { existingMerchants, fetchError });

    // 如果找到了商家记录，同步 merchant_stores 的数据
    if (existingMerchants && existingMerchants.length > 0) {
      const merchant = existingMerchants[0];
      
      // 从 merchant_stores 获取最新的店铺信息
      const { data: storeData } = await supabase
        .from('merchant_stores')
        .select('store_name, store_logo, store_description')
        .eq('user_id', userId)
        .maybeSingle();
      
      // 如果 merchant_stores 有数据，同步到 merchants
      if (storeData) {
        // 更新 merchants 表的 logo 和名称
        if (storeData.store_logo && storeData.store_logo !== merchant.store_logo) {
          await supabase
            .from('merchants')
            .update({ store_logo: storeData.store_logo })
            .eq('id', merchant.id);
          merchant.store_logo = storeData.store_logo;
        }
        
        if (storeData.store_name && storeData.store_name !== merchant.store_name) {
          await supabase
            .from('merchants')
            .update({ store_name: storeData.store_name })
            .eq('id', merchant.id);
          merchant.store_name = storeData.store_name;
        }
        
        if (storeData.store_description && storeData.store_description !== merchant.store_description) {
          await supabase
            .from('merchants')
            .update({ store_description: storeData.store_description })
            .eq('id', merchant.id);
          merchant.store_description = storeData.store_description;
        }
      }
      
      return merchant;
    }

    // 如果没有找到商家记录，自动创建一个新的
    if (!existingMerchants || existingMerchants.length === 0) {
      console.log('[MerchantService] 未找到商家记录，正在为用户创建新商家...', userId);
      
      // 尝试从 localStorage 获取用户信息
      let userEmail = '';
      let userName = '';
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          userEmail = userData?.email || '';
          userName = userData?.username || userData?.nickname || '店主';
        }
      } catch (e) {
        console.error('[MerchantService] 解析用户信息失败:', e);
      }
      
      const newMerchant = {
        user_id: userId,
        store_name: userName ? `${userName}的店铺` : '新店铺',
        store_description: '',
        contact_name: userName || '店主',
        contact_phone: '',
        contact_email: userEmail || '',
        status: 'approved',
        rating: 5.0,
        total_sales: 0,
        total_orders: 0,
      };

      const { data: createdMerchant, error: createError } = await supabase
        .from('merchants')
        .insert(newMerchant)
        .select()
        .single();

      if (createError) {
        console.error('[MerchantService] 创建商家记录失败:', createError);
        throw createError;
      }

      console.log('[MerchantService] 商家记录创建成功:', createdMerchant?.id);
      return createdMerchant;
    }

    // 其他错误直接抛出
    if (fetchError) throw fetchError;
    return null;
  }

  async updateMerchant(merchantId: string, updates: Partial<Merchant>): Promise<Merchant> {
    if (this.isMockMode) {
      return { ...mockMerchant, ...updates };
    }

    const { data, error } = await supabase
      .from('merchants')
      .update(updates)
      .eq('id', merchantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== 商品管理 ====================

  async getProducts(merchantId: string, params?: { status?: string; category?: string; search?: string }): Promise<Product[]> {
    if (this.isMockMode) {
      let products = [...mockProducts];
      if (params?.status) {
        products = products.filter(p => p.status === params.status);
      }
      if (params?.category) {
        products = products.filter(p => p.category === params.category);
      }
      if (params?.search) {
        products = products.filter(p => p.name.includes(params.search!));
      }
      return products;
    }

    // 从 products 表查询（商家发布的商品）
    let query = supabase
      .from('products')
      .select('*')
      .eq('merchant_id', merchantId);

    if (params?.status) query = query.eq('status', params.status);
    if (params?.category) query = query.eq('category', params.category);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    if (this.isMockMode) {
      const newProduct: Product = {
        ...product,
        id: `prod_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockProducts.unshift(newProduct);
      return newProduct;
    }

    // 保存到 merchant_products 表（文创商城商品）
    const { data, error } = await supabase
      .from('merchant_products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
    if (this.isMockMode) {
      const index = mockProducts.findIndex(p => p.id === productId);
      if (index === -1) throw new Error('Product not found');
      mockProducts[index] = { ...mockProducts[index], ...updates, updated_at: new Date().toISOString() };
      return mockProducts[index];
    }

    // 更新 merchant_products 表
    const { data, error } = await supabase
      .from('merchant_products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteProduct(productId: string): Promise<void> {
    if (this.isMockMode) {
      const index = mockProducts.findIndex(p => p.id === productId);
      if (index !== -1) mockProducts.splice(index, 1);
      return;
    }

    // 从 merchant_products 表删除
    const { error } = await supabase
      .from('merchant_products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
  }

  async toggleProductStatus(productId: string, status: 'active' | 'inactive'): Promise<void> {
    await this.updateProduct(productId, { status });
  }

  // ==================== 订单管理 ====================

  async getOrders(merchantId: string, params?: { status?: string; startDate?: string; endDate?: string }): Promise<Order[]> {
    if (this.isMockMode) {
      let orders = [...mockOrders];
      if (params?.status) {
        orders = orders.filter(o => o.status === params.status);
      }
      return orders;
    }

    // 注意：订单表中使用的是 seller_id 而不是 merchant_id
    let query = supabase
      .from('orders')
      .select('*')
      .eq('seller_id', merchantId);

    if (params?.status) query = query.eq('status', params.status);
    if (params?.startDate) query = query.gte('created_at', params.startDate);
    if (params?.endDate) query = query.lte('created_at', params.endDate);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[MerchantService] 获取订单失败:', error);
      throw error;
    }
    
    console.log('[MerchantService] 获取订单成功:', data?.length || 0, '条记录');
    return data || [];
  }

  async shipOrder(orderId: string, shippingInfo: { company: string; trackingNumber: string }): Promise<void> {
    if (this.isMockMode) {
      const order = mockOrders.find(o => o.id === orderId);
      if (order) {
        order.status = 'shipped';
        order.shipping_company = shippingInfo.company;
        order.tracking_number = shippingInfo.trackingNumber;
        order.shipped_at = new Date().toISOString();
      }
      return;
    }

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'shipped',
        shipping_company: shippingInfo.company,
        tracking_number: shippingInfo.trackingNumber,
        shipped_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;
  }

  // ==================== 售后管理 ====================

  async getAfterSalesRequests(merchantId: string, params?: { status?: string }): Promise<AfterSalesRequest[]> {
    if (this.isMockMode) {
      let requests = [...mockAfterSales];
      if (params?.status) {
        requests = requests.filter(r => r.status === params.status);
      }
      return requests;
    }

    let query = supabase
      .from('after_sales_requests')
      .select('*')
      .eq('merchant_id', merchantId);

    if (params?.status) query = query.eq('status', params.status);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async handleAfterSalesRequest(requestId: string, action: 'approve' | 'reject', reason?: string): Promise<void> {
    if (this.isMockMode) {
      const request = mockAfterSales.find(r => r.id === requestId);
      if (request) {
        request.status = action === 'approve' ? 'approved' : 'rejected';
        if (reason) request.rejection_reason = reason;
        request.updated_at = new Date().toISOString();
      }
      return;
    }

    const { error } = await supabase
      .from('after_sales_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) throw error;
  }

  // ==================== 评价管理 ====================

  async getReviews(merchantId: string, params?: { rating?: number; hasReply?: boolean }): Promise<Review[]> {
    if (this.isMockMode) {
      let reviews = [...mockReviews];
      if (params?.rating) {
        reviews = reviews.filter(r => r.rating === params.rating);
      }
      if (params?.hasReply !== undefined) {
        reviews = params.hasReply 
          ? reviews.filter(r => r.merchant_reply)
          : reviews.filter(r => !r.merchant_reply);
      }
      return reviews;
    }

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async replyToReview(reviewId: string, reply: string): Promise<void> {
    if (this.isMockMode) {
      const review = mockReviews.find(r => r.id === reviewId);
      if (review) {
        review.merchant_reply = reply;
        review.reply_at = new Date().toISOString();
      }
      return;
    }

    const { error } = await supabase
      .from('reviews')
      .update({
        merchant_reply: reply,
        reply_at: new Date().toISOString()
      })
      .eq('id', reviewId);

    if (error) throw error;
  }

  // ==================== 数据中心 ====================

  async getDashboardStats(merchantId: string): Promise<DashboardStats> {
    if (this.isMockMode) {
      return mockDashboardStats;
    }

    // 实际实现中，这里会从多个表聚合数据
    const { data, error } = await supabase
      .rpc('get_merchant_dashboard_stats', { merchant_id: merchantId });

    if (error) throw error;
    return data;
  }

  async getSalesTrend(merchantId: string, days: number = 7): Promise<SalesTrend[]> {
    if (this.isMockMode) {
      return mockSalesTrend;
    }

    const { data, error } = await supabase
      .rpc('get_merchant_sales_trend', { merchant_id: merchantId, days });

    if (error) throw error;
    return data || [];
  }

  async getProductRanking(merchantId: string, limit: number = 10): Promise<ProductRanking[]> {
    if (this.isMockMode) {
      return mockProductRanking.slice(0, limit);
    }

    const { data, error } = await supabase
      .rpc('get_merchant_product_ranking', { merchant_id: merchantId, limit });

    if (error) throw error;
    return data || [];
  }

  async getTrafficSources(merchantId: string): Promise<TrafficSource[]> {
    if (this.isMockMode) {
      return mockTrafficSources;
    }

    const { data, error } = await supabase
      .rpc('get_merchant_traffic_sources', { merchant_id: merchantId });

    if (error) throw error;
    return data || [];
  }

  async getConversionFunnel(merchantId: string): Promise<ConversionFunnel[]> {
    if (this.isMockMode) {
      return mockConversionFunnel;
    }

    const { data, error } = await supabase
      .rpc('get_merchant_conversion_funnel', { merchant_id: merchantId });

    if (error) throw error;
    return data || [];
  }

  // ==================== 待办事项 ====================

  async getTodos(merchantId: string): Promise<TodoItem[]> {
    if (this.isMockMode) {
      return mockTodos;
    }

    const { data, error } = await supabase
      .from('merchant_todos')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ==================== 消息通知 ====================

  async getNotifications(merchantId: string): Promise<Notification[]> {
    if (this.isMockMode) {
      return mockNotifications;
    }

    const { data, error } = await supabase
      .from('merchant_notifications')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    if (this.isMockMode) {
      const notification = mockNotifications.find(n => n.id === notificationId);
      if (notification) notification.is_read = true;
      return;
    }

    const { error } = await supabase
      .from('merchant_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  // ==================== 商家申请 ====================

  async applyForMerchant(application: Omit<Merchant, 'id' | 'status' | 'created_at' | 'updated_at' | 'rating' | 'total_sales' | 'total_orders'>): Promise<Merchant> {
    if (this.isMockMode) {
      return {
        ...application,
        id: `merchant_${Date.now()}`,
        status: 'pending',
        rating: 0,
        total_sales: 0,
        total_orders: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const { data, error } = await supabase
      .from('merchants')
      .insert({
        ...application,
        status: 'pending',
        rating: 0,
        total_sales: 0,
        total_orders: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== 权限检查 ====================

  async checkMerchantStatus(): Promise<{ isMerchant: boolean; status: 'none' | 'pending' | 'approved' | 'rejected' }> {
    if (this.isMockMode) {
      return { isMerchant: true, status: 'approved' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isMerchant: false, status: 'none' };

    const { data, error } = await supabase
      .from('merchants')
      .select('status')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return { isMerchant: false, status: 'none' };
    return { isMerchant: true, status: data.status };
  }
}

export const merchantService = new MerchantService();
export default merchantService;
