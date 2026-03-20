// Vercel Serverless Function for Qwen Task Status Query
// Path: /api/qwen/tasks/:id

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 从 URL 获取任务 ID
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        error: 'Missing task ID',
        message: '任务ID不能为空'
      });
    }

    // 从环境变量获取 API Key
    const apiKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY;

    if (!apiKey) {
      console.error('[Qwen Task API] API key not configured');
      return res.status(500).json({
        error: 'API key not configured',
        message: 'DashScope API密钥未配置'
      });
    }

    console.log('[Qwen Task API] Querying task:', id);

    // 调用 DashScope 任务查询 API
    const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Qwen Task API] DashScope API error:', {
        status: response.status,
        error: errorData
      });
      return res.status(response.status).json({
        error: 'DashScope API error',
        message: errorData.message || `API请求失败: ${response.status}`
      });
    }

    const data = await response.json();
    const status = data.output?.task_status;

    console.log('[Qwen Task API] Task status:', status);

    // 返回任务状态
    return res.status(200).json({
      ok: true,
      data: {
        task_id: id,
        status: status,
        output: data.output,
        results: data.output?.results || data.output?.video_url ? [{ url: data.output.video_url }] : []
      }
    });

  } catch (error) {
    console.error('[Qwen Task API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
