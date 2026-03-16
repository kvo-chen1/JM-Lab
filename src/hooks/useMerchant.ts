/**
 * 商家相关自定义 Hooks
 * 提供商家工作台的数据获取和状态管理功能
 */

import { useState, useEffect, useCallback, useContext } from 'react';
import { toast } from 'sonner';
import { merchantService, type Merchant, type Product, type Order, type AfterSalesRequest, type Review, type DashboardStats, type SalesTrend, type ProductRanking, type TrafficSource, type ConversionFunnel, type TodoItem, type Notification } from '@/services/merchantService';
import { AuthContext } from '@/contexts/authContext';

// ==================== useMerchant - 获取当前商家信息 ====================

export function useMerchant() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useContext(AuthContext);

  const fetchMerchant = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await merchantService.getCurrentMerchant();
      setMerchant(data);
    } catch (err) {
      setError(err as Error);
      toast.error('获取商家信息失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMerchant();
  }, [fetchMerchant]);

  const updateMerchant = useCallback(async (updates: Partial<Merchant>) => {
    if (!merchant) return;

    try {
      const updated = await merchantService.updateMerchant(merchant.id, updates);
      setMerchant(updated);
      toast.success('商家信息更新成功');
      return updated;
    } catch (err) {
      toast.error('更新商家信息失败');
      throw err;
    }
  }, [merchant]);

  return { merchant, loading, error, refetch: fetchMerchant, updateMerchant };
}

// ==================== useMerchantProducts - 商品管理 ====================

export function useMerchantProducts(merchantId: string, filters?: { status?: string; category?: string; search?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!merchantId) return;

    try {
      setLoading(true);
      const data = await merchantService.getProducts(merchantId, filters);
      setProducts(data);
    } catch (err) {
      setError(err as Error);
      toast.error('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  }, [merchantId, filters?.status, filters?.category, filters?.search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = useCallback(async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newProduct = await merchantService.createProduct(product);
      setProducts(prev => [newProduct, ...prev]);
      toast.success('商品创建成功');
      return newProduct;
    } catch (err) {
      toast.error('创建商品失败');
      throw err;
    }
  }, []);

  const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
    try {
      const updated = await merchantService.updateProduct(productId, updates);
      setProducts(prev => prev.map(p => p.id === productId ? updated : p));
      toast.success('商品更新成功');
      return updated;
    } catch (err) {
      toast.error('更新商品失败');
      throw err;
    }
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    try {
      await merchantService.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('商品删除成功');
    } catch (err) {
      toast.error('删除商品失败');
      throw err;
    }
  }, []);

  const toggleProductStatus = useCallback(async (productId: string, status: 'active' | 'inactive') => {
    try {
      await merchantService.toggleProductStatus(productId, status);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status } : p));
      toast.success(status === 'active' ? '商品已上架' : '商品已下架');
    } catch (err) {
      toast.error('操作失败');
      throw err;
    }
  }, []);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus
  };
}

// ==================== useMerchantOrders - 订单管理 ====================

export function useMerchantOrders(userId: string, filters?: { status?: string; startDate?: string; endDate?: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      // 使用 userId 查询订单，因为订单表的 seller_id 存储的是 user_id
      const data = await merchantService.getOrdersByUserId(userId, filters);
      setOrders(data);
    } catch (err) {
      setError(err as Error);
      toast.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  }, [userId, filters?.status, filters?.startDate, filters?.endDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const shipOrder = useCallback(async (orderId: string, shippingInfo: { company: string; trackingNumber: string }) => {
    try {
      await merchantService.shipOrder(orderId, shippingInfo);
      setOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { ...o, status: 'shipped' as const, shipping_company: shippingInfo.company, tracking_number: shippingInfo.trackingNumber }
          : o
      ));
      toast.success('订单发货成功');
    } catch (err) {
      toast.error('发货失败');
      throw err;
    }
  }, []);

  return { orders, loading, error, refetch: fetchOrders, shipOrder };
}

// ==================== useMerchantAfterSales - 售后管理 ====================

export function useMerchantAfterSales(merchantId: string, filters?: { status?: string }) {
  const [requests, setRequests] = useState<AfterSalesRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!merchantId) return;

    try {
      setLoading(true);
      const data = await merchantService.getAfterSalesRequests(merchantId, filters);
      setRequests(data);
    } catch (err) {
      setError(err as Error);
      toast.error('获取售后申请失败');
    } finally {
      setLoading(false);
    }
  }, [merchantId, filters?.status]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleRequest = useCallback(async (requestId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      await merchantService.handleAfterSalesRequest(requestId, action, reason);
      setRequests(prev => prev.map(r => 
        r.id === requestId 
          ? { ...r, status: action === 'approve' ? 'approved' as const : 'rejected' as const, rejection_reason: reason }
          : r
      ));
      toast.success(action === 'approve' ? '已同意售后申请' : '已拒绝售后申请');
    } catch (err) {
      toast.error('操作失败');
      throw err;
    }
  }, []);

  return { requests, loading, error, refetch: fetchRequests, handleRequest };
}

// ==================== useMerchantReviews - 评价管理 ====================

export function useMerchantReviews(merchantId: string, filters?: { rating?: number; hasReply?: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!merchantId) return;

    try {
      setLoading(true);
      const data = await merchantService.getReviews(merchantId, filters);
      setReviews(data);
    } catch (err) {
      setError(err as Error);
      toast.error('获取评价列表失败');
    } finally {
      setLoading(false);
    }
  }, [merchantId, filters?.rating, filters?.hasReply]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const replyToReview = useCallback(async (reviewId: string, reply: string) => {
    try {
      await merchantService.replyToReview(reviewId, reply);
      setReviews(prev => prev.map(r => 
        r.id === reviewId 
          ? { ...r, merchant_reply: reply, reply_at: new Date().toISOString() }
          : r
      ));
      toast.success('回复成功');
    } catch (err) {
      toast.error('回复失败');
      throw err;
    }
  }, []);

  return { reviews, loading, error, refetch: fetchReviews, replyToReview };
}

// ==================== useMerchantDashboard - 数据中心 ====================

export function useMerchantDashboard(merchantId: string) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrend[]>([]);
  const [productRanking, setProductRanking] = useState<ProductRanking[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!merchantId) return;

    try {
      setLoading(true);
      const [
        statsData,
        trendData,
        rankingData,
        trafficData,
        funnelData
      ] = await Promise.all([
        merchantService.getDashboardStats(merchantId),
        merchantService.getSalesTrend(merchantId, 7),
        merchantService.getProductRanking(merchantId, 10),
        merchantService.getTrafficSources(merchantId),
        merchantService.getConversionFunnel(merchantId)
      ]);

      setStats(statsData);
      setSalesTrend(trendData);
      setProductRanking(rankingData);
      setTrafficSources(trafficData);
      setConversionFunnel(funnelData);
    } catch (err) {
      setError(err as Error);
      toast.error('获取数据中心数据失败');
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    salesTrend,
    productRanking,
    trafficSources,
    conversionFunnel,
    loading,
    error,
    refetch: fetchDashboardData
  };
}

// ==================== useMerchantTodos - 待办事项 ====================

export function useMerchantTodos(merchantId: string) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTodos = useCallback(async () => {
    if (!merchantId) return;

    try {
      setLoading(true);
      const data = await merchantService.getTodos(merchantId);
      setTodos(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  return { todos, loading, error, refetch: fetchTodos };
}

// ==================== useMerchantNotifications - 消息通知 ====================

export function useMerchantNotifications(merchantId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!merchantId) return;

    try {
      setLoading(true);
      const data = await merchantService.getNotifications(merchantId);
      setNotifications(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await merchantService.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (err) {
      toast.error('标记已读失败');
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return { notifications, unreadCount, loading, error, refetch: fetchNotifications, markAsRead };
}

// ==================== useMerchantStatus - 商家状态检查 ====================

export function useMerchantStatus() {
  const [status, setStatus] = useState<{ isMerchant: boolean; status: 'none' | 'pending' | 'approved' | 'rejected' }>({
    isMerchant: false,
    status: 'none'
  });
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  const checkStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await merchantService.checkMerchantStatus();
      setStatus(result);
    } catch (err) {
      console.error('检查商家状态失败:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return { ...status, loading, refetch: checkStatus };
}

// ==================== useApplyMerchant - 商家申请 ====================

export function useApplyMerchant() {
  const [loading, setLoading] = useState(false);

  const apply = useCallback(async (application: Parameters<typeof merchantService.applyForMerchant>[0]) => {
    try {
      setLoading(true);
      const result = await merchantService.applyForMerchant(application);
      toast.success('商家申请提交成功，请等待审核');
      return result;
    } catch (err) {
      toast.error('申请提交失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { apply, loading };
}
