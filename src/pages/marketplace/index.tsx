/**
 * 文创商城首页 V2 - 全新三栏式布局设计
 * 美观、高级、视觉吸引力强的用户界面
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Flame, 
  Sparkles, 
  TrendingUp, 
  ChevronRight,
  Package,
  Store,
  Award
} from 'lucide-react';
import LicensedProductSection from '@/components/marketplace/LicensedProductSection';

// 布局组件
import ThreeColumnLayout from '@/components/layout/ThreeColumnLayout';
import LeftSidebar from '@/components/marketplace/LeftSidebar';
import RightSidebar from '@/components/marketplace/RightSidebar';
import HeroBanner from '@/components/marketplace/HeroBanner';

// 商品组件
import ProductGridV2 from '@/components/marketplace/ProductGridV2';

// Hooks
import { 
  useMerchantProducts, 
  useProductCategories, 
  useUserFavorites,
  useAddToCart,
  useAddToFavorites,
  useRemoveFromFavorites
} from '@/hooks/useProducts';
import { useBrands } from '@/hooks/useBrands';
import { useAuth } from '@/hooks/useAuth';

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
  const { brands } = useBrands();
  const { favorites, refetch: refetchFavorites } = useUserFavorites(user?.id || null);
  const { addToCart } = useAddToCart();
  const { addToFavorites } = useAddToFavorites();
  const { removeFromFavorites } = useRemoveFromFavorites();

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

  // 事件处理
  const handleProductClick = (product: Product) => {
    navigate(`/marketplace/product/${product.id}`);
  };

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    const success = await addToCart(user.id, product.id, 1);
    if (success) {
      toast.success('已添加到购物车');
    } else {
      toast.error('添加失败');
    }
  };

  const handleToggleFavorite = async (product: Product) => {
    if (!user) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
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
      refetchFavorites();
    } else {
      toast.error('操作失败');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // 区块标题组件
  const SectionHeader: React.FC<{
    title: string;
    icon: React.ReactNode;
    iconBg?: string;
    action?: { label: string; onClick: () => void };
  }> = ({ title, icon, iconBg = 'from-[var(--haihe-500)] to-[var(--haihe-600)]', action }) => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--haihe-500)] transition-colors"
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

  // 右侧栏内容
  const rightSidebarContent = (
    <RightSidebar
      cartItems={[]}
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
              icon={<Flame className="w-5 h-5 text-white" />}
              iconBg="from-orange-500 to-red-500"
              action={{ label: '查看全部', onClick: () => setSortBy('sales') }}
            />
            <ProductGridV2
              products={hotProducts}
              columns={4}
              onProductClick={handleProductClick}
              onAddToCart={handleAddToCart}
              onToggleFavorite={handleToggleFavorite}
              favoriteProductIds={favoriteProductIds}
            />
          </motion.section>
        )}

        {/* 精选商品 */}
        {featuredProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SectionHeader
              title="精选好物"
              icon={<Sparkles className="w-5 h-5 text-white" />}
              iconBg="from-purple-500 to-pink-500"
            />
            <ProductGridV2
              products={featuredProducts}
              columns={4}
              onProductClick={handleProductClick}
              onAddToCart={handleAddToCart}
              onToggleFavorite={handleToggleFavorite}
              favoriteProductIds={favoriteProductIds}
            />
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
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              iconBg="from-green-500 to-teal-500"
              action={{ label: '查看全部', onClick: () => setSortBy('newest') }}
            />
            <ProductGridV2
              products={newProducts}
              columns={4}
              onProductClick={handleProductClick}
              onAddToCart={handleAddToCart}
              onToggleFavorite={handleToggleFavorite}
              favoriteProductIds={favoriteProductIds}
            />
          </motion.section>
        )}

        {/* 授权IP产品 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <LicensedProductSection
            title="授权IP产品"
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--haihe-500)] to-[var(--haihe-600)] flex items-center justify-center shadow-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">全部商品</h2>
            </div>

            {/* 排序选项 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">排序：</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="h-9 px-3 text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--haihe-500)]/20 focus:border-[var(--haihe-500)]"
              >
                <option value="newest">最新上架</option>
                <option value="price_asc">价格从低到高</option>
                <option value="price_desc">价格从高到低</option>
                <option value="sales">销量优先</option>
              </select>
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
            columns={4}
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
              icon={<Store className="w-5 h-5 text-white" />}
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
