/**
 * 商品卡片组件 V4 - 高级设计版本
 * 包含悬停蒙版、标签系统、完整动效
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Heart, 
  Star,
  ChevronRight,
  Package,
  Scale
} from 'lucide-react';
import { Product } from '@/services/productService';
import { toast } from 'sonner';

interface ProductCardV4Props {
  product: Product;
  index?: number;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  onView?: (product: Product) => void;
  isFavorite?: boolean;
  isInCompare?: boolean;
  onToggleCompare?: (product: Product) => void;
  canAddToCompare?: boolean;
}

const ProductCardV4: React.FC<ProductCardV4Props> = ({
  product,
  index = 0,
  onAddToCart,
  onToggleFavorite,
  onView,
  isFavorite = false,
  isInCompare = false,
  onToggleCompare,
  canAddToCompare = true,
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const {
    id,
    name,
    cover_image,
    images,
    price,
    original_price,
    brand_name,
    average_rating,
    rating_count,
    sold_count,
    is_new,
    is_hot,
    discount,
  } = product;

  // 处理 images 字段（可能是数组或 JSON 字符串）
  const parseImages = (images: any): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed : [images];
      } catch {
        return [images];
      }
    }
    return [];
  };

  const parsedImages = parseImages(images);
  
  // 获取图片URL：优先使用 cover_image，否则使用 images 数组的第一张
  const imageUrl = cover_image || (parsedImages.length > 0 ? parsedImages[0] : null);



  // 计算折扣百分比
  const discountPercent = original_price && price
    ? Math.round((1 - price / original_price) * 100)
    : 0;

  // 判断是否热销（销量超过 100 或标记为热销）
  const isHotProduct = is_hot || (sold_count && sold_count > 100);

  // 判断是否新品（标记为新品或上架 7 天内）
  const isNewProduct = is_new || false;

  const handleClick = () => {
    if (onView) {
      onView(product);
    } else {
      navigate(`/marketplace/product/${id}`);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      toast.success('已添加到购物车');
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(product);
    }
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleCompare) {
      onToggleCompare(product);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="mp-product-card-v4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* 图片区域 */}
      <div className="mp-product-image-wrapper">
        {/* 商品图片 */}
        <div className="mp-product-image-container">
          {!imageLoaded && !imageError && (
            <div className="mp-product-image-skeleton">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
          )}
          {imageError ? (
            <div className="mp-product-image-error">
              <Package className="w-16 h-16 text-gray-400" />
              <span className="text-xs text-gray-400 mt-2">暂无图片</span>
            </div>
          ) : (
            <img
              src={imageUrl || '/images/placeholder-image.jpg'}
              alt={name || '商品图片'}
              className={`mp-product-image ${imageLoaded ? 'loaded' : ''}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
              loading="lazy"
            />
          )}
        </div>

        {/* 商品标签 */}
        <div className="mp-product-tags">
          {isNewProduct && (
            <span className="mp-product-tag new">新品</span>
          )}
          {isHotProduct && (
            <span className="mp-product-tag hot">热销</span>
          )}
          {discountPercent > 0 && (
            <span className="mp-product-tag discount">-{discountPercent}%</span>
          )}
        </div>

        {/* 悬停操作按钮 */}
        <motion.div
          className="mp-product-actions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          transition={{ duration: 0.2 }}
        >
          <button
            className={`mp-action-btn ${isFavorite ? 'active' : ''}`}
            onClick={handleToggleFavorite}
            aria-label={isFavorite ? '取消收藏' : '收藏'}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            className={`mp-action-btn ${isInCompare ? 'active' : ''}`}
            onClick={handleToggleCompare}
            disabled={!isInCompare && !canAddToCompare}
            aria-label={isInCompare ? '取消对比' : '加入对比'}
            title={!isInCompare && !canAddToCompare ? '对比栏已满' : ''}
          >
            <Scale className={`w-5 h-5 ${isInCompare ? 'text-sky-500' : ''}`} />
          </button>
          <button
            className="mp-action-btn"
            onClick={handleAddToCart}
            aria-label="加入购物车"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </motion.div>
      </div>

      {/* 商品信息 */}
      <div className="mp-product-info">
        {/* 品牌 */}
        {brand_name && (
          <p className="mp-product-brand">{brand_name}</p>
        )}

        {/* 商品名称 */}
        <h3 className="mp-product-name">{name || '未知商品'}</h3>

        {/* 评分 */}
        {average_rating !== undefined && average_rating > 0 && (
          <div className="mp-product-rating">
            <div className="mp-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(average_rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            {rating_count !== undefined && rating_count > 0 && (
              <span className="mp-product-rating-count">({rating_count})</span>
            )}
          </div>
        )}

        {/* 价格 */}
        <div className="mp-product-price-row">
          <span className="mp-product-price">
            ¥{((price) || 0).toLocaleString()}
          </span>
          {original_price && original_price > price && (
            <span className="mp-product-original-price">
              ¥{((original_price) || 0).toLocaleString()}
            </span>
          )}
        </div>

        {/* 销量提示 */}
        {sold_count !== undefined && sold_count > 0 && (
          <p className="mp-product-sold">
            已售 {sold_count} 件
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCardV4;
