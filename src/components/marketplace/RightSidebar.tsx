/**
 * 右侧边栏组件 V2 - 全新设计
 * 包含购物车预览、我的收藏、浏览历史、促销活动等
 * 优化：更现代的UI、更好的空状态设计、更丰富的交互
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, 
  Heart, 
  Clock, 
  Sparkles,
  ChevronRight,
  Trash2,
  TrendingUp,
  Gift,
  Package,
  ShoppingBag,
  ArrowRight,
  Home,
  Store
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Product } from '@/services/productService';

interface PlatformStats {
  totalProducts: number;
  totalBrands: number;
  totalOrders: number;
}

interface RightSidebarProps {
  cartItems?: Array<{
    id: string;
    product: Product;
    quantity: number;
  }>;
  favoriteProducts?: Product[];
  recentlyViewed?: Product[];
  promotions?: Array<{
    id: string;
    title: string;
    description: string;
    discount: string;
    endTime?: string;
  }>;
  recommendedProducts?: Product[];
  platformStats?: PlatformStats;
  onRemoveFromCart?: (itemId: string) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  cartItems = [],
  favoriteProducts = [],
  recentlyViewed = [],
  promotions = [],
  recommendedProducts = [],
  platformStats,
  onRemoveFromCart,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 计算购物车总价
  const cartTotal = cartItems.reduce((sum, item) => {
    const price = item?.product?.price ?? 0;
    const quantity = item?.quantity ?? 1;
    return sum + (price * quantity);
  }, 0);

  // 计算购物车商品总数
  const cartItemCount = cartItems.reduce((sum, item) => sum + (item?.quantity || 1), 0);

  const isActive = (path: string) => {
    // 处理带查询参数的路径
    const cleanPath = path.split('?')[0];
    
    // 首页特殊处理
    if (cleanPath === '/marketplace') {
      return location.pathname === '/marketplace' || location.pathname === '/marketplace/';
    }
    
    // 其他路径使用 startsWith 匹配
    return location.pathname.startsWith(cleanPath);
  };

  const menuItems = [
    { id: 'home', label: '首页', icon: Home, href: '/marketplace' },
    { id: 'products', label: '全部商品', icon: ShoppingBag, href: '/marketplace?sort=newest' },
    { id: 'favorites', label: '我的收藏', icon: Heart, href: '/favorites' },
    { id: 'cart', label: '购物车', icon: ShoppingCart, href: '/marketplace/cart' },
    { id: 'orders', label: '我的订单', icon: Store, href: '/marketplace/orders' },
  ];
// 事件处理
  // 预加载页面组件
  const preloadComponent = (href: string) => {
    // 根据路径预加载对应的组件
    switch (href) {
      case '/favorites':
        import('@/pages/marketplace/Favorites');
        break;
      case '/marketplace/cart':
        import('@/pages/marketplace/Cart');
        break;
      case '/marketplace/orders':
        import('@/pages/marketplace/Orders');
        break;
    }
  };

  const handleMenuClick = (href: string) => {
    console.log('[RightSidebar] 导航到:', href);
    navigate(href);
  };

  const handleRemoveFromCartClick = (itemId: string) => {
    console.log('[RightSidebar] 从购物车移除:', itemId);
    onRemoveFromCart?.(itemId);
  };

  const handleCheckoutClick = () => {
    console.log('[RightSidebar] 去结算');
    navigate('/marketplace/cart');
  };

  const handleBrowseClick = () => {
    console.log('[RightSidebar] 去逛逛');
    navigate('/marketplace');
  };

  const handleViewAllFavorites = () => {
    console.log('[RightSidebar] 查看全部收藏');
    navigate('/favorites');
  };

  const handleProductClick = (productId: string) => {
    console.log('[RightSidebar] 查看商品:', productId);
    navigate(`/marketplace/product/${productId}`);
  };

  return (
    <div className="space-y-4">
      {/* 快捷导航 - 新设计 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 }}
        className="mp-sidebar-card"
      >
        <h3 className="mp-sidebar-card-title">
          <ShoppingBag className="w-4 h-4 text-gray-400" />
          快捷导航
        </h3>
        <nav className="mp-sidebar-nav">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href.split('?')[0]);
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + index * 0.05 }}
                onClick={() => handleMenuClick(item.href)}
                onMouseEnter={() => preloadComponent(item.href)}
                className={`mp-sidebar-nav-item ${active ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                <span>{item.label}</span>
                {active && (
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                )}
              </motion.button>
            );
          })}
        </nav>
      </motion.div>

      {/* 购物车预览 - 新设计 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="mp-sidebar-card"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/20">
              <ShoppingCart className="w-4 h-4 text-white flex-shrink-0" strokeWidth={2.5} />
            </div>
            <h3 className="font-semibold text-gray-900">购物车</h3>
          </div>
          {cartItemCount > 0 && (
            <span className="text-xs font-medium px-2 py-1 bg-sky-100 text-sky-700 rounded-full">
              {cartItemCount} 件商品
            </span>
          )}
        </div>

        {cartItems.length > 0 ? (
          <>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {cartItems.slice(0, 4).map((item, index) => {
                if (!item?.product) return null;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="flex gap-3 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                      {item.product?.cover_image ? (
                        <img
                          src={item.product.cover_image}
                          alt={item.product.name || '商品'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate font-medium">
                        {item.product?.name || '未知商品'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-semibold text-sky-600">
                          ¥{((item.product?.price) || 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400">x{item?.quantity || 1}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromCartClick(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-all p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl remove-cart-btn"
                      type="button"
                      aria-label="删除商品"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
            
            {cartItems.length > 4 && (
              <p className="text-xs text-gray-400 text-center py-2">
                还有 {cartItems.length - 4} 件商品...
              </p>
            )}

            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">合计</span>
                <span className="text-xl font-bold text-sky-600">
                  ¥{(cartTotal || 0).toLocaleString()}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckoutClick}
                className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-sky-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                type="button"
              >
                去结算
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-3">
              <ShoppingBag className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-gray-500 mb-1">购物车是空的</p>
            <p className="text-xs text-gray-400 mb-4">快去挑选心仪的商品吧</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBrowseClick}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              type="button"
            >
              去逛逛
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* 我的收藏 - 新设计 */}
      {favoriteProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="mp-sidebar-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/20">
                <Heart className="w-4 h-4 text-white flex-shrink-0" strokeWidth={2.5} />
              </div>
              <h3 className="font-semibold text-gray-900">我的收藏</h3>
            </div>
            <motion.button
              whileHover={{ x: 2 }}
              onClick={handleViewAllFavorites}
              className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-0.5"
              type="button"
            >
              查看全部
              <ChevronRight className="w-3 h-3" />
            </motion.button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {favoriteProducts.filter(p => p && p.id).slice(0, 4).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                onClick={() => handleProductClick(product.id)}
                className="cursor-pointer group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleProductClick(product.id);
                  }
                }}
              >
                <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden mb-2">
                  {product?.cover_image ? (
                    <img
                      src={product.cover_image}
                      alt={product?.name || '商品'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-700 truncate font-medium group-hover:text-sky-600 transition-colors">
                  {product?.name || '未知商品'}
                </p>
                <p className="text-xs font-semibold text-sky-600 mt-0.5">
                  ¥{((product?.price) || 0).toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 促销活动 - 新设计 */}
      {promotions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="mp-sidebar-card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
              <Gift className="w-4 h-4 text-white flex-shrink-0" strokeWidth={2.5} />
            </div>
            <h3 className="font-semibold text-gray-900">限时促销</h3>
          </div>

          <div className="space-y-3">
            {promotions.slice(0, 2).map((promo, index) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="p-3 rounded-xl bg-white/80 border border-amber-100 shadow-sm"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-900">
                    {promo.title}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-sm">
                    {promo.discount}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  {promo.description}
                </p>
                {promo.endTime && (
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <Clock className="w-3 h-3" />
                    <span>截止: {promo.endTime}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 为你推荐 - 新设计 */}
      {recommendedProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="mp-sidebar-card"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
              <Sparkles className="w-4 h-4 text-white flex-shrink-0" strokeWidth={2.5} />
            </div>
            <h3 className="font-semibold text-gray-900">为你推荐</h3>
          </div>

          <div className="space-y-3">
            {recommendedProducts.filter(p => p && p.id).slice(0, 3).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                onClick={() => handleProductClick(product.id)}
                className="flex gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleProductClick(product.id);
                  }
                }}
              >
                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {product?.cover_image ? (
                    <img
                      src={product.cover_image}
                      alt={product?.name || '商品'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Package className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium line-clamp-2 group-hover:text-sky-600 transition-colors">
                    {product?.name || '未知商品'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-sm font-bold text-sky-600">
                      ¥{((product?.price) || 0).toLocaleString()}
                    </p>
                    {product?.original_price && (
                      <p className="text-xs text-gray-400 line-through">
                        ¥{((product?.original_price) || 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 平台统计 - 新设计 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="mp-sidebar-card"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
            <TrendingUp className="w-4 h-4 text-white flex-shrink-0" strokeWidth={2.5} />
          </div>
          <h3 className="font-semibold text-gray-900">平台动态</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 dark:bg-gradient-to-br dark:from-sky-900/30 dark:to-blue-900/30 dark:border-sky-700/50">
            <p className="text-xl font-bold text-sky-600 dark:text-sky-400">{(platformStats?.totalProducts || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">在售商品</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 dark:bg-gradient-to-br dark:from-amber-900/30 dark:to-orange-900/30 dark:border-amber-700/50">
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{(platformStats?.totalBrands || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">入驻品牌</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 dark:bg-gradient-to-br dark:from-emerald-900/30 dark:to-teal-900/30 dark:border-emerald-700/50">
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{(platformStats?.totalOrders || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">累计订单</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RightSidebar;
