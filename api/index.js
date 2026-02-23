// api/index.js
// 这个文件是 Vercel Serverless Function 的入口点
// 它负责将所有 /api/* 请求转发给 server/local-api.mjs 中的处理逻辑

import handler from '../server/local-api.mjs';

export default async function (req, res) {
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

  try {
    // Vercel 会自动解析请求体到 req.body
    // 确保 req.body 可以被 local-api.mjs 中的 readBody 函数正确读取
    if (req.body && typeof req.body === 'object') {
      // 如果 body 已经被解析，将其转换为 JSON 字符串
      // 这样 readBody 函数可以正确解析它
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

    return await handler(req, res);
  } catch (error) {
    console.error('[API] Handler error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      code: 1, 
      message: 'Internal Server Error',
      error: error.message 
    }));
  }
}
