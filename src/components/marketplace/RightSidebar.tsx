/**
 * 右侧边栏组件
 * 包含购物车预览、我的收藏、浏览历史、促销活动等
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Heart, 
  Clock, 
  Tag, 
  Sparkles,
  ChevronRight,
  Trash2,
  TrendingUp,
  Gift
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Product } from '@/services/productService';

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
  onRemoveFromCart?: (itemId: string) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  cartItems = [],
  favoriteProducts = [],
  recentlyViewed = [],
  promotions = [],
  recommendedProducts = [],
  onRemoveFromCart,
}) => {
  const navigate = useNavigate();

  // 计算购物车总价
  const cartTotal = cartItems.reduce((sum, item) => 
    sum + (item.product.price * item.quantity), 0
  );

  return (
    <div className="space-y-4">
      {/* 购物车预览 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="mp-sidebar-card"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--haihe-500)] to-[var(--haihe-600)] flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-4 h-4 text-white flex-shrink-0" strokeWidth={2.5} />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)]">购物车</h3>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            {cartItems.length} 件商品
          </span>
        </div>

        {cartItems.length > 0 ? (
          <>
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {cartItems.slice(0, 4).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="flex gap-3 p-2 rounded-lg bg-[var(--bg-tertiary)] group"
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                    {item.product.cover_image ? (
                      <img
                        src={item.product.cover_image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        无图
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--text-primary)] truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-[var(--haihe-500)] font-medium">
                      ¥{item.product.price.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveFromCart?.(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3 flex-shrink-0" strokeWidth={2.5} />
                  </button>
                </motion.div>
              ))}
            </div>
            
            {cartItems.length > 4 && (
              <p className="text-xs text-[var(--text-muted)] text-center py-2">
                还有 {cartItems.length - 4} 件商品...
              </p>
            )}

            <div className="border-t border-[var(--border-primary)] pt-3 mt-3">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-[var(--text-secondary)]">合计</span>
                <span className="text-lg font-bold text-[var(--haihe-500)]">
                  ¥{cartTotal.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => navigate('/marketplace/cart')}
                className="mp-btn mp-btn-primary w-full mp-btn-sm"
              >
                去结算
                <ChevronRight className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-2">
              <ShoppingCart className="w-6 h-6 text-[var(--text-muted)] flex-shrink-0" strokeWidth={2} />
            </div>
            <p className="text-sm text-[var(--text-muted)]">购物车是空的</p>
            <button
              onClick={() => navigate('/marketplace')}
              className="mp-btn mp-btn-secondary mp-btn-sm mt-3"
            >
              去逛逛
            </button>
          </div>
        )}
      </motion.div>

      {/* 我的收藏 */}
      {favoriteProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="mp-sidebar-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-white flex-shrink-0" strokeWidth={2.5} />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)]">我的收藏</h3>
            </div>
            <button
              onClick={() => navigate('/favorites')}
              className="text-xs text-[var(--haihe-500)] hover:underline"
            >
              查看全部
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {favoriteProducts.slice(0, 4).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                onClick={() => navigate(`/marketplace/product/${product.id}`)}
                className="cursor-pointer group"
              >
                <div className="aspect-square rounded-lg bg-gray-200 overflow-hidden mb-1">
                  {product.cover_image ? (
                    <img
                      src={product.cover_image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      无图
                    </div>
                  )}
                </div>
                <p className="text-xs text-[var(--text-primary)] truncate">
                  {product.name}
                </p>
                <p className="text-xs text-[var(--haihe-500)] font-medium">
                  ¥{product.price.toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 浏览历史 */}
      {recentlyViewed.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="mp-sidebar-card"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-white flex-shrink-0" strokeWidth={2.5} />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)]">浏览历史</h3>
          </div>

          <div className="space-y-2">
            {recentlyViewed.slice(0, 3).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                onClick={() => navigate(`/marketplace/product/${product.id}`)}
                className="flex gap-3 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors"
              >
                <div className="w-14 h-14 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                  {product.cover_image ? (
                    <img
                      src={product.cover_image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      无图
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--text-primary)] line-clamp-2">
                    {product.name}
                  </p>
                  <p className="text-xs text-[var(--haihe-500)] font-medium mt-1">
                    ¥{product.price.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 促销活动 */}
      {promotions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="mp-sidebar-card bg-gradient-to-br from-[var(--jinmen-50)] to-[var(--jinmen-100)] border-[var(--jinmen-200)]"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--jinmen-500)] to-[var(--jinmen-600)] flex items-center justify-center flex-shrink-0">
              <Gift className="w-4 h-4 text-white flex-shrink-0" strokeWidth={2.5} />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)]">限时促销</h3>
          </div>

          <div className="space-y-3">
            {promotions.slice(0, 2).map((promo, index) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="p-3 rounded-lg bg-white/80 border border-[var(--jinmen-200)]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {promo.title}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold text-white bg-[var(--jinmen-500)] rounded-full">
                    {promo.discount}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-2">
                  {promo.description}
                </p>
                {promo.endTime && (
                  <p className="text-xs text-[var(--jinmen-600)]">
                    截止: {promo.endTime}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 为你推荐 */}
      {recommendedProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="mp-sidebar-card"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white flex-shrink-0" strokeWidth={2.5} />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)]">为你推荐</h3>
          </div>

          <div className="space-y-3">
            {recommendedProducts.slice(0, 3).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                onClick={() => navigate(`/marketplace/product/${product.id}`)}
                className="flex gap-3 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors"
              >
                <div className="w-14 h-14 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                  {product.cover_image ? (
                    <img
                      src={product.cover_image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      无图
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--text-primary)] line-clamp-2">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-[var(--haihe-500)] font-medium">
                      ¥{product.price.toLocaleString()}
                    </p>
                    {product.original_price && (
                      <p className="text-xs text-[var(--text-muted)] line-through">
                        ¥{product.original_price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 平台统计 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        className="mp-sidebar-card"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white flex-shrink-0" strokeWidth={2.5} />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)]">平台动态</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg bg-[var(--bg-tertiary)]">
            <p className="text-lg font-bold text-[var(--haihe-500)]">1,234</p>
            <p className="text-xs text-[var(--text-muted)]">在售商品</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[var(--bg-tertiary)]">
            <p className="text-lg font-bold text-[var(--jinmen-500)]">56</p>
            <p className="text-xs text-[var(--text-muted)]">入驻品牌</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[var(--bg-tertiary)]">
            <p className="text-lg font-bold text-green-500">8,888</p>
            <p className="text-xs text-[var(--text-muted)]">累计订单</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[var(--bg-tertiary)]">
            <p className="text-lg font-bold text-purple-500">99%</p>
            <p className="text-xs text-[var(--text-muted)]">好评率</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RightSidebar;
