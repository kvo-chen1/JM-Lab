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
  // 累计数据
  total_sales: number;
  total_orders: number;
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

    // 获取当前用户 ID
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('[MerchantService] 无法获取用户 ID');
      return null;
    }

    console.log('[MerchantService] 获取商家信息，用户 ID:', userId);

    // 先尝试获取现有商家记录
    const { data: existingMerchants, error: fetchError } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    console.log('[MerchantService] 查询结果:', { existingMerchants, fetchError });

    // 处理错误
    if (fetchError) {
      console.error('[MerchantService] 查询商家记录失败:', fetchError);
      throw fetchError;
    }

    // 如果找到了商家记录，返回商家信息
    if (existingMerchants && existingMerchants.length > 0) {
      const merchant = existingMerchants[0];
      console.log('[MerchantService] 找到商家记录:', merchant.id);
      return merchant;
    }

    // 没有找到商家记录，返回 null
    console.log('[MerchantService] 未找到商家记录，用户未入驻');
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

    console.log('[MerchantService] 查询商品，merchantId:', merchantId);

    // 从 products 表查询
    // 同时查询 seller_id 和 merchant_id 以兼容不同数据格式
    // seller_id 和 merchant_id 都可能存储 merchant.id
    let query = supabase
      .from('products')
      .select('*')
      .or(`seller_id.eq.${merchantId},merchant_id.eq.${merchantId}`);

    if (params?.status) query = query.eq('status', params.status);
    if (params?.category) query = query.eq('category', params.category);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[MerchantService] 获取商品失败:', error);
      throw error;
    }
    
    console.log('[MerchantService] 获取商品成功:', data?.length || 0, '条记录');
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

    // 订单表中的 seller_id 存储的是商家的 merchant.id
    console.log('[MerchantService] 使用 merchantId 查询订单:', merchantId);
    
    // 先获取订单列表
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', merchantId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('[MerchantService] 获取订单失败:', ordersError);
      throw ordersError;
    }
    
    // 获取所有买家ID
    const buyerIds = (ordersData || [])
      .map(order => order.customer_id)
      .filter((id): id is string => !!id);
    
    // 去重
    const uniqueBuyerIds = [...new Set(buyerIds)];
    
    // 获取买家信息
    let buyersMap = new Map<string, { username: string; avatar_url: string }>();
    if (uniqueBuyerIds.length > 0) {
      const { data: buyersData } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', uniqueBuyerIds);
      
      (buyersData || []).forEach((buyer: any) => {
        buyersMap.set(buyer.id, buyer);
      });
    }
    
    // 获取所有订单ID，查询 order_items 表
    const orderIds = (ordersData || []).map(order => order.id);
    let orderItemsMap = new Map<string, any[]>();
    
    if (orderIds.length > 0) {
      const { data: orderItemsData } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);
      
      // 按 order_id 分组
      (orderItemsData || []).forEach((item: any) => {
        const items = orderItemsMap.get(item.order_id) || [];
        items.push(item);
        orderItemsMap.set(item.order_id, items);
      });
    }
    
    // 处理数据，将买家信息和商品信息合并到订单中
    const processedOrders = (ordersData || []).map((order: any) => {
      // 如果 customer_name 为空，尝试从 users 表中获取
      if (!order.customer_name && order.customer_id) {
        const buyer = buyersMap.get(order.customer_id);
        if (buyer) {
          order.customer_name = buyer.username || '未知用户';
          order.customer_avatar = buyer.avatar_url;
        }
      }
      
      // 如果 items 为空，从 order_items 表中获取
      if ((!order.items || order.items.length === 0) && orderItemsMap.has(order.id)) {
        const items = orderItemsMap.get(order.id) || [];
        order.items = items.map((item: any) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_image: item.product_image,
          product_specs: item.product_specs,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal
        }));
      }
      
      return order;
    });
    
    console.log('[MerchantService] 获取订单成功:', processedOrders?.length || 0, '条记录');
    return processedOrders || [];
  }

  async getOrdersByUserId(userId: string, params?: { status?: string; startDate?: string; endDate?: string }): Promise<Order[]> {
    if (this.isMockMode) {
      let orders = [...mockOrders];
      if (params?.status) {
        orders = orders.filter(o => o.status === params.status);
      }
      return orders;
    }

    // 先获取商家的 merchant.id，因为订单表中的 seller_id 存储的是 merchant.id
    console.log('[MerchantService] 使用 user_id 查询商家信息:', userId);
    const { data: merchantData, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (merchantError) {
      console.error('[MerchantService] 获取商家信息失败:', merchantError);
      throw merchantError;
    }

    if (!merchantData) {
      console.warn('[MerchantService] 未找到该用户的商家记录:', userId);
      return [];
    }

    console.log('[MerchantService] 获取到 merchant.id:', merchantData.id);
    return this.getOrders(merchantData.id, params);
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
    console.log('[MerchantService] getDashboardStats called with merchantId:', merchantId);

    if (this.isMockMode) {
      console.log('[MerchantService] Using mock data');
      return mockDashboardStats;
    }

    // 从 orders 表实时统计真实数据
    console.log('[MerchantService] Calculating real stats from orders table...');
    return this.getDashboardStatsFallback(merchantId);
  }

  // 备用方案：直接查询数据库
  private async getDashboardStatsFallback(merchantId: string): Promise<DashboardStats> {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // 获取今日订单数据
    const { data: todayOrders, error: ordersError } = await supabase
      .from('orders')
      .select('total_amount, status')
      .eq('seller_id', merchantId)
      .gte('created_at', today)
      .lte('created_at', today + 'T23:59:59');

    if (ordersError) {
      console.error('[MerchantService] Fallback query failed:', ordersError);
    }

    // 获取昨日订单数据
    const { data: yesterdayOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('seller_id', merchantId)
      .gte('created_at', yesterday)
      .lte('created_at', yesterday + 'T23:59:59');

    // 获取待处理订单数
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', merchantId)
      .eq('status', 'paid');

    // 从 orders 表统计真实的累计数据
    console.log('[MerchantService] Fallback: calculating real totals from orders table...');
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('seller_id', merchantId);
    
    if (allOrdersError) {
      console.error('[MerchantService] Failed to fetch all orders:', allOrdersError);
    }
    
    // 计算真实的累计数据
    const realTotalOrders = allOrders?.length || 0;
    const realTotalSales = allOrders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
    
    console.log('[MerchantService] Fallback: real totals:', { realTotalOrders, realTotalSales });

    // 计算统计数据
    const todaySales = todayOrders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
    const todayOrdersCount = todayOrders?.length || 0;
    const yesterdaySales = yesterdayOrders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
    const yesterdayOrdersCount = yesterdayOrders?.length || 0;

    // 获取商品统计
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId);

    const result = {
      today_sales: todaySales,
      today_orders: todayOrdersCount,
      today_visitors: 0, // 需要访问日志表
      today_conversion_rate: 0,
      yesterday_sales: yesterdaySales,
      yesterday_orders: yesterdayOrdersCount,
      yesterday_visitors: 0,
      yesterday_conversion_rate: 0,
      pending_orders: pendingOrders || 0,
      pending_aftersales: 0,
      pending_reviews: 0,
      low_stock_products: 0,
      total_products: totalProducts || 0,
      active_products: 0,
      inactive_products: 0,
      // 使用从 orders 表统计的真实数据
      total_sales: realTotalSales,
      total_orders: realTotalOrders,
    };
    
    console.log('[MerchantService] Fallback: returning result:', result);
    return result;
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

    // 使用与 getCurrentMerchant 一致的方式获取用户ID
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('[MerchantService] checkMerchantStatus: 无法获取用户ID');
      return { isMerchant: false, status: 'none' };
    }

    console.log('[MerchantService] checkMerchantStatus: 检查商家状态，用户ID:', userId);

    const { data, error } = await supabase
      .from('merchants')
      .select('status')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    console.log('[MerchantService] checkMerchantStatus: 查询结果:', { data, error });

    if (error) {
      console.error('[MerchantService] checkMerchantStatus: 查询失败:', error);
      return { isMerchant: false, status: 'none' };
    }
    
    if (!data) {
      console.log('[MerchantService] checkMerchantStatus: 未找到商家记录');
      return { isMerchant: false, status: 'none' };
    }
    
    console.log('[MerchantService] checkMerchantStatus: 商家状态:', data.status);
    return { isMerchant: true, status: data.status };
  }
}

export const merchantService = new MerchantService();
export default merchantService;
