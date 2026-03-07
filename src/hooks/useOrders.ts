/**
 * 订单相关 Hooks
 */
import { useState, useEffect, useCallback } from 'react';
import orderService, { Order, ShippingAddress, CreateOrderParams } from '@/services/orderService';

// 获取订单列表
export function useOrders(
  options: {
    buyer_id?: string;
    seller_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderService.getOrders(options);
      if (result.error) {
        setError(result.error);
      } else {
        setOrders(result.data || []);
        setCount(result.count || 0);
      }
    } catch (err: any) {
      setError(err.message || '获取订单列表失败');
    } finally {
      setLoading(false);
    }
  }, [options.buyer_id, options.seller_id, options.status, options.limit, options.offset]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, count, loading, error, refetch: fetchOrders };
}

// 获取订单详情
export function useOrder(orderId: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setOrder(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await orderService.getOrderById(orderId);
      if (result.error) {
        setError(result.error);
      } else {
        setOrder(result.data || null);
      }
    } catch (err: any) {
      setError(err.message || '获取订单详情失败');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, error, refetch: fetchOrder };
}

// 获取订单详情（通过订单号）
export function useOrderByNo(orderNo: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNo) {
      setOrder(null);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await orderService.getOrderByNo(orderNo);
        if (result.error) {
          setError(result.error);
        } else {
          setOrder(result.data || null);
        }
      } catch (err: any) {
        setError(err.message || '获取订单详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNo]);

  return { order, loading, error };
}

// 获取订单统计
export function useOrderStatistics(userId: string | null, role: 'buyer' | 'seller') {
  const [statistics, setStatistics] = useState<{
    total_orders: number;
    pending_payment: number;
    paid: number;
    shipped: number;
    completed: number;
    total_amount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    if (!userId) {
      setStatistics(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await orderService.getOrderStatistics(userId, role);
      if (result.error) {
        setError(result.error);
      } else {
        setStatistics(result.data || null);
      }
    } catch (err: any) {
      setError(err.message || '获取订单统计失败');
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return { statistics, loading, error, refetch: fetchStatistics };
}

// 创建订单
export function useCreateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (params: CreateOrderParams): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderService.createOrder(params);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data || null;
    } catch (err: any) {
      setError(err.message || '创建订单失败');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createOrder, loading, error };
}

// 支付订单
export function usePayOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payOrder = async (orderId: string, paymentMethod: string = 'online'): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderService.payOrder(orderId, paymentMethod);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data || null;
    } catch (err: any) {
      setError(err.message || '支付订单失败');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { payOrder, loading, error };
}

// 发货
export function useShipOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipOrder = async (orderId: string, trackingNo: string, trackingCompany: string): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderService.shipOrder(orderId, trackingNo, trackingCompany);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data || null;
    } catch (err: any) {
      setError(err.message || '发货失败');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { shipOrder, loading, error };
}

// 完成订单
export function useCompleteOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeOrder = async (orderId: string): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderService.completeOrder(orderId);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data || null;
    } catch (err: any) {
      setError(err.message || '完成订单失败');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { completeOrder, loading, error };
}

// 取消订单
export function useCancelOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelOrder = async (orderId: string, reason?: string): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderService.cancelOrder(orderId, reason);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data || null;
    } catch (err: any) {
      setError(err.message || '取消订单失败');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { cancelOrder, loading, error };
}

// 申请退款
export function useRequestRefund() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestRefund = async (orderId: string, reason: string): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderService.requestRefund(orderId, reason);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data || null;
    } catch (err: any) {
      setError(err.message || '申请退款失败');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { requestRefund, loading, error };
}

// 处理退款
export function useProcessRefund() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processRefund = async (orderId: string, approved: boolean): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderService.processRefund(orderId, approved);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data || null;
    } catch (err: any) {
      setError(err.message || '处理退款失败');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { processRefund, loading, error };
}
