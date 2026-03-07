/**
 * 商品卡片组件 V2 - 全新设计
 * 采用文创商城主题，更美观、更高级的视觉设计
 */
import React, { useState } from 'react';
import { Product } from '@/services/productService';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
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

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
      className="mp-product-card group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(product)}
    >
      {/* 商品图片区域 */}
      <div className="mp-product-image-wrapper">
        {/* 骨架屏 */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
        )}
        
        {product.cover_image ? (
          <img
            src={product.cover_image}
            alt={product.name}
            className={`mp-product-image transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-gray-400 text-sm">暂无图片</span>
          </div>
        )}

        {/* 折扣标签 */}
        <AnimatePresence>
          {discount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mp-product-discount"
            >
              -{discount}%
            </motion.div>
          )}
        </AnimatePresence>

        {/* 热销/新品标签 */}
        <div className="absolute bottom-3 left-3 flex gap-1">
          {product.is_hot && (
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mp-badge mp-badge-hot"
            >
              热销
            </motion.span>
          )}
          {product.is_new && (
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mp-badge mp-badge-new"
            >
              新品
            </motion.span>
          )}
        </div>

        {/* 收藏按钮 */}
        {showFavorite && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleFavorite}
            className={`mp-product-favorite ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-400 hover:text-red-500'}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </motion.button>
        )}

        {/* 快速操作遮罩 */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-4"
            >
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                className="mp-btn mp-btn-primary mp-btn-sm flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                加入购物车
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 商品信息区域 */}
      <div className="mp-product-info">
        {/* 品牌 */}
        {product.brand && (
          <p className="mp-product-brand">{product.brand.name}</p>
        )}

        {/* 商品名称 */}
        <h3 className="mp-product-name group-hover:text-[var(--haihe-500)]">
          {product.name}
        </h3>

        {/* 评分 */}
        {(product.average_rating ?? 0) > 0 && (
          <div className="mp-product-rating">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.average_rating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-200 text-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">{product.average_rating}</span>
            <span className="text-xs text-gray-400">({product.review_count || 0})</span>
          </div>
        )}

        {/* 价格和销量 */}
        <div className="flex items-center justify-between">
          <div className="mp-product-price">
            <span className="mp-product-price-current">
              ¥{product.price.toLocaleString()}
            </span>
            {product.original_price && (
              <span className="mp-product-price-original">
                ¥{product.original_price.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Eye className="w-3 h-3" />
            <span>{product.sold_count || 0}人付款</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCardV2;
