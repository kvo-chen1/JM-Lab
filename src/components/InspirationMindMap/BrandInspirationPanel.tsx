/**
 * 天津老字号灵感面板 - 升级版
 * 深化天津文化主题，更精美的视觉设计
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sparkles,
  Lightbulb,
  Palette,
  Utensils,
  Brush,
  Store,
  Plus,
  Wand2,
  X,
  ChevronRight,
  Check,
  Building2,
  History,
  MapPin,
  Star,
  Quote,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useTheme } from '@/hooks/useTheme';
import type { CulturalElement } from './types';
import { 
  BRANDS_DATA, 
  TIANJIN_QUOTES, 
  CATEGORIES,
  getCategoryColor,
  getTotalBrands,
  getTotalElements 
} from './brandsData';

interface BrandInspirationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddElement?: (element: CulturalElement & { brandId: string; brandName: string }) => void;
  onRequestAIAdvice?: (brandId: string, elementIds: string[]) => void;
}

export default function BrandInspirationPanel({
  isOpen,
  onClose,
  onAddElement,
  onRequestAIAdvice,
}: BrandInspirationPanelProps) {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // 随机天津话
  const randomQuote = TIANJIN_QUOTES[Math.floor(Math.random() * TIANJIN_QUOTES.length)];

  // 过滤品牌
  const filteredBrands = BRANDS_DATA.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         brand.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         brand.story.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || brand.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 获取当前选中的品牌
  const currentBrand = BRANDS_DATA.find(b => b.id === selectedBrand);

  if (!isOpen) return null;

  // 处理品牌选择
  const handleBrandClick = (brandId: string) => {
    setSelectedBrand(brandId);
    setShowDetailPanel(true);
    setSelectedElements([]);
  };

  // 处理元素选择
  const handleElementToggle = (elementId: string) => {
    setSelectedElements(prev => 
      prev.includes(elementId) 
        ? prev.filter(id => id !== elementId)
        : [...prev, elementId]
    );
  };

  // 添加元素到脉络
  const handleAddElement = (element: CulturalElement) => {
    if (currentBrand) {
      onAddElement?.({
        ...element,
        brandId: currentBrand.id,
        brandName: currentBrand.name,
      });
    }
  };

  // 添加所有选中元素
  const handleAddSelected = () => {
    if (currentBrand) {
      selectedElements.forEach(elementId => {
        const element = currentBrand.elements.find(e => e.id === elementId);
        if (element) {
          onAddElement?.({
            ...element,
            brandId: currentBrand.id,
            brandName: currentBrand.name,
          });
        }
      });
      setSelectedElements([]);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex">
      {/* 遮罩层 */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex-1 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 内容区域 */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="flex h-full"
      >
        {/* 主面板 */}
        <div className={`
          bg-white dark:bg-gray-900 shadow-2xl flex flex-col h-full
          transition-all duration-300
          ${showDetailPanel ? 'w-[600px]' : 'w-[900px]'}
        `}>
          {/* 头部 - 天津风格 */}
          <div className="relative overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-amber-500" />
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-1/4 translate-y-1/4" />
            </div>
            
            <div className="relative p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      天津老字号灵感库
                    </h2>
                  </div>
                  <p className="text-white/80 text-sm">
                    探索 {getTotalBrands()} 个传统文化品牌，提取 {getTotalElements()} 个创作元素
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              
              {/* 天津方言 */}
              <div className="mt-4 flex items-center gap-2 text-white/70 text-xs">
                <Quote className="w-3 h-3" />
                <span className="italic">"{randomQuote}"</span>
              </div>
            </div>
          </div>

          {/* 搜索和筛选 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索品牌、故事或元素..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-white dark:bg-gray-900"
              />
            </div>

            {/* 类别筛选 */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${!selectedCategory
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                全部
              </button>
              {CATEGORIES.map(category => {
                const Icon = category.id === 'food' ? Utensils : 
                            category.id === 'art' ? Brush : 
                            category.id === 'history' ? History :
                            category.id === 'commerce' ? Store : Palette;
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                    className={`
                      flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all
                      ${isSelected
                        ? `bg-gradient-to-r ${category.gradient} text-white shadow-md`
                        : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                      }
                    `}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 品牌网格 */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredBrands.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 opacity-30" />
                </div>
                <p className="text-gray-500">没有找到匹配的品牌</p>
                <p className="text-xs mt-1">试试其他关键词</p>
              </div>
            ) : (
              <div className={`grid gap-4 ${showDetailPanel ? 'grid-cols-2' : 'grid-cols-8'}`}>
                {filteredBrands.map((brand, index) => {
                  const colors = getCategoryColor(brand.category);
                  const isSelected = selectedBrand === brand.id;
                  
                  return (
                    <motion.button
                      key={brand.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleBrandClick(brand.id)}
                      className={`
                        group relative p-5 rounded-2xl border-2 text-left transition-all duration-300
                        ${isSelected
                          ? `border-transparent bg-gradient-to-br ${colors.gradient} text-white shadow-xl`
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-300 hover:shadow-lg hover:-translate-y-1'
                        }
                      `}
                    >
                      {/* 选中标记 */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      {/* 品牌图标 */}
                      <div className={`
                        w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-3
                        ${isSelected ? 'bg-white/20' : `bg-gradient-to-br ${colors.gradient}`}
                      `}>
                        {brand.image}
                      </div>
                      
                      {/* 品牌名称 */}
                      <h3 className={`font-bold text-base mb-1 line-clamp-1 ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {brand.name}
                      </h3>
                      
                      {/* 分类标签 */}
                      <span className={`
                        inline-block text-[10px] px-2.5 py-1 rounded-full mb-2 font-medium
                        ${isSelected 
                          ? 'bg-white/20 text-white' 
                          : `${colors.bg} ${colors.text} border ${colors.border}`
                        }
                      `}>
                        {brand.categoryName}
                      </span>
                      
                      {/* 创立年份 */}
                      <p className={`text-xs mb-2 flex items-center gap-1 ${isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                        <History className="w-3 h-3" />
                        {brand.founded}
                      </p>
                      
                      {/* 简介 */}
                      <p className={`text-xs line-clamp-2 ${isSelected ? 'text-white/70' : 'text-gray-600 dark:text-gray-400'}`}>
                        {brand.description}
                      </p>
                      
                      {/* 元素数量 */}
                      <div className={`mt-3 flex items-center gap-1 text-xs ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                        <Palette className="w-3 h-3" />
                        {brand.elements.length} 个创作元素
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 底部统计 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  共 <span className="font-bold text-amber-600">{getTotalBrands()}</span> 个老字号
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-amber-600">{getTotalElements()}</span> 个创作元素
                </span>
              </div>
              {selectedElements.length > 0 && (
                <span className="text-amber-600 font-medium text-sm">
                  已选择 {selectedElements.length} 个元素
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 详情面板 */}
        <AnimatePresence>
          {showDetailPanel && currentBrand && (
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              className="w-[420px] bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full"
            >
              {/* 详情头部 */}
              <div className="relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(currentBrand.category).gradient}`} />
                <div className="relative p-5">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-5xl">{currentBrand.image}</span>
                    <button
                      onClick={() => setShowDetailPanel(false)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <h3 className="font-bold text-xl text-white mb-2">
                    {currentBrand.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/20 text-white">
                      {currentBrand.categoryName}
                    </span>
                    <span className="text-xs text-white/70 flex items-center gap-1">
                      <History className="w-3 h-3" />
                      {currentBrand.founded}
                    </span>
                  </div>
                </div>
              </div>

              {/* 品牌故事 */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Quote className="w-4 h-4 text-amber-500" />
                  品牌故事
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {currentBrand.story}
                </p>
                
                {/* 荣誉标签 */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentBrand.honor.map((h, i) => (
                    <span 
                      key={i}
                      className="text-[10px] px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center gap-1"
                    >
                      <Star className="w-2.5 h-2.5" />
                      {h}
                    </span>
                  ))}
                </div>
                
                {/* 位置信息 */}
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5" />
                  {currentBrand.location}
                </div>
              </div>

              {/* 元素列表 */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-500" />
                    可提取元素
                  </h4>
                  {selectedElements.length > 0 && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      onClick={handleAddSelected}
                      className="text-xs px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
                    >
                      添加选中 ({selectedElements.length})
                    </motion.button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {currentBrand.elements.map((element, index) => {
                    const isSelected = selectedElements.includes(element.id);
                    return (
                      <motion.div
                        key={element.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                          p-4 rounded-xl border-2 transition-all duration-200 bg-white dark:bg-gray-900
                          ${isSelected
                            ? 'border-amber-500 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 hover:border-amber-300'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-semibold text-gray-900 dark:text-white">
                                {element.name}
                              </h5>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                                {element.type === 'visual' ? '视觉' : 
                                 element.type === 'craft' ? '工艺' : 
                                 element.type === 'story' ? '故事' : '味觉'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {element.description}
                            </p>
                            <span className="inline-block mt-2 text-[10px] px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                              寓意：{element.meaning}
                            </span>
                          </div>
                          <button
                            onClick={() => handleElementToggle(element.id)}
                            className={`
                              w-7 h-7 rounded-full flex items-center justify-center transition-all ml-3
                              ${isSelected
                                ? 'bg-amber-500 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200'
                              }
                            `}
                          >
                            {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </button>
                        </div>
                        <button
                          onClick={() => handleAddElement(element)}
                          className="mt-3 w-full py-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                        >
                          添加到脉络
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* AI建议按钮 */}
                {selectedElements.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <Button
                      onClick={() => onRequestAIAdvice?.(currentBrand.id, selectedElements)}
                      className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:shadow-lg hover:shadow-purple-200"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      获取AI创作建议
                    </Button>
                    <p className="text-center text-xs text-gray-400 mt-2">
                      AI将根据选中的元素生成创作灵感
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
