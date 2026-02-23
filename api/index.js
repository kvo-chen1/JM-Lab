// api/index.js
// 这个文件是 Vercel Serverless Function 的入口点
// 它负责将所有 /api/* 请求转发给 server/local-api.mjs 中的处理逻辑

import handler from '../server/local-api.mjs';

export default async function (req, res) {
  // Vercel Serverless Function 会自动解析请求体到 req.body
  // 但我们的 handler 逻辑依赖于从流中读取数据
  // 为了确保兼容性，我们需要将已解析的请求体重新转换为流式读取的格式
  
  // 确保 Content-Type 正确
  if (req.method === 'POST' && !req.headers['content-type']) {
    req.headers['content-type'] = 'application/json';
  }

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

  // 确保 req.body 在流式读取时可用
  // 如果 Vercel 已经解析了请求体，我们需要将其序列化后模拟流式读取
  if (req.body && typeof req.body === 'object' && !req._bodyParsed) {
    const bodyData = JSON.stringify(req.body);
    req._bodyParsed = true;
    
    // 模拟 data 和 end 事件
    let dataEmitted = false;
    const originalOn = req.on.bind(req);
    
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

  try {
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
