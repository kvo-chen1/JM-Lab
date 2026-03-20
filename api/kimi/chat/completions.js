// Vercel Serverless Function for Kimi API
// Path: /api/kimi/chat/completions

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, messages, temperature, top_p, max_tokens, stream } = req.body;

    // 从环境变量获取 API Key
    const apiKey = process.env.KIMI_API_KEY || process.env.VITE_KIMI_API_KEY;

    if (!apiKey) {
      console.error('[Kimi API] API key not configured');
      return res.status(500).json({
        error: 'API key not configured',
        message: 'Kimi API密钥未配置'
      });
    }

    console.log('[Kimi API] Calling Moonshot API with model:', model);

    // 调用 Moonshot API
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'moonshot-v1-8k',
        messages,
        temperature: temperature ?? 0.7,
        top_p: top_p ?? 0.9,
        max_tokens: max_tokens ?? 1500,
        stream: stream ?? false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Kimi API] Moonshot API error:', {
        status: response.status,
        error: errorData
      });
      return res.status(response.status).json({
        error: 'Moonshot API error',
        message: errorData.error?.message || `API请求失败: ${response.status}`
      });
    }

    // 如果是流式响应
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value));
      }

      return res.end();
    }

    // 非流式响应
    const data = await response.json();
    console.log('[Kimi API] Success response');

    return res.status(200).json({
      ok: true,
      data: data
    });

  } catch (error) {
    console.error('[Kimi API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
