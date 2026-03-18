/**
 * 商品对比栏组件
 * 显示在页面底部，展示已选择的对比商品
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scale, ChevronRight } from 'lucide-react';
import { Product } from '@/services/productService';

interface ComparisonBarProps {
  products: Product[];
  onRemove: (productId: string) => void;
  onClear: () => void;
  onCompare: () => void;
  maxItems?: number;
}

const ComparisonBar: React.FC<ComparisonBarProps> = ({
  products,
  onRemove,
  onClear,
  onCompare,
  maxItems = 4,
}) => {
  if (products.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧：标题和已选商品 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Scale className="w-5 h-5" />
                <span className="font-medium">对比栏</span>
                <span className="text-sm text-gray-500">
                  ({products.length}/{maxItems})
                </span>
              </div>

              {/* 商品缩略图列表 */}
              <div className="flex items-center gap-2 ml-4">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="relative group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                      {product.cover_image || product.images?.[0] ? (
                        <img
                          src={product.cover_image || product.images?.[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          无图
                        </div>
                      )}
                    </div>
                    {/* 删除按钮 */}
                    <button
                      onClick={() => onRemove(product.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}

                {/* 空位提示 */}
                {Array.from({ length: maxItems - products.length }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xs"
                  >
                    +
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex items-center gap-3">
              <button
                onClick={onClear}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                清空
              </button>
              <button
                onClick={onCompare}
                disabled={products.length < 2}
                className="px-6 py-2 bg-[#C02C38] text-white text-sm font-medium rounded-lg hover:bg-[#a82430] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                开始对比
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ComparisonBar;
