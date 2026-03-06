// Netlify Function - API 入口
// 处理所有 /api/* 请求

// 设置内存限制
process.env.NODE_OPTIONS = '--max-old-space-size=512';

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
    console.log('[Email] Content:', htmlContent);
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
    if (path === '/auth/login') {
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

      return new Response(
        JSON.stringify({
          code: 0,
          message: '登录成功',
          data: {
            token: 'mock_token_' + Date.now(),
            user: {
              id: 'user_' + Date.now(),
              email,
              username: email.split('@')[0]
            }
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
    
    const { operation, table, data, query } = body;

    return new Response(
      JSON.stringify({
        code: 0,
        message: 'Database proxy - operation received',
        operation,
        table,
        timestamp: new Date().toISOString()
      }), 
      { status: 200, headers }
    );

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
