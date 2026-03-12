/**
 * 订单确认页面
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart, useProduct } from '@/hooks/useProducts';
import { useCreateOrder } from '@/hooks/useOrders';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Separator } from '@/components/ui/Separator';
import { ArrowLeft, MapPin, Truck, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  product_id: string;
  product_name: string;
  product_image?: string;
  price: number;
  quantity: number;
  product?: {
    id: string;
    name: string;
    cover_image?: string;
    price: number;
    seller_id?: string;
  };
}

const OrderConfirmPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { cartItems, refetch } = useCart(user?.id || null);
  const { createOrder, loading } = useCreateOrder();

  // 获取直接购买参数
  const directProductId = searchParams.get('productId');
  const directQuantity = parseInt(searchParams.get('quantity') || '1');

  // 获取直接购买的商品信息
  const { product: directProduct } = useProduct(directProductId);

  // 收货地址表单
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    address: '',
    zipCode: '',
  });
  const [remark, setRemark] = useState('');

  // 构建订单商品列表
  const selectedItems: OrderItem[] = React.useMemo(() => {
    // 如果是直接购买
    if (directProductId && directProduct) {
      return [{
        product_id: directProduct.id,
        product_name: directProduct.name,
        product_image: directProduct.cover_image,
        price: directProduct.price,
        quantity: directQuantity,
        product: directProduct,
      }];
    }
    // 否则从购物车获取选中的商品
    return cartItems.filter((item) => item.selected);
  }, [directProductId, directProduct, directQuantity, cartItems]);

  // 计算总价
  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + (item.product?.price || item.price || 0) * item.quantity,
    0
  );

  const handleSubmitOrder = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    // 验证地址
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.address) {
      toast.error('请填写完整的收货地址');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('请选择要购买的商品');
      return;
    }

    // 获取卖家ID（假设所有商品来自同一个卖家，或者取第一个商品的卖家）
    // 如果商品没有 seller_id，使用一个默认的系统卖家ID
    const sellerId = selectedItems[0]?.product?.seller_id || '00000000-0000-0000-0000-000000000001';
    if (!sellerId) {
      toast.error('商品信息有误');
      return;
    }

    const orderItems = selectedItems.map((item) => ({
      product_id: item.product_id,
      product_name: item.product?.name || '',
      product_image: item.product?.cover_image,
      price: item.product?.price || 0,
      quantity: item.quantity,
    }));

    const order = await createOrder({
      customer_id: user.id,
      seller_id: sellerId,
      items: orderItems,
      shipping_address: {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        province: shippingAddress.province,
        city: shippingAddress.city,
        district: shippingAddress.district,
        address: shippingAddress.address,
        zip_code: shippingAddress.zipCode,
      },
      remark,
    });

    if (order) {
      toast.success('订单创建成功！');
      // 清空购物车中已购买的商品
      for (const item of selectedItems) {
        // 这里可以调用清空购物车API
      }
      refetch();
      // 跳转到支付页面
      navigate(`/marketplace/order/pay/${order.id}`);
    } else {
      toast.error('订单创建失败，请重试');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">请先登录</p>
          <Button onClick={() => navigate('/login')} className="mt-4">
            去登录
          </Button>
        </div>
      </div>
    );
  }

  // 显示加载状态
  if (directProductId && !directProduct) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C02C38] mx-auto"></div>
          <p className="mt-4 text-gray-600">加载商品信息...</p>
        </div>
      </div>
    );
  }

  if (selectedItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-gray-600">
              {directProductId ? '商品信息加载失败' : '购物车中没有选中的商品'}
            </p>
            <Button onClick={() => navigate(directProductId ? '/marketplace' : '/marketplace/cart')} className="mt-4">
              {directProductId ? '返回商城' : '返回购物车'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顶部导航 */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">📝 确认订单</h1>

        <div className="space-y-6">
          {/* 收货地址 */}
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-[#C02C38]" />
              <h2 className="font-semibold text-lg">收货地址</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">收货人姓名 *</Label>
                <Input
                  id="name"
                  value={shippingAddress.name}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, name: e.target.value })
                  }
                  placeholder="请输入收货人姓名"
                />
              </div>
              <div>
                <Label htmlFor="phone">手机号码 *</Label>
                <Input
                  id="phone"
                  value={shippingAddress.phone}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, phone: e.target.value })
                  }
                  placeholder="请输入手机号码"
                />
              </div>
              <div>
                <Label htmlFor="province">省份</Label>
                <Input
                  id="province"
                  value={shippingAddress.province}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, province: e.target.value })
                  }
                  placeholder="请输入省份"
                />
              </div>
              <div>
                <Label htmlFor="city">城市</Label>
                <Input
                  id="city"
                  value={shippingAddress.city}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, city: e.target.value })
                  }
                  placeholder="请输入城市"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">详细地址 *</Label>
                <Textarea
                  id="address"
                  value={shippingAddress.address}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, address: e.target.value })
                  }
                  placeholder="请输入详细地址，如街道、门牌号等"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* 商品列表 */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">商品清单</h2>
            <div className="space-y-4">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 border-b last:border-0">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
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
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{item.product?.name}</h3>
                    {item.product?.brand && (
                      <p className="text-sm text-gray-500">{item.product.brand.name}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[#C02C38] font-bold">
                        ¥{(item.product?.price || 0).toLocaleString()}
                      </span>
                      <span className="text-gray-500">x{item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 配送方式 */}
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-[#C02C38]" />
              <h2 className="font-semibold text-lg">配送方式</h2>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span>快递配送</span>
              <span className="text-green-600">包邮</span>
            </div>
          </div>

          {/* 支付方式 */}
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-[#C02C38]" />
              <h2 className="font-semibold text-lg">支付方式</h2>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span>在线支付</span>
              <span className="text-sm text-gray-500">支持微信支付、支付宝</span>
            </div>
          </div>

          {/* 订单备注 */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">订单备注</h2>
            <Textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="如有特殊要求，请在此填写..."
              rows={3}
            />
          </div>

          {/* 订单结算 */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">订单结算</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">商品总价</span>
                <span>¥{(totalAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">运费</span>
                <span className="text-green-600">+¥0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">优惠</span>
                <span className="text-[#C02C38]">-¥0</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between items-center">
              <span className="font-semibold">应付总额</span>
              <span className="text-2xl font-bold text-[#C02C38]">
                ¥{(totalAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* 提交按钮 */}
          <Button
            onClick={handleSubmitOrder}
            disabled={loading}
            className="w-full h-14 bg-[#C02C38] hover:bg-[#991b1b] text-lg"
          >
            {loading ? '提交中...' : `提交订单 (¥${(totalAmount || 0).toLocaleString()})`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmPage;
