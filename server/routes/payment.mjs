/**
 * 支付 API 路由
 * 处理支付创建、查询、回调等接口
 */

import { verifyToken } from '../jwt.mjs';
import { userDB, getDB } from '../database.mjs';
import { supabaseServer } from '../supabase-server.mjs';

// 会员价格配置
const MEMBERSHIP_PRICING = {
  premium: {
    monthly: { price: 99, period: '月', duration: 30 * 24 * 60 * 60 * 1000 },
    quarterly: { price: 269, period: '季度', discount: '9折', originalPrice: 297, duration: 90 * 24 * 60 * 60 * 1000 },
    yearly: { price: 899, period: '年', discount: '7.6折', originalPrice: 1188, duration: 365 * 24 * 60 * 60 * 1000 }
  },
  vip: {
    monthly: { price: 199, period: '月', duration: 30 * 24 * 60 * 60 * 1000 },
    quarterly: { price: 539, period: '季度', discount: '9折', originalPrice: 597, duration: 90 * 24 * 60 * 60 * 1000 },
    yearly: { price: 1799, period: '年', discount: '7.5折', originalPrice: 2388, duration: 365 * 24 * 60 * 60 * 1000 }
  }
};

// 会员权益配置
const MEMBERSHIP_BENEFITS = {
  premium: { name: '高级会员' },
  vip: { name: 'VIP会员' }
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
 * 创建支付订单
 * POST /api/payment/create
 */
export async function createPayment(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '未登录'
      }));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { plan, amount, paymentMethod, period = 'monthly' } = JSON.parse(body);
        
        if (!plan || !amount || !paymentMethod) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '缺少必要参数'
          }));
          return;
        }

        // 验证套餐和价格
        const pricing = MEMBERSHIP_PRICING[plan]?.[period];
        if (!pricing) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '无效的套餐类型'
          }));
          return;
        }

        // 验证金额是否匹配
        if (pricing.price !== amount) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '金额不匹配'
          }));
          return;
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
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '创建订单失败'
          }));
          return;
        }

        // 模拟生成支付二维码（实际项目中调用微信支付/支付宝等接口）
        const qrCode = await generatePaymentQRCode(orderId, amount, paymentMethod);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            orderId,
            amount: pricing.price,
            qrCode,
            expireTime: Date.now() + 30 * 60 * 1000 // 30分钟过期
          }
        }));
      } catch (error) {
        console.error('[Payment] Create payment error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: '创建支付订单失败'
        }));
      }
    });
  } catch (error) {
    console.error('[Payment] Create payment error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '创建支付订单失败'
    }));
  }
}

/**
 * 生成支付二维码
 * 实际项目中应该调用微信支付/支付宝等接口
 */
async function generatePaymentQRCode(orderId, amount, paymentMethod) {
  // 模拟生成一个二维码数据（实际项目中这里调用第三方支付接口）
  // 返回一个模拟的二维码图片URL
  const qrData = `weixin://wxpay/bizpayurl?pr=${orderId}`;
  
  // 这里应该调用微信支付或支付宝的统一下单接口
  // 为了演示，返回一个模拟的二维码
  return `data:image/svg+xml;base64,${Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="white"/>
      <rect x="10" y="10" width="60" height="60" fill="black"/>
      <rect x="130" y="10" width="60" height="60" fill="black"/>
      <rect x="10" y="130" width="60" height="60" fill="black"/>
      <text x="100" y="105" text-anchor="middle" font-size="14" fill="black">模拟二维码</text>
      <text x="100" y="125" text-anchor="middle" font-size="12" fill="gray">${paymentMethod}</text>
    </svg>
  `).toString('base64')}`;
}

/**
 * 查询支付状态
 * GET /api/payment/status/:orderId
 */
export async function getPaymentStatus(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '未登录'
      }));
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const orderId = pathname.split('/').pop();

    if (!orderId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '缺少订单ID'
      }));
      return;
    }

    // 查询订单状态
    const { data: order, error } = await supabaseServer
      .from('membership_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.userId)
      .single();

    if (error || !order) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '订单不存在'
      }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        amount: order.amount,
        paidAt: order.paid_at,
        expiresAt: order.expires_at
      }
    }));
  } catch (error) {
    console.error('[Payment] Get status error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '查询支付状态失败'
    }));
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
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '未登录'
      }));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { orderId } = JSON.parse(body);

        if (!orderId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '缺少订单ID'
          }));
          return;
        }

        // 查询订单
        const { data: order, error: fetchError } = await supabaseServer
          .from('membership_orders')
          .select('*')
          .eq('id', orderId)
          .eq('user_id', user.userId)
          .single();

        if (fetchError || !order) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '订单不存在'
          }));
          return;
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
            paid_at: now.toISOString(),
            expires_at: expiresAt.toISOString()
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('[Payment] Update order error:', updateError);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '更新订单失败'
          }));
          return;
        }

        // 更新用户会员信息
        const { error: userUpdateError } = await supabaseServer
          .from('users')
          .update({
            membership_level: order.plan,
            membership_status: 'active',
            membership_start: now.toISOString(),
            membership_end: expiresAt.toISOString()
          })
          .eq('id', user.userId);

        if (userUpdateError) {
          console.error('[Payment] Update user error:', userUpdateError);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            orderId,
            status: 'completed',
            paidAt: now.toISOString(),
            expiresAt: expiresAt.toISOString()
          }
        }));
      } catch (error) {
        console.error('[Payment] Simulate payment error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: '模拟支付失败'
        }));
      }
    });
  } catch (error) {
    console.error('[Payment] Simulate payment error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '模拟支付失败'
    }));
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

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    error: '接口不存在'
  }));
}
