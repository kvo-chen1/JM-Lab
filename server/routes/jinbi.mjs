/**
 * 津币系统 API 路由
 * 处理津币余额、消费、记录、套餐等相关接口
 */

import { verifyToken } from '../jwt.mjs';
import { supabaseServer } from '../supabase-server.mjs';

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
    console.error('[Jinbi] Token verification failed:', error.message);
    return null;
  }
}

/**
 * 获取津币余额
 * GET /api/jinbi/balance
 */
export async function getJinbiBalance(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '未登录' }));
      return;
    }

    const { data, error } = await supabaseServer
      .from('user_jinbi_balance')
      .select('*')
      .eq('user_id', user.userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // 如果没有记录，返回默认值
    const balance = data || {
      user_id: user.userId,
      total_balance: 0,
      available_balance: 0,
      frozen_balance: 0,
      total_earned: 0,
      total_spent: 0,
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        userId: balance.user_id,
        totalBalance: balance.total_balance,
        availableBalance: balance.available_balance,
        frozenBalance: balance.frozen_balance,
        totalEarned: balance.total_earned,
        totalSpent: balance.total_spent,
        lastUpdated: balance.last_updated,
      }
    }));
  } catch (error) {
    console.error('[Jinbi] Get balance error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: '获取余额失败' }));
  }
}

/**
 * 获取津币记录
 * GET /api/jinbi/records
 */
export async function getJinbiRecords(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '未登录' }));
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const type = url.searchParams.get('type');

    let query = supabaseServer
      .from('jinbi_records')
      .select('*', { count: 'exact' })
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    const records = (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      amount: item.amount,
      type: item.type,
      source: item.source,
      sourceType: item.source_type,
      description: item.description,
      balanceAfter: item.balance_after,
      relatedId: item.related_id,
      relatedType: item.related_type,
      expiresAt: item.expires_at,
      metadata: item.metadata,
      createdAt: item.created_at,
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        }
      }
    }));
  } catch (error) {
    console.error('[Jinbi] Get records error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: '获取记录失败' }));
  }
}

/**
 * 消费津币
 * POST /api/jinbi/consume
 */
export async function consumeJinbi(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '未登录' }));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { amount, serviceType, description, serviceParams, relatedId } = JSON.parse(body);

        if (!amount || amount <= 0 || !serviceType) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '参数错误' }));
          return;
        }

        // 1. 检查余额
        const { data: balanceData } = await supabaseServer
          .from('user_jinbi_balance')
          .select('available_balance')
          .eq('user_id', user.userId)
          .single();

        const availableBalance = balanceData?.available_balance || 0;

        if (availableBalance < amount) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '津币余额不足',
            data: { required: amount, available: availableBalance }
          }));
          return;
        }

        const newBalance = availableBalance - amount;

        // 2. 创建消费记录
        const { data: record, error: recordError } = await supabaseServer
          .from('jinbi_records')
          .insert({
            user_id: user.userId,
            amount: -amount,
            type: 'spend',
            source: serviceType,
            description: description || `${serviceType}消费`,
            balance_after: newBalance,
            related_id: relatedId,
          })
          .select()
          .single();

        if (recordError) throw recordError;

        // 3. 创建消费明细
        await supabaseServer.from('jinbi_consumption_details').insert({
          user_id: user.userId,
          record_id: record.id,
          service_type: serviceType,
          service_params: serviceParams || {},
          jinbi_cost: amount,
          actual_cost: amount,
          status: 'completed',
        });

        // 4. 更新余额
        await supabaseServer
          .from('user_jinbi_balance')
          .update({
            total_balance: newBalance,
            available_balance: newBalance,
            total_spent: supabaseServer.rpc('increment', { x: amount }),
            last_updated: new Date().toISOString(),
          })
          .eq('user_id', user.userId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            recordId: record.id,
            amount,
            newBalance,
          }
        }));
      } catch (error) {
        console.error('[Jinbi] Consume error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: '消费失败' }));
      }
    });
  } catch (error) {
    console.error('[Jinbi] Consume error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: '消费失败' }));
  }
}

/**
 * 发放津币（管理员/系统）
 * POST /api/jinbi/grant
 */
export async function grantJinbi(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '未登录' }));
      return;
    }

    // TODO: 检查管理员权限

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { userId, amount, source, description, expiresAt } = JSON.parse(body);

        if (!userId || !amount || amount <= 0 || !source) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '参数错误' }));
          return;
        }

        // 获取当前余额
        const { data: balanceData } = await supabaseServer
          .from('user_jinbi_balance')
          .select('total_balance')
          .eq('user_id', userId)
          .single();

        const currentBalance = balanceData?.total_balance || 0;
        const newBalance = currentBalance + amount;

        // 创建发放记录
        const { data: record, error: recordError } = await supabaseServer
          .from('jinbi_records')
          .insert({
            user_id: userId,
            amount: amount,
            type: 'grant',
            source,
            description: description || `${source}奖励`,
            balance_after: newBalance,
            expires_at: expiresAt,
          })
          .select()
          .single();

        if (recordError) throw recordError;

        // 更新余额
        await supabaseServer
          .from('user_jinbi_balance')
          .upsert({
            user_id: userId,
            total_balance: newBalance,
            available_balance: newBalance,
            total_earned: supabaseServer.rpc('increment', { x: amount }),
            last_updated: new Date().toISOString(),
          });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            recordId: record.id,
            amount,
            newBalance,
          }
        }));
      } catch (error) {
        console.error('[Jinbi] Grant error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: '发放失败' }));
      }
    });
  } catch (error) {
    console.error('[Jinbi] Grant error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: '发放失败' }));
  }
}

/**
 * 获取津币套餐
 * GET /api/jinbi/packages
 */
export async function getJinbiPackages(req, res) {
  try {
    const { data, error } = await supabaseServer
      .from('jinbi_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    const packages = (data || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      jinbiAmount: item.jinbi_amount,
      price: item.price,
      currency: item.currency,
      bonusJinbi: item.bonus_jinbi,
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: packages }));
  } catch (error) {
    console.error('[Jinbi] Get packages error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: '获取套餐失败' }));
  }
}

/**
 * 获取服务计费标准
 * GET /api/jinbi/pricing
 */
export async function getServicePricing(req, res) {
  try {
    const { data, error } = await supabaseServer
      .from('service_pricing')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    const pricing = (data || []).map(item => ({
      id: item.id,
      serviceType: item.service_type,
      serviceSubtype: item.service_subtype,
      name: item.name,
      description: item.description,
      baseCost: item.base_cost,
      params: item.params,
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: pricing }));
  } catch (error) {
    console.error('[Jinbi] Get pricing error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: '获取计费标准失败' }));
  }
}

/**
 * 获取本月统计
 * GET /api/jinbi/stats
 */
export async function getJinbiStats(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '未登录' }));
      return;
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabaseServer
      .from('jinbi_records')
      .select('amount, type')
      .eq('user_id', user.userId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) throw error;

    let earned = 0;
    let spent = 0;

    (data || []).forEach((record) => {
      if (record.amount > 0) {
        earned += record.amount;
      } else {
        spent += Math.abs(record.amount);
      }
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        earned,
        spent,
        netChange: earned - spent,
      }
    }));
  } catch (error) {
    console.error('[Jinbi] Get stats error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: '获取统计失败' }));
  }
}

/**
 * 充值津币
 * POST /api/jinbi/recharge
 */
export async function rechargeJinbi(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '未登录' }));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { packageId, amount, jinbiAmount, paymentMethod } = JSON.parse(body);

        if (!packageId || !amount || amount <= 0 || !jinbiAmount) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '参数错误' }));
          return;
        }

        // 获取用户ID (Supabase token 使用 sub 字段)
        const userId = user.userId || user.sub || user.id;
        if (!userId) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '无法获取用户ID' }));
          return;
        }

        // 1. 获取当前余额
        const { data: balanceData } = await supabaseServer
          .from('user_jinbi_balance')
          .select('total_balance')
          .eq('user_id', userId)
          .single();

        const currentBalance = balanceData?.total_balance || 0;
        const newBalance = currentBalance + jinbiAmount;

        // 2. 创建充值记录
        const { data: record, error: recordError } = await supabaseServer
          .from('jinbi_records')
          .insert({
            user_id: userId,
            amount: jinbiAmount,
            type: 'purchase',
            source: paymentMethod || 'unknown',
            description: `充值 ${jinbiAmount} 津币`,
            balance_after: newBalance,
            related_id: null, // packageId 不是 UUID，存入 metadata
            related_type: 'jinbi_package',
            metadata: JSON.stringify({
              paymentMethod,
              price: amount,
              packageId,
            }),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (recordError) throw recordError;

        // 3. 更新余额 - 先尝试更新，如果不存在则插入
        const { data: existingBalance, error: checkError } = await supabaseServer
          .from('user_jinbi_balance')
          .select('*')
          .eq('user_id', userId)
          .single();

        let updateError;
        if (existingBalance) {
          // 更新现有记录
          const { error } = await supabaseServer
            .from('user_jinbi_balance')
            .update({
              total_balance: newBalance,
              available_balance: newBalance,
              total_earned: (existingBalance.total_earned || 0) + jinbiAmount,
              last_updated: new Date().toISOString(),
            })
            .eq('user_id', userId);
          updateError = error;
        } else {
          // 插入新记录
          const { error } = await supabaseServer
            .from('user_jinbi_balance')
            .insert({
              user_id: userId,
              total_balance: newBalance,
              available_balance: newBalance,
              total_earned: jinbiAmount,
              total_consumed: 0,
              frozen_balance: 0,
              last_updated: new Date().toISOString(),
            });
          updateError = error;
        }

        if (updateError) throw updateError;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            recordId: record.id,
            amount: jinbiAmount,
            newBalance,
          }
        }));
      } catch (error) {
        console.error('[Jinbi] Recharge error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: '充值失败' }));
      }
    });
  } catch (error) {
    console.error('[Jinbi] Recharge error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: '充值失败' }));
  }
}

/**
 * 津币路由处理器
 */
export default async function jinbiRoutes(req, res) {
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
  if (pathname === '/api/jinbi/balance' && method === 'GET') {
    await getJinbiBalance(req, res);
    return;
  }

  if (pathname === '/api/jinbi/records' && method === 'GET') {
    await getJinbiRecords(req, res);
    return;
  }

  if (pathname === '/api/jinbi/consume' && method === 'POST') {
    await consumeJinbi(req, res);
    return;
  }

  if (pathname === '/api/jinbi/grant' && method === 'POST') {
    await grantJinbi(req, res);
    return;
  }

  if (pathname === '/api/jinbi/packages' && method === 'GET') {
    await getJinbiPackages(req, res);
    return;
  }

  if (pathname === '/api/jinbi/pricing' && method === 'GET') {
    await getServicePricing(req, res);
    return;
  }

  if (pathname === '/api/jinbi/stats' && method === 'GET') {
    await getJinbiStats(req, res);
    return;
  }

  if (pathname === '/api/jinbi/recharge' && method === 'POST') {
    await rechargeJinbi(req, res);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    error: '接口不存在'
  }));
}
