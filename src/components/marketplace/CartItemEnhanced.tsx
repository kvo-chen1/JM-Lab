import React from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, Eye, Tag, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';

interface CartProduct {
  id: string;
  name: string;
  coverImage: string;
  price: number;
  originalPrice?: number;
  brand?: string;
  spec?: string;
}

interface CartItemEnhancedProps {
  item: {
    id: string;
    product: CartProduct;
    quantity: number;
    selected: boolean;
    isValid?: boolean;
    stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  };
  index?: number;
  onSelect?: (selected: boolean) => void;
  onQuantityChange?: (quantity: number) => void;
  onRemove?: () => void;
  onView?: () => void;
}

const CartItemEnhanced: React.FC<CartItemEnhancedProps> = ({
  item,
  index = 0,
  onSelect,
  onQuantityChange,
  onRemove,
  onView
}) => {
  const { product, quantity, selected, isValid = true, stockStatus = 'in_stock' } = item;
  const subtotal = product.price * quantity;
  const discount = product.originalPrice ? product.originalPrice - product.price : 0;
  const discountPercent = product.originalPrice
    ? Math.round((discount / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all ${
        !selected ? 'opacity-60' : ''
      } ${!isValid ? 'opacity-50 bg-gray-50' : ''}`}
    >
      <div className="flex gap-4">
        <div className="flex items-center pt-2">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelect?.(checked as boolean)}
          />
        </div>

        <div className="flex-shrink-0">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="w-28 h-28 rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
            onClick={onView}
          >
            {product.coverImage ? (
              <img
                src={product.coverImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <span className="text-xs text-gray-400">暂无图片</span>
              </div>
            )}
          </motion.div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-gray-900 line-clamp-2 cursor-pointer hover:text-[#C02C38] transition-colors"
                onClick={onView}
              >
                {product.name}
              </h3>
              
              {product.brand && (
                <p className="text-sm text-gray-500 mt-1">{product.brand}</p>
              )}

              {product.spec && (
                <div className="flex items-center gap-2 mt-2">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">{product.spec}</span>
                </div>
              )}

              {discountPercent > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded">
                    省 ¥{discount.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400 line-through">
                    ¥{product.originalPrice?.toLocaleString()}
                  </span>
                </div>
              )}

              {/* 库存状态 */}
              <div className="flex items-center gap-2 mt-2">
                {stockStatus === 'in_stock' && (
                  <span className="text-xs text-green-600">✓ 有货</span>
                )}
                {stockStatus === 'low_stock' && (
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <AlertTriangle className="w-3 h-3" />
                    <span>库存紧张</span>
                  </div>
                )}
                {stockStatus === 'out_of_stock' && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertTriangle className="w-3 h-3" />
                    <span>缺货</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={onRemove}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="删除商品"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">数量</span>
              <div className="flex items-center bg-gray-50 rounded-lg">
                <button
                  onClick={() => onQuantityChange?.(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-[#C02C38] hover:bg-white rounded-l-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold text-gray-900">
                  {quantity}
                </span>
                <button
                  onClick={() => onQuantityChange?.(quantity + 1)}
                  className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-[#C02C38] hover:bg-white rounded-r-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#C02C38]">
                  ¥{subtotal.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                单件 ¥{product.price.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={onView}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#C02C38] transition-colors"
            >
              <Eye className="w-4 h-4" />
              查看商品
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CartItemEnhanced;
