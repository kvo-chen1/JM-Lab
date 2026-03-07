/**
 * 品牌卡片组件 - 展示单个品牌方信息
 */
import React from 'react';
import { Brand } from '@/services/brandService';

interface BrandCardProps {
  brand: Brand;
  onClick?: (brand: Brand) => void;
  selected?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const BrandCard: React.FC<BrandCardProps> = ({ brand, onClick, selected = false, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-24 h-28',
    medium: 'w-32 h-36',
    large: 'w-40 h-44',
  };

  const logoSizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-20 h-20',
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  return (
    <div
      onClick={() => onClick?.(brand)}
      className={`
        ${sizeClasses[size]}
        flex flex-col items-center justify-center
        bg-white rounded-xl shadow-sm
        border-2 transition-all duration-300 cursor-pointer
        hover:shadow-md hover:scale-105
        ${selected ? 'border-[#C02C38] bg-red-50' : 'border-gray-100 hover:border-gray-200'}
      `}
    >
      {/* Logo */}
      <div
        className={`
          ${logoSizeClasses[size]}
          rounded-full overflow-hidden bg-gray-50
          flex items-center justify-center mb-2
        `}
      >
        {brand.logo ? (
          <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#C02C38] to-[#991b1b] flex items-center justify-center">
            <span className="text-white font-bold text-lg">{brand.name.charAt(0)}</span>
          </div>
        )}
      </div>

      {/* 品牌名称 */}
      <span
        className={`
          ${textSizeClasses[size]}
          font-medium text-gray-800 text-center px-2 truncate w-full
          ${selected ? 'text-[#C02C38]' : ''}
        `}
      >
        {brand.name}
      </span>

      {/* 分类标签 */}
      {brand.category && (
        <span className="text-xs text-gray-500 mt-1">{brand.category}</span>
      )}

      {/* 选中标记 */}
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-[#C02C38] rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default BrandCard;
