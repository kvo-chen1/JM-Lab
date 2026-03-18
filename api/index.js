// Vercel API 入口
// 处理所有 /api/* 请求

// 跳过SSL证书验证（用于Supabase连接）
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 导入 crypto 模块（ES Module 方式）
import crypto from 'crypto';

// 数据库连接池（延迟初始化）
let pool = null;
let dbAvailable = false;

// 获取数据库连接池（延迟初始化）
async function getDbPool() {
  if (pool) return pool;

  // 尝试 Supabase PostgreSQL 环境变量
  let databaseUrl = process.env.POSTGRES_URL_NON_POOLING ||
                    process.env.DATABASE_URL ||
                    process.env.POSTGRES_URL;

  console.log('[DB] Environment check:', {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    hasPostgresUrlNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
    finalUrl: databaseUrl ? 'configured' : 'not configured'
  });

  if (!databaseUrl) {
    console.log('[DB] Database URL not configured');
    return null;
  }

  // 处理 Netlify 的 psql 格式: psql 'postgresql://...'
  if (databaseUrl.startsWith("psql '")) {
    databaseUrl = databaseUrl.replace(/^psql '/, '').replace(/'$/, '');
  }

  console.log('[DB] Creating connection pool...');

  try {
    const { Pool } = await import('pg');

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000,
      statement_timeout: 30000,
      query_timeout: 30000
    });

    pool.on('error', (err) => {
      console.error('[DB Pool] Unexpected error:', err.message);
    });

    pool.on('connect', () => {
      console.log('[DB Pool] New client connected');
    });

    // 测试连接
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    console.log('[DB] Connected to database successfully');
    dbAvailable = true;
    return pool;
  } catch (error) {
    console.error('[DB] Connection error:', error.message);
    dbAvailable = false;
    pool = null;
    return null;
  }
}

// 带重试的查询函数
async function queryWithRetry(sql, params, maxRetries = 3) {
  const pool = await getDbPool();
  if (!pool) {
    throw new Error('Database not configured');
  }

  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await pool.query(sql, params);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`[DB] Query attempt ${i + 1} failed:`, error.message);

      if (error.message.includes('disconnected') ||
          error.message.includes('terminated') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('timeout') ||
          error.message.includes('Connection')) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }

      throw error;
    }
  }
  throw lastError;
}

// 获取数据库连接（兼容旧代码）
async function getDbClient() {
  const pool = await getDbPool();
  if (!pool) return null;

  return {
    query: (sql, params) => queryWithRetry(sql, params),
    on: () => {},
    release: () => {}
  };
}

// 确保用户表存在
async function ensureUsersTable() {
  const pool = await getDbPool();
  if (!pool) {
    throw new Error('Database pool not available');
  }

  try {
    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255),
        avatar_url TEXT,
        points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[DB] Users table ready');
  } catch (error) {
    console.error('[DB] Users table creation error:', error.message);
    throw error;
  }
}

// 确保验证码表存在
async function ensureVerificationTable() {
  const pool = await getDbPool();
  if (!pool) {
    throw new Error('Database pool not available');
  }

  try {
    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        attempts INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email)
      )
    `);
    console.log('[DB] Verification table ready');
  } catch (error) {
    console.error('[DB] Table creation error:', error.message);
    throw error;
  }
}

// 根据邮箱查询用户
async function getUserByEmail(email) {
  try {
    const pool = await getDbPool();
    if (!pool) return null;

    await ensureUsersTable();

    const result = await queryWithRetry(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    console.log('[DB] User found by email:', email);
    return result.rows[0];
  } catch (error) {
    console.error('[DB] Get user by email error:', error.message);
    return null;
  }
}

// 保存或更新用户
async function saveUser(user) {
  const pool = await getDbPool();
  if (!pool) {
    throw new Error('Database pool not available');
  }

  try {
    await ensureUsersTable();

    await queryWithRetry(`
      INSERT INTO users (id, email, username, avatar_url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (email)
      DO UPDATE SET
        username = EXCLUDED.username,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [user.id, user.email, user.username, user.avatar_url, user.created_at]);

    console.log('[DB] User saved:', user.email);
    return user;
  } catch (error) {
    console.error('[DB] Save user error:', error.message);
    throw error;
  }
}

// 保存验证码（强制使用数据库，Vercel Serverless环境不支持内存存储）
async function saveVerificationCode(email, code, expiresAt) {
  const pool = await getDbPool();
  if (!pool) {
    throw new Error('Database not configured. Please set DATABASE_URL environment variable.');
  }

  try {
    console.log('[DB] Saving code for', email, 'expiresAt:', expiresAt, 'date:', new Date(expiresAt));
    await ensureVerificationTable();
    await queryWithRetry('DELETE FROM verification_codes WHERE email = $1', [email]);
    const result = await queryWithRetry(
      'INSERT INTO verification_codes (email, code, expires_at, attempts) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, code, new Date(expiresAt), 0]
    );
    console.log('[DB] Code saved for', email, 'result:', result.rows[0]);
  } catch (error) {
    console.error('[DB] Save code error:', error.message);
    throw error;
  }
}

// 获取验证码（强制使用数据库）
async function getVerificationCode(email) {
  const pool = await getDbPool();
  if (!pool) {
    throw new Error('Database not configured. Please set DATABASE_URL environment variable.');
  }

  try {
    console.log('[DB] Getting code for', email);
    await ensureVerificationTable();
    const result = await queryWithRetry('SELECT * FROM verification_codes WHERE email = $1', [email]);
    console.log('[DB] Got code for', email, 'result:', result.rows[0] || 'not found');
    return result.rows[0] || null;
  } catch (error) {
    console.error('[DB] Get code error:', error.message);
    throw error;
  }
}

// 更新尝试次数（强制使用数据库）
async function incrementAttempts(email) {
  const pool = await getDbPool();
  if (!pool) {
    throw new Error('Database not configured. Please set DATABASE_URL environment variable.');
  }

  try {
    await queryWithRetry('UPDATE verification_codes SET attempts = attempts + 1 WHERE email = $1', [email]);
  } catch (error) {
    console.error('[DB] Increment attempts error:', error.message);
    throw error;
  }
}

// 删除验证码（强制使用数据库）
async function deleteVerificationCode(email) {
  const pool = await getDbPool();
  if (!pool) {
    throw new Error('Database not configured. Please set DATABASE_URL environment variable.');
  }

  try {
    await queryWithRetry('DELETE FROM verification_codes WHERE email = $1', [email]);
  } catch (error) {
    console.error('[DB] Delete code error:', error.message);
    throw error;
  }
}

// 邮件发送函数
async function sendEmail(to, subject, htmlContent) {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM, EMAIL_SECURE } = process.env;

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.log('[Email] Not configured, logging to console');
    console.log('[Email] To:', to, 'Subject:', subject);
    return { success: true, message: 'Email logged' };
  }

  try {
    const nodemailer = await import('nodemailer').then(m => m.default).catch(() => null);
    if (!nodemailer) return { success: true, message: 'Nodemailer not available' };

    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: parseInt(EMAIL_PORT || '587'),
      secure: EMAIL_SECURE === 'true' || EMAIL_PORT === '465',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    });

    const info = await transporter.sendMail({
      from: EMAIL_FROM || EMAIL_USER, to, subject, html: htmlContent
    });

    console.log('[Email] Sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Error:', error);
    throw error;
  }
}

// 邮件模板
function generateVerificationEmailTemplate(code) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1>津脉智坊</h1><p>验证码登录</p>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
      <p>您好！</p>
      <p>您的验证码是：</p>
      <div style="font-size: 32px; font-weight: bold; color: #667eea; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; letter-spacing: 8px;">${code}</div>
      <p>此验证码将在 <strong>10 分钟</strong> 后过期。</p>
    </div>
  </div>
</body>
</html>`;
}

// 生成标准的JWT Token（与Supabase兼容）
function generateToken(user) {
  const timestamp = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({
    alg: 'HS256',
    typ: 'JWT'
  })).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const payload = Buffer.from(JSON.stringify({
    aud: 'authenticated',
    exp: timestamp + (7 * 24 * 60 * 60),
    iat: timestamp,
    sub: user.id,
    email: user.email,
    user_metadata: {
      username: user.username,
      avatar_url: user.avatar_url
    },
    role: 'authenticated'
  })).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  // 使用简单的签名（实际生产环境应该使用HMAC-SHA256）
  const secret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || 'default-secret';
  const signature = Buffer.from(
    crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest()
  ).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${header}.${payload}.${signature}`;
}

// Vercel API Handler
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 正确处理路径
  const urlWithoutQuery = req.url.split('?')[0];
  const path = urlWithoutQuery.replace(/^\/api/, '') || '/';
  console.log('[Vercel API] Request:', req.method, path, 'Original URL:', req.url);

  try {
    // 健康检查
    if (path === '/health' || path === '/ping') {
      return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // 调试API
    if (path === '/debug') {
      return handleDebug(req, res);
    }

    // 认证相关
    if (path.startsWith('/auth/')) {
      return handleAuthRequest(req, res, path);
    }

    // 用户成就相关API
    if (path === '/user/achievements' && req.method === 'GET') {
      return handleUserAchievements(req, res);
    }

    // 用户积分相关API
    if (path === '/user/points' && req.method === 'GET') {
      return handleUserPoints(req, res);
    }

    if (path === '/user/points/claim' && req.method === 'POST') {
      return handleClaimPoints(req, res);
    }

    // 用户作品统计API
    if (path === '/user/ports' && req.method === 'GET') {
      return handleUserStats(req, res);
    }

    // 用户统计API
    if (path === '/user/stats' && req.method === 'GET') {
      return handleUserStats(req, res);
    }

    // 用户点赞列表API
    if (path === '/user/likes' && req.method === 'GET') {
      return handleUserLikes(req, res);
    }

    // 用户收藏列表API
    if (path === '/user/bookmarks' && req.method === 'GET') {
      return handleUserBookmarks(req, res);
    }

    // 获取用户加入的社区 /user/communities
    if (path === '/user/communities' && req.method === 'GET') {
      return handleUserCommunities(req, res);
    }

    // 用户相关API - /users/:id
    if (path.startsWith('/users/')) {
      return handleUsers(req, res, path);
    }

    // Feeds API
    if (path === '/feeds' || path.startsWith('/feeds/')) {
      return handleFeeds(req, res, path);
    }

    // 头像上传API
    if (path === '/upload/avatar' && req.method === 'POST') {
      return handleUploadAvatar(req, res);
    }

    // 作品相关API
    if (path === '/works' && req.method === 'GET') {
      return handleGetWorks(req, res);
    }
    if (path === '/works' && req.method === 'POST') {
      return handleCreateWork(req, res);
    }

    // 单个作品相关API /works/:id
    if (path.startsWith('/works/')) {
      return handleWorkDetail(req, res, path);
    }

    // 关注相关API
    if (path.startsWith('/follows/')) {
      return handleFollows(req, res, path);
    }

    // 活动相关API
    if (path.startsWith('/events')) {
      return handleEvents(req, res, path);
    }

    // 社区相关API
    if (path.startsWith('/communities')) {
      return handleCommunities(req, res, path);
    }

    // 津币(Jinbi)相关API
    if (path.startsWith('/jinbi/') || path === '/jinbi') {
      return handleJinbi(req, res, path);
    }

    // 品牌相关API
    if (path.startsWith('/brands')) {
      return handleBrands(req, res, path);
    }

    // IP孵化相关API
    if (path.startsWith('/ip')) {
      return handleIP(req, res, path);
    }

    // 订单相关API
    if (path.startsWith('/orders')) {
      return handleOrders(req, res, path);
    }

    // 购物车相关API
    if (path.startsWith('/cart')) {
      return handleCart(req, res, path);
    }

    // 地址相关API
    if (path.startsWith('/addresses')) {
      return handleAddresses(req, res, path);
    }

    // 统计数据相关API
    if (path.startsWith('/stats')) {
      return handleStats(req, res, path);
    }

    // 分析数据相关API
    if (path.startsWith('/analytics')) {
      return handleAnalytics(req, res, path);
    }

    // 排行榜相关API
    if (path.startsWith('/rankings')) {
      return handleRankings(req, res, path);
    }

    // 排行榜相关API (leaderboard)
    if (path.startsWith('/leaderboard')) {
      return handleLeaderboard(req, res, path);
    }

    // 推荐相关API
    if (path.startsWith('/recommendations')) {
      return handleRecommendations(req, res, path);
    }

    // 搜索相关API
    if (path.startsWith('/search')) {
      return handleSearch(req, res, path);
    }

    // 分类相关API
    if (path.startsWith('/categories')) {
      return handleCategories(req, res, path);
    }

    // 健康检查 API
    if (path.startsWith('/health/')) {
      return handleHealth(req, res, path);
    }

    // 标签相关API
    if (path.startsWith('/tags')) {
      return handleTags(req, res, path);
    }

    // 通知相关API
    if (path.startsWith('/notifications')) {
      return handleNotifications(req, res, path);
    }

    // 管理后台 API
    if (path.startsWith('/admin')) {
      return handleAdmin(req, res, path);
    }

    // 数据库代理 API (Supabase/Neon)
    if (path.startsWith('/db')) {
      return handleDbProxy(req, res, path);
    }

    // Supabase REST API 代理
    if (path.startsWith('/rest/v1')) {
      return handleSupabaseRestProxy(req, res, path);
    }

    // 其他 API 返回未实现
    return res.status(501).json({ code: 1, message: 'API endpoint not implemented: ' + path });

  } catch (error) {
    console.error('[Vercel API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal Server Error', error: error.message });
  }
}

// 辅助函数：解析请求体
async function parseRequestBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
    return {};
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return { data: req.body };
    }
  }

  if (Buffer.isBuffer(req.body)) {
    try {
      const str = req.body.toString('utf8');
      return JSON.parse(str);
    } catch {
      return {};
    }
  }

  return {};
}

// 处理认证请求
async function handleAuthRequest(req, res, path) {
  try {
    const body = await parseRequestBody(req);

    console.log('[Auth] Path:', path, 'Body:', JSON.stringify(body));

    // 发送验证码
    if (path === '/auth/send-email-code') {
      const { email } = body;
      if (!email) return res.status(400).json({ code: 1, message: '邮箱地址不能为空' });

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return res.status(400).json({ code: 1, message: '邮箱格式不正确' });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('[Auth] Generated code for', email, ':', code);

      try {
        await sendEmail(email, '津脉智坊 - 登录验证码', generateVerificationEmailTemplate(code));
        await saveVerificationCode(email, code, Date.now() + 10 * 60 * 1000);

        return res.status(200).json({ code: 0, message: '验证码发送成功', data: { email } });
      } catch (error) {
        return res.status(500).json({ code: 1, message: '验证码发送失败', error: error.message });
      }
    }

    // 登录
    if (path === '/auth/login' || path === '/auth/login-with-email-code') {
      const { email, code } = body;
      if (!email || !code) return res.status(400).json({ code: 1, message: '邮箱和验证码不能为空' });

      let storedData;
      try {
        storedData = await getVerificationCode(email);
      } catch (error) {
        console.error('[Auth] Get verification code error:', error);
        return res.status(500).json({ code: 1, message: '验证服务错误: ' + error.message });
      }

      if (!storedData) return res.status(400).json({ code: 1, message: '验证码不存在或已过期' });

      console.log('[Auth] Verifying code for', email, 'stored expires_at:', storedData.expires_at, 'now:', new Date());

      if (new Date() > new Date(storedData.expires_at)) {
        await deleteVerificationCode(email);
        return res.status(400).json({ code: 1, message: '验证码已过期' });
      }
      if (storedData.attempts >= 5) {
        await deleteVerificationCode(email);
        return res.status(400).json({ code: 1, message: '尝试次数过多' });
      }
      if (storedData.code !== code) {
        await incrementAttempts(email);
        return res.status(400).json({ code: 1, message: '验证码错误' });
      }

      await deleteVerificationCode(email);

      console.log('[Auth] Getting user by email:', email);
      let user;
      try {
        user = await getUserByEmail(email);
        console.log('[Auth] getUserByEmail result:', user ? 'found' : 'not found');
      } catch (error) {
        console.error('[Auth] getUserByEmail error:', error);
        return res.status(500).json({ code: 1, message: '获取用户信息失败: ' + error.message });
      }

      if (!user) {
        user = {
          id: 'user_' + Date.now(),
          email,
          username: email.split('@')[0],
          avatar_url: null,
          created_at: new Date().toISOString()
        };
        console.log('[Auth] Creating new user:', email);
      } else {
        console.log('[Auth] Existing user found:', email, 'ID:', user.id);
      }

      console.log('[Auth] Saving user:', email);
      try {
        await saveUser(user);
        console.log('[Auth] User saved successfully');
      } catch (error) {
        console.error('[Auth] saveUser error:', error);
        return res.status(500).json({ code: 1, message: '保存用户失败: ' + error.message });
      }

      console.log('[Auth] Generating token for user:', user.id);
      let token;
      try {
        token = generateToken(user);
        console.log('[Auth] Token generated successfully');
      } catch (error) {
        console.error('[Auth] generateToken error:', error);
        return res.status(500).json({ code: 1, message: '生成令牌失败: ' + error.message });
      }

      console.log('[Auth] Login successful for:', email);
      return res.status(200).json({ code: 0, message: '登录成功', data: { token, user } });
    }

    // 获取当前登录用户信息
    if (path === '/auth/me' && req.method === 'GET') {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
      }

      try {
        const pool = await getDbPool();
        if (!pool) {
          return res.status(200).json({
            code: 0,
            data: {
              id: decoded.id || decoded.sub,
              email: decoded.email,
              username: decoded.user_metadata?.username || decoded.email?.split('@')[0],
              avatar_url: decoded.user_metadata?.avatar_url
            }
          });
        }

        const userId = decoded.id || decoded.sub;
        const result = await queryWithRetry(
          'SELECT id, email, username, avatar_url, created_at FROM users WHERE id = $1',
          [userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ code: 1, message: '用户不存在' });
        }

        return res.status(200).json({
          code: 0,
          data: result.rows[0]
        });
      } catch (error) {
        console.error('[Auth] Get me error:', error);
        return res.status(200).json({
          code: 0,
          data: {
            id: decoded.id || decoded.sub,
            email: decoded.email,
            username: decoded.user_metadata?.username
          }
        });
      }
    }

    // 获取 OAuth 提供商列表 /auth/oauth-providers
    if (path === '/auth/oauth-providers' && req.method === 'GET') {
      return res.status(200).json({
        code: 0,
        data: [
          { id: 'google', name: 'Google', enabled: true },
          { id: 'github', name: 'GitHub', enabled: true }
        ]
      });
    }

    return res.status(404).json({ code: 1, message: '未知的认证接口: ' + path });

  } catch (error) {
    console.error('[Auth] Error:', error);
    return res.status(500).json({ code: 1, message: '认证服务错误', error: error.message });
  }
}

// 处理用户成就查询
async function handleUserAchievements(req, res) {
  const decoded = verifyAuthToken(req);
  if (!decoded) {
    return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
  }

  try {
    const pool = await getDbPool();
    if (!pool) {
      return res.status(200).json({ code: 0, data: [] });
    }

    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        achievement_id INTEGER NOT NULL,
        progress INTEGER DEFAULT 0,
        is_unlocked BOOLEAN DEFAULT FALSE,
        unlocked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
      )
    `);

    const userId = decoded.userId || decoded.id || decoded.sub;
    const result = await queryWithRetry(
      'SELECT * FROM user_achievements WHERE user_id = $1',
      [userId]
    );

    return res.status(200).json({ code: 0, data: result.rows });
  } catch (error) {
    console.error('[API] Get achievements error:', error);
    return res.status(200).json({ code: 0, data: [] });
  }
}

// 处理用户积分查询
async function handleUserPoints(req, res) {
  const decoded = verifyAuthToken(req);
  if (!decoded) {
    return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
  }

  try {
    const pool = await getDbPool();
    if (!pool) {
      return res.status(200).json({ code: 0, data: { total: 0, records: [] } });
    }

    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS points_records (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        points INTEGER NOT NULL,
        source VARCHAR(255),
        source_type VARCHAR(50),
        description TEXT,
        balance_after INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const userId = decoded.userId || decoded.id || decoded.sub;
    const recordsResult = await queryWithRetry(
      'SELECT * FROM points_records WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    const totalResult = await queryWithRetry(
      'SELECT COALESCE(SUM(points), 0) as total FROM points_records WHERE user_id = $1',
      [userId]
    );

    return res.status(200).json({
      code: 0,
      data: {
        total: parseInt(totalResult.rows[0]?.total || 0),
        records: recordsResult.rows
      }
    });
  } catch (error) {
    console.error('[API] Get points error:', error);
    return res.status(200).json({ code: 0, data: { total: 0, records: [] } });
  }
}

// 处理积分领取
async function handleClaimPoints(req, res) {
  const decoded = verifyAuthToken(req);
  if (!decoded) {
    return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
  }

  try {
    const body = await parseRequestBody(req);
    const { achievementId, points } = body;

    const pool = await getDbPool();
    if (!pool) {
      return res.status(503).json({ code: 1, message: 'Database not available' });
    }

    const userId = decoded.userId || decoded.id || decoded.sub;

    await queryWithRetry(`
      INSERT INTO points_records (user_id, points, source, source_type, description, balance_after)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, points, `achievement_${achievementId}`, 'achievement', '成就奖励', points]);

    await queryWithRetry(`
      UPDATE user_achievements SET is_claimed = TRUE WHERE user_id = $1 AND achievement_id = $2
    `, [userId, achievementId]);

    return res.status(200).json({ code: 0, data: { balance: points } });
  } catch (error) {
    console.error('[API] Claim points error:', error);
    return res.status(500).json({ code: 1, message: '领取积分失败', error: error.message });
  }
}

// 处理用户统计
async function handleUserStats(req, res) {
  const decoded = verifyAuthToken(req);
  if (!decoded) {
    return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
  }

  try {
    const pool = await getDbPool();
    if (!pool) {
      return res.status(200).json({
        code: 0,
        data: { works_count: 0, total_likes: 0, total_views: 0, favorites_count: 0 }
      });
    }

    const userId = decoded.userId || decoded.id || decoded.sub;

    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS works (
        id UUID PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        description TEXT,
        thumbnail TEXT,
        video_url TEXT,
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS favorites (
        id UUID PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        work_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const worksResult = await queryWithRetry(
      'SELECT COUNT(*) as count, COALESCE(SUM(likes), 0) as total_likes, COALESCE(SUM(views), 0) as total_views FROM works WHERE user_id = $1',
      [userId]
    );

    const favoritesResult = await queryWithRetry(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = $1',
      [userId]
    );

    return res.status(200).json({
      code: 0,
      data: {
        works_count: parseInt(worksResult.rows[0]?.count || 0),
        total_likes: parseInt(worksResult.rows[0]?.total_likes || 0),
        total_views: parseInt(worksResult.rows[0]?.total_views || 0),
        favorites_count: parseInt(favoritesResult.rows[0]?.count || 0)
      }
    });
  } catch (error) {
    console.error('[API] Get user stats error:', error);
    return res.status(200).json({
      code: 0,
      data: { works_count: 0, total_likes: 0, total_views: 0, favorites_count: 0 }
    });
  }
}

// 处理用户点赞列表
async function handleUserLikes(req, res) {
  const decoded = verifyAuthToken(req);
  if (!decoded) {
    return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
  }

  try {
    const pool = await getDbPool();
    if (!pool) {
      return res.status(200).json({ code: 0, data: [] });
    }

    const userId = decoded.userId || decoded.id || decoded.sub;

    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        work_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, work_id)
      )
    `);

    const result = await queryWithRetry(`
      SELECT l.*, w.title, w.thumbnail, w.user_id as author_id
      FROM likes l
      LEFT JOIN works w ON l.work_id = w.id
      WHERE l.user_id = $1
      ORDER BY l.created_at DESC
    `, [userId]);

    return res.status(200).json({
      code: 0,
      data: result.rows.map(row => ({
        id: row.id,
        workId: row.work_id,
        title: row.title,
        thumbnail: row.thumbnail,
        authorId: row.author_id,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error('[API] Get user likes error:', error);
    return res.status(200).json({ code: 0, data: [] });
  }
}

// 处理用户收藏列表
async function handleUserBookmarks(req, res) {
  const decoded = verifyAuthToken(req);
  if (!decoded) {
    return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
  }

  try {
    const pool = await getDbPool();
    if (!pool) {
      return res.status(200).json({ code: 0, data: [] });
    }

    const userId = decoded.userId || decoded.id || decoded.sub;

    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        work_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, work_id)
      )
    `);

    const result = await queryWithRetry(`
      SELECT b.*, w.title, w.thumbnail, w.user_id as author_id
      FROM bookmarks b
      LEFT JOIN works w ON b.work_id = w.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [userId]);

    return res.status(200).json({
      code: 0,
      data: result.rows.map(row => ({
        id: row.id,
        workId: row.work_id,
        title: row.title,
        thumbnail: row.thumbnail,
        authorId: row.author_id,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error('[API] Get user bookmarks error:', error);
    return res.status(200).json({ code: 0, data: [] });
  }
}

// 处理头像上传
async function handleUploadAvatar(req, res) {
  const decoded = verifyAuthToken(req);
  if (!decoded) {
    return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
  }

  try {
    const body = await parseRequestBody(req);
    const { fileData, fileName, fileType } = body;

    console.log('[API] Avatar upload: Received file:', fileName, 'type:', fileType);

    if (!fileData) {
      return res.status(400).json({ code: 1, error: 'BAD_REQUEST', message: '缺少文件数据' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ code: 1, error: 'BAD_REQUEST', message: '不支持的文件类型' });
    }

    let base64Data;
    if (fileData.startsWith('data:')) {
      base64Data = fileData.split(',')[1];
    } else {
      base64Data = fileData;
    }

    const fileBuffer = Buffer.from(base64Data, 'base64');
    const maxSize = 2 * 1024 * 1024;
    if (fileBuffer.length > maxSize) {
      return res.status(413).json({ code: 1, error: 'PAYLOAD_TOO_LARGE', message: '图片过大，请使用小于2MB的图片' });
    }

    const pool = await getDbPool();
    if (!pool) {
      return res.status(503).json({ code: 1, message: 'Database not available' });
    }

    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS user_avatars (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        avatar_data TEXT NOT NULL,
        file_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const userId = decoded.userId || decoded.id || decoded.sub;
    const dataUrl = `data:${fileType};base64,${base64Data}`;

    await queryWithRetry(`
      INSERT INTO user_avatars (user_id, avatar_data, file_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET
        avatar_data = EXCLUDED.avatar_data,
        file_type = EXCLUDED.file_type,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, dataUrl, fileType]);

    await queryWithRetry(`
      UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
    `, [dataUrl, userId]);

    console.log('[API] Avatar upload: Saved to database for user:', userId);

    return res.status(200).json({
      code: 0,
      message: '头像上传成功',
      data: { url: dataUrl, path: `/api/avatar/${userId}` }
    });
  } catch (error) {
    console.error('[API] Avatar upload error:', error);
    return res.status(500).json({ code: 1, message: '头像上传失败', error: error.message });
  }
}

// 处理单个作品相关请求
async function handleWorkDetail(req, res, path) {
  try {
    const pool = await getDbPool();
    if (!pool) {
      return res.status(200).json({ code: 0, data: null, message: 'Database not available' });
    }

    // 获取作品详情 /works/:id
    const workIdMatch = path.match(/^\/works\/([^\/]+)$/);
    if (workIdMatch && req.method === 'GET') {
      const workId = workIdMatch[1];

      const result = await queryWithRetry(`
        SELECT w.*, u.username, u.avatar_url
        FROM works w
        LEFT JOIN users u ON w.user_id = u.id::text
        WHERE w.id = $1
      `, [workId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ code: 1, message: '作品不存在' });
      }

      const work = result.rows[0];
      return res.status(200).json({
        code: 0,
        data: {
          id: work.id,
          title: work.title || '无标题',
          description: work.description || '',
          thumbnail: work.thumbnail || '',
          videoUrl: work.video_url,
          likes: work.likes || 0,
          views: work.views || 0,
          status: work.status,
          createdAt: work.created_at,
          author: {
            id: work.user_id,
            username: work.username || '用户' + work.user_id.substring(0, 8),
            avatar: work.avatar_url
          }
        }
      });
    }

    // 点赞作品 /works/:id/like
    const likeMatch = path.match(/^\/works\/([^\/]+)\/like$/);
    if (likeMatch && req.method === 'POST') {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
      }

      const workId = likeMatch[1];
      const userId = decoded.userId || decoded.id || decoded.sub;

      // 确保 likes 表存在
      await queryWithRetry(`
        CREATE TABLE IF NOT EXISTS likes (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          work_id UUID,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, work_id)
        )
      `);

      await queryWithRetry(`
        INSERT INTO likes (user_id, work_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, work_id) DO NOTHING
      `, [userId, workId]);

      // 更新作品点赞数
      await queryWithRetry(`
        UPDATE works SET likes = likes + 1 WHERE id = $1
      `, [workId]);

      return res.status(200).json({ code: 0, message: '点赞成功' });
    }

    // 取消点赞 /works/:id/unlike
    const unlikeMatch = path.match(/^\/works\/([^\/]+)\/unlike$/);
    if (unlikeMatch && req.method === 'POST') {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
      }

      const workId = unlikeMatch[1];
      const userId = decoded.userId || decoded.id || decoded.sub;

      await queryWithRetry(
        'DELETE FROM likes WHERE user_id = $1 AND work_id = $2',
        [userId, workId]
      );

      // 更新作品点赞数
      await queryWithRetry(`
        UPDATE works SET likes = GREATEST(likes - 1, 0) WHERE id = $1
      `, [workId]);

      return res.status(200).json({ code: 0, message: '取消点赞成功' });
    }

    // 获取作品评论 /works/:id/comments
    const commentsMatch = path.match(/^\/works\/([^\/]+)\/comments$/);
    if (commentsMatch && req.method === 'GET') {
      const workId = commentsMatch[1];

      await queryWithRetry(`
        CREATE TABLE IF NOT EXISTS work_comments (
          id SERIAL PRIMARY KEY,
          work_id UUID NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          likes INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const result = await queryWithRetry(`
        SELECT wc.*, u.username, u.avatar_url
        FROM work_comments wc
        LEFT JOIN users u ON wc.user_id = u.id::text
        WHERE wc.work_id = $1
        ORDER BY wc.created_at DESC
      `, [workId]);

      return res.status(200).json({
        code: 0,
        data: result.rows.map(row => ({
          id: row.id,
          content: row.content,
          likes: row.likes,
          createdAt: row.created_at,
          author: {
            id: row.user_id,
            username: row.username,
            avatar: row.avatar_url
          }
        }))
      });
    }

    // 添加评论 /works/:id/comments
    if (commentsMatch && req.method === 'POST') {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
      }

      const workId = commentsMatch[1];
      const userId = decoded.userId || decoded.id || decoded.sub;

      const body = await parseRequestBody(req);
      const { content } = body;

      if (!content) {
        return res.status(400).json({ code: 1, message: '评论内容不能为空' });
      }

      const result = await queryWithRetry(`
        INSERT INTO work_comments (work_id, user_id, content)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [workId, userId, content]);

      return res.status(200).json({
        code: 0,
        message: '评论成功',
        data: result.rows[0]
      });
    }

    return res.status(501).json({ code: 1, message: 'Work endpoint not implemented: ' + path });
  } catch (error) {
    console.error('[Work API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error', error: error.message });
  }
}

// 处理获取作品列表
async function handleGetWorks(req, res) {
  try {
    const pool = await getDbPool();
    if (!pool) {
      return res.status(200).json({ code: 0, data: [], message: 'Database not available' });
    }

    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS works (
        id UUID PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        creator_id VARCHAR(255),
        title VARCHAR(255),
        description TEXT,
        thumbnail TEXT,
        video_url TEXT,
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 解析查询参数
    const url = new URL(req.url, `http://localhost`);
    const creatorId = url.searchParams.get('creator_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let query = 'SELECT * FROM works WHERE status = $1';
    let params = ['published'];

    // 如果指定了创作者ID，添加筛选条件
    if (creatorId) {
      query += ' AND (user_id = $2 OR creator_id = $2)';
      params.push(creatorId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await queryWithRetry(query, params);

    const works = result.rows.map(work => ({
      id: work.id,
      title: work.title || '无标题',
      description: work.description || '',
      thumbnail: work.thumbnail || '',
      videoUrl: work.video_url,
      likes: work.likes || 0,
      views: work.views || 0,
      date: work.created_at ? new Date(work.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      author: {
        id: work.user_id,
        username: '用户' + work.user_id.substring(0, 8),
        avatar: ''
      }
    }));

    return res.status(200).json({ code: 0, data: works });
  } catch (error) {
    console.error('[API] Get works error:', error);
    return res.status(200).json({ code: 0, data: [] });
  }
}

// 处理创建作品
async function handleCreateWork(req, res) {
  const decoded = verifyAuthToken(req);
  if (!decoded) {
    return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
  }

  try {
    const body = await parseRequestBody(req);
    const { title, description, thumbnail, videoUrl } = body;

    const pool = await getDbPool();
    if (!pool) {
      return res.status(503).json({ code: 1, message: 'Database not available' });
    }

    const userId = decoded.userId || decoded.id || decoded.sub;
    const { randomUUID } = await import('crypto');
    const workId = randomUUID();

    const result = await queryWithRetry(`
      INSERT INTO works (id, user_id, title, description, thumbnail, video_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'published')
      RETURNING *
    `, [workId, userId, title, description, thumbnail, videoUrl]);

    return res.status(200).json({ code: 0, message: '作品创建成功', data: result.rows[0] });
  } catch (error) {
    console.error('[API] Create work error:', error);
    return res.status(500).json({ code: 1, message: '创建作品失败', error: error.message });
  }
}

// 处理关注相关请求
async function handleFollows(req, res, path) {
  const decoded = verifyAuthToken(req);
  if (!decoded) {
    return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
  }

  try {
    const pool = await getDbPool();
    if (!pool) {
      return res.status(200).json({ code: 0, data: { isFollowing: false, followers: 0, following: 0 } });
    }

    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        follower_id VARCHAR(255) NOT NULL,
        following_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      )
    `);

    const userId = decoded.userId || decoded.id || decoded.sub;

    // 获取关注统计（关注数和粉丝数）
    if (path === '/follows/stats' || path === '/follows/counts') {
      const followersResult = await queryWithRetry(
        'SELECT COUNT(*) as count FROM follows WHERE following_id = $1',
        [userId]
      );
      const followingResult = await queryWithRetry(
        'SELECT COUNT(*) as count FROM follows WHERE follower_id = $1',
        [userId]
      );

      return res.status(200).json({
        code: 0,
        data: {
          followers: parseInt(followersResult.rows[0]?.count || 0),
          following: parseInt(followingResult.rows[0]?.count || 0)
        }
      });
    }

    // 获取关注列表
    if (path === '/follows/following') {
      const result = await queryWithRetry(`
        SELECT f.*, u.username, u.avatar_url
        FROM follows f
        LEFT JOIN users u ON f.following_id = u.id::text
        WHERE f.follower_id = $1
        ORDER BY f.created_at DESC
      `, [userId]);

      return res.status(200).json({
        code: 0,
        data: result.rows.map(row => ({
          id: row.id,
          userId: row.following_id,
          username: row.username,
          avatarUrl: row.avatar_url,
          createdAt: row.created_at
        }))
      });
    }

    // 获取粉丝列表
    if (path === '/follows/followers') {
      const result = await queryWithRetry(`
        SELECT f.*, u.username, u.avatar_url
        FROM follows f
        LEFT JOIN users u ON f.follower_id = u.id::text
        WHERE f.following_id = $1
        ORDER BY f.created_at DESC
      `, [userId]);

      return res.status(200).json({
        code: 0,
        data: result.rows.map(row => ({
          id: row.id,
          userId: row.follower_id,
          username: row.username,
          avatarUrl: row.avatar_url,
          createdAt: row.created_at
        }))
      });
    }

    // 检查是否关注某个用户
    if (path.startsWith('/follows/')) {
      const targetUserId = path.replace('/follows/', '').split('/')[0];
      if (targetUserId && targetUserId !== 'following' && targetUserId !== 'followers') {
        const result = await queryWithRetry(
          'SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2',
          [userId, targetUserId]
        );
        return res.status(200).json({ code: 0, data: { isFollowing: result.rows.length > 0 } });
      }
    }

    return res.status(200).json({ code: 0, data: [] });
  } catch (error) {
    console.error('[API] Follows error:', error);
    return res.status(200).json({ code: 0, data: { isFollowing: false, followers: 0, following: 0 } });
  }
}

// 处理活动相关请求
async function handleEvents(req, res, path) {
  try {
    const pool = await getDbPool();
    if (!pool) {
      return res.status(200).json({ code: 0, data: [] });
    }

    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    if (req.method === 'GET') {
      const result = await queryWithRetry(
        'SELECT * FROM events WHERE status = $1 ORDER BY created_at DESC LIMIT 10',
        ['active']
      );
      return res.status(200).json({ code: 0, data: result.rows });
    }

    return res.status(200).json({ code: 0, data: [] });
  } catch (error) {
    console.error('[API] Events error:', error);
    return res.status(200).json({ code: 0, data: [] });
  }
}

// 处理社区相关请求
async function handleCommunities(req, res, path) {
  try {
    const pool = await getDbPool();
    if (!pool) {
      // 返回默认数据
      if (path === '/communities/featured' && req.method === 'GET') {
        const defaultCommunities = [
          { name: '天津文化', members: 12580, path: '/community/tianjin-culture', official: true, topic: '天津传统文化交流', tags: ['文化', '传统', '天津'], cover: '/images/communities/tianjin-culture.jpg', avatar: '/images/avatars/tianjin.jpg' },
          { name: '创意灵感', members: 8920, path: '/community/creative-inspiration', official: true, topic: '创意设计与灵感分享', tags: ['设计', '创意', '灵感'], cover: '/images/communities/creative.jpg', avatar: '/images/avatars/creative.jpg' },
          { name: '摄影爱好者', members: 6540, path: '/community/photography', official: false, topic: '摄影技巧与作品分享', tags: ['摄影', '艺术', '视觉'], cover: '/images/communities/photography.jpg', avatar: '/images/avatars/photo.jpg' },
          { name: '文学创作', members: 4320, path: '/community/literature', official: false, topic: '文学创作与阅读交流', tags: ['文学', '写作', '阅读'], cover: '/images/communities/literature.jpg', avatar: '/images/avatars/literature.jpg' },
          { name: '美食探店', members: 9870, path: '/community/food', official: false, topic: '天津美食推荐与探店', tags: ['美食', '探店', '天津'], cover: '/images/communities/food.jpg', avatar: '/images/avatars/food.jpg' },
          { name: '旅行攻略', members: 7650, path: '/community/travel', official: false, topic: '旅行经验与攻略分享', tags: ['旅行', '攻略', '景点'], cover: '/images/communities/travel.jpg', avatar: '/images/avatars/travel.jpg' }
        ];
        return res.status(200).json({ code: 0, data: defaultCommunities });
      }
      return res.status(200).json({ code: 0, data: [] });
    }

    // 确保社区表存在
    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS communities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        avatar_url TEXT,
        cover_url TEXT,
        member_count INTEGER DEFAULT 0,
        is_official BOOLEAN DEFAULT false,
        tags TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 确保社区成员表存在
    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS community_members (
        id SERIAL PRIMARY KEY,
        community_id INTEGER NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(community_id, user_id)
      )
    `);

    // 获取推荐社区 /communities/featured
    if (path === '/communities/featured' && req.method === 'GET') {
      const result = await queryWithRetry('SELECT * FROM communities ORDER BY member_count DESC LIMIT 6');

      if (result.rows.length === 0) {
        const defaultCommunities = [
          { id: 1, name: '天津文化', members: 12580, path: '/community/tianjin-culture', official: true, topic: '天津传统文化交流', tags: ['文化', '传统', '天津'], cover: '/images/communities/tianjin-culture.jpg', avatar: '/images/avatars/tianjin.jpg' },
          { id: 2, name: '创意灵感', members: 8920, path: '/community/creative-inspiration', official: true, topic: '创意设计与灵感分享', tags: ['设计', '创意', '灵感'], cover: '/images/communities/creative.jpg', avatar: '/images/avatars/creative.jpg' },
          { id: 3, name: '摄影爱好者', members: 6540, path: '/community/photography', official: false, topic: '摄影技巧与作品分享', tags: ['摄影', '艺术', '视觉'], cover: '/images/communities/photography.jpg', avatar: '/images/avatars/photo.jpg' },
          { id: 4, name: '文学创作', members: 4320, path: '/community/literature', official: false, topic: '文学创作与阅读交流', tags: ['文学', '写作', '阅读'], cover: '/images/communities/literature.jpg', avatar: '/images/avatars/literature.jpg' },
          { id: 5, name: '美食探店', members: 9870, path: '/community/food', official: false, topic: '天津美食推荐与探店', tags: ['美食', '探店', '天津'], cover: '/images/communities/food.jpg', avatar: '/images/avatars/food.jpg' },
          { id: 6, name: '旅行攻略', members: 7650, path: '/community/travel', official: false, topic: '旅行经验与攻略分享', tags: ['旅行', '攻略', '景点'], cover: '/images/communities/travel.jpg', avatar: '/images/avatars/travel.jpg' }
        ];
        return res.status(200).json({ code: 0, data: defaultCommunities });
      }

      const communities = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        members: row.member_count,
        path: `/community/${row.id}`,
        official: row.is_official,
        topic: row.description,
        tags: row.tags || [],
        cover: row.cover_url,
        avatar: row.avatar_url
      }));

      return res.status(200).json({ code: 0, data: communities });
    }

    // 获取所有社区列表 /communities
    if (path === '/communities' && req.method === 'GET') {
      const url = new URL(req.url, `http://localhost`);
      const limit = parseInt(url.searchParams.get('limit') || '50');

      const result = await queryWithRetry(
        'SELECT * FROM communities ORDER BY member_count DESC LIMIT $1',
        [limit]
      );

      if (result.rows.length === 0) {
        const defaultCommunities = [
          { id: 1, name: '天津文化', members: 12580, path: '/community/tianjin-culture', official: true, topic: '天津传统文化交流', tags: ['文化', '传统', '天津'], cover: '/images/communities/tianjin-culture.jpg', avatar: '/images/avatars/tianjin.jpg', description: '天津传统文化交流' },
          { id: 2, name: '创意灵感', members: 8920, path: '/community/creative-inspiration', official: true, topic: '创意设计与灵感分享', tags: ['设计', '创意', '灵感'], cover: '/images/communities/creative.jpg', avatar: '/images/avatars/creative.jpg', description: '创意设计与灵感分享' },
          { id: 3, name: '摄影爱好者', members: 6540, path: '/community/photography', official: false, topic: '摄影技巧与作品分享', tags: ['摄影', '艺术', '视觉'], cover: '/images/communities/photography.jpg', avatar: '/images/avatars/photo.jpg', description: '摄影技巧与作品分享' },
          { id: 4, name: '文学创作', members: 4320, path: '/community/literature', official: false, topic: '文学创作与阅读交流', tags: ['文学', '写作', '阅读'], cover: '/images/communities/literature.jpg', avatar: '/images/avatars/literature.jpg', description: '文学创作与阅读交流' },
          { id: 5, name: '美食探店', members: 9870, path: '/community/food', official: false, topic: '天津美食推荐与探店', tags: ['美食', '探店', '天津'], cover: '/images/communities/food.jpg', avatar: '/images/avatars/food.jpg', description: '天津美食推荐与探店' },
          { id: 6, name: '旅行攻略', members: 7650, path: '/community/travel', official: false, topic: '旅行经验与攻略分享', tags: ['旅行', '攻略', '景点'], cover: '/images/communities/travel.jpg', avatar: '/images/avatars/travel.jpg', description: '旅行经验与攻略分享' }
        ];
        return res.status(200).json({ code: 0, data: defaultCommunities });
      }

      const communities = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        members: row.member_count,
        path: `/community/${row.id}`,
        official: row.is_official,
        topic: row.description,
        description: row.description,
        tags: row.tags || [],
        cover: row.cover_url,
        avatar: row.avatar_url
      }));

      return res.status(200).json({ code: 0, data: communities });
    }

    // 获取单个社区详情 /communities/:id
    const communityDetailMatch = path.match(/^\/communities\/([^\/]+)$/);
    if (communityDetailMatch && req.method === 'GET') {
      const communityId = communityDetailMatch[1];

      const result = await queryWithRetry(
        'SELECT * FROM communities WHERE id = $1',
        [communityId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ code: 1, message: '社区不存在' });
      }

      const row = result.rows[0];
      return res.status(200).json({
        code: 0,
        data: {
          id: row.id,
          name: row.name,
          description: row.description,
          members: row.member_count,
          avatar: row.avatar_url,
          cover: row.cover_url,
          official: row.is_official,
          tags: row.tags || []
        }
      });
    }

    // 加入社区 /communities/:id/join
    const joinMatch = path.match(/^\/communities\/([^\/]+)\/join$/);
    if (joinMatch && req.method === 'POST') {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
      }

      const communityId = joinMatch[1];
      const userId = decoded.userId || decoded.id || decoded.sub;

      await queryWithRetry(`
        INSERT INTO community_members (community_id, user_id, role)
        VALUES ($1, $2, 'member')
        ON CONFLICT (community_id, user_id) DO NOTHING
      `, [communityId, userId]);

      return res.status(200).json({ code: 0, message: '加入成功' });
    }

    // 离开社区 /communities/:id/leave
    const leaveMatch = path.match(/^\/communities\/([^\/]+)\/leave$/);
    if (leaveMatch && req.method === 'POST') {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
      }

      const communityId = leaveMatch[1];
      const userId = decoded.userId || decoded.id || decoded.sub;

      await queryWithRetry(
        'DELETE FROM community_members WHERE community_id = $1 AND user_id = $2',
        [communityId, userId]
      );

      return res.status(200).json({ code: 0, message: '离开成功' });
    }

    // 获取社区成员 /communities/:id/members
    const membersMatch = path.match(/^\/communities\/([^\/]+)\/members$/);
    if (membersMatch && req.method === 'GET') {
      const communityId = membersMatch[1];

      const result = await queryWithRetry(`
        SELECT cm.*, u.username, u.avatar_url
        FROM community_members cm
        LEFT JOIN users u ON cm.user_id = u.id::text
        WHERE cm.community_id = $1
      `, [communityId]);

      return res.status(200).json({
        code: 0,
        data: result.rows.map(row => ({
          id: row.user_id,
          username: row.username,
          avatar: row.avatar_url,
          role: row.role,
          joinedAt: row.joined_at
        }))
      });
    }

    return res.status(200).json({ code: 0, data: [] });
  } catch (error) {
    console.error('[API] Communities error:', error);
    return res.status(200).json({ code: 0, data: [] });
  }
}

// 处理数据库代理请求
async function handleDbProxy(req, res, path) {
  try {
    const pool = await getDbPool();
    if (!pool) {
      // 对于GET请求，返回空数据而不是错误
      if (req.method === 'GET') {
        return res.status(200).json([]);
      }
      return res.status(503).json({
        code: 1,
        message: 'Database not configured',
        hint: 'Please set DATABASE_URL environment variable'
      });
    }

    // 处理 /db/auth/v1/user 请求
    if (path === '/db/auth/v1/user' && req.method === 'GET') {
      const user = verifyAuthToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized', message: '未授权访问' });
      }

      try {
        const result = await queryWithRetry(
          'SELECT id, email, username, avatar_url, role, created_at, updated_at FROM users WHERE id = $1',
          [user.sub || user.id || user.userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'User not found', message: '用户不存在' });
        }

        const userData = result.rows[0];
        return res.status(200).json({
          id: userData.id,
          email: userData.email,
          user_metadata: {
            username: userData.username,
            avatar_url: userData.avatar_url,
            role: userData.role
          },
          created_at: userData.created_at,
          updated_at: userData.updated_at
        });
      } catch (error) {
        console.error('[DB Proxy] Auth error:', error.message);
        return res.status(500).json({ error: 'Server error', message: error.message });
      }
    }

    const body = await parseRequestBody(req);
    console.log('[DB Proxy]', req.method, path, body);

    if (req.method === 'POST' && body) {
      if (body.query) {
        try {
          const result = await queryWithRetry(body.query, body.params || []);
          return res.status(200).json({ code: 0, data: result.rows, rowCount: result.rowCount });
        } catch (queryError) {
          console.error('[DB Proxy] Query error:', queryError);
          return res.status(400).json({ code: 1, message: 'Query failed', error: queryError.message });
        }
      }

      if (body.rpc) {
        try {
          const result = await queryWithRetry(`SELECT * FROM ${body.rpc}($1)`, [JSON.stringify(body.params || {})]);
          return res.status(200).json({ code: 0, data: result.rows });
        } catch (rpcError) {
          console.error('[DB Proxy] RPC error:', rpcError);
          return res.status(400).json({ code: 1, message: 'RPC call failed', error: rpcError.message });
        }
      }
    }

    if (req.method === 'GET') {
      try {
        const result = await queryWithRetry('SELECT NOW() as time, version() as version');
        return res.status(200).json({
          code: 0,
          status: 'connected',
          serverTime: result.rows[0].time,
          version: result.rows[0].version
        });
      } catch (error) {
        return res.status(503).json({ code: 1, message: 'Database connection error', error: error.message });
      }
    }

    return res.status(405).json({ code: 1, message: 'Method not allowed' });

  } catch (error) {
    console.error('[DB Proxy] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error', error: error.message });
  }
}

// 处理 Supabase REST API 代理
async function handleSupabaseRestProxy(req, res, path) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // 对于GET请求，返回空数据
      if (req.method === 'GET') {
        return res.status(200).json([]);
      }
      return res.status(503).json({
        code: 1,
        message: 'Supabase not configured',
        hint: 'Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables'
      });
    }

    const targetPath = path.replace(/^\/rest\/v1/, '');
    const targetUrl = `${supabaseUrl}/rest/v1${targetPath}`;

    console.log('[Supabase Proxy]', req.method, targetUrl);

    const headers = {
      'apikey': supabaseKey,
      'Authorization': req.headers.authorization || `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': req.headers.prefer || 'return=representation'
    };

    if (req.headers.accept) headers['Accept'] = req.headers.accept;
    if (req.headers['accept-profile']) headers['Accept-Profile'] = req.headers['accept-profile'];
    if (req.headers['content-profile']) headers['Content-Profile'] = req.headers['content-profile'];

    const body = await parseRequestBody(req);

    const fetchOptions = {
      method: req.method,
      headers,
      ...(body && { body: JSON.stringify(body) })
    };

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json().catch(() => null);

    res.status(response.status);

    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'transfer-encoding') {
        res.setHeader(key, value);
      }
    });

    return res.json(data || { code: 0 });

  } catch (error) {
    console.error('[Supabase Proxy] Error:', error);
    // 对于GET请求，返回空数据而不是错误
    if (req.method === 'GET') {
      return res.status(200).json([]);
    }
    return res.status(500).json({ code: 1, message: 'Proxy error', error: error.message });
  }
}

// 处理调试请求
async function handleDebug(req, res) {
  // 收集环境变量信息（隐藏敏感信息）
  const envInfo = {
    // 数据库相关
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    hasPostgresUrlNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
    databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : null,
    postgresUrlPrefix: process.env.POSTGRES_URL ? process.env.POSTGRES_URL.substring(0, 30) + '...' : null,
    postgresUrlNonPoolingPrefix: process.env.POSTGRES_URL_NON_POOLING ? process.env.POSTGRES_URL_NON_POOLING.substring(0, 30) + '...' : null,

    // Supabase相关
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
    hasNextPublicSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasNextPublicSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

    // Vercel环境
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV,
    region: process.env.VERCEL_REGION,
  };

  // 尝试连接数据库
  let dbStatus = 'not_configured';
  let dbError = null;
  let dbInfo = null;

  const databaseUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (databaseUrl) {
    try {
      const { Pool } = await import('pg');
      const testPool = new Pool({
        connectionString: databaseUrl,
        ssl: true,
        connectionTimeoutMillis: 10000,
        max: 1
      });

      const client = await testPool.connect();
      const result = await client.query('SELECT NOW() as time, version() as version, current_database() as database');
      client.release();
      await testPool.end();

      dbStatus = 'connected';
      dbInfo = {
        time: result.rows[0].time,
        version: result.rows[0].version.substring(0, 50) + '...',
        database: result.rows[0].database
      };
    } catch (error) {
      dbStatus = 'error';
      dbError = error.message;
    }
  }

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: envInfo,
    databaseStatus: dbStatus,
    databaseInfo: dbInfo,
    databaseError: dbError,
    message: dbStatus === 'not_configured'
      ? '数据库未配置，请在Vercel环境变量中设置 DATABASE_URL 或 POSTGRES_URL'
      : dbStatus === 'connected'
      ? '数据库连接正常'
      : '数据库连接失败: ' + dbError
  });
}

// 验证Token
function verifyAuthToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[Auth] No Bearer token found');
    return null;
  }
  const token = authHeader.substring(7);
  
  try {
    // 支持新的token格式: jm_timestamp_random_userPart
    if (token.startsWith('jm_')) {
      const parts = token.split('_');
      if (parts.length >= 4) {
        const userPart = parts.slice(3).join('_');
        const payload = JSON.parse(Buffer.from(userPart.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
        if (payload.exp && payload.exp < Date.now() / 1000) {
          console.log('[Auth] jm_ token expired');
          return null;
        }
        return payload;
      }
    }
    
    // 兼容 JWT 格式 (Supabase token)
    const parts = token.split('.');
    if (parts.length === 3) {
      // 修复 base64 解码（处理 URL-safe base64）
      const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      // 添加 padding
      const padding = '='.repeat((4 - base64Payload.length % 4) % 4);
      const payload = JSON.parse(Buffer.from(base64Payload + padding, 'base64').toString());
      
      console.log('[Auth] JWT payload:', { 
        sub: payload.sub, 
        email: payload.email,
        exp: payload.exp,
        expired: payload.exp ? payload.exp < Date.now() / 1000 : 'no exp'
      });
      
      if (payload.exp && payload.exp < Date.now() / 1000) {
        console.log('[Auth] JWT token expired');
        return null;
      }
      
      // 标准化返回格式
      return {
        id: payload.sub,
        userId: payload.sub,
        sub: payload.sub,
        email: payload.email,
        role: payload.role || 'authenticated',
        ...payload
      };
    }
    
    console.log('[Auth] Unknown token format');
    return null;
  } catch (error) {
    console.error('[Auth] Token verification error:', error.message);
    return null;
  }
}

// 处理津币(Jinbi)相关请求
async function handleJinbi(req, res, path) {
  const decoded = verifyAuthToken(req);
  if (!decoded) {
    return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
  }

  try {
    const pool = await getDbPool();
    const userId = decoded.id || decoded.userId || decoded.sub;

    // 获取余额 - 使用前端期望的表名和字段名
    if (path === '/jinbi/balance' && req.method === 'GET') {
      if (!pool) {
        return res.status(200).json({
          code: 0,
          data: [{
            user_id: userId,
            total_balance: 0,
            available_balance: 0,
            frozen_balance: 0,
            total_earned: 0,
            total_spent: 0,
            last_updated: new Date().toISOString()
          }]
        });
      }

      await queryWithRetry(`
        CREATE TABLE IF NOT EXISTS user_jinbi_balance (
          user_id VARCHAR(255) PRIMARY KEY,
          total_balance INTEGER DEFAULT 0,
          available_balance INTEGER DEFAULT 0,
          frozen_balance INTEGER DEFAULT 0,
          total_earned INTEGER DEFAULT 0,
          total_spent INTEGER DEFAULT 0,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const result = await queryWithRetry(
        'SELECT * FROM user_jinbi_balance WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        // 创建默认记录
        await queryWithRetry(`
          INSERT INTO user_jinbi_balance (user_id, total_balance, available_balance, frozen_balance, total_earned, total_spent)
          VALUES ($1, 0, 0, 0, 0, 0)
          ON CONFLICT (user_id) DO NOTHING
        `, [userId]);

        return res.status(200).json({
          code: 0,
          data: [{
            user_id: userId,
            total_balance: 0,
            available_balance: 0,
            frozen_balance: 0,
            total_earned: 0,
            total_spent: 0,
            last_updated: new Date().toISOString()
          }]
        });
      }

      return res.status(200).json({
        code: 0,
        data: result.rows
      });
    }

    // 获取记录 - 使用前端期望的表名和字段名
    if (path === '/jinbi/records' && req.method === 'GET') {
      if (!pool) {
        return res.status(200).json({ code: 0, data: [], total: 0 });
      }

      await queryWithRetry(`
        CREATE TABLE IF NOT EXISTS jinbi_records (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          amount INTEGER NOT NULL,
          type VARCHAR(50) NOT NULL,
          source VARCHAR(255),
          source_type VARCHAR(50),
          description TEXT,
          balance_after INTEGER,
          related_id VARCHAR(255),
          related_type VARCHAR(50),
          expires_at TIMESTAMP,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const result = await queryWithRetry(
        'SELECT * FROM jinbi_records WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
        [userId]
      );

      // 获取总数
      const countResult = await queryWithRetry(
        'SELECT COUNT(*) as total FROM jinbi_records WHERE user_id = $1',
        [userId]
      );

      return res.status(200).json({
        code: 0,
        data: result.rows,
        total: parseInt(countResult.rows[0]?.total || 0)
      });
    }

    // 获取消费明细
    if (path === '/jinbi/consumption' && req.method === 'GET') {
      return res.status(200).json({ code: 0, data: [] });
    }

    // 获取套餐 - 使用前端期望的表名和字段名
    if (path === '/jinbi/packages' && req.method === 'GET') {
      if (!pool) {
        return res.status(200).json({
          code: 0,
          data: [
            { id: '1', name: '基础套餐', description: '100津币', jinbi_amount: 100, price: 10, currency: 'CNY', bonus_jinbi: 0, is_active: true, sort_order: 1 },
            { id: '2', name: '标准套餐', description: '550津币（赠送50）', jinbi_amount: 500, price: 50, currency: 'CNY', bonus_jinbi: 50, is_active: true, sort_order: 2 },
            { id: '3', name: '高级套餐', description: '1200津币（赠送200）', jinbi_amount: 1000, price: 100, currency: 'CNY', bonus_jinbi: 200, is_active: true, sort_order: 3 }
          ]
        });
      }

      await queryWithRetry(`
        CREATE TABLE IF NOT EXISTS jinbi_packages (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          jinbi_amount INTEGER NOT NULL,
          price INTEGER NOT NULL,
          currency VARCHAR(10) DEFAULT 'CNY',
          bonus_jinbi INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 插入默认套餐数据
      await queryWithRetry(`
        INSERT INTO jinbi_packages (id, name, description, jinbi_amount, price, currency, bonus_jinbi, is_active, sort_order)
        VALUES 
          ('1', '基础套餐', '100津币', 100, 10, 'CNY', 0, TRUE, 1),
          ('2', '标准套餐', '550津币（赠送50）', 500, 50, 'CNY', 50, TRUE, 2),
          ('3', '高级套餐', '1200津币（赠送200）', 1000, 100, 'CNY', 200, TRUE, 3)
        ON CONFLICT (id) DO NOTHING
      `);

      const result = await queryWithRetry(
        'SELECT * FROM jinbi_packages WHERE is_active = TRUE ORDER BY sort_order ASC'
      );

      return res.status(200).json({ code: 0, data: result.rows });
    }

    // 获取收费标准 - 使用前端期望的表名和字段名
    if (path === '/jinbi/pricing' && req.method === 'GET') {
      if (!pool) {
        return res.status(200).json({
          code: 0,
          data: [
            { id: '1', service_type: 'agent_chat', service_subtype: null, name: 'AI对话', description: '与AI助手对话', base_cost: 1, params: {}, is_active: true },
            { id: '2', service_type: 'image_gen', service_subtype: null, name: '图片生成', description: '生成AI图片', base_cost: 10, params: {}, is_active: true },
            { id: '3', service_type: 'video_gen', service_subtype: null, name: '视频生成', description: '生成AI视频', base_cost: 20, params: {}, is_active: true }
          ]
        });
      }

      await queryWithRetry(`
        CREATE TABLE IF NOT EXISTS service_pricing (
          id VARCHAR(255) PRIMARY KEY,
          service_type VARCHAR(100) NOT NULL,
          service_subtype VARCHAR(100),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          base_cost INTEGER NOT NULL,
          params JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 插入默认计费标准
      await queryWithRetry(`
        INSERT INTO service_pricing (id, service_type, service_subtype, name, description, base_cost, params, is_active)
        VALUES 
          ('1', 'agent_chat', NULL, 'AI对话', '与AI助手对话', 1, '{}', TRUE),
          ('2', 'image_gen', NULL, '图片生成', '生成AI图片', 10, '{}', TRUE),
          ('3', 'video_gen', NULL, '视频生成', '生成AI视频', 20, '{}', TRUE)
        ON CONFLICT (id) DO NOTHING
      `);

      const result = await queryWithRetry(
        'SELECT * FROM service_pricing WHERE is_active = TRUE ORDER BY service_type ASC'
      );

      return res.status(200).json({ code: 0, data: result.rows });
    }

    // 获取月度统计
    if (path === '/jinbi/monthly-stats' && req.method === 'GET') {
      return res.status(200).json({
        code: 0,
        data: {
          income: 0,
          expense: 0,
          balance: 0
        }
      });
    }

    return res.status(501).json({ code: 1, message: 'Jinbi endpoint not implemented: ' + path });
  } catch (error) {
    console.error('[Jinbi API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error', error: error.message });
  }
}

// 处理品牌相关请求
async function handleBrands(req, res, path) {
  try {
    if (req.method === 'GET') {
      return res.status(200).json({ code: 0, data: [] });
    }
    return res.status(501).json({ code: 1, message: 'Brands endpoint not implemented' });
  } catch (error) {
    console.error('[Brands API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error' });
  }
}

// 处理IP孵化相关请求
async function handleIP(req, res, path) {
  const decoded = verifyAuthToken(req);
  if (!decoded) {
    return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
  }

  try {
    // 处理商业合作申请审核 /ip/partnerships/:id/review
    if (path.match(/\/ip\/partnerships\/[^\/]+\/review/) && req.method === 'PUT') {
      const match = path.match(/\/ip\/partnerships\/([^\/]+)\/review/);
      const applicationId = match ? match[1] : null;
      
      if (!applicationId) {
        return res.status(400).json({ code: 1, message: '申请ID不能为空' });
      }

      const body = await parseRequestBody(req);
      const { status, message } = body;

      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ code: 1, message: '状态必须是 approved 或 rejected' });
      }

      const pool = await getDbPool();
      if (!pool) {
        return res.status(503).json({ code: 1, message: '数据库服务不可用' });
      }

      // 检查申请是否存在
      const checkResult = await queryWithRetry(
        'SELECT id, status FROM commercial_partnerships WHERE id = $1',
        [applicationId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ code: 1, message: '申请不存在' });
      }

      const currentStatus = checkResult.rows[0].status;
      if (currentStatus !== 'pending') {
        return res.status(400).json({ code: 1, message: '该申请已被处理' });
      }

      // 更新申请状态
      await queryWithRetry(
        `UPDATE commercial_partnerships 
         SET status = $1, 
             message = $2, 
             updated_at = NOW(),
             reviewed_at = NOW(),
             reviewed_by = $3
         WHERE id = $4`,
        [status, message || null, decoded.userId || decoded.id, applicationId]
      );

      return res.status(200).json({ code: 0, message: '审核成功' });
    }

    // 获取商业合作申请列表 /ip/partnerships
    if (path === '/ip/partnerships' && req.method === 'GET') {
      const pool = await getDbPool();
      if (!pool) {
        return res.status(200).json({ code: 0, data: [] });
      }

      const result = await queryWithRetry(
        `SELECT * FROM commercial_partnerships ORDER BY created_at DESC`,
        []
      );

      return res.status(200).json({ code: 0, data: result.rows });
    }

    // 获取商业机会列表 /ip/opportunities
    if (path === '/ip/opportunities' && req.method === 'GET') {
      const pool = await getDbPool();
      if (!pool) {
        return res.status(200).json({ code: 0, data: [] });
      }

      const result = await queryWithRetry(
        `SELECT * FROM commercial_opportunities ORDER BY created_at DESC`,
        []
      );

      return res.status(200).json({ code: 0, data: result.rows });
    }

    // 获取版权资产列表 /ip/copyright
    if (path === '/ip/copyright' && req.method === 'GET') {
      const pool = await getDbPool();
      if (!pool) {
        return res.status(200).json({ code: 0, data: [] });
      }

      const userId = decoded.userId || decoded.id;
      
      // 解析 URL 获取 query 参数
      const url = new URL(req.url, `http://localhost`);
      const queryUserId = url.searchParams.get('userId');
      const targetUserId = queryUserId || userId;

      // 确保 works 表存在
      await queryWithRetry(`
        CREATE TABLE IF NOT EXISTS works (
          id UUID PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          creator_id VARCHAR(255),
          title VARCHAR(255),
          description TEXT,
          type VARCHAR(50) DEFAULT 'illustration',
          thumbnail TEXT,
          video_url TEXT,
          likes INTEGER DEFAULT 0,
          views INTEGER DEFAULT 0,
          status VARCHAR(50) DEFAULT 'published',
          hidden_in_square BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 查询用户的作品作为版权资产（这里使用用户的作品模拟版权资产）
      const result = await queryWithRetry(
        `SELECT 
          w.id,
          w.title as name,
          w.description,
          w.type,
          w.thumbnail,
          w.created_at,
          w.updated_at
        FROM works w
        WHERE (w.creator_id = $1 OR w.user_id = $1)
          AND w.status = 'published'
        ORDER BY w.created_at DESC`,
        [targetUserId]
      );

      // 格式化返回数据（将作品转换为版权资产格式）
      const copyrightAssets = result.rows.map(row => ({
        id: row.id,
        name: row.name || '未命名作品',
        description: row.description || '',
        type: row.type || 'illustration',
        thumbnail: row.thumbnail,
        status: 'registered', // 默认为已登记
        canLicense: true,
        licensePrice: 0,
        licenseCount: 0,
        totalLicenseRevenue: 0,
        certificateUrl: null,
        registeredAt: row.created_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      return res.status(200).json({ code: 0, data: copyrightAssets });
    }

    // 获取某个机会的申请列表 /ip/opportunities/:id/applications
    if (path.match(/\/ip\/opportunities\/[^\/]+\/applications/) && req.method === 'GET') {
      const match = path.match(/\/ip\/opportunities\/([^\/]+)\/applications/);
      const opportunityId = match ? match[1] : null;

      if (!opportunityId) {
        return res.status(400).json({ code: 1, message: '机会ID不能为空' });
      }

      const pool = await getDbPool();
      if (!pool) {
        return res.status(200).json({ code: 0, data: [] });
      }

      const result = await queryWithRetry(
        `SELECT * FROM commercial_partnerships WHERE opportunity_id = $1 ORDER BY created_at DESC`,
        [opportunityId]
      );

      return res.status(200).json({ code: 0, data: result.rows });
    }

    return res.status(501).json({ code: 1, message: 'IP endpoint not implemented: ' + path });
  } catch (error) {
    console.error('[IP API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error' });
  }
}

// 处理订单相关请求
async function handleOrders(req, res, path) {
  const decoded = verifyAuthToken(req);
  if (!decoded) {
    return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ code: 0, data: [] });
    }
    return res.status(501).json({ code: 1, message: 'Orders endpoint not implemented' });
  } catch (error) {
    console.error('[Orders API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error' });
  }
}

// 处理购物车相关请求
async function handleCart(req, res, path) {
  const decoded = verifyAuthToken(req);
  if (!decoded) {
    return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ code: 0, data: [] });
    }
    return res.status(501).json({ code: 1, message: 'Cart endpoint not implemented' });
  } catch (error) {
    console.error('[Cart API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error' });
  }
}

// 处理地址相关请求
async function handleAddresses(req, res, path) {
  const decoded = verifyAuthToken(req);
  if (!decoded) {
    return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ code: 0, data: [] });
    }
    return res.status(501).json({ code: 1, message: 'Addresses endpoint not implemented' });
  } catch (error) {
    console.error('[Addresses API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error' });
  }
}

// 处理统计数据相关请求
async function handleStats(req, res, path) {
  try {
    return res.status(200).json({ code: 0, data: {} });
  } catch (error) {
    console.error('[Stats API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error' });
  }
}

// 处理分析数据相关请求
async function handleAnalytics(req, res, path) {
  try {
    // 流量分析
    if (path === '/analytics/traffic') {
      return res.status(200).json({
        code: 0,
        data: {
          pv: 0,
          uv: 0,
          ip: 0
        }
      });
    }

    // 页面性能
    if (path === '/analytics/performance') {
      return res.status(200).json({
        code: 0,
        data: {
          loadTime: 0,
          renderTime: 0
        }
      });
    }

    return res.status(200).json({ code: 0, data: {} });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error' });
  }
}

// 处理排行榜相关请求
async function handleRankings(req, res, path) {
  try {
    return res.status(200).json({ code: 0, data: [] });
  } catch (error) {
    console.error('[Rankings API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error' });
  }
}

// 处理 Leaderboard 排行榜请求
async function handleLeaderboard(req, res, path) {
  try {
    const pool = await getDbPool();
    const url = new URL(req.url, `http://localhost`);
    const searchParams = url.searchParams;

    // 获取查询参数
    const type = searchParams.get('type') || 'users';
    const sortBy = searchParams.get('sortBy') || 'likes_count';
    const timeRange = searchParams.get('timeRange') || 'week';
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('[Leaderboard API] Request:', { type, sortBy, timeRange, limit });

    if (!pool) {
      console.log('[Leaderboard API] Database not available, returning mock data');
      return res.status(200).json({
        code: 0,
        data: {
          users: [],
          posts: [],
          pointsUsers: []
        }
      });
    }

    // 构建时间范围条件
    let timeCondition = '';
    const now = new Date();
    if (timeRange === 'day') {
      const today = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      timeCondition = `AND created_at >= '${today}'`;
    } else if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      timeCondition = `AND created_at >= '${weekAgo}'`;
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      timeCondition = `AND created_at >= '${monthAgo}'`;
    }

    // 处理 /leaderboard/stats 请求
    if (path === '/leaderboard/stats') {
      const usersResult = await queryWithRetry('SELECT COUNT(*) as count FROM users');
      const postsResult = await queryWithRetry('SELECT COUNT(*) as count FROM posts');
      const pointsResult = await queryWithRetry('SELECT COALESCE(SUM(balance), 0) as total FROM user_points');

      return res.status(200).json({
        code: 0,
        data: {
          users_count: parseInt(usersResult.rows[0]?.count || 0),
          posts_count: parseInt(postsResult.rows[0]?.count || 0),
          total_points: parseInt(pointsResult.rows[0]?.total || 0)
        }
      });
    }

    // 处理 /leaderboard/achievements 请求
    if (path === '/leaderboard/achievements') {
      const result = await queryWithRetry(`
        SELECT 
          u.id,
          u.username,
          u.avatar_url,
          COUNT(ua.achievement_id) as achievement_count
        FROM users u
        LEFT JOIN user_achievements ua ON u.id = ua.user_id
        GROUP BY u.id, u.username, u.avatar_url
        ORDER BY achievement_count DESC
        LIMIT $1
      `, [limit]);

      return res.status(200).json({
        code: 0,
        data: result.rows.map(row => ({
          user_id: row.id,
          username: row.username,
          avatar_url: row.avatar_url,
          achievement_count: parseInt(row.achievement_count)
        }))
      });
    }

    // 处理主 leaderboard 请求
    if (type === 'posts') {
      // 获取作品排行榜 - 使用 works 表
      const worksTimeCondition = timeCondition.replace(/created_at/g, 'w.created_at');
      // works 表使用 likes 而不是 likes_count
      const worksSortBy = sortBy === 'likes_count' ? 'likes' : sortBy;
      const result = await queryWithRetry(`
        SELECT 
          w.id,
          w.title,
          w.description as content,
          w.thumbnail,
          w.creator_id as user_id,
          u.username,
          u.avatar_url,
          w.views,
          w.likes as likes_count,
          w.comments as comments_count,
          w.created_at
        FROM works w
        LEFT JOIN users u ON w.creator_id = u.id::text
        WHERE w.hidden_in_square = FALSE ${worksTimeCondition}
        ORDER BY w.${worksSortBy} DESC NULLS LAST
        LIMIT $1
      `, [limit]);

      return res.status(200).json({
        code: 0,
        data: {
          posts: result.rows.map(row => ({
            id: row.id,
            title: row.title,
            content: row.content,
            thumbnail: row.thumbnail,
            user_id: row.user_id,
            username: row.username,
            avatar_url: row.avatar_url,
            views: parseInt(row.views || 0),
            likes_count: parseInt(row.likes_count || 0),
            comments_count: parseInt(row.comments_count || 0),
            created_at: row.created_at
          }))
        }
      });
    } else if (type === 'points') {
      // 获取积分排行榜
      const result = await queryWithRetry(`
        SELECT 
          up.user_id,
          u.username,
          u.avatar_url,
          up.balance,
          up.total_earned,
          RANK() OVER (ORDER BY up.balance DESC) as rank
        FROM user_points up
        LEFT JOIN users u ON up.user_id = u.id::text
        ORDER BY up.balance DESC
        LIMIT $1
      `, [limit]);

      return res.status(200).json({
        code: 0,
        data: {
          pointsUsers: result.rows.map(row => ({
            user_id: row.user_id,
            username: row.username || '未知用户',
            avatar_url: row.avatar_url,
            balance: parseInt(row.balance || 0),
            total_earned: parseInt(row.total_earned || 0),
            rank: parseInt(row.rank)
          }))
        }
      });
    } else {
      // 获取用户排行榜 (默认)
      let orderBy = 'u.likes_count';
      if (sortBy === 'posts_count') {
        orderBy = 'posts_count';
      } else if (sortBy === 'views') {
        orderBy = 'u.views';
      }

      const result = await queryWithRetry(`
        SELECT 
          u.id,
          u.username,
          u.avatar_url,
          u.email,
          u.likes_count,
          u.views,
          u.created_at,
          COUNT(p.id) as posts_count
        FROM users u
        LEFT JOIN posts p ON u.id::text = p.user_id ${timeCondition.replace(/created_at/g, 'p.created_at')}
        GROUP BY u.id, u.username, u.avatar_url, u.email, u.likes_count, u.views, u.created_at
        ORDER BY ${orderBy} DESC NULLS LAST
        LIMIT $1
      `, [limit]);

      return res.status(200).json({
        code: 0,
        data: {
          users: result.rows.map(row => ({
            id: row.id,
            username: row.username,
            avatar_url: row.avatar_url,
            email: row.email,
            likes_count: parseInt(row.likes_count || 0),
            views: parseInt(row.views || 0),
            posts_count: parseInt(row.posts_count || 0),
            created_at: row.created_at
          }))
        }
      });
    }
  } catch (error) {
    console.error('[Leaderboard API] Error:', error);
    return res.status(500).json({
      code: 1,
      message: '获取排行榜数据失败: ' + error.message
    });
  }
}

// 处理推荐相关请求
async function handleRecommendations(req, res, path) {
  try {
    return res.status(200).json({ code: 0, data: [] });
  } catch (error) {
    console.error('[Recommendations API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error' });
  }
}

// 处理搜索相关请求
async function handleSearch(req, res, path) {
  try {
    return res.status(200).json({ code: 0, data: [] });
  } catch (error) {
    console.error('[Search API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error' });
  }
}

// 处理分类相关请求
async function handleCategories(req, res, path) {
  try {
    return res.status(200).json({
      code: 0,
      data: [
        { id: 1, name: '创意设计', slug: 'creative' },
        { id: 2, name: '非遗传承', slug: 'heritage' },
        { id: 3, name: '品牌联名', slug: 'brand' },
        { id: 4, name: '校园活动', slug: 'campus' },
        { id: 5, name: '文旅推广', slug: 'tourism' },
        { id: 6, name: '纹样设计', slug: 'pattern' },
        { id: 7, name: '插画创作', slug: 'illustration' },
        { id: 8, name: '工艺创新', slug: 'craft' },
        { id: 9, name: '老字号品牌', slug: 'time-honored' },
        { id: 10, name: 'IP设计', slug: 'ip-design' },
        { id: 11, name: '包装设计', slug: 'packaging' },
        { id: 12, name: '其他', slug: 'other' }
      ]
    });
  } catch (error) {
    console.error('[Categories API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error' });
  }
}

// 处理标签相关请求
async function handleTags(req, res, path) {
  try {
    return res.status(200).json({ code: 0, data: [] });
  } catch (error) {
    console.error('[Tags API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error' });
  }
}

// 处理健康检查请求
async function handleHealth(req, res, path) {
  try {
    // 数据库健康检查 /health/db
    if (path === '/health/db' || path === '/health/neon') {
      const pool = await getDbPool();
      if (!pool) {
        return res.status(503).json({
          code: 1,
          status: 'error',
          message: 'Database not configured'
        });
      }

      try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as time');
        client.release();

        return res.status(200).json({
          code: 0,
          status: 'ok',
          message: 'Database connected',
          time: result.rows[0].time
        });
      } catch (error) {
        return res.status(503).json({
          code: 1,
          status: 'error',
          message: 'Database connection failed',
          error: error.message
        });
      }
    }

    // 诊断检查 /health/diagnostics
    if (path === '/health/diagnostics') {
      const checks = {
        database: false,
        timestamp: new Date().toISOString()
      };

      const pool = await getDbPool();
      if (pool) {
        try {
          const client = await pool.connect();
          await client.query('SELECT 1');
          client.release();
          checks.database = true;
        } catch (error) {
          console.error('[Health] Database check failed:', error.message);
        }
      }

      return res.status(200).json({
        code: 0,
        status: checks.database ? 'healthy' : 'degraded',
        checks
      });
    }

    return res.status(200).json({
      code: 0,
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Health API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error' });
  }
}

// 处理通知相关请求
async function handleNotifications(req, res, path) {
  const decoded = verifyAuthToken(req);
  if (!decoded) {
    return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
  }

  try {
    const pool = await getDbPool();

    if (req.method === 'GET') {
      if (!pool) {
        return res.status(200).json({ code: 0, data: [], unreadCount: 0 });
      }

      await queryWithRetry(`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255),
          content TEXT,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const userId = decoded.id || decoded.userId || decoded.sub;
      const result = await queryWithRetry(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
        [userId]
      );

      const unreadResult = await queryWithRetry(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
        [userId]
      );

      return res.status(200).json({
        code: 0,
        data: result.rows,
        unreadCount: parseInt(unreadResult.rows[0]?.count || 0)
      });
    }

    // 标记已读
    if (path === '/notifications/read' && req.method === 'POST') {
      const body = await parseRequestBody(req);
      const { ids } = body;

      if (!pool) {
        return res.status(200).json({ code: 0, message: 'Success' });
      }

      const userId = decoded.id || decoded.userId || decoded.sub;

      if (ids && ids.length > 0) {
        await queryWithRetry(
          'UPDATE notifications SET is_read = TRUE WHERE id = ANY($1) AND user_id = $2',
          [ids, userId]
        );
      } else {
        await queryWithRetry(
          'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
          [userId]
        );
      }

      return res.status(200).json({ code: 0, message: 'Success' });
    }

    return res.status(501).json({ code: 1, message: 'Notifications endpoint not implemented' });
  } catch (error) {
    console.error('[Notifications API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error' });
  }
}

// 处理管理后台请求
async function handleAdmin(req, res, path) {
  const decoded = verifyAuthToken(req);
  if (!decoded) {
    return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
  }

  try {
    const pool = await getDbPool();

    // 管理后台仪表盘统计数据
    if (path === '/admin/dashboard/stats' && req.method === 'GET') {
      if (!pool) {
        return res.status(200).json({
          code: 0,
          data: {
            totalUsers: 0,
            totalWorks: 0,
            pendingAudit: 0,
            adopted: 0,
            userTrend: 0,
            worksTrend: 0,
            pendingTrend: 0,
            adoptedTrend: 0
          }
        });
      }

      // 获取总用户数
      const { rows: [userCount] } = await queryWithRetry(
        'SELECT COUNT(*) as count FROM users'
      );

      // 获取总作品数
      const { rows: [worksCount] } = await queryWithRetry(
        'SELECT COUNT(*) as count FROM works'
      );

      // 获取待审核作品数
      const { rows: [pendingCount] } = await queryWithRetry(
        "SELECT COUNT(*) as count FROM works WHERE status = 'pending'"
      );

      // 获取已发布作品数（采纳数）
      const { rows: [adoptedCount] } = await queryWithRetry(
        "SELECT COUNT(*) as count FROM works WHERE status = 'published'"
      );

      // 获取本月新增用户数
      const { rows: [newUsersThisMonth] } = await queryWithRetry(
        "SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_TRUNC('month', NOW())"
      );

      // 获取上月用户数（用于计算增长率）
      const { rows: [usersLastMonth] } = await queryWithRetry(
        `SELECT COUNT(*) as count FROM users 
         WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
         AND created_at < DATE_TRUNC('month', NOW())`
      );

      // 计算用户增长率
      const userTrend = usersLastMonth.count > 0
        ? Math.round(((newUsersThisMonth.count - usersLastMonth.count) / usersLastMonth.count) * 100)
        : (newUsersThisMonth.count > 0 ? 100 : 0);

      return res.status(200).json({
        code: 0,
        data: {
          totalUsers: parseInt(userCount.count) || 0,
          totalWorks: parseInt(worksCount.count) || 0,
          pendingAudit: parseInt(pendingCount.count) || 0,
          adopted: parseInt(adoptedCount.count) || 0,
          userTrend,
          worksTrend: 0,
          pendingTrend: 0,
          adoptedTrend: 0
        }
      });
    }

    // 获取用户列表
    if (path === '/admin/users' && req.method === 'GET') {
      if (!pool) {
        return res.status(200).json({ code: 0, data: { users: [], total: 0 } });
      }

      const url = new URL(req.url, `http://localhost`);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const search = url.searchParams.get('search') || '';
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM users';
      let countQuery = 'SELECT COUNT(*) as count FROM users';
      const params = [];

      if (search) {
        query += ' WHERE username ILIKE $1 OR email ILIKE $1';
        countQuery += ' WHERE username ILIKE $1 OR email ILIKE $1';
        params.push(`%${search}%`);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

      const { rows: users } = await queryWithRetry(query, [...params, limit, offset]);
      const { rows: [countResult] } = await queryWithRetry(countQuery, params);

      return res.status(200).json({
        code: 0,
        data: {
          users: users.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            avatar_url: u.avatar_url,
            created_at: u.created_at,
            status: u.status || 'active'
          })),
          total: parseInt(countResult.count) || 0
        }
      });
    }

    // 获取作品列表
    if (path === '/admin/works' && req.method === 'GET') {
      if (!pool) {
        return res.status(200).json({ code: 0, data: { works: [], total: 0 } });
      }

      const url = new URL(req.url, `http://localhost`);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const status = url.searchParams.get('status') || 'all';
      const offset = (page - 1) * limit;

      let query = `
        SELECT w.*, u.username as author_name, u.avatar_url as author_avatar
        FROM works w
        LEFT JOIN users u ON w.creator_id = u.id::text
      `;
      let countQuery = 'SELECT COUNT(*) as count FROM works';
      const params = [];
      const conditions = [];

      if (status !== 'all') {
        conditions.push(`w.status = $${params.length + 1}`);
        params.push(status);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
        countQuery += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY w.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

      const { rows: works } = await queryWithRetry(query, [...params, limit, offset]);
      const { rows: [countResult] } = await queryWithRetry(countQuery, params);

      return res.status(200).json({
        code: 0,
        data: {
          works: works.map(w => ({
            id: w.id,
            title: w.title,
            thumbnail: w.thumbnail,
            status: w.status || 'pending',
            created_at: w.created_at,
            author: w.author_name || '未知用户',
            author_avatar: w.author_avatar
          })),
          total: parseInt(countResult.count) || 0
        }
      });
    }

    // 审核作品
    if (path.match(/\/admin\/works\/[^/]+\/audit/) && req.method === 'PUT') {
      const match = path.match(/\/admin\/works\/([^/]+)\/audit/);
      const workId = match ? match[1] : null;

      if (!workId) {
        return res.status(400).json({ code: 1, message: '作品ID不能为空' });
      }

      const body = await parseRequestBody(req);
      const { action, reason } = body;

      if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ code: 1, message: '操作必须是 approve 或 reject' });
      }

      if (!pool) {
        return res.status(503).json({ code: 1, message: '数据库服务不可用' });
      }

      const newStatus = action === 'approve' ? 'published' : 'rejected';

      await queryWithRetry(
        `UPDATE works SET status = $1, audit_reason = $2, updated_at = NOW() WHERE id = $3`,
        [newStatus, reason || null, workId]
      );

      return res.status(200).json({ code: 0, message: '审核成功' });
    }

    // 获取活动列表
    if (path === '/admin/events' && req.method === 'GET') {
      const pool = await getDbPool();
      
      if (!pool) {
        console.log('[Admin API] Database not available for events list');
        return res.status(200).json({ code: 0, data: { events: [], total: 0 } });
      }

      try {
        const url = new URL(req.url, `http://localhost`);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const { rows: events } = await queryWithRetry(
          `SELECT e.*, u.username as organizer_name, u.avatar_url as organizer_avatar 
           FROM events e 
           LEFT JOIN users u ON e.organizer_id = u.id::text 
           ORDER BY e.created_at DESC LIMIT $1 OFFSET $2`,
          [limit, offset]
        );

        const { rows: [countResult] } = await queryWithRetry(
          'SELECT COUNT(*) as count FROM events'
        );

        return res.status(200).json({
          code: 0,
          data: {
            events: events || [],
            total: parseInt(countResult.count) || 0
          }
        });
      } catch (error) {
        console.error('[Admin API] Error fetching events:', error.message);
        return res.status(200).json({ code: 0, data: { events: [], total: 0 } });
      }
    }

    // 创建活动
    if (path === '/admin/events' && req.method === 'POST') {
      const body = await parseRequestBody(req);

      if (!pool) {
        return res.status(503).json({ code: 1, message: '数据库服务不可用' });
      }

      const { title, description, start_date, end_date, status = 'draft' } = body;

      const { rows: [event] } = await queryWithRetry(
        `INSERT INTO events (title, description, start_date, end_date, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [title, description, start_date, end_date, status]
      );

      return res.status(200).json({ code: 0, data: event });
    }

    // 更新活动
    if (path.match(/\/admin\/events\/[^/]+/) && req.method === 'PUT') {
      const match = path.match(/\/admin\/events\/([^/]+)/);
      const eventId = match ? match[1] : null;

      if (!eventId) {
        return res.status(400).json({ code: 1, message: '活动ID不能为空' });
      }

      const body = await parseRequestBody(req);

      if (!pool) {
        return res.status(503).json({ code: 1, message: '数据库服务不可用' });
      }

      const { title, description, start_date, end_date, status } = body;

      await queryWithRetry(
        `UPDATE events SET title = $1, description = $2, start_date = $3, end_date = $4, status = $5, updated_at = NOW() WHERE id = $6`,
        [title, description, start_date, end_date, status, eventId]
      );

      return res.status(200).json({ code: 0, message: '更新成功' });
    }

    // 删除活动
    if (path.match(/\/admin\/events\/[^/]+/) && req.method === 'DELETE') {
      const match = path.match(/\/admin\/events\/([^/]+)/);
      const eventId = match ? match[1] : null;

      if (!eventId) {
        return res.status(400).json({ code: 1, message: '活动ID不能为空' });
      }

      if (!pool) {
        return res.status(503).json({ code: 1, message: '数据库服务不可用' });
      }

      await queryWithRetry('DELETE FROM events WHERE id = $1', [eventId]);

      return res.status(200).json({ code: 0, message: '删除成功' });
    }

    // 获取分析数据
    if (path === '/admin/analytics' && req.method === 'GET') {
      if (!pool) {
        return res.status(200).json({
          code: 0,
          data: {
            totalUsers: 0,
            totalWorks: 0,
            totalViews: 0,
            totalLikes: 0,
            userGrowth: 0,
            worksGrowth: 0,
            viewsGrowth: 0,
            likesGrowth: 0
          }
        });
      }

      const url = new URL(req.url, `http://localhost`);
      const timeRange = url.searchParams.get('timeRange') || '30d';

      // 获取总用户数
      const { rows: [userCount] } = await queryWithRetry('SELECT COUNT(*) as count FROM users');

      // 获取总作品数
      const { rows: [worksCount] } = await queryWithRetry('SELECT COUNT(*) as count FROM works');

      // 获取总浏览量
      const { rows: [viewsResult] } = await queryWithRetry('SELECT COALESCE(SUM(view_count), 0) as total FROM works');

      // 获取总点赞数
      const { rows: [likesResult] } = await queryWithRetry('SELECT COALESCE(SUM(likes), 0) as total FROM works');

      return res.status(200).json({
        code: 0,
        data: {
          totalUsers: parseInt(userCount.count) || 0,
          totalWorks: parseInt(worksCount.count) || 0,
          totalViews: parseInt(viewsResult.total) || 0,
          totalLikes: parseInt(likesResult.total) || 0,
          userGrowth: 0,
          worksGrowth: 0,
          viewsGrowth: 0,
          likesGrowth: 0
        }
      });
    }

    // 获取趋势数据
    if (path === '/admin/trends' && req.method === 'GET') {
      if (!pool) {
        return res.status(200).json({ code: 0, data: [] });
      }

      const url = new URL(req.url, `http://localhost`);
      const metric = url.searchParams.get('metric') || 'users';
      const timeRange = url.searchParams.get('timeRange') || '30d';
      
      let days = 30;
      switch (timeRange) {
        case '7d': days = 7; break;
        case '30d': days = 30; break;
        case '90d': days = 90; break;
        case '1y': days = 365; break;
      }

      // 生成最近 N 天的日期和模拟数据
      const data = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
        
        // 查询当天的数据
        let value = 0;
        try {
          if (metric === 'users') {
            const { rows } = await queryWithRetry(
              `SELECT COUNT(*) as count FROM users 
               WHERE DATE(created_at) = DATE($1)`,
              [date.toISOString()]
            );
            value = parseInt(rows[0]?.count || 0);
          } else if (metric === 'works') {
            const { rows } = await queryWithRetry(
              `SELECT COUNT(*) as count FROM works 
               WHERE DATE(created_at) = DATE($1)`,
              [date.toISOString()]
            );
            value = parseInt(rows[0]?.count || 0);
          }
        } catch (e) {
          // 忽略错误
        }
        
        data.push({ date: dateStr, value });
      }

      return res.status(200).json({ code: 0, data });
    }

    // 获取审核统计
    if (path === '/admin/audit-stats' && req.method === 'GET') {
      if (!pool) {
        return res.status(200).json({ 
          code: 0, 
          data: [
            { name: '待审核', value: 0 },
            { name: '已通过', value: 0 },
            { name: '已拒绝', value: 0 }
          ]
        });
      }

      const { rows: [pending] } = await queryWithRetry(
        "SELECT COUNT(*) as count FROM works WHERE status = 'pending'"
      );
      const { rows: [approved] } = await queryWithRetry(
        "SELECT COUNT(*) as count FROM works WHERE status = 'published'"
      );
      const { rows: [rejected] } = await queryWithRetry(
        "SELECT COUNT(*) as count FROM works WHERE status = 'rejected'"
      );

      return res.status(200).json({
        code: 0,
        data: [
          { name: '待审核', value: parseInt(pending.count) || 0 },
          { name: '已通过', value: parseInt(approved.count) || 0 },
          { name: '已拒绝', value: parseInt(rejected.count) || 0 }
        ]
      });
    }

    // 获取待审核作品
    if (path === '/admin/pending-works' && req.method === 'GET') {
      if (!pool) {
        return res.status(200).json({ code: 0, data: [] });
      }

      const { rows: works } = await queryWithRetry(`
        SELECT w.id, w.title, w.thumbnail, w.creator_id, w.created_at, w.status,
               u.username as creator_name
        FROM works w
        LEFT JOIN users u ON w.creator_id = u.id::text
        WHERE w.status = 'pending'
        ORDER BY w.created_at DESC
        LIMIT 10
      `);

      return res.status(200).json({
        code: 0,
        data: works.map(w => ({
          id: w.id,
          title: w.title,
          creator: w.creator_name || '未知用户',
          creatorId: w.creator_id,
          thumbnail: w.thumbnail,
          submitTime: w.created_at,
          status: w.status
        }))
      });
    }

    // 获取热门内容
    if (path === '/admin/top-content' && req.method === 'GET') {
      if (!pool) {
        return res.status(200).json({ code: 0, data: [] });
      }

      const { rows: works } = await queryWithRetry(`
        SELECT w.id, w.title, w.view_count, w.likes, w.creator_id,
               u.username as author_name
        FROM works w
        LEFT JOIN users u ON w.creator_id = u.id::text
        ORDER BY w.view_count DESC
        LIMIT 5
      `);

      return res.status(200).json({
        code: 0,
        data: works.map(w => ({
          id: w.id,
          title: w.title,
          views: parseInt(w.view_count) || 0,
          likes: parseInt(w.likes) || 0,
          author: w.author_name || '未知用户'
        }))
      });
    }

    // 获取用户活跃度数据
    if (path === '/admin/user-activity' && req.method === 'GET') {
      if (!pool) {
        return res.status(200).json({ code: 0, data: [] });
      }

      const url = new URL(req.url, `http://localhost`);
      const period = url.searchParams.get('period') || 'week';
      
      let days = 7;
      let labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      
      if (period === 'month') {
        days = 30;
        labels = Array.from({ length: 30 }, (_, i) => `${i + 1}日`);
      } else if (period === 'year') {
        days = 12;
        labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      }

      const data = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        let newUsers = 0;
        let activeUsers = 0;
        let worksCount = 0;
        
        try {
          const { rows: [usersResult] } = await queryWithRetry(
            `SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = DATE($1)`,
            [date.toISOString()]
          );
          newUsers = parseInt(usersResult?.count || 0);
          
          const { rows: [worksResult] } = await queryWithRetry(
            `SELECT COUNT(*) as count FROM works WHERE DATE(created_at) = DATE($1)`,
            [date.toISOString()]
          );
          worksCount = parseInt(worksResult?.count || 0);
        } catch (e) {
          // 忽略错误
        }
        
        data.push({
          name: labels[days - 1 - i] || `${date.getMonth() + 1}/${date.getDate()}`,
          新增用户: newUsers,
          活跃用户: activeUsers || Math.round(newUsers * 1.5),
          创作数量: worksCount
        });
      }

      return res.status(200).json({ code: 0, data });
    }

    // 获取设备分布数据
    if (path === '/admin/analytics/devices' && req.method === 'GET') {
      return res.status(200).json({
        code: 0,
        data: [
          { name: '移动端', value: 60 },
          { name: '桌面端', value: 40 }
        ]
      });
    }

    // 获取流量来源数据
    if (path === '/admin/analytics/sources' && req.method === 'GET') {
      return res.status(200).json({
        code: 0,
        data: [
          { name: '直接访问', value: 40 },
          { name: '搜索引擎', value: 30 },
          { name: '社交媒体', value: 20 },
          { name: '外部链接', value: 10 }
        ]
      });
    }

    // 获取趋势数据（views/likes）
    if (path === '/admin/trends' && req.method === 'GET') {
      const url = new URL(req.url, `http://localhost`);
      const metric = url.searchParams.get('metric') || 'views';
      const timeRange = url.searchParams.get('timeRange') || '30d';
      
      let days = 30;
      if (timeRange === '7d') days = 7;
      else if (timeRange === '90d') days = 90;
      else if (timeRange === '1y') days = 365;

      const data = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.push({
          date: `${date.getMonth() + 1}月${date.getDate()}日`,
          value: Math.floor(Math.random() * 1000)
        });
      }

      return res.status(200).json({ code: 0, data });
    }

    // 获取实时统计
    if (path === '/admin/analytics/realtime-stats' && req.method === 'GET') {
      return res.status(200).json({
        code: 0,
        data: {
          onlineUsers: Math.floor(Math.random() * 100),
          activeSessions: Math.floor(Math.random() * 50),
          pageViewsPerMinute: Math.floor(Math.random() * 200),
          topPages: [
            { path: '/', views: 100 },
            { path: '/explore', views: 80 },
            { path: '/admin', views: 20 }
          ]
        }
      });
    }

    // 获取转化漏斗数据
    if (path === '/admin/analytics/conversion-funnel' && req.method === 'GET') {
      return res.status(200).json({
        code: 0,
        data: [
          { stage: '访问', count: 1000 },
          { stage: '注册', count: 300 },
          { stage: '创作', count: 100 },
          { stage: '发布', count: 50 }
        ]
      });
    }

    // 获取留存数据
    if (path === '/admin/analytics/retention' && req.method === 'GET') {
      return res.status(200).json({
        code: 0,
        data: [
          { day: '第1天', rate: 100 },
          { day: '第7天', rate: 60 },
          { day: '第30天', rate: 40 }
        ]
      });
    }

    // 获取收入数据
    if (path === '/admin/analytics/revenue' && req.method === 'GET') {
      return res.status(200).json({
        code: 0,
        data: {
          totalRevenue: 0,
          dailyRevenue: Array.from({ length: 30 }, () => 0),
          revenueBySource: [
            { source: '广告', amount: 0 },
            { source: '会员', amount: 0 }
          ]
        }
      });
    }

    // 获取热门话题
    if (path === '/admin/analytics/hot-topics' && req.method === 'GET') {
      return res.status(200).json({
        code: 0,
        data: [
          { topic: 'AI绘画', count: 100 },
          { topic: '数字艺术', count: 80 },
          { topic: '创意设计', count: 60 }
        ]
      });
    }

    // 获取人口统计数据
    if (path === '/admin/analytics/demographics' && req.method === 'GET') {
      return res.status(200).json({
        code: 0,
        data: {
          ageGroups: [
            { range: '18-24', percentage: 30 },
            { range: '25-34', percentage: 40 },
            { range: '35-44', percentage: 20 },
            { range: '45+', percentage: 10 }
          ],
          gender: [
            { type: '男', percentage: 55 },
            { type: '女', percentage: 45 }
          ]
        }
      });
    }

    // 清理过期作品
    if (path === '/admin/cleanup-expired-works' && req.method === 'POST') {
      return res.status(200).json({ code: 0, message: '清理完成', deletedCount: 0 });
    }

    // 更新用户状态
    if (path.match(/\/admin\/users\/[^/]+\/status/) && req.method === 'PUT') {
      const match = path.match(/\/admin\/users\/([^/]+)\/status/);
      const userId = match ? match[1] : null;
      
      if (!userId) {
        return res.status(400).json({ code: 1, message: '用户ID不能为空' });
      }

      const body = await parseRequestBody(req);
      const { status } = body;

      if (!pool) {
        return res.status(503).json({ code: 1, message: '数据库服务不可用' });
      }

      await queryWithRetry(
        'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, userId]
      );

      return res.status(200).json({ code: 0, message: '用户状态更新成功' });
    }

    // 预警记录 API
    if (path.startsWith('/admin/alerts')) {
      if (path === '/admin/alerts/records' && req.method === 'GET') {
        return res.status(200).json({
          code: 0,
          data: {
            records: [],
            total: 0
          }
        });
      }
      
      if (path === '/admin/alerts/stats' && req.method === 'GET') {
        return res.status(200).json({
          code: 0,
          data: {
            total: 0,
            unhandled: 0,
            today: 0
          }
        });
      }
      
      if (path === '/admin/alerts/rules' && req.method === 'GET') {
        return res.status(200).json({
          code: 0,
          data: []
        });
      }
    }

    // 成就管理 API
    if (path === '/admin/achievements' && req.method === 'GET') {
      return res.status(200).json({
        code: 0,
        data: []
      });
    }

    // 认证管理 API
    if (path.startsWith('/admin/certification')) {
      if (path === '/admin/certification/applications' && req.method === 'GET') {
        return res.status(200).json({
          code: 0,
          data: {
            applications: [],
            total: 0
          }
        });
      }
      
      if (path === '/admin/certification/stats' && req.method === 'GET') {
        return res.status(200).json({
          code: 0,
          data: {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0
          }
        });
      }
      
      if (path === '/admin/certification/pending-count' && req.method === 'GET') {
        return res.status(200).json({
          code: 0,
          data: { count: 0 }
        });
      }
    }

    // 商家申请 API
    if (path.startsWith('/admin/merchant-applications')) {
      if (path === '/admin/merchant-applications' && req.method === 'GET') {
        return res.status(200).json({
          code: 0,
          data: {
            applications: [],
            total: 0
          }
        });
      }
      
      if (path === '/admin/merchant-applications/stats' && req.method === 'GET') {
        return res.status(200).json({
          code: 0,
          data: {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0
          }
        });
      }
    }

    return res.status(501).json({ code: 1, message: 'Admin endpoint not implemented: ' + path });
  } catch (error) {
    console.error('[Admin API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error', error: error.message });
  }
}

// 处理用户相关请求
async function handleUsers(req, res, path) {
  try {
    const pool = await getDbPool();

    // 获取推荐用户 /users/recommended
    if (path === '/users/recommended' && req.method === 'GET') {
      const url = new URL(req.url, `http://localhost`);
      const limit = parseInt(url.searchParams.get('limit') || '5');

      if (!pool) {
        return res.status(200).json({ code: 0, data: [] });
      }

      const result = await queryWithRetry(
        'SELECT id, username, avatar_url FROM users ORDER BY created_at DESC LIMIT $1',
        [limit]
      );

      return res.status(200).json({
        code: 0,
        data: result.rows.map(user => ({
          id: user.id,
          username: user.username,
          avatar: user.avatar_url
        }))
      });
    }

    // 获取指定用户信息 /users/:id
    const userIdMatch = path.match(/^\/users\/([^\/]+)$/);
    if (userIdMatch && req.method === 'GET') {
      const targetUserId = userIdMatch[1];

      if (!pool) {
        return res.status(200).json({
          code: 0,
          data: {
            id: targetUserId,
            username: '用户' + targetUserId.substring(0, 8),
            avatar: ''
          }
        });
      }

      const result = await queryWithRetry(
        'SELECT id, email, username, avatar_url, created_at FROM users WHERE id = $1',
        [targetUserId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ code: 1, message: '用户不存在' });
      }

      const user = result.rows[0];
      return res.status(200).json({
        code: 0,
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar_url,
          createdAt: user.created_at
        }
      });
    }

    return res.status(501).json({ code: 1, message: 'Users endpoint not implemented: ' + path });
  } catch (error) {
    console.error('[Users API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error', error: error.message });
  }
}

// 处理用户社区请求
async function handleUserCommunities(req, res) {
  const decoded = verifyAuthToken(req);
  if (!decoded) {
    return res.status(401).json({ code: 1, error: 'UNAUTHORIZED', message: '未授权访问' });
  }

  try {
    const pool = await getDbPool();
    if (!pool) {
      return res.status(200).json({ code: 0, data: [] });
    }

    const userId = decoded.userId || decoded.id || decoded.sub;

    // 确保表存在
    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS communities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        avatar_url TEXT,
        cover_url TEXT,
        member_count INTEGER DEFAULT 0,
        is_official BOOLEAN DEFAULT false,
        tags TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS community_members (
        id SERIAL PRIMARY KEY,
        community_id INTEGER NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(community_id, user_id)
      )
    `);

    const result = await queryWithRetry(`
      SELECT c.*, cm.role, cm.joined_at
      FROM communities c
      INNER JOIN community_members cm ON c.id = cm.community_id
      WHERE cm.user_id = $1
      ORDER BY cm.joined_at DESC
    `, [userId]);

    return res.status(200).json({
      code: 0,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        avatar: row.avatar_url,
        cover: row.cover_url,
        members: row.member_count,
        official: row.is_official,
        tags: row.tags || [],
        role: row.role,
        joinedAt: row.joined_at
      }))
    });
  } catch (error) {
    console.error('[API] Get user communities error:', error);
    return res.status(200).json({ code: 0, data: [] });
  }
}

// 处理Feeds请求
async function handleFeeds(req, res, path) {
  try {
    const pool = await getDbPool();

    if (path === '/feeds' && req.method === 'GET') {
      if (!pool) {
        return res.status(200).json({ code: 0, data: [] });
      }

      // 获取作品作为动态内容
      const result = await queryWithRetry(`
        SELECT w.*, u.username, u.avatar_url
        FROM works w
        LEFT JOIN users u ON w.user_id = u.id::text
        WHERE w.status = 'published'
        ORDER BY w.created_at DESC
        LIMIT 50
      `);

      const feeds = result.rows.map(work => ({
        id: work.id,
        type: 'work',
        title: work.title,
        content: work.description,
        thumbnail: work.thumbnail,
        author: {
          id: work.user_id,
          username: work.username || '用户' + work.user_id.substring(0, 8),
          avatar: work.avatar_url
        },
        likes: work.likes || 0,
        views: work.views || 0,
        createdAt: work.created_at
      }));

      return res.status(200).json({ code: 0, data: feeds });
    }

    return res.status(501).json({ code: 1, message: 'Feeds endpoint not implemented: ' + path });
  } catch (error) {
    console.error('[Feeds API] Error:', error);
    return res.status(500).json({ code: 1, message: 'Internal server error', error: error.message });
  }
}
