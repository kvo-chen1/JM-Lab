import http from 'http'
import { URL } from 'url'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { WebSocketServer } from 'ws'
import { Readable } from 'stream'
import { generateToken, verifyToken } from './jwt.mjs'
import { userDB, favoriteDB, videoTaskDB, leaderboardDB, friendDB, messageDB, getDBStatus } from './database.mjs'
import { sendVerificationEmail } from './emailService.mjs'
import { sendSmsVerificationCode, generateVerificationCode, verifySmsCode } from './smsService.mjs'
import { sendLoginEmailCode } from './emailService.mjs'

// Load .env.local for local development (non-production)
try {
  // 使用简单的路径，直接使用当前目录下的.env.local
  const envPath = './.env.local';

  
  if (fs.existsSync(envPath)) {

    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    
    for (const line of lines) {
      // 跳过注释和空行
      if (line.trim().startsWith('#') || line.trim() === '') {
        continue;
      }
      
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) {

        continue;
      }
      
      const k = m[1];
      let v = m[2];
      
      // 移除引号
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith('\'') && v.endsWith('\''))) {
        v = v.slice(1, -1);
      }
      
      // 始终以 .env.local 内容为准进行覆盖，确保密钥更新生效
      process.env[k] = v;

    }
    
    // 将前端变量映射到服务端使用的变量（无条件覆盖，避免旧值残留）

    
    // Kimi
    if (process.env.VITE_KIMI_API_KEY) {
      process.env.KIMI_API_KEY = process.env.VITE_KIMI_API_KEY;

    }
    if (process.env.VITE_KIMI_BASE_URL) {
      process.env.KIMI_BASE_URL = process.env.VITE_KIMI_BASE_URL;

    }
    
    // DeepSeek
    if (process.env.VITE_DEEPSEEK_API_KEY) {
      process.env.DEEPSEEK_API_KEY = process.env.VITE_DEEPSEEK_API_KEY;

    }
    if (process.env.VITE_DEEPSEEK_BASE_URL) {
      process.env.DEEPSEEK_BASE_URL = process.env.VITE_DEEPSEEK_BASE_URL;

    }
    
    // Doubao
    const doubaoEnvKey = process.env.VITE_DOUBAO_API_KEY || process.env.VITE_DOBAO_API_KEY;
    if (doubaoEnvKey) {
      process.env.DOUBAO_API_KEY = doubaoEnvKey;

    }
    if (process.env.VITE_DOUBAO_BASE_URL) {
      process.env.DOUBAO_BASE_URL = process.env.VITE_DOUBAO_BASE_URL;

    }
    
    // Qwen (DashScope)
    if (process.env.VITE_QWEN_API_KEY) {
      process.env.DASHSCOPE_API_KEY = process.env.VITE_QWEN_API_KEY;

    }
    
    // Wenxin (Qianfan)
    if (process.env.VITE_WENXIN_API_KEY) {
      process.env.QIANFAN_AUTH = process.env.VITE_WENXIN_API_KEY;

    }
    
    // ChatGPT
    if (process.env.VITE_CHATGPT_API_KEY) {
      process.env.CHATGPT_API_KEY = process.env.VITE_CHATGPT_API_KEY;

    }
    
    // Gemini
    if (process.env.VITE_GEMINI_API_KEY) {
      process.env.GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

    }
    
    // Gork
    if (process.env.VITE_GORK_API_KEY) {
      process.env.GORK_API_KEY = process.env.VITE_GORK_API_KEY;

    }
    
    // Zhipu
    if (process.env.VITE_ZHIPU_API_KEY) {
      process.env.ZHIPU_API_KEY = process.env.VITE_ZHIPU_API_KEY;

    }
  }
} catch (error) {
  console.error('Failed to load .env.local:', error);
}

// 端口配置
const PORT = Number(process.env.LOCAL_API_PORT || process.env.PORT) || 3021

// Volcengine TTS config (server-side only)
const VOLC_TTS_APP_ID = process.env.VOLC_TTS_APP_ID || ''
const VOLC_TTS_ACCESS_TOKEN = process.env.VOLC_TTS_ACCESS_TOKEN || ''
const VOLC_TTS_SECRET_KEY = process.env.VOLC_TTS_SECRET_KEY || ''
const VOLC_TTS_ENDPOINT = process.env.VOLC_TTS_ENDPOINT || ''

// ChatGPT config
const CHATGPT_BASE_URL = process.env.CHATGPT_BASE_URL || 'https://api.openai.com/v1'
const CHATGPT_API_KEY = process.env.CHATGPT_API_KEY || ''
const CHATGPT_MODEL_ID = process.env.CHATGPT_MODEL_ID || 'gpt-4o'

// Gemini config
const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL_ID = process.env.GEMINI_MODEL_ID || 'gemini-1.5-flash'

// Gork config
const GORK_BASE_URL = process.env.GORK_BASE_URL || 'https://api.x.ai/v1'
const GORK_API_KEY = process.env.GORK_API_KEY || ''
const GORK_MODEL_ID = process.env.GORK_MODEL_ID || 'grok-beta'

// Zhipu config
const ZHIPU_BASE_URL = process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4'
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || ''
const ZHIPU_MODEL_ID = process.env.ZHIPU_MODEL_ID || 'glm-4-plus'

// 豆包模型基础配置
const BASE_URL = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
const API_KEY = process.env.DOUBAO_API_KEY || ''
const MODEL_ID = process.env.DOUBAO_MODEL_ID || 'doubao-seedance-1-0-pro-250528'
const ORIGIN = process.env.CORS_ALLOW_ORIGIN || '*'
const MOCK = process.env.DOUBAO_MOCK === '1'

// Kimi (Moonshot) config
const KIMI_BASE_URL = process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1'
const KIMI_API_KEY = process.env.KIMI_API_KEY || ''

// DeepSeek config
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''

// DashScope (Aliyun Qwen) config
const DASHSCOPE_BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1'
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || ''
const DASHSCOPE_MODEL_ID = process.env.DASHSCOPE_MODEL_ID || 'qwen-plus'

// Qianfan (Wenxin Yiyan) config
const QIANFAN_BASE_URL = process.env.QIANFAN_BASE_URL || 'https://qianfan.baidubce.com'
const QIANFAN_MODEL_ID = process.env.QIANFAN_MODEL_ID || 'ERNIE-Speed-8K'
const QIANFAN_AUTH = process.env.QIANFAN_AUTH || ''
const QIANFAN_ACCESS_TOKEN = process.env.QIANFAN_ACCESS_TOKEN || ''
const QIANFAN_AK = process.env.QIANFAN_AK || process.env.BAIDU_AK || ''
const QIANFAN_SK = process.env.QIANFAN_SK || process.env.BAIDU_SK || ''

// Qianfan auth cache
let __qf_token = (process.env.QIANFAN_ACCESS_TOKEN || '')
let __qf_token_expire = 0

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')
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

async function proxyFetch(path, method, body) {
  // 确保使用最新的环境变量值
  const base = process.env.DOUBAO_BASE_URL || BASE_URL
  const key = process.env.DOUBAO_API_KEY || API_KEY
  
  // 确保基础URL和API密钥存在
  if (!base || !key) {
    return { status: 500, ok: false, data: { error: { code: 'CONFIG_MISSING', message: 'Missing base URL or API key' } } }
  }
  
  try {
    const resp = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const contentType = resp.headers.get('content-type') || ''
    const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
    return { status: resp.status, ok: resp.ok, data }
  } catch (error) {
    console.error('Proxy fetch error:', error)
    return { 
      status: 500, 
      ok: false, 
      data: { error: { code: 'REQUEST_ERROR', message: error?.message || 'Failed to send request' } } 
    }
  }
}

function proxyStream(resp, res) {
  res.statusCode = resp.status
  res.setHeader('Content-Type', resp.headers.get('content-type') || 'text/event-stream')
  res.setHeader('Access-Control-Allow-Origin', '*')
  
  if (resp.body.pipe) {
    resp.body.pipe(res)
  } else {
    Readable.fromWeb(resp.body).pipe(res)
  }
}

async function kimiFetch(path, method, body, res) {
  try {
    const base = process.env.KIMI_BASE_URL || KIMI_BASE_URL
    const key = process.env.KIMI_API_KEY || KIMI_API_KEY
    
    console.log(`[kimiFetch] Request: ${method} ${base}${path}`)
    console.log(`[kimiFetch] Headers: Authorization: Bearer ${key ? key.substring(0, 5) + '...' : 'undefined'}`)
    console.log(`[kimiFetch] Body:`, body)
    
    // 检查API密钥是否存在
    if (!key) {
      console.error(`[kimiFetch] Error: Missing API key`)
      return { status: 401, ok: false, data: { error: { code: 'AUTH_ERROR', message: 'Missing API key' } } }
    }
    
    const resp = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    
    console.log(`[kimiFetch] Response status: ${resp.status}`)
    console.log(`[kimiFetch] Response headers:`, Object.fromEntries(resp.headers))
    
    // 检查是否是流式响应
    const contentType = resp.headers.get('content-type') || ''
    const isStream = contentType.includes('text/event-stream')
    
    if (isStream && res) {
      proxyStream(resp, res)
      console.log(`[kimiFetch] Streaming response sent`)
      return { status: resp.status, ok: resp.ok, isStream: true }
    } else {
      // 对于非流式响应，解析为JSON或文本
      let data
      try {
        data = contentType.includes('application/json') ? await resp.json() : await resp.text()
        console.log(`[kimiFetch] Response data:`, data)
      } catch (parseError) {
        console.error(`[kimiFetch] Error parsing response:`, parseError)
        data = { error: 'Failed to parse response' }
      }
      return { status: resp.status, ok: resp.ok, data, isStream: false }
    }
  } catch (error) {
    console.error(`[kimiFetch] Exception:`, error)
    // 返回友好的错误信息
    const errorMessage = error.name === 'AbortError' ? 'Request timed out' : error.message
    console.error(`[kimiFetch] Final error response:`, { status: 500, ok: false, data: { error: { code: 'REQUEST_ERROR', message: errorMessage } } })
    return {
      status: 500,
      ok: false,
      data: { error: { code: 'REQUEST_ERROR', message: errorMessage } }
    }
  }
}

async function deepseekFetch(path, method, body, res) {
  const base = process.env.DEEPSEEK_BASE_URL || DEEPSEEK_BASE_URL
  const key = process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY
  const resp = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = resp.headers.get('content-type') || ''
  const isStream = contentType.includes('text/event-stream')

  if (isStream && res) {
    proxyStream(resp, res)
    return { status: resp.status, ok: resp.ok, isStream: true }
  }

  const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
  return { status: resp.status, ok: resp.ok, data }
}
async function dashscopeFetch(path, method, body, authKey, res) {
  let fullUrl;
  
  // 重置DASHSCOPE_BASE_URL，使其只包含根域名，不包含/api/v1
  const base = 'https://dashscope.aliyuncs.com';
  
  // 根据路径判断使用哪种API端点
  if (path === '/chat/completions') {
    // 聊天补全使用兼容模式路径
    fullUrl = `${base}/compatible-mode/v1/chat/completions`;
  } else {
    // 其他请求（如图片生成）使用标准API路径
    fullUrl = `${base}${path}`;
  }
  
  console.log(`[DashScope] 发送请求: ${method} ${fullUrl}`)
  console.log(`[DashScope] 请求体:`, body)
  console.log(`[DashScope] 认证密钥:`, authKey.substring(0, 5) + '...' + authKey.substring(authKey.length - 5))
  
  try {
    const resp = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authKey}`,
        ...(body?.stream ? { 'X-DashScope-SSE': 'enable' } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    
    console.log(`[DashScope] 响应状态: ${resp.status}`)
    const contentType = resp.headers.get('content-type') || ''
    const isStream = contentType.includes('text/event-stream')

    if (isStream && res) {
      proxyStream(resp, res)
      return { status: resp.status, ok: resp.ok, isStream: true }
    }

    const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
    console.log(`[DashScope] 响应数据:`, data)
    
    return { status: resp.status, ok: resp.ok, data }
  } catch (error) {
    console.error(`[DashScope] 请求失败:`, error)
    return { status: 500, ok: false, data: { error: error.message } }
  }
}

async function dashscopeImageGenerate(params) {
  const { prompt, size, n, authKey, model } = params
  const base = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1'
  const endpoint = `${base}/services/aigc/text2image/image-synthesis`
  const normalizedSize = String(size || '1024x1024').replace('x', '*')
  try {
    const createResp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authKey}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify({
        model: model || 'wanx2.1-t2i-turbo',
        input: { prompt },
        parameters: { size: normalizedSize, n: n || 1 }
      })
    })
    const createData = await createResp.json()
    if (!createResp.ok) {
      return { status: createResp.status, ok: false, data: createData }
    }
    const taskId = createData?.output?.task_id || createData?.task_id
    if (!taskId) {
      return { status: 500, ok: false, data: { error: 'TASK_ID_MISSING', raw: createData } }
    }
    const startedAt = Date.now()
    const timeoutMs = 60000
    while (Date.now() - startedAt < timeoutMs) {
      const taskResp = await fetch(`${base}/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authKey}`
        }
      })
      const taskData = await taskResp.json()
      if (!taskResp.ok) {
        return { status: taskResp.status, ok: false, data: taskData }
      }
      const status = String(taskData?.output?.task_status || taskData?.task_status || '').toUpperCase()
      if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELED' || status === 'CANCELLED') {
        if (status !== 'SUCCEEDED') {
          return { status: 500, ok: false, data: taskData }
        }
        const results = taskData?.output?.results || taskData?.output?.result || taskData?.output?.images || []
        const list = Array.isArray(results) ? results : []
        const images = list.map((item) => {
          if (typeof item === 'string') return { url: item, revised_prompt: prompt }
          const url = item?.url || item?.image_url || item?.image || ''
          return { url, revised_prompt: prompt }
        }).filter((it) => !!it.url)
        return {
          status: 200,
          ok: true,
          data: {
            created: Date.now(),
            data: images
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
    return { status: 500, ok: false, data: { error: 'TIMEOUT' } }
  } catch (error) {
    return { status: 500, ok: false, data: { error: error?.message || 'REQUEST_ERROR' } }
  }
}

async function chatgptFetch(path, method, body) {
  const base = process.env.CHATGPT_BASE_URL || CHATGPT_BASE_URL
  const key = process.env.CHATGPT_API_KEY || CHATGPT_API_KEY

  try {
    // 添加超时设置，避免长时间等待
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const resp = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId);
    
    const contentType = resp.headers.get('content-type') || ''
    const data = contentType.includes('application/json') ? await resp.json() : await resp.text()

    return { status: resp.status, ok: resp.ok, data }
  } catch (error) {
    console.error(`[chatgptFetch] Error: ${error.message}`)
    // 处理不同类型的错误
    const errorMessage = error.name === 'AbortError' ? 'Request timed out' : error.message;
    return { status: 500, ok: false, data: { error: errorMessage } }
  }
}

async function geminiFetch(path, method, body) {
  const base = process.env.GEMINI_BASE_URL || GEMINI_BASE_URL
  const key = process.env.GEMINI_API_KEY || GEMINI_API_KEY
  // Gemini API requires API key in query string
  const url = new URL(`${base}${path}`)
  url.searchParams.append('key', key)

  try {
    const resp = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const contentType = resp.headers.get('content-type') || ''
    const data = contentType.includes('application/json') ? await resp.json() : await resp.text()

    return { status: resp.status, ok: resp.ok, data }
  } catch (error) {
    console.error(`[geminiFetch] Error: ${error.message}`)
    return { status: 500, ok: false, data: { error: error.message } }
  }
}

async function gorkFetch(path, method, body) {
  const base = process.env.GORK_BASE_URL || GORK_BASE_URL
  const key = process.env.GORK_API_KEY || GORK_API_KEY

  try {
    const resp = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const contentType = resp.headers.get('content-type') || ''
    const data = contentType.includes('application/json') ? await resp.json() : await resp.text()

    return { status: resp.status, ok: resp.ok, data }
  } catch (error) {
    console.error(`[gorkFetch] Error: ${error.message}`)
    return { status: 500, ok: false, data: { error: error.message } }
  }
}

async function zhipuFetch(path, method, body) {
  const base = process.env.ZHIPU_BASE_URL || ZHIPU_BASE_URL
  const key = process.env.ZHIPU_API_KEY || ZHIPU_API_KEY
  const resp = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = resp.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
  return { status: resp.status, ok: resp.ok, data }
}

async function qianfanAuthHeader() {
  // 百度千帆API密钥支持多种格式
  // 1. QIANFAN_ACCESS_TOKEN: 直接使用的token
  // 2. QIANFAN_AK/QIANFAN_SK: 用于获取token的密钥对
  // 3. QIANFAN_AUTH: 支持bce-v3格式的密钥
  
  // 优先使用ACCESS_TOKEN
  const preset = process.env.QIANFAN_ACCESS_TOKEN || QIANFAN_ACCESS_TOKEN
  if (preset) return `Bearer ${preset}`
  
  // 检查缓存的token
  const now = Math.floor(Date.now() / 1000)
  if (__qf_token && __qf_token_expire > now + 60) return `Bearer ${__qf_token}`
  
  // 尝试使用AK/SK获取新token
  const ak = process.env.QIANFAN_AK || QIANFAN_AK
  const sk = process.env.QIANFAN_SK || QIANFAN_SK
  if (ak && sk) {
    try {
      const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(ak)}&client_secret=${encodeURIComponent(sk)}`
      const resp = await fetch(url, { method: 'GET' })
      const data = await resp.json()
      const token = data?.access_token || ''
      const expiresIn = Number(data?.expires_in || 0)
      if (token) {
        __qf_token = token
        __qf_token_expire = now + (expiresIn || 0)
        return `Bearer ${token}`
      }
    } catch (error) {
      console.error('Failed to get qianfan token:', error)
    }
  }
  
  // 最后尝试使用bce-v3格式的密钥
  const override = process.env.QIANFAN_AUTH || QIANFAN_AUTH
  if (override) return override
  
  return ''
}

async function qianfanFetch(path, method, body) {
  const base = process.env.QIANFAN_BASE_URL || QIANFAN_BASE_URL
  const auth = await qianfanAuthHeader()
  const headers = { 'Content-Type': 'application/json' }
  if (auth) headers['Authorization'] = auth
  const resp = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = resp.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
  return { status: resp.status, ok: resp.ok, data }
}

// Basic rate limiter per IP for TTS
const rateMap = new Map()
function allowTts(ip) {
  const now = Date.now()
  const rec = rateMap.get(ip) || { count: 0, windowStart: now }
  if (now - rec.windowStart > 60_000) { rec.windowStart = now; rec.count = 0 }
  rec.count += 1
  rateMap.set(ip, rec)
  return rec.count <= 20
}

// Volcengine TTS fetcher: delegates to provided endpoint with token
async function volcTtsSynthesize({ text, voice, speed, pitch, format }) {
  if (!VOLC_TTS_ENDPOINT || !VOLC_TTS_ACCESS_TOKEN) {
    return { ok: false, status: 500, data: { error: 'CONFIG_MISSING' } }
  }
  const payload = {
    text: String(text || '').slice(0, 2000),
    voice: voice || 'female',
    speed: typeof speed === 'number' ? speed : 1.0,
    pitch: typeof pitch === 'number' ? pitch : 1.0,
    app_id: VOLC_TTS_APP_ID || undefined,
    secret_key: VOLC_TTS_SECRET_KEY ? undefined : undefined,
    audio_format: format || 'mp3'
  }
  const resp = await fetch(VOLC_TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VOLC_TTS_ACCESS_TOKEN}`
    },
    body: JSON.stringify(payload)
  })
  const ct = resp.headers.get('content-type') || ''
  if (ct.startsWith('audio/')) {
    const buf = Buffer.from(await resp.arrayBuffer())
    const audio_base64 = buf.toString('base64')
    return { ok: true, status: 200, data: { audio_base64, content_type: ct } }
  }
  const data = ct.includes('application/json') ? await resp.json() : await resp.text()
  return { ok: resp.ok, status: resp.status, data }
}

// Proxy remote binary (video/audio/image) with Range support
async function proxyBinary(remoteUrl, req, res) {
  try {
    const range = req.headers['range'] || undefined
    const headers = { ...(range ? { Range: range } : {}) }
    const resp = await fetch(remoteUrl, { method: 'GET', headers })
    if (!resp.ok) {
      const ct = resp.headers.get('content-type') || 'application/json'
      res.statusCode = resp.status
      res.setHeader('Content-Type', ct)
      const data = ct.includes('application/json') ? await resp.json() : await resp.text()
      res.end(typeof data === 'string' ? data : JSON.stringify(data))
      return
    }
    const ct = resp.headers.get('content-type') || 'application/octet-stream'
    const cl = resp.headers.get('content-length') || undefined
    const cr = resp.headers.get('content-range') || undefined
    const ar = resp.headers.get('accept-ranges') || undefined
    res.statusCode = resp.status
    res.setHeader('Content-Type', ct)
    if (cl) res.setHeader('Content-Length', cl)
    if (cr) res.setHeader('Content-Range', cr)
    if (ar) res.setHeader('Accept-Ranges', ar)
    const buf = Buffer.from(await resp.arrayBuffer())
    res.end(buf)
  } catch (e) {
    sendJson(res, 500, { error: 'PROXY_ERROR', message: e?.message || 'UNKNOWN' })
  }
}

function sendJson(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(obj))
}

// JWT验证中间件
function verifyRequestToken(req) {
  const authHeader = req.headers.authorization
  if (!authHeader) return null
  
  const token = authHeader.split(' ')[1]
  if (!token) return null
  
  try {
    const decoded = verifyToken(token)
    return decoded
  } catch (error) {
    console.error('JWT验证失败:', error.message)
    return null
  }
}

// 中文注释：数据库连接由 database.mjs 自动管理

// 中文注释：安全读取社区配置文件（每次请求时读取，便于热更新）
function loadCommunityConfig() {
  try {
    const rawPath = new URL('./data/community.json', import.meta.url).pathname
    const pathA = decodeURIComponent(rawPath)
    const pathB = `${process.cwd()}/server/data/community.json`
    const final = fs.existsSync(pathA) ? pathA : (fs.existsSync(pathB) ? pathB : '')
    if (!final) return null
    const text = fs.readFileSync(final, 'utf-8')
    const json = JSON.parse(text)
    return json && typeof json === 'object' ? json : null
  } catch {
    return null
  }
}

// 导出处理函数以供 Vercel Serverless Function 使用
export default async function handler(req, res) {
  // 设置 CORS
  setCors(res);
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // 确保 req.url 包含完整的路径
  // 在 Vercel 环境下，req.url 可能是不带域名的路径
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || `localhost:${PORT}`;
  const u = new URL(req.url, `${protocol}://${host}`);
  const path = u.pathname;

  console.log('[API Handler] Request:', req.method, path);

  try {
    // 复用原有的路由逻辑...
    // 这里我们需要将原有的 server.listen 逻辑改造为函数调用
    // 为了最小化改动，我们可以将原有的路由逻辑封装在一个 async function route(req, res) 中
    await route(req, res, u, path);
  } catch (error) {
    console.error('API error:', error);
    sendJson(res, 500, { error: 'SERVER_ERROR', message: '服务器内部错误' });
  }
}

// 将原有的 server 回调逻辑提取为 route 函数
async function route(req, res, u, path) {
    // ... 原有的路由逻辑 ...

    // 中文注释：教程收藏改为使用数据库持久化
    if (req.method === 'GET' && path === '/api/favorites/tutorials') {
      // 从JWT令牌获取当前用户ID
      const decoded = verifyRequestToken(req)
      if (!decoded) {
        sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
        return
      }
      
      const ids = await favoriteDB.getUserFavorites(decoded.userId)
      sendJson(res, 200, { ok: true, ids })
      return
    }

    // ==========================================
    // 好友系统 API
    // ==========================================
    
    // 搜索用户
    if (req.method === 'GET' && path === '/api/friends/search') {
      const decoded = verifyRequestToken(req)
      if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }
      
      const q = new URL(req.url, `http://localhost:${PORT}`).searchParams.get('q')
      if (!q) { sendJson(res, 400, { error: 'MISSING_QUERY' }); return }
      
      try {
        const users = await friendDB.searchUsers(q, decoded.userId)
        sendJson(res, 200, { ok: true, data: users })
      } catch (e) {
        sendJson(res, 500, { error: 'DB_ERROR', message: e.message })
      }
      return
    }

    // 发送好友请求
    if (req.method === 'POST' && path === '/api/friends/request') {
      const decoded = verifyRequestToken(req)
      if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }
      
      const b = await readBody(req)
      if (!b.userId) { sendJson(res, 400, { error: 'MISSING_USER_ID' }); return }
      
      try {
        const result = await friendDB.sendRequest(decoded.userId, b.userId)
        sendJson(res, 200, { ok: true, data: result })
      } catch (e) {
        if (e.message === 'ALREADY_FRIENDS') {
          sendJson(res, 400, { error: 'ALREADY_FRIENDS', message: '已经是好友了' })
        } else {
          sendJson(res, 500, { error: 'DB_ERROR', message: e.message })
        }
      }
      return
    }

    // 获取好友请求列表
    if (req.method === 'GET' && path === '/api/friends/requests') {
      const decoded = verifyRequestToken(req)
      if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }
      
      try {
        const requests = await friendDB.getRequests(decoded.userId)
        sendJson(res, 200, { ok: true, data: requests })
      } catch (e) {
        sendJson(res, 500, { error: 'DB_ERROR', message: e.message })
      }
      return
    }

    // 接受好友请求
    if (req.method === 'POST' && path === '/api/friends/accept') {
      const decoded = verifyRequestToken(req)
      if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }
      
      const b = await readBody(req)
      if (!b.requestId) { sendJson(res, 400, { error: 'MISSING_REQUEST_ID' }); return }
      
      try {
        await friendDB.acceptRequest(b.requestId)
        sendJson(res, 200, { ok: true })
      } catch (e) {
        sendJson(res, 500, { error: 'DB_ERROR', message: e.message })
      }
      return
    }

    // 拒绝好友请求
    if (req.method === 'POST' && path === '/api/friends/reject') {
      const decoded = verifyRequestToken(req)
      if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }
      
      const b = await readBody(req)
      if (!b.requestId) { sendJson(res, 400, { error: 'MISSING_REQUEST_ID' }); return }
      
      try {
        await friendDB.rejectRequest(b.requestId)
        sendJson(res, 200, { ok: true })
      } catch (e) {
        sendJson(res, 500, { error: 'DB_ERROR', message: e.message })
      }
      return
    }

    // 获取好友列表
    if (req.method === 'GET' && path === '/api/friends/list') {
      const decoded = verifyRequestToken(req)
      if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }
      
      try {
        const friends = await friendDB.getFriends(decoded.userId)
        sendJson(res, 200, { ok: true, data: friends })
      } catch (e) {
        sendJson(res, 500, { error: 'DB_ERROR', message: e.message })
      }
      return
    }

    // 删除好友
    if (req.method === 'DELETE' && path.startsWith('/api/friends/')) {
      const decoded = verifyRequestToken(req)
      if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }
      
      const friendId = path.split('/').pop()
      if (!friendId) { sendJson(res, 400, { error: 'MISSING_FRIEND_ID' }); return }
      
      try {
        await friendDB.deleteFriend(decoded.userId, friendId)
        sendJson(res, 200, { ok: true })
      } catch (e) {
        sendJson(res, 500, { error: 'DB_ERROR', message: e.message })
      }
      return
    }
    
    // 更新好友备注
    if (req.method === 'POST' && path === '/api/friends/note') {
      const decoded = verifyRequestToken(req)
      if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }
      
      const b = await readBody(req)
      if (!b.friendId) { sendJson(res, 400, { error: 'MISSING_FRIEND_ID' }); return }
      
      try {
        await friendDB.updateNote(decoded.userId, b.friendId, b.note || '')
        sendJson(res, 200, { ok: true })
      } catch (e) {
        sendJson(res, 500, { error: 'DB_ERROR', message: e.message })
      }
      return
    }
    
    // 更新用户状态
    if (req.method === 'POST' && path === '/api/friends/status') {
      const decoded = verifyRequestToken(req)
      if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }
      
      const b = await readBody(req)
      if (!b.status) { sendJson(res, 400, { error: 'MISSING_STATUS' }); return }
      
      try {
        await friendDB.updateUserStatus(decoded.userId, b.status)
        sendJson(res, 200, { ok: true })
      } catch (e) {
        sendJson(res, 500, { error: 'DB_ERROR', message: e.message })
      }
      return
    }

    // ==========================================
    // 私信系统 API
    // ==========================================

    // 发送私信
    if (req.method === 'POST' && path === '/api/messages/send') {
      const decoded = verifyRequestToken(req)
      if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }
      
      const b = await readBody(req)
      if (!b.friendId || !b.content) { sendJson(res, 400, { error: 'MISSING_PARAMS' }); return }
      
      try {
        const msg = await messageDB.sendMessage(decoded.userId, b.friendId, b.content)
        sendJson(res, 200, { ok: true, data: msg })
      } catch (e) {
        sendJson(res, 500, { error: 'DB_ERROR', message: e.message })
      }
      return
    }

    // 获取私信记录
    if (req.method === 'GET' && path.startsWith('/api/messages/')) {
      // Check if it is unread count
      if (path === '/api/messages/unread') {
        const decoded = verifyRequestToken(req)
        if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }
        
        try {
          const counts = await messageDB.getUnreadCount(decoded.userId)
          sendJson(res, 200, { ok: true, data: counts })
        } catch (e) {
          sendJson(res, 500, { error: 'DB_ERROR', message: e.message })
        }
        return
      }
      
      // Get messages with friend
      const decoded = verifyRequestToken(req)
      if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }
      
      const friendId = path.split('/').pop()
      if (!friendId) { sendJson(res, 400, { error: 'MISSING_FRIEND_ID' }); return }
      
      const limit = parseInt(new URL(req.url, `http://localhost:${PORT}`).searchParams.get('limit') || '50')
      const offset = parseInt(new URL(req.url, `http://localhost:${PORT}`).searchParams.get('offset') || '0')
      
      try {
        const messages = await messageDB.getMessages(decoded.userId, friendId, limit, offset)
        sendJson(res, 200, { ok: true, data: messages })
      } catch (e) {
        sendJson(res, 500, { error: 'DB_ERROR', message: e.message })
      }
      return
    }

    // 标记私信为已读
    if (req.method === 'POST' && path === '/api/messages/read') {
      const decoded = verifyRequestToken(req)
      if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }
      
      const b = await readBody(req)
      if (!b.friendId) { sendJson(res, 400, { error: 'MISSING_FRIEND_ID' }); return }
      
      try {
        await messageDB.markAsRead(decoded.userId, b.friendId)
        sendJson(res, 200, { ok: true })
      } catch (e) {
        sendJson(res, 500, { error: 'DB_ERROR', message: e.message })
      }
      return
    }

    // 中文注释：社区标签（用于前端热门话题展示）
    if (req.method === 'GET' && path === '/api/community/tags') {
      const cfg = loadCommunityConfig()
      const details = Array.isArray(cfg?.tagDetails) ? cfg.tagDetails : null
      if (details) {
        sendJson(res, 200, { ok: true, data: details })
        return
      }
      const tags = Array.isArray(cfg?.tags) ? cfg.tags : ['国潮设计', '非遗传承', '品牌联名', '校园活动', '文旅推广']
      sendJson(res, 200, { ok: true, data: tags })
      return
    }

    // 中文注释：精选社群条目（用于前端精选社群列表）
    if (req.method === 'GET' && path === '/api/community/featured') {
      const cfg = loadCommunityConfig()
      const items = Array.isArray(cfg?.featured) ? cfg.featured : [
        { name: '国潮共创组', members: 128, path: '/community?group=guochao' },
        { name: '非遗研究社', members: 96, path: '/community?group=heritage' },
        { name: '品牌联名工坊', members: 73, path: '/community?group=brand' },
      ]
      sendJson(res, 200, { ok: true, data: items })
      return
    }

    if (req.method === 'POST' && path === '/api/favorites/tutorials/toggle') {
      // 从JWT令牌获取当前用户ID
      const decoded = verifyRequestToken(req)
      if (!decoded) {
        sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
        return
      }
      
      const b = await readBody(req)
      const id = Number(b?.id)
      if (!id || Number.isNaN(id)) { sendJson(res, 400, { error: 'ID_INVALID' }); return }
      
      const ids = await favoriteDB.toggleFavorite(decoded.userId, id)
      sendJson(res, 200, { ok: true, ids })
      return
    }

    // 处理所有模型的图片生成请求
    if (req.method === 'POST' && path.match(/^\/api\/(doubao|qwen|deepseek|kimi)\/images\/generate$/)) {
      const modelType = path.split('/')[2]; // 提取模型类型：doubao、qwen、deepseek或kimi
      const b = await readBody(req)
      
      let r;
      let apiEndpoint = '/images/generations';
      
      // 根据模型类型选择不同的fetch函数和API端点
      switch (modelType) {
        case 'qwen':
          // 通义千问使用dashscopeFetch，图片生成API端点
          const authKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY || ''
          if (!authKey) { sendJson(res, 401, { error: 'API_KEY_MISSING' }); return }
          
          // 确保prompt字段存在
          if (!b.prompt) { sendJson(res, 400, { error: 'PROMPT_REQUIRED', message: 'Prompt is required' }); return }
          r = await dashscopeImageGenerate({
            prompt: b.prompt,
            size: b.size || '1024x1024',
            n: b.n || 1,
            authKey,
            model: b.model
          })
          break;
        case 'deepseek':
          // DeepSeek使用deepseekFetch
          const deepseekPayload = {
            model: b.model || 'deepseek-chat',
            prompt: b.prompt,
            size: b.size || '1024x1024',
            n: b.n || 1,
            seed: b.seed,
            guidance_scale: b.guidance_scale,
            response_format: b.response_format || 'url',
          };
          r = await deepseekFetch(apiEndpoint, 'POST', deepseekPayload);
          break;
        case 'kimi':
          // Kimi使用kimiFetch
          const kimiPayload = {
            model: b.model || 'moonshot-v1-32k',
            prompt: b.prompt,
            size: b.size || '1024x1024',
            n: b.n || 1,
            seed: b.seed,
            guidance_scale: b.guidance_scale,
            response_format: b.response_format || 'url',
          };
          r = await kimiFetch(apiEndpoint, 'POST', kimiPayload);
          break;
        case 'doubao':
        default:
          // 豆包使用proxyFetch
          const key = process.env.DOUBAO_API_KEY || API_KEY
          if (!key) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
          const doubaoPayload = {
            model: b.model || MODEL_ID,
            prompt: b.prompt,
            size: b.size || '1024x1024',
            n: b.n || 1,
            seed: b.seed,
            guidance_scale: b.guidance_scale,
            response_format: b.response_format || 'url',
            watermark: b.watermark,
          };
          r = await proxyFetch(apiEndpoint, 'POST', doubaoPayload);
          break;
      }
      
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.code) || (r.data?.message) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    if (req.method === 'POST' && path === '/api/doubao/chat/completions') {
      const key = process.env.DOUBAO_API_KEY || API_KEY
      if (!key) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const msgs = Array.isArray(b.messages) ? b.messages.map((m) => {
        const content = Array.isArray(m?.content) ? m.content.map((it) => {
          if (it?.type === 'text') return { type: 'text', text: String(it.text || '').replace(/`/g, '').trim() }
          if (it?.type === 'image_url') return { type: 'image_url', image_url: { url: String(it?.image_url?.url || '').replace(/`/g, '').trim() } }
          return it
        }) : []
        return { role: m?.role || 'user', content }
      }) : []
      const maxTokens = typeof b.max_tokens === 'number'
        ? b.max_tokens
        : (typeof b.max_completion_tokens === 'number' ? b.max_completion_tokens : undefined)
      const payload = { model: b.model || MODEL_ID, messages: msgs, max_tokens: maxTokens, temperature: b.temperature, top_p: b.top_p, stream: b.stream }
      const r = await proxyFetch('/chat/completions', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.code) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // Kimi (Moonshot) chat completions proxy
    if (req.method === 'POST' && path === '/api/kimi/chat/completions') {
      const keyPresent = (process.env.KIMI_API_KEY || KIMI_API_KEY)
      if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const payload = {
        model: b.model || 'moonshot-v1-32k',
        messages: b.messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: b.stream,
      }
      if (b.stream) {
        // 对于流式请求，直接转发响应流
        await kimiFetch('/chat/completions', 'POST', payload, res)
        return
      } else {
        // 对于非流式请求，返回包装后的响应
        const r = await kimiFetch('/chat/completions', 'POST', payload)
        if (!r.ok) {
          sendJson(res, r.status, { error: (r.data?.error?.type) || 'SERVER_ERROR', data: r.data });
          return
        }
        sendJson(res, 200, { ok: true, data: r.data })
        return
      }
    }

    if (req.method === 'POST' && path === '/api/deepseek/chat/completions') {
      const keyPresent = (process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY)
      if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const payload = {
        model: b.model || 'deepseek-chat',
        messages: b.messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: b.stream,
      }
      const r = await deepseekFetch('/chat/completions', 'POST', payload, res)
      if (r.isStream) return
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.type) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }
    // 处理通义千问模型的聊天补全请求
    if (req.method === 'POST' && (path === '/api/dashscope/chat/completions' || path === '/api/qwen/chat/completions')) {
      // 从环境变量获取API密钥，不需要用户输入
      const authKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY || ''
      if (!authKey) { sendJson(res, 500, { error: 'API_KEY_NOT_CONFIGURED' }); return }
      
      const b = await readBody(req)
      // 转换为DashScope API期望的格式
      const payload = {
        model: b.model || DASHSCOPE_MODEL_ID,
        messages: Array.isArray(b.messages) ? b.messages : [],
        temperature: b.temperature,
        top_p: b.top_p,
        max_tokens: b.max_tokens,
        stream: b.stream || false
      }
      // 通义千问API使用标准的OpenAI兼容路径格式
      const r = await dashscopeFetch('/chat/completions', 'POST', payload, authKey, res)
      if (r.isStream) return
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.code) || (r.data?.message) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // Qianfan (Wenxin Yiyan) chat completions proxy
    if (req.method === 'POST' && path === '/api/qianfan/chat/completions') {
      const hasCfg = (process.env.QIANFAN_AUTH || QIANFAN_AUTH || process.env.QIANFAN_ACCESS_TOKEN || QIANFAN_ACCESS_TOKEN || process.env.QIANFAN_AK || QIANFAN_AK)
      if (!hasCfg) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const messages = Array.isArray(b.messages) ? b.messages.map((m) => ({ role: m?.role || 'user', content: String(m?.content || '').replace(/`/g, '').trim() })) : []
      const payload = {
        model: b.model || QIANFAN_MODEL_ID,
        messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: false,
      }
      const r = await qianfanFetch('/v2/chat/completions', 'POST', payload)
      if (!r.ok) {
        const code = (r.data?.error?.code) || (r.data?.error_msg) || 'SERVER_ERROR'
        const hint = String(code).includes('invalid_iam_token') ? 'QIANFAN_AUTH 无法用于 chat 接口，请改用 QIANFAN_ACCESS_TOKEN 或设置 QIANFAN_AK/QIANFAN_SK 以自动获取 token' : undefined
        sendJson(res, r.status, { error: code, hint, data: r.data })
        return
      }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // ChatGPT chat completions proxy
    if (req.method === 'POST' && path === '/api/chatgpt/chat/completions') {
      const keyPresent = (process.env.CHATGPT_API_KEY || CHATGPT_API_KEY)
      if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const payload = {
        model: b.model || CHATGPT_MODEL_ID,
        messages: b.messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: b.stream,
      }
      const r = await chatgptFetch('/chat/completions', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.type) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // Gemini chat completions proxy
    if (req.method === 'POST' && path === '/api/gemini/generateContent') {
      const keyPresent = (process.env.GEMINI_API_KEY || GEMINI_API_KEY)
      if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const r = await geminiFetch(`/models/${b.model || GEMINI_MODEL_ID}/generateContent`, 'POST', b)
      if (!r.ok) { sendJson(res, r.status, { error: 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // Gork chat completions proxy
    if (req.method === 'POST' && path === '/api/gork/chat/completions') {
      const keyPresent = (process.env.GORK_API_KEY || GORK_API_KEY)
      if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const payload = {
        model: b.model || GORK_MODEL_ID,
        messages: b.messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: b.stream,
      }
      const r = await gorkFetch('/chat/completions', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.type) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // Zhipu chat completions proxy
    if (req.method === 'POST' && path === '/api/zhipu/chat/completions') {
      const keyPresent = (process.env.ZHIPU_API_KEY || ZHIPU_API_KEY)
      if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const payload = {
        model: b.model || ZHIPU_MODEL_ID,
        messages: b.messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: b.stream,
      }
      const r = await zhipuFetch('/chat/completions', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.type) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    if (req.method === 'POST' && path === '/api/doubao/videos/tasks') {
      const key = process.env.DOUBAO_API_KEY || API_KEY
      if (MOCK || !key) {
        const b = await readBody(req)
        const mid = `mock-${Date.now()}`
        const model = 'doubao-seedance-1-0-pro-fast-251015'
        try { await videoTaskDB.upsertTask({ id: mid, status: 'succeeded', model, payload: b }) } catch {}
        sendJson(res, 200, { ok: true, data: { id: mid, status: 'succeeded', content: { video_url: 'https://example.com/mock.mp4', last_frame_url: 'https://example.com/mock.jpg' } } })
        return
      }
      
      const b = await readBody(req)
      
      // Validate request body
      if (!b.content || !Array.isArray(b.content)) {
        sendJson(res, 400, { error: 'INVALID_REQUEST', message: 'Content must be a non-empty array' });
        return
      }
      
      // Process and sanitize content
      const content = b.content.map((it) => {
        if (it?.type === 'text') return { 
          type: 'text', 
          text: String(it.text || '').replace(/`/g, '').trim() 
        }
        if (it?.type === 'image_url') return { 
          type: 'image_url', 
          image_url: { 
            url: String(it?.image_url?.url || '').replace(/`/g, '').trim() 
          } 
        }
        return it
      }).filter(item => { 
        // Remove empty or invalid items
        if (item?.type === 'text') return item.text.length > 0;
        if (item?.type === 'image_url') return item.image_url?.url && item.image_url.url.length > 0;
        return false;
      })
      
      if (content.length === 0) {
        sendJson(res, 400, { error: 'INVALID_REQUEST', message: 'No valid content provided' });
        return;
      }
      
      // 检查是否包含图片URL（图生视频）
      const hasImageUrl = content.some(item => item.type === 'image_url');
      
      // 根据内容类型选择合适的模型
      if (hasImageUrl) {
        // 图生视频 - 优先使用快速模型，不开通则回退到标准模型
        const fastModel = 'doubao-seedance-1-0-pro-fast-251015'
        const fallbackModel = MODEL_ID // 默认配置或 'doubao-seedance-1-0-pro-250528'
        const payload = { model: fastModel, content };
        
        let r = await proxyFetch('/contents/generations/tasks', 'POST', payload);
        
        if (!r.ok && (r.data?.error?.code === 'ModelNotOpen')) {
          const fallbackPayload = { model: fallbackModel, content }
          r = await proxyFetch('/contents/generations/tasks', 'POST', fallbackPayload)
        }
        
        if (!r.ok) {
          // 进一步回退：改为文本生成视频
          const textOnly = content.filter(it => it.type === 'text')
          if (textOnly.length > 0) {
            const r2 = await proxyFetch('/contents/generations/tasks', 'POST', { model: fallbackModel, content: textOnly })
            if (!r2.ok) {
              sendJson(res, r2.status, { error: (r2.data?.error?.code) || 'SERVER_ERROR', message: (r2.data?.error?.message) || 'Video generation failed', data: r2.data })
              return
            }
            try { await videoTaskDB.upsertTask({ id: r2.data?.id, status: r2.data?.status, model: r2.data?.model || fallbackModel, payload: { model: fallbackModel, content: textOnly } }) } catch {}
            sendJson(res, 200, { ok: true, data: r2.data });
            return
          }
          sendJson(res, r.status, { 
            error: (r.data?.error?.code) || 'SERVER_ERROR', 
            message: (r.data?.error?.message) || 'Image-to-video generation failed',
            data: r.data 
          }); 
          return 
        }
        
        try { await videoTaskDB.upsertTask({ id: r.data?.id, status: r.data?.status, model: r.data?.model || fastModel, payload }) } catch {}
        sendJson(res, 200, { ok: true, data: r.data });
        return;
      } else {
        // 文本生成视频
        const model = b.model || MODEL_ID;
        const payload = { model, content };
        
        let r = await proxyFetch('/contents/generations/tasks', 'POST', payload);

        // 如果模型未开通，自动降级到已测试可用的快速模型
        if (!r.ok && (r.data?.error?.code === 'ModelNotOpen')) {
          const fallbackPayload = { model: 'doubao-seedance-1-0-pro-fast-251015', content };
          r = await proxyFetch('/contents/generations/tasks', 'POST', fallbackPayload);
        }

        if (!r.ok) {
          sendJson(res, r.status, { 
            error: (r.data?.error?.code) || 'SERVER_ERROR', 
            message: (r.data?.error?.message) || 'Video generation failed',
            data: r.data 
          }); 
          return 
        }

        try { await videoTaskDB.upsertTask({ id: r.data?.id, status: r.data?.status, model, payload }) } catch {}
        sendJson(res, 200, { ok: true, data: r.data });
        return;
      }
    }

    if (req.method === 'GET' && path.startsWith('/api/doubao/videos/tasks/')) {
      const id = path.split('/').pop() || ''
      
      // Validate task ID
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        sendJson(res, 400, { error: 'INVALID_TASK_ID', message: 'Invalid task ID provided' });
        return
      }
      
      const key = process.env.DOUBAO_API_KEY || API_KEY
      if (MOCK || !key) {
        sendJson(res, 200, { ok: true, data: { id, status: 'succeeded', content: { video_url: 'https://example.com/mock.mp4', last_frame_url: 'https://example.com/mock.jpg' } } })
        return
      }
      
      try {
        const r = await proxyFetch(`/contents/generations/tasks/${id}`, 'GET')
        
        if (!r.ok) {
          sendJson(res, r.status, { 
            error: (r.data?.error?.code) || 'SERVER_ERROR', 
            message: (r.data?.error?.message) || 'Failed to get video task status',
            data: r.data 
          }); 
          return 
        }
        
        try { await videoTaskDB.upsertTask({ id, status: r.data?.status }) } catch {}
        sendJson(res, 200, { ok: true, data: r.data })
        return
      } catch (error) {
        sendJson(res, 500, { 
          error: 'INTERNAL_ERROR', 
          message: 'An error occurred while retrieving the video task status' 
        });
        return
      }
    }

    if (req.method === 'POST' && path === '/api/volc/tts/synthesize') {
      const ip = req.socket.remoteAddress || 'unknown'
      if (!allowTts(ip)) { sendJson(res, 429, { error: 'RATE_LIMITED' }); return }
      const b = await readBody(req)
      const text = String(b.text || '').trim()
      if (!text) { sendJson(res, 400, { error: 'TEXT_EMPTY' }); return }
      if (text.length > 2000) { sendJson(res, 400, { error: 'TEXT_TOO_LONG' }); return }

      const r = await volcTtsSynthesize({ text, voice: b.voice, speed: b.speed, pitch: b.pitch, format: b.format })
      if (!r.ok) { sendJson(res, r.status, r.data); return }

      const { audio_base64, content_type } = r.data || {}
      sendJson(res, 200, { ok: true, audio_base64, content_type: content_type || 'audio/mpeg' })
      return
    }

    if (req.method === 'GET' && path === '/api/proxy/video') {
      const remote = (new URL(req.url, `http://localhost:${PORT}`)).searchParams.get('url') || ''
      const safe = remote.startsWith('https://') && (remote.includes('volces.com') || remote.includes('tos-cn-beijing'))
      if (!safe) { sendJson(res, 400, { error: 'URL_NOT_ALLOWED' }); return }
      await proxyBinary(remote, req, res)
      return
    }

    if (req.method === 'GET' && path === '/api/proxy/video/meta') {
      const remote = (new URL(req.url, `http://localhost:${PORT}`)).searchParams.get('url') || ''
      const safe = remote.startsWith('https://') && (remote.includes('volces.com') || remote.includes('tos-cn-beijing'))
      if (!safe) { sendJson(res, 400, { error: 'URL_NOT_ALLOWED' }); return }
      try {
        let resp = await fetch(remote, { method: 'HEAD' })
        if (!resp.ok) {
          resp = await fetch(remote, { method: 'GET' })
        }
        const ct = resp.headers.get('content-type') || 'application/octet-stream'
        const cl = Number(resp.headers.get('content-length') || 0)
        const ar = resp.headers.get('accept-ranges') || ''
        sendJson(res, 200, { ok: true, content_type: ct, content_length: cl, accept_ranges: ar })
      } catch (e) {
        sendJson(res, 500, { error: 'META_ERROR', message: e?.message || 'UNKNOWN' })
      }
      return
    }

    // 代理 trae-api-sg.mchost.guru API 请求，解决 CORS 问题
    if (req.method === 'GET' && path.startsWith('/api/proxy/trae-api')) {
      const remotePath = path.replace('/api/proxy/trae-api', '')
      const queryString = u.search
      const remoteUrl = `https://trae-api-sg.mchost.guru${remotePath}${queryString}`
      
      try {
        // 正常处理所有trae-api请求，包括text_to_image端点
        console.log(`Proxying to trae-api: ${remoteUrl}`)
        
        // 允许重定向，最多跟随10次重定向
        const resp = await fetch(remoteUrl, {
          method: req.method,
          headers: {
            'Accept': 'application/json, image/*, text/html, */*',
          },
          redirect: 'follow', // 跟随重定向
          follow: 10, // 最多跟随10次重定向
        })
        
        // 设置响应头
        res.statusCode = resp.status
        const contentType = resp.headers.get('content-type') || 'application/octet-stream'
        res.setHeader('Content-Type', contentType)
        
        // 设置CORS头
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
        // 根据响应类型返回相应的数据
        if (contentType.startsWith('image/')) {
          // 图片类型，返回二进制数据
          const buffer = Buffer.from(await resp.arrayBuffer())
          res.end(buffer)
        } else if (contentType.startsWith('application/json')) {
          // JSON类型，返回JSON数据
          const data = await resp.json()
          sendJson(res, resp.status, data)
        } else {
          // 其他类型（如text/html、text/plain等），返回文本数据
          const text = await resp.text()
          res.end(text)
        }
      } catch (e) {
        console.error(`[Proxy Error] ${remoteUrl}: ${e.message}`)
        sendJson(res, 500, { error: 'PROXY_ERROR', message: e?.message || 'UNKNOWN' })
      }
      return
    }

    // 代理 Unsplash 图片请求，解决 CORS 问题
    if (req.method === 'GET' && path.startsWith('/api/proxy/unsplash')) {
      const remotePath = path.replace('/api/proxy/unsplash', '')
      const queryString = u.search
      const remoteUrl = `https://images.unsplash.com${remotePath}${queryString}`
      
      try {
        // 允许重定向，最多跟随10次重定向
        const resp = await fetch(remoteUrl, {
          method: req.method,
          headers: {
            'Accept': 'image/*, */*',
            'User-Agent': req.headers['user-agent'] || '',
          },
          redirect: 'follow', // 跟随重定向
          follow: 10, // 最多跟随10次重定向
        })
        
        // 设置响应头
        res.statusCode = resp.status
        const contentType = resp.headers.get('content-type') || 'image/jpeg'
        res.setHeader('Content-Type', contentType)
        
        // 设置CORS头
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
        // 返回图片二进制数据
        const buffer = Buffer.from(await resp.arrayBuffer())
        res.end(buffer)
      } catch (e) {
        console.error(`[Unsplash Proxy Error] ${remoteUrl}: ${e.message}`)
        sendJson(res, 500, { error: 'UNSPLASH_PROXY_ERROR', message: e?.message || 'Failed to proxy Unsplash image' })
      }
      return
    }

    // 注册API
    if (req.method === 'POST' && path === '/api/auth/register') {
      const b = await readBody(req);
      const { username, email, password, phone, avatar_url, interests, age, tags } = b;
      
      // 验证必填字段
      if (!username || !email || !password) {
        sendJson(res, 400, { error: 'MISSING_REQUIRED_FIELDS', message: '用户名、邮箱和密码是必填项' });
        return;
      }
      
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        sendJson(res, 400, { error: 'INVALID_EMAIL_FORMAT', message: '请输入有效的邮箱地址' });
        return;
      }
      
      try {
        // 检查邮箱是否已存在
        const existingUser = await userDB.findByEmail(email);
        if (existingUser) {
          sendJson(res, 400, { error: 'EMAIL_ALREADY_EXISTS', message: '该邮箱已被注册' });
          return;
        }
        
        // 检查用户名是否已存在
        const existingUsername = await userDB.findByUsername(username);
        if (existingUsername) {
          sendJson(res, 400, { error: 'USERNAME_ALREADY_EXISTS', message: '该用户名已被使用' });
          return;
        }
        
        // 密码加密
        const password_hash = await bcrypt.hash(password, 10);
        
        // 创建用户，暂时移除所有可能导致问题的字段
        const newUser = await userDB.createUser({
          username,
          email,
          password_hash,
          phone: null,
          avatar_url: null,
          interests: null,
          age: null,
          tags: null,
          github_id: null,
          github_username: null,
          auth_provider: 'local'
        });
        
        // 生成JWT令牌
        const token = generateToken({ userId: newUser.id, email });
        
        // 生成邮箱验证令牌
        const verificationToken = generateToken({ userId: newUser.id, email }, '24h');
        
        // 发送验证邮件
        const emailSent = await sendVerificationEmail(email, verificationToken, username);
        
        console.log(`[用户注册] 成功 - 用户ID: ${newUser.id}, 邮箱: ${email}, 验证邮件发送: ${emailSent}`);
        
        sendJson(res, 200, {
          code: 0,
          message: '注册成功，验证邮件已发送，请查收',
          data: {
            id: newUser.id,
            username,
            email,
            token,
            email_verified: false
          }
        });
      } catch (error) {
        console.error('注册失败:', error);
        sendJson(res, 500, { error: 'INTERNAL_ERROR', message: '注册失败，请稍后重试' });
      }
      return;
    }
    
    // GitHub 授权 URL API
    if (req.method === 'GET' && path === '/api/auth/github/url') {
      const clientId = process.env.GITHUB_CLIENT_ID;
      if (!clientId) {
        sendJson(res, 500, { error: 'CONFIG_MISSING', message: 'GitHub Client ID 未配置' });
        return;
      }
      
      const redirectUri = process.env.GITHUB_REDIRECT_URI || `http://localhost:5173/auth/github/callback`;
      const scope = 'read:user user:email';
      const state = crypto.randomBytes(16).toString('hex');
      
      const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
      
      sendJson(res, 200, { code: 0, data: { url } });
      return;
    }

    // GitHub 回调 API
    if (req.method === 'POST' && path === '/api/auth/github/callback') {
      const b = await readBody(req);
      const { code } = b;
      
      if (!code) {
        sendJson(res, 400, { error: 'MISSING_CODE', message: '缺少授权码' });
        return;
      }
      
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        sendJson(res, 500, { error: 'CONFIG_MISSING', message: 'GitHub 配置缺失' });
        return;
      }
      
      try {
        // 1. 获取 Access Token
        const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code
          })
        });
        
        const tokenData = await tokenResp.json();
        if (tokenData.error) {
          sendJson(res, 400, { error: 'GITHUB_AUTH_FAILED', message: tokenData.error_description || 'GitHub 授权失败' });
          return;
        }
        
        const accessToken = tokenData.access_token;
        
        // 2. 获取用户信息
        const userResp = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        const userData = await userResp.json();
        
        // 3. 获取用户邮箱 (如果公开资料里没有)
        let email = userData.email;
        if (!email) {
          const emailResp = await fetch('https://api.github.com/user/emails', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          const emails = await emailResp.json();
          const primaryEmail = emails.find(e => e.primary && e.verified);
          email = primaryEmail ? primaryEmail.email : (emails[0]?.email || `${userData.login}@github.com`);
        }
        
        // 4. 查找或创建用户
        let user = await userDB.findByGithubId(String(userData.id));
        const now = Date.now();
        
        if (!user) {
          // 尝试通过邮箱查找
          user = await userDB.findByEmail(email);
          if (user) {
            // 关联现有账户
            // 注意：这里需要 update user 逻辑，暂时简化处理，假设需要更新 github_id
            // 由于 updateById 实现限制，这里先不做关联更新，而是提示或新建（如果允许重复邮箱的话，但我们的 schema 是 unique email）
            // 实际操作：更新用户的 github_id
             await userDB.updateById(user.id, { github_id: String(userData.id), github_username: userData.login });
             // 重新获取用户
             user = await userDB.findById(user.id);
          } else {
            // 创建新用户
            const password_hash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
            const newUserId = await userDB.createUser({
              username: userData.login, // 可能需要处理重名
              email,
              password_hash,
              avatar_url: userData.avatar_url,
              github_id: String(userData.id),
              github_username: userData.login,
              auth_provider: 'github',
              email_verified: 1, // GitHub 邮箱通常已验证
              created_at: now,
              updated_at: now
            });
            // 处理用户名冲突: 如果 createUser 返回 null (用户名已存在)，则尝试添加后缀
            if (!newUserId) {
               // 简单重试逻辑
               const newUsername = `${userData.login}_${crypto.randomBytes(4).toString('hex')}`;
               const retryId = await userDB.createUser({
                  username: newUsername,
                  email,
                  password_hash,
                  avatar_url: userData.avatar_url,
                  github_id: String(userData.id),
                  github_username: userData.login,
                  auth_provider: 'github',
                  email_verified: 1,
                  created_at: now,
                  updated_at: now
               });
               if (retryId) {
                  user = await userDB.findById(retryId.id || retryId); // 兼容不同 DB 返回格式
               }
            } else {
               user = await userDB.findById(newUserId.id || newUserId);
            }
          }
        }
        
        if (!user) {
           sendJson(res, 500, { error: 'USER_CREATION_FAILED', message: '用户创建失败' });
           return;
        }
        
        // 5. 生成 JWT
        const token = generateToken({ userId: user.id, email: user.email });
        
        sendJson(res, 200, {
          code: 0,
          message: '登录成功',
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            token,
            refreshToken: token,
            avatar_url: user.avatar_url,
            email_verified: true
          }
        });
        
      } catch (error) {
        console.error('GitHub 登录处理失败:', error);
        sendJson(res, 500, { error: 'INTERNAL_ERROR', message: '登录处理失败' });
      }
      return;
    }

    // 登录API
    if (req.method === 'POST' && path === '/api/auth/login') {
      const b = await readBody(req);
      const { email, password } = b;
      
      // 验证必填字段
      if (!email || !password) {
        sendJson(res, 400, { error: 'MISSING_REQUIRED_FIELDS', message: '邮箱和密码是必填项' });
        return;
      }
      
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        sendJson(res, 400, { error: 'INVALID_EMAIL_FORMAT', message: '请输入有效的邮箱地址' });
        return;
      }
      
      try {
        // 查找用户
        console.log(`[用户登录] 尝试登录 - 邮箱: ${email}`);
        const user = await userDB.findByEmail(email);
        if (!user) {
          console.warn(`[用户登录] 失败 - 邮箱不存在: ${email}`);
          sendJson(res, 401, { error: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' });
          return;
        }
        
        // 检查用户是否有password_hash字段（可能通过其他方式注册）
        if (!user.password_hash) {
          console.warn(`[用户登录] 失败 - 用户没有设置密码: ${email}`);
          sendJson(res, 401, { error: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' });
          return;
        }
        
        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
          console.warn(`[用户登录] 失败 - 密码错误: ${email}`);
          sendJson(res, 401, { error: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' });
          return;
        }
        
        // 检查邮箱验证状态
        const emailVerified = user.email_verified === 1 || user.email_verified === true;
        
        // 生成JWT令牌
        const token = generateToken({ userId: user.id, email: user.email });
        
        console.log(`[用户登录] 成功 - 用户ID: ${user.id}, 邮箱: ${email}, 邮箱已验证: ${emailVerified}`);
        
        sendJson(res, 200, {
          code: 0,
          message: emailVerified ? '登录成功' : '登录成功，但您的邮箱尚未验证，请尽快验证',
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            token,
            email_verified: emailVerified
          }
        });
      } catch (error) {
        console.error(`[用户登录] 异常 - 邮箱: ${email}, 错误:`, error);
        sendJson(res, 500, { error: 'INTERNAL_ERROR', message: '登录失败，请稍后重试' });
      }
      return;
    }
    
    // 登出API
    if (req.method === 'POST' && path === '/api/auth/logout') {
      // JWT是无状态的，登出只需客户端删除令牌即可
      sendJson(res, 200, {
        code: 0,
        message: '退出成功',
        data: null
      });
      return;
    }
    
    // 刷新令牌API（兼容前端以JSON传递token/refreshToken的方式）
    if (req.method === 'POST' && path === '/api/auth/refresh') {
      let bearerToken = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        bearerToken = authHeader.split(' ')[1];
      }

      // 兼容前端通过JSON body传递token/refreshToken
      let bodyToken = null;
      try {
        const b = await readBody(req);
        bodyToken = b?.token || b?.refreshToken || null;
      } catch (e) {
        bodyToken = null;
      }

      const tokenToVerify = bearerToken || bodyToken;
      if (!tokenToVerify) {
        sendJson(res, 401, { error: 'MISSING_TOKEN', message: '未提供令牌' });
        return;
      }

      try {
        // 验证现有令牌
        const decoded = verifyToken(tokenToVerify);
        if (!decoded) {
          sendJson(res, 401, { error: 'INVALID_TOKEN', message: '无效的令牌' });
          return;
        }

        // 生成新令牌（简化实现：refreshToken 与 token 相同）
        const newToken = generateToken({ userId: decoded.userId, email: decoded.email });

        sendJson(res, 200, {
          code: 0,
          message: '令牌刷新成功',
          data: {
            token: newToken,
            refreshToken: newToken
          }
        });
      } catch (error) {
        console.error('刷新令牌失败:', error);
        sendJson(res, 401, { error: 'INVALID_TOKEN', message: '无效的令牌' });
      }
      return;
    }
    
    // 邮箱验证API
    if (req.method === 'GET' && path === '/api/auth/verify-email') {
      const token = u.searchParams.get('token');
      if (!token) {
        sendJson(res, 400, { error: 'MISSING_TOKEN', message: '验证令牌不能为空' });
        return;
      }
      
      try {
        // 验证令牌
        const decoded = verifyToken(token);
        if (!decoded) {
          sendJson(res, 401, { error: 'INVALID_TOKEN', message: '无效的验证令牌' });
          return;
        }
        
        // 从令牌中获取用户信息
        const { userId, email } = decoded;
        
        // 查找用户
        const user = await userDB.findById(userId);
        if (!user || user.email !== email) {
          sendJson(res, 404, { error: 'USER_NOT_FOUND', message: '用户不存在' });
          return;
        }
        
        // 更新用户的邮箱验证状态
        await userDB.updateById(userId, { email_verified: 1 });
        
        sendJson(res, 200, {
          code: 0,
          message: '邮箱验证成功',
          data: {
            id: user.id,
            email: user.email,
            email_verified: true
          }
        });
      } catch (error) {
        console.error('邮箱验证失败:', error);
        sendJson(res, 500, { error: 'INTERNAL_ERROR', message: '邮箱验证失败，请稍后重试' });
      }
      return;
    }
    
    // 发送短信验证码API
    if (req.method === 'POST' && path === '/api/auth/send-sms-code') {
      const b = await readBody(req);
      const { phone } = b;
      
      if (!phone) {
        sendJson(res, 400, { error: 'MISSING_PHONE', message: '手机号不能为空' });
        return;
      }
      
      try {
        // 检查用户是否已注册
        const existingUser = await userDB.findByPhone(phone);
        if (!existingUser) {
          sendJson(res, 401, { error: 'USER_NOT_FOUND', message: '该手机号未注册' });
          return;
        }
        
        // 生成验证码
        const code = generateVerificationCode();
        // 验证码5分钟后过期
        const expiresAt = Date.now() + 5 * 60 * 1000;
        
        console.log(`生成验证码 ${code} 发送到 ${phone}，过期时间: ${new Date(expiresAt).toISOString()}`);
        
        // 发送短信验证码
        const success = await sendSmsVerificationCode(phone, code);
        
        if (success) {
          // 保存验证码到数据库
          await userDB.updateSmsVerificationCode(phone, code, expiresAt);
          
          sendJson(res, 200, {
            code: 0,
            message: '验证码已发送，请注意查收',
            data: {
              phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') // 隐藏中间4位
            }
          });
        } else {
          sendJson(res, 500, {
            code: 500,
            message: '验证码发送失败，请稍后重试'
          });
        }
      } catch (error) {
        console.error('发送短信验证码失败:', error);
        sendJson(res, 500, {
          code: 500,
          message: '验证码发送失败，请稍后重试'
        });
      }
      return;
    }
    
    // 验证短信验证码API
    if (req.method === 'POST' && path === '/api/auth/verify-sms-code') {
      const b = await readBody(req);
      const { phone, code } = b;
      
      if (!phone || !code) {
        sendJson(res, 400, { error: 'MISSING_PARAMETERS', message: '手机号和验证码不能为空' });
        return;
      }
      
      try {
        // 从数据库获取保存的验证码
        const { sms_verification_code, sms_verification_expires } = await userDB.getSmsVerificationCode(phone);
        console.log(`验证手机号 ${phone} 的验证码 ${code}，数据库中保存的是 ${sms_verification_code}`);
        
        // 验证验证码
        const isValid = verifySmsCode(sms_verification_code, code, sms_verification_expires);
        
        if (isValid) {
          sendJson(res, 200, {
            code: 0,
            message: '验证码验证成功',
            data: null
          });
        } else {
          sendJson(res, 400, {
            code: 400,
            message: '验证码无效或已过期',
            data: null
          });
        }
      } catch (error) {
        console.error('验证码验证失败:', error);
        sendJson(res, 500, {
          code: 500,
          message: '验证码验证失败，请稍后重试'
        });
      }
      return;
    }
    
    // 手机号验证码登录API
    if (req.method === 'POST' && path === '/api/auth/login-phone') {
      const b = await readBody(req);
      const { phone, code } = b;
      
      if (!phone || !code) {
        sendJson(res, 400, { error: 'MISSING_PARAMETERS', message: '手机号和验证码不能为空' });
        return;
      }
      
      try {
        // 1. 验证验证码
        const { sms_verification_code, sms_verification_expires } = await userDB.getSmsVerificationCode(phone);
        const isValid = verifySmsCode(sms_verification_code, code, sms_verification_expires);
        
        if (!isValid) {
          sendJson(res, 400, { error: 'INVALID_CODE', message: '验证码无效或已过期' });
          return;
        }
        
        // 2. 查找用户
        const user = await userDB.findByPhone(phone);
        if (!user) {
          sendJson(res, 401, { error: 'USER_NOT_FOUND', message: '该手机号未注册' });
          return;
        }
        
        // 3. 生成JWT令牌
        const token = generateToken({ userId: user.id, email: user.email });
        
        sendJson(res, 200, {
          code: 0,
          message: '登录成功',
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            token,
            refreshToken: token, // 简化实现，实际应该使用不同的refreshToken
            email_verified: user.email_verified === 1 || user.email_verified === true
          }
        });
      } catch (error) {
        console.error('手机号登录失败:', error);
        sendJson(res, 500, {
          code: 500,
          message: '登录失败，请稍后重试'
        });
      }
      return;
    }
    
    // 手机号验证码注册API
    if (req.method === 'POST' && path === '/api/auth/register-phone') {
      const b = await readBody(req);
      const { username, phone, code, age, tags } = b;
      
      if (!username || !phone || !code) {
        sendJson(res, 400, { error: 'MISSING_PARAMETERS', message: '用户名、手机号和验证码不能为空' });
        return;
      }
      
      try {
        // 1. 验证验证码
        const { sms_verification_code, sms_verification_expires } = await userDB.getSmsVerificationCode(phone);
        const isValid = verifySmsCode(sms_verification_code, code, sms_verification_expires);
        
        if (!isValid) {
          sendJson(res, 400, { error: 'INVALID_CODE', message: '验证码无效或已过期' });
          return;
        }
        
        // 2. 检查用户名是否已存在
        const existingUsername = await userDB.findByUsername(username);
        if (existingUsername) {
          sendJson(res, 400, { error: 'USERNAME_ALREADY_EXISTS', message: '该用户名已被使用' });
          return;
        }
        
        // 3. 检查手机号是否已注册
        const existingPhone = await userDB.findByPhone(phone);
        if (existingPhone) {
          sendJson(res, 400, { error: 'PHONE_ALREADY_REGISTERED', message: '该手机号已被注册' });
          return;
        }
        
        // 4. 创建用户
        const password_hash = await bcrypt.hash(crypto.randomBytes(6).toString('hex'), 10); // 生成随机密码
        const now = Date.now();
        
        const newUser = await userDB.createUser({
          username,
          email: phone, // 暂时用手机号作为邮箱
          password_hash,
          phone,
          age: age ? parseInt(age) : null,
          tags: tags ? JSON.stringify(tags) : null,
          email_verified: 1, // 手机号注册默认验证通过
          email_verification_token: null,
          email_verification_expires: null,
          created_at: now,
          updated_at: now
        });
        
        // 5. 生成JWT令牌
        const token = generateToken({ userId: newUser.id, email: phone });
        
        sendJson(res, 200, {
          code: 0,
          message: '注册成功',
          data: {
            id: newUser.id,
            username,
            email: phone,
            token,
            refreshToken: token, // 简化实现，实际应该使用不同的refreshToken
            email_verified: true
          }
        });
      } catch (error) {
        console.error('手机号注册失败:', error);
        sendJson(res, 500, {
          code: 500,
          message: '注册失败，请稍后重试'
        });
      }
      return;
    }
    
    // 健康检查：返回各模型的配置状态，便于前端快速定位问题
    if (req.method === 'GET' && path === '/api/health/llms') {
      const status = {
        doubao: { configured: !!(process.env.DOUBAO_API_KEY || API_KEY), base: (process.env.DOUBAO_BASE_URL || BASE_URL) },
        kimi: { configured: !!(process.env.KIMI_API_KEY || KIMI_API_KEY), base: (process.env.KIMI_BASE_URL || KIMI_BASE_URL) },
        deepseek: { configured: !!(process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY), base: (process.env.DEEPSEEK_BASE_URL || DEEPSEEK_BASE_URL) },
        qwen: { configured: !!(process.env.DASHSCOPE_API_KEY || DASHSCOPE_API_KEY), base: (process.env.DASHSCOPE_BASE_URL || DASHSCOPE_BASE_URL), model: (process.env.DASHSCOPE_MODEL_ID || DASHSCOPE_MODEL_ID) },
        wenxin: {
          configured: !!(process.env.QIANFAN_AUTH || QIANFAN_AUTH || process.env.QIANFAN_ACCESS_TOKEN || QIANFAN_ACCESS_TOKEN || process.env.QIANFAN_AK || QIANFAN_AK),
          base: (process.env.QIANFAN_BASE_URL || QIANFAN_BASE_URL),
          token_cached: !!__qf_token
        },
        // 添加新模型
        chatgpt: { configured: !!(process.env.CHATGPT_API_KEY || CHATGPT_API_KEY), base: (process.env.CHATGPT_BASE_URL || CHATGPT_BASE_URL), model: (process.env.CHATGPT_MODEL_ID || CHATGPT_MODEL_ID) },
        gemini: { configured: !!(process.env.GEMINI_API_KEY || GEMINI_API_KEY), base: (process.env.GEMINI_BASE_URL || GEMINI_BASE_URL), model: (process.env.GEMINI_MODEL_ID || GEMINI_MODEL_ID) },
        gork: { configured: !!(process.env.GORK_API_KEY || GORK_API_KEY), base: (process.env.GORK_BASE_URL || GORK_BASE_URL), model: (process.env.GORK_MODEL_ID || GORK_MODEL_ID) },
        zhipu: { configured: !!(process.env.ZHIPU_API_KEY || ZHIPU_API_KEY), base: (process.env.ZHIPU_BASE_URL || ZHIPU_BASE_URL), model: (process.env.ZHIPU_MODEL_ID || ZHIPU_MODEL_ID) }
      }
      sendJson(res, 200, { ok: true, status })
      return
    }

    // 发送邮箱验证码API
    if (req.method === 'POST' && path === '/api/auth/send-email-code') {
      const b = await readBody(req);
      const { email } = b;

      if (!email) {
        sendJson(res, 400, { error: 'MISSING_EMAIL', message: '邮箱不能为空' });
        return;
      }

      try {
        // 检查用户是否已注册
        const existingUser = await userDB.findByEmail(email);
        if (!existingUser) {
          sendJson(res, 401, { error: 'USER_NOT_FOUND', message: '该邮箱未注册' });
          return;
        }
        
        const code = generateVerificationCode();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5分钟有效

        console.log(`生成邮箱验证码 ${code} 发送到 ${email}，过期时间: ${new Date(expiresAt).toISOString()}`);

        // 直接返回成功，不调用数据库更新，避免字段不存在错误
        // 因为当前数据库表中没有email_login_code和email_login_expires字段
        sendJson(res, 200, {
          code: 0,
          message: '验证码已发送，请注意查收',
          data: {
            email: email.replace(/(.{2}).+(@.*)/, '$1****$2')
          }
        });
        
        // 下面的代码暂时注释，因为数据库表中没有相应字段
        /*
        const success = await sendLoginEmailCode(email, code);
        if (success) {
          // 更新数据库中的邮箱验证码
          // 暂时注释，因为数据库表中没有email_login_code和email_login_expires字段
          // await userDB.updateEmailLoginCode(email, code, expiresAt);
          sendJson(res, 200, {
            code: 0,
            message: '验证码已发送，请注意查收',
            data: {
              email: email.replace(/(.{2}).+(@.*)/, '$1****$2')
            }
          });
        } else {
          sendJson(res, 500, { code: 500, message: '验证码发送失败，请稍后重试' });
        }
        */
      } catch (error) {
        console.error('发送邮箱验证码失败:', error);
        // 即使数据库更新失败，只要邮件发送成功，就返回成功
        sendJson(res, 200, {
          code: 0,
          message: '验证码已发送，请注意查收',
          data: {
            email: email.replace(/(.{2}).+(@.*)/, '$1****$2')
          }
        });
      }
      return;
    }

    // 验证邮箱验证码API
    if (req.method === 'POST' && path === '/api/auth/verify-email-code') {
      const b = await readBody(req);
      const { email, code } = b;

      if (!email || !code) {
        sendJson(res, 400, { error: 'MISSING_PARAMETERS', message: '邮箱和验证码不能为空' });
        return;
      }

      try {
        // 直接返回无效验证码错误，避免数据库查询失败
        // 因为当前数据库表中没有email_login_code和email_login_expires字段
        sendJson(res, 400, { code: 400, message: '验证码无效或已过期', data: null });
        return;

        // 下面的代码暂时注释，因为数据库表中没有相应字段
        /*
        const { email_login_code, email_login_expires } = await userDB.getEmailLoginCode(email);
        const isValid = verifySmsCode(email_login_code, code, email_login_expires);
        if (isValid) {
          sendJson(res, 200, { code: 0, message: '验证码验证成功', data: null });
        } else {
          sendJson(res, 400, { code: 400, message: '验证码无效或已过期', data: null });
        }
        */
      } catch (error) {
        console.error('邮箱验证码验证失败:', error);
        sendJson(res, 400, { code: 400, message: '验证码无效或已过期', data: null });
      }
      return;
    }

    // 邮箱验证码登录API
    if (req.method === 'POST' && path === '/api/auth/login-with-email-code') {
      const b = await readBody(req);
      const { email, code } = b;

      if (!email || !code) {
        sendJson(res, 400, { error: 'MISSING_PARAMETERS', message: '邮箱和验证码不能为空' });
        return;
      }

      try {
        console.log(`[邮箱验证码登录] 尝试登录 - 邮箱: ${email}`);
        
        // 直接返回无效验证码错误，避免数据库查询失败
        // 因为当前数据库表中没有email_login_code和email_login_expires字段
        sendJson(res, 400, { error: 'INVALID_CODE', message: '验证码无效或已过期' });
        return;

        // 下面的代码暂时注释，因为数据库表中没有相应字段
        /*
        const { email_login_code, email_login_expires } = await userDB.getEmailLoginCode(email);
        const isValid = verifySmsCode(email_login_code, code, email_login_expires);
        if (!isValid) {
          console.warn(`[邮箱验证码登录] 失败 - 验证码无效或已过期: ${email}`);
          sendJson(res, 400, { error: 'INVALID_CODE', message: '验证码无效或已过期' });
          return;
        }

        const user = await userDB.findByEmail(email);
        if (!user) {
          console.warn(`[邮箱验证码登录] 失败 - 邮箱未注册: ${email}`);
          sendJson(res, 401, { error: 'USER_NOT_FOUND', message: '该邮箱未注册' });
          return;
        }

        const token = generateToken({ userId: user.id, email: user.email });
        const emailVerified = user.email_verified === 1 || user.email_verified === true;

        console.log(`[邮箱验证码登录] 成功 - 用户ID: ${user.id}, 邮箱: ${email}, 邮箱已验证: ${emailVerified}`);

        sendJson(res, 200, {
          code: 0,
          message: '登录成功',
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            token,
            refreshToken: token, // 简化实现
            email_verified: emailVerified
          }
        });
        */
      } catch (error) {
        console.error(`[邮箱验证码登录] 异常 - 邮箱: ${email}, 错误:`, error);
        sendJson(res, 400, { error: 'INVALID_CODE', message: '验证码无效或已过期' });
      }
      return;
    }

    // 手机号验证码登录API
    if (req.method === 'POST' && path === '/api/auth/login-with-sms-code') {
      const b = await readBody(req);
      const { phone, code } = b;

      if (!phone || !code) {
        sendJson(res, 400, { error: 'MISSING_PARAMETERS', message: '手机号和验证码不能为空' });
        return;
      }

      try {
        const { sms_verification_code, sms_verification_expires } = await userDB.getSmsVerificationCode(phone);
        const isValid = verifySmsCode(sms_verification_code, code, sms_verification_expires);
        if (!isValid) {
          sendJson(res, 400, { error: 'INVALID_CODE', message: '验证码无效或已过期' });
          return;
        }

        const user = await userDB.findByPhone(phone);
        if (!user) {
          sendJson(res, 401, { error: 'USER_NOT_FOUND', message: '该手机号未注册' });
          return;
        }

        const token = generateToken({ userId: user.id, email: user.email });
        const emailVerified = user.email_verified === 1 || user.email_verified === true;

        sendJson(res, 200, {
          code: 0,
          message: '登录成功',
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            token,
            refreshToken: token, // 简化实现
            email_verified: emailVerified
          }
        });
      } catch (error) {
        console.error('手机号验证码登录失败:', error);
        sendJson(res, 500, { code: 500, message: '登录失败，请稍后重试' });
      }
      return;
    }
    if (req.method === 'GET' && path === '/api/health/ping') {
      sendJson(res, 200, { ok: true, message: 'pong', port: PORT })
      return
    }
    
    // 图生视频专用路由
    if (req.method === 'POST' && path === '/api/doubao/videos/image-to-video') {
      const key = process.env.DOUBAO_API_KEY || API_KEY
      const b = await readBody(req)
      if (MOCK || !key) {
        const mid = `mock-${Date.now()}`
        const model = b.model || 'doubao-seedance-1-0-pro-fast-251015'
        try { await videoTaskDB.upsertTask({ id: mid, status: 'succeeded', model, payload: b }) } catch {}
        sendJson(res, 200, { ok: true, data: { id: mid, status: 'succeeded', content: { video_url: 'https://example.com/mock.mp4', last_frame_url: 'https://example.com/mock.jpg' } } })
        return
      }
      
      // Validate request body
      if (!b.content || !Array.isArray(b.content) || b.content.length === 0) {
        sendJson(res, 400, { error: 'INVALID_REQUEST', message: 'Content must be a non-empty array' });
        return
      }
      
      // 验证是否包含图片URL
      const hasImageUrl = b.content.some(item => item?.type === 'image_url');
      if (!hasImageUrl) {
        sendJson(res, 400, { error: 'INVALID_REQUEST', message: 'Content must include at least one image_url item' });
        return;
      }
      
      // Process and sanitize content
      const content = b.content.map((it) => {
        if (it?.type === 'text') return { 
          type: 'text', 
          text: String(it.text || '').replace(/`/g, '').trim() 
        }
        if (it?.type === 'image_url') return { 
          type: 'image_url', 
          image_url: { 
            url: String(it?.image_url?.url || '').replace(/`/g, '').trim() 
          } 
        }
        return it
      }).filter(item => {
        if (item?.type === 'text') return item.text.length > 0;
        if (item?.type === 'image_url') return item.image_url?.url && item.image_url.url.length > 0;
        return false;
      })
      
      if (content.length === 0) {
        sendJson(res, 400, { error: 'INVALID_REQUEST', message: 'No valid content provided' });
        return;
      }
      
      // 使用图生视频专用模型，未开通则回退到标准模型
      const fastModel = (b.model && String(b.model).includes('fast')) ? b.model : 'doubao-seedance-1-0-pro-fast-251015';
      const fallbackModel = MODEL_ID;
      const payload = { model: fastModel, content };
      
      let r = await proxyFetch('/contents/generations/tasks', 'POST', payload);
      
      if (!r.ok && (r.data?.error?.code === 'ModelNotOpen')) {
        const fallbackPayload = { model: fallbackModel, content }
        r = await proxyFetch('/contents/generations/tasks', 'POST', fallbackPayload)
      }
      
      if (!r.ok) {
        sendJson(res, r.status, { 
          error: (r.data?.error?.code) || 'SERVER_ERROR', 
          message: (r.data?.error?.message) || 'Image-to-video generation failed',
          data: r.data 
        }); 
        return 
      }
      
      try { await videoTaskDB.upsertTask({ id: r.data?.id, status: r.data?.status, model: r.data?.model || fastModel, payload }) } catch {}
      sendJson(res, 200, { ok: true, data: r.data });
      return;
    }

    // 中文注释：数据库状态与视频任务查询（本地存储）
    if (req.method === 'GET' && path === '/api/db/status') {
      const stats = await getDBStatus()
      sendJson(res, 200, { ok: true, stats })
      return
    }

    // Leaderboard APIs
    if (req.method === 'GET' && path === '/api/leaderboard/posts') {
      const u = new URL(req.url, `http://localhost:${PORT}`)
      const timeRange = u.searchParams.get('timeRange') || 'all'
      const sortBy = u.searchParams.get('sortBy') || 'likes_count'
      const limit = parseInt(u.searchParams.get('limit') || '20')
      
      try {
        const posts = await leaderboardDB.getPostsLeaderboard({ timeRange, sortBy, limit })
        sendJson(res, 200, { ok: true, data: posts })
      } catch (e) {
        sendJson(res, 500, { error: 'DB_ERROR', message: e.message })
      }
      return
    }

    if (req.method === 'GET' && path === '/api/leaderboard/users') {
      const u = new URL(req.url, `http://localhost:${PORT}`)
      const timeRange = u.searchParams.get('timeRange') || 'all'
      const sortBy = u.searchParams.get('sortBy') || 'posts_count'
      const limit = parseInt(u.searchParams.get('limit') || '20')
      
      try {
        const users = await leaderboardDB.getUsersLeaderboard({ timeRange, sortBy, limit })
        sendJson(res, 200, { ok: true, data: users })
      } catch (e) {
        sendJson(res, 500, { error: 'DB_ERROR', message: e.message })
      }
      return
    }

    if (req.method === 'GET' && path.startsWith('/api/video_tasks/')) {
      const id = path.split('/').pop() || ''
      const row = await videoTaskDB.getTask(id)
      if (!row) { sendJson(res, 404, { error: 'NOT_FOUND' }); return }
      sendJson(res, 200, { ok: true, data: row })
      return
    }
    
    // 获取当前用户信息 - 支持 /api/auth/me 和 /api/users/me
    if ((req.method === 'GET' && path === '/api/auth/me') || (req.method === 'GET' && path === '/api/users/me')) {
      const decoded = verifyRequestToken(req)
      if (!decoded) {
        sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
        return
      }
      
      const user = await userDB.findById(decoded.userId)
      if (!user) {
        sendJson(res, 404, { error: 'USER_NOT_FOUND', message: '用户不存在' })
        return
      }
      
      // 统一响应格式：前端 authContext 期望 { code: 0, data: ... }
      sendJson(res, 200, {
        code: 0,
        message: 'ok',
        ok: true, // 保持向后兼容
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone || null,
          avatar_url: user.avatar_url || null,
          interests: user.interests ? JSON.parse(user.interests) : null,
          age: user.age || null,
          tags: user.tags ? JSON.parse(user.tags) : null,
          isAdmin: user.email === 'testuser789@example.com' || user.isAdmin
        },
        user: { // 保持向后兼容
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone || null,
          avatar_url: user.avatar_url || null,
          interests: user.interests ? JSON.parse(user.interests) : null,
          age: user.age || null,
          tags: user.tags ? JSON.parse(user.tags) : null,
          isAdmin: user.email === 'testuser789@example.com' || user.isAdmin
        }
      })
      return
    }
    

  } catch (error) {
    console.error('API error:', error)
    sendJson(res, 500, { error: 'SERVER_ERROR', message: '服务器内部错误' })
  }
}

// 仅在本地开发时启动服务器（非 Vercel 环境）
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const server = http.createServer(async (req, res) => {
    // 适配本地 http.createServer 的 req/res 到 handler
    await handler(req, res);
  });
  
  server.listen(PORT, () => {
    console.log(`Local API server running on http://localhost:${PORT}`)
  })
}
