import { apiClient } from '@/lib/apiClient';

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  plan: string;
  paymentMethod: string;
  createdAt: string;
  qrCodeUrl?: string; // 微信/支付宝二维码URL
  checkoutUrl?: string; // Stripe/收银台跳转URL
}

class PaymentService {
  // 创建支付订单
  async createOrder(plan: string, amount: number, paymentMethod: string): Promise<PaymentOrder> {
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 800));

    // 在真实场景中，这里会调用后端 API: POST /api/orders
    // const response = await apiClient.post('/api/orders', { plan, amount, paymentMethod });
    // return response.data;

    // 模拟返回数据
    return {
      id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      amount,
      currency: 'CNY',
      status: 'pending',
      plan,
      paymentMethod,
      createdAt: new Date().toISOString(),
      // 模拟支付链接或二维码
      checkoutUrl: paymentMethod === 'stripe' ? 'https://checkout.stripe.com/...' : undefined,
      qrCodeUrl: ['wechat', 'alipay'].includes(paymentMethod) ? 'mock_qr_code_url' : undefined
    };
  }

  // 查询订单状态
  async checkOrderStatus(orderId: string): Promise<'pending' | 'paid' | 'failed'> {
    // 模拟API请求
    // const response = await apiClient.get(`/api/orders/${orderId}/status`);
    // return response.data.status;

    // 模拟：有 80% 概率支付成功，20% 继续等待
    return Math.random() > 0.2 ? 'paid' : 'pending';
  }

  // 模拟支付成功回调（仅用于演示，真实场景由Webhook处理）
  async mockPaySuccess(orderId: string) {
    return { success: true };
  }
}

export const paymentService = new PaymentService();
