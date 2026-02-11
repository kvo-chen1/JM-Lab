/**
 * 老字号灵感面板 - 重新设计版
 * 采用三栏网格布局，提升信息密度和视觉美观度
 */

import React, { useState } from 'react';
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
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useTheme } from '@/hooks/useTheme';
import type { CulturalElement } from './types';

// 老字号品牌数据
const BRANDS_DATA = [
  {
    id: 'goubuli',
    name: '狗不理包子',
    category: 'food',
    categoryName: '老字号美食',
    founded: '1858年',
    description: '天津"三绝"之首，包子褶花匀称',
    image: '🥟',
    elements: [
      { id: 'goubuli-1', name: '十八个褶', type: 'visual', meaning: '象征圆满', description: '包子顶部的十八道褶纹' },
      { id: 'goubuli-2', name: '圆润形态', type: 'visual', meaning: '团团圆圆', description: '包子圆润饱满的造型' },
      { id: 'goubuli-3', name: '蒸汽升腾', type: 'visual', meaning: '蒸蒸日上', description: '热气腾腾的场景' },
    ],
  },
  {
    id: 'guifax',
    name: '桂发祥十八街麻花',
    category: 'food',
    categoryName: '老字号美食',
    founded: '1927年',
    description: '天津"三绝"之一，香酥可口',
    image: '🥨',
    elements: [
      { id: 'guifax-1', name: '螺旋纹理', type: 'visual', meaning: '连绵不断', description: '麻花独特的螺旋形状' },
      { id: 'guifax-2', name: '金黄酥脆', type: 'visual', meaning: '富贵吉祥', description: '油炸后的金黄色泽' },
      { id: 'guifax-3', name: '多股缠绕', type: 'craft', meaning: '团结和谐', description: '多股面条缠绕的工艺' },
    ],
  },
  {
    id: 'erduoyan',
    name: '耳朵眼炸糕',
    category: 'food',
    categoryName: '老字号美食',
    founded: '清光绪年间',
    description: '天津"三绝"之一，外酥里糯',
    image: '🍘',
    elements: [
      { id: 'erduoyan-1', name: '外酥里嫩', type: 'visual', meaning: '表里如一', description: '外层酥脆，内里软糯' },
      { id: 'erduoyan-2', name: '豆沙馅料', type: 'visual', meaning: '甜甜蜜蜜', description: '传统豆沙馅的深红色' },
      { id: 'erduoyan-3', name: '胡同文化', type: 'story', meaning: '市井生活', description: '耳朵眼胡同的历史故事' },
    ],
  },
  {
    id: 'nirenzhang',
    name: '泥人张彩塑',
    category: 'art',
    categoryName: '传统艺术',
    founded: '清道光年间',
    description: '天津民间艺术，形象生动',
    image: '🎨',
    elements: [
      { id: 'nirenzhang-1', name: '细腻写实', type: 'craft', meaning: '精益求精', description: '人物表情细腻逼真' },
      { id: 'nirenzhang-2', name: '鲜艳色彩', type: 'visual', meaning: '丰富多彩', description: '明快艳丽的配色方案' },
      { id: 'nirenzhang-3', name: '圆润造型', type: 'visual', meaning: '亲和可爱', description: '人物造型圆润饱满' },
    ],
  },
  {
    id: 'fengzhengwei',
    name: '风筝魏',
    category: 'art',
    categoryName: '传统艺术',
    founded: '1915年',
    description: '巴拿马金奖，做工精细',
    image: '🪁',
    elements: [
      { id: 'fengzhengwei-1', name: '对称结构', type: 'visual', meaning: '平衡和谐', description: '风筝的对称设计' },
      { id: 'fengzhengwei-2', name: '彩绘图案', type: 'visual', meaning: '色彩斑斓', description: '传统彩绘技艺' },
      { id: 'fengzhengwei-3', name: '竹骨架构', type: 'craft', meaning: '坚韧挺拔', description: '竹子骨架的轻盈' },
    ],
  },
  {
    id: 'yangliuqing',
    name: '杨柳青年画',
    category: 'art',
    categoryName: '传统艺术',
    founded: '明代崇祯年间',
    description: '中国著名民间木版年画',
    image: '🖼️',
    elements: [
      { id: 'yangliuqing-1', name: '木版印刷', type: 'craft', meaning: '传统技艺', description: '木版水印工艺' },
      { id: 'yangliuqing-2', name: '胖娃娃', type: 'visual', meaning: '多子多福', description: '经典胖娃娃形象' },
      { id: 'yangliuqing-3', name: '红蓝配色', type: 'visual', meaning: '喜庆吉祥', description: '传统的红蓝对比色' },
    ],
  },
];

// 类别配置
const CATEGORIES = [
  { id: 'food', name: '美食', icon: Utensils, color: 'amber' },
  { id: 'art', name: '艺术', icon: Brush, color: 'rose' },
  { id: 'commerce', name: '商业', icon: Store, color: 'blue' },
  { id: 'history', name: '历史', icon: History, color: 'emerald' },
];

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

  // 过滤品牌
  const filteredBrands = BRANDS_DATA.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         brand.description.toLowerCase().includes(searchQuery.toLowerCase());
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

  // 获取类别颜色
  const getCategoryColor = (categoryId: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      food: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      art: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
      commerce: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      history: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    };
    return colors[categoryId] || colors.food;
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* 遮罩层 */}
      <div 
        className="flex-1 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 内容区域 */}
      <div className="flex h-full">
        {/* 主面板 */}
        <div className={`
          bg-white dark:bg-gray-900 shadow-2xl flex flex-col h-full
          transition-all duration-300
          ${showDetailPanel ? 'w-[600px]' : 'w-[900px]'}
        `}>
        {/* 头部 */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-amber-600" />
              天津老字号灵感库
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              探索 {BRANDS_DATA.length} 个传统文化品牌，提取创作元素
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索品牌名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* 类别筛选 */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-all
                ${!selectedCategory
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                }
              `}
            >
              全部
            </button>
            {CATEGORIES.map(category => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
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
              <Search className="w-12 h-12 mb-4 opacity-30" />
              <p>没有找到匹配的品牌</p>
            </div>
          ) : (
            <div className={`grid gap-3 ${showDetailPanel ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {filteredBrands.map((brand) => {
                const colors = getCategoryColor(brand.category);
                const isSelected = selectedBrand === brand.id;
                
                return (
                  <button
                    key={brand.id}
                    onClick={() => handleBrandClick(brand.id)}
                    className={`
                      group relative p-4 rounded-xl border-2 text-left transition-all duration-200
                      ${isSelected
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5'
                      }
                      ${colors.bg}
                    `}
                  >
                    {/* 选中标记 */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    
                    {/* 品牌图标 */}
                    <div className="text-3xl mb-2">{brand.image}</div>
                    
                    {/* 品牌名称 */}
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 line-clamp-1">
                      {brand.name}
                    </h3>
                    
                    {/* 分类标签 */}
                    <span className={`
                      inline-block text-[10px] px-2 py-0.5 rounded-full mb-2
                      ${colors.bg} ${colors.text} border ${colors.border}
                    `}>
                      {brand.categoryName}
                    </span>
                    
                    {/* 创立年份 */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <History className="w-3 h-3 inline mr-1" />
                      {brand.founded}
                    </p>
                    
                    {/* 简介 */}
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {brand.description}
                    </p>
                    
                    {/* 元素数量 */}
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                      <Palette className="w-3 h-3" />
                      {brand.elements.length} 个元素
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部统计 */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              共 <span className="font-semibold text-amber-600">{BRANDS_DATA.length}</span> 个老字号
            </span>
            {selectedElements.length > 0 && (
              <span className="text-amber-600 font-medium">
                已选择 {selectedElements.length} 个元素
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 详情面板 */}
      {showDetailPanel && currentBrand && (
        <div className="w-96 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
          {/* 详情头部 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-start justify-between mb-3">
              <span className="text-4xl">{currentBrand.image}</span>
              <button
                onClick={() => setShowDetailPanel(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              {currentBrand.name}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className={`
                text-xs px-2 py-0.5 rounded-full
                ${getCategoryColor(currentBrand.category).bg}
                ${getCategoryColor(currentBrand.category).text}
              `}>
                {currentBrand.categoryName}
              </span>
              <span className="text-xs text-gray-500">
                {currentBrand.founded}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              {currentBrand.description}
            </p>
          </div>

          {/* 元素列表 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-500" />
                可提取元素
              </h4>
              {selectedElements.length > 0 && (
                <button
                  onClick={handleAddSelected}
                  className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors"
                >
                  添加选中 ({selectedElements.length})
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {currentBrand.elements.map(element => {
                const isSelected = selectedElements.includes(element.id);
                return (
                  <div
                    key={element.id}
                    className={`
                      p-3 rounded-lg border-2 transition-all duration-200
                      ${isSelected
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                          {element.name}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {element.description}
                        </p>
                        <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {element.meaning}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 ml-2">
                        <button
                          onClick={() => handleElementToggle(element.id)}
                          className={`
                            w-6 h-6 rounded-full flex items-center justify-center transition-colors
                            ${isSelected
                              ? 'bg-amber-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300'
                            }
                          `}
                        >
                          {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddElement(element)}
                      className="mt-2 w-full py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                    >
                      添加到脉络
                    </button>
                  </div>
                );
              })}
            </div>

            {/* AI建议按钮 */}
            {selectedElements.length > 0 && (
              <Button
                onClick={() => onRequestAIAdvice?.(currentBrand.id, selectedElements)}
                className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                获取AI创作建议
              </Button>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
