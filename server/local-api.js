// Minimal local proxy server for LLM APIs (Qwen, Kimi, DeepSeek)
// Runs at http://localhost:3030 and exposes /api/* endpoints

import http from 'node:http'
import { URL } from 'node:url'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const PORT = process.env.LOCAL_API_PORT || 3030
const ORIGIN = process.env.CORS_ALLOW_ORIGIN || '*'

// Qwen config - 使用兼容模式的基础URL
const QWEN_BASE_URL = process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com'
const QWEN_API_KEY = process.env.QWEN_API_KEY || process.env.VITE_QWEN_API_KEY || ''

// Kimi config
const KIMI_BASE_URL = process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1'
const KIMI_API_KEY = process.env.KIMI_API_KEY || process.env.VITE_KIMI_API_KEY || ''

// DeepSeek config
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY || ''

// 模型配置 - 根据阿里云百炼控制台可用模型
const MODELS = {
  // 大语言模型（文本对话）
  text: {
    'qwen3.5-flash': { name: '通义千问 3.5-Flash', type: 'text', provider: 'qwen' },
    'qwen3.5-plus': { name: '通义千问 3.5-Plus', type: 'text', provider: 'qwen' },
    'qwen3.5-flash-2026-02-23': { name: '通义千问 3.5-Flash(2026-02-23)', type: 'text', provider: 'qwen' },
    'qwen3.5-plus-2026-02-15': { name: '通义千问 3.5-Plus(2026-02-15)', type: 'text', provider: 'qwen' },
    'moonshot-v1-8k': { name: 'Kimi-8K', type: 'text', provider: 'kimi' },
    'deepseek-chat': { name: 'DeepSeek-Chat', type: 'text', provider: 'deepseek' },
  },
  // 视觉模型（图片理解）
  vision: {
    'qwen-image-2.0-pro': { name: '通义千问-视觉2.0-Pro', type: 'vision', provider: 'qwen' },
    'qwen-image-2.0': { name: '通义千问-视觉2.0', type: 'vision', provider: 'qwen' },
    'wan2.6-i2v-flash': { name: '万相2.6-图生视频-Flash', type: 'vision', provider: 'qwen' },
  },
  // 图片生成模型
  image: {
    'wanx2.1-kf2v-plus': { name: '万相2.1-文生图-Plus', type: 'image', provider: 'qwen' },
    'qwen-image-plus': { name: '通义千问-图片增强', type: 'image', provider: 'qwen' },
    'qwen-image-edit-plus': { name: '通义千问-图片编辑', type: 'image', provider: 'qwen' },
    'qwen-image-max': { name: '通义千问-图片Max', type: 'image', provider: 'qwen' },
  },
  // 视频生成模型
  video: {
    'wan2.6-r2v-flash': { name: '万相2.6-文生视频-Flash', type: 'video', provider: 'qwen' },
    'wan2.6-r2v': { name: '万相2.6-文生视频', type: 'video', provider: 'qwen' },
    'wanx2.1-i2v-plus': { name: '万相2.1-图生视频-Plus', type: 'video', provider: 'qwen' },
  }
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

async function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) } catch { resolve({}) }
    })
  })
}

async function proxyFetch(baseUrl, apiKey, path, method, body, additionalHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
    ...additionalHeaders
  }

  const resp = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = resp.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
  return { status: resp.status, ok: resp.ok, data }
}

function sendJson(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(obj))
}

// Qwen API proxy - 支持文本、视觉、图片、视频
async function handleQwenRequest(req, res, path) {
  if (!QWEN_API_KEY) {
    sendJson(res, 500, { error: 'QWEN_API_KEY_MISSING', message: '通义千问API密钥未配置' })
    return
  }

  try {
    // 文本对话 - 使用兼容OpenAI的接口
    if (req.method === 'POST' && path === '/api/qwen/chat/completions') {
      const b = await readBody(req)
      const model = b.model || 'qwen-turbo'
      
      const payload = {
        model: model,
        messages: b.messages,
        max_tokens: b.max_tokens || 2000,
        temperature: b.temperature ?? 0.7,
        top_p: b.top_p ?? 0.9,
        stream: b.stream ?? false
      }

      const r = await proxyFetch(
        QWEN_BASE_URL, 
        QWEN_API_KEY, 
        '/compatible-mode/v1/chat/completions', 
        'POST', 
        payload
      )

      if (!r.ok) {
        console.error('Qwen API error:', r.data)
        sendJson(res, r.status, { error: 'QWEN_API_ERROR', data: r.data })
        return
      }

      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // 图片生成
    if (req.method === 'POST' && path === '/api/qwen/images/generations') {
      const b = await readBody(req)
      const model = b.model || 'wanx2.1-kf2v-plus'
      
      const payload = {
        model: model,
        prompt: b.prompt,
        negative_prompt: b.negative_prompt || '',
        size: b.size || '1024x1024',
        n: b.n || 1,
        steps: b.steps || 50,
        guidance_scale: b.guidance_scale || 7.5,
        seed: b.seed,
        style: b.style || '<auto>',
      }

      const r = await proxyFetch(
        QWEN_BASE_URL,
        QWEN_API_KEY,
        '/services/aigc/text2image/image-synthesis',
        'POST',
        {
          model: payload.model,
          input: { prompt: payload.prompt, negative_prompt: payload.negative_prompt },
          parameters: {
            size: payload.size,
            n: payload.n,
            steps: payload.steps,
            scale: payload.guidance_scale,
            seed: payload.seed,
            style: payload.style
          }
        }
      )

      if (!r.ok) {
        sendJson(res, r.status, { error: 'QWEN_IMAGE_API_ERROR', data: r.data })
        return
      }

      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // 视频生成 - 创建任务
    if (req.method === 'POST' && path === '/api/qwen/videos/generations') {
      const b = await readBody(req)
      const model = b.model || 'wan2.6-r2v-flash'
      
      const payload = {
        model: model,
        prompt: b.prompt,
        negative_prompt: b.negative_prompt || '',
        size: b.size || '1280x720',
        duration: b.duration || 5,
        fps: b.fps || 30,
        seed: b.seed,
      }

      const r = await proxyFetch(
        QWEN_BASE_URL,
        QWEN_API_KEY,
        '/services/aigc/video-generation/video-synthesis',
        'POST',
        {
          model: payload.model,
          input: { prompt: payload.prompt, negative_prompt: payload.negative_prompt },
          parameters: {
            size: payload.size,
            duration: payload.duration,
            fps: payload.fps,
            seed: payload.seed
          }
        }
      )

      if (!r.ok) {
        sendJson(res, r.status, { error: 'QWEN_VIDEO_API_ERROR', data: r.data })
        return
      }

      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // 获取任务状态（图片或视频）
    if (req.method === 'GET' && path.startsWith('/api/qwen/tasks/')) {
      const taskId = path.split('/').pop() || ''
      
      const r = await proxyFetch(
        QWEN_BASE_URL,
        QWEN_API_KEY,
        `/tasks/${taskId}`,
        'GET'
      )

      if (!r.ok) {
        sendJson(res, r.status, { error: 'QWEN_TASK_API_ERROR', data: r.data })
        return
      }

      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // 视觉模型 - 图片理解
    if (req.method === 'POST' && path === '/api/qwen/vision/chat/completions') {
      const b = await readBody(req)
      const model = b.model || 'qwen-image-2.0'
      
      const payload = {
        model: model,
        messages: b.messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
      }

      const r = await proxyFetch(
        QWEN_BASE_URL,
        QWEN_API_KEY,
        '/services/aigc/multimodal-generation/generation',
        'POST',
        {
          model: payload.model,
          input: { messages: payload.messages },
          parameters: {
            max_tokens: payload.max_tokens || 2000,
            temperature: payload.temperature ?? 0.7,
            top_p: payload.top_p ?? 0.9,
          }
        }
      )

      if (!r.ok) {
        sendJson(res, r.status, { error: 'QWEN_VISION_API_ERROR', data: r.data })
        return
      }

      const transformedResponse = {
        id: r.data.output?.request_id || `qwen-vision-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: payload.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: r.data.output?.text || r.data.output?.choices?.[0]?.message?.content || ''
          },
          finish_reason: 'stop'
        }],
        usage: r.data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      }

      sendJson(res, 200, { ok: true, data: transformedResponse })
      return
    }

    // 获取可用模型列表
    if (req.method === 'GET' && path === '/api/qwen/models') {
      sendJson(res, 200, { 
        ok: true, 
        data: MODELS 
      })
      return
    }

    sendJson(res, 404, { error: 'NOT_FOUND', message: 'Qwen API endpoint not found' })
  } catch (e) {
    console.error('Qwen API error:', e)
    sendJson(res, 500, { error: 'QWEN_SERVER_ERROR', message: e?.message || 'UNKNOWN' })
  }
}

// Kimi API proxy
async function handleKimiRequest(req, res, path) {
  if (!KIMI_API_KEY) {
    sendJson(res, 500, { error: 'KIMI_API_KEY_MISSING', message: 'Kimi API密钥未配置' })
    return
  }

  try {
    if (req.method === 'POST' && path === '/api/kimi/chat/completions') {
      const b = await readBody(req)
      const payload = {
        model: b.model || 'moonshot-v1-8k',
        messages: b.messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: b.stream
      }

      const r = await proxyFetch(KIMI_BASE_URL, KIMI_API_KEY, '/chat/completions', 'POST', payload)

      if (!r.ok) {
        sendJson(res, r.status, { error: 'KIMI_API_ERROR', data: r.data })
        return
      }

      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    sendJson(res, 404, { error: 'NOT_FOUND', message: 'Kimi API endpoint not found' })
  } catch (e) {
    console.error('Kimi API error:', e)
    sendJson(res, 500, { error: 'KIMI_SERVER_ERROR', message: e?.message || 'UNKNOWN' })
  }
}

// DeepSeek API proxy
async function handleDeepseekRequest(req, res, path) {
  if (!DEEPSEEK_API_KEY) {
    sendJson(res, 500, { error: 'DEEPSEEK_API_KEY_MISSING', message: 'DeepSeek API密钥未配置' })
    return
  }

  try {
    if (req.method === 'POST' && path === '/api/deepseek/chat/completions') {
      const b = await readBody(req)
      const payload = {
        model: b.model || 'deepseek-chat',
        messages: b.messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: b.stream
      }

      const r = await proxyFetch(DEEPSEEK_BASE_URL, DEEPSEEK_API_KEY, '/chat/completions', 'POST', payload)

      if (!r.ok) {
        sendJson(res, r.status, { error: 'DEEPSEEK_API_ERROR', data: r.data })
        return
      }

      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    sendJson(res, 404, { error: 'NOT_FOUND', message: 'DeepSeek API endpoint not found' })
  } catch (e) {
    console.error('DeepSeek API error:', e)
    sendJson(res, 500, { error: 'DEEPSEEK_SERVER_ERROR', message: e?.message || 'UNKNOWN' })
  }
}

// Analytics endpoint
async function handleAnalyticsRequest(req, res, path) {
  if (req.method === 'POST' && path === '/api/analytics/pageview') {
    sendJson(res, 200, { ok: true, message: 'Analytics received' })
    return
  }

  if (req.method === 'POST' && path === '/api/analytics/event') {
    sendJson(res, 200, { ok: true, message: 'Event received' })
    return
  }

  sendJson(res, 404, { error: 'NOT_FOUND' })
}

// Health check
async function handleHealthRequest(req, res, path) {
  if (req.method === 'GET' && path === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      status: 'healthy',
      services: {
        qwen: !!QWEN_API_KEY,
        kimi: !!KIMI_API_KEY,
        deepseek: !!DEEPSEEK_API_KEY
      },
      models: MODELS,
      timestamp: new Date().toISOString()
    })
    return
  }

  sendJson(res, 404, { error: 'NOT_FOUND' })
}

const server = http.createServer(async (req, res) => {
  setCors(res)
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return }

  const u = new URL(req.url, `http://localhost:${PORT}`)
  const path = u.pathname

  console.log(`[${new Date().toISOString()}] ${req.method} ${path}`)

  try {
    if (path.startsWith('/api/qwen')) {
      await handleQwenRequest(req, res, path)
      return
    }

    if (path.startsWith('/api/kimi')) {
      await handleKimiRequest(req, res, path)
      return
    }

    if (path.startsWith('/api/deepseek')) {
      await handleDeepseekRequest(req, res, path)
      return
    }

    if (path.startsWith('/api/analytics')) {
      await handleAnalyticsRequest(req, res, path)
      return
    }

    if (path.startsWith('/api/health')) {
      await handleHealthRequest(req, res, path)
      return
    }

    sendJson(res, 404, { error: 'NOT_FOUND', message: `Endpoint ${path} not found` })
  } catch (e) {
    console.error('Server error:', e)
    sendJson(res, 500, { error: 'SERVER_ERROR', message: e?.message || 'UNKNOWN' })
  }
})

server.listen(PORT, () => {
  console.log(`Local API server listening on http://localhost:${PORT}`)
  console.log('Supported APIs:')
  console.log('  - Qwen (通义千问): /api/qwen/*')
  console.log('    * 文本对话: POST /api/qwen/chat/completions')
  console.log('    * 视觉理解: POST /api/qwen/vision/chat/completions')
  console.log('    * 图片生成: POST /api/qwen/images/generations')
  console.log('    * 视频生成: POST /api/qwen/videos/generations')
  console.log('    * 任务查询: GET /api/qwen/tasks/{taskId}')
  console.log('    * 模型列表: GET /api/qwen/models')
  console.log('  - Kimi: /api/kimi/*')
  console.log('  - DeepSeek: /api/deepseek/*')
  console.log('  - Analytics: /api/analytics/*')
  console.log('  - Health: /api/health')
})
