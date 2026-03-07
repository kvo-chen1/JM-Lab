/**
 * 商品卡片组件 - 展示单个商品
 */
import React from 'react';
import { Product } from '@/services/productService';
import { Heart, ShoppingCart, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
  showFavorite?: boolean;
  layout?: 'vertical' | 'horizontal';
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  showFavorite = true,
  layout = 'vertical',
}) => {
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

  if (layout === 'horizontal') {
    return (
      <div
        onClick={() => onClick?.(product)}
        className="flex gap-4 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      >
        {/* 商品图片 */}
        <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          {product.cover_image ? (
            <img
              src={product.cover_image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400">暂无图片</span>
            </div>
          )}
        </div>

        {/* 商品信息 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 line-clamp-2">{product.name}</h3>
          
          {/* 品牌 */}
          {product.brand && (
            <p className="text-sm text-gray-500 mt-1">{product.brand.name}</p>
          )}

          {/* 评分 */}
          {(product.average_rating ?? 0) > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-gray-600">{product.average_rating}</span>
              <span className="text-sm text-gray-400">({product.review_count}条评价)</span>
            </div>
          )}

          {/* 价格和操作 */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-[#C02C38]">
                ¥{product.price.toLocaleString()}
              </span>
              {product.original_price && (
                <span className="text-sm text-gray-400 line-through">
                  ¥{product.original_price.toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {showFavorite && (
                <button
                  onClick={handleToggleFavorite}
                  className={`p-2 rounded-full transition-colors ${
                    isFavorite ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              )}
              <button
                onClick={handleAddToCart}
                className="p-2 rounded-full bg-[#C02C38] text-white hover:bg-[#991b1b] transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick?.(product)}
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      {/* 商品图片 */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.cover_image ? (
          <img
            src={product.cover_image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400">暂无图片</span>
          </div>
        )}

        {/* 折扣标签 */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-[#C02C38] text-white text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </div>
        )}

        {/* 收藏按钮 */}
        {showFavorite && (
          <button
            onClick={handleToggleFavorite}
            className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
              isFavorite
                ? 'bg-red-500 text-white'
                : 'bg-white/80 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* 标签 */}
        {(product.is_hot || product.is_new) && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {product.is_hot && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded">热销</span>
            )}
            {product.is_new && (
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">新品</span>
            )}
          </div>
        )}

        {/* 快速加入购物车 */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#C02C38] hover:text-white"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>

      {/* 商品信息 */}
      <div className="p-4">
        {/* 品牌 */}
        {product.brand && (
          <p className="text-xs text-gray-500 mb-1">{product.brand.name}</p>
        )}

        {/* 商品名称 */}
        <h3 className="font-medium text-gray-800 line-clamp-2 mb-2 group-hover:text-[#C02C38] transition-colors">
          {product.name}
        </h3>

        {/* 评分 */}
        {(product.average_rating ?? 0) > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-600">{product.average_rating}</span>
            <span className="text-xs text-gray-400">({product.review_count})</span>
          </div>
        )}

        {/* 价格和销量 */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-[#C02C38]">
              ¥{product.price.toLocaleString()}
            </span>
            {product.original_price && (
              <span className="text-sm text-gray-400 line-through">
                ¥{product.original_price.toLocaleString()}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">{product.sold_count}人付款</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
