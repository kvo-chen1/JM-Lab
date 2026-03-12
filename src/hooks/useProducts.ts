/**
 * 商品相关 Hooks
 */
import { useState, useEffect, useCallback } from 'react';
import productService, { Product, ProductCategory, CartItem, ProductReview } from '@/services/productService';

// 获取商品分类列表
export function useProductCategories(parentId?: string) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await productService.getProductCategories(parentId);
        if (result.error) {
          setError(result.error);
        } else {
          setCategories(result.data || []);
        }
      } catch (err: any) {
        setError(err.message || '获取商品分类失败');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [parentId]);

  return { categories, loading, error };
}

// 获取商品列表
export function useProducts(
  options: {
    categoryId?: string;
    brandId?: string;
    status?: string;
    isFeatured?: boolean;
    isHot?: boolean;
    isNew?: boolean;
    minPrice?: number;
    maxPrice?: number;
    searchQuery?: string;
    sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'sales';
    limit?: number;
    offset?: number;
  } = {}
) {
  const [products, setProducts] = useState<Product[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await productService.getProducts(options);
      if (result.error) {
        setError(result.error);
      } else {
        setProducts(result.data || []);
        setCount(result.count || 0);
      }
    } catch (err: any) {
      setError(err.message || '获取商品列表失败');
    } finally {
      setLoading(false);
    }
  }, [
    options.categoryId,
    options.brandId,
    options.status,
    options.isFeatured,
    options.isHot,
    options.isNew,
    options.minPrice,
    options.maxPrice,
    options.searchQuery,
    options.sortBy,
    options.limit,
    options.offset,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, count, loading, error, refetch: fetchProducts };
}

// 获取商家商品列表（用于文创商城）
export function useMerchantProducts(
  options: {
    categoryId?: string;
    merchantId?: string;
    status?: string;
    isFeatured?: boolean;
    isHot?: boolean;
    isNew?: boolean;
    minPrice?: number;
    maxPrice?: number;
    searchQuery?: string;
    sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'sales';
    limit?: number;
    offset?: number;
  } = {}
) {
  const [products, setProducts] = useState<Product[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[useMerchantProducts] 开始获取商品，参数:', options);
      const result = await productService.getMerchantProducts(options);
      console.log('[useMerchantProducts] 获取结果:', result);
      if (result.error) {
        setError(result.error);
      } else {
        setProducts(result.data || []);
        setCount(result.count || 0);
      }
    } catch (err: any) {
      console.error('[useMerchantProducts] 获取失败:', err);
      setError(err.message || '获取商家商品列表失败');
    } finally {
      setLoading(false);
    }
  }, [
    options.categoryId,
    options.merchantId,
    options.status,
    options.isFeatured,
    options.isHot,
    options.isNew,
    options.minPrice,
    options.maxPrice,
    options.searchQuery,
    options.sortBy,
    options.limit,
    options.offset,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, count, loading, error, refetch: fetchProducts };
}

// 获取商品详情
export function useProduct(productId: string | null) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true); // 初始为 true，确保首次渲染时显示加载状态
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await productService.getProductById(productId);
        if (result.error) {
          setError(result.error);
        } else {
          setProduct(result.data || null);
        }
      } catch (err: any) {
        setError(err.message || '获取商品详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, loading, error };
}

// 获取购物车
export function useCart(userId: string | null) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    if (!userId) {
      setCartItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await productService.getCart(userId);
      if (result.error) {
        setError(result.error);
      } else {
        setCartItems(result.data || []);
      }
    } catch (err: any) {
      setError(err.message || '获取购物车失败');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // 计算购物车统计
  const cartStats = {
    totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    selectedItems: cartItems.filter((item) => item.selected).reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: cartItems
      .filter((item) => item.selected && item.product)
      .reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0),
  };

  return { cartItems, cartStats, loading, error, refetch: fetchCart };
}

// 获取商品评价
export function useProductReviews(
  productId: string | null,
  options: {
    limit?: number;
    offset?: number;
    rating?: number;
  } = {}
) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!productId) {
      setReviews([]);
      setCount(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await productService.getProductReviews(productId, options);
      if (result.error) {
        setError(result.error);
      } else {
        setReviews(result.data || []);
        setCount(result.count || 0);
      }
    } catch (err: any) {
      setError(err.message || '获取商品评价失败');
    } finally {
      setLoading(false);
    }
  }, [productId, options.limit, options.offset, options.rating]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, count, loading, error, refetch: fetchReviews };
}

// 获取用户收藏
export function useUserFavorites(userId: string | null) {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await productService.getUserFavorites(userId);
      if (result.error) {
        setError(result.error);
      } else {
        setFavorites(result.data || []);
      }
    } catch (err: any) {
      setError(err.message || '获取用户收藏失败');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return { favorites, loading, error, refetch: fetchFavorites };
}

// 检查商品是否已收藏
export function useIsFavorite(userId: string | null, productId: string | null) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !productId) {
      setIsFavorite(false);
      return;
    }

    const checkFavorite = async () => {
      setLoading(true);
      try {
        const result = await productService.checkIsFavorite(userId, productId);
        setIsFavorite(result.isFavorite);
      } catch (err) {
        console.error('检查收藏状态失败:', err);
        setIsFavorite(false);
      } finally {
        setLoading(false);
      }
    };

    checkFavorite();
  }, [userId, productId]);

  return { isFavorite, loading };
}

// 添加商品到购物车
export function useAddToCart() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToCart = async (
    userId: string,
    productId: string,
    quantity: number = 1,
    specifications?: { name: string; value: string }[]
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await productService.addToCart(userId, productId, quantity, specifications);
      if (result.error) {
        setError(result.error);
        return false;
      }
      return true;
    } catch (err: any) {
      setError(err.message || '添加商品到购物车失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { addToCart, loading, error };
}

// 更新购物车商品
export function useUpdateCartItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCartItem = async (cartItemId: string, updates: Partial<CartItem>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await productService.updateCartItem(cartItemId, updates);
      if (result.error) {
        setError(result.error);
        return false;
      }
      return true;
    } catch (err: any) {
      setError(err.message || '更新购物车商品失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateCartItem, loading, error };
}

// 从购物车移除商品
export function useRemoveFromCart() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeFromCart = async (cartItemId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await productService.removeFromCart(cartItemId);
      if (result.error) {
        setError(result.error);
        return false;
      }
      return true;
    } catch (err: any) {
      setError(err.message || '删除购物车商品失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { removeFromCart, loading, error };
}

// 添加收藏
export function useAddToFavorites() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToFavorites = async (userId: string, productId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await productService.addToFavorites(userId, productId);
      if (result.error) {
        setError(result.error);
        return false;
      }
      return true;
    } catch (err: any) {
      setError(err.message || '添加收藏失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { addToFavorites, loading, error };
}

// 取消收藏
export function useRemoveFromFavorites() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeFromFavorites = async (userId: string, productId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await productService.removeFromFavorites(userId, productId);
      if (result.error) {
        setError(result.error);
        return false;
      }
      return true;
    } catch (err: any) {
      setError(err.message || '取消收藏失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { removeFromFavorites, loading, error };
}

// 创建商品评价
export function useCreateProductReview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReview = async (
    reviewData: Omit<ProductReview, 'id' | 'is_visible' | 'helpful_count' | 'created_at' | 'updated_at'>
  ): Promise<ProductReview | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await productService.createProductReview(reviewData);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data || null;
    } catch (err: any) {
      setError(err.message || '创建商品评价失败');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createReview, loading, error };
}
