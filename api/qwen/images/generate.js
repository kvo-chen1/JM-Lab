// Vercel Serverless Function for Qwen Image Generation
// Path: /api/qwen/images/generate

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
    const { model, prompt, size, n } = req.body;

    // 从环境变量获取 API Key
    const apiKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY;

    if (!apiKey) {
      console.error('[Qwen Image API] API key not configured');
      return res.status(500).json({
        error: 'API key not configured',
        message: 'DashScope API密钥未配置'
      });
    }

    console.log('[Qwen Image API] Generating image with prompt:', prompt?.substring(0, 50));

    // 解析尺寸
    let width = 1024;
    let height = 1024;
    if (size) {
      const [w, h] = size.split('x').map(Number);
      if (w && h) {
        width = w;
        height = h;
      }
    }

    // 调用 DashScope 图像生成 API
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify({
        model: model || 'qwen-image-2.0-pro',
        input: {
          prompt: prompt
        },
        parameters: {
          size: `${width}*${height}`,
          n: n || 1
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
      
      console.error('[Qwen Image API] DashScope API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        apiKeyPrefix: apiKey?.substring(0, 10) + '...'
      });
      
      // 403 错误通常是 API Key 问题
      if (response.status === 403) {
        return res.status(403).json({
          error: 'API Key invalid or expired',
          message: 'API Key 无效或已过期，请检查 DASHSCOPE_API_KEY 配置',
          details: errorData
        });
      }
      
      // 429 错误是请求太频繁
      if (response.status === 429) {
        return res.status(429).json({
          error: 'Rate limited',
          message: '请求太频繁，请稍后再试',
          details: errorData
        });
      }
      
      return res.status(response.status).json({
        error: 'DashScope API error',
        message: errorData.message || errorData.code || `API请求失败: ${response.status}`,
        details: errorData
      });
    }

    const data = await response.json();
    console.log('[Qwen Image API] Task created:', data.output?.task_id);

    // 轮询获取结果
    const taskId = data.output?.task_id;
    if (!taskId) {
      return res.status(500).json({
        error: 'No task ID returned',
        message: '未能获取任务ID'
      });
    }

    // 轮询任务状态（最多60秒）
    const maxAttempts = 30;
    const pollInterval = 2000;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const taskResponse = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!taskResponse.ok) {
        continue;
      }

      const taskData = await taskResponse.json();
      const status = taskData.output?.task_status;

      console.log(`[Qwen Image API] Task status: ${status}, attempt: ${i + 1}`);

      if (status === 'SUCCEEDED') {
        const results = taskData.output?.results || [];
        const images = results.map((result, index) => ({
          url: result.url,
          revised_prompt: prompt
        }));

        return res.status(200).json({
          ok: true,
          data: {
            created: Date.now(),
            data: images
          }
        });
      }

      if (status === 'FAILED') {
        return res.status(500).json({
          error: 'Task failed',
          message: taskData.output?.message || '图像生成失败'
        });
      }
    }

    // 超时
    return res.status(504).json({
      error: 'Timeout',
      message: '图像生成超时，请稍后重试'
    });

  } catch (error) {
    console.error('[Qwen Image API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
