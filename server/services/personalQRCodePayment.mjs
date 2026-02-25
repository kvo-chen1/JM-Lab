/**
 * 个人收款码支付服务
 * 适用于没有企业资质的个人开发者
 * 流程：显示收款码 -> 用户支付 -> 上传凭证 -> 审核确认
 */

import { supabaseServer } from '../supabase-server.mjs';

// 从环境变量读取收款码配置
const QR_CODE_CONFIG = {
  wechat: {
    enabled: process.env.PERSONAL_WECHAT_ENABLED === 'true',
    qrCodeUrl: process.env.PERSONAL_WECHAT_QR_CODE || '',
    name: process.env.PERSONAL_WECHAT_NAME || '微信收款',
    account: process.env.PERSONAL_WECHAT_ACCOUNT || '',
  },
  alipay: {
    enabled: process.env.PERSONAL_ALIPAY_ENABLED === 'true',
    qrCodeUrl: process.env.PERSONAL_ALIPAY_QR_CODE || '',
    name: process.env.PERSONAL_ALIPAY_NAME || '支付宝收款',
    account: process.env.PERSONAL_ALIPAY_ACCOUNT || '',
  },
  // 是否开启自动审核（根据订单号匹配）
  autoVerify: process.env.PERSONAL_PAYMENT_AUTO_VERIFY === 'true',
  // 管理员通知方式
  notifyMethod: process.env.PERSONAL_PAYMENT_NOTIFY || 'email', // email, sms, webhook
};

class PersonalQRCodePaymentService {
  /**
   * 获取收款码配置
   */
  getQRCodeConfig() {
    return {
      wechat: {
        enabled: QR_CODE_CONFIG.wechat.enabled && !!QR_CODE_CONFIG.wechat.qrCodeUrl,
        qrCodeUrl: QR_CODE_CONFIG.wechat.qrCodeUrl,
        name: QR_CODE_CONFIG.wechat.name,
        account: QR_CODE_CONFIG.wechat.account,
      },
      alipay: {
        enabled: QR_CODE_CONFIG.alipay.enabled && !!QR_CODE_CONFIG.alipay.qrCodeUrl,
        qrCodeUrl: QR_CODE_CONFIG.alipay.qrCodeUrl,
        name: QR_CODE_CONFIG.alipay.name,
        account: QR_CODE_CONFIG.alipay.account,
      },
      autoVerify: QR_CODE_CONFIG.autoVerify,
      instructions: this.getPaymentInstructions(),
    };
  }

  /**
   * 获取支付说明
   */
  getPaymentInstructions() {
    return [
      '请使用微信或支付宝扫描上方二维码完成支付',
      `支付金额必须与订单金额一致`,
      '支付完成后，请在下方填写支付订单号或上传支付截图',
      '我们将在确认收款后尽快为您开通会员',
      '如有问题，请联系客服',
    ];
  }

  /**
   * 创建个人收款码支付订单
   */
  async createOrder(userId, plan, amount, period, paymentMethod) {
    try {
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 生成唯一的支付识别码（用于备注）
      const paymentCode = this.generatePaymentCode(orderId);
      
      // 使用 metadata 字段存储个人支付特有的数据
      const metadata = {
        payment_type: 'personal_qr',
        payment_code: paymentCode,
        payment_proof: null,
        payer_info: null,
        verified_by: null,
        verified_at: null,
        notes: null,
      };

      const order = {
        id: orderId,
        user_id: userId,
        plan,
        plan_name: plan === 'premium' ? '高级会员' : 'VIP会员',
        period,
        amount,
        currency: 'CNY',
        status: 'pending',
        payment_method: paymentMethod,
        payment_data: null,
        metadata: metadata,
        created_at: new Date().toISOString(),
        paid_at: null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const { error } = await supabaseServer
        .from('membership_orders')
        .insert([order]);

      if (error) {
        console.error('[PersonalPayment] 数据库插入错误:', error);
        throw error;
      }

      return {
        success: true,
        orderId,
        paymentCode,
        amount,
        qrCodeConfig: this.getQRCodeConfig(),
      };
    } catch (error) {
      console.error('[PersonalPayment] 创建订单失败:', error);
      throw error;
    }
  }

  /**
   * 生成支付识别码
   * 用于用户在支付时添加备注，方便匹配订单
   */
  generatePaymentCode(orderId) {
    // 取订单ID后6位 + 随机2位
    const suffix = orderId.slice(-6).toUpperCase();
    const random = Math.floor(Math.random() * 90 + 10);
    return `VIP${suffix}${random}`;
  }

  /**
   * 提交支付凭证
   */
  async submitPaymentProof(orderId, userId, proofData) {
    try {
      const { 
        transactionId, // 支付订单号/流水号
        screenshotUrl, // 支付截图URL
        payerName,     // 付款人姓名（可选）
        payerAccount,  // 付款账号（可选）
        notes          // 备注
      } = proofData;

      // 验证订单
      const { data: order, error: fetchError } = await supabaseServer
        .from('membership_orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !order) {
        throw new Error('订单不存在');
      }

      if (order.status !== 'pending') {
        throw new Error('订单状态不正确');
      }

      // 更新 metadata
      const updatedMetadata = {
        ...order.metadata,
        payment_proof: {
          transactionId,
          screenshotUrl,
          payerName,
          payerAccount,
          notes,
          submittedAt: new Date().toISOString(),
        },
        payer_info: {
          name: payerName,
          account: payerAccount,
        },
      };

      // 更新订单状态为待审核
      const { error: updateError } = await supabaseServer
        .from('membership_orders')
        .update({
          status: 'verifying', // 个人支付提交凭证后变为待审核状态
          metadata: updatedMetadata,
          paid_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // 发送通知给管理员
      await this.notifyAdmin(order, proofData);

      return {
        success: true,
        message: '支付凭证已提交，请等待审核',
      };
    } catch (error) {
      console.error('[PersonalPayment] 提交凭证失败:', error);
      throw error;
    }
  }

  /**
   * 管理员审核订单
   */
  async verifyOrder(orderId, adminId, verified, notes = '') {
    try {
      const { data: order, error: fetchError } = await supabaseServer
        .from('membership_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError || !order) {
        throw new Error('订单不存在');
      }

      // 更新 metadata
      const updatedMetadata = {
        ...order.metadata,
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        notes: notes || (verified ? '审核通过' : '审核未通过'),
      };

      if (verified) {
        // 审核通过
        const now = new Date();
        const expiresAt = new Date();
        
        // 计算过期时间
        switch (order.period) {
          case 'monthly':
            expiresAt.setMonth(expiresAt.getMonth() + 1);
            break;
          case 'quarterly':
            expiresAt.setMonth(expiresAt.getMonth() + 3);
            break;
          case 'yearly':
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            break;
          default:
            expiresAt.setMonth(expiresAt.getMonth() + 1);
        }

        // 更新订单状态
        const { error: updateError } = await supabaseServer
          .from('membership_orders')
          .update({
            status: 'completed',
            metadata: updatedMetadata,
            expires_at: expiresAt.toISOString(),
          })
          .eq('id', orderId);

        if (updateError) throw updateError;

        // 更新用户会员信息
        const { error: userUpdateError } = await supabaseServer
          .from('users')
          .update({
            membership_level: order.plan,
            membership_status: 'active',
            membership_start: now.toISOString(),
            membership_end: expiresAt.toISOString(),
          })
          .eq('id', order.user_id);

        if (userUpdateError) {
          console.error('[PersonalPayment] 更新用户会员信息失败:', userUpdateError);
        }

        // 发送通知给用户
        await this.notifyUser(order.user_id, 'payment_success', {
          orderId,
          plan: order.plan,
          expiresAt: expiresAt.toISOString(),
        });

        return {
          success: true,
          message: '审核通过，会员已开通',
        };
      } else {
        // 审核拒绝
        const { error: updateError } = await supabaseServer
          .from('membership_orders')
          .update({
            status: 'failed',
            metadata: updatedMetadata,
          })
          .eq('id', orderId);

        if (updateError) throw updateError;

        // 发送通知给用户
        await this.notifyUser(order.user_id, 'payment_failed', {
          orderId,
          reason: notes || '审核未通过',
        });

        return {
          success: true,
          message: '已拒绝该订单',
        };
      }
    } catch (error) {
      console.error('[PersonalPayment] 审核订单失败:', error);
      throw error;
    }
  }

  /**
   * 获取待审核订单列表
   */
  async getPendingOrders(page = 1, limit = 20) {
    try {
      const { data, error, count } = await supabaseServer
        .from('membership_orders')
        .select('*, users(email, nickname)', { count: 'exact' })
        .eq('status', 'completed')
        .is('expires_at', null) // 未设置过期时间的订单（即未审核的）
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      return {
        success: true,
        orders: data || [],
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error('[PersonalPayment] 获取待审核订单失败:', error);
      throw error;
    }
  }

  /**
   * 查询订单状态
   */
  async getOrderStatus(orderId, userId) {
    try {
      const { data: order, error } = await supabaseServer
        .from('membership_orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

      if (error || !order) {
        throw new Error('订单不存在');
      }

      const metadata = order.metadata || {};

      return {
        success: true,
        order: {
          id: order.id,
          status: order.status,
          amount: order.amount,
          plan: order.plan,
          paymentMethod: order.payment_method,
          paymentCode: metadata.payment_code,
          createdAt: order.created_at,
          paidAt: order.paid_at,
          verifiedAt: metadata.verified_at,
          expiresAt: order.expires_at,
          notes: metadata.notes,
        },
      };
    } catch (error) {
      console.error('[PersonalPayment] 查询订单状态失败:', error);
      throw error;
    }
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderId, userId) {
    try {
      const { data: order, error: fetchError } = await supabaseServer
        .from('membership_orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !order) {
        throw new Error('订单不存在');
      }

      if (order.status !== 'pending') {
        throw new Error('订单状态不允许取消');
      }

      const { error } = await supabaseServer
        .from('membership_orders')
        .update({
          status: 'cancelled',
          metadata: {
            ...order.metadata,
            notes: '用户取消',
          },
        })
        .eq('id', orderId);

      if (error) throw error;

      return { success: true, message: '订单已取消' };
    } catch (error) {
      console.error('[PersonalPayment] 取消订单失败:', error);
      throw error;
    }
  }

  /**
   * 通知管理员
   */
  async notifyAdmin(order, proofData) {
    try {
      console.log('[PersonalPayment] 新支付待审核:', {
        orderId: order.id,
        amount: order.amount,
        plan: order.plan,
        paymentMethod: order.payment_method,
        transactionId: proofData.transactionId,
      });
    } catch (error) {
      console.error('[PersonalPayment] 通知管理员失败:', error);
    }
  }

  /**
   * 通知用户
   */
  async notifyUser(userId, type, data) {
    try {
      console.log('[PersonalPayment] 通知用户:', { userId, type, data });
    } catch (error) {
      console.error('[PersonalPayment] 通知用户失败:', error);
    }
  }

  /**
   * 上传支付截图
   */
  async uploadScreenshot(file, orderId) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `payment-proofs/${orderId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabaseServer.storage
        .from('payments')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true,
        });

      if (error) throw error;

      // 获取公开URL
      const { data: { publicUrl } } = supabaseServer.storage
        .from('payments')
        .getPublicUrl(fileName);

      return {
        success: true,
        url: publicUrl,
        path: fileName,
      };
    } catch (error) {
      console.error('[PersonalPayment] 上传截图失败:', error);
      throw error;
    }
  }
}

export const personalQRCodePaymentService = new PersonalQRCodePaymentService();
export default personalQRCodePaymentService;
