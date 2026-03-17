/**
 * 增强的购物车 Hooks - 基于 cartService 优化
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import cartService, { EnhancedCartItem, CartStats, CouponValidationResult } from '@/services/cartService';
import { toast } from 'sonner';

// 购物车数据同步 Hook
export function useCartEnhanced(userId: string | null) {
  const [cartItems, setCartItems] = useState<EnhancedCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const cartUpdateHandlerRef = useRef<(() => void) | null>(null);

  // 获取购物车数据
  const fetchCart = useCallback(async () => {
    if (!userId) {
      setCartItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const items = await cartService.getCart(userId);
      setCartItems(items);
    } catch (err: any) {
      setError(err.message || '获取购物车失败');
      console.error('[useCartEnhanced] 获取购物车失败:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 监听购物车更新事件
  useEffect(() => {
    if (!userId) return;

    // 创建事件处理函数
    cartUpdateHandlerRef.current = () => {
      fetchCart();
    };

    // 添加事件监听
    window.addEventListener('cart-updated', cartUpdateHandlerRef.current);

    // 初始获取购物车
    fetchCart();

    // 清理
    return () => {
      if (cartUpdateHandlerRef.current) {
        window.removeEventListener('cart-updated', cartUpdateHandlerRef.current);
      }
    };
  }, [userId, fetchCart]);

  // 监听页面可见性变化
  useEffect(() => {
    if (!userId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCart();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, fetchCart]);

  // 计算购物车统计 - 使用 useMemo 确保正确计算
  const cartStats = useMemo(() => 
    cartService.calculateCartStats(
      cartItems,
      appliedCoupon?.isValid ? appliedCoupon.discount : 0
    ),
    [cartItems, appliedCoupon]
  );

  // 添加商品到购物车
  const addToCart = useCallback(async (
    productId: string,
    quantity: number = 1,
    specifications?: any[]
  ) => {
    if (!userId) {
      toast.error('请先登录');
      return false;
    }

    const result = await cartService.addToCart(userId, productId, quantity, specifications);
    if (result.success) {
      toast.success('已添加到购物车');
      await fetchCart();
      return true;
    } else {
      toast.error(result.error || '添加失败');
      return false;
    }
  }, [userId, fetchCart]);

  // 更新购物车商品
  const updateCartItem = useCallback(async (
    cartItemId: string,
    updates: Partial<EnhancedCartItem>
  ) => {
    if (!userId) return false;

    const result = await cartService.updateCartItem(cartItemId, userId, updates);
    if (result.success) {
      await fetchCart();
      return true;
    } else {
      toast.error(result.error || '更新失败');
      return false;
    }
  }, [userId, fetchCart]);

  // 删除购物车商品
  const removeFromCart = useCallback(async (cartItemId: string) => {
    if (!userId) return false;

    const result = await cartService.removeFromCart(cartItemId, userId);
    if (result.success) {
      toast.success('已删除');
      await fetchCart();
      return true;
    } else {
      toast.error(result.error || '删除失败');
      return false;
    }
  }, [userId, fetchCart]);

  // 批量选择商品
  const batchSelectItems = useCallback(async (
    cartItemIds: string[],
    selected: boolean
  ) => {
    if (!userId) return false;

    const result = await cartService.batchSelectItems(userId, cartItemIds, selected);
    if (result.success) {
      await fetchCart();
      return true;
    } else {
      toast.error(result.error || '操作失败');
      return false;
    }
  }, [userId, fetchCart]);

  // 批量删除商品
  const batchRemoveItems = useCallback(async (cartItemIds: string[]) => {
    if (!userId) return false;

    const result = await cartService.batchRemoveItems(userId, cartItemIds);
    if (result.success) {
      toast.success('已删除选中商品');
      await fetchCart();
      return true;
    } else {
      toast.error(result.error || '删除失败');
      return false;
    }
  }, [userId, fetchCart]);

  // 全选/取消全选
  const selectAllItems = useCallback(async (selectAll: boolean) => {
    if (!userId) return false;

    const result = await cartService.selectAllItems(userId, selectAll);
    if (result.success) {
      await fetchCart();
      return true;
    } else {
      toast.error(result.error || '操作失败');
      return false;
    }
  }, [userId, fetchCart]);

  // 验证优惠券
  const validateCoupon = useCallback(async (code: string) => {
    if (!userId) return false;

    // 重新计算当前的购物车统计
    const currentCartStats = cartService.calculateCartStats(
      cartItems,
      0 // 当前不应用任何优惠券
    );

    const result = await cartService.validateCoupon(
      code,
      userId,
      currentCartStats.totalPrice,
      cartItems.filter(item => item.selected).map(item => item.product_id)
    );

    if (result.isValid) {
      setAppliedCoupon(result);
      setCouponCode(code);
      toast.success(`优惠券已应用，立减¥${result.discount}`);
      return true;
    } else {
      toast.error(result.error || '优惠券无效');
      return false;
    }
  }, [userId, cartItems]);

  // 移除优惠券
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('已移除优惠券');
  }, []);

  // 清空购物车
  const clearCart = useCallback(async () => {
    if (!userId) return false;

    const result = await cartService.clearCart(userId);
    if (result.success) {
      toast.success('购物车已清空');
      await fetchCart();
      return true;
    } else {
      toast.error(result.error || '清空失败');
      return false;
    }
  }, [userId, fetchCart]);

  // 移入收藏
  const moveToFavorites = useCallback(async (cartItemId: string) => {
    if (!userId) return false;

    const result = await cartService.moveToFavorites(cartItemId, userId);
    if (result.success) {
      toast.success('已移到收藏');
      await fetchCart();
      return true;
    } else {
      toast.error(result.error || '操作失败');
      return false;
    }
  }, [userId, fetchCart]);

  return {
    // 数据
    cartItems,
    cartStats,
    loading,
    error,
    
    // 优惠券
    couponCode,
    appliedCoupon,
    
    // 方法
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    batchSelectItems,
    batchRemoveItems,
    selectAllItems,
    validateCoupon,
    removeCoupon,
    clearCart,
    moveToFavorites,
  };
}

// 购物车批量操作 Hook
export function useCartBatchActions(userId: string | null) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  // 切换选择状态
  const toggleSelection = useCallback((cartItemId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(cartItemId)) {
        return prev.filter(id => id !== cartItemId);
      } else {
        return [...prev, cartItemId];
      }
    });
  }, []);

  // 清空选择
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setIsSelecting(false);
  }, []);

  // 全选
  const selectAll = useCallback((allIds: string[]) => {
    setSelectedIds([...allIds]);
    setIsSelecting(true);
  }, []);

  // 取消全选
  const deselectAll = useCallback(() => {
    setSelectedIds([]);
    setIsSelecting(false);
  }, []);

  return {
    selectedIds,
    isSelecting,
    toggleSelection,
    clearSelection,
    selectAll,
    deselectAll,
  };
}

// 购物车优惠券 Hook
export function useCartCoupon(userId: string | null, cartTotal: number) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  // 验证优惠券
  const validateCoupon = useCallback(async (code: string) => {
    if (!userId) {
      toast.error('请先登录');
      return false;
    }

    setValidating(true);
    try {
      const cartService = (await import('@/services/cartService')).default;
      const result = await cartService.validateCoupon(code, userId, cartTotal);

      if (result.isValid) {
        setAppliedCoupon(result);
        setCouponCode(code);
        toast.success(`优惠券已应用，立减¥${result.discount}`);
        return true;
      } else {
        toast.error(result.error || '优惠券无效');
        return false;
      }
    } catch (err: any) {
      toast.error('优惠券验证失败');
      console.error('[useCartCoupon] 验证失败:', err);
      return false;
    } finally {
      setValidating(false);
    }
  }, [userId, cartTotal]);

  // 移除优惠券
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('已移除优惠券');
  }, []);

  return {
    couponCode,
    appliedCoupon,
    validating,
    validateCoupon,
    removeCoupon,
  };
}

export default useCartEnhanced;
