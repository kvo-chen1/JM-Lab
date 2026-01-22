// api/index.js
// 这个文件是 Vercel Serverless Function 的入口点
// 它负责将所有 /api/* 请求转发给 server/local-api.mjs 中的处理逻辑

import handler from '../server/local-api.mjs';

export default async function (req, res) {
  // Vercel Serverless Function 会自动解析 query parameters
  // 但我们的 handler 逻辑依赖于 req.url 的完整性或自行解析
  // local-api.mjs 已经被改造为 export default function handler(req, res)
  
  // 确保 Content-Type 正确，有些请求可能没有设置
  if (req.method === 'POST' && !req.headers['content-type']) {
    req.headers['content-type'] = 'application/json';
  }

  return handler(req, res);
}
