/**
 * 支付 API 路由
 * 处理支付创建、查询、回调等接口
 */

import { verifyToken } from '../jwt.mjs';
import { userDB, getDB } from '../database.mjs';
import { supabaseServer } from '../supabase-server.mjs';
import { realPaymentService } from '../services/realPaymentService.mjs';
import { personalQRCodePaymentService } from '../services/personalQRCodePayment.mjs';

// 会员价格配置（五级会员体系）
const MEMBERSHIP_PRICING = {
  base: {
    monthly: { price: 29, period: '月', duration: 30 * 24 * 60 * 60 * 1000 },
    quarterly: { price: 79, period: '季度', discount: '9折', originalPrice: 87, duration: 90 * 24 * 60 * 60 * 1000 },
    yearly: { price: 279, period: '年', discount: '8折', originalPrice: 348, duration: 365 * 24 * 60 * 60 * 1000 }
  },
  pro: {
    monthly: { price: 99, period: '月', duration: 30 * 24 * 60 * 60 * 1000 },
    quarterly: { price: 269, period: '季度', discount: '9折', originalPrice: 297, duration: 90 * 24 * 60 * 60 * 1000 },
    yearly: { price: 899, period: '年', discount: '7.6折', originalPrice: 1188, duration: 365 * 24 * 60 * 60 * 1000 }
  },
  star: {
    monthly: { price: 199, period: '月', duration: 30 * 24 * 60 * 60 * 1000 },
    quarterly: { price: 539, period: '季度', discount: '9折', originalPrice: 597, duration: 90 * 24 * 60 * 60 * 1000 },
    yearly: { price: 1799, period: '年', discount: '7.5折', originalPrice: 2388, duration: 365 * 24 * 60 * 60 * 1000 }
  },
  vip: {
    monthly: { price: 399, period: '月', duration: 30 * 24 * 60 * 60 * 1000 },
    quarterly: { price: 1079, period: '季度', discount: '9折', originalPrice: 1197, duration: 90 * 24 * 60 * 60 * 1000 },
    yearly: { price: 3599, period: '年', discount: '7.5折', originalPrice: 4788, duration: 365 * 24 * 60 * 60 * 1000 }
  }
};

// 会员权益配置
const MEMBERSHIP_BENEFITS = {
  base: { name: '基础会员' },
  pro: { name: '专业会员' },
  star: { name: '星耀会员' },
  vip: { name: '至尊会员' }
};

/**
 * 验证用户身份
 */
async function authenticateUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    console.error('[Payment] Token verification failed:', error.message);
    return null;
  }
}

/**
 * 获取请求体
 */
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

/**
 * 发送JSON响应
 */
function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * 创建支付订单
 * POST /api/payment/create
 */
export async function createPayment(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      return sendJSON(res, 401, { success: false, error: '未登录' });
    }

    const body = await getRequestBody(req);
    const { plan, amount, paymentMethod, period = 'monthly' } = body;

    if (!plan || !amount || !paymentMethod) {
      return sendJSON(res, 400, { success: false, error: '缺少必要参数' });
    }

    // 验证套餐和价格
    const pricing = MEMBERSHIP_PRICING[plan]?.[period];
    if (!pricing) {
      return sendJSON(res, 400, { success: false, error: '无效的套餐类型' });
    }

    // 验证金额是否匹配
    if (pricing.price !== amount) {
      return sendJSON(res, 400, { success: false, error: '金额不匹配' });
    }

    // 检查支付方式是否可用
    if (paymentMethod === 'wechat' && !realPaymentService.isWechatAvailable()) {
      return sendJSON(res, 400, { success: false, error: '微信支付暂不可用，请选择其他支付方式' });
    }
    if (paymentMethod === 'alipay' && !realPaymentService.isAlipayAvailable()) {
      return sendJSON(res, 400, { success: false, error: '支付宝暂不可用，请选择其他支付方式' });
    }

    // 创建订单
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const order = {
      id: orderId,
      user_id: user.userId,
      plan,
      plan_name: MEMBERSHIP_BENEFITS[plan]?.name || plan,
      period,
      amount: pricing.price,
      currency: 'CNY',
      status: 'pending',
      payment_method: paymentMethod,
      payment_data: null,
      created_at: new Date().toISOString(),
      paid_at: null,
      expires_at: null,
      refunded_at: null,
      refund_amount: null
    };

    // 保存到数据库
    const { error: insertError } = await supabaseServer
      .from('membership_orders')
      .insert([order]);

    if (insertError) {
      console.error('[Payment] Save order error:', insertError);
      return sendJSON(res, 500, { success: false, error: '创建订单失败' });
    }

    // 调用真实支付接口生成二维码
    let paymentResult;
    try {
      if (paymentMethod === 'wechat') {
        paymentResult = await realPaymentService.createWechatOrder(
          orderId,
          amount,
          `${MEMBERSHIP_BENEFITS[plan]?.name || plan} - ${period}`,
          JSON.stringify({ userId: user.userId, plan, period })
        );
      } else if (paymentMethod === 'alipay') {
        paymentResult = await realPaymentService.createAlipayOrder(
          orderId,
          amount,
          `${MEMBERSHIP_BENEFITS[plan]?.name || plan} - ${period}`,
          `用户ID: ${user.userId}`
        );
      } else {
        // 其他支付方式使用模拟二维码
        paymentResult = {
          success: true,
          qrCode: await generateMockQRCode(orderId, amount, paymentMethod),
        };
      }
    } catch (paymentError) {
      console.error('[Payment] 创建支付订单失败:', paymentError);
      // 更新订单状态为失败
      await supabaseServer
        .from('membership_orders')
        .update({ status: 'failed', payment_data: { error: paymentError.message } })
        .eq('id', orderId);
      return sendJSON(res, 500, { success: false, error: '创建支付订单失败: ' + paymentError.message });
    }

    return sendJSON(res, 200, {
      success: true,
      data: {
        orderId,
        amount: pricing.price,
        qrCode: paymentResult.qrCode,
        expireTime: Date.now() + 30 * 60 * 1000 // 30分钟过期
      }
    });
  } catch (error) {
    console.error('[Payment] Create payment error:', error);
    return sendJSON(res, 500, { success: false, error: '创建支付订单失败' });
  }
}

/**
 * 生成模拟二维码
 */
async function generateMockQRCode(orderId, amount, paymentMethod) {
  const QRCode = await import('qrcode');
  const qrData = `mock://payment/${orderId}?amount=${amount}`;
  return await QRCode.default.toDataURL(qrData, {
    width: 200,
    margin: 2,
    color: {
      dark: paymentMethod === 'wechat' ? '#07C160' : paymentMethod === 'alipay' ? '#1677FF' : '#000000',
      light: '#ffffff',
    },
  });
}

/**
 * 查询支付状态
 * GET /api/payment/status/:orderId
 */
export async function getPaymentStatus(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      return sendJSON(res, 401, { success: false, error: '未登录' });
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const orderId = pathname.split('/').pop();

    if (!orderId) {
      return sendJSON(res, 400, { success: false, error: '缺少订单ID' });
    }

    // 查询订单状态
    const { data: order, error } = await supabaseServer
      .from('membership_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.userId)
      .single();

    if (error || !order) {
      return sendJSON(res, 404, { success: false, error: '订单不存在' });
    }

    // 如果订单是待支付状态，查询支付渠道状态
    if (order.status === 'pending') {
      try {
        let paymentStatus;
        if (order.payment_method === 'wechat' && realPaymentService.isWechatAvailable()) {
          paymentStatus = await realPaymentService.queryWechatOrder(orderId);
        } else if (order.payment_method === 'alipay' && realPaymentService.isAlipayAvailable()) {
          paymentStatus = await realPaymentService.queryAlipayOrder(orderId);
        }

        // 如果支付渠道显示已支付，更新订单状态
        if (paymentStatus && paymentStatus.status === 'paid') {
          await completeOrder(orderId, {
            method: order.payment_method,
            transactionId: paymentStatus.transactionId || paymentStatus.tradeNo,
            paidAt: paymentStatus.paidAt,
          });
          order.status = 'completed';
          order.paid_at = paymentStatus.paidAt;
        }
      } catch (queryError) {
        console.error('[Payment] 查询支付渠道状态失败:', queryError);
      }
    }

    return sendJSON(res, 200, {
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        amount: order.amount,
        paidAt: order.paid_at,
        expiresAt: order.expires_at
      }
    });
  } catch (error) {
    console.error('[Payment] Get status error:', error);
    return sendJSON(res, 500, { success: false, error: '查询支付状态失败' });
  }
}

/**
 * 完成订单支付
 */
async function completeOrder(orderId, paymentData) {
  try {
    const { data: order, error: fetchError } = await supabaseServer
      .from('membership_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      throw new Error('订单不存在');
    }

    // 计算过期时间
    const now = new Date();
    const expiresAt = new Date();
    const pricing = MEMBERSHIP_PRICING[order.plan]?.[order.period];
    if (pricing) {
      expiresAt.setTime(now.getTime() + pricing.duration);
    }

    // 更新订单状态
    const { error: updateError } = await supabaseServer
      .from('membership_orders')
      .update({
        status: 'completed',
        payment_method: paymentData.method,
        payment_data: paymentData,
        paid_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
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
        membership_end: expiresAt.toISOString()
      })
      .eq('id', order.user_id);

    if (userUpdateError) {
      console.error('[Payment] Update user error:', userUpdateError);
    }

    return { success: true };
  } catch (error) {
    console.error('[Payment] Complete order error:', error);
    throw error;
  }
}

/**
 * 微信支付回调
 * POST /api/payment/webhook/wechat
 */
export async function wechatWebhook(req, res) {
  try {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const result = await realPaymentService.handleWechatWebhook(req.headers, body);

        if (result.success && result.status === 'paid') {
          await completeOrder(result.orderId, {
            method: 'wechat',
            transactionId: result.transactionId,
            paidAt: result.paidAt,
          });
        }

        // 返回成功响应给微信
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ code: 'SUCCESS', message: '成功' }));
      } catch (error) {
        console.error('[Payment] Wechat webhook error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ code: 'FAIL', message: error.message }));
      }
    });
  } catch (error) {
    console.error('[Payment] Wechat webhook error:', error);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 'FAIL', message: error.message }));
  }
}

/**
 * 支付宝回调
 * POST /api/payment/webhook/alipay
 */
export async function alipayWebhook(req, res) {
  try {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        // 解析表单数据
        const params = new URLSearchParams(body);
        const data = Object.fromEntries(params);

        const result = await realPaymentService.handleAlipayWebhook(data);

        if (result.success && result.status === 'paid') {
          await completeOrder(result.orderId, {
            method: 'alipay',
            transactionId: result.tradeNo,
            paidAt: result.paidAt,
          });
        }

        // 返回成功响应给支付宝
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('success');
      } catch (error) {
        console.error('[Payment] Alipay webhook error:', error);
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('fail');
      }
    });
  } catch (error) {
    console.error('[Payment] Alipay webhook error:', error);
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('fail');
  }
}

/**
 * 模拟支付成功（用于测试）
 * POST /api/payment/simulate
 */
export async function simulatePayment(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      return sendJSON(res, 401, { success: false, error: '未登录' });
    }

    const body = await getRequestBody(req);
    const { orderId } = body;

    if (!orderId) {
      return sendJSON(res, 400, { success: false, error: '缺少订单ID' });
    }

    // 查询订单
    const { data: order, error: fetchError } = await supabaseServer
      .from('membership_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.userId)
      .single();

    if (fetchError || !order) {
      return sendJSON(res, 404, { success: false, error: '订单不存在' });
    }

    // 模拟支付成功
    await completeOrder(orderId, {
      method: order.payment_method || 'simulate',
      transactionId: `SIM-${Date.now()}`,
      paidAt: new Date().toISOString(),
    });

    return sendJSON(res, 200, {
      success: true,
      data: {
        orderId,
        status: 'completed',
        paidAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('[Payment] Simulate payment error:', error);
    return sendJSON(res, 500, { success: false, error: '模拟支付失败' });
  }
}

/**
 * 获取支付配置状态
 * GET /api/payment/config
 */
export async function getPaymentConfig(req, res) {
  try {
    const config = {
      // 企业支付配置
      enterprise: realPaymentService.getConfigStatus(),
      // 个人收款码配置
      personal: personalQRCodePaymentService.getQRCodeConfig(),
    };
    return sendJSON(res, 200, {
      success: true,
      data: config
    });
  } catch (error) {
    console.error('[Payment] Get config error:', error);
    return sendJSON(res, 500, { success: false, error: '获取支付配置失败' });
  }
}

/**
 * 创建个人收款码支付订单
 * POST /api/payment/personal/create
 */
export async function createPersonalPayment(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      return sendJSON(res, 401, { success: false, error: '未登录' });
    }

    const body = await getRequestBody(req);
    const { plan, amount, paymentMethod, period = 'monthly' } = body;

    if (!plan || !amount || !paymentMethod) {
      return sendJSON(res, 400, { success: false, error: '缺少必要参数' });
    }

    // 验证套餐和价格
    const pricing = MEMBERSHIP_PRICING[plan]?.[period];
    if (!pricing) {
      return sendJSON(res, 400, { success: false, error: '无效的套餐类型' });
    }

    if (pricing.price !== amount) {
      return sendJSON(res, 400, { success: false, error: '金额不匹配' });
    }

    // 创建个人收款码订单
    const result = await personalQRCodePaymentService.createOrder(
      user.userId,
      plan,
      amount,
      period,
      paymentMethod
    );

    return sendJSON(res, 200, {
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Payment] Create personal payment error:', error);
    return sendJSON(res, 500, { success: false, error: '创建订单失败' });
  }
}

/**
 * 提交支付凭证
 * POST /api/payment/personal/submit-proof
 */
export async function submitPaymentProof(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      return sendJSON(res, 401, { success: false, error: '未登录' });
    }

    const body = await getRequestBody(req);
    const { orderId, transactionId, screenshotUrl, payerName, payerAccount, notes } = body;

    if (!orderId) {
      return sendJSON(res, 400, { success: false, error: '缺少订单ID' });
    }

    const result = await personalQRCodePaymentService.submitPaymentProof(
      orderId,
      user.userId,
      {
        transactionId,
        screenshotUrl,
        payerName,
        payerAccount,
        notes
      }
    );

    return sendJSON(res, 200, result);
  } catch (error) {
    console.error('[Payment] Submit proof error:', error);
    return sendJSON(res, 500, { success: false, error: error.message || '提交凭证失败' });
  }
}

/**
 * 上传支付截图
 * POST /api/payment/personal/upload
 */
export async function uploadPaymentScreenshot(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      return sendJSON(res, 401, { success: false, error: '未登录' });
    }

    // 解析multipart/form-data
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    // 简单的multipart解析（生产环境建议使用multer等库）
    const contentType = req.headers['content-type'];
    const boundary = contentType.split('boundary=')[1];
    
    if (!boundary) {
      return sendJSON(res, 400, { success: false, error: '无效的请求格式' });
    }

    // 提取文件数据（简化版）
    const parts = buffer.toString().split(`--${boundary}`);
    let fileData = null;
    let orderId = null;
    
    for (const part of parts) {
      if (part.includes('filename=')) {
        const match = part.match(/filename="(.+)"/);
        if (match) {
          const filename = match[1];
          const contentStart = part.indexOf('\r\n\r\n') + 4;
          const contentEnd = part.lastIndexOf('\r\n');
          fileData = {
            name: filename,
            data: buffer.slice(
              buffer.indexOf(Buffer.from(part.slice(0, contentStart))) + contentStart,
              buffer.indexOf(Buffer.from(part.slice(0, contentEnd))) + contentEnd
            ),
            type: part.match(/Content-Type:\s*(.+)/)?.[1] || 'image/jpeg'
          };
        }
      }
      if (part.includes('name="orderId"')) {
        orderId = part.match(/\r\n\r\n(.+)\r\n/)?.[1];
      }
    }

    if (!fileData || !orderId) {
      return sendJSON(res, 400, { success: false, error: '缺少文件或订单ID' });
    }

    // 创建文件对象
    const file = {
      name: fileData.name,
      type: fileData.type,
      arrayBuffer: () => Promise.resolve(fileData.data)
    };

    const result = await personalQRCodePaymentService.uploadScreenshot(file, orderId);
    return sendJSON(res, 200, result);
  } catch (error) {
    console.error('[Payment] Upload screenshot error:', error);
    return sendJSON(res, 500, { success: false, error: '上传截图失败' });
  }
}

/**
 * 管理员获取待审核订单
 * GET /api/payment/admin/pending
 */
export async function getPendingOrders(req, res) {
  try {
    // TODO: 验证管理员权限
    const user = await authenticateUser(req);
    if (!user) {
      return sendJSON(res, 401, { success: false, error: '未登录' });
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const result = await personalQRCodePaymentService.getPendingOrders(page, limit);
    return sendJSON(res, 200, result);
  } catch (error) {
    console.error('[Payment] Get pending orders error:', error);
    return sendJSON(res, 500, { success: false, error: '获取待审核订单失败' });
  }
}

/**
 * 管理员审核订单
 * POST /api/payment/admin/verify
 */
export async function verifyOrder(req, res) {
  try {
    // TODO: 验证管理员权限
    const user = await authenticateUser(req);
    if (!user) {
      return sendJSON(res, 401, { success: false, error: '未登录' });
    }

    const body = await getRequestBody(req);
    const { orderId, verified, notes } = body;

    if (!orderId || verified === undefined) {
      return sendJSON(res, 400, { success: false, error: '缺少必要参数' });
    }

    const result = await personalQRCodePaymentService.verifyOrder(
      orderId,
      user.userId,
      verified,
      notes
    );

    return sendJSON(res, 200, result);
  } catch (error) {
    console.error('[Payment] Verify order error:', error);
    return sendJSON(res, 500, { success: false, error: error.message || '审核订单失败' });
  }
}

/**
 * 管理员退款订单
 * POST /api/payment/admin/refund
 */
export async function refundOrder(req, res) {
  try {
    // TODO: 验证管理员权限
    const user = await authenticateUser(req);
    if (!user) {
      return sendJSON(res, 401, { success: false, error: '未登录' });
    }

    const body = await getRequestBody(req);
    const { orderId, refundAmount, notes } = body;

    if (!orderId || refundAmount === undefined) {
      return sendJSON(res, 400, { success: false, error: '缺少必要参数' });
    }

    const result = await personalQRCodePaymentService.refundOrder(
      orderId,
      user.userId,
      refundAmount,
      notes
    );

    return sendJSON(res, 200, result);
  } catch (error) {
    console.error('[Payment] Refund order error:', error);
    return sendJSON(res, 500, { success: false, error: error.message || '退款失败' });
  }
}

/**
 * 支付路由处理器
 */
export default async function paymentRoutes(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 路由匹配
  if (pathname === '/api/payment/create' && method === 'POST') {
    await createPayment(req, res);
    return;
  }

  if (pathname.startsWith('/api/payment/status/') && method === 'GET') {
    await getPaymentStatus(req, res);
    return;
  }

  if (pathname === '/api/payment/simulate' && method === 'POST') {
    await simulatePayment(req, res);
    return;
  }

  if (pathname === '/api/payment/config' && method === 'GET') {
    await getPaymentConfig(req, res);
    return;
  }

  if (pathname === '/api/payment/webhook/wechat' && method === 'POST') {
    await wechatWebhook(req, res);
    return;
  }

  if (pathname === '/api/payment/webhook/alipay' && method === 'POST') {
    await alipayWebhook(req, res);
    return;
  }

  // 个人收款码支付路由
  if (pathname === '/api/payment/personal/create' && method === 'POST') {
    await createPersonalPayment(req, res);
    return;
  }

  if (pathname === '/api/payment/personal/submit-proof' && method === 'POST') {
    await submitPaymentProof(req, res);
    return;
  }

  if (pathname === '/api/payment/personal/upload' && method === 'POST') {
    await uploadPaymentScreenshot(req, res);
    return;
  }

  // 管理员路由
  if (pathname === '/api/payment/admin/pending' && method === 'GET') {
    await getPendingOrders(req, res);
    return;
  }

  if (pathname === '/api/payment/admin/verify' && method === 'POST') {
    await verifyOrder(req, res);
    return;
  }

  if (pathname === '/api/payment/admin/refund' && method === 'POST') {
    await refundOrder(req, res);
    return;
  }

  // 404
  sendJSON(res, 404, { success: false, error: '接口不存在' });
}
