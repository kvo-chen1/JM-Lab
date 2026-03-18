/**
 * 左侧边栏组件 V3 - 垂直 Tab 导航设计
 * 包含分类导航、品牌筛选、商品预览等
 * 参考淘宝、京东等电商平台的导航设计
 */
import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Flame, 
  Sparkles, 
  TrendingUp, 
  Award,
  Store,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VerticalTabs, { TabItemData } from './VerticalTabs';
import {
  CategoryFilter,
  HotProductsPreview,
  FeaturedProductsPreview,
  NewProductsPreview,
  LicensedProductsPreview,
  BrandsPreview,
} from './SidebarPreviewComponents';
import { Product } from '@/services/productService';

interface LeftSidebarProps {
  categories?: Array<{ id: string; name: string; icon?: string }>;
  selectedCategory?: string;
  onCategorySelect?: (categoryId: string) => void;
  brands?: Array<{ id: string; name: string; logo?: string; product_count?: number }>;
  selectedBrand?: string;
  onBrandSelect?: (brandId: string) => void;
  products?: Product[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  categories = [],
  selectedCategory = '',
  onCategorySelect,
  brands = [],
  selectedBrand = '',
  onBrandSelect,
  products = [],
  activeTab: parentActiveTab,
  onTabChange,
}) => {
  // 当前选中的 Tab - 使用父组件传递的或内部状态
  const [internalActiveTab, setInternalActiveTab] = useState('all');
  const activeTab = parentActiveTab !== undefined ? parentActiveTab : internalActiveTab;
  const setActiveTab = onTabChange || setInternalActiveTab;

  // 计算各板块商品数据
  const hotProducts = useMemo(() => {
    if (!products) return [];
    return [...products]
      .sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0))
      .slice(0, 6);
  }, [products]);

  const featuredProducts = useMemo(() => {
    if (!products) return [];
    return products
      .filter((p) => p.original_price || (p.average_rating || 0) >= 4.5)
      .slice(0, 6);
  }, [products]);

  const newProducts = useMemo(() => {
    if (!products) return [];
    return [...products]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [products]);

  const licensedProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => p.is_licensed || false).slice(0, 6);
  }, [products]);

  // Tab 配置
  const tabs: TabItemData[] = useMemo(() => [
    {
      id: 'all',
      label: '全部商品',
      icon: <ShoppingBag className="w-5 h-5" />,
      badge: products.length,
      badgeType: 'default' as const,
    },
    {
      id: 'hot',
      label: '热销推荐',
      icon: <Flame className="w-5 h-5" />,
      badge: '热门',
      badgeType: 'hot' as const,
    },
    {
      id: 'featured',
      label: '精选好物',
      icon: <Sparkles className="w-5 h-5" />,
      badgeType: 'accent' as const,
    },
    {
      id: 'new',
      label: '新品上市',
      icon: <TrendingUp className="w-5 h-5" />,
      badge: 'New',
      badgeType: 'new' as const,
    },
    {
      id: 'licensed',
      label: '授权 IP 产品',
      icon: <Award className="w-5 h-5" />,
    },
    {
      id: 'brands',
      label: '入驻品牌',
      icon: <Store className="w-5 h-5" />,
    },
  ], [products.length]);

  // 渲染侧边栏内容
  const renderSidebarContent = () => {
    switch (activeTab) {
      case 'all':
        return (
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={onCategorySelect}
            brands={brands}
            selectedBrand={selectedBrand}
            onBrandSelect={onBrandSelect}
          />
        );
      case 'hot':
        return <HotProductsPreview products={hotProducts} />;
      case 'featured':
        return <FeaturedProductsPreview products={featuredProducts} />;
      case 'new':
        return <NewProductsPreview products={newProducts} />;
      case 'licensed':
        return <LicensedProductsPreview products={licensedProducts} />;
      case 'brands':
        return (
          <BrandsPreview
            brands={brands}
            onBrandClick={(brandId) => {
              onBrandSelect?.(brandId);
              setActiveTab('all');
            }}
          />
        );
      default:
        return null;
    }
  };

  console.log('[LeftSidebar V3] 组件已加载，使用垂直 Tab 导航');

  return (
    <div className="mp-sidebar-v2">
      {/* 垂直 Tab 导航 */}
      <VerticalTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 动态内容区 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="mp-sidebar-content"
        >
          {renderSidebarContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LeftSidebar;
