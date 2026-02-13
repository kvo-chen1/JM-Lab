import { useState } from 'react';

interface Brand {
  id: string;
  name: string;
  color: string;
  colorLight: string;
  description: string;
  category: string;
  icon: string;
}

const brands: Brand[] = [
  {
    id: 'nirenzhang',
    name: '泥人张',
    color: '#C21807',
    colorLight: '#E8453A',
    description: '用于重要操作和强调',
    category: '工艺美术',
    icon: '🎨'
  },
  {
    id: 'yangliuqing',
    name: '杨柳青',
    color: '#228B22',
    colorLight: '#4CAF50',
    description: '用于成功状态和生态主题',
    category: '年画艺术',
    icon: '🖼️'
  },
  {
    id: 'fengzhengwei',
    name: '风筝魏',
    color: '#87CEEB',
    colorLight: '#5DADE2',
    description: '用于信息提示和链接',
    category: '传统技艺',
    icon: '🪁'
  },
  {
    id: 'guifaxiang',
    name: '桂发祥',
    color: '#C68E17',
    colorLight: '#E6B84D',
    description: '用于VIP标识和会员等级',
    category: '传统美食',
    icon: '🥨'
  },
  {
    id: 'goubuli',
    name: '狗不理',
    color: '#8B4513',
    colorLight: '#A0522D',
    description: '用于暖色调装饰',
    category: '传统美食',
    icon: '🥟'
  }
];

export function TianjinBrandShowcase() {
  const [hoveredBrand, setHoveredBrand] = useState<string | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (color: string, brandId: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(brandId);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        点击色值可复制，悬停查看应用说明
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {brands.map((brand) => {
          const isHovered = hoveredBrand === brand.id;
          const isCopied = copiedColor === brand.id;
          
          return (
            <div
              key={brand.id}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
                ${isHovered 
                  ? 'border-[#1E5F8E] shadow-lg transform -translate-y-1' 
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
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {brand.name}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {brand.category}
                  </span>
                </div>
              </div>
              
              {/* 描述 */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {brand.description}
              </p>
              
              {/* 色值展示 */}
              <div className="space-y-2">
                <button
                  onClick={() => copyToClipboard(brand.color, brand.id)}
                  className={`
                    w-full px-3 py-2 rounded-lg text-sm font-mono transition-all duration-200
                    flex items-center justify-between
                    ${isCopied 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span 
                      className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: brand.color }}
                    />
                    {brand.color}
                  </span>
                  <span className="text-xs">
                    {isCopied ? '✓ 已复制' : '复制'}
                  </span>
                </button>
                
                <button
                  onClick={() => copyToClipboard(brand.colorLight, `${brand.id}-light`)}
                  className="w-full px-3 py-2 rounded-lg text-sm font-mono bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 transition-all duration-200 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span 
                      className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: brand.colorLight }}
                    />
                    {brand.colorLight}
                  </span>
                  <span className="text-xs text-gray-400">浅色</span>
                </button>
              </div>
              
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
          <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#228B22' }}>
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
