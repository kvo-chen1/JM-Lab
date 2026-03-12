// Vercel API 入口
// 处理所有 /api/* 请求

// 内存中存储验证码（作为数据库的备选）
const verificationCodes = new Map();

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
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      min: 2,
      idleTimeoutMillis: 120000,
      connectionTimeoutMillis: 60000,
      statement_timeout: 60000,
      query_timeout: 60000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
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
  try {
    const pool = await getDbPool();
    if (!pool) return false;

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
    return true;
  } catch (error) {
    console.error('[DB] Users table creation error:', error.message);
    return false;
  }
}

// 确保验证码表存在
async function ensureVerificationTable() {
  try {
    const pool = await getDbPool();
    if (!pool) return false;

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
    return true;
  } catch (error) {
    console.error('[DB] Table creation error:', error.message);
    return false;
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
  try {
    const pool = await getDbPool();
    if (!pool) return user;

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
    return user;
  }
}

// 保存验证码（优先数据库，失败则使用内存）
async function saveVerificationCode(email, code, expiresAt) {
  verificationCodes.set(email, { code, expiresAt, attempts: 0 });
  console.log('[Memory] Code saved for', email);

  try {
    const pool = await getDbPool();
    if (!pool) return;

    await ensureVerificationTable();
    await queryWithRetry('DELETE FROM verification_codes WHERE email = $1', [email]);
    await queryWithRetry(
      'INSERT INTO verification_codes (email, code, expires_at, attempts) VALUES ($1, $2, $3, $4)',
      [email, code, new Date(expiresAt), 0]
    );
    console.log('[DB] Code saved for', email);
  } catch (error) {
    console.error('[DB] Save code error:', error.message);
  }
}

// 获取验证码
async function getVerificationCode(email) {
  const memoryData = verificationCodes.get(email);
  if (memoryData) {
    return { code: memoryData.code, expires_at: new Date(memoryData.expiresAt), attempts: memoryData.attempts };
  }

  try {
    const pool = await getDbPool();
    if (!pool) return null;

    await ensureVerificationTable();
    const result = await queryWithRetry('SELECT * FROM verification_codes WHERE email = $1', [email]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('[DB] Get code error:', error.message);
    return null;
  }
}

// 更新尝试次数
async function incrementAttempts(email) {
  const memoryData = verificationCodes.get(email);
  if (memoryData) memoryData.attempts++;

  try {
    const pool = await getDbPool();
    if (pool) await queryWithRetry('UPDATE verification_codes SET attempts = attempts + 1 WHERE email = $1', [email]);
  } catch (error) {
    console.error('[DB] Increment attempts error:', error.message);
  }
}

// 删除验证码
async function deleteVerificationCode(email) {
  verificationCodes.delete(email);
  try {
    const pool = await getDbPool();
    if (pool) await queryWithRetry('DELETE FROM verification_codes WHERE email = $1', [email]);
  } catch (error) {
    console.error('[DB] Delete code error:', error.message);
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

// 生成 JWT Token
function generateToken(user) {
  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const payload = JSON.stringify({
    ...user,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
  });

  const base64 = (str) => btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signature = base64(process.env.JWT_SECRET || 'default-secret');

  return `${base64(header)}.${base64(payload)}.${signature}`;
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

      const storedData = await getVerificationCode(email);
      if (!storedData) return res.status(400).json({ code: 1, message: '验证码已过期' });
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

      let user = await getUserByEmail(email);

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

      await saveUser(user);
      const token = generateToken(user);

      return res.status(200).json({ code: 0, message: '登录成功', data: { token, user } });
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

    const result = await queryWithRetry(
      'SELECT * FROM works WHERE status = $1 ORDER BY created_at DESC LIMIT 50',
      ['published']
    );

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

    return res.status(200).json({ code: 0, data: { isFollowing: false } });
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

    if (path === '/communities/featured' && req.method === 'GET') {
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

      const result = await queryWithRetry('SELECT * FROM communities ORDER BY member_count DESC LIMIT 6');

      if (result.rows.length === 0) {
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

      const communities = result.rows.map(row => ({
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
        ssl: { rejectUnauthorized: false },
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
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
