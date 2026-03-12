/**
 * 订单服务 - 管理文创商城订单
 */
import { supabase, supabaseAdmin } from '@/lib/supabase';

// 订单类型定义
export interface Order {
  id: string;
  order_no: string;
  customer_id: string;
  seller_id: string;
  total_amount: number;

  status: 'pending_payment' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunded' | 'refunding';
  shipping_address?: ShippingAddress;
  tracking_no?: string;
  tracking_company?: string;
  remark?: string;
  paid_at?: string;
  shipped_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  // 关联数据
  items?: OrderItem[];
  buyer?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  seller?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

// 订单商品类型
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  product_specs?: ProductSpecification[];
  price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
  // 关联数据
  product?: {
    id: string;
    name: string;
    cover_image?: string;
  };
}

// 商品规格类型
export interface ProductSpecification {
  name: string;
  value: string;
}

// 收货地址类型
export interface ShippingAddress {
  name: string;
  phone: string;
  province: string;
  city: string;
  district?: string;
  address: string;
  zip_code?: string;
}

// 创建订单参数
export interface CreateOrderParams {
  customer_id: string;
  seller_id: string;
  items: {
    product_id: string;
    product_name: string;
    product_image?: string;
    product_specs?: ProductSpecification[];
    price: number;
    quantity: number;
  }[];
  shipping_address: ShippingAddress;
  remark?: string;

}

// 创建订单
export async function createOrder(
  params: CreateOrderParams
): Promise<{ data?: Order; error?: string }> {
  try {
    // 计算订单金额
    const totalAmount = params.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 生成订单号（客户端生成）
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNoData = `ORD${timestamp}${random}`;

    // 创建订单 - 只使用数据库中实际存在的字段
    let { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_no: orderNoData,
        customer_id: params.customer_id,
        seller_id: params.seller_id,
        total_amount: totalAmount,
        status: 'pending_payment',
        shipping_address: params.shipping_address,
        remark: params.remark,
      })
      .select('*')
      .single();

    console.log('[createOrder] Supabase 返回:', { order, orderError });

    // 如果返回的是数组，取第一个元素
    if (Array.isArray(order)) {
      console.warn('[createOrder] 返回的是数组，取第一个元素');
      order = order[0];
    }

    if (orderError) {
      console.error('[createOrder] 创建订单失败:', orderError);
      throw orderError;
    }

    if (!order) {
      console.error('[createOrder] 订单创建成功但返回数据为 null');
      return { error: '订单创建失败，返回数据为 null' };
    }

    console.log('[createOrder] 订单对象:', order);
    console.log('[createOrder] 订单 ID:', order.id);

    if (!order.id) {
      console.error('[createOrder] 订单创建成功但 id 字段缺失');
      return { error: '订单创建失败，id 字段缺失' };
    }

    console.log('[createOrder] 订单创建成功:', order.id);

    // 创建订单商品 - 逐个插入以避免批量插入问题
    for (const item of params.items) {
      const orderItemData = {
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image || null,
        product_specs: item.product_specs || null,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      };
      
      console.log('[createOrder] 插入订单项:', orderItemData);
      
      const { error: itemError } = await supabase
        .from('order_items')
        .insert(orderItemData);
        
      if (itemError) {
        console.error('[createOrder] 插入订单项失败:', itemError);
        throw itemError;
      }
    }

    // 减少商品库存 - 直接更新 products 表
    for (const item of params.items) {
      // 先获取当前库存
      const { data: productData, error: getError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();
      
      if (getError) {
        console.error('[createOrder] 获取商品库存失败:', getError);
        throw new Error(`获取商品库存失败: ${getError.message}`);
      }
      
      const currentStock = productData?.stock || 0;
      const newStock = Math.max(0, currentStock - item.quantity);
      
      // 更新库存
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product_id);
      
      if (stockError) {
        console.error('[createOrder] 更新商品库存失败:', stockError);
        throw new Error(`更新商品库存失败: ${stockError.message}`);
      }
    }

    return { data: order };
  } catch (err: any) {
    console.error('创建订单失败:', err);
    return { error: err.message || '创建订单失败' };
  }
}

// 获取订单列表
export async function getOrders(
  options: {
    customer_id?: string;
    seller_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data?: Order[]; count?: number; error?: string }> {
  try {
    // 先查询订单列表
    let query = supabase.from('orders').select(
      'id, order_no, customer_id, seller_id, total_amount, status, shipping_address, remark, created_at, updated_at',
      { count: 'exact' }
    );

    if (options.customer_id) {
      query = query.eq('customer_id', options.customer_id);
    }

    if (options.seller_id) {
      query = query.eq('seller_id', options.seller_id);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data: orders, error, count } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // 获取所有订单ID
    const orderIds = orders?.map((o: any) => o.id) || [];

    // 如果有订单，批量获取订单项
    let itemsMap = new Map();
    if (orderIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('id, order_id, product_id, product_name, product_image, product_specs, price, quantity, subtotal')
        .in('order_id', orderIds);

      if (itemsError) {
        console.warn('获取订单项失败:', itemsError);
      } else {
        // 按订单ID分组
        items?.forEach((item: any) => {
          if (!itemsMap.has(item.order_id)) {
            itemsMap.set(item.order_id, []);
          }
          itemsMap.get(item.order_id).push(item);
        });
      }
    }

    // 组装订单和订单项
    const ordersWithItems = orders?.map((order: any) => ({
      ...order,
      items: itemsMap.get(order.id) || [],
    }));

    return { data: ordersWithItems || [], count: count || 0 };
  } catch (err: any) {
    console.error('获取订单列表失败:', err);
    return { error: err.message || '获取订单列表失败' };
  }
}

// 获取订单详情
export async function getOrderById(id: string): Promise<{ data?: Order; error?: string }> {
  try {
    // 先获取订单
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_no, customer_id, seller_id, total_amount, status, shipping_address, remark, tracking_no, tracking_company, paid_at, shipped_at, completed_at, cancelled_at, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) throw error;

    // 获取订单项
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('id, order_id, product_id, product_name, product_image, product_specs, price, quantity, subtotal')
      .eq('order_id', id);

    if (itemsError) {
      console.warn('获取订单项失败:', itemsError);
    }

    return { data: { ...order, items: items || [] } };
  } catch (err: any) {
    console.error('获取订单详情失败:', err);
    return { error: err.message || '获取订单详情失败' };
  }
}

// 获取订单详情（通过订单号）
export async function getOrderByNo(orderNo: string): Promise<{ data?: Order; error?: string }> {
  try {
    // 先获取订单
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_no, customer_id, seller_id, total_amount, status, shipping_address, remark, tracking_no, tracking_company, paid_at, shipped_at, completed_at, cancelled_at, created_at, updated_at')
      .eq('order_no', orderNo)
      .single();

    if (error) throw error;

    // 获取订单项
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('id, order_id, product_id, product_name, product_image, product_specs, price, quantity, subtotal')
      .eq('order_id', order.id);

    if (itemsError) {
      console.warn('获取订单项失败:', itemsError);
    }

    return { data: { ...order, items: items || [] } };
  } catch (err: any) {
    console.error('获取订单详情失败:', err);
    return { error: err.message || '获取订单详情失败' };
  }
}

// 支付订单
export async function payOrder(
  orderId: string,
  paymentMethod: string = 'online'
): Promise<{ data?: Order; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('status', 'pending_payment')
      .select('id, order_no, customer_id, seller_id, total_amount, status, shipping_address, remark, paid_at, created_at, updated_at')
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error('支付订单失败:', err);
    return { error: err.message || '支付订单失败' };
  }
}

// 发货
export async function shipOrder(
  orderId: string,
  trackingNo: string,
  trackingCompany: string
): Promise<{ data?: Order; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'shipped',
        tracking_no: trackingNo,
        tracking_company: trackingCompany,
        shipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('status', 'paid')
      .select('id, order_no, customer_id, seller_id, total_amount, status, shipping_address, remark, tracking_no, tracking_company, shipped_at, created_at, updated_at')
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error('发货失败:', err);
    return { error: err.message || '发货失败' };
  }
}

// 完成订单
export async function completeOrder(orderId: string): Promise<{ data?: Order; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('status', 'shipped')
      .select('id, order_no, customer_id, seller_id, total_amount, status, shipping_address, remark, completed_at, created_at, updated_at')
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error('完成订单失败:', err);
    return { error: err.message || '完成订单失败' };
  }
}

// 取消订单
export async function cancelOrder(orderId: string, reason?: string): Promise<{ data?: Order; error?: string }> {
  try {
    // 获取订单信息
    const { data: order, error: getError } = await supabase
      .from('orders')
      .select('id, order_no, customer_id, seller_id, total_amount, status, shipping_address, remark, created_at, updated_at')
      .eq('id', orderId)
      .single();

    if (getError) throw getError;

    // 只能取消未支付的订单
    if (order.status !== 'pending_payment') {
      return { error: '只能取消未支付的订单' };
    }

    // 获取订单项
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('id, order_id, product_id, product_name, product_image, product_specs, price, quantity, subtotal')
      .eq('order_id', orderId);

    if (itemsError) {
      console.warn('获取订单项失败:', itemsError);
    }

    // 恢复商品库存
    for (const item of items || []) {
      const { error: stockError } = await supabase.rpc('increase_product_stock', {
        product_id: item.product_id,
        quantity: item.quantity,
      });
      if (stockError) throw stockError;
    }

    // 更新订单状态
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        remark: reason ? `取消原因: ${reason}` : order.remark,
      })
      .eq('id', orderId)
      .select('id, order_no, customer_id, seller_id, total_amount, status, shipping_address, remark, cancelled_at, created_at, updated_at')
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error('取消订单失败:', err);
    return { error: err.message || '取消订单失败' };
  }
}

// 申请退款
export async function requestRefund(
  orderId: string,
  reason: string
): Promise<{ data?: Order; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'refunding',
        remark: `退款申请: ${reason}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .in('status', ['paid', 'shipped'])
      .select('id, order_no, customer_id, seller_id, total_amount, status, shipping_address, remark, created_at, updated_at')
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error('申请退款失败:', err);
    return { error: err.message || '申请退款失败' };
  }
}

// 处理退款
export async function processRefund(
  orderId: string,
  approved: boolean
): Promise<{ data?: Order; error?: string }> {
  try {
    if (approved) {
      // 获取订单信息
      const { data: order, error: getError } = await supabase
        .from('orders')
        .select('id, order_no, customer_id, seller_id, total_amount, status, shipping_address, remark, created_at, updated_at')
        .eq('id', orderId)
        .single();

      if (getError) throw getError;

      // 获取订单项
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('id, order_id, product_id, product_name, product_image, product_specs, price, quantity, subtotal')
        .eq('order_id', orderId);

      if (itemsError) {
        console.warn('获取订单项失败:', itemsError);
      }

      // 恢复商品库存
      for (const item of items || []) {
        const { error: stockError } = await supabase.rpc('increase_product_stock', {
          product_id: item.product_id,
          quantity: item.quantity,
        });
        if (stockError) throw stockError;
      }

      // 更新订单状态为已退款
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('status', 'refunding')
        .select('id, order_no, customer_id, seller_id, total_amount, status, shipping_address, remark, created_at, updated_at')
        .single();

      if (error) throw error;
      return { data };
    } else {
      // 拒绝退款，恢复订单状态
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'shipped',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('status', 'refunding')
        .select('id, order_no, customer_id, seller_id, total_amount, status, shipping_address, remark, created_at, updated_at')
        .single();

      if (error) throw error;
      return { data };
    }
  } catch (err: any) {
    console.error('处理退款失败:', err);
    return { error: err.message || '处理退款失败' };
  }
}

// 获取订单统计
export async function getOrderStatistics(
  userId: string,
  role: 'buyer' | 'seller'
): Promise<{
  data?: {
    total_orders: number;
    pending_payment: number;
    paid: number;
    shipped: number;
    completed: number;
    total_amount: number;
  };
  error?: string;
}> {
  try {
    const column = role === 'buyer' ? 'customer_id' : 'seller_id';

    const { data, error } = await supabase
      .from('orders')
      .select('status, total_amount')
      .eq(column, userId);

    if (error) throw error;

    const stats = {
      total_orders: data?.length || 0,
      pending_payment: data?.filter((o) => o.status === 'pending_payment').length || 0,
      paid: data?.filter((o) => o.status === 'paid').length || 0,
      shipped: data?.filter((o) => o.status === 'shipped').length || 0,
      completed: data?.filter((o) => o.status === 'completed').length || 0,
      total_amount:
        data?.filter((o) => o.status === 'completed').reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
    };

    return { data: stats };
  } catch (err: any) {
    console.error('获取订单统计失败:', err);
    return { error: err.message || '获取订单统计失败' };
  }
}

// 管理员：获取所有订单
export async function adminGetAllOrders(
  options: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data?: Order[]; count?: number; error?: string }> {
  try {
    // 先查询订单列表
    let query = supabaseAdmin.from('orders').select(
      'id, order_no, customer_id, seller_id, total_amount, status, shipping_address, remark, tracking_no, tracking_company, paid_at, shipped_at, completed_at, cancelled_at, created_at, updated_at',
      { count: 'exact' }
    );

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data: orders, error, count } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // 获取所有订单ID
    const orderIds = orders?.map((o: any) => o.id) || [];

    // 如果有订单，批量获取订单项
    let itemsMap = new Map();
    if (orderIds.length > 0) {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select('id, order_id, product_id, product_name, product_image, product_specs, price, quantity, subtotal')
        .in('order_id', orderIds);

      if (itemsError) {
        console.warn('获取订单项失败:', itemsError);
      } else {
        // 按订单ID分组
        items?.forEach((item: any) => {
          if (!itemsMap.has(item.order_id)) {
            itemsMap.set(item.order_id, []);
          }
          itemsMap.get(item.order_id).push(item);
        });
      }
    }

    // 组装订单和订单项
    const ordersWithItems = orders?.map((order: any) => ({
      ...order,
      items: itemsMap.get(order.id) || [],
    }));

    return { data: ordersWithItems || [], count: count || 0 };
  } catch (err: any) {
    console.error('获取所有订单失败:', err);
    return { error: err.message || '获取所有订单失败' };
  }
}

// 管理员：获取销售统计
export async function adminGetSalesStatistics(
  startDate?: string,
  endDate?: string
): Promise<{
  data?: {
    total_sales: number;
    total_orders: number;
    total_products_sold: number;
    average_order_value: number;
    daily_sales: { date: string; amount: number; orders: number }[];
  };
  error?: string;
}> {
  try {
    // 先查询已完成的订单
    let query = supabaseAdmin
      .from('orders')
      .select('id, total_amount, created_at')
      .eq('status', 'completed');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    const totalSales = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
    const totalOrders = orders?.length || 0;
    
    // 获取所有订单ID，然后查询订单项统计商品数量
    const orderIds = orders?.map((o: any) => o.id) || [];
    let totalProductsSold = 0;
    
    if (orderIds.length > 0) {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select('quantity')
        .in('order_id', orderIds);
      
      if (!itemsError && items) {
        totalProductsSold = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      }
    }

    // 按日期分组统计
    const dailyMap = new Map<string, { amount: number; orders: number }>();
    orders?.forEach((order) => {
      const date = order.created_at.split('T')[0];
      const current = dailyMap.get(date) || { amount: 0, orders: 0 };
      dailyMap.set(date, {
        amount: current.amount + (order.total_amount || 0),
        orders: current.orders + 1,
      });
    });

    const dailySales = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        amount: stats.amount,
        orders: stats.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      data: {
        total_sales: totalSales,
        total_orders: totalOrders,
        total_products_sold: totalProductsSold,
        average_order_value: totalOrders > 0 ? totalSales / totalOrders : 0,
        daily_sales: dailySales,
      },
    };
  } catch (err: any) {
    console.error('获取销售统计失败:', err);
    return { error: err.message || '获取销售统计失败' };
  }
}

export default {
  createOrder,
  getOrders,
  getOrderById,
  getOrderByNo,
  payOrder,
  shipOrder,
  completeOrder,
  cancelOrder,
  requestRefund,
  processRefund,
  getOrderStatistics,
  adminGetAllOrders,
  adminGetSalesStatistics,
};
