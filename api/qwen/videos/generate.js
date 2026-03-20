// Vercel Serverless Function for Qwen Video Generation
// Path: /api/qwen/videos/generate

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
    const { model, content, prompt, imageUrl, duration, resolution, aspectRatio } = req.body;

    // 从环境变量获取 API Key
    const apiKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY;

    if (!apiKey) {
      console.error('[Qwen Video API] API key not configured');
      return res.status(500).json({
        error: 'API key not configured',
        message: 'DashScope API密钥未配置'
      });
    }

    console.log('[Qwen Video API] Generating video...');

    // 构建请求体
    const requestBody = {
      model: model || 'wan2.1-i2v-720p',
      input: {}
    };

    // 处理输入内容
    if (content && Array.isArray(content)) {
      // 新格式：包含文本和图片
      const textContent = content.find(c => c.type === 'text')?.text || '';
      const imageContent = content.find(c => c.type === 'image_url');

      requestBody.input.prompt = textContent;
      if (imageContent?.image_url?.url) {
        requestBody.input.image_url = imageContent.image_url.url;
      }
    } else {
      // 旧格式：直接使用 prompt 和 imageUrl
      requestBody.input.prompt = prompt || '';
      if (imageUrl) {
        requestBody.input.image_url = imageUrl;
      }
    }

    // 添加参数
    requestBody.parameters = {
      duration: duration || 5,
      resolution: resolution || '720p'
    };

    console.log('[Qwen Video API] Request:', JSON.stringify(requestBody, null, 2));

    // 调用 DashScope 视频生成 API
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Qwen Video API] DashScope API error:', {
        status: response.status,
        error: errorData
      });
      return res.status(response.status).json({
        error: 'DashScope API error',
        message: errorData.message || `API请求失败: ${response.status}`
      });
    }

    const data = await response.json();
    console.log('[Qwen Video API] Task created:', data.output?.task_id);

    // 返回任务信息，让前端轮询
    return res.status(200).json({
      ok: true,
      data: {
        task_id: data.output?.task_id,
        status: 'PENDING'
      }
    });

  } catch (error) {
    console.error('[Qwen Video API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
