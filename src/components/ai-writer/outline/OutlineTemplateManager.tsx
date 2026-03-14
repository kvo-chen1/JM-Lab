import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import type { OutlineTemplate } from './types';
import { sampleTemplates } from '../TemplatePreview';
import { convertTemplateToOutline } from './utils';
import {
  X,
  Plus,
  Trash2,
  Download,
  Upload,
  Search,
  Clock,
  Star,
  FileText,
  Check,
  Grid3X3,
  List,
  Filter,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Users,
  Briefcase,
  Megaphone,
  Share2,
  GraduationCap,
  Calendar,
  Eye,
  Bookmark,
} from 'lucide-react';

interface OutlineTemplateManagerProps {
  onClose: () => void;
  onLoad: (outline: OutlineTemplate) => void;
  currentOutline: OutlineTemplate;
}

// 分类配置
const categoryConfig: Record<string, { icon: React.ReactNode; color: string; gradient: string }> = {
  '商业文档': {
    icon: <Briefcase className="w-4 h-4" />,
    color: '#3b82f6',
    gradient: 'from-blue-500 to-blue-600',
  },
  '产品文档': {
    icon: <FileText className="w-4 h-4" />,
    color: '#10b981',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  '营销推广': {
    icon: <Megaphone className="w-4 h-4" />,
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-500',
  },
  '社交媒体': {
    icon: <Share2 className="w-4 h-4" />,
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-600',
  },
  '人力资源': {
    icon: <Users className="w-4 h-4" />,
    color: '#ec4899',
    gradient: 'from-pink-500 to-rose-500',
  },
  '活动策划': {
    icon: <Calendar className="w-4 h-4" />,
    color: '#06b6d4',
    gradient: 'from-cyan-500 to-teal-500',
  },
  '教育培训': {
    icon: <GraduationCap className="w-4 h-4" />,
    color: '#f97316',
    gradient: 'from-orange-500 to-red-500',
  },
};

export const OutlineTemplateManager: React.FC<OutlineTemplateManagerProps> = ({
  onClose,
  onLoad,
  currentOutline,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'default' | 'custom'>('default');
  const [customTemplates, setCustomTemplates] = useState<OutlineTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'name'>('popular');

  useEffect(() => {
    const saved = localStorage.getItem('custom_outlines');
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load custom templates:', e);
      }
    }
  }, []);

  const defaultOutlines = useMemo(() => sampleTemplates.map(convertTemplateToOutline), []);

  // 获取所有分类
  const categories = useMemo(() => {
    const cats = new Set<string>();
    defaultOutlines.forEach((o) => cats.add(o.category));
    return Array.from(cats);
  }, [defaultOutlines]);

  // 筛选和排序模板
  const filteredTemplates = useMemo(() => {
    let templates = activeTab === 'default' ? defaultOutlines : customTemplates;

    // 搜索筛选
    if (searchQuery) {
      templates = templates.filter(
        (outline) =>
          outline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          outline.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          outline.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // 分类筛选
    if (selectedCategory !== 'all') {
      templates = templates.filter((outline) => outline.category === selectedCategory);
    }

    // 排序
    switch (sortBy) {
      case 'popular':
        templates = [...templates].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        break;
      case 'newest':
        templates = [...templates].sort((a, b) => b.updatedAt - a.updatedAt);
        break;
      case 'name':
        templates = [...templates].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
        break;
    }

    return templates;
  }, [activeTab, defaultOutlines, customTemplates, searchQuery, selectedCategory, sortBy]);

  const handleSaveCurrent = () => {
    const templateToSave = {
      ...currentOutline,
      id: `custom-${Date.now()}`,
      name: `${currentOutline.name} (副本)`,
      updatedAt: Date.now(),
      isCustom: true,
    };

    const updated = [templateToSave, ...customTemplates];
    setCustomTemplates(updated);
    localStorage.setItem('custom_outlines', JSON.stringify(updated));
    toast.success('已保存为自定义模板');
  };

  const handleDelete = (id: string) => {
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    localStorage.setItem('custom_outlines', JSON.stringify(updated));
    setShowDeleteConfirm(null);
    toast.success('模板已删除');
  };

  const handleExport = (outline: OutlineTemplate) => {
    const data = JSON.stringify(outline, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${outline.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('模板已导出');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.sections && Array.isArray(imported.sections)) {
          const templateToSave = {
            ...imported,
            id: `imported-${Date.now()}`,
            updatedAt: Date.now(),
            isCustom: true,
          };
          const updated = [templateToSave, ...customTemplates];
          setCustomTemplates(updated);
          localStorage.setItem('custom_outlines', JSON.stringify(updated));
          toast.success('模板导入成功');
        } else {
          toast.error('无效的模板文件');
        }
      } catch (err) {
        toast.error('导入失败：文件格式错误');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getCategoryStyle = (category: string) => {
    return (
      categoryConfig[category] || {
        icon: <FileText className="w-4 h-4" />,
        color: '#6b7280',
        gradient: 'from-gray-500 to-gray-600',
      }
    );
  };

  // 渲染网格视图卡片
  const renderGridCard = (outline: OutlineTemplate, isCustom: boolean = false) => {
    const categoryStyle = getCategoryStyle(outline.category);
    const isHovered = hoveredTemplate === outline.id;
    const isCurrent = currentOutline.id === outline.id;

    return (
      <motion.div
        key={outline.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onMouseEnter={() => setHoveredTemplate(outline.id)}
        onMouseLeave={() => setHoveredTemplate(null)}
        onClick={() => onLoad(outline)}
        className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
          isCurrent
            ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
            : 'hover:shadow-xl'
        } ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        style={{
          boxShadow: isHovered
            ? `0 20px 40px -10px ${categoryStyle.color}30`
            : isDark
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* 顶部彩色条 */}
        <div
          className={`h-1.5 bg-gradient-to-r ${categoryStyle.gradient}`}
        />

        <div className="p-5">
          {/* 头部：分类和标签 */}
          <div className="flex items-center justify-between mb-3">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${categoryStyle.color}15`,
                color: categoryStyle.color,
              }}
            >
              {categoryStyle.icon}
              {outline.category}
            </div>
            {outline.isFeatured && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                <Star className="w-3 h-3" />
                精选
              </span>
            )}
            {isCurrent && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                <Check className="w-3 h-3" />
                当前
              </span>
            )}
          </div>

          {/* 标题 */}
          <h3
            className={`font-bold text-lg mb-2 line-clamp-1 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            {outline.name}
          </h3>

          {/* 描述 */}
          <p
            className={`text-sm mb-4 line-clamp-2 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {outline.description}
          </p>

          {/* 统计信息 */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Eye className="w-3.5 h-3.5" />
              {(outline.usageCount || 0).toLocaleString()}
            </div>
            <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <FileText className="w-3.5 h-3.5" />
              {outline.sections.length} 章节
            </div>
            <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Clock className="w-3.5 h-3.5" />
              {new Date(outline.updatedAt).toLocaleDateString('zh-CN')}
            </div>
          </div>

          {/* 标签 */}
          {outline.tags && outline.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {outline.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className={`px-2 py-0.5 rounded-md text-xs ${
                    isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  #{tag}
                </span>
              ))}
              {outline.tags.length > 3 && (
                <span
                  className={`px-2 py-0.5 rounded-md text-xs ${
                    isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  +{outline.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* 悬停操作按钮 */}
          <AnimatePresence>
            {isHovered && isCustom && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-3 right-3 flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleExport(outline)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-white hover:bg-gray-100 text-gray-600 shadow-sm'
                  }`}
                  title="导出"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(outline.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-gray-700 hover:bg-red-500/20 text-red-400'
                      : 'bg-white hover:bg-red-50 text-red-500 shadow-sm'
                  }`}
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 底部渐变遮罩 */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t ${
            isDark ? 'from-gray-800' : 'from-white'
          } to-transparent pointer-events-none`}
        />
      </motion.div>
    );
  };

  // 渲染列表视图行
  const renderListRow = (outline: OutlineTemplate, isCustom: boolean = false) => {
    const categoryStyle = getCategoryStyle(outline.category);
    const isCurrent = currentOutline.id === outline.id;

    return (
      <motion.div
        key={outline.id}
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        onClick={() => onLoad(outline)}
        className={`group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
          isCurrent
            ? isDark
              ? 'bg-blue-500/10 border border-blue-500/30'
              : 'bg-blue-50 border border-blue-200'
            : isDark
            ? 'hover:bg-gray-700/50 border border-transparent'
            : 'hover:bg-gray-50 border border-transparent'
        }`}
      >
        {/* 分类图标 */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${categoryStyle.color}15`, color: categoryStyle.color }}
        >
          {categoryStyle.icon}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {outline.name}
            </h3>
            {outline.isFeatured && (
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            )}
            {isCurrent && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                当前
              </span>
            )}
          </div>
          <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {outline.description}
          </p>
        </div>

        {/* 统计 */}
        <div className={`hidden md:flex items-center gap-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            {outline.sections.length} 章节
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            {(outline.usageCount || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {new Date(outline.updatedAt).toLocaleDateString('zh-CN')}
          </div>
        </div>

        {/* 操作 */}
        {isCustom && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExport(outline);
              }}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
              }`}
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(outline.id);
              }}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'
              }`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 主容器 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative w-full max-w-6xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden ${
          isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
        {/* 头部 */}
        <div
          className={`flex items-center justify-between px-8 py-5 border-b ${
            isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600`}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                模板库
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                选择专业模板快速开始创作
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2.5 rounded-xl transition-colors ${
              isDark
                ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 工具栏 */}
        <div
          className={`flex flex-wrap items-center gap-4 px-8 py-4 border-b ${
            isDark
              ? 'border-gray-800 bg-gray-900/50'
              : 'border-gray-200 bg-white/50'
          }`}
        >
          {/* 搜索 */}
          <div className="flex-1 min-w-[200px] relative">
            <Search
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索模板名称、描述或标签..."
              className={`w-full pl-11 pr-4 py-2.5 rounded-xl text-sm border transition-colors ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              }`}
            />
          </div>

          {/* 分类筛选 */}
          <div className="flex items-center gap-2">
            <Filter className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`px-3 py-2.5 rounded-xl text-sm border transition-colors ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="all">全部分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 排序 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`px-3 py-2.5 rounded-xl text-sm border transition-colors ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <option value="popular">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              最受欢迎
            </option>
            <option value="newest">最新发布</option>
            <option value="name">名称排序</option>
          </select>

          {/* 视图切换 */}
          <div
            className={`flex items-center rounded-xl p-1 ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}
          >
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? isDark
                    ? 'bg-gray-700 text-white'
                    : 'bg-white text-gray-900 shadow-sm'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? isDark
                    ? 'bg-gray-700 text-white'
                    : 'bg-white text-gray-900 shadow-sm'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Tab切换 */}
          <div className="flex items-center rounded-xl overflow-hidden border">
            <button
              onClick={() => setActiveTab('default')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'default'
                  ? 'bg-blue-600 text-white'
                  : isDark
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              官方模板 ({defaultOutlines.length})
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'custom'
                  ? 'bg-blue-600 text-white'
                  : isDark
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              我的模板 ({customTemplates.length})
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-8 overflow-auto max-h-[calc(85vh-200px)]">
          <AnimatePresence mode="wait">
            {activeTab === 'default' ? (
              <motion.div
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-16">
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        isDark ? 'bg-gray-800' : 'bg-gray-100'
                      }`}
                    >
                      <Search className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      未找到匹配的模板
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      尝试调整搜索关键词或筛选条件
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        共找到 <span className="font-semibold text-blue-600">{filteredTemplates.length}</span> 个模板
                      </p>
                    </div>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredTemplates.map((outline) => renderGridCard(outline, false))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredTemplates.map((outline) => renderListRow(outline, false))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="custom"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-16">
                    <div
                      className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
                        isDark ? 'bg-gray-800' : 'bg-gray-100'
                      }`}
                    >
                      <Bookmark className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      暂无自定义模板
                    </h3>
                    <p className={`text-sm mb-6 max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      将当前编辑的大纲保存为模板，方便下次快速使用。您也可以导入外部模板文件。
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={handleSaveCurrent}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        保存当前大纲
                      </button>
                      <label className="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-dashed cursor-pointer transition-colors flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        导入模板
                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                      </label>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        共 <span className="font-semibold text-blue-600">{filteredTemplates.length}</span> 个自定义模板
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveCurrent}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                            isDark
                              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                          保存当前
                        </button>
                        <label
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                            isDark
                              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border'
                          }`}
                        >
                          <Upload className="w-4 h-4" />
                          导入
                          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                        </label>
                      </div>
                    </div>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredTemplates.map((outline) => renderGridCard(outline, true))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredTemplates.map((outline) => renderListRow(outline, true))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 删除确认弹窗 */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-6 rounded-2xl max-w-sm w-full ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
              >
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className={`text-lg font-semibold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  确认删除模板
                </h3>
                <p className={`text-sm text-center mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  此操作无法撤销，确定要删除这个模板吗？
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default OutlineTemplateManager;
