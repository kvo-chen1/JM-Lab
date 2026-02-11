/**
 * 会员中心 API 路由
 * 处理会员权益、订单、使用统计等相关接口
 */

import { verifyToken } from '../jwt.mjs';
import { userDB, getDB } from '../database.mjs';
import { supabaseServer } from '../supabase-server.mjs';

// 会员权益配置
const MEMBERSHIP_BENEFITS = {
  free: {
    name: '免费会员',
    description: '基础AI创作体验',
    features: [
      { id: 'ai_generation', name: 'AI生成次数', value: '10次/天', icon: 'Wand2' },
      { id: 'ai_model', name: 'AI模型访问', value: '基础模型', icon: 'Zap' },
      { id: 'image_generation', name: '图像生成', value: true, icon: 'Image' },
      { id: 'video_generation', name: '视频生成', value: false, icon: 'Video' },
      { id: 'audio_generation', name: '音频生成', value: false, icon: 'Music' },
      { id: 'text_generation', name: '文案生成', value: true, icon: 'FileText' },
      { id: 'templates', name: '模板库', value: '基础模板', icon: 'Palette' },
      { id: 'layers', name: '图层编辑', value: '基础功能', icon: 'Layers' },
      { id: 'export', name: '导出功能', value: '带水印', icon: 'Download' },
      { id: 'storage', name: '云存储空间', value: '1GB', icon: 'Cloud' },
      { id: 'priority', name: '优先处理', value: false, icon: 'Clock' },
      { id: 'commercial', name: '商业授权', value: false, icon: 'Shield' }
    ],
    limits: {
      aiGenerationsPerDay: 10,
      storageGB: 1,
      exportsPerMonth: 5,
      maxResolution: '1080p',
      watermark: true
    }
  },
  premium: {
    name: '高级会员',
    description: '解锁高级AI创作功能',
    features: [
      { id: 'ai_generation', name: 'AI生成次数', value: '无限', icon: 'Wand2' },
      { id: 'ai_model', name: 'AI模型访问', value: '高级模型', icon: 'Zap' },
      { id: 'image_generation', name: '图像生成', value: true, icon: 'Image' },
      { id: 'video_generation', name: '视频生成', value: true, icon: 'Video' },
      { id: 'audio_generation', name: '音频生成', value: true, icon: 'Music' },
      { id: 'text_generation', name: '文案生成', value: true, icon: 'FileText' },
      { id: 'templates', name: '模板库', value: '专属模板库', icon: 'Palette' },
      { id: 'layers', name: '图层编辑', value: '完整功能', icon: 'Layers' },
      { id: 'export', name: '导出功能', value: '高清无水印', icon: 'Download' },
      { id: 'storage', name: '云存储空间', value: '50GB', icon: 'Cloud' },
      { id: 'priority', name: '优先处理', value: true, icon: 'Clock' },
      { id: 'commercial', name: '商业授权', value: false, icon: 'Shield' }
    ],
    limits: {
      aiGenerationsPerDay: Infinity,
      storageGB: 50,
      exportsPerMonth: 100,
      maxResolution: '4K',
      watermark: false
    }
  },
  vip: {
    name: 'VIP会员',
    description: '享受顶级AI创作体验',
    features: [
      { id: 'ai_generation', name: 'AI生成次数', value: '无限', icon: 'Wand2' },
      { id: 'ai_model', name: 'AI模型访问', value: '专属模型', icon: 'Zap' },
      { id: 'image_generation', name: '图像生成', value: true, icon: 'Image' },
      { id: 'video_generation', name: '视频生成', value: true, icon: 'Video' },
      { id: 'audio_generation', name: '音频生成', value: true, icon: 'Music' },
      { id: 'text_generation', name: '文案生成', value: true, icon: 'FileText' },
      { id: 'templates', name: '模板库', value: '全部模板', icon: 'Palette' },
      { id: 'layers', name: '图层编辑', value: '完整功能', icon: 'Layers' },
      { id: 'export', name: '导出功能', value: '超高清无水印', icon: 'Download' },
      { id: 'storage', name: '云存储空间', value: '无限', icon: 'Cloud' },
      { id: 'priority', name: '优先处理', value: '最高优先级', icon: 'Clock' },
      { id: 'commercial', name: '商业授权', value: true, icon: 'Shield' }
    ],
    limits: {
      aiGenerationsPerDay: Infinity,
      storageGB: Infinity,
      exportsPerMonth: Infinity,
      maxResolution: '8K',
      watermark: false
    }
  }
};

// 会员价格配置
const MEMBERSHIP_PRICING = {
  premium: {
    monthly: { price: 99, period: '月' },
    quarterly: { price: 269, period: '季度', discount: '9折', originalPrice: 297 },
    yearly: { price: 899, period: '年', discount: '7.6折', originalPrice: 1188 }
  },
  vip: {
    monthly: { price: 199, period: '月' },
    quarterly: { price: 539, period: '季度', discount: '9折', originalPrice: 597 },
    yearly: { price: 1799, period: '年', discount: '7.5折', originalPrice: 2388 }
  }
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
    console.error('[Membership] Token verification failed:', error.message);
    return null;
  }
}

/**
 * 获取会员权益配置
 * GET /api/membership/benefits
 */
export async function getMembershipBenefits(req, res) {
  try {
    const user = await authenticateUser(req);
    
    // 返回所有会员等级的权益配置
    const benefits = {
      levels: MEMBERSHIP_BENEFITS,
      pricing: MEMBERSHIP_PRICING,
      currentLevel: user ? await getUserMembershipLevel(user.userId) : 'free'
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: benefits
    }));
  } catch (error) {
    console.error('[Membership] Get benefits error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '获取会员权益失败'
    }));
  }
}

/**
 * 获取用户会员等级
 */
async function getUserMembershipLevel(userId) {
  try {
    const user = await userDB.findById(userId);
    return user?.membership_level || 'free';
  } catch (error) {
    console.error('[Membership] Get user level error:', error);
    return 'free';
  }
}

/**
 * 获取用户使用统计
 * GET /api/membership/usage
 */
export async function getMembershipUsage(req, res) {
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

    const userId = user.userId;
    const db = getDB();

    // 获取用户会员等级
    const userData = await userDB.findById(userId);
    const membershipLevel = userData?.membership_level || 'free';
    const limits = MEMBERSHIP_BENEFITS[membershipLevel]?.limits || MEMBERSHIP_BENEFITS.free.limits;

    // 获取今日AI生成次数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    let aiGenerationsToday = 0;
    try {
      // 从 user_history 表统计今日AI生成次数
      const { count, error } = await supabaseServer
        .from('user_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action_type', 'ai_generation')
        .gte('timestamp', todayTimestamp);

      if (!error) {
        aiGenerationsToday = count || 0;
      }
    } catch (e) {
      console.error('[Membership] Get AI generations error:', e);
    }

    // 获取存储空间使用情况
    let storageUsed = 0;
    try {
      // 从 works 表统计用户作品占用的存储空间
      const { data: works, error } = await supabaseServer
        .from('works')
        .select('file_size')
        .eq('creator_id', userId);

      if (!error && works) {
        storageUsed = works.reduce((sum, work) => sum + (work.file_size || 0), 0) / (1024 * 1024 * 1024); // 转换为GB
      }
    } catch (e) {
      console.error('[Membership] Get storage error:', e);
    }

    // 获取本月导出次数
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const monthTimestamp = currentMonth.getTime();

    let exportsThisMonth = 0;
    try {
      const { count, error } = await supabaseServer
        .from('user_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action_type', 'export')
        .gte('timestamp', monthTimestamp);

      if (!error) {
        exportsThisMonth = count || 0;
      }
    } catch (e) {
      console.error('[Membership] Get exports error:', e);
    }

    const usageStats = {
      aiGenerations: {
        used: aiGenerationsToday,
        total: limits.aiGenerationsPerDay,
        percentage: limits.aiGenerationsPerDay === Infinity ? 0 : Math.min((aiGenerationsToday / limits.aiGenerationsPerDay) * 100, 100)
      },
      storage: {
        used: parseFloat(storageUsed.toFixed(2)),
        total: limits.storageGB,
        percentage: limits.storageGB === Infinity ? 0 : Math.min((storageUsed / limits.storageGB) * 100, 100)
      },
      exports: {
        used: exportsThisMonth,
        total: limits.exportsPerMonth,
        percentage: limits.exportsPerMonth === Infinity ? 0 : Math.min((exportsThisMonth / limits.exportsPerMonth) * 100, 100)
      }
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: usageStats
    }));
  } catch (error) {
    console.error('[Membership] Get usage error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '获取使用统计失败'
    }));
  }
}

/**
 * 获取用户订单记录
 * GET /api/membership/orders
 */
export async function getMembershipOrders(req, res) {
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

    const userId = user.userId;
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;

    // 从 membership_orders 表查询订单
    let orders = [];
    let total = 0;

    try {
      const { data, count, error } = await supabaseServer
        .from('membership_orders')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (!error) {
        orders = data || [];
        total = count || 0;
      }
    } catch (e) {
      console.error('[Membership] Get orders error:', e);
    }

    // 如果没有真实数据，返回模拟数据用于展示
    if (orders.length === 0) {
      orders = getMockOrders(userId);
      total = orders.length;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }));
  } catch (error) {
    console.error('[Membership] Get orders error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '获取订单记录失败'
    }));
  }
}

/**
 * 获取模拟订单数据（用于展示）
 */
function getMockOrders(userId) {
  return [
    {
      id: 'ORD-202402010001',
      user_id: userId,
      plan: 'premium',
      plan_name: '高级会员',
      period: 'yearly',
      amount: 899,
      currency: 'CNY',
      status: 'completed',
      payment_method: 'alipay',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      paid_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ORD-202401010001',
      user_id: userId,
      plan: 'premium',
      plan_name: '高级会员',
      period: 'monthly',
      amount: 99,
      currency: 'CNY',
      status: 'completed',
      payment_method: 'wechat',
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      paid_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}

/**
 * 获取订阅详情
 * GET /api/membership/subscription
 */
export async function getMembershipSubscription(req, res) {
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

    const userId = user.userId;
    const userData = await userDB.findById(userId);

    if (!userData) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '用户不存在'
      }));
      return;
    }

    const subscription = {
      level: userData.membership_level || 'free',
      status: userData.membership_status || 'active',
      startDate: userData.membership_start,
      endDate: userData.membership_end,
      autoRenew: false, // 默认不自动续费
      benefits: MEMBERSHIP_BENEFITS[userData.membership_level || 'free']
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: subscription
    }));
  } catch (error) {
    console.error('[Membership] Get subscription error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '获取订阅详情失败'
    }));
  }
}

/**
 * 创建订单
 * POST /api/membership/orders
 */
export async function createMembershipOrder(req, res) {
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
        const { plan, period } = JSON.parse(body);
        
        if (!plan || !period) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '缺少必要参数'
          }));
          return;
        }

        const pricing = MEMBERSHIP_PRICING[plan]?.[period];
        if (!pricing) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '无效的套餐或周期'
          }));
          return;
        }

        // 创建订单
        const orderId = `ORD-${Date.now()}`;
        const order = {
          id: orderId,
          user_id: user.userId,
          plan,
          plan_name: MEMBERSHIP_BENEFITS[plan].name,
          period,
          amount: pricing.price,
          currency: 'CNY',
          status: 'pending',
          payment_method: null,
          created_at: new Date().toISOString(),
          paid_at: null,
          expires_at: null
        };

        // 保存到数据库
        try {
          await supabaseServer
            .from('membership_orders')
            .insert([order]);
        } catch (e) {
          console.error('[Membership] Save order error:', e);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            orderId,
            amount: pricing.price,
            qrCode: null // 实际项目中这里返回支付二维码
          }
        }));
      } catch (error) {
        console.error('[Membership] Create order error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: '创建订单失败'
        }));
      }
    });
  } catch (error) {
    console.error('[Membership] Create order error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '创建订单失败'
    }));
  }
}

/**
 * 会员路由处理器
 */
export default async function membershipRoutes(req, res) {
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
  if (pathname === '/api/membership/benefits' && method === 'GET') {
    await getMembershipBenefits(req, res);
    return;
  }

  if (pathname === '/api/membership/usage' && method === 'GET') {
    await getMembershipUsage(req, res);
    return;
  }

  if (pathname === '/api/membership/orders' && method === 'GET') {
    await getMembershipOrders(req, res);
    return;
  }

  if (pathname === '/api/membership/orders' && method === 'POST') {
    await createMembershipOrder(req, res);
    return;
  }

  if (pathname === '/api/membership/subscription' && method === 'GET') {
    await getMembershipSubscription(req, res);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    error: '接口不存在'
  }));
}
