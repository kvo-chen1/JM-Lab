import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

interface ProductMockupPreviewProps {
  imageUrl: string;
  onCustomize?: (productType: string) => void;
}

type ProductType = 'tshirt' | 'mug' | 'tote';

const ProductMockupPreview: React.FC<ProductMockupPreviewProps> = ({ imageUrl, onCustomize }) => {
  const { isDark } = useTheme();
  const [selectedProduct, setSelectedProduct] = useState<ProductType>('tshirt');

  const products = [
    { id: 'tshirt', name: 'T恤', price: 99 },
    { id: 'mug', name: '马克杯', price: 49 },
    { id: 'tote', name: '帆布袋', price: 39 },
  ];

  const handleBuy = () => {
    toast.success('已加入购物车！准备跳转定制页面...');
    if (onCustomize) {
      onCustomize(selectedProduct);
    }
  };

  return (
    <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center">
          <i className="fas fa-magic mr-2 text-purple-500"></i>
          制作周边
        </h3>
        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">C2M定制</span>
      </div>

      {/* Mockup Display Area */}
      <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
        {/* SVG Mockups */}
        {selectedProduct === 'tshirt' && (
          <div className="relative w-3/4 h-3/4">
            {/* T-Shirt SVG Shape */}
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
              <path d="M30 10 L40 15 L60 15 L70 10 L90 25 L85 35 L75 30 L75 90 L25 90 L25 30 L15 35 L10 25 Z" fill={isDark ? '#333' : '#fff'} stroke={isDark ? '#555' : '#ddd'} strokeWidth="1" />
            </svg>
            {/* Design Overlay */}
            <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] overflow-hidden mix-blend-multiply opacity-90">
               <img src={imageUrl} alt="design" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {selectedProduct === 'mug' && (
          <div className="relative w-3/4 h-3/4 flex items-center justify-center">
             {/* Mug SVG Shape */}
             <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
               <path d="M25 20 L25 80 C25 88 32 95 40 95 L60 95 C68 95 75 88 75 80 L75 20 Z" fill={isDark ? '#333' : '#fff'} stroke={isDark ? '#555' : '#ddd'} strokeWidth="1" />
               <path d="M75 30 L85 30 C90 30 95 35 95 45 L95 65 C95 75 90 80 85 80 L75 80" fill="none" stroke={isDark ? '#555' : '#ddd'} strokeWidth="6" />
             </svg>
             {/* Design Overlay - Curved effect simulated by mask or simple overlay */}
             <div className="absolute top-[30%] left-[30%] w-[40%] h-[50%] overflow-hidden mix-blend-multiply opacity-90 rounded-sm">
                <img src={imageUrl} alt="design" className="w-full h-full object-cover" />
             </div>
          </div>
        )}

        {selectedProduct === 'tote' && (
          <div className="relative w-3/4 h-3/4 flex items-center justify-center">
            {/* Tote Bag SVG Shape */}
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
              <path d="M30 35 L25 90 L75 90 L70 35 Z" fill={isDark ? '#f0e6d2' : '#f5f5dc'} stroke={isDark ? '#a89f8d' : '#e0d8b0'} strokeWidth="1" />
              <path d="M35 35 C35 15 65 15 65 35" fill="none" stroke={isDark ? '#a89f8d' : '#e0d8b0'} strokeWidth="4" />
            </svg>
             <div className="absolute top-[45%] left-[35%] w-[30%] h-[30%] overflow-hidden mix-blend-multiply opacity-90">
                <img src={imageUrl} alt="design" className="w-full h-full object-cover" />
             </div>
          </div>
        )}
      </div>

      {/* Product Selector */}
      <div className="flex justify-center gap-2 mb-4">
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedProduct(p.id as ProductType)}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${
              selectedProduct === p.id
                ? 'bg-purple-600 text-white border-purple-600'
                : isDark ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Price and Action */}
      <div className="flex items-center justify-between mt-2">
        <div>
          <span className="text-xs text-gray-500">定制价</span>
          <div className="text-lg font-bold text-red-500">¥{products.find(p => p.id === selectedProduct)?.price}</div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBuy}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all"
        >
          立即定制
        </motion.button>
      </div>
    </div>
  );
};

export default ProductMockupPreview;
