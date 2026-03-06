// Netlify Function - API 入口
// 处理所有 /api/* 请求

// 设置内存限制
process.env.NODE_OPTIONS = '--max-old-space-size=512';

// 内存中存储验证码（作为数据库的备选）
const verificationCodes = new Map();

// 数据库连接
let pgClient = null;
let dbAvailable = false;

// 获取数据库连接
async function getDbClient() {
  if (pgClient) return pgClient;
  if (!dbAvailable) return null;
  
  const databaseUrl = process.env.DATABASE_URL || process.env.NEON_POSTGRES_DATABASE_URL;
  if (!databaseUrl) {
    console.log('[DB] Database URL not configured');
    return null;
  }
  
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
    
    // 使用 UPSERT 语法保存用户
    await client.query(`
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

// 根据ID获取用户
async function getUserById(userId) {
  try {
    const client = await getDbClient();
    if (!client) return null;
    
    await ensureUsersTable();
    
    const result = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('[DB] Get user error:', error.message);
    return null;
  }
}

// 保存验证码（优先数据库，失败则使用内存）
async function saveVerificationCode(email, code, expiresAt) {
  // 先保存到内存
  verificationCodes.set(email, {
    code,
    expiresAt,
    attempts: 0
  });
  console.log('[Memory] Code saved for', email);
  
  // 尝试保存到数据库
  try {
    const client = await getDbClient();
    if (!client) return;
    
    await ensureVerificationTable();
    
    // 删除旧的验证码
    await client.query(
      'DELETE FROM verification_codes WHERE email = $1',
      [email]
    );
    
    // 插入新的验证码
    await client.query(
      'INSERT INTO verification_codes (email, code, expires_at, attempts) VALUES ($1, $2, $3, $4)',
      [email, code, new Date(expiresAt), 0]
    );
    
    console.log('[DB] Code saved for', email);
  } catch (error) {
    console.error('[DB] Save code error:', error.message);
    // 数据库失败不影响功能，内存中已保存
  }
}

// 从数据库或内存获取验证码
async function getVerificationCode(email) {
  // 先尝试从内存获取
  const memoryData = verificationCodes.get(email);
  if (memoryData) {
    console.log('[Memory] Code found for', email);
    return {
      code: memoryData.code,
      expires_at: new Date(memoryData.expiresAt),
      attempts: memoryData.attempts
    };
  }
  
  // 尝试从数据库获取
  try {
    const client = await getDbClient();
    if (!client) return null;
    
    await ensureVerificationTable();
    
    const result = await client.query(
      'SELECT * FROM verification_codes WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    console.log('[DB] Code found for', email);
    return result.rows[0];
  } catch (error) {
    console.error('[DB] Get code error:', error.message);
    return null;
  }
}

// 更新验证码尝试次数
async function incrementAttempts(email) {
  // 更新内存
  const memoryData = verificationCodes.get(email);
  if (memoryData) {
    memoryData.attempts++;
  }
  
  // 尝试更新数据库
  try {
    const client = await getDbClient();
    if (!client) return;
    
    await client.query(
      'UPDATE verification_codes SET attempts = attempts + 1 WHERE email = $1',
      [email]
    );
  } catch (error) {
    console.error('[DB] Increment attempts error:', error.message);
  }
}

// 删除验证码
async function deleteVerificationCode(email) {
  // 删除内存中的验证码
  verificationCodes.delete(email);
  console.log('[Memory] Code deleted for', email);
  
  // 尝试删除数据库中的验证码
  try {
    const client = await getDbClient();
    if (!client) return;
    
    await client.query(
      'DELETE FROM verification_codes WHERE email = $1',
      [email]
    );
    console.log('[DB] Code deleted for', email);
  } catch (error) {
    console.error('[DB] Delete code error:', error.message);
  }
}

// 邮件发送函数 - 使用动态导入
async function sendEmail(to, subject, htmlContent) {
  const {
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_FROM,
    EMAIL_SECURE
  } = process.env;

  // 检查邮件配置
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.log('[Email] Email not configured, logging email instead:');
    console.log('[Email] To:', to);
    console.log('[Email] Subject:', subject);
    return { success: true, message: 'Email logged (email not configured)' };
  }

  try {
    // 动态导入 nodemailer
    const nodemailer = await import('nodemailer').then(m => m.default).catch(() => null);
    
    if (!nodemailer) {
      console.log('[Email] Nodemailer not available, logging email:');
      console.log('[Email] To:', to);
      console.log('[Email] Subject:', subject);
      return { success: true, message: 'Email logged (nodemailer not available)' };
    }

    // 使用 nodemailer 发送邮件
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: parseInt(EMAIL_PORT || '587'),
      secure: EMAIL_SECURE === 'true' || EMAIL_PORT === '465',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });

    const info = await transporter.sendMail({
      from: EMAIL_FROM || EMAIL_USER,
      to,
      subject,
      html: htmlContent
    });

    console.log('[Email] Sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Error:', error);
    throw error;
  }
}

// 生成验证码邮件模板
function generateVerificationEmailTemplate(code, expireMinutes = 10) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; letter-spacing: 8px; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>津脉智坊</h1>
          <p>验证码登录</p>
        </div>
        <div class="content">
          <p>您好！</p>
          <p>您正在使用邮箱验证码登录津脉智坊平台。您的验证码是：</p>
          <div class="code">${code}</div>
          <p>此验证码将在 <strong>${expireMinutes} 分钟</strong> 后过期，请尽快使用。</p>
          <p>如果您没有请求此验证码，请忽略此邮件。</p>
        </div>
        <div class="footer">
          <p>此邮件由系统自动发送，请勿回复。</p>
          <p>津脉智坊团队</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 生成 JWT Token
function generateToken(user) {
  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const payload = JSON.stringify({
    ...user,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7天过期
  });
  
  const base64Header = btoa(header).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const base64Payload = btoa(payload).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  // 简化版 JWT，实际应该使用加密签名
  const signature = btoa(process.env.JWT_SECRET || 'default-secret').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

export default async (request, context) => {
  // 设置 CORS 头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    // 获取请求路径
    const url = new URL(request.url);
    const path = url.pathname.replace('/api', '') || '/';
    
    console.log('[Netlify API] Request:', request.method, path);

    // 处理 /db 路径 - Neon 数据库代理
    if (path.startsWith('/db')) {
      return handleDbRequest(request, context, headers);
    }

    // 处理健康检查
    if (path === '/health' || path === '/ping') {
      return new Response(
        JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          environment: 'netlify'
        }), 
        { status: 200, headers }
      );
    }

    // 处理认证相关请求
    if (path.startsWith('/auth/')) {
      return handleAuthRequest(request, path, headers);
    }

    // 其他 API 路由 - 返回未实现
    return new Response(
      JSON.stringify({ 
        code: 1, 
        message: 'API endpoint not implemented: ' + path
      }), 
      { status: 501, headers }
    );

  } catch (error) {
    console.error('[Netlify API] Error:', error);
    return new Response(
      JSON.stringify({ 
        code: 1, 
        message: 'Internal Server Error',
        error: error.message
      }), 
      { status: 500, headers }
    );
  }
};

// 处理认证请求
async function handleAuthRequest(request, path, headers) {
  try {
    // 解析请求体
    let body = {};
    if (request.method === 'POST' || request.method === 'PUT') {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        body = await request.json().catch(() => ({}));
      }
    }

    console.log('[Netlify Auth] Path:', path, 'Body:', JSON.stringify(body));

    // 处理发送验证码请求
    if (path === '/auth/send-email-code') {
      const { email } = body;
      
      if (!email) {
        return new Response(
          JSON.stringify({ 
            code: 1, 
            message: '邮箱地址不能为空'
          }), 
          { status: 400, headers }
        );
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ 
            code: 1, 
            message: '邮箱格式不正确'
          }), 
          { status: 400, headers }
        );
      }

      // 生成6位验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      console.log('[Netlify Auth] Generated code for', email, ':', code);

      try {
        // 发送邮件
        const emailResult = await sendEmail(
          email,
          '津脉智坊 - 登录验证码',
          generateVerificationEmailTemplate(code)
        );

        console.log('[Netlify Auth] Email result:', emailResult);

        // 保存验证码（内存+数据库）
        const expiresAt = Date.now() + (10 * 60 * 1000); // 10分钟过期
        await saveVerificationCode(email, code, expiresAt);

        console.log('[Netlify Auth] Code saved for', email);

        return new Response(
          JSON.stringify({
            code: 0,
            message: '验证码发送成功',
            data: {
              email,
              // 仅在开发环境返回验证码用于测试
              debug_code: process.env.NODE_ENV === 'development' ? code : undefined
            }
          }), 
          { status: 200, headers }
        );
      } catch (emailError) {
        console.error('[Netlify Auth] Email send error:', emailError);
        return new Response(
          JSON.stringify({ 
            code: 1, 
            message: '验证码发送失败，请稍后重试',
            error: emailError.message
          }), 
          { status: 500, headers }
        );
      }
    }

    // 处理登录请求
    if (path === '/auth/login' || path === '/auth/login-with-email-code') {
      const { email, code } = body;
      
      if (!email || !code) {
        return new Response(
          JSON.stringify({ 
            code: 1, 
            message: '邮箱和验证码不能为空'
          }), 
          { status: 400, headers }
        );
      }

      console.log('[Netlify Auth] Login attempt:', email, 'Code:', code);

      // 获取验证码（内存或数据库）
      const storedData = await getVerificationCode(email);
      
      if (!storedData) {
        return new Response(
          JSON.stringify({ 
            code: 1, 
            message: '验证码已过期，请重新获取'
          }), 
          { status: 400, headers }
        );
      }

      // 检查是否过期
      if (new Date() > new Date(storedData.expires_at)) {
        await deleteVerificationCode(email);
        return new Response(
          JSON.stringify({ 
            code: 1, 
            message: '验证码已过期，请重新获取'
          }), 
          { status: 400, headers }
        );
      }

      // 检查尝试次数
      if (storedData.attempts >= 5) {
        await deleteVerificationCode(email);
        return new Response(
          JSON.stringify({ 
            code: 1, 
            message: '验证码错误次数过多，请重新获取'
          }), 
          { status: 400, headers }
        );
      }

      // 验证验证码
      if (storedData.code !== code) {
        await incrementAttempts(email);
        return new Response(
          JSON.stringify({ 
            code: 1, 
            message: '验证码错误'
          }), 
          { status: 400, headers }
        );
      }

      // 验证码正确，删除已使用的验证码
      await deleteVerificationCode(email);

      // 生成用户信息
      const user = {
        id: 'user_' + Date.now(),
        email,
        username: email.split('@')[0],
        avatar_url: null,
        created_at: new Date().toISOString()
      };

      // 保存用户到数据库
      await saveUser(user);

      // 生成 JWT Token
      const token = generateToken(user);

      console.log('[Netlify Auth] Login successful:', email);

      return new Response(
        JSON.stringify({
          code: 0,
          message: '登录成功',
          data: {
            token,
            user
          }
        }), 
        { status: 200, headers }
      );
    }

    // 未识别的认证路径
    return new Response(
      JSON.stringify({ 
        code: 1, 
        message: '未知的认证接口: ' + path
      }), 
      { status: 404, headers }
    );

  } catch (error) {
    console.error('[Netlify Auth] Error:', error);
    return new Response(
      JSON.stringify({ 
        code: 1, 
        message: '认证服务错误',
        error: error.message
      }), 
      { status: 500, headers }
    );
  }
}

// 处理数据库请求
async function handleDbRequest(request, context, headers) {
  try {
    // 获取 Neon 数据库连接信息
    const databaseUrl = process.env.DATABASE_URL || process.env.NEON_POSTGRES_DATABASE_URL;
    
    if (!databaseUrl) {
      return new Response(
        JSON.stringify({ 
          code: 1, 
          message: 'Database not configured'
        }), 
        { status: 503, headers }
      );
    }

    // 解析请求体
    const body = await request.json().catch(() => ({}));
    
    const { operation, table, data, query, params } = body;

    console.log('[Netlify DB] Operation:', operation, 'Table:', table);

    // 获取数据库连接
    const client = await getDbClient();
    if (!client) {
      return new Response(
        JSON.stringify({ 
          code: 1, 
          message: 'Database connection failed'
        }), 
        { status: 503, headers }
      );
    }

    // 处理不同的数据库操作
    let result;
    
    switch (operation) {
      case 'select':
        result = await client.query(query || `SELECT * FROM ${table}`, params || []);
        return new Response(
          JSON.stringify({
            code: 0,
            message: 'Query successful',
            data: result.rows
          }), 
          { status: 200, headers }
        );
        
      case 'insert':
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        result = await client.query(
          `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
          values
        );
        return new Response(
          JSON.stringify({
            code: 0,
            message: 'Insert successful',
            data: result.rows[0]
          }), 
          { status: 200, headers }
        );
        
      case 'update':
        const setClause = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
        const updateValues = [...Object.values(data), ...(params || [])];
        result = await client.query(
          `UPDATE ${table} SET ${setClause} ${query || ''} RETURNING *`,
          updateValues
        );
        return new Response(
          JSON.stringify({
            code: 0,
            message: 'Update successful',
            data: result.rows
          }), 
          { status: 200, headers }
        );
        
      case 'delete':
        result = await client.query(
          `DELETE FROM ${table} ${query || ''} RETURNING *`,
          params || []
        );
        return new Response(
          JSON.stringify({
            code: 0,
            message: 'Delete successful',
            data: result.rows
          }), 
          { status: 200, headers }
        );
        
      default:
        return new Response(
          JSON.stringify({
            code: 1,
            message: 'Unknown operation: ' + operation
          }), 
          { status: 400, headers }
        );
    }

  } catch (error) {
    console.error('[Netlify DB] Error:', error);
    return new Response(
      JSON.stringify({ 
        code: 1, 
        message: 'Database error',
        error: error.message
      }), 
      { status: 500, headers }
    );
  }
}
