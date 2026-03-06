// Netlify Function - API 入口
// 处理所有 /api/* 请求

// 设置内存限制
process.env.NODE_OPTIONS = '--max-old-space-size=512';

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

    // 其他 API 路由 - 尝试导入本地 API 处理
    try {
      const { default: apiHandler } = await import('../../server/local-api.mjs');
      
      // 创建模拟的 req/res 对象
      const req = await createMockReq(request, path);
      const res = createMockRes(headers);
      
      await apiHandler(req, res);
      
      return new Response(
        JSON.stringify(res.body), 
        { status: res.statusCode || 200, headers }
      );
    } catch (error) {
      console.error('[Netlify API] Handler error:', error);
      return new Response(
        JSON.stringify({ 
          code: 1, 
          message: 'API handler not available',
          error: error.message
        }), 
        { status: 501, headers }
      );
    }

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

      // 生成6位验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 这里应该调用邮件服务发送验证码
      // 目前返回模拟成功响应
      console.log('[Netlify Auth] Generated code for', email, ':', code);
      
      // 在实际生产环境中，这里需要：
      // 1. 将验证码保存到数据库（带过期时间）
      // 2. 调用邮件服务（如 SendGrid、AWS SES 等）发送邮件
      
      return new Response(
        JSON.stringify({
          code: 0,
          message: '验证码发送成功',
          data: {
            email,
            // 注意：实际生产环境不要返回验证码！这里仅用于测试
            debug_code: process.env.NODE_ENV === 'development' ? code : undefined
          }
        }), 
        { status: 200, headers }
      );
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

      // 这里应该验证验证码
      // 目前返回模拟成功响应
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
    
    // 这里可以实现一个简单的数据库查询代理
    // 为了安全，只支持特定的操作
    const { operation, table, data, query } = body;

    // 返回模拟响应（实际实现需要连接数据库）
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

// 创建模拟请求对象
async function createMockReq(request, path) {
  const url = new URL(request.url);
  
  // 解析请求体
  let body = null;
  if (request.method === 'POST' || request.method === 'PUT') {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await request.json().catch(() => null);
    }
  }
  
  const req = {
    method: request.method,
    url: path + url.search,
    path: path,
    query: Object.fromEntries(url.searchParams),
    headers: Object.fromEntries(request.headers),
    body: body,
    on: (event, callback) => {
      if (event === 'data' && body) {
        callback(Buffer.from(JSON.stringify(body)));
      }
      if (event === 'end') {
        callback();
      }
    }
  };
  
  return req;
}

// 创建模拟响应对象
function createMockRes(headers) {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    headersSent: false,
    setHeader: function(key, value) {
      this.headers[key] = value;
    },
    end: function(data) {
      this.headersSent = true;
      if (data) {
        try {
          this.body = JSON.parse(data);
        } catch {
          this.body = data;
        }
      }
    }
  };
  return res;
}