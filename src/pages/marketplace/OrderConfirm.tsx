/**
 * 订单确认页面
 */
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart, useProduct } from '@/hooks/useProducts';
import { useCreateOrder } from '@/hooks/useOrders';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { OrderConfirmEnhanced } from '@/components/marketplace';

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
    // 否则从购物车获取选中的商品，并映射为 OrderItem 格式
    return cartItems
      .filter((item) => item.selected)
      .map((item) => ({
        product_id: item.product_id,
        product_name: item.product?.name || '',
        product_image: item.product?.cover_image,
        price: item.product?.price || 0,
        quantity: item.quantity,
        product: item.product,
      }));
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
    const firstProduct = selectedItems[0]?.product;
    console.log('[OrderConfirm] 第一个商品信息:', firstProduct);
    console.log('[OrderConfirm] 商品 seller_id:', firstProduct?.seller_id);
    
    const sellerId = firstProduct?.seller_id || '00000000-0000-0000-0000-000000000001';
    console.log('[OrderConfirm] 使用的 sellerId:', sellerId);
    
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
          <p className="mt-2 text-sm text-gray-400">商品ID: {directProductId}</p>
          <button
            onClick={() => navigate('/marketplace')}
            className="mt-6 px-4 py-2 text-sm text-[#C02C38] border border-[#C02C38] rounded-lg hover:bg-red-50 transition-colors"
          >
            返回商城
          </button>
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顶部导航 */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">📝 确认订单</h1>

        <OrderConfirmEnhanced
          items={selectedItems.map((item) => ({
            id: item.product_id,
            name: item.product_name,
            coverImage: item.product?.cover_image || '',
            price: item.product?.price || 0,
            quantity: item.quantity
          }))}
          shippingAddress={shippingAddress}
          onAddressChange={setShippingAddress}
          onSubmit={handleSubmitOrder}
          loading={loading}
          subtotal={totalAmount || 0}
          shipping={0}
          discount={0}
        />
      </div>
    </div>
  );
};

export default OrderConfirmPage;
