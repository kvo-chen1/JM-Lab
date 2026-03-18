import React, { useState } from 'react';
import { Product } from '@/services/productService';
import { X, Check, ShoppingCart, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface ProductComparisonProps {
  products: Product[];
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
  onProductClick?: (product: Product) => void;
}

const ProductComparison: React.FC<ProductComparisonProps> = ({
  products,
  onClose,
  onAddToCart,
  onProductClick
}) => {
  const [comparisonProducts, setComparisonProducts] = useState<Product[]>(products.slice(0, 4));

  const removeProduct = (productId: string) => {
    setComparisonProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await onAddToCart?.(product);
      toast.success('已添加到购物车');
    } catch (error) {
      toast.error('添加失败');
    }
  };

  const getBestValue = (index: number, type: 'price' | 'rating' | 'sales') => {
    if (comparisonProducts.length < 2) return false;
    
    const values = comparisonProducts.map(p => {
      if (type === 'price') return p.price;
      if (type === 'rating') return p.rating || 0;
      return p.sales_count || 0;
    });

    const bestValue = type === 'price' 
      ? Math.min(...values) 
      : Math.max(...values);

    return values[index] === bestValue;
  };

  const comparisonFeatures = [
    { key: 'price', label: '价格', format: (v: number) => `¥${v.toLocaleString()}` },
    { key: 'rating', label: '评分', format: (v: number) => `${v?.toFixed(1) || '暂无'} ★` },
    { key: 'sales_count', label: '销量', format: (v: number) => `${v?.toLocaleString() || 0} 件` },
    { key: 'brand', label: '品牌', format: (v: any) => v?.name || '暂无品牌' },
  ];

  if (comparisonProducts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">没有商品可对比</h2>
          <p className="text-gray-600 mb-6">请至少选择一个商品进行对比</p>
          <Button onClick={onClose} className="bg-[#C02C38] hover:bg-[#991b1b]">
            关闭
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">商品对比</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-x-auto p-6">
          <div className="min-w-[800px]">
            <div className="grid gap-4" style={{ gridTemplateColumns: `150px repeat(${comparisonProducts.length}, 1fr)` }}>
              <div className="text-sm font-semibold text-gray-500 pt-20">商品</div>
              {comparisonProducts.map((product, index) => (
                <div key={product.id} className="relative">
                  <button
                    onClick={() => removeProduct(product.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-50 rounded-xl p-4 cursor-pointer"
                    onClick={() => onProductClick?.(product)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-white mb-3">
                      {(() => {
                        const imageUrl = product.cover_image || (product.images?.[0]);
                        return imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-contain p-4"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <span className="text-xs text-gray-400">暂无图片</span>
                          </div>
                        );
                      })()}
                    </div>
                    
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center gap-1 mb-3">
                      <span className="text-[#C02C38] font-bold text-lg">
                        ¥{product.price.toLocaleString()}
                      </span>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      className="w-full bg-[#C02C38] hover:bg-[#991b1b] text-sm"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      加入购物车
                    </Button>
                  </motion.div>
                </div>
              ))}

              {comparisonFeatures.map((feature) => (
                <React.Fragment key={feature.key}>
                  <div className="py-3 text-sm font-medium text-gray-600 border-t flex items-center">
                    {feature.key === 'price' && <TrendingUp className="w-4 h-4 mr-2" />}
                    {feature.key === 'rating' && <Star className="w-4 h-4 mr-2" />}
                    {feature.label}
                  </div>
                  {comparisonProducts.map((product, index) => (
                    <div
                      key={`${product.id}-${feature.key}`}
                      className={`py-3 text-sm text-center border-t ${
                        getBestValue(index, feature.key as any) ? 'bg-green-50 font-semibold text-green-700' : 'text-gray-900'
                      }`}
                    >
                      {getBestValue(index, feature.key as any) && (
                        <Check className="w-4 h-4 inline mr-1 text-green-600" />
                      )}
                      {feature.format((product as any)[feature.key])}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductComparison;
