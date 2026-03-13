import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, CreditCard, ShieldCheck, Tag, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CheckoutPanelEnhancedProps {
  selectedItems: number;
  subtotal: number;
  shipping?: number;
  discount?: number;
  couponCode?: string;
  onApplyCoupon?: (code: string) => void;
  onCheckout?: () => void;
  loading?: boolean;
}

const CheckoutPanelEnhanced: React.FC<CheckoutPanelEnhancedProps> = ({
  selectedItems,
  subtotal,
  shipping = 0,
  discount = 0,
  couponCode: initialCouponCode = '',
  onApplyCoupon,
  onCheckout,
  loading = false
}) => {
  const [couponCode, setCouponCode] = useState(initialCouponCode);
  const [couponApplied, setCouponApplied] = useState(false);

  const total = subtotal + shipping - discount;
  const canCheckout = selectedItems > 0;

  const handleApplyCoupon = () => {
    if (couponCode.trim() && onApplyCoupon) {
      onApplyCoupon(couponCode);
      setCouponApplied(true);
    }
  };

  return (
    <div className="sticky top-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-[#C02C38] to-[#8B1A23] p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">订单结算</h3>
              <p className="text-white/80 text-sm">共 {selectedItems} 件商品</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {!couponApplied && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">优惠券</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="输入优惠券码"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C02C38] focus:border-transparent"
                />
                <Button
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim()}
                  className="px-4 bg-[#C02C38] hover:bg-[#991b1b] text-sm"
                >
                  使用
                </Button>
              </div>
            </motion.div>
          )}

          {couponApplied && discount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">优惠码已使用</span>
              </div>
              <span className="text-green-700 font-bold">-¥{discount.toLocaleString()}</span>
            </motion.div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">商品总价</span>
              <span className="text-gray-900 font-medium">¥{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">运费</span>
              <span className={shipping === 0 ? 'text-green-600 font-medium' : 'text-gray-900 font-medium'}>
                {shipping === 0 ? '包邮' : `¥${shipping.toLocaleString()}`}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">优惠</span>
                <span className="text-[#C02C38] font-medium">-¥{discount.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-900 font-bold text-lg">应付总额</span>
              <span className="text-3xl font-bold text-[#C02C38]">
                ¥{total.toLocaleString()}
              </span>
            </div>
          </div>

          <Button
            onClick={onCheckout}
            disabled={!canCheckout || loading}
            className="w-full h-14 bg-gradient-to-r from-[#C02C38] to-[#8B1A23] hover:from-[#991b1b] hover:to-[#6B141C] text-lg font-bold rounded-xl shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                处理中...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5" />
                去结算
                <ChevronRight className="w-5 h-5" />
              </div>
            )}
          </Button>

          {!canCheckout && (
            <p className="text-center text-sm text-gray-500 flex items-center justify-center gap-1">
              请选择要购买的商品
            </p>
          )}

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>安全支付</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>正品保障</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>7天无理由</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutPanelEnhanced;
