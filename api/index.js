// api/index.js
// Vercel Serverless Function 入口点 - 优化版本
// 减少内存占用和执行时间

// 设置内存限制提示
process.env.NODE_OPTIONS = '--max-old-space-size=512';

// 动态导入，减少冷启动内存占用
export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // 添加超时保护
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.statusCode = 504;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        code: 1, 
        message: 'Gateway Timeout',
        error: 'Request timeout after 8 seconds'
      }));
    }
  }, 8000); // 8秒超时

  try {
    // 动态导入 handler，减少初始内存占用
    const { default: apiHandler } = await import('../server/local-api.mjs');

    // Vercel 会自动解析请求体到 req.body
    if (req.body && typeof req.body === 'object') {
      const bodyData = JSON.stringify(req.body);
      
      // 重写 req.on 方法来模拟流式读取
      const originalOn = req.on.bind(req);
      let dataEmitted = false;
      
      req.on = function(event, callback) {
        if (event === 'data' && !dataEmitted) {
          dataEmitted = true;
          callback(Buffer.from(bodyData));
          return req;
        }
        if (event === 'end') {
          callback();
          return req;
        }
        return originalOn(event, callback);
      };
    }

    const result = await apiHandler(req, res);
    clearTimeout(timeout);
    return result;
  } catch (error) {
    clearTimeout(timeout);
    console.error('[API] Handler error:', error);
    
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        code: 1, 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Server Error'
      }));
    }
  }
}
