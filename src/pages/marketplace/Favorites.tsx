/**
 * 我的收藏页面
 * 展示用户收藏的商品，支持批量管理和添加到购物车
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// 组件
import { Button } from '@/components/ui/Button';
import ProductCardV4 from '@/components/marketplace/ProductCardV4';

// Hooks
import { useUserFavorites, useAddToCart, useRemoveFromFavorites } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { useCartSync, useFavoritesSync } from '@/hooks/useDataRefresh';

// 类型
import { Product } from '@/services/productService';

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 状态
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());

  // 数据获取
  const { favorites, loading, error, refetch } = useUserFavorites(user?.id || null);
  const { addToCart } = useAddToCart();
  const { removeFromFavorites } = useRemoveFromFavorites();
  const { triggerCartUpdate } = useCartSync(user?.id || null);
  const { triggerFavoritesUpdate } = useFavoritesSync(user?.id || null);

  // 检查是否登录
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">请先登录</h2>
          <p className="text-gray-500 mb-6">登录后查看您的收藏商品</p>
          <Button onClick={() => navigate('/login')}>
            去登录
          </Button>
        </div>
      </div>
    );
  }

  // 切换选中状态
  const toggleSelection = useCallback((productId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    if (selectedItems.size === (favorites?.length || 0)) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(favorites?.map((f: any) => f.id) || []));
    }
  }, [favorites, selectedItems.size]);

  // 添加到购物车
  const handleAddToCart = useCallback(async (product: Product) => {
    setAddingToCart(prev => new Set(prev).add(product.id));
    try {
      const success = await addToCart(user.id, product.id, 1);
      if (success) {
        toast.success(`"${product.name}" 已添加到购物车`);
        triggerCartUpdate();
      } else {
        toast.error('添加失败');
      }
    } catch (error) {
      console.error('添加购物车失败:', error);
      toast.error('添加失败，请重试');
    } finally {
      setAddingToCart(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  }, [user?.id, addToCart, triggerCartUpdate]);

  // 批量添加到购物车
  const handleBatchAddToCart = useCallback(async () => {
    if (selectedItems.size === 0) {
      toast.error('请先选择商品');
      return;
    }

    const selectedProducts = favorites?.filter((f: any) => selectedItems.has(f.id)) || [];
    let successCount = 0;
    let failCount = 0;

    for (const product of selectedProducts) {
      try {
        const success = await addToCart(user.id, product.id, 1);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`成功添加 ${successCount} 件商品到购物车`);
      triggerCartUpdate();
    }
    if (failCount > 0) {
      toast.error(`${failCount} 件商品添加失败`);
    }

    setSelectedItems(new Set());
    setIsBatchMode(false);
  }, [selectedItems, favorites, user?.id, addToCart, triggerCartUpdate]);

  // 取消收藏
  const handleRemoveFavorite = useCallback(async (productId: string) => {
    try {
      const success = await removeFromFavorites(user.id, productId);
      if (success) {
        toast.success('已取消收藏');
        triggerFavoritesUpdate();
        // 如果该商品在选中列表中，移除它
        setSelectedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      } else {
        toast.error('操作失败');
      }
    } catch (error) {
      console.error('取消收藏失败:', error);
      toast.error('操作失败，请重试');
    }
  }, [user?.id, removeFromFavorites, triggerFavoritesUpdate]);

  // 批量取消收藏
  const handleBatchRemove = useCallback(async () => {
    if (selectedItems.size === 0) {
      toast.error('请先选择商品');
      return;
    }

    if (!confirm(`确定要取消收藏选中的 ${selectedItems.size} 件商品吗？`)) {
      return;
    }

    let successCount = 0;
    for (const productId of selectedItems) {
      try {
        const success = await removeFromFavorites(user.id, productId);
        if (success) successCount++;
      } catch (error) {
        console.error('取消收藏失败:', error);
      }
    }

    if (successCount > 0) {
      toast.success(`已取消收藏 ${successCount} 件商品`);
      triggerFavoritesUpdate();
    }

    setSelectedItems(new Set());
    setIsBatchMode(false);
  }, [selectedItems, user?.id, removeFromFavorites, triggerFavoritesUpdate]);

  // 计算统计数据
  const stats = useMemo(() => ({
    total: favorites?.length || 0,
    selected: selectedItems.size,
  }), [favorites?.length, selectedItems.size]);

  return (
    <div className="min-h-screen bg-gray-50 marketplace-theme">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                type="button"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">我的收藏</h1>
                <p className="text-sm text-gray-500">{stats.total} 件商品</p>
              </div>
            </div>

            {stats.total > 0 && (
              <button
                onClick={() => {
                  setIsBatchMode(!isBatchMode);
                  if (isBatchMode) {
                    setSelectedItems(new Set());
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isBatchMode
                    ? 'bg-sky-100 text-sky-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                type="button"
              >
                {isBatchMode ? '完成' : '批量管理'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
            <span className="ml-3 text-gray-500">加载中...</span>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
            <p className="text-gray-500 mb-2">获取用户收藏失败</p>
            <p className="text-xs text-gray-400 mb-6 max-w-md mx-auto">
              可能是数据库连接问题，请稍后重试或联系客服
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={refetch} variant="outline">
                重试
              </Button>
              <Button onClick={() => navigate('/marketplace')}>
                去商城逛逛
              </Button>
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && stats.total === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无收藏商品</h3>
            <p className="text-gray-500 mb-6">看到喜欢的商品，点击收藏按钮即可添加到这里</p>
            <Button onClick={() => navigate('/marketplace')}>
              去逛逛
            </Button>
          </div>
        )}

        {/* 商品列表 */}
        {!loading && !error && stats.total > 0 && (
          <>
            {/* 批量操作栏 */}
            {isBatchMode && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-20 z-20 bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                      type="button"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedItems.size === stats.total
                          ? 'bg-sky-500 border-sky-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedItems.size === stats.total && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      全选 ({stats.selected}/{stats.total})
                    </button>
                  </div>

                  {stats.selected > 0 && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleBatchAddToCart}
                        className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors"
                        type="button"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        加入购物车
                      </button>
                      <button
                        onClick={handleBatchRemove}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                        type="button"
                      >
                        <Trash2 className="w-4 h-4" />
                        取消收藏
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 商品网格 */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites?.map((product: Product, index: number) => (
                <ProductCardV4
                  key={product.id}
                  product={product}
                  index={index}
                  onAddToCart={handleAddToCart}
                  onToggleFavorite={handleRemoveFavorite}
                  onView={(p) => navigate(`/marketplace/product/${p.id}`)}
                  isFavorite={true}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
