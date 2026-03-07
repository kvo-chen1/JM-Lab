/**
 * 购物车页面
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart, useUpdateCartItem, useRemoveFromCart } from '@/hooks/useProducts';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Separator } from '@/components/ui/Separator';
import { ArrowLeft, Trash2, Minus, Plus, ShoppingBag, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartStats, loading, refetch } = useCart(user?.id || null);
  const { updateCartItem } = useUpdateCartItem();
  const { removeFromCart } = useRemoveFromCart();

  // 全选状态
  const allSelected = cartItems.length > 0 && cartItems.every((item) => item.selected);

  // 处理全选
  const handleSelectAll = async (checked: boolean) => {
    if (!user) return;
    for (const item of cartItems) {
      await updateCartItem(item.id, { selected: checked });
    }
    refetch();
  };

  // 处理选择单个商品
  const handleSelectItem = async (itemId: string, checked: boolean) => {
    await updateCartItem(itemId, { selected: checked });
    refetch();
  };

  // 处理数量变更
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    await updateCartItem(itemId, { quantity: newQuantity });
    refetch();
  };

  // 处理删除
  const handleRemove = async (itemId: string) => {
    const success = await removeFromCart(itemId);
    if (success) {
      toast.success('已删除商品');
      refetch();
    }
  };

  // 处理结算
  const handleCheckout = () => {
    const selectedItems = cartItems.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      toast.error('请选择要购买的商品');
      return;
    }
    navigate('/marketplace/order/confirm');
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
            <div className="bg-white rounded-xl p-4 flex items-center gap-4">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
              />
              <span className="font-medium">全选</span>
              <span className="text-gray-500">({cartItems.length}件商品)</span>
            </div>

            {/* 购物车商品 */}
            {cartItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-xl p-4 flex gap-4 ${
                  !item.selected ? 'opacity-70' : ''
                }`}
              >
                <Checkbox
                  checked={item.selected}
                  onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                  className="mt-8"
                />

                {/* 商品图片 */}
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.product?.cover_image ? (
                    <img
                      src={item.product.cover_image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-xs text-gray-400">暂无图片</span>
                    </div>
                  )}
                </div>

                {/* 商品信息 */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-medium text-gray-800 line-clamp-2 cursor-pointer hover:text-[#C02C38]"
                    onClick={() => navigate(`/marketplace/product/${item.product_id}`)}
                  >
                    {item.product?.name}
                  </h3>
                  {item.product?.brand && (
                    <p className="text-sm text-gray-500 mt-1">{item.product.brand.name}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-[#C02C38]">
                      ¥{item.product?.price?.toLocaleString()}
                    </span>

                    {/* 数量控制 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 删除按钮 */}
                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* 结算栏 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 sticky top-4">
              <h3 className="font-semibold text-lg mb-4">订单结算</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">商品总数</span>
                  <span>{cartStats.selectedItems} 件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">商品总价</span>
                  <span>¥{cartStats.totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">运费</span>
                  <span className="text-green-600">包邮</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center mb-6">
                <span className="font-semibold">合计</span>
                <span className="text-2xl font-bold text-[#C02C38]">
                  ¥{cartStats.totalPrice.toLocaleString()}
                </span>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={cartStats.selectedItems === 0}
                className="w-full h-12 bg-[#C02C38] hover:bg-[#991b1b] text-lg"
              >
                去结算 ({cartStats.selectedItems})
              </Button>

              {cartStats.selectedItems === 0 && (
                <p className="text-sm text-gray-500 text-center mt-3 flex items-center justify-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  请选择要购买的商品
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
