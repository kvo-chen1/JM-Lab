// Vercel API 入口
// 处理所有 /api/* 请求

// 内存中存储验证码（作为数据库的备选）
const verificationCodes = new Map();

// 数据库连接
let pgClient = null;
let dbAvailable = false;

// 获取数据库连接
async function getDbClient() {
  if (pgClient) return pgClient;

  // 尝试多种环境变量名，支持 Netlify 和 Vercel 的格式
  let databaseUrl = process.env.DATABASE_URL ||
                    process.env.NETLIFY_DATABASE_URL ||
                    process.env.NEON_POSTGRES_DATABASE_URL;

  if (!databaseUrl) {
    console.log('[DB] Database URL not configured');
    return null;
  }

  // 处理 Netlify 的 psql 格式: psql 'postgresql://...'
  if (databaseUrl.startsWith("psql '")) {
    databaseUrl = databaseUrl.replace(/^psql '/, '').replace(/'$/, '');
  }

  console.log('[DB] Connecting to database...');

  try {
    const { Client } = await import('pg');
    pgClient = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    await pgClient.connect();
    console.log('[DB] Connected to Neon database');
    dbAvailable = true;
    return pgClient;
  } catch (error) {
    console.error('[DB] Connection error:', error.message);
    dbAvailable = false;
    pgClient = null;
    return null;
  }
}

// 确保用户表存在
async function ensureUsersTable() {
  try {
    const client = await getDbClient();
    if (!client) return false;

    await client.query(`
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
    const client = await getDbClient();
    if (!client) return false;

    await client.query(`
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

// 保存或更新用户
async function saveUser(user) {
  try {
    const client = await getDbClient();
    if (!client) return user;

    await ensureUsersTable();

    await client.query(`
      INSERT INTO users (id, email, username, avatar_url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (email)
      DO UPDATE SET
        username = EXCLUDED.username,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = CURRENT_TIMESTAMP
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
    const client = await getDbClient();
    if (!client) return;

    await ensureVerificationTable();
    await client.query('DELETE FROM verification_codes WHERE email = $1', [email]);
    await client.query(
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
    const client = await getDbClient();
    if (!client) return null;

    await ensureVerificationTable();
    const result = await client.query('SELECT * FROM verification_codes WHERE email = $1', [email]);
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
    const client = await getDbClient();
    if (client) await client.query('UPDATE verification_codes SET attempts = attempts + 1 WHERE email = $1', [email]);
  } catch (error) {
    console.error('[DB] Increment attempts error:', error.message);
  }
}

// 删除验证码
async function deleteVerificationCode(email) {
  verificationCodes.delete(email);
  try {
    const client = await getDbClient();
    if (client) await client.query('DELETE FROM verification_codes WHERE email = $1', [email]);
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

  // 正确处理路径：移除 /api 前缀，并移除查询参数
  const urlWithoutQuery = req.url.split('?')[0];
  const path = urlWithoutQuery.replace(/^\/api/, '') || '/';
  console.log('[Vercel API] Request:', req.method, path, 'Original URL:', req.url);

  try {
    // 健康检查
    if (path === '/health' || path === '/ping') {
      return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // 认证相关
    if (path.startsWith('/auth/')) {
      return handleAuthRequest(req, res, path);
    }

    // 数据库代理
    if (path.startsWith('/db') || path.startsWith('/rest/v1')) {
      return handleDbRequest(req, res, path);
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
  return new Promise((resolve, reject) => {
    if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
      resolve({});
      return;
    }

    // 如果 req.body 已经被解析（如 Vercel 的 helper）
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      resolve(req.body);
      return;
    }

    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        if (data) {
          const contentType = req.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            resolve(JSON.parse(data));
          } else {
            resolve(data);
          }
        } else {
          resolve({});
        }
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

// 处理认证请求
async function handleAuthRequest(req, res, path) {
  try {
    // 解析请求体
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

      const user = {
        id: 'user_' + Date.now(),
        email,
        username: email.split('@')[0],
        avatar_url: null,
        created_at: new Date().toISOString()
      };

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

// 处理数据库请求
async function handleDbRequest(req, res, path) {
  try {
    let databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || process.env.NEON_POSTGRES_DATABASE_URL;
    if (databaseUrl && databaseUrl.startsWith("psql '")) {
      databaseUrl = databaseUrl.replace(/^psql '/, '').replace(/'$/, '');
    }

    if (!databaseUrl) {
      return res.status(503).json({ code: 1, message: 'Database not configured' });
    }

    const client = await getDbClient();
    if (!client) {
      return res.status(503).json({ code: 1, message: 'Database connection failed' });
    }

    // 解析请求体
    const body = await parseRequestBody(req);

    const { operation, table, data, query, params } = body;
    console.log('[DB] Operation:', operation, 'Table:', table);

    // 简单的数据库操作
    if (operation === 'select') {
      const result = await client.query(query || `SELECT * FROM ${table}`, params || []);
      return res.status(200).json({ code: 0, message: 'Query successful', data: result.rows });
    }

    if (operation === 'insert' && data) {
      const columns = Object.keys(data).join(', ');
      const values = Object.values(data);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const result = await client.query(
        `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      return res.status(200).json({ code: 0, message: 'Insert successful', data: result.rows[0] });
    }

    // 默认返回成功
    return res.status(200).json({ code: 0, message: 'Database operation received', operation, table });

  } catch (error) {
    console.error('[DB] Error:', error);
    return res.status(500).json({ code: 1, message: 'Database error', error: error.message });
  }
}
