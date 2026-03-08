/**
 * 授权IP产品展示组件
 * 在文创商城中展示授权IP产品
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Award, ShoppingBag, TrendingUp, Sparkles, ChevronRight,
  Heart, Plus, Loader2, Building2, User
} from 'lucide-react';
import { toast } from 'sonner';
import licensedProductService, { LicensedProduct } from '@/services/licensedProductService';
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

interface LicensedProductSectionProps {
  title?: string;
  subtitle?: string;
  type?: 'hot' | 'new' | 'recommended' | 'all';
  limit?: number;
  showViewAll?: boolean;
}

export const LicensedProductSection: React.FC<LicensedProductSectionProps> = ({
  title = '授权IP产品',
  subtitle = '正版授权，品质保证',
  type = 'all',
  limit = 8,
  showViewAll = true,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<LicensedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [type, limit]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      let data: any;

      switch (type) {
        case 'hot':
          data = await licensedProductService.getHotLicensedProducts(limit);
          break;
        case 'new':
          data = await licensedProductService.getNewLicensedProducts(limit);
          break;
        case 'recommended':
          data = await licensedProductService.getRecommendedLicensedProducts(limit);
          break;
        default:
          data = await licensedProductService.getLicensedProducts({ sortBy: 'newest' });
      }

      // 确保数据是数组
      let productsArray: LicensedProduct[] = [];
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data && typeof data === 'object') {
        const prods = data.products || data.data || [];
        productsArray = Array.isArray(prods) ? prods : [];
      }
      
      setProducts(type === 'all' ? productsArray.slice(0, limit) : productsArray);
    } catch (error) {
      console.error('加载授权IP产品失败:', error);
      toast.error('加载产品失败');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: LicensedProduct) => {
    navigate(`/marketplace/licensed-product/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent, product: LicensedProduct) => {
    e.stopPropagation();
    if (!user) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    toast.success(`已将 ${product.productName} 添加到购物车`);
  };

  const handleViewAll = () => {
    navigate('/marketplace/licensed-products');
  };

  if (loading) {
    return (
      <div className={`rounded-2xl ${DARK_THEME.bgCard} ${DARK_THEME.borderPrimary} border p-8`}>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-2xl ${DARK_THEME.bgCard} ${DARK_THEME.borderPrimary} border overflow-hidden`}>
      {/* 头部 */}
      <div className={`p-6 border-b ${DARK_THEME.borderPrimary}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${DARK_THEME.textPrimary}`}>{title}</h3>
              <p className={`text-sm ${DARK_THEME.textMuted}`}>{subtitle}</p>
            </div>
          </div>
          {showViewAll && (
            <button
              onClick={handleViewAll}
              className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 产品网格 */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
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
      </div>
    </div>
  );
};

export default LicensedProductSection;
