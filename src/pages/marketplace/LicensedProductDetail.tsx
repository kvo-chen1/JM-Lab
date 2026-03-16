/**
 * 授权IP产品详情页
 * 展示授权IP产品的详细信息和购买选项
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Heart,
  ShoppingCart,
  Share2,
  ArrowLeft,
  Minus,
  Plus,
  Store,
  Award,
  User,
  Building2,
  Star,
  Shield,
  Truck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import licensedProductService, { LicensedProduct } from '@/services/licensedProductService';

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

const LicensedProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<LicensedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [mainImageError, setMainImageError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // 加载产品详情
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setError('产品ID不存在');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await licensedProductService.getLicensedProductById(id);
        setProduct(data);
      } catch (err: any) {
        console.error('加载授权产品详情失败:', err);
        setError(err.message || '加载产品详情失败');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // 添加到购物车
  const handleAddToCart = async () => {
    if (!user) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    if (!product) return;

    toast.success(`已将 ${product.productName} 添加到购物车`);
  };

  // 立即购买
  const handleBuyNow = () => {
    if (!user) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    if (!product) return;

    // 跳转到订单确认页
    navigate(`/marketplace/order/confirm?productId=${product.id}&quantity=${quantity}`);
  };

  // 切换收藏
  const handleToggleFavorite = () => {
    if (!user) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }

    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? '已取消收藏' : '已添加到收藏');
  };

  // 骨架屏加载状态
  if (loading) {
    return (
      <div className={`min-h-screen ${DARK_THEME.bgPrimary}`}>
        {/* 顶部导航骨架 */}
        <div className={`${DARK_THEME.glass} sticky top-0 z-10 border-b ${DARK_THEME.borderPrimary}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="h-6 w-20 bg-slate-800 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左侧图片骨架 */}
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl bg-slate-800 animate-pulse"></div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-20 h-20 rounded-lg bg-slate-800 animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* 右侧信息骨架 */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-slate-800 rounded animate-pulse"></div>
                <div className="h-8 w-3/4 bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="h-24 bg-slate-800 rounded-xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-slate-800 rounded animate-pulse"></div>
                <div className="h-10 w-32 bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 bg-slate-800 rounded animate-pulse"></div>
                <div className="h-12 bg-slate-800 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className={`min-h-screen ${DARK_THEME.bgPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          <p className="text-red-400 mb-2">加载失败</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <Button onClick={() => navigate('/marketplace/licensed-products')} className="mt-4">
            返回授权产品列表
          </Button>
        </div>
      </div>
    );
  }

  // 产品不存在
  if (!product) {
    return (
      <div className={`min-h-screen ${DARK_THEME.bgPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-12 h-12 text-slate-500" />
          </div>
          <p className="text-slate-300">产品不存在或已下架</p>
          <Button onClick={() => navigate('/marketplace/licensed-products')} className="mt-4">
            返回授权产品列表
          </Button>
        </div>
      </div>
    );
  }

  const images = product.productImages?.length > 0
    ? product.productImages
    : ['https://via.placeholder.com/400'];

  return (
    <div className={`min-h-screen ${DARK_THEME.bgPrimary}`}>
      {/* 顶部导航 */}
      <div className={`${DARK_THEME.glass} sticky top-0 z-10 border-b ${DARK_THEME.borderPrimary}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center ${DARK_THEME.textSecondary} hover:${DARK_THEME.textPrimary} transition-colors`}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：产品图片 */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="aspect-square rounded-2xl overflow-hidden bg-slate-800 border border-slate-700"
            >
              {images[selectedImage] && !mainImageError ? (
                <img
                  src={images[selectedImage]}
                  alt={product.productName}
                  className="w-full h-full object-cover"
                  onError={() => setMainImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                  <Store className="w-16 h-16 text-slate-600" />
                </div>
              )}
            </motion.div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      selectedImage === index
                        ? 'border-cyan-500'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <img
                      src={image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 右侧：产品信息 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* 品牌和标题 */}
            <div>
              {/* 品牌信息 */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
                  {product.brandLogo ? (
                    <img src={product.brandLogo} alt={product.brandName} className="w-4 h-4 object-contain" />
                  ) : (
                    <Building2 className="w-4 h-4 text-violet-400" />
                  )}
                  <span className="text-sm text-slate-300">{product.brandName}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30">
                  <Award className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs text-violet-300">正版授权</span>
                </div>
              </div>

              <h1 className={`text-2xl font-bold ${DARK_THEME.textPrimary}`}>
                {product.productName}
              </h1>

              {/* 创作者信息 */}
              <div className="flex items-center gap-2 mt-3">
                {product.creatorAvatar ? (
                  <img src={product.creatorAvatar} alt={product.creatorName} className="w-5 h-5 rounded-full" />
                ) : (
                  <User className="w-5 h-5 text-slate-500" />
                )}
                <span className={`text-sm ${DARK_THEME.textMuted}`}>创作者：{product.creatorName}</span>
              </div>

              {/* 评分 */}
              {product.averageRating && product.averageRating > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.averageRating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-sm ${DARK_THEME.textMuted}`}>{product.averageRating}</span>
                  <span className={`text-sm ${DARK_THEME.textMuted}`}>({product.reviewCount || 0}条评价)</span>
                </div>
              )}
            </div>

            {/* 价格 */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl p-4 border border-emerald-500/20">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-emerald-400">
                  ¥{Number(product.price || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                <span>库存 {product.stock} 件</span>
                <span>已售 {product.salesCount} 件</span>
              </div>
            </div>

            {/* 产品描述 */}
            {product.productDescription && (
              <div>
                <h3 className={`font-medium ${DARK_THEME.textPrimary} mb-2`}>产品描述</h3>
                <p className={`text-sm ${DARK_THEME.textMuted} leading-relaxed`}>
                  {product.productDescription}
                </p>
              </div>
            )}

            {/* 数量选择 */}
            <div>
              <h3 className={`font-medium ${DARK_THEME.textPrimary} mb-3`}>数量</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  type="button"
                >
                  <Minus className="w-4 h-4 text-slate-400" />
                </button>
                <span className="w-12 h-10 flex items-center justify-center font-medium text-slate-100 border border-slate-700 bg-slate-800 rounded-lg">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  type="button"
                >
                  <Plus className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* 服务承诺 */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>正版授权</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>品质保证</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-violet-400" />
                <span>支持原创</span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-3 pt-4">
              {/* 主要操作按钮 */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="h-12 text-base bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 transition-all"
                  onClick={handleAddToCart}
                  icon={<ShoppingCart className="w-5 h-5" />}
                  iconPosition="left"
                >
                  加入购物车
                </Button>
                <Button
                  className="h-12 text-base bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 transition-all"
                  onClick={handleBuyNow}
                >
                  立即购买
                </Button>
              </div>

              {/* 次要操作按钮 */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className={`h-11 text-sm font-medium border-2 transition-all duration-200 ${
                    isFavorite
                      ? 'border-pink-500/50 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20'
                      : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-700'
                  }`}
                  onClick={handleToggleFavorite}
                  icon={<Heart className={`w-4 h-4 transition-transform duration-200 ${isFavorite ? 'fill-pink-400 text-pink-400 scale-110' : ''}`} />}
                  iconPosition="left"
                >
                  {isFavorite ? '已收藏' : '收藏'}
                </Button>
                <Button
                  variant="outline"
                  className="h-11 text-sm font-medium border-2 border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-700 transition-all duration-200"
                  onClick={() => toast.info('分享功能开发中')}
                  icon={<Share2 className="w-4 h-4" />}
                  iconPosition="left"
                >
                  分享
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LicensedProductDetailPage;
