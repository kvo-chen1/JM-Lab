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

    // 其他 API 路由 - 尝试导入本地 API 处理
    try {
      const { default: apiHandler } = await import('../../server/local-api.mjs');
      
      // 创建模拟的 req/res 对象
      const req = createMockReq(request, path);
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
function createMockReq(request, path) {
  const url = new URL(request.url);
  return {
    method: request.method,
    url: path + url.search,
    path: path,
    query: Object.fromEntries(url.searchParams),
    headers: Object.fromEntries(request.headers),
    body: null,
    on: (event, callback) => {
      if (event === 'data') {
        // 如果有请求体，需要处理
      }
      if (event === 'end') {
        callback();
      }
    }
  };
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