/**
 * 优化的购物车页面 - 支持批量操作、优惠券、库存校验
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Trash2, 
  Heart, 
  Minus, 
  Plus, 
  Check, 
  X,
  AlertCircle,
  Tag,
  Gift
} from 'lucide-react';
import { useCartEnhanced } from '@/hooks/useCartEnhanced';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [couponInput, setCouponInput] = useState('');

  const {
    cartItems,
    cartStats,
    loading,
    error,
    couponCode,
    appliedCoupon,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    batchSelectItems,
    batchRemoveItems,
    selectAllItems,
    validateCoupon,
    removeCoupon,
    clearCart,
    moveToFavorites,
  } = useCartEnhanced(user?.id || null);

  // 选中的商品 ID 列表
  const selectedIds = useMemo(() => 
    cartItems.filter(item => item.selected).map(item => item.id),
    [cartItems]
  );

  // 是否全选
  const isAllSelected = useMemo(() => 
    cartItems.length > 0 && cartItems.every(item => item.selected),
    [cartItems]
  );

  // 处理数量变更
  const handleQuantityChange = async (
    cartItemId: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) return;
    await updateCartItem(cartItemId, { quantity: newQuantity });
  };

  // 处理选择商品
  const handleSelectItem = async (cartItemId: string, selected: boolean) => {
    await batchSelectItems([cartItemId], selected);
  };

  // 处理全选
  const handleSelectAll = async () => {
    await selectAllItems(!isAllSelected);
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      toast.warning('请选择要删除的商品');
      return;
    }
    await batchRemoveItems(selectedIds);
  };

  // 处理移入收藏
  const handleMoveToFavorites = async (cartItemId: string) => {
    await moveToFavorites(cartItemId);
  };

  // 处理优惠券验证
  const handleValidateCoupon = async () => {
    if (!couponInput.trim()) {
      toast.warning('请输入优惠券码');
      return;
    }
    await validateCoupon(couponInput.trim());
  };

  // 处理结算
  const handleCheckout = () => {
    if (selectedIds.length === 0) {
      toast.warning('请选择要结算的商品');
      return;
    }
    navigate('/marketplace/checkout', { 
      state: { 
        selectedIds,
        couponCode: appliedCoupon?.isValid ? couponCode : undefined
      } 
    });
  };

  // 渲染库存状态
  const renderStockStatus = (item: any) => {
    switch (item.stock_status) {
      case 'in_stock':
        return <span className="text-xs text-green-600">有货</span>;
      case 'low_stock':
        return (
          <div className="flex items-center gap-1 text-xs text-orange-600">
            <AlertCircle className="w-3 h-3" />
            <span>库存紧张</span>
          </div>
        );
      case 'out_of_stock':
        return (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="w-3 h-3" />
            <span>缺货</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--haihe-500)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">加载失败</h2>
          <p className="text-[var(--text-secondary)] mb-4">{error}</p>
          <button
            onClick={fetchCart}
            className="px-6 py-2 bg-[var(--haihe-500)] text-white rounded-lg hover:bg-[var(--haihe-600)] transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-[var(--haihe-500)]" />
            购物车
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">
            {cartItems.length} 件商品，{cartStats.selectedItems} 件已选择
          </p>
        </motion.div>

        {cartItems.length === 0 ? (
          /* 空购物车 */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              购物车是空的
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              快去挑选心仪的商品吧～
            </p>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-8 py-3 bg-gradient-to-r from-[var(--haihe-500)] to-[var(--haihe-600)] text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              去逛逛
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 购物车列表 */}
            <div className="lg:col-span-2 space-y-4">
              {/* 操作栏 */}
              <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-[var(--text-primary)] hover:text-[var(--haihe-500)] transition-colors"
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isAllSelected 
                      ? 'bg-[var(--haihe-500)] border-[var(--haihe-500)]' 
                      : 'border-gray-300'
                  }`}>
                    {isAllSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span>全选</span>
                </button>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBatchDelete}
                    className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors"
                    disabled={selectedIds.length === 0}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>删除</span>
                  </button>
                  <button
                    onClick={clearCart}
                    className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>清空</span>
                  </button>
                </div>
              </div>

              {/* 商品列表 */}
              <div className="space-y-4">
                <AnimatePresence>
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`bg-white rounded-xl shadow-sm p-4 transition-all ${
                        !item.is_valid ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* 选择框 */}
                        <button
                          onClick={() => handleSelectItem(item.id, !item.selected)}
                          className={`mt-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            item.selected 
                              ? 'bg-[var(--haihe-500)] border-[var(--haihe-500)]' 
                              : 'border-gray-300'
                          }`}
                        >
                          {item.selected && <Check className="w-3 h-3 text-white" />}
                        </button>

                        {/* 商品图片 */}
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          {item.product?.cover_image ? (
                            <img
                              src={item.product.cover_image}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ShoppingCart className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        {/* 商品信息 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[var(--text-primary)] truncate">
                            {item.product?.name}
                          </h3>
                          <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                            {item.product?.short_description}
                          </p>
                          
                          {/* 规格 */}
                          {item.specifications && item.specifications.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.specifications.map((spec, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded"
                                >
                                  {spec.name}: {spec.value}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* 库存状态 */}
                          <div className="mt-2">
                            {renderStockStatus(item)}
                          </div>
                        </div>

                        {/* 价格和数量 */}
                        <div className="flex flex-col items-end gap-2">
                          {/* 价格 */}
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-500">
                              ¥{item.product?.price.toFixed(2)}
                            </div>
                            {item.product?.original_price && (
                              <div className="text-xs text-gray-400 line-through">
                                ¥{item.product.original_price.toFixed(2)}
                              </div>
                            )}
                          </div>

                          {/* 数量控制 */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                              disabled={!item.is_valid}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleMoveToFavorites(item.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                              title="移入收藏"
                            >
                              <Heart className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* 结算栏 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4 space-y-6">
                {/* 优惠券 */}
                <div>
                  <h3 className="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-[var(--haihe-500)]" />
                    优惠券
                  </h3>
                  
                  {appliedCoupon?.isValid ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gift className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            已优惠 ¥{appliedCoupon.discount}
                          </span>
                        </div>
                        <button
                          onClick={removeCoupon}
                          className="text-green-600 hover:text-green-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="输入优惠券码"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--haihe-500)]"
                      />
                      <button
                        onClick={handleValidateCoupon}
                        className="px-4 py-2 bg-[var(--haihe-500)] text-white rounded-lg hover:bg-[var(--haihe-600)] transition-colors"
                      >
                        使用
                      </button>
                    </div>
                  )}
                </div>

                {/* 价格统计 */}
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">商品总额</span>
                    <span className="text-[var(--text-primary)]">
                      ¥{cartStats.originalPrice.toFixed(2)}
                    </span>
                  </div>
                  {cartStats.discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm text-green-600">
                      <span>优惠金额</span>
                      <span>-¥{cartStats.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {appliedCoupon?.isValid && (
                    <div className="flex items-center justify-between text-sm text-green-600">
                      <span>优惠券折扣</span>
                      <span>-¥{appliedCoupon.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">积分奖励</span>
                    <span className="text-[var(--haihe-500)]">+{cartStats.pointsEarned} 积分</span>
                  </div>
                </div>

                {/* 最终价格 */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-[var(--text-primary)]">
                      应付金额
                    </span>
                    <div className="text-2xl font-bold text-red-500">
                      ¥{cartStats.finalPrice.toFixed(2)}
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={selectedIds.length === 0}
                    className={`w-full py-3 rounded-lg font-medium text-white transition-all ${
                      selectedIds.length === 0
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[var(--haihe-500)] to-[var(--haihe-600)] hover:shadow-lg'
                    }`}
                  >
                    去结算 ({cartStats.selectedItems})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
