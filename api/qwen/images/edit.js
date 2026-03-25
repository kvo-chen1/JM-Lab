// Vercel Serverless Function for Qwen Image Editing
// Path: /api/qwen/images/edit
// 使用 qwen-image-edit 模型进行图像编辑（基于参考图片）

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
    const { prompt, imageUrl, size, n } = req.body;

    // 从环境变量获取 API Key
    const apiKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY;

    if (!apiKey) {
      console.error('[Qwen Image Edit API] API key not configured');
      return res.status(500).json({
        error: 'API key not configured',
        message: 'DashScope API密钥未配置'
      });
    }

    if (!imageUrl) {
      return res.status(400).json({
        error: 'Missing image URL',
        message: '缺少参考图片URL'
      });
    }

    console.log('[Qwen Image Edit API] Editing image with prompt:', prompt?.substring(0, 50));
    console.log('[Qwen Image Edit API] Reference image:', imageUrl?.substring(0, 50));

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

    // 调用 DashScope 图像编辑 API (qwen-image-edit)
    // 使用 image-editing 端点
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/image-editing/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify({
        model: 'qwen-image-edit-max',
        input: {
          image_url: imageUrl,
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
      
      console.error('[Qwen Image Edit API] DashScope API error:', {
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
    console.log('[Qwen Image Edit API] Task created:', data.output?.task_id);

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

      console.log(`[Qwen Image Edit API] Task status: ${status}, attempt: ${i + 1}`);

      if (status === 'SUCCEEDED') {
        // qwen-image-edit 的结果格式与 text2image 不同
        // 结果在 output.choices[0].message.content 中
        const choices = taskData.output?.choices || [];
        const images = [];
        
        for (const choice of choices) {
          const content = choice.message?.content || [];
          for (const item of content) {
            if (item.image) {
              images.push({
                url: item.image,
                revised_prompt: prompt
              });
            }
          }
        }

        if (images.length === 0) {
          return res.status(500).json({
            error: 'No images in response',
            message: '响应中没有图片数据',
            details: taskData
          });
        }

        return res.status(200).json({
          ok: true,
          data: {
            created: Date.now(),
            data: images
          }
        });
      }

      if (status === 'FAILED') {
        const errorMessage = taskData.output?.message || '图像编辑失败';
        const errorCode = taskData.output?.code || '';
        
        // 检查是否是内容审核错误
        const isContentModerationError = 
          errorCode === 'inappropriate-content' ||
          errorMessage.includes('inappropriate content') ||
          errorMessage.includes('不适当内容') ||
          errorMessage.includes('内容审核') ||
          errorMessage.includes('敏感内容');
        
        if (isContentModerationError) {
          return res.status(400).json({
            error: 'Content moderation failed',
            code: 'inappropriate-content',
            message: '抱歉，您的描述可能包含敏感词汇或受限内容，无法编辑图像。',
            suggestion: '请尝试换种描述方式，比如：\n1. 避免使用具体品牌名称\n2. 使用更通用的描述词汇\n3. 调整描述的角度或侧重点',
            details: errorMessage
          });
        }
        
        return res.status(500).json({
          error: 'Task failed',
          code: errorCode,
          message: errorMessage
        });
      }
    }

    // 超时
    return res.status(504).json({
      error: 'Timeout',
      message: '图像编辑超时，请稍后重试'
    });

  } catch (error) {
    console.error('[Qwen Image Edit API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
