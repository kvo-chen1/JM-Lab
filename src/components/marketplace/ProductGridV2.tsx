/**
 * 商品网格组件 V2 - 全新设计
 * 支持响应式布局和动画效果
 */
import React from 'react';
import { Product } from '@/services/productService';
import ProductCardV2 from './ProductCardV2';
import { Loader2 } from 'lucide-react';
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
    const baseClasses = 'grid gap-4 md:gap-6';
    
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

  // 加载状态
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-10 h-10 text-[var(--haihe-500)]" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-gray-500 text-sm"
        >
          正在加载商品...
        </motion.p>
      </div>
    );
  }

  // 空状态
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
          <span className="text-4xl">📦</span>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">{emptyMessage}</h3>
        <p className="text-sm text-gray-400 text-center max-w-xs">
          暂时没有符合条件的商品，换个筛选条件试试吧
        </p>
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
