/**
 * 真实支付服务
 * 集成微信支付和支付宝
 */

import QRCode from 'qrcode';
import crypto from 'crypto';

// 动态导入支付SDK（避免启动时出错）
let WechatPay = null;
let AlipaySdk = null;

try {
  const wechatModule = await import('wechatpay-node-v3');
  WechatPay = wechatModule.default || wechatModule;
} catch (e) {
  console.log('[Payment] wechatpay-node-v3 not available');
}

try {
  const alipayModule = await import('alipay-sdk');
  AlipaySdk = alipayModule.default || alipayModule;
} catch (e) {
  console.log('[Payment] alipay-sdk not available');
}

// 微信支付配置
const WECHAT_CONFIG = {
  appid: process.env.WECHAT_APPID || '',
  mchid: process.env.WECHAT_MCHID || '',
  privateKey: process.env.WECHAT_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  certSerialNo: process.env.WECHAT_CERT_SERIAL_NO || '',
  apiV3Key: process.env.WECHAT_APIV3_KEY || '',
  notifyUrl: process.env.WECHAT_NOTIFY_URL || 'https://your-domain.com/api/payment/webhook/wechat',
};

// 支付宝配置
const ALIPAY_CONFIG = {
  appId: process.env.ALIPAY_APPID || '',
  privateKey: process.env.ALIPAY_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY?.replace(/\\n/g, '\n') || '',
  gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
  notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'https://your-domain.com/api/payment/webhook/alipay',
  returnUrl: process.env.ALIPAY_RETURN_URL || 'https://your-domain.com/membership/payment/success',
};

// 初始化微信支付
let wechatPayInstance = null;
try {
  if (WECHAT_CONFIG.appid && WECHAT_CONFIG.mchid && WECHAT_CONFIG.privateKey) {
    wechatPayInstance = new WechatPay({
      appid: WECHAT_CONFIG.appid,
      mchid: WECHAT_CONFIG.mchid,
      private_key: WECHAT_CONFIG.privateKey,
      serial_no: WECHAT_CONFIG.certSerialNo,
      apiv3_private_key: WECHAT_CONFIG.apiV3Key,
    });
    console.log('[PaymentService] 微信支付初始化成功');
  }
} catch (error) {
  console.error('[PaymentService] 微信支付初始化失败:', error.message);
}

// 初始化支付宝
let alipaySdkInstance = null;
try {
  if (ALIPAY_CONFIG.appId && ALIPAY_CONFIG.privateKey) {
    alipaySdkInstance = new AlipaySdk({
      appId: ALIPAY_CONFIG.appId,
      privateKey: ALIPAY_CONFIG.privateKey,
      alipayPublicKey: ALIPAY_CONFIG.alipayPublicKey,
      gateway: ALIPAY_CONFIG.gateway,
      signType: 'RSA2',
    });
    console.log('[PaymentService] 支付宝初始化成功');
  }
} catch (error) {
  console.error('[PaymentService] 支付宝初始化失败:', error.message);
}

class RealPaymentService {
  /**
   * 检查支付配置是否可用
   */
  isWechatAvailable() {
    return !!wechatPayInstance;
  }

  isAlipayAvailable() {
    return !!alipaySdkInstance;
  }

  /**
   * 创建微信支付订单（Native支付，生成二维码）
   */
  async createWechatOrder(orderId, amount, description, attach = '') {
    if (!this.isWechatAvailable()) {
      throw new Error('微信支付未配置');
    }

    try {
      const params = {
        description: description || '会员充值',
        out_trade_no: orderId,
        notify_url: WECHAT_CONFIG.notifyUrl,
        amount: {
          total: Math.round(amount * 100), // 转换为分
        },
        attach: attach,
      };

      const result = await wechatPayInstance.transactions_native(params);
      
      if (result.code_url) {
        // 生成二维码
        const qrCodeDataUrl = await QRCode.toDataURL(result.code_url, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });

        return {
          success: true,
          codeUrl: result.code_url,
          qrCode: qrCodeDataUrl,
          prepayId: result.prepay_id,
        };
      }

      throw new Error('创建微信支付订单失败');
    } catch (error) {
      console.error('[WechatPay] 创建订单失败:', error);
      throw error;
    }
  }

  /**
   * 创建支付宝订单（当面付，生成二维码）
   */
  async createAlipayOrder(orderId, amount, subject, body = '') {
    if (!this.isAlipayAvailable()) {
      throw new Error('支付宝未配置');
    }

    try {
      const result = await alipaySdkInstance.exec('alipay.trade.precreate', {
        notifyUrl: ALIPAY_CONFIG.notifyUrl,
        bizContent: {
          outTradeNo: orderId,
          totalAmount: amount.toFixed(2),
          subject: subject || '会员充值',
          body: body,
          timeoutExpress: '30m', // 30分钟超时
        },
      });

      if (result.code === '10000' && result.qrCode) {
        // 生成二维码
        const qrCodeDataUrl = await QRCode.toDataURL(result.qrCode, {
          width: 200,
          margin: 2,
          color: {
            dark: '#1677FF',
            light: '#ffffff',
          },
        });

        return {
          success: true,
          qrCode: qrCodeDataUrl,
          qrCodeUrl: result.qrCode,
          tradeNo: result.tradeNo,
        };
      }

      throw new Error(result.msg || '创建支付宝订单失败');
    } catch (error) {
      console.error('[Alipay] 创建订单失败:', error);
      throw error;
    }
  }

  /**
   * 查询微信支付订单状态
   */
  async queryWechatOrder(orderId) {
    if (!this.isWechatAvailable()) {
      throw new Error('微信支付未配置');
    }

    try {
      const result = await wechatPayInstance.query({ out_trade_no: orderId });
      
      return {
        success: true,
        orderId: orderId,
        status: this.mapWechatStatus(result.trade_state),
        amount: result.amount?.total ? result.amount.total / 100 : 0,
        transactionId: result.transaction_id,
        paidAt: result.success_time,
      };
    } catch (error) {
      console.error('[WechatPay] 查询订单失败:', error);
      throw error;
    }
  }

  /**
   * 查询支付宝订单状态
   */
  async queryAlipayOrder(orderId) {
    if (!this.isAlipayAvailable()) {
      throw new Error('支付宝未配置');
    }

    try {
      const result = await alipaySdkInstance.exec('alipay.trade.query', {
        bizContent: {
          outTradeNo: orderId,
        },
      });

      if (result.code === '10000') {
        return {
          success: true,
          orderId: orderId,
          status: this.mapAlipayStatus(result.tradeStatus),
          amount: parseFloat(result.totalAmount),
          tradeNo: result.tradeNo,
          paidAt: result.sendPayDate,
        };
      }

      throw new Error(result.msg || '查询支付宝订单失败');
    } catch (error) {
      console.error('[Alipay] 查询订单失败:', error);
      throw error;
    }
  }

  /**
   * 处理微信支付回调
   */
  async handleWechatWebhook(headers, body) {
    if (!this.isWechatAvailable()) {
      throw new Error('微信支付未配置');
    }

    try {
      // 验证签名
      const signature = headers['wechatpay-signature'];
      const timestamp = headers['wechatpay-timestamp'];
      const nonce = headers['wechatpay-nonce'];
      const serial = headers['wechatpay-serial'];

      const verified = await wechatPayInstance.verifySignature({
        signature,
        timestamp,
        nonce,
        serial,
        body,
      });

      if (!verified) {
        throw new Error('签名验证失败');
      }

      // 解密数据
      const decrypted = wechatPayInstance.decrypt(body);
      const data = JSON.parse(decrypted);

      return {
        success: true,
        orderId: data.out_trade_no,
        transactionId: data.transaction_id,
        amount: data.amount?.total ? data.amount.total / 100 : 0,
        status: this.mapWechatStatus(data.trade_state),
        paidAt: data.success_time,
        attach: data.attach,
      };
    } catch (error) {
      console.error('[WechatPay] 处理回调失败:', error);
      throw error;
    }
  }

  /**
   * 处理支付宝回调
   */
  async handleAlipayWebhook(body) {
    if (!this.isAlipayAvailable()) {
      throw new Error('支付宝未配置');
    }

    try {
      // 验证签名
      const verified = alipaySdkInstance.checkNotifySign(body);

      if (!verified) {
        throw new Error('签名验证失败');
      }

      return {
        success: true,
        orderId: body.out_trade_no,
        tradeNo: body.trade_no,
        amount: parseFloat(body.total_amount),
        status: this.mapAlipayStatus(body.trade_status),
        paidAt: body.gmt_payment,
        buyerId: body.buyer_id,
      };
    } catch (error) {
      console.error('[Alipay] 处理回调失败:', error);
      throw error;
    }
  }

  /**
   * 关闭微信支付订单
   */
  async closeWechatOrder(orderId) {
    if (!this.isWechatAvailable()) {
      throw new Error('微信支付未配置');
    }

    try {
      await wechatPayInstance.close({ out_trade_no: orderId });
      return { success: true };
    } catch (error) {
      console.error('[WechatPay] 关闭订单失败:', error);
      throw error;
    }
  }

  /**
   * 关闭支付宝订单
   */
  async closeAlipayOrder(orderId) {
    if (!this.isAlipayAvailable()) {
      throw new Error('支付宝未配置');
    }

    try {
      await alipaySdkInstance.exec('alipay.trade.close', {
        bizContent: {
          outTradeNo: orderId,
        },
      });
      return { success: true };
    } catch (error) {
      console.error('[Alipay] 关闭订单失败:', error);
      throw error;
    }
  }

  /**
   * 微信退款
   */
  async refundWechatOrder(orderId, refundId, amount, reason = '') {
    if (!this.isWechatAvailable()) {
      throw new Error('微信支付未配置');
    }

    try {
      const result = await wechatPayInstance.refund({
        out_trade_no: orderId,
        out_refund_no: refundId,
        reason: reason,
        amount: {
          refund: Math.round(amount * 100),
          total: Math.round(amount * 100),
          currency: 'CNY',
        },
      });

      return {
        success: true,
        refundId: result.refund_id,
        status: result.status,
      };
    } catch (error) {
      console.error('[WechatPay] 退款失败:', error);
      throw error;
    }
  }

  /**
   * 支付宝退款
   */
  async refundAlipayOrder(orderId, refundId, amount, reason = '') {
    if (!this.isAlipayAvailable()) {
      throw new Error('支付宝未配置');
    }

    try {
      const result = await alipaySdkInstance.exec('alipay.trade.refund', {
        bizContent: {
          outTradeNo: orderId,
          refundAmount: amount.toFixed(2),
          refundReason: reason,
          outRequestNo: refundId,
        },
      });

      if (result.code === '10000') {
        return {
          success: true,
          refundId: refundId,
          refundAmount: parseFloat(result.refundFee),
        };
      }

      throw new Error(result.msg || '退款失败');
    } catch (error) {
      console.error('[Alipay] 退款失败:', error);
      throw error;
    }
  }

  /**
   * 映射微信支付状态
   */
  mapWechatStatus(tradeState) {
    const statusMap = {
      SUCCESS: 'paid',
      REFUND: 'refunded',
      NOTPAY: 'pending',
      CLOSED: 'cancelled',
      REVOKED: 'cancelled',
      USERPAYING: 'pending',
      PAYERROR: 'failed',
    };
    return statusMap[tradeState] || 'pending';
  }

  /**
   * 映射支付宝支付状态
   */
  mapAlipayStatus(tradeStatus) {
    const statusMap = {
      WAIT_BUYER_PAY: 'pending',
      TRADE_CLOSED: 'cancelled',
      TRADE_SUCCESS: 'paid',
      TRADE_FINISHED: 'paid',
    };
    return statusMap[tradeStatus] || 'pending';
  }

  /**
   * 获取支付配置状态
   */
  getConfigStatus() {
    return {
      wechat: {
        available: this.isWechatAvailable(),
        appid: WECHAT_CONFIG.appid ? '已配置' : '未配置',
        mchid: WECHAT_CONFIG.mchid ? '已配置' : '未配置',
        notifyUrl: WECHAT_CONFIG.notifyUrl,
      },
      alipay: {
        available: this.isAlipayAvailable(),
        appId: ALIPAY_CONFIG.appId ? '已配置' : '未配置',
        notifyUrl: ALIPAY_CONFIG.notifyUrl,
      },
    };
  }
}

export const realPaymentService = new RealPaymentService();
export default realPaymentService;
