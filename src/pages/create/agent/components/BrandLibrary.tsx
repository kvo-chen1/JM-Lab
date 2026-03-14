import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Search, X, ChevronRight, Store, Check } from 'lucide-react';
import { BRANDS } from '@/lib/brands';
import type { Brand } from '@/lib/brands';

interface BrandLibraryProps {
  onBrandSelect: (brand: Brand) => void;
  onClose: () => void;
  selectedBrand?: string;
}

// 热门品牌ID列表（图片中展示的12个品牌）
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

export default function BrandLibrary({ onBrandSelect, onClose, selectedBrand }: BrandLibraryProps) {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [localSelectedBrand, setLocalSelectedBrand] = useState<string | undefined>(selectedBrand);

  // 热门品牌数据
  const hotBrands = useMemo(() => {
    return HOT_BRAND_IDS.map(id => BRANDS.find(b => b.id === id)).filter(Boolean) as Brand[];
  }, []);

  // 所有品牌（用于查看全部）
  const allBrands = useMemo(() => {
    if (!searchQuery) return BRANDS;
    const query = searchQuery.toLowerCase();
    return BRANDS.filter(brand =>
      brand.name.toLowerCase().includes(query) ||
      brand.story.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // 处理品牌选择
  const handleBrandClick = (brand: Brand) => {
    setLocalSelectedBrand(brand.id);
    onBrandSelect(brand);
  };

  // 品牌卡片组件
  const BrandCard = ({ brand, index }: { brand: Brand; index: number }) => {
    const isSelected = localSelectedBrand === brand.id;

    return (
      <motion.div
        key={brand.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
          isSelected
            ? 'ring-2 ring-[#C02C38] ring-offset-2 ring-offset-gray-900'
            : 'hover:ring-2 hover:ring-gray-600'
        }`}
        onClick={() => handleBrandClick(brand)}
      >
        {/* 图片区域 */}
        <div className="aspect-[4/3] overflow-hidden bg-gray-800">
          <img
            src={brand.image}
            alt={brand.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              // 图片加载失败时显示占位图
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop';
            }}
          />
          {/* 选中标记 */}
          {isSelected && (
            <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#C02C38] flex items-center justify-center shadow-lg">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
          {/* 悬停遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        </div>

        {/* 信息区域 */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h4 className="font-semibold text-white text-sm mb-1 truncate">
            {brand.name}
          </h4>
          <p className={`text-xs line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-200'}`}>
            {brand.story}
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* 头部 */}
      <div className={`p-5 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C02C38] to-[#E85D75] flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {showAll ? '全部品牌' : '热门品牌'}
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {showAll ? `${allBrands.length} 个品牌` : `${hotBrands.length} 个热门品牌`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 搜索框 */}
        {showAll && (
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="搜索品牌..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-[#C02C38] focus:border-transparent`}
            />
          </div>
        )}
      </div>

      {/* 品牌网格 */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* 查看全部按钮 */}
        {!showAll && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowAll(true)}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 返回热门品牌按钮 */}
        {showAll && (
          <div className="flex justify-start mb-4">
            <button
              onClick={() => {
                setShowAll(false);
                setSearchQuery('');
              }}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              返回热门品牌
            </button>
          </div>
        )}

        {/* 品牌卡片网格 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(showAll ? allBrands : hotBrands).map((brand, index) => (
            <BrandCard key={brand.id} brand={brand} index={index} />
          ))}
        </div>

        {/* 空状态 */}
        {showAll && allBrands.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Store className={`w-12 h-12 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              没有找到相关品牌
            </p>
          </div>
        )}
      </div>

      {/* 底部 */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {localSelectedBrand 
              ? `已选择: ${BRANDS.find(b => b.id === localSelectedBrand)?.name}` 
              : '点击品牌卡片进行选择'}
          </p>
          {localSelectedBrand && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#C02C38] to-[#E85D75] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              确认选择
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
