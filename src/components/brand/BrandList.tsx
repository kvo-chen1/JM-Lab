/**
 * 品牌列表组件 - 横向滚动展示品牌方
 */
import React, { useRef } from 'react';
import { Brand } from '@/services/brandService';
import BrandCard from './BrandCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BrandListProps {
  brands: Brand[];
  onBrandClick?: (brand: Brand) => void;
  selectedBrandId?: string;
  title?: string;
  showScrollButtons?: boolean;
  cardSize?: 'small' | 'medium' | 'large';
}

const BrandList: React.FC<BrandListProps> = ({
  brands,
  onBrandClick,
  selectedBrandId,
  title = '已入驻品牌方',
  showScrollButtons = true,
  cardSize = 'medium',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (brands.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">
          <p>暂无入驻品牌方</p>
          <p className="text-sm mt-2">敬请期待更多津门老字号入驻</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏢</span>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <span className="text-sm text-gray-500">({brands.length}家)</span>
        </div>
        {showScrollButtons && brands.length > 4 && (
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="向左滚动"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="向右滚动"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* 品牌列表 */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {brands.map((brand) => (
          <BrandCard
            key={brand.id}
            brand={brand}
            onClick={onBrandClick}
            selected={selectedBrandId === brand.id}
            size={cardSize}
          />
        ))}
      </div>

      {/* 提示文字 */}
      {brands.length > 4 && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          ← 左右滑动查看更多品牌 →
        </p>
      )}
    </div>
  );
};

export default BrandList;
