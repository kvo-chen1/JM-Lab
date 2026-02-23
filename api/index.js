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
