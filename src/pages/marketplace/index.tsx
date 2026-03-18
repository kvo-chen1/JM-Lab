/**
 * 文创商城首页 V2 - 全新三栏式布局设计
 * 美观、高级、视觉吸引力强的用户界面
 * 优化：添加数据刷新机制、购物车同步
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Sparkles, 
  TrendingUp, 
  Package,
  Store,
  ChevronDown,
  Check,
  Award
} from 'lucide-react';
import LicensedProductSection from '@/components/marketplace/LicensedProductSection';

// 布局组件
import ThreeColumnLayout from '@/components/layout/ThreeColumnLayout';
import LeftSidebar from '@/components/marketplace/LeftSidebar';
import RightSidebar from '@/components/marketplace/RightSidebar';

// 商品组件
import ProductCardV4 from '@/components/marketplace/ProductCardV4';
import SectionHeaderV2 from '@/components/marketplace/SectionHeaderV2';

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
import { useProductComparison } from '@/hooks/useProductComparison';

// 类型
import { Product } from '@/services/productService';

// Toast
import { toast } from 'sonner';

// 对比组件
import ComparisonBar from '@/components/marketplace/ComparisonBar';
import ProductComparison from '@/components/marketplace/ProductComparison';

const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 状态
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'sales'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showComparison, setShowComparison] = useState(false);

  // 商品对比功能
  const {
    compareList,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    canAddMore,
  } = useProductComparison();

  // 处理加入/取消对比
  const handleToggleCompare = useCallback((product: Product) => {
    if (isInCompare(product.id)) {
      removeFromCompare(product.id);
      toast.success('已从对比栏移除');
    } else if (canAddMore) {
      addToCompare(product);
      toast.success('已加入对比栏');
    } else {
      toast.error('对比栏已满（最多4个商品）');
    }
  }, [isInCompare, canAddMore, addToCompare, removeFromCompare]);

  // 数据获取
  const { products, loading: productsLoading, error: productsError } = useMerchantProducts({
    // status: 'on_sale', // 暂时注释掉，测试是否有数据
    categoryId: selectedCategory || undefined,
    brandId: selectedBrand || undefined,
    sortBy,
    searchQuery: searchQuery || undefined,
  });

  // 调试信息
  useEffect(() => {
    console.log('[Marketplace] 商品数据:', products);
    console.log('[Marketplace] 加载状态:', productsLoading);
    console.log('[Marketplace] 错误信息:', productsError);
    // 详细输出每个商品的图片信息
    if (products && products.length > 0) {
      products.forEach((p, i) => {
        console.log(`[Marketplace] 商品 ${i + 1}:`, {
          name: p.name,
          cover_image: p.cover_image,
          images: p.images,
          hasCoverImage: !!p.cover_image,
          hasImages: !!(p.images && p.images.length > 0)
        });
      });
    }
  }, [products, productsLoading, productsError]);

  const { data: categories } = useProductCategories();
  const { data: brands } = useBrands({ status: 'approved' });
  const { data: favorites } = useUserFavorites();
  const { cartItems } = useCart(user?.id || null);

  // 数据刷新
  useCartSync();
  useFavoritesSync();

  // 收藏商品ID列表
  const favoriteProductIds = useMemo(() => {
    return favorites?.map((f: any) => f.product_id) || [];
  }, [favorites]);

  // 计算各板块商品数据
  const hotProducts = useMemo(() => {
    if (!products) return [];
    return [...products]
      .sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0))
      .slice(0, 10);
  }, [products]);

  const featuredProducts = useMemo(() => {
    if (!products) return [];
    return products
      .filter((p) => p.original_price || (p.average_rating || 0) >= 4.5)
      .slice(0, 10);
  }, [products]);

  const newProducts = useMemo(() => {
    if (!products) return [];
    return [...products]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [products]);

  // 事件处理
  const handleProductClick = useCallback((product: Product) => {
    navigate(`/marketplace/product/${product.id}`);
  }, [navigate]);

  const handleAddToCart = useCallback((product: Product) => {
    toast.success(`已将 "${product.name}" 添加到购物车`);
  }, []);

  const handleToggleFavorite = useCallback((product: Product) => {
    const isFavorite = favoriteProductIds.includes(product.id);
    if (isFavorite) {
      toast.success(`已取消收藏 "${product.name}"`);
    } else {
      toast.success(`已收藏 "${product.name}"`);
    }
  }, [favoriteProductIds]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    navigate(`/marketplace/search?q=${encodeURIComponent(query)}`);
  }, [navigate]);

  const sortOptions = [
    { value: 'newest', label: '最新上架' },
    { value: 'price_asc', label: '价格从低到高' },
    { value: 'price_desc', label: '价格从高到低' },
    { value: 'sales', label: '销量优先' },
  ];

  // 左侧栏内容
  const leftSidebarContent = (
    <LeftSidebar
      categories={categories?.map((c: any) => ({ id: c.id, name: c.name, icon: c.icon })) || []}
      selectedCategory={selectedCategory}
      onCategorySelect={(categoryId) => {
        setSelectedCategory(categoryId);
        setActiveTab('all');
      }}
      brands={brands}
      selectedBrand={selectedBrand}
      onBrandSelect={(brandId) => {
        setSelectedBrand(brandId);
        setActiveTab('all');
      }}
      products={products || []}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );

  // 右侧栏内容
  const rightSidebarContent = (
    <RightSidebar
      cartItems={cartItems?.map((item: any) => ({
        id: item.id,
        product: {
          id: item.product_id,
          name: item.product?.name || '未知商品',
          price: item.product?.price || 0,
          cover_image: item.product?.cover_image || (item.product?.images?.[0]),
          images: item.product?.images,
        },
        quantity: item.quantity,
      })) || []}
      favoriteProducts={favorites?.map((f: any) => ({
        id: f.product?.id,
        name: f.product?.name,
        price: f.product?.price,
        cover_image: f.product?.cover_image || (f.product?.images?.[0]),
        images: f.product?.images,
      })) || []}
      onCartClick={() => navigate('/marketplace/cart')}
      onFavoritesClick={() => navigate('/favorites')}
      onOrdersClick={() => navigate('/marketplace/orders')}
      onHomeClick={() => navigate('/marketplace')}
      onProductClick={(id) => navigate(`/marketplace/product/${id}`)}
    />
  );

  // 渲染全部商品区块
  const renderAllProducts = () => (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mp-content-section"
    >
      <SectionHeaderV2
        title="全部商品"
        icon={<Package className="w-6 h-6 text-white" />}
        subtitle="浏览全部商品，发现更多精彩"
        count={products?.length || 0}
        gradient="blue"
        showViewAll={false}
      />

      {/* 排序选项 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-[var(--text-muted)]">排序：</span>
          <div className="relative">
            <button
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="flex items-center gap-2 h-9 px-4 text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg hover:border-[var(--haihe-500)] hover:bg-[var(--bg-hover)] transition-all"
            >
              <span className="text-[var(--text-primary)]">
                {sortOptions.find(opt => opt.value === sortBy)?.label}
              </span>
              <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {sortDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setSortDropdownOpen(false)}
                />
                <div className="absolute left-0 top-full mt-2 w-40 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl shadow-xl z-50 py-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value as any);
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-[var(--bg-hover)] transition-colors ${
                        sortBy === option.value ? 'text-[var(--haihe-500)] bg-[var(--haihe-50)]' : 'text-[var(--text-primary)]'
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
        <span className="text-sm text-[var(--text-muted)]">
          共 <span className="font-semibold text-[var(--text-primary)]">{products?.length || 0}</span> 件商品
        </span>
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

      {/* 加载状态 */}
      {productsLoading && (
        <div className="text-center py-20">
          <div className="w-12 h-12 mx-auto border-4 border-[var(--haihe-200)] border-t-[var(--haihe-500)] rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-[var(--text-muted)]">加载中...</p>
        </div>
      )}

      {/* 错误状态 */}
      {productsError && (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-lg font-medium text-red-500 mb-2">加载失败</p>
          <p className="text-sm text-[var(--text-muted)]">{productsError}</p>
        </div>
      )}

      {/* 商品网格 */}
      {!productsLoading && !productsError && products && products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <ProductCardV4
              key={product.id}
              product={product}
              index={index}
              onAddToCart={handleAddToCart}
              onToggleFavorite={handleToggleFavorite}
              onView={handleProductClick}
              isFavorite={favoriteProductIds.includes(product.id)}
              isInCompare={isInCompare(product.id)}
              onToggleCompare={handleToggleCompare}
              canAddToCompare={canAddMore || isInCompare(product.id)}
            />
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!productsLoading && !productsError && (!products || products.length === 0) && (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-[var(--text-muted)]" />
          </div>
          <p className="text-lg font-medium text-[var(--text-primary)] mb-2">暂无商品</p>
          <p className="text-sm text-[var(--text-muted)]">去看看其他板块吧</p>
        </div>
      )}
    </motion.section>
  );

  // 根据 activeTab 渲染主内容
  const renderMainContent = () => {
    switch (activeTab) {
      case 'hot':
        return (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mp-content-section"
          >
            <SectionHeaderV2
              title="热销推荐"
              icon={<Flame className="w-6 h-6 text-white" />}
              subtitle="精选最受欢迎的人气好物"
              count={hotProducts.length}
              gradient="orange"
              onViewAll={() => setActiveTab('all')}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {hotProducts.map((product, index) => (
                <ProductCardV4
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
        );

      case 'featured':
        return (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mp-content-section"
          >
            <SectionHeaderV2
              title="精选好物"
              icon={<Sparkles className="w-6 h-6 text-white" />}
              subtitle="高评分、有折扣的品质好物"
              count={featuredProducts.length}
              gradient="purple"
              onViewAll={() => setActiveTab('all')}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <ProductCardV4
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
        );

      case 'new':
        return (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mp-content-section"
          >
            <SectionHeaderV2
              title="新品上市"
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              subtitle="最新上架的潮流新品"
              count={newProducts.length}
              gradient="green"
              onViewAll={() => setActiveTab('all')}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {newProducts.map((product, index) => (
                <ProductCardV4
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
        );

      case 'licensed':
        return (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mp-content-section"
          >
            <SectionHeaderV2
              title="授权 IP 产品"
              icon={<Award className="w-6 h-6 text-white" />}
              subtitle="正版授权，品质保证，支持原创作者"
              gradient="gold"
              showViewAll={false}
            />
            <LicensedProductSection
              title=""
              subtitle=""
              type="hot"
              limit={8}
              showViewAll={false}
            />
          </motion.section>
        );

      case 'brands':
        return (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mp-content-section"
          >
            <SectionHeaderV2
              title="入驻品牌"
              icon={<Store className="w-6 h-6 text-white" />}
              subtitle="品质保证，放心选择"
              count={brands?.length || 0}
              gradient="blue"
              showViewAll={false}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {brands?.map((brand: any, index: number) => (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  onClick={() => {
                    setSelectedBrand(brand.id);
                    setActiveTab('all');
                  }}
                  className="flex flex-col items-center p-5 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] hover:border-[var(--haihe-500)] hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    {brand.logo ? (
                      <img src={brand.logo} alt={brand.name} className="w-12 h-12 object-contain" />
                    ) : (
                      <span className="text-3xl">🏪</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)] text-center mb-1">{brand.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">{brand.product_count || 0} 件商品</span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        );

      case 'all':
      default:
        return renderAllProducts();
    }
  };

  return (
    <>
      <ThreeColumnLayout
        leftSidebar={leftSidebarContent}
        rightSidebar={rightSidebarContent}
      >
        <div className="space-y-10">
          {/* 动态主内容区 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {renderMainContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </ThreeColumnLayout>

      {/* 对比栏 */}
      <ComparisonBar
        products={compareList}
        onRemove={removeFromCompare}
        onClear={clearCompare}
        onCompare={() => setShowComparison(true)}
      />

      {/* 对比弹窗 */}
      {showComparison && (
        <ProductComparison
          products={compareList}
          onClose={() => setShowComparison(false)}
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
        />
      )}
    </>
  );
};

export default MarketplacePage;
