/**
 * 商品卡片组件 V2 - 紧凑型设计
 * 采用文创商城主题，更小的尺寸，更高的信息密度
 * 优化：紧凑型UI、精简信息、适合高密度展示
 */
import React, { useState } from 'react';
import { Product } from '@/services/productService';
import { Heart, Star, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductCardV2Props {
  product: Product;
  onClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
  showFavorite?: boolean;
  index?: number;
}

const ProductCardV2: React.FC<ProductCardV2Props> = ({
  product,
  onClick,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  showFavorite = true,
  index = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 优先使用 cover_image，如果没有则使用 images 数组的第一张
  const displayImage = product?.cover_image || product?.images?.[0] || '';

  const discount = product?.original_price && product?.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[ProductCardV2] 添加到购物车:', product.id);
    try {
      await onAddToCart?.(product);
    } catch (error) {
      console.error('[ProductCardV2] 添加购物车失败:', error);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[ProductCardV2] 切换收藏:', product.id);
    try {
      await onToggleFavorite?.(product);
    } catch (error) {
      console.error('[ProductCardV2] 切换收藏失败:', error);
    }
  };

  const handleCardClick = () => {
    console.log('[ProductCardV2] 点击商品卡片:', product.id);
    onClick?.(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: [0.4, 0, 0.2, 1] }}
      className="group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* 商品图片区域 - 紧凑型 */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2">
        {/* 骨架屏 */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
        )}
        
        {displayImage && !imageError ? (
          <img
            src={displayImage}
            alt={product?.name || '商品'}
            className={`w-full h-full object-cover transition-all duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } group-hover:scale-105`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100">
            <span className="text-xs">暂无图片</span>
          </div>
        )}

        {/* 折扣标签 - 小型 */}
        <AnimatePresence>
          {discount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded"
            >
              -{discount}%
            </motion.div>
          )}
        </AnimatePresence>

        {/* 热销/新品标签 - 小型 */}
        <div className="absolute bottom-2 left-2 flex gap-1">
          {product?.is_hot && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-medium rounded">
              热销
            </span>
          )}
          {product?.is_new && (
            <span className="px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-medium rounded">
              新品
            </span>
          )}
        </div>

        {/* 悬停操作按钮 */}
        <div className={`absolute top-2 right-2 flex flex-col gap-1 transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          {showFavorite && (
            <button
              onClick={handleToggleFavorite}
              className={`w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors ${
                isFavorite ? 'text-red-500' : 'text-gray-500'
              }`}
              type="button"
              aria-label={isFavorite ? '取消收藏' : '添加收藏'}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* 快速加购按钮 */}
        <motion.button
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
          onClick={handleAddToCart}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg hover:bg-sky-600 transition-colors"
          type="button"
          aria-label="添加到购物车"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>

      {/* 商品信息区域 - 紧凑型 */}
      <div className="px-0.5">
        {/* 商品名称 - 单行 */}
        <h3 className="text-sm font-medium text-gray-900 truncate leading-tight mb-1 group-hover:text-sky-600 transition-colors">
          {product?.name || '未知商品'}
        </h3>

        {/* 价格和销量 - 紧凑 */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-sky-600">
              ¥{((product?.price) || 0).toLocaleString()}
            </span>
            {product?.original_price && (
              <span className="text-xs text-gray-400 line-through">
                ¥{((product?.original_price) || 0).toLocaleString()}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {product?.sold_count || 0}人付款
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCardV2;
