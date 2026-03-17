/**
 * 购物车页面 - 优化版
 * 集成：批量操作、优惠券、库存实时校验
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCartEnhanced } from '@/hooks/useCartEnhanced';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { ArrowLeft, ShoppingBag, Trash2, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { CartItemEnhanced, CheckoutPanelEnhanced } from '@/components/marketplace';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    cartStats,
    loading,
    error,
    couponCode,
    appliedCoupon,
    fetchCart,
    updateCartItem,
    removeFromCart,
    batchSelectItems,
    batchRemoveItems,
    selectAllItems,
    validateCoupon,
    removeCoupon,
    moveToFavorites,
  } = useCartEnhanced(user?.id || null);

  const [couponInput, setCouponInput] = useState('');

  // 全选状态
  const allSelected = cartItems.length > 0 && cartItems.every((item) => item.selected);

  // 处理全选
  const handleSelectAll = async (checked: boolean) => {
    await selectAllItems(checked);
  };

  // 处理选择单个商品
  const handleSelectItem = async (itemId: string, checked: boolean) => {
    await batchSelectItems([itemId], checked);
  };

  // 处理数量变更
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    await updateCartItem(itemId, { quantity: newQuantity });
  };

  // 处理删除
  const handleRemove = async (itemId: string) => {
    await removeFromCart(itemId);
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    const selectedIds = cartItems.filter(item => item.selected).map(item => item.id);
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
    const success = await validateCoupon(couponInput.trim());
    if (success) {
      setCouponInput('');
    }
  };

  // 处理结算
  const handleCheckout = () => {
    const selectedItems = cartItems.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      toast.error('请选择要购买的商品');
      return;
    }
    
    // 检查是否有缺货商品
    const outOfStockItems = selectedItems.filter(item => item.stock_status === 'out_of_stock');
    if (outOfStockItems.length > 0) {
      toast.warning('部分商品缺货，结算时会自动跳过');
    }
    
    navigate('/marketplace/order/confirm', {
      state: {
        couponCode: appliedCoupon?.isValid ? couponCode : undefined
      }
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">请先登录后查看购物车</p>
          <Button onClick={() => navigate('/login')} className="mt-4">
            去登录
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C02C38] mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回
          </button>
          <div className="bg-white rounded-2xl p-12 text-center">
            <ShoppingBag className="w-24 h-24 text-gray-200 mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">购物车是空的</h2>
            <p className="text-gray-500 mb-6">快去挑选心仪的商品吧</p>
            <Button onClick={() => navigate('/marketplace')} className="bg-[#C02C38] hover:bg-[#991b1b]">
              去购物
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顶部导航 */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">🛒 购物车 ({cartStats.totalItems})</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 商品列表 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 全选栏 */}
            <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                />
                <span className="font-medium">全选</span>
                <span className="text-gray-500">({cartItems.length}件商品)</span>
              </div>
              <button
                onClick={handleBatchDelete}
                className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>删除选中</span>
              </button>
            </div>

            {/* 购物车商品 */}
            {cartItems.map((item, index) => (
              <CartItemEnhanced
                key={item.id}
                item={{
                  id: item.id,
                  product: {
                    id: item.product_id,
                    name: item.product?.name || '',
                    coverImage: item.product?.cover_image || '',
                    price: item.product?.price || 0,
                    originalPrice: item.product?.original_price || (item.product?.price || 0) * 1.2,
                    brand: item.product?.brand?.name || '',
                    spec: '默认规格'
                  },
                  quantity: item.quantity,
                  selected: item.selected,
                  isValid: item.is_valid !== false, // 默认 true
                  stockStatus: item.stock_status || 'in_stock'
                }}
                index={index}
                onSelect={(selected) => handleSelectItem(item.id, selected)}
                onQuantityChange={(quantity) => handleQuantityChange(item.id, quantity)}
                onRemove={() => handleRemove(item.id)}
                onView={() => navigate(`/marketplace/product/${item.product_id}`)}
              />
            ))}
          </div>

          {/* 结算栏 */}
          <div className="lg:col-span-1">
            <CheckoutPanelEnhanced
              selectedItems={cartStats.selectedItems}
              subtotal={cartStats.totalPrice || 0}
              shipping={0}
              discount={appliedCoupon?.isValid ? appliedCoupon.discount : 0}
              couponCode={couponCode}
              onApplyCoupon={handleValidateCoupon}
              onRemoveCoupon={removeCoupon}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
