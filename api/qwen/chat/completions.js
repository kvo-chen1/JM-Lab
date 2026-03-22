// Vercel Serverless Function for Qwen (Tongyi Qianwen) API
// Path: /api/qwen/chat/completions

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
    const apiKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY;

    if (!apiKey) {
      console.error('[Qwen API] API key not configured');
      return res.status(500).json({
        error: 'API key not configured',
        message: 'DashScope API密钥未配置',
        solution: '请在 .env 文件中设置 DASHSCOPE_API_KEY 或 VITE_QWEN_API_KEY 环境变量'
      });
    }

    console.log('[Qwen API] Calling DashScope API with model:', model);

    // 转换消息格式为 DashScope 格式
    const dashscopeMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // 调用 DashScope API
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'qwen3-max-2026-01-23',
        input: {
          messages: dashscopeMessages
        },
        parameters: {
          temperature: temperature ?? 0.7,
          top_p: top_p ?? 0.9,
          max_tokens: max_tokens ?? 1500,
          result_format: 'message'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { raw: errorText };
      }
      console.error('[Qwen API] DashScope API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'undefined'
      });
      return res.status(response.status).json({
        error: 'DashScope API error',
        status: response.status,
        message: errorData.message || errorData.error?.message || `API请求失败: ${response.status} ${response.statusText}`,
        details: errorData
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
    console.log('[Qwen API] Success response');

    // 转换为标准格式
    const standardResponse = {
      choices: [{
        message: {
          role: 'assistant',
          content: data.output?.text || data.output?.choices?.[0]?.message?.content || ''
        }
      }]
    };

    return res.status(200).json({
      ok: true,
      data: {
        ...data,
        ...standardResponse
      }
    });

  } catch (error) {
    console.error('[Qwen API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
