/**
 * 商品网格组件 V2 - 紧凑型设计
 * 支持响应式布局和高密度展示
 * 优化：更紧凑的网格、更多商品展示、流畅的进入动画
 */
import React from 'react';
import { Product } from '@/services/productService';
import ProductCardV2 from './ProductCardV2';
import { Package } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProductGridV2Props {
  products: Product[];
  loading?: boolean;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  favoriteProductIds?: string[];
  columns?: 2 | 3 | 4 | 5 | 6;
  emptyMessage?: string;
  className?: string;
}

// 骨架屏卡片组件 - 紧凑型
const SkeletonCard: React.FC<{ index: number }> = ({ index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.03 }}
    className="rounded-xl overflow-hidden"
  >
    {/* 图片骨架 */}
    <div className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
    {/* 内容骨架 */}
    <div className="mt-2 space-y-1.5">
      <div className="h-3.5 w-full bg-gray-100 rounded animate-pulse" />
      <div className="flex items-center justify-between">
        <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
        <div className="h-3 w-10 bg-gray-100 rounded animate-pulse" />
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
  columns = 5,
  emptyMessage = '暂无商品',
  className = '',
}) => {
  // 响应式列数配置 - 高密度展示
  const getGridClasses = () => {
    const baseClasses = 'grid gap-3 md:gap-4';
    
    switch (columns) {
      case 2:
        return `${baseClasses} grid-cols-2`;
      case 3:
        return `${baseClasses} grid-cols-2 md:grid-cols-3`;
      case 4:
        return `${baseClasses} grid-cols-2 sm:grid-cols-3 md:grid-cols-4`;
      case 5:
        return `${baseClasses} grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`;
      case 6:
        return `${baseClasses} grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`;
      default:
        return `${baseClasses} grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`;
    }
  };

  // 加载状态 - 骨架屏
  if (loading) {
    return (
      <div className={getGridClasses()}>
        {[...Array(10)].map((_, index) => (
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
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Package className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{emptyMessage}</h3>
        <p className="text-sm text-gray-500 mb-4">
          暂时没有符合条件的商品，换个筛选条件试试吧
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors"
        >
          刷新页面
        </button>
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
