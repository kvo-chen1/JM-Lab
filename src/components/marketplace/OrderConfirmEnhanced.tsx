import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Truck,
  CreditCard,
  FileText,
  Check,
  ChevronRight,
  ShieldCheck,
  Gift,
  Tag,
  X
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  coverImage: string;
  price: number;
  quantity: number;
  spec?: string;
}

interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  province?: string;
  city?: string;
  district?: string;
}

interface OrderConfirmEnhancedProps {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  onAddressChange?: (address: ShippingAddress) => void;
  onSubmit?: () => void;
  loading?: boolean;
  subtotal: number;
  shipping?: number;
  discount?: number;
}

const OrderConfirmEnhanced: React.FC<OrderConfirmEnhancedProps> = ({
  items,
  shippingAddress,
  onAddressChange,
  onSubmit,
  loading = false,
  subtotal,
  shipping = 0,
  discount = 0
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const [selectedPayment, setSelectedPayment] = useState('wechat');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editedAddress, setEditedAddress] = useState<ShippingAddress>(shippingAddress);

  const total = subtotal + shipping - discount;

  const handleSaveAddress = () => {
    if (onAddressChange) {
      onAddressChange(editedAddress);
    }
    setIsEditingAddress(false);
  };

  const shippingMethods = [
    { id: 'standard', name: '标准配送', time: '3-5个工作日', price: 0, icon: Truck },
    { id: 'express', name: '极速配送', time: '次日达', price: 15, icon: Truck }
  ];

  const paymentMethods = [
    { id: 'wechat', name: '微信支付', icon: '💚', color: 'bg-green-500' },
    { id: 'alipay', name: '支付宝', icon: '💙', color: 'bg-blue-500' },
    { id: 'card', name: '银行卡支付', icon: '💳', color: 'bg-purple-500' }
  ];

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      setCouponApplied(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-[#C02C38]" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">收货地址</h2>
        </div>

        <AnimatePresence mode="wait">
          {isEditingAddress ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 rounded-xl p-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={editedAddress.name}
                  onChange={(e) => setEditedAddress({ ...editedAddress, name: e.target.value })}
                  placeholder="收货人姓名"
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C02C38] focus:border-transparent text-sm"
                />
                <input
                  type="text"
                  value={editedAddress.phone}
                  onChange={(e) => setEditedAddress({ ...editedAddress, phone: e.target.value })}
                  placeholder="联系电话"
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C02C38] focus:border-transparent text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  value={editedAddress.province || ''}
                  onChange={(e) => setEditedAddress({ ...editedAddress, province: e.target.value })}
                  placeholder="省"
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C02C38] focus:border-transparent text-sm"
                />
                <input
                  type="text"
                  value={editedAddress.city || ''}
                  onChange={(e) => setEditedAddress({ ...editedAddress, city: e.target.value })}
                  placeholder="市"
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C02C38] focus:border-transparent text-sm"
                />
                <input
                  type="text"
                  value={editedAddress.district || ''}
                  onChange={(e) => setEditedAddress({ ...editedAddress, district: e.target.value })}
                  placeholder="区"
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C02C38] focus:border-transparent text-sm"
                />
              </div>
              <input
                type="text"
                value={editedAddress.address}
                onChange={(e) => setEditedAddress({ ...editedAddress, address: e.target.value })}
                placeholder="详细地址"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C02C38] focus:border-transparent text-sm"
              />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveAddress}
                  className="flex-1 bg-[#C02C38] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#991b1b] transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setEditedAddress(shippingAddress);
                    setIsEditingAddress(false);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                >
                  取消
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-gray-50 rounded-xl p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{shippingAddress.name}</span>
                    <span className="text-gray-600">{shippingAddress.phone}</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {shippingAddress.province} {shippingAddress.city} {shippingAddress.district} {shippingAddress.address}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditingAddress(true)}
                  className="text-[#C02C38] text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  修改 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">商品清单</h2>
        <div className="space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="flex gap-4 py-4 border-b border-gray-100 last:border-0"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <span className="text-xs text-gray-400">暂无图片</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 line-clamp-2">{item.name}</h3>
                {item.spec && (
                  <p className="text-sm text-gray-500 mt-1">{item.spec}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span className="text-[#C02C38] font-bold text-lg">
                      ¥{item.price.toLocaleString()}
                    </span>
                    <span className="text-gray-400 ml-2">x{item.quantity}</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ¥{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">配送方式</h2>
        </div>
        <div className="space-y-3">
          {shippingMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => setSelectedShipping(method.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  selectedShipping === method.id
                    ? 'border-[#C02C38] bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${selectedShipping === method.id ? 'text-[#C02C38]' : 'text-gray-400'}`} />
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{method.name}</div>
                  <div className="text-sm text-gray-500">{method.time}</div>
                </div>
                <div className="text-right">
                  {method.price === 0 ? (
                    <span className="text-green-600 font-medium">包邮</span>
                  ) : (
                    <span className="text-gray-900 font-medium">¥{method.price}</span>
                  )}
                </div>
                {selectedShipping === method.id && (
                  <Check className="w-5 h-5 text-[#C02C38]" />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">支付方式</h2>
        </div>
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedPayment(method.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                selectedPayment === method.id
                  ? 'border-[#C02C38] bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-10 h-10 ${method.color} rounded-xl flex items-center justify-center text-xl`}>
                {method.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900">{method.name}</div>
                <div className="text-sm text-gray-500">推荐使用</div>
              </div>
              {selectedPayment === method.id && (
                <Check className="w-5 h-5 text-[#C02C38]" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
            <Tag className="w-5 h-5 text-yellow-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">优惠券</h2>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="输入优惠券码"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C02C38] focus:border-transparent"
            disabled={couponApplied}
          />
          <button
            onClick={handleApplyCoupon}
            disabled={couponApplied || !couponCode.trim()}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              couponApplied
                ? 'bg-green-100 text-green-700'
                : 'bg-[#C02C38] text-white hover:bg-[#991b1b] disabled:opacity-50'
            }`}
          >
            {couponApplied ? '已使用' : '使用'}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-gray-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">订单备注</h2>
        </div>
        <textarea
          placeholder="如有特殊要求，请在此填写..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C02C38] focus:border-transparent resize-none"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">订单结算</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">商品总价</span>
            <span className="text-gray-900">¥{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">运费</span>
            <span className={shipping === 0 ? 'text-green-600' : 'text-gray-900'}>
              {shipping === 0 ? '包邮' : `+¥${shipping}`}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">优惠</span>
              <span className="text-[#C02C38]">-¥{discount}</span>
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 mt-4 pt-4">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900 text-lg">应付总额</span>
            <span className="text-3xl font-bold text-[#C02C38]">¥{total.toLocaleString()}</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="bg-blue-50 border border-blue-100 rounded-xl p-4"
      >
        <div className="flex items-center justify-center gap-6 text-sm text-blue-700">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            安全支付
          </span>
          <span className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            正品保障
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            7天无理由
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-full h-16 bg-gradient-to-r from-[#C02C38] to-[#8B1A23] text-white text-lg font-bold rounded-2xl shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              提交中...
            </div>
          ) : (
            `提交订单 ¥${total.toLocaleString()}`
          )}
        </button>
      </motion.div>
    </div>
  );
};

export default OrderConfirmEnhanced;
