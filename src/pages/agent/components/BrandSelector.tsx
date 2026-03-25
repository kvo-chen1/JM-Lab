import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { BRANDS } from '@/lib/brands';
import type { Brand } from '@/lib/brands';
import { Store, ChevronRight, Check } from 'lucide-react';
import { toast } from 'sonner';

interface BrandSelectorProps {
  onBrandSelect?: (brand: Brand) => void;
  onOpenBrandLibrary?: () => void;
  showBrandLibrary?: boolean;
}

// 热门品牌ID列表（12个品牌，三行四列）
const HOT_BRAND_IDS = [
  'goubuli',        // 狗不理包子
  'laomeihua',      // 老美华鞋店
  'seagullwatch',   // 海鸥表
  'qianxiangyi',    // 谦祥益布店
  'longshunyu',     // 隆顺榕酱园
  'hongshunde',     // 鸿顺德酱菜
  'tongrentang',    // 同仁堂
  'daoxiangcun',    // 稻香村
  'quanjude',       // 全聚德
  'liubiju',        // 六必居
  'wangzhihe',      // 王致和
  'laofengxiang',   // 老凤祥
];

export default function BrandSelector({ onBrandSelect, onOpenBrandLibrary, showBrandLibrary }: BrandSelectorProps) {
  const { isDark } = useTheme();
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  // 热门品牌数据
  const hotBrands = HOT_BRAND_IDS.map(id => BRANDS.find(b => b.id === id)).filter(Boolean) as Brand[];

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand.id);
    toast.success(`已选择品牌：${brand.name}`);
    onBrandSelect?.(brand);
  };

  return (
    <div className="space-y-4">
      {/* Brand Grid - 4列紧凑布局 */}
      <div className="grid grid-cols-4 gap-2">
        {hotBrands.map((brand, index) => (
          <motion.button
            key={brand.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => handleBrandSelect(brand)}
            className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
              selectedBrand === brand.id
                ? 'border-[#C02C38] ring-2 ring-[#C02C38]/20'
                : isDark
                  ? 'border-gray-700 hover:border-gray-600'
                  : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Brand Image */}
            <div className="aspect-[4/3] relative bg-gray-100 dark:bg-gray-700">
              <img
                src={brand.image}
                alt={brand.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  // 图片加载失败时显示备用内容
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500"><span class="text-lg">${brand.name.charAt(0)}</span></div>`;
                  }
                }}
              />
              {/* Overlay - 添加 pointer-events-none 允许点击穿透 */}
              <div className={`absolute inset-0 transition-opacity pointer-events-none ${
                selectedBrand === brand.id
                  ? 'bg-[#C02C38]/20'
                  : 'bg-black/0 group-hover:bg-black/10'
              }`} />

              {/* Selected Indicator */}
              {selectedBrand === brand.id && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#C02C38] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Brand Name */}
            <div className={`p-1 text-center ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              <p className={`text-[10px] font-medium truncate ${
                selectedBrand === brand.id
                  ? 'text-[#C02C38]'
                  : isDark ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {brand.name}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Brand Library Button */}
      <motion.button
        onClick={() => {
          if (showBrandLibrary) {
            onOpenBrandLibrary?.();
          } else {
            onOpenBrandLibrary?.();
          }
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
          showBrandLibrary
            ? isDark
              ? 'bg-[#C02C38]/20 border border-[#C02C38]'
              : 'bg-[#C02C38]/10 border border-[#C02C38]'
            : isDark
              ? 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700'
              : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Store className={`w-4 h-4 ${showBrandLibrary ? 'text-[#C02C38]' : 'text-gray-400'}`} />
          <span className={`text-sm font-medium ${
            showBrandLibrary 
              ? 'text-[#C02C38]' 
              : isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            品牌库
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-xs ${showBrandLibrary ? 'text-[#C02C38]' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            查看全部
          </span>
          <ChevronRight className={`w-4 h-4 transition-transform ${showBrandLibrary ? 'rotate-90 text-[#C02C38]' : 'text-gray-400'}`} />
        </div>
      </motion.button>

      {/* Custom Input Hint */}
      <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        没找到合适的品牌？你可以直接在输入框中@品牌名或描述你的需求
      </p>
    </div>
  );
}
