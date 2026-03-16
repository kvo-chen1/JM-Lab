import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Eye, Star, Video, Rotate3D } from 'lucide-react';
import { Product } from '@/services/productService';
import { Button } from '@/components/ui/Button';

interface ProductCardV3Props {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  onView?: (product: Product) => void;
  onViewVideo?: (product: Product) => void;
  onView360?: (product: Product) => void;
  isFavorite?: boolean;
  index?: number;
}

const ProductCardV3: React.FC<ProductCardV3Props> = ({
  product,
  onAddToCart,
  onToggleFavorite,
  onView,
  onViewVideo,
  onView360,
  isFavorite = false,
  index = 0
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const hasVideo = false;
  const has360View = product.images && product.images.length > 1;

  const originalPrice = product.original_price || product.price * 1.2;
  const discountPercent = product.original_price 
    ? Math.round((1 - product.price / product.original_price) * 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
        <motion.div
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full"
        >
          {product.cover_image ? (
            <>
              <img
                src={product.cover_image}
                alt={product.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-[#C02C38] rounded-full animate-spin" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400">暂无图片</span>
            </div>
          )}
        </motion.div>

        {discountPercent > 0 && (
          <div className="absolute top-3 left-3 bg-[#C02C38] text-white px-2 py-1 rounded-lg text-xs font-bold">
            -{discountPercent}%
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {hasVideo && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onViewVideo?.(product);
              }}
              className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center text-white transition-colors"
            >
              <Video className="w-4 h-4" />
            </motion.button>
          )}
          {has360View && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onView360?.(product);
              }}
              className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center text-white transition-colors"
            >
              <Rotate3D className="w-4 h-4" />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(product);
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isFavorite
                ? 'bg-red-500 text-white'
                : 'bg-black/50 hover:bg-black/70 text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-3 left-3 right-3 flex gap-2"
        >
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(product);
            }}
            className="flex-1 bg-[#C02C38] hover:bg-[#991b1b] text-sm py-2"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            加入购物车
          </Button>
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onView?.(product);
            }}
            className="px-3 py-2 bg-white/90 hover:bg-white"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>

      <div
        className="p-4 cursor-pointer"
        onClick={() => onView?.(product)}
      >
        {product.brand && (
          <p className="text-xs text-gray-500 mb-1">{product.brand.name}</p>
        )}
        
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-[#C02C38] transition-colors">
          {product.name}
        </h3>

        {product.average_rating && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm text-gray-600">{Number(product.average_rating).toFixed(1)}</span>
            {product.review_count && (
              <span className="text-sm text-gray-400">({product.review_count})</span>
            )}
          </div>
        )}

        {product.sold_count && product.sold_count > 0 && (
          <p className="text-xs text-gray-400 mb-2">已售 {product.sold_count.toLocaleString()} 件</p>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-[#C02C38]">
            ¥{product.price.toLocaleString()}
          </span>
          {discountPercent > 0 && (
            <span className="text-sm text-gray-400 line-through">
              ¥{originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCardV3;
