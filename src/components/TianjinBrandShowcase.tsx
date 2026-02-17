import { useState } from 'react';

interface Brand {
  id: string;
  name: string;
  color: string;
  colorLight: string;
  description: string;
  category: string;
  icon: string;
  themeLabel: string;
}

const brands: Brand[] = [
  {
    id: 'nirenzhang',
    name: '泥人张',
    color: '#C21807',
    colorLight: '#E8453A',
    description: '天津传统泥塑艺术，色彩浓烈饱满，体现民间工艺的热烈与生命力',
    category: '工艺美术',
    icon: '🎨',
    themeLabel: '热烈红'
  },
  {
    id: 'yangliuqing',
    name: '杨柳青',
    color: '#2E5AAC',
    colorLight: '#D4351C',
    description: '天津杨柳青年画，石青配朱砂，半印半绘，色彩鲜艳明快',
    category: '年画艺术',
    icon: '🖼️',
    themeLabel: '石青朱砂'
  },
  {
    id: 'fengzhengwei',
    name: '风筝魏',
    color: '#87CEEB',
    colorLight: '#5DADE2',
    description: '天津传统风筝技艺，天蓝色彩，轻盈飘逸，承载蓝天梦想',
    category: '传统技艺',
    icon: '🪁',
    themeLabel: '天空蓝'
  },
  {
    id: 'guifaxiang',
    name: '桂发祥',
    color: '#C68E17',
    colorLight: '#E6B84D',
    description: '天津传统美食，金黄酥脆，象征富贵吉祥与美好生活的向往',
    category: '传统美食',
    icon: '🥨',
    themeLabel: '富贵金'
  },
  {
    id: 'goubuli',
    name: '狗不理',
    color: '#8B4513',
    colorLight: '#A0522D',
    description: '天津传统美食，温暖棕色调，体现老字号的厚重与传承',
    category: '传统美食',
    icon: '🥟',
    themeLabel: '温暖棕'
  }
];

export function TianjinBrandShowcase() {
  const [hoveredBrand, setHoveredBrand] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        融合天津传统老字号品牌色彩基因，体现城市文化底蕴
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {brands.map((brand) => {
          const isHovered = hoveredBrand === brand.id;

          return (
            <div
              key={brand.id}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-300
                ${isHovered
                  ? 'shadow-lg transform -translate-y-1 border-gray-300 dark:border-gray-600'
                  : 'border-gray-200 dark:border-gray-700'
                }
                bg-white dark:bg-gray-800
              `}
              onMouseEnter={() => setHoveredBrand(brand.id)}
              onMouseLeave={() => setHoveredBrand(null)}
            >
              {/* 顶部色条 */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
                style={{ background: `linear-gradient(90deg, ${brand.color}, ${brand.colorLight})` }}
              />

              {/* 品牌图标和名称 */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${brand.color}20, ${brand.colorLight}20)`,
                    border: `2px solid ${brand.color}40`
                  }}
                >
                  {brand.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {brand.name}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {brand.category} · {brand.themeLabel}
                  </span>
                </div>
              </div>

              {/* 描述 */}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {brand.description}
              </p>

              {/* 悬停时的装饰效果 */}
              {isHovered && (
                <div
                  className="absolute -bottom-1 -right-1 w-16 h-16 rounded-full opacity-10"
                  style={{ background: `radial-gradient(circle, ${brand.color}, transparent)` }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 应用示例 */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#1E5F8E]/5 to-[#A0522D]/5 border border-[#1E5F8E]/10">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span>🎨</span>
          应用示例
        </h4>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#C21807' }}>
            泥人张红 - 主要按钮
          </button>
          <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#2E5AAC' }}>
            杨柳青绿 - 成功状态
          </button>
          <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#C68E17' }}>
            桂发祥金 - VIP标识
          </button>
          <span className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: '#87CEEB30', color: '#5DADE2' }}>
            风筝魏蓝 - 信息链接
          </span>
        </div>
      </div>
    </div>
  );
}

export default TianjinBrandShowcase;
