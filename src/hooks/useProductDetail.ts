/**
 * 商品详情页数据获取 Hook - 并行加载优化
 */
import { useState, useEffect, useCallback } from 'react';
import productService, { Product, ProductReview } from '@/services/productService';

interface ProductDetailData {
  product: Product | null;
  reviews: ProductReview[];
  reviewCount: number;
  isFavorite: boolean;
}

interface UseProductDetailResult extends ProductDetailData {
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * 并行获取商品详情页所需的所有数据
 * 相比多个独立的 hook，这个 hook 同时发起所有请求，减少总体加载时间
 */
export function useProductDetail(
  productId: string | null,
  userId: string | null
): UseProductDetailResult {
  const [data, setData] = useState<ProductDetailData>({
    product: null,
    reviews: [],
    reviewCount: 0,
    isFavorite: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!productId) {
      setData({
        product: null,
        reviews: [],
        reviewCount: 0,
        isFavorite: false,
      });
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 并行发起所有请求
      const [productResult, reviewsResult, favoriteResult] = await Promise.all([
        // 1. 获取商品详情
        productService.getProductById(productId),
        // 2. 获取商品评价（限制5条）
        productService.getProductReviews(productId, { limit: 5 }),
        // 3. 检查收藏状态（仅在用户登录时）
        userId ? productService.checkIsFavorite(userId, productId) : Promise.resolve({ isFavorite: false }),
      ]);

      // 处理商品详情结果
      if (productResult.error) {
        setError(productResult.error);
        setLoading(false);
        return;
      }

      setData({
        product: productResult.data || null,
        reviews: reviewsResult.data || [],
        reviewCount: reviewsResult.count || 0,
        isFavorite: favoriteResult.isFavorite,
      });
    } catch (err: any) {
      console.error('[useProductDetail] 获取数据失败:', err);
      setError(err.message || '获取商品详情失败');
    } finally {
      setLoading(false);
    }
  }, [productId, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...data,
    loading,
    error,
    refetch: fetchData,
  };
}
