/**
 * 商品网格组件 V2 - 全新设计
 * 支持响应式布局和动画效果
 * 优化：更现代的加载状态、更好的空状态设计、流畅的进入动画
 */
import React from 'react';
import { Product } from '@/services/productService';
import ProductCardV2 from './ProductCardV2';
import { Loader2, Package, SearchX, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProductGridV2Props {
  products: Product[];
  loading?: boolean;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  favoriteProductIds?: string[];
  columns?: 2 | 3 | 4 | 5;
  emptyMessage?: string;
  className?: string;
}

// 骨架屏卡片组件
const SkeletonCard: React.FC<{ index: number }> = ({ index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
  >
    {/* 图片骨架 */}
    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
    </div>
    {/* 内容骨架 */}
    <div className="p-4 space-y-3">
      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
      <div className="flex items-center justify-between pt-2">
        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  </motion.div>
);

const ProductGridV2: React.FC<ProductGridV2Props> = ({
  products,
  loading = false,
  onProductClick,
  onAddToCart,
  onToggleFavorite,
  favoriteProductIds = [],
  columns = 4,
  emptyMessage = '暂无商品',
  className = '',
}) => {
  // 响应式列数配置
  const getGridClasses = () => {
    const baseClasses = 'grid gap-5 md:gap-6';
    
    switch (columns) {
      case 2:
        return `${baseClasses} grid-cols-2`;
      case 3:
        return `${baseClasses} grid-cols-2 md:grid-cols-3`;
      case 4:
        return `${baseClasses} grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`;
      case 5:
        return `${baseClasses} grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`;
      default:
        return `${baseClasses} grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`;
    }
  };

  // 加载状态 - 骨架屏
  if (loading) {
    return (
      <div className={getGridClasses()}>
        {[...Array(8)].map((_, index) => (
          <SkeletonCard key={index} index={index} />
        ))}
      </div>
    );
  }

  // 空状态
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="mp-empty-state"
      >
        <div className="mp-empty-state-icon">
          <Package className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
        </div>
        <h3 className="mp-empty-state-title">{emptyMessage}</h3>
        <p className="mp-empty-state-desc">
          暂时没有符合条件的商品，换个筛选条件试试吧
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          刷新页面
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className={`${getGridClasses()} ${className}`}>
      {products.map((product, index) => (
        <ProductCardV2
          key={product.id}
          product={product}
          index={index}
          onClick={onProductClick}
          onAddToCart={onAddToCart}
          onToggleFavorite={onToggleFavorite}
          isFavorite={favoriteProductIds.includes(product.id)}
        />
      ))}
    </div>
  );
};

export default ProductGridV2;
