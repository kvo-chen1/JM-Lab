/**
 * 授权IP产品列表页面
 * 展示所有授权IP产品，支持筛选和搜索
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Award, Search, Filter, ChevronDown, Grid3X3, List,
  ShoppingBag, Heart, Loader2, Building2, User, SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import licensedProductService, { LicensedProduct, LicensedProductFilters } from '@/services/licensedProductService';
import { useAuth } from '@/hooks/useAuth';

// 深色主题配色
const DARK_THEME = {
  bgPrimary: 'bg-slate-950',
  bgSecondary: 'bg-slate-900',
  bgCard: 'bg-slate-900/80',
  borderPrimary: 'border-slate-800',
  borderSecondary: 'border-slate-700',
  textPrimary: 'text-slate-100',
  textSecondary: 'text-slate-300',
  textMuted: 'text-slate-400',
  accentPrimary: 'from-cyan-500 to-blue-600',
  accentSecondary: 'from-violet-500 to-purple-600',
  accentSuccess: 'from-emerald-400 to-teal-500',
  glowPrimary: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]',
  glass: 'backdrop-blur-xl bg-slate-900/90',
};

// 产品类别
const CATEGORIES = [
  { id: '', name: '全部', icon: '✨' },
  { id: 'clothing', name: '服装配饰', icon: '👕' },
  { id: 'home', name: '家居用品', icon: '🏠' },
  { id: 'stationery', name: '文具办公', icon: '✏️' },
  { id: 'digital', name: '数字产品', icon: '💻' },
  { id: 'toys', name: '玩具周边', icon: '🧸' },
  { id: 'accessories', name: '配件饰品', icon: '💍' },
  { id: 'art', name: '艺术收藏', icon: '🎨' },
];

// 排序选项
const SORT_OPTIONS = [
  { id: 'newest', name: '最新上架' },
  { id: 'price_asc', name: '价格从低到高' },
  { id: 'price_desc', name: '价格从高到低' },
  { id: 'sales', name: '销量优先' },
  { id: 'rating', name: '评分优先' },
];

const LicensedProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [products, setProducts] = useState<LicensedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // 筛选状态
  const [filters, setFilters] = useState<LicensedProductFilters>(({
    category: '',
    sortBy: 'newest',
    searchQuery: '',
  }));
  const [searchInput, setSearchInput] = useState('');

  // 加载产品
  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await licensedProductService.getLicensedProducts(filters);
      // 确保数据是数组
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data && typeof data === 'object') {
        const prods = data.products || data.data || [];
        setProducts(Array.isArray(prods) ? prods : []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('加载授权IP产品失败:', error);
      toast.error('加载产品失败');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 搜索处理
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, searchQuery: searchInput }));
  };

  // 分类筛选
  const handleCategoryChange = (categoryId: string) => {
    setFilters(prev => ({ ...prev, category: categoryId }));
  };

  // 排序处理
  const handleSortChange = (sortBy: LicensedProductFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  };

  // 产品点击
  const handleProductClick = (product: LicensedProduct) => {
    navigate(`/marketplace/licensed-product/${product.id}`);
  };

  // 添加到购物车
  const handleAddToCart = (e: React.MouseEvent, product: LicensedProduct) => {
    e.stopPropagation();
    if (!user) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    toast.success(`已将 ${product.productName} 添加到购物车`);
  };

  return (
    <div className={`min-h-screen ${DARK_THEME.bgPrimary} py-8 px-4`}>
      <div className="max-w-7xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
              <Award className="w-7 h-7 text-violet-400" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${DARK_THEME.textPrimary}`}>
                授权IP产品
              </h1>
              <p className={`${DARK_THEME.textMuted}`}>
                正版授权文创产品，支持原创作者
              </p>
            </div>
          </div>

          {/* 搜索和筛选栏 */}
          <div className={`p-4 rounded-2xl ${DARK_THEME.bgCard} ${DARK_THEME.borderPrimary} border`}>
            <div className="flex flex-wrap gap-4 items-center">
              {/* 搜索框 */}
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="搜索授权IP产品..."
                  className={`w-full pl-10 pr-4 py-3 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border ${DARK_THEME.textPrimary} placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50`}
                />
              </div>

              {/* 筛选按钮 */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border ${DARK_THEME.textSecondary} hover:border-violet-500/30 transition-all ${showFilters ? 'border-violet-500/50 bg-violet-500/10' : ''}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>筛选</span>
              </button>

              {/* 排序下拉 */}
              <div className="relative">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleSortChange(e.target.value as any)}
                  className={`appearance-none px-4 py-3 pr-10 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border ${DARK_THEME.textPrimary} focus:outline-none focus:border-violet-500/50 cursor-pointer`}
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>

              {/* 视图切换 */}
              <div className="flex items-center gap-1 p-1 rounded-lg ${DARK_THEME.bgSecondary} border ${DARK_THEME.borderPrimary}">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 分类筛选 */}
            <div className="flex flex-wrap gap-2 mt-4">
              {CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                    filters.category === category.id
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                      : `${DARK_THEME.bgSecondary} ${DARK_THEME.textSecondary} hover:bg-slate-800 border ${DARK_THEME.borderPrimary}`
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 产品列表 */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-64 ${DARK_THEME.textMuted}`}>
            <Award className="w-16 h-16 mb-4 opacity-30" />
            <p>暂无授权IP产品</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleProductClick(product)}
                    className={`group relative rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border overflow-hidden cursor-pointer hover:border-violet-500/30 transition-all`}
                  >
                    {/* 产品图片 */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={product.productImages[0] || 'https://via.placeholder.com/400'}
                        alt={product.productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* 品牌标识 */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                        {product.brandLogo ? (
                          <img src={product.brandLogo} alt={product.brandName} className="w-4 h-4 object-contain" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-violet-400" />
                        )}
                        <span className="text-xs text-white font-medium truncate max-w-[80px]">
                          {product.brandName}
                        </span>
                      </div>

                      {/* 授权标识 */}
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-medium flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        正版授权
                      </div>

                      {/* 悬停操作 */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          className="p-2 rounded-full bg-white text-slate-900 hover:bg-cyan-400 transition-colors"
                        >
                          <ShoppingBag className="w-5 h-5" />
                        </button>
                        <button className="p-2 rounded-full bg-white text-slate-900 hover:bg-pink-400 transition-colors">
                          <Heart className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* 产品信息 */}
                    <div className="p-3">
                      <h4 className={`font-medium text-sm ${DARK_THEME.textPrimary} line-clamp-1 mb-1`}>
                        {product.productName}
                      </h4>
                      
                      {/* 创作者信息 */}
                      <div className="flex items-center gap-1.5 mb-2">
                        {product.creatorAvatar ? (
                          <img src={product.creatorAvatar} alt={product.creatorName} className="w-4 h-4 rounded-full" />
                        ) : (
                          <User className="w-4 h-4 text-slate-500" />
                        )}
                        <span className={`text-xs ${DARK_THEME.textMuted} truncate`}>
                          {product.creatorName}
                        </span>
                      </div>

                      {/* 价格和销量 */}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-emerald-400">
                          ¥{product.price.toFixed(2)}
                        </span>
                        <span className={`text-xs ${DARK_THEME.textMuted}`}>
                          已售 {product.salesCount}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              // 列表视图
              <div className="space-y-4">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleProductClick(product)}
                    className={`group flex gap-4 p-4 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border cursor-pointer hover:border-violet-500/30 transition-all`}
                  >
                    {/* 产品图片 */}
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={product.productImages[0] || 'https://via.placeholder.com/400'}
                        alt={product.productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[10px] font-medium flex items-center gap-0.5">
                        <Award className="w-2.5 h-2.5" />
                        正版
                      </div>
                    </div>

                    {/* 产品信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className={`font-medium ${DARK_THEME.textPrimary} mb-1`}>
                            {product.productName}
                          </h4>
                          <p className={`text-sm ${DARK_THEME.textMuted} line-clamp-2`}>
                            {product.productDescription}
                          </p>
                        </div>
                        <span className="text-xl font-bold text-emerald-400">
                          ¥{product.price.toFixed(2)}
                        </span>
                      </div>

                      {/* 品牌和创作者 */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1.5">
                          {product.brandLogo ? (
                            <img src={product.brandLogo} alt={product.brandName} className="w-4 h-4 object-contain" />
                          ) : (
                            <Building2 className="w-4 h-4 text-violet-400" />
                          )}
                          <span className={`text-sm ${DARK_THEME.textSecondary}`}>{product.brandName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {product.creatorAvatar ? (
                            <img src={product.creatorAvatar} alt={product.creatorName} className="w-4 h-4 rounded-full" />
                          ) : (
                            <User className="w-4 h-4 text-slate-500" />
                          )}
                          <span className={`text-sm ${DARK_THEME.textMuted}`}>{product.creatorName}</span>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          加入购物车
                        </button>
                        <button className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-pink-400 hover:border-pink-400/50 transition-colors">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LicensedProductsPage;
