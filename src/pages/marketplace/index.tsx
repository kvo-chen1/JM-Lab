/**
 * 文创商城首页 V2 - 全新三栏式布局设计
 * 美观、高级、视觉吸引力强的用户界面
 * 优化：添加数据刷新机制、购物车同步
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Flame, 
  Sparkles, 
  TrendingUp, 
  ChevronRight,
  Package,
  Store,
  ChevronDown,
  Check
} from 'lucide-react';
import LicensedProductSection from '@/components/marketplace/LicensedProductSection';

// 布局组件
import ThreeColumnLayout from '@/components/layout/ThreeColumnLayout';
import LeftSidebar from '@/components/marketplace/LeftSidebar';
import RightSidebar from '@/components/marketplace/RightSidebar';
import HeroBanner from '@/components/marketplace/HeroBanner';

// 商品组件
import ProductGridV2 from '@/components/marketplace/ProductGridV2';
import ProductCardV3 from '@/components/marketplace/ProductCardV3';

// Hooks
import { 
  useMerchantProducts, 
  useProductCategories, 
  useUserFavorites,
  useAddToCart,
  useAddToFavorites,
  useRemoveFromFavorites,
  useCart
} from '@/hooks/useProducts';
import { useBrands } from '@/hooks/useBrands';
import { useAuth } from '@/hooks/useAuth';
import { useCartSync, useFavoritesSync } from '@/hooks/useDataRefresh';

// 类型
import { Product } from '@/services/productService';

// Toast
import { toast } from 'sonner';

const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 状态
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'sales'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // 排序选项
  const sortOptions = [
    { value: 'newest', label: '最新上架' },
    { value: 'price_asc', label: '价格从低到高' },
    { value: 'price_desc', label: '价格从高到低' },
    { value: 'sales', label: '销量优先' },
  ] as const;

  // 数据获取 - 使用商家商品 hook
  const { products, loading: productsLoading, error: productsError } = useMerchantProducts({
    categoryId: selectedCategory || undefined,
    sortBy: sortBy,
    searchQuery: searchQuery || undefined,
  });

  // 调试日志
  console.log('文创商城 - 商家商品数据:', {
    productsCount: products?.length || 0,
    loading: productsLoading,
    error: productsError,
    firstProduct: products?.[0]
  });

  const { categories } = useProductCategories();
  const { brands } = useBrands({ status: 'approved' });
  const { favorites, refetch: refetchFavorites } = useUserFavorites(user?.id || null);
  const { cartItems, cartStats } = useCart(user?.id || null);
  const { addToCart } = useAddToCart();
  const { addToFavorites } = useAddToFavorites();
  const { removeFromFavorites } = useRemoveFromFavorites();

  // 平台统计数据 - 使用实际获取的数据
  const platformStats = useMemo(() => ({
    totalProducts: products?.length || 0,
    totalBrands: brands?.length || 0,
    totalOrders: cartStats?.totalItems || 0,
  }), [products?.length, brands?.length, cartStats?.totalItems]);

  // 收藏的商品ID列表
  const favoriteProductIds = useMemo(() => 
    favorites?.map((f: any) => f.id) || [],
    [favorites]
  );

  // 热销商品（按销量排序）
  const hotProducts = useMemo(() => {
    if (!products) return [];
    return [...products]
      .sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0))
      .slice(0, 8);
  }, [products]);

  // 新品（按创建时间排序）
  const newProducts = useMemo(() => {
    if (!products) return [];
    return [...products]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);
  }, [products]);

  // 精选商品（有折扣或高评分）
  const featuredProducts = useMemo(() => {
    if (!products) return [];
    return products
      .filter((p: Product) => p.original_price || (p.average_rating || 0) >= 4.5)
      .slice(0, 4);
  }, [products]);

  // 推荐商品（随机选择）
  const recommendedProducts = useMemo(() => {
    if (!products) return [];
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 6);
  }, [products]);

  // 数据同步
  const { cartVersion, triggerCartUpdate } = useCartSync(user?.id || null);
  const { favoritesVersion, triggerFavoritesUpdate } = useFavoritesSync(user?.id || null);

  // 监听数据变化，刷新相关数据
  useEffect(() => {
    if (user?.id) {
      console.log('[Marketplace] 购物车数据变化，刷新购物车');
      // 购物车数据已通过 hook 自动刷新
    }
  }, [cartVersion, user?.id]);

  useEffect(() => {
    if (user?.id) {
      console.log('[Marketplace] 收藏数据变化，刷新收藏');
      refetchFavorites();
    }
  }, [favoritesVersion, user?.id, refetchFavorites]);

  // 页面可见性变化时刷新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Marketplace] 页面可见，刷新数据');
        // 触发数据刷新
        if (user?.id) {
          triggerCartUpdate();
          triggerFavoritesUpdate();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, triggerCartUpdate, triggerFavoritesUpdate]);

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
        // 触发购物车更新事件
        triggerCartUpdate();
      } else {
        toast.error('添加失败');
      }
    } catch (error) {
      console.error('[Marketplace] 添加购物车失败:', error);
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
      console.error('[Marketplace] 收藏操作失败:', error);
      toast.error('操作失败，请重试');
    }
  }, [user, navigate, favoriteProductIds, addToFavorites, removeFromFavorites, triggerFavoritesUpdate]);

  const handleSearch = useCallback((query: string) => {
    console.log('[Marketplace] 搜索:', query);
    // 跳转到搜索结果页面
    navigate(`/marketplace/search?q=${encodeURIComponent(query)}`);
  }, [navigate]);

  const handleCategorySelect = useCallback((categoryId: string) => {
    console.log('[Marketplace] 选择分类:', categoryId);
    setSelectedCategory(categoryId);
  }, []);

  const handleRefresh = useCallback(() => {
    console.log('[Marketplace] 手动刷新');
    window.location.reload();
  }, []);

  // 区块标题组件 - 紧凑型
  const SectionHeader: React.FC<{
    title: string;
    icon: React.ReactNode;
    iconBg?: string;
    action?: { label: string; onClick: () => void };
  }> = ({ title, icon, iconBg = 'from-[var(--haihe-500)] to-[var(--haihe-600)]', action }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${iconBg} flex items-center justify-center shadow-md`}>
          {icon}
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-0.5 text-sm text-[var(--text-muted)] hover:text-[var(--haihe-500)] transition-colors"
        >
          {action.label}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  // 左侧栏内容
  const leftSidebarContent = (
    <LeftSidebar
      categories={categories?.map((c: any) => ({ id: c.id, name: c.name, icon: c.icon })) || []}
      selectedCategory={selectedCategory}
      onCategorySelect={handleCategorySelect}
    />
  );

  // 右侧栏内容 - 使用真实的购物车数据
  const rightSidebarContent = (
    <RightSidebar
      cartItems={cartItems?.map(item => ({
        id: item.id,
        product: item.product,
        quantity: item.quantity
      })) || []}
      favoriteProducts={favorites || []}
      recentlyViewed={[]}
      promotions={[
        {
          id: '1',
          title: '新用户专享',
          description: '首次下单立减20元',
          discount: '-¥20',
          endTime: '2026-03-31',
        },
        {
          id: '2',
          title: '满减活动',
          description: '满299减50，满599减120',
          discount: '满减',
        },
      ]}
      recommendedProducts={recommendedProducts}
      platformStats={platformStats}
      onRemoveFromCart={(itemId) => {
        console.log('[Marketplace] 从右侧栏移除购物车商品:', itemId);
        // 这里可以调用移除购物车的API
        triggerCartUpdate();
      }}
    />
  );

  return (
    <ThreeColumnLayout
      leftSidebar={leftSidebarContent}
      rightSidebar={rightSidebarContent}
    >
      <div className="space-y-10">
        {/* Hero Banner */}
        <HeroBanner onSearch={handleSearch} />

        {/* 热销推荐 */}
        {hotProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SectionHeader
              title="热销推荐"
              icon={<Flame className="w-4 h-4 text-white" />}
              iconBg="from-orange-500 to-red-500"
              action={{ label: '查看全部', onClick: () => setSortBy('sales') }}
            />
            <ProductGridV2
              products={hotProducts}
              columns={5}
              onProductClick={handleProductClick}
              onAddToCart={handleAddToCart}
              onToggleFavorite={handleToggleFavorite}
              favoriteProductIds={favoriteProductIds}
            />
          </motion.section>
        )}

        {/* 精选商品 - 使用 ProductCardV3 */}
        {featuredProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SectionHeader
              title="精选好物"
              icon={<Sparkles className="w-4 h-4 text-white" />}
              iconBg="from-purple-500 to-pink-500"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {featuredProducts.map((product, index) => (
                <ProductCardV3
                  key={product.id}
                  product={product}
                  index={index}
                  onAddToCart={handleAddToCart}
                  onToggleFavorite={handleToggleFavorite}
                  onView={handleProductClick}
                  isFavorite={favoriteProductIds.includes(product.id)}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* 新品上市 */}
        {newProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <SectionHeader
              title="新品上市"
              icon={<TrendingUp className="w-4 h-4 text-white" />}
              iconBg="from-green-500 to-teal-500"
              action={{ label: '查看全部', onClick: () => setSortBy('newest') }}
            />
            <ProductGridV2
              products={newProducts}
              columns={5}
              onProductClick={handleProductClick}
              onAddToCart={handleAddToCart}
              onToggleFavorite={handleToggleFavorite}
              favoriteProductIds={favoriteProductIds}
            />
          </motion.section>
        )}

        {/* 授权 IP 产品 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <LicensedProductSection
            title="授权 IP 产品"
            subtitle="正版授权，品质保证，支持原创作者"
            type="hot"
            limit={8}
            showViewAll={true}
          />
        </motion.section>

        {/* 全部商品 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--haihe-500)] to-[var(--haihe-600)] flex items-center justify-center shadow-md">
                <Package className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">全部商品</h2>
            </div>

            {/* 排序选项 - 自定义下拉菜单 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">排序：</span>
              <div className="relative">
                <button
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className="flex items-center gap-2 h-8 px-3 text-sm bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <span className="text-gray-700">
                    {sortOptions.find(opt => opt.value === sortBy)?.label}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {sortDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setSortDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                            setSortDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                            sortBy === option.value ? 'text-sky-600 bg-sky-50/50' : 'text-gray-700'
                          }`}
                        >
                          <span>{option.label}</span>
                          {sortBy === option.value && (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 品牌筛选 */}
          {brands && brands.length > 0 && (
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <button
                onClick={() => setSelectedBrand('')}
                className={`px-4 py-2 text-sm rounded-full transition-all ${
                  selectedBrand === ''
                    ? 'bg-[var(--haihe-500)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)]'
                }`}
              >
                全部品牌
              </button>
              {brands.map((brand: any) => (
                <button
                  key={brand.id}
                  onClick={() => setSelectedBrand(brand.id)}
                  className={`px-4 py-2 text-sm rounded-full transition-all ${
                    selectedBrand === brand.id
                      ? 'bg-[var(--haihe-500)] text-white'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)]'
                  }`}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          )}

          {/* 商品列表 */}
          <ProductGridV2
            products={products || []}
            loading={productsLoading}
            columns={5}
            onProductClick={handleProductClick}
            onAddToCart={handleAddToCart}
            onToggleFavorite={handleToggleFavorite}
            favoriteProductIds={favoriteProductIds}
            emptyMessage="暂无符合条件的商品"
          />
        </motion.section>

        {/* 入驻品牌 */}
        {brands && brands.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="pt-8 border-t border-[var(--border-primary)]"
          >
            <SectionHeader
              title="入驻品牌"
              icon={<Store className="w-4 h-4 text-white" />}
              iconBg="from-amber-500 to-orange-500"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {brands.map((brand: any, index: number) => (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  onClick={() => setSelectedBrand(brand.id)}
                  className="flex flex-col items-center p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] hover:border-[var(--haihe-500)] hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <span className="text-2xl">🏪</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)] text-center">
                    {brand.name}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] mt-1">
                    {brand.product_count || 0} 件商品
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </ThreeColumnLayout>
  );
};

export default MarketplacePage;
