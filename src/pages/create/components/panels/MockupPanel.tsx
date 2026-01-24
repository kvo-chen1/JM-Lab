import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';

// 定义Mockup类型
interface MockupTemplate {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
  category: 'apparel' | 'product' | 'print' | 'digital';
  mockupUrl: string;
  previewUrl: string; // 添加预览图URL
  resolution: string; // 添加分辨率信息
}

// 图片加载状态类型
type ImageLoadState = 'loading' | 'loaded' | 'error';

// Mockup模板数据 - 使用真实的免费图片资源
const mockupTemplates: MockupTemplate[] = [
  {
    id: 'apparel-tshirt',
    name: 'T恤',
    thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
    description: '经典T恤款式，适合各种设计',
    category: 'apparel',
    mockupUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop',
    previewUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
    resolution: '高清'
  },
  {
    id: 'apparel-hoodie',
    name: '连帽衫',
    thumbnail: 'https://images.unsplash.com/photo-1588032771953-93d988e5a7c5?w=300&h=300&fit=crop',
    description: '舒适连帽衫，适合休闲风格设计',
    category: 'apparel',
    mockupUrl: 'https://images.unsplash.com/photo-1588032771953-93d988e5a7c5?w=600&h=600&fit=crop',
    previewUrl: 'https://images.unsplash.com/photo-1588032771953-93d988e5a7c5?w=800&h=800&fit=crop',
    resolution: '高清'
  },
  {
    id: 'product-mug',
    name: '马克杯',
    thumbnail: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop',
    description: '陶瓷马克杯，适合图案和文字设计',
    category: 'product',
    mockupUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop',
    previewUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop',
    resolution: '超高清'
  },
  {
    id: 'product-phone',
    name: '手机壳',
    thumbnail: 'https://images.unsplash.com/photo-1593642532009-6ba71e22f468?w=300&h=300&fit=crop',
    description: '智能手机壳，适合各种创意设计',
    category: 'product',
    mockupUrl: 'https://images.unsplash.com/photo-1593642532009-6ba71e22f468?w=600&h=600&fit=crop',
    previewUrl: 'https://images.unsplash.com/photo-1593642532009-6ba71e22f468?w=800&h=800&fit=crop',
    resolution: '超高清'
  },
  {
    id: 'print-poster',
    name: '海报框架',
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&h=300&fit=crop',
    description: '木质海报框架，适合展示海报设计',
    category: 'print',
    mockupUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=600&fit=crop',
    previewUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=800&fit=crop',
    resolution: '高清'
  },
  {
    id: 'print-businesscard',
    name: '名片',
    thumbnail: 'https://images.unsplash.com/photo-1586525046412-022a64a6d589?w=300&h=300&fit=crop',
    description: '标准名片尺寸，适合专业设计',
    category: 'print',
    mockupUrl: 'https://images.unsplash.com/photo-1586525046412-022a64a6d589?w=600&h=600&fit=crop',
    previewUrl: 'https://images.unsplash.com/photo-1586525046412-022a64a6d589?w=800&h=800&fit=crop',
    resolution: '超高清'
  },
  {
    id: 'digital-laptop',
    name: '笔记本电脑',
    thumbnail: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop',
    description: '笔记本电脑屏幕，适合展示网页和应用设计',
    category: 'digital',
    mockupUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop',
    previewUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop',
    resolution: '超高清'
  },
  {
    id: 'digital-mobile',
    name: '手机屏幕',
    thumbnail: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=300&h=300&fit=crop',
    description: '手机屏幕，适合展示移动应用设计',
    category: 'digital',
    mockupUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&h=600&fit=crop',
    previewUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&h=800&fit=crop',
    resolution: '高清'
  },
  // 新增更多模型模板
  {
    id: 'product-bag',
    name: '手提袋',
    thumbnail: 'https://images.unsplash.com/photo-1597633518355-822a132b5d38?w=300&h=300&fit=crop',
    description: '时尚手提袋，适合品牌设计展示',
    category: 'product',
    mockupUrl: 'https://images.unsplash.com/photo-1597633518355-822a132b5d38?w=600&h=600&fit=crop',
    previewUrl: 'https://images.unsplash.com/photo-1597633518355-822a132b5d38?w=800&h=800&fit=crop',
    resolution: '高清'
  },
  {
    id: 'digital-tablet',
    name: '平板屏幕',
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
    description: '平板设备屏幕，适合应用设计预览',
    category: 'digital',
    mockupUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
    previewUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
    resolution: '超高清'
  }
];

const MockupPanel: React.FC = () => {
  const { isDark } = useTheme();
  const { updateState, mockupSelectedTemplateId, mockupShowWireframe } = useCreateStore();

  // Derive selectedMockup from ID
  const selectedMockup = React.useMemo(() => 
    mockupTemplates.find(t => t.id === mockupSelectedTemplateId) || null,
    [mockupSelectedTemplateId]
  );
  
  // Use store state
  const showWireframe = mockupShowWireframe;

  // const [selectedMockup, setSelectedMockup] = useState<MockupTemplate | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [previewQuality, setPreviewQuality] = useState<'low' | 'medium' | 'high'>('medium');
  // const [showWireframe, setShowWireframe] = useState<boolean>(false); // 新增线框图开关
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 新增缩放级别
  const [renderingProgress, setRenderingProgress] = useState<number>(0); // 新增渲染进度
  
  // 图片加载状态管理
  const [thumbnailLoadStates, setThumbnailLoadStates] = useState<Record<string, ImageLoadState>>({});
  const [mockupLoadState, setMockupLoadState] = useState<ImageLoadState>('loading');
  const [isRendering, setIsRendering] = useState<boolean>(false); // 新增渲染状态

  // 获取所有分类
  const categories = ['all', ...Array.from(new Set(mockupTemplates.map(template => template.category)))];

  // 过滤Mockup模板
  const filteredTemplates = activeCategory === 'all'
    ? mockupTemplates
    : mockupTemplates.filter(template => template.category === activeCategory);

  // 处理Mockup选择
  const handleMockupSelect = (mockup: MockupTemplate) => {
    setSelectedMockup(mockup);
    setMockupLoadState('loading'); // 重置预览图加载状态
    setZoomLevel(1); // 重置缩放级别
  };

  // 应用Mockup
  const handleApplyMockup = () => {
    if (!selectedMockup) return;
    
    setIsApplying(true);
    
    // 模拟应用过程
    setTimeout(() => {
      updateState({
        aiExplanation: `已应用${selectedMockup.name}模型模板，预览质量为${previewQuality === 'low' ? '低' : previewQuality === 'medium' ? '中' : '高'}${showWireframe ? '（带线框图）' : ''}`,
        showAIReview: true
      });
      setIsApplying(false);
    }, 2000);
  };

  // 处理图片加载完成
  const handleImageLoad = (templateId: string, isThumbnail: boolean = true) => {
    if (isThumbnail) {
      setThumbnailLoadStates(prev => ({
        ...prev,
        [templateId]: 'loaded'
      }));
    } else {
      setMockupLoadState('loaded');
    }
  };

  // 获取图片加载状态 - 简化逻辑，直接返回加载完成状态
  const getImageState = (templateId: string, isThumbnail: boolean = true): ImageLoadState => {
    // 简化逻辑，默认显示图片，不再等待加载状态
    return 'loaded';
  };

  // 处理渲染预览
  const handleRenderPreview = () => {
    if (!selectedMockup) return;
    
    setIsRendering(true);
    setRenderingProgress(0);
    
    // 模拟渲染过程
    const interval = setInterval(() => {
      setRenderingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRendering(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // 分类名称映射
  const categoryNameMap: Record<string, string> = {
    all: '全部',
    apparel: '服装',
    product: '产品',
    print: '印刷',
    digital: '数码'
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">模型预览</h3>
        <p className="text-xs opacity-70 mb-3">将设计应用到各种实物模型，预览最终效果</p>
        
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
              <span>{categoryNameMap[category]}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Mockup模板列表 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {filteredTemplates.map((mockup) => {
          const isSelected = selectedMockup?.id === mockup.id;
          const imageState = getImageState(mockup.id, true);
          
          return (
            <motion.button
              key={mockup.id}
              onClick={() => handleMockupSelect(mockup)}
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
                {/* 图片加载状态 */}
                {imageState === 'loading' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800 animate-pulse">
                    <i className="fas fa-spinner fa-spin text-gray-500 dark:text-gray-400"></i>
                  </div>
                )}
                
                <img
                  src={mockup.thumbnail}
                  alt={mockup.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-100"
                  onLoad={() => handleImageLoad(mockup.id, true)}
                  onError={(e) => {
                    // 图片加载失败时显示占位符
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/300x300?text=${encodeURIComponent(mockup.name)}`;
                  }}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 z-10">
                  <p className="text-white text-xs font-medium">{mockup.name}</p>
                </div>
                
                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#C02C38] flex items-center justify-center z-20">
                    <i className="fas fa-check text-white text-[10px]"></i>
                  </div>
                )}
                
                {/* 分辨率标签 */}
                <div className="absolute top-2 left-2 bg-[#C02C38] text-white text-[9px] px-1.5 py-0.5 rounded">
                  {mockup.resolution}
                </div>
              </div>
              <div className="p-2 bg-gray-100 dark:bg-gray-900">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-medium truncate">{mockup.name}</p>
                  <span className="text-[8px] px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">
                    {mockup.category === 'apparel' ? '服装' : 
                     mockup.category === 'product' ? '产品' : 
                     mockup.category === 'print' ? '印刷' : 
                     mockup.category === 'digital' ? '数码' : mockup.category}
                  </span>
                </div>
                <p className="text-[9px] opacity-70 truncate mt-1">{mockup.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Mockup预览和设置 */}
      {selectedMockup && (
        <div className={`rounded-lg border p-4 mb-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <i className="fas fa-eye"></i>
            预览设置
          </h4>
          
          {/* 渲染进度条 */}
          {isRendering && (
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span>渲染中...</span>
                <span>{renderingProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full bg-[#C02C38] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${renderingProgress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>
          )}
          
          {/* Mockup预览图 */}
          <div className={`rounded-lg overflow-hidden mb-3 bg-gray-100 dark:bg-gray-800 relative ${showWireframe ? 'border border-dashed border-[#C02C38]/30' : ''}`}>
            {/* 加载状态 */}
            {mockupLoadState === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800 animate-pulse z-10">
                <i className="fas fa-spinner fa-spin text-gray-500 dark:text-gray-400"></i>
              </div>
            )}
            
            {/* 预览图片 */}
            <motion.div
              className="relative overflow-hidden"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={selectedMockup.previewUrl}
                alt={`${selectedMockup.name}预览`}
                className="w-full h-auto object-cover"
                onLoad={() => handleImageLoad(selectedMockup.id, false)}
                onError={(e) => {
                  // 图片加载失败时显示占位符
                  const target = e.target as HTMLImageElement;
                  target.src = `https://via.placeholder.com/800x800?text=${encodeURIComponent(`${selectedMockup.name}预览`)}`;
                }}
              />
              
              {/* 线框图覆盖层 */}
              {showWireframe && (
                <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
              )}
            </motion.div>
            
            {/* 缩放控制 */}
            <div className="absolute bottom-2 right-2 flex gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
              <motion.button
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                className="text-white text-xs p-1 rounded-full hover:bg-white/20 transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                <i className="fas fa-search-minus"></i>
              </motion.button>
              <span className="text-white text-xs py-1">{Math.round(zoomLevel * 100)}%</span>
              <motion.button
                onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.25))}
                className="text-white text-xs p-1 rounded-full hover:bg-white/20 transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                <i className="fas fa-search-plus"></i>
              </motion.button>
            </div>
          </div>
          
          {/* 质量和显示设置 */}
          <div className="grid grid-cols-1 gap-4 mb-3">
            {/* 预览质量设置 */}
            <div>
              <label className="block text-xs font-medium mb-2 flex items-center gap-1.5">
                <i className="fas fa-image"></i>
                预览质量
              </label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((quality) => (
                  <motion.button
                    key={quality}
                    onClick={() => setPreviewQuality(quality)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 ${isDark 
                      ? previewQuality === quality 
                        ? 'bg-[#C02C38]/20 text-[#C02C38]' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                      : previewQuality === quality 
                        ? 'bg-[#C02C38]/10 text-[#C02C38]' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <i className={`fas fa-${quality === 'low' ? 'bolt' : quality === 'medium' ? 'clock' : 'rocket'} text-[10px]`}></i>
                    <span>{quality === 'low' ? '低（快）' : quality === 'medium' ? '中（平衡）' : '高（精细）'}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* 高级显示选项 */}
            <div className="grid grid-cols-2 gap-2">
              {/* 线框图开关 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <i className="fas fa-grid text-xs text-[#C02C38]"></i>
                  <span className="text-xs">显示线框图</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showWireframe}
                    onChange={(e) => updateState({ mockupShowWireframe: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer ${showWireframe ? 'bg-[#C02C38]' : 'bg-gray-600'} peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#C02C38] peer-focus:ring-opacity-50 transition-all duration-300`}></div>
                  <div className={`absolute left-1.5 top-1.5 bg-white w-3 h-3 rounded-full transition-transform duration-300 ${showWireframe ? 'transform translate-x-5' : ''}`}></div>
                </div>
              </label>
              </div>

              {/* 渲染按钮 */}
              <motion.button
                onClick={handleRenderPreview}
                disabled={isRendering}
                className={`px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 ${isDark 
                  ? isRendering 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                  : isRendering 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                whileTap={!isRendering ? { scale: 0.95 } : {}}
              >
                <i className="fas fa-magic text-[10px]"></i>
                <span>{isRendering ? '渲染中...' : '渲染预览'}</span>
              </motion.button>
            </div>
          </div>
          
          {/* Mockup信息 */}
          <div className="p-3 rounded-lg bg-[#C02C38]/10 dark:bg-[#C02C38]/20 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="opacity-70">模型名称：</span>
                <span className="font-medium">{selectedMockup.name}</span>
              </div>
              <div>
                <span className="opacity-70">分辨率：</span>
                <span className="font-medium">{selectedMockup.resolution}</span>
              </div>
              <div>
                <span className="opacity-70">分类：</span>
                <span className="font-medium">{categoryNameMap[selectedMockup.category]}</span>
              </div>
              <div>
                <span className="opacity-70">当前质量：</span>
                <span className="font-medium">{previewQuality === 'low' ? '低' : previewQuality === 'medium' ? '中' : '高'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 应用按钮 */}
      <div className="mt-auto">
        <motion.button
          onClick={handleApplyMockup}
          disabled={!selectedMockup || isApplying}
          className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ${isDark 
            ? !selectedMockup 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : isApplying 
                ? 'bg-[#C02C38]/70 text-white cursor-not-allowed' 
                : 'bg-[#C02C38] text-white hover:bg-[#A0232F] shadow-lg shadow-[#C02C38]/30' 
            : !selectedMockup 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : isApplying 
                ? 'bg-[#C02C38]/70 text-white cursor-not-allowed' 
                : 'bg-[#C02C38] text-white hover:bg-[#A0232F] shadow-lg shadow-[#C02C38]/30'}`}
          whileHover={selectedMockup && !isApplying ? { scale: 1.02 } : {}}
          whileTap={selectedMockup && !isApplying ? { scale: 0.98 } : {}}
        >
          {isApplying ? (
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-spinner fa-spin text-sm"></i>
              <span>应用中...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-box-open text-sm"></i>
              <span>应用模型</span>
            </div>
          )}
        </motion.button>
        <p className="text-xs text-center opacity-50 mt-2">
          {!selectedMockup ? '请选择一个模型模板' : 
           isApplying ? '正在应用模型模板...' : 
           '点击应用按钮将模型应用到设计中'}
        </p>
      </div>
    </div>
  );
};

export default MockupPanel;