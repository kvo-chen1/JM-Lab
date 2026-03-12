/**
 * 搜索结果页面
 * 展示商品搜索结果，支持筛选和排序
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  ArrowLeft,
  Filter,
  X,
  SlidersHorizontal,
  ChevronDown,
  Grid3X3,
  List
} from 'lucide-react';
import { toast } from 'sonner';

// 组件
import ProductGridV2 from '@/components/marketplace/ProductGridV2';
import { Button } from '@/components/ui/Button';

// Hooks
import { useMerchantProducts, useAddToCart, useUserFavorites, useAddToFavorites, useRemoveFromFavorites } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { useCartSync, useFavoritesSync } from '@/hooks/useDataRefresh';

// 类型
import { Product } from '@/services/productService';

// 排序选项
const sortOptions = [
  { value: 'relevance', label: '相关度' },
  { value: 'newest', label: '最新上架' },
  { value: 'price_asc', label: '价格从低到高' },
  { value: 'price_desc', label: '价格从高到低' },
  { value: 'sales', label: '销量优先' },
] as const;

// 价格区间选项
const priceRanges = [
  { label: '全部', min: undefined, max: undefined },
  { label: '¥0-50', min: 0, max: 50 },
  { label: '¥50-100', min: 50, max: 100 },
  { label: '¥100-200', min: 100, max: 200 },
  { label: '¥200-500', min: 200, max: 500 },
  { label: '¥500+', min: 500, max: undefined },
];

const SearchResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  // 从URL获取搜索参数
  const query = searchParams.get('q') || '';
  const initialSort = (searchParams.get('sort') as typeof sortOptions[number]['value']) || 'relevance';
  const initialMinPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined;
  const initialMaxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined;

  // 状态
  const [searchQuery, setSearchQuery] = useState(query);
  const [sortBy, setSortBy] = useState<typeof sortOptions[number]['value']>(initialSort);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({
    min: initialMinPrice,
    max: initialMaxPrice,
  });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // 数据获取
  const { products, loading, error, refetch } = useMerchantProducts({
    searchQuery: query,
    sortBy: sortBy === 'relevance' ? 'newest' : sortBy,
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
  });

  const { favorites, refetch: refetchFavorites } = useUserFavorites(user?.id || null);
  const { addToCart } = useAddToCart();
  const { addToFavorites } = useAddToFavorites();
  const { removeFromFavorites } = useRemoveFromFavorites();
  const { triggerCartUpdate } = useCartSync(user?.id || null);
  const { triggerFavoritesUpdate } = useFavoritesSync(user?.id || null);

  // 收藏的商品ID列表
  const favoriteProductIds = useMemo(() =>
    favorites?.map((f: any) => f.id) || [],
    [favorites]
  );

  // 加载搜索历史
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // 保存搜索历史
  const saveSearchHistory = useCallback((term: string) => {
    if (!term.trim()) return;
    const newHistory = [term, ...searchHistory.filter(h => h !== term)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  }, [searchHistory]);

  // 处理搜索
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('请输入搜索关键词');
      return;
    }
    
    saveSearchHistory(searchQuery);
    
    // 更新URL参数
    const params = new URLSearchParams(searchParams);
    params.set('q', searchQuery);
    setSearchParams(params);
  }, [searchQuery, searchParams, setSearchParams, saveSearchHistory]);

  // 处理排序变化
  const handleSortChange = useCallback((value: typeof sortOptions[number]['value']) => {
    setSortBy(value);
    const params = new URLSearchParams(searchParams);
    params.set('sort', value);
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  // 处理价格区间变化
  const handlePriceRangeChange = useCallback((range: typeof priceRanges[number]) => {
    setPriceRange({ min: range.min, max: range.max });
    const params = new URLSearchParams(searchParams);
    if (range.min !== undefined) {
      params.set('minPrice', range.min.toString());
    } else {
      params.delete('minPrice');
    }
    if (range.max !== undefined) {
      params.set('maxPrice', range.max.toString());
    } else {
      params.delete('maxPrice');
    }
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  // 清除筛选
  const clearFilters = useCallback(() => {
    setPriceRange({});
    const params = new URLSearchParams(searchParams);
    params.delete('minPrice');
    params.delete('maxPrice');
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  // 事件处理
  const handleProductClick = useCallback((product: Product) => {
    navigate(`/marketplace/product/${product.id}`);
  }, [navigate]);

  const handleAddToCart = useCallback(async (product: Product) => {
    if (!user) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    try {
      const success = await addToCart(user.id, product.id, 1);
      if (success) {
        toast.success('已添加到购物车');
        triggerCartUpdate();
      } else {
        toast.error('添加失败');
      }
    } catch (error) {
      console.error('添加购物车失败:', error);
      toast.error('添加失败，请重试');
    }
  }, [user, navigate, addToCart, triggerCartUpdate]);

  const handleToggleFavorite = useCallback(async (product: Product) => {
    if (!user) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    try {
      const isFavorite = favoriteProductIds.includes(product.id);
      let success;
      if (isFavorite) {
        success = await removeFromFavorites(user.id, product.id);
        if (success) toast.success('已取消收藏');
      } else {
        success = await addToFavorites(user.id, product.id);
        if (success) toast.success('已添加到收藏');
      }
      if (success) {
        triggerFavoritesUpdate();
      } else {
        toast.error('操作失败');
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      toast.error('操作失败，请重试');
    }
  }, [user, navigate, favoriteProductIds, addToFavorites, removeFromFavorites, triggerFavoritesUpdate]);

  // 搜索结果统计
  const resultStats = useMemo(() => ({
    total: products?.length || 0,
    loading,
    hasFilters: priceRange.min !== undefined || priceRange.max !== undefined,
  }), [products?.length, loading, priceRange]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部搜索栏 */}
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索文创商品..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 搜索结果标题 */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {query ? `"${query}" 的搜索结果` : '全部商品'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            共找到 {resultStats.total} 件商品
            {resultStats.hasFilters && '（已应用筛选）'}
          </p>
        </div>

        {/* 筛选和排序栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters || resultStats.hasFilters
                  ? 'bg-sky-50 border-sky-200 text-sky-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              type="button"
            >
              <Filter className="w-4 h-4" />
              筛选
              {resultStats.hasFilters && (
                <span className="w-2 h-2 bg-sky-500 rounded-full" />
              )}
            </button>

            {resultStats.hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
                type="button"
              >
                清除筛选
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* 排序下拉 */}
            <div className="relative group">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                type="button"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {sortOptions.find(o => o.value === sortBy)?.label}
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                      sortBy === option.value ? 'text-sky-600 bg-sky-50' : 'text-gray-700'
                    }`}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 视图切换 */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid' ? 'bg-sky-50 text-sky-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                type="button"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list' ? 'bg-sky-50 text-sky-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                type="button"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 筛选面板 */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-white rounded-xl border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">价格区间</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-gray-100 rounded"
                type="button"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {priceRanges.map((range) => (
                <button
                  key={range.label}
                  onClick={() => handlePriceRangeChange(range)}
                  className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                    priceRange.min === range.min && priceRange.max === range.max
                      ? 'bg-sky-500 text-white border-sky-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-sky-300'
                  }`}
                  type="button"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 搜索历史 */}
        {!query && searchHistory.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">搜索历史</h3>
              <button
                onClick={() => {
                  setSearchHistory([]);
                  localStorage.removeItem('searchHistory');
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
                type="button"
              >
                清除历史
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchQuery(term);
                    const params = new URLSearchParams();
                    params.set('q', term);
                    setSearchParams(params);
                  }}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-full text-gray-700 hover:border-sky-300 hover:text-sky-600 transition-colors"
                  type="button"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 商品列表 */}
        <ProductGridV2
          products={products || []}
          loading={loading}
          columns={viewMode === 'grid' ? 5 : 2}
          onProductClick={handleProductClick}
          onAddToCart={handleAddToCart}
          onToggleFavorite={handleToggleFavorite}
          favoriteProductIds={favoriteProductIds}
          emptyMessage={query ? `未找到与 "${query}" 相关的商品` : '暂无商品'}
        />

        {/* 错误提示 */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">加载失败: {error}</p>
            <Button onClick={refetch} variant="outline">
              重试
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
