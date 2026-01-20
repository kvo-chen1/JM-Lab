import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';

// 定义版式类型
interface LayoutTemplate {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
  category: 'poster' | 'social' | 'banner' | 'card';
}

// 版式模板数据
const layoutTemplates: LayoutTemplate[] = [
  {
    id: 'poster-1',
    name: '经典海报',
    thumbnail: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&h=400&fit=crop',
    description: '上下结构，适合标题和说明文字',
    category: 'poster'
  },
  {
    id: 'poster-2',
    name: '现代海报',
    thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=400&fit=crop',
    description: '左右对称，视觉平衡',
    category: 'poster'
  },
  {
    id: 'social-1',
    name: '社交媒体',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&h=400&fit=crop',
    description: '适合Instagram、微博等社交媒体',
    category: 'social'
  },
  {
    id: 'social-2',
    name: '短视频封面',
    thumbnail: 'https://images.unsplash.com/photo-1551645164-78232ed3803a?w=600&h=400&fit=crop',
    description: '适合抖音、YouTube Shorts等短视频平台',
    category: 'social'
  },
  {
    id: 'banner-1',
    name: '网站横幅',
    thumbnail: 'https://images.unsplash.com/photo-1536304929837-92c98515541c?w=600&h=400&fit=crop',
    description: '长条形，适合网站顶部横幅',
    category: 'banner'
  },
  {
    id: 'banner-2',
    name: '广告横幅',
    thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop',
    description: '突出产品和号召性用语',
    category: 'banner'
  },
  {
    id: 'card-1',
    name: '名片',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=400&fit=crop',
    description: '简洁明了，包含联系信息',
    category: 'card'
  },
  {
    id: 'card-2',
    name: '邀请卡',
    thumbnail: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=600&h=400&fit=crop',
    description: '优雅设计，适合各种场合',
    category: 'card'
  }
];

// 尺寸预设
const sizePresets = [
  { name: '自定义', width: '', height: '', unit: 'px' },
  { name: 'A4', width: '2480', height: '3508', unit: 'px' },
  { name: '社交媒体', width: '1080', height: '1080', unit: 'px' },
  { name: '短视频', width: '1080', height: '1920', unit: 'px' },
  { name: '网站横幅', width: '1920', height: '500', unit: 'px' },
  { name: '名片', width: '850', height: '550', unit: 'px' }
];

const LayoutPanel: React.FC = () => {
  const { isDark } = useTheme();
  const { updateState } = useCreateStore();
  const [selectedLayout, setSelectedLayout] = useState<LayoutTemplate | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<any>(sizePresets[0]);
  const [customSize, setCustomSize] = useState({ width: '', height: '' });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // 获取所有分类
  const categories = ['all', ...Array.from(new Set(layoutTemplates.map(template => template.category)))];

  // 过滤版式模板
  const filteredTemplates = activeCategory === 'all'
    ? layoutTemplates
    : layoutTemplates.filter(template => template.category === activeCategory);

  // 处理尺寸选择
  const handleSizeChange = (size: any) => {
    setSelectedSize(size);
    if (size.width && size.height) {
      setCustomSize({ width: size.width, height: size.height });
    }
  };

  // 处理自定义尺寸变化
  const handleCustomSizeChange = (field: 'width' | 'height', value: string) => {
    setCustomSize(prev => ({ ...prev, [field]: value }));
    // 如果是自定义尺寸，更新selectedSize
    setSelectedSize(sizePresets[0]);
  };

  // 处理版式选择
  const handleLayoutSelect = (layout: LayoutTemplate) => {
    setSelectedLayout(layout);
  };

  // 生成版式
  const handleGenerateLayout = () => {
    if (!selectedLayout) return;
    
    setIsGenerating(true);
    
    // 模拟生成过程
    setTimeout(() => {
      updateState({
        aiExplanation: `已生成${selectedLayout.name}版式，尺寸为${customSize.width}x${customSize.height}像素`,
        showAIReview: true
      });
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">版式生成</h3>
        <p className="text-xs opacity-70 mb-3">选择版式模板和尺寸，生成专业设计版式</p>
        
        {/* 尺寸设置 */}
        <div className={`rounded-lg border p-3 mb-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h4 className="text-sm font-medium mb-3">尺寸设置</h4>
          
          {/* 尺寸预设选择 */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {sizePresets.map((size, index) => (
              <motion.button
                key={index}
                onClick={() => handleSizeChange(size)}
                className={`px-3 py-2 rounded-lg text-xs transition-all ${isDark 
                  ? selectedSize.name === size.name 
                    ? 'bg-[#C02C38]/20 text-[#C02C38]' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                  : selectedSize.name === size.name 
                    ? 'bg-[#C02C38]/10 text-[#C02C38]' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                whileTap={{ scale: 0.95 }}
              >
                {size.name}
              </motion.button>
            ))}
          </div>
          
          {/* 自定义尺寸输入 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">宽度</label>
              <div className="relative">
                <input
                  type="text"
                  value={customSize.width}
                  onChange={(e) => handleCustomSizeChange('width', e.target.value)}
                  className={`w-full px-3 py-2 pl-2 pr-16 rounded-lg text-sm border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-[#C02C38]/30`}
                  placeholder="输入宽度"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-70 whitespace-nowrap">像素</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">高度</label>
              <div className="relative">
                <input
                  type="text"
                  value={customSize.height}
                  onChange={(e) => handleCustomSizeChange('height', e.target.value)}
                  className={`w-full px-3 py-2 pl-2 pr-16 rounded-lg text-sm border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-[#C02C38]/30`}
                  placeholder="输入高度"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-70 whitespace-nowrap">像素</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 分类选择 */}
        <div className="flex overflow-x-auto space-x-2 mb-3 pb-2 scrollbar-hide scroll-smooth snap-x snap-mandatory">
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all duration-200 ease-in-out snap-center ${isDark 
                ? activeCategory === category 
                  ? 'bg-[#C02C38]/20 text-[#C02C38] shadow-md' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300' 
                : activeCategory === category 
                  ? 'bg-[#C02C38]/10 text-[#C02C38] shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              tabIndex={0}
              role="tab"
              aria-selected={activeCategory === category}
            >
              {category === 'all' ? '全部' : category === 'poster' ? '海报' : category === 'social' ? '社交媒体' : category === 'banner' ? '横幅' : category === 'card' ? '卡片' : category}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 版式模板列表 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {filteredTemplates.map((template) => {
          const isSelected = selectedLayout?.id === template.id;
          return (
            <motion.button
              key={template.id}
              onClick={() => handleLayoutSelect(template)}
              className={`group rounded-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-md ${isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'} ${isSelected 
                ? 'border-[#C02C38] ring-2 ring-[#C02C38]/20 scale-105 z-10' 
                : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
              whileTap={{ scale: 0.95 }}
            >
              <div className="aspect-square relative">
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    // 图片加载失败时显示占位符
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/150?text=${encodeURIComponent(template.name)}`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 z-10">
                  <p className="text-white text-xs font-medium">{template.name}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#C02C38] flex items-center justify-center">
                    <i className="fas fa-check text-white text-[10px]"></i>
                  </div>
                )}
              </div>
              <div className="p-2 bg-gray-100 dark:bg-gray-900">
                <p className="text-xs font-medium truncate">{template.name}</p>
                <p className="text-[9px] opacity-70 truncate">{template.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* 生成按钮 */}
      <div className="mt-auto">
        <motion.button
          onClick={handleGenerateLayout}
          disabled={!selectedLayout || !customSize.width || !customSize.height || isGenerating}
          className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ${isDark 
            ? !selectedLayout || !customSize.width || !customSize.height 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : isGenerating 
                ? 'bg-[#C02C38]/70 text-white cursor-not-allowed' 
                : 'bg-[#C02C38] text-white hover:bg-[#A0232F] shadow-lg shadow-[#C02C38]/30' 
            : !selectedLayout || !customSize.width || !customSize.height 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : isGenerating 
                ? 'bg-[#C02C38]/70 text-white cursor-not-allowed' 
                : 'bg-[#C02C38] text-white hover:bg-[#A0232F] shadow-lg shadow-[#C02C38]/30'}`}
          whileHover={selectedLayout && customSize.width && customSize.height && !isGenerating ? { scale: 1.02 } : {}}
          whileTap={selectedLayout && customSize.width && customSize.height && !isGenerating ? { scale: 0.98 } : {}}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-spinner fa-spin text-sm"></i>
              <span>生成中...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-th-large text-sm"></i>
              <span>生成版式</span>
            </div>
          )}
        </motion.button>
        <p className="text-xs text-center opacity-50 mt-2">选择版式模板并设置尺寸</p>
      </div>
    </div>
  );
};

export default LayoutPanel;