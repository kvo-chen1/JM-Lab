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
  category: 'poster' | 'social' | 'banner' | 'card' | 'magazine' | 'flyer' | 'brochure';
  recommendedSize: { width: string; height: string };
}

// 版式模板数据
const layoutTemplates: LayoutTemplate[] = [
  // 海报模板
  {
    id: 'poster-1',
    name: '经典海报',
    thumbnail: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&h=400&fit=crop',
    description: '上下结构，适合标题和说明文字',
    category: 'poster',
    recommendedSize: { width: '1920', height: '2880' }
  },
  {
    id: 'poster-2',
    name: '现代海报',
    thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=400&fit=crop',
    description: '左右对称，视觉平衡',
    category: 'poster',
    recommendedSize: { width: '1920', height: '2880' }
  },
  {
    id: 'poster-3',
    name: '极简海报',
    thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=400&fit=crop',
    description: '简洁设计，突出主题',
    category: 'poster',
    recommendedSize: { width: '1920', height: '2880' }
  },
  {
    id: 'poster-4',
    name: '创意海报',
    thumbnail: 'https://images.unsplash.com/photo-1531338591364-2e350e833f05?w=600&h=400&fit=crop',
    description: '打破常规，独特视觉效果',
    category: 'poster',
    recommendedSize: { width: '1920', height: '2880' }
  },
  
  // 社交媒体模板
  {
    id: 'social-1',
    name: 'Instagram帖子',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&h=400&fit=crop',
    description: '适合Instagram、微博等社交媒体',
    category: 'social',
    recommendedSize: { width: '1080', height: '1080' }
  },
  {
    id: 'social-2',
    name: '短视频封面',
    thumbnail: 'https://images.unsplash.com/photo-1551645164-78232ed3803a?w=600&h=400&fit=crop',
    description: '适合抖音、YouTube Shorts等短视频平台',
    category: 'social',
    recommendedSize: { width: '1080', height: '1920' }
  },
  {
    id: 'social-3',
    name: '微博横幅',
    thumbnail: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop',
    description: '适合微博、Twitter等社交媒体横幅',
    category: 'social',
    recommendedSize: { width: '1500', height: '500' }
  },
  {
    id: 'social-4',
    name: '小红书笔记',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop',
    description: '适合小红书、知乎等内容平台',
    category: 'social',
    recommendedSize: { width: '1080', height: '1440' }
  },
  
  // 横幅模板
  {
    id: 'banner-1',
    name: '网站横幅',
    thumbnail: 'https://images.unsplash.com/photo-1536304929837-92c98515541c?w=600&h=400&fit=crop',
    description: '长条形，适合网站顶部横幅',
    category: 'banner',
    recommendedSize: { width: '1920', height: '500' }
  },
  {
    id: 'banner-2',
    name: '广告横幅',
    thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop',
    description: '突出产品和号召性用语',
    category: 'banner',
    recommendedSize: { width: '1200', height: '600' }
  },
  {
    id: 'banner-3',
    name: '电商横幅',
    thumbnail: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=600&h=400&fit=crop',
    description: '适合电商平台促销横幅',
    category: 'banner',
    recommendedSize: { width: '1920', height: '600' }
  },
  {
    id: 'banner-4',
    name: '移动端横幅',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop',
    description: '适合移动端网站和APP横幅',
    category: 'banner',
    recommendedSize: { width: '750', height: '360' }
  },
  
  // 卡片模板
  {
    id: 'card-1',
    name: '商务名片',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=400&fit=crop',
    description: '简洁明了，包含联系信息',
    category: 'card',
    recommendedSize: { width: '850', height: '550' }
  },
  {
    id: 'card-2',
    name: '邀请卡',
    thumbnail: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=600&h=400&fit=crop',
    description: '优雅设计，适合各种场合',
    category: 'card',
    recommendedSize: { width: '1080', height: '1080' }
  },
  {
    id: 'card-3',
    name: '会员卡',
    thumbnail: 'https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?w=600&h=400&fit=crop',
    description: '适合会员制营销',
    category: 'card',
    recommendedSize: { width: '850', height: '550' }
  },
  {
    id: 'card-4',
    name: '祝福卡',
    thumbnail: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=400&fit=crop',
    description: '适合节日祝福和问候',
    category: 'card',
    recommendedSize: { width: '1080', height: '1080' }
  },
  
  // 新增杂志模板
  {
    id: 'magazine-1',
    name: '杂志封面',
    thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=400&fit=crop',
    description: '专业杂志封面设计',
    category: 'magazine',
    recommendedSize: { width: '2480', height: '3508' }
  },
  {
    id: 'magazine-2',
    name: '杂志内页',
    thumbnail: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&h=400&fit=crop',
    description: '适合文章排版',
    category: 'magazine',
    recommendedSize: { width: '2480', height: '3508' }
  },
  
  // 新增传单模板
  {
    id: 'flyer-1',
    name: '促销传单',
    thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop',
    description: '适合产品促销和活动宣传',
    category: 'flyer',
    recommendedSize: { width: '2480', height: '3508' }
  },
  {
    id: 'flyer-2',
    name: '活动传单',
    thumbnail: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&h=400&fit=crop',
    description: '适合演唱会、展览等活动',
    category: 'flyer',
    recommendedSize: { width: '2480', height: '3508' }
  }
];

// 尺寸预设
const sizePresets = [
  { name: '自定义', width: '', height: '', unit: 'px' },
  // 标准纸张尺寸
  { name: 'A4', width: '2480', height: '3508', unit: 'px' },
  { name: 'A3', width: '3508', height: '4961', unit: 'px' },
  { name: 'A5', width: '1748', height: '2480', unit: 'px' },
  // 海报尺寸
  { name: '海报 (A1)', width: '5946', height: '8419', unit: 'px' },
  { name: '海报 (A2)', width: '4209', height: '5946', unit: 'px' },
  // 社交媒体尺寸
  { name: 'Instagram 正方形', width: '1080', height: '1080', unit: 'px' },
  { name: 'Instagram 竖版', width: '1080', height: '1350', unit: 'px' },
  { name: 'Instagram 横版', width: '1080', height: '608', unit: 'px' },
  { name: '短视频封面', width: '1080', height: '1920', unit: 'px' },
  { name: '小红书笔记', width: '1080', height: '1440', unit: 'px' },
  // 网站横幅
  { name: '网站横幅 (标准)', width: '1920', height: '500', unit: 'px' },
  { name: '网站横幅 (宽屏)', width: '2560', height: '500', unit: 'px' },
  { name: '移动端横幅', width: '750', height: '360', unit: 'px' },
  // 卡片尺寸
  { name: '名片', width: '850', height: '550', unit: 'px' },
  { name: '贺卡', width: '1080', height: '1080', unit: 'px' },
  // 电商尺寸
  { name: '产品详情图', width: '1200', height: '1200', unit: 'px' },
  { name: '电商主图', width: '800', height: '800', unit: 'px' }
];

const LayoutPanel: React.FC = () => {
  const { isDark } = useTheme();
  const { updateState, selectedResult } = useCreateStore();
  const [selectedLayout, setSelectedLayout] = useState<LayoutTemplate | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<any>(sizePresets[0]);
  const [customSize, setCustomSize] = useState({ width: '', height: '' });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showRecommendedSize, setShowRecommendedSize] = useState(true);

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
    // 如果显示推荐尺寸，自动应用推荐尺寸
    if (showRecommendedSize) {
      setCustomSize(layout.recommendedSize);
      // 查找匹配的尺寸预设
      const matchingSize = sizePresets.find(size => 
        size.width === layout.recommendedSize.width && 
        size.height === layout.recommendedSize.height
      );
      setSelectedSize(matchingSize || sizePresets[0]);
    }
  };

  // 生成版式
  const handleGenerateLayout = () => {
    if (!selectedLayout) return;
    
    setIsGenerating(true);
    
    // 模拟生成过程
    setTimeout(() => {
      updateState({
        aiExplanation: `已生成${selectedLayout.name}版式，尺寸为${customSize.width}x${customSize.height}像素`,
        generatedImage: selectedLayout.thumbnail,
        showAIReview: true
      });
      setIsGenerating(false);
    }, 2000);
  };

  // 切换推荐尺寸选项
  const toggleRecommendedSize = () => {
    setShowRecommendedSize(!showRecommendedSize);
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">版式生成</h3>
        <p className="text-xs opacity-70 mb-3">选择版式模板和尺寸，生成专业设计版式</p>
        
        {/* 尺寸设置 */}
        <div className={`rounded-lg border p-4 mb-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">尺寸设置</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-70">推荐尺寸</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRecommendedSize}
                  onChange={toggleRecommendedSize}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full peer ${showRecommendedSize ? 'bg-[#C02C38]' : 'bg-gray-600'} peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#C02C38] peer-focus:ring-opacity-50 transition-all duration-300`}></div>
                <div className={`absolute left-1.5 top-1.5 bg-white w-3 h-3 rounded-full transition-transform duration-300 ${showRecommendedSize ? 'transform translate-x-5' : ''}`}></div>
              </label>
            </div>
          </div>
          
          {/* 尺寸预设选择 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
            {sizePresets.map((size, index) => (
              <motion.button
                key={index}
                onClick={() => handleSizeChange(size)}
                className={`px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-center ${isDark 
                  ? selectedSize.name === size.name 
                    ? 'bg-[#C02C38]/20 text-[#C02C38]' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                  : selectedSize.name === size.name 
                    ? 'bg-[#C02C38]/10 text-[#C02C38]' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                whileTap={{ scale: 0.95 }}
              >
                <span>{size.name}</span>
                {size.width && size.height && (
                  <span className="ml-1 text-[9px] opacity-70">
                    {size.width}x{size.height}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
          
          {/* 自定义尺寸输入 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">宽度</label>
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
              <label className="block text-xs font-medium mb-1.5">高度</label>
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
          
          {/* 尺寸信息 */}
          {selectedSize.name !== '自定义' && (
            <div className="mt-3 p-2 rounded-lg bg-[#C02C38]/10 text-xs">
              当前尺寸: {customSize.width} x {customSize.height} 像素
              {selectedLayout && (
                <span className="ml-2 text-[#C02C38]">
                  (推荐尺寸: {selectedLayout.recommendedSize.width} x {selectedLayout.recommendedSize.height} 像素)
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* 分类选择 */}
        <div className="flex overflow-x-auto space-x-2 mb-3 pb-2 scrollbar-hide scroll-smooth snap-x snap-mandatory">
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-all duration-200 ease-in-out snap-center flex items-center gap-1.5 ${isDark 
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
              <i className="fas fa-layer-group text-xs"></i>
              <span>
                {category === 'all' ? '全部' : 
                 category === 'poster' ? '海报' : 
                 category === 'social' ? '社交媒体' : 
                 category === 'banner' ? '横幅' : 
                 category === 'card' ? '卡片' : 
                 category === 'magazine' ? '杂志' : 
                 category === 'flyer' ? '传单' : 
                 category === 'brochure' ? '手册' : category}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 版式模板列表 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
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
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#C02C38] flex items-center justify-center z-20">
                    <i className="fas fa-check text-white text-[10px]"></i>
                  </div>
                )}
                {/* 分类标签 */}
                <div className="absolute top-2 left-2 bg-[#C02C38] text-white text-[9px] px-1.5 py-0.5 rounded">
                  {template.category === 'poster' ? '海报' : 
                   template.category === 'social' ? '社交媒体' : 
                   template.category === 'banner' ? '横幅' : 
                   template.category === 'card' ? '卡片' : 
                   template.category === 'magazine' ? '杂志' : 
                   template.category === 'flyer' ? '传单' : 
                   template.category === 'brochure' ? '手册' : template.category}
                </div>
              </div>
              <div className="p-2 bg-gray-100 dark:bg-gray-900">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-medium truncate">{template.name}</p>
                  <span className="text-[8px] px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">
                    {template.recommendedSize.width}x{template.recommendedSize.height}
                  </span>
                </div>
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
        <p className="text-xs text-center opacity-50 mt-2">
          {!selectedLayout ? '请选择一个版式模板' : 
           !customSize.width || !customSize.height ? '请设置尺寸' : 
           '点击生成按钮创建版式'}
        </p>
      </div>
    </div>
  );
};

export default LayoutPanel;