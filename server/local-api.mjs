import http from 'http'
import { URL } from 'url'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { WebSocketServer } from 'ws'
import { Readable } from 'stream'
import { createClient } from '@supabase/supabase-js'
import { generateToken, verifyToken } from './jwt.mjs'
import { userDB, favoriteDB, videoTaskDB, leaderboardDB, friendDB, messageDB, workDB, notificationDB, achievementDB, activityDB, getDBStatus } from './database.mjs'
import { sendVerificationEmail } from './emailService.mjs'
import { sendSmsVerificationCode, generateVerificationCode, verifySmsCode } from './smsService.mjs'
import { sendLoginEmailCode } from './emailService.mjs'
import { initializeUserSpace } from './services/userInitService.mjs'

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
      
      const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
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
  }
} catch (error) {
  console.error('Failed to load .env.local:', error);
}

// 初始化 Supabase 客户端 (用于同步 Auth)
let supabaseAdmin = null;
if (process.env.VITE_SUPABASE_URL) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  // 优先使用 Service Role Key (如果存在)，否则回退到 Anon Key
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (supabaseKey) {
    try {
      supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log(`[Supabase] 已初始化 (Key Type: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon'})`);
    } catch (e) {
      console.error('[Supabase] 初始化失败:', e);
    }
  } else {
    console.warn('[Supabase] 未找到 Key，跳过初始化');
  }
}

// 始终尝试兼容 VITE_ 前缀的环境变量
if (!process.env.KIMI_API_KEY && process.env.VITE_KIMI_API_KEY) {
  process.env.KIMI_API_KEY = process.env.VITE_KIMI_API_KEY;
}
if (!process.env.DASHSCOPE_API_KEY && process.env.VITE_QWEN_API_KEY) {
  process.env.DASHSCOPE_API_KEY = process.env.VITE_QWEN_API_KEY;
}
if (!process.env.DEEPSEEK_API_KEY && process.env.VITE_DEEPSEEK_API_KEY) {
  process.env.DEEPSEEK_API_KEY = process.env.VITE_DEEPSEEK_API_KEY;
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
  // 检查是否是Vercel Serverless Function环境（req.body已解析）
  if (req.body) {
    return req.body;
  }
  
  // 标准Node.js HTTP请求
  return new Promise((resolve) => {
    let data = ''
    if (req.on) {
      req.on('data', (chunk) => (data += chunk))
      req.on('end', () => {
        try { resolve(data ? JSON.parse(data) : {}) } catch { resolve({}) }
      })
      // 处理错误
      req.on('error', () => {
        resolve({})
      })
    } else {
      // 其他环境，直接返回空对象
      resolve({})
    }
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
      let authKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY || ''
      authKey = authKey.trim();
      
      console.log(`[Qwen] Request received. Key configured: ${!!authKey}, Key length: ${authKey.length}`);

      if (!authKey) { 
        console.error('[Qwen] API Key missing. Checked DASHSCOPE_API_KEY and VITE_QWEN_API_KEY.');
        sendJson(res, 503, { error: 'API_KEY_NOT_CONFIGURED', message: 'Qwen/DashScope API Key is missing. Please set DASHSCOPE_API_KEY or VITE_QWEN_API_KEY in Vercel Settings.' }); 
        return 
      }
      
      const b = await readBody(req)
      console.log(`[Qwen] Model requested: ${b.model || DASHSCOPE_MODEL_ID}`);
      
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
      
      if (r.isStream) {
         console.log('[Qwen] Stream started successfully');
         return
      }
      
      if (!r.ok) { 
          console.error('[Qwen] Upstream API Error:', r.status, JSON.stringify(r.data));
          sendJson(res, r.status, { error: (r.data?.code) || (r.data?.message) || 'SERVER_ERROR', data: r.data }); 
          return 
      }
      
      console.log('[Qwen] Response received successfully');
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
      const { username, email, password, phone, avatar_url, interests, age, tags, code } = b;
      
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
      
      let isTempUser = false;
      let existingUserId = null;

      try {
        console.log(`[注册请求] 收到请求: username=${username}, email=${email}, phone=${phone}`);
        
        // 检查邮箱是否已存在
        console.log(`[注册请求] 检查邮箱是否存在: ${email}`);
        const existingUser = await userDB.findByEmail(email);
        if (existingUser) {
          console.log(`[注册请求] 邮箱已存在: ${email}, 是否临时用户: ${existingUser.password_hash === 'TEMP_HASH'}`);
          // 检查是否是临时用户（通过发送验证码生成的占位记录）
          if (existingUser.password_hash === 'TEMP_HASH') {
            isTempUser = true;
            existingUserId = existingUser.id;
          } else {
            // 如果已存在且不是临时用户，尝试“静默登录”逻辑或提示
            // 但标准流程是返回错误。
            // 既然用户说“显示没注册，而且supabase上有这个数据”，说明Supabase有，但本地DB没有同步，或者状态不一致。
            // 鉴于我们刚切换了DB_TYPE，本地DB是新的（空的），所以 findByEmail 应该返回 null。
            // 如果 findByEmail 返回了用户，说明本地DB里确实有。
            
            // 特殊处理：如果用户坚称没注册，但库里有，可能是之前的测试数据。
            // 允许覆盖注册？不，这不安全。
            sendJson(res, 400, { error: 'EMAIL_ALREADY_EXISTS', message: '该邮箱已被注册' });
            return;
          }
        }
        
        // 检查用户名是否已存在
        console.log(`[注册请求] 检查用户名是否存在: ${username}`);
        const existingUsername = await userDB.findByUsername(username);
        if (existingUsername) {
          console.log(`[注册请求] 用户名已存在: ${username}`);
          // 如果是同一个临时用户，则不算冲突
          if (!isTempUser || existingUsername.id !== existingUserId) {
            sendJson(res, 400, { error: 'USERNAME_ALREADY_EXISTS', message: '该用户名已被使用' });
            return;
          }
        }

        // 如果提供了验证码，进行验证
        if (code) {
           console.log(`[注册请求] 验证验证码: ${code}`);
           const { email_login_code, email_login_expires } = await userDB.getEmailLoginCode(email);
           const isValid = verifySmsCode(email_login_code, code, email_login_expires);
           if (!isValid) {
             sendJson(res, 400, { error: 'INVALID_CODE', message: '验证码无效或已过期' });
             return;
           }
        } else if (isTempUser) {
            console.log(`[注册请求] 临时用户注册但缺少验证码`);
            // 如果是临时用户注册，必须提供验证码
            sendJson(res, 400, { error: 'MISSING_CODE', message: '请填写验证码以完成注册' });
            return;
        }
        
        // 密码加密
        console.log(`[注册请求] 加密密码`);
        const password_hash = await bcrypt.hash(password, 10);
        
        let userId;
        if (isTempUser) {
          // 更新临时用户记录
          console.log(`[注册请求] 更新临时用户: ${existingUserId}`);
          await userDB.updateById(existingUserId, {
            username,
            password_hash,
            age: age || null,
            tags: tags || null,
            interests: interests || null,
            phone: phone || null,
            avatar_url: avatar_url || null,
            email_verified: 1, // 既然通过了验证码，就视为已验证
            updated_at: Date.now()
          });
          userId = existingUserId;
        } else {
          // 尝试同步创建 Supabase 用户
          let supabaseUserId = null;
          if (supabaseAdmin) {
              console.log(`[注册请求] 尝试同步创建 Supabase 用户...`);
              try {
                  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
                      // 使用 Service Role Key 直接创建 (自动确认邮箱)
                      const { data, error } = await supabaseAdmin.auth.admin.createUser({
                          email,
                          password,
                          user_metadata: { username, phone },
                          email_confirm: true
                      });
                      if (error) {
                           console.warn(`[Supabase Sync] Admin Create 失败: ${error.message}`);
                           // 如果用户已存在，尝试获取其ID
                           if (error.message.includes('already been registered') || error.status === 422) {
                               console.log('[Supabase Sync] 用户已存在，尝试获取ID...');
                               // 注意：admin.listUsers 不能按邮箱过滤，只能获取列表后筛选，或者尝试 getUserById（如果有ID）
                               // 更好的方式是忽略此错误，让后续流程继续（本地创建）
                               // 或者通过 admin.inviteUserByEmail 也许能获取？不，那会发送邮件
                               // 暂时忽略，因为本地数据库才是主要来源
                           }
                      } else if (data.user) {
                           supabaseUserId = data.user.id;
                           console.log(`[Supabase Sync] 用户已创建: ${supabaseUserId}`);
                      }
                  } else {
                      // 使用 Anon Key 注册 (可能会发送确认邮件)
                      const { data, error } = await supabaseAdmin.auth.signUp({
                          email,
                          password,
                          options: {
                              data: { username, phone }
                          }
                      });
                      if (error) {
                          console.warn(`[Supabase Sync] SignUp 失败: ${error.message}`);
                      } else if (data.user) {
                          supabaseUserId = data.user.id;
                          console.log(`[Supabase Sync] 用户已注册: ${supabaseUserId}`);
                      }
                  }
              } catch (err) {
                  console.error(`[Supabase Sync] 异常:`, err);
              }
          }

          // 创建新用户
          console.log(`[注册请求] 创建新用户: ${username} <${email}>`);
          const newUser = await userDB.createUser({
            id: supabaseUserId, // 尝试使用 Supabase ID
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
          console.log(`[注册请求] 新用户创建成功，ID: ${newUser.id}`);
          userId = newUser.id;
        }
        
        // 生成JWT令牌
        console.log(`[注册请求] 生成JWT令牌`);
        const token = generateToken({ userId, email });
        
        // 既然已经通过验证码验证，就不需要再发验证邮件了，或者可以发一封欢迎邮件
        // const verificationToken = generateToken({ userId, email }, '24h');
        // await sendVerificationEmail(email, verificationToken, username);
        
        console.log(`[用户注册] 成功 - 用户ID: ${userId}, 邮箱: ${email}`);
        
        sendJson(res, 200, {
          code: 0,
          message: '注册成功',
          data: {
            id: userId,
            username,
            email,
            token,
            email_verified: true
          }
        });
      } catch (error) {
        console.error('注册失败:', error);
        console.error('注册失败详细信息:', error.stack);
        sendJson(res, 500, { error: 'INTERNAL_ERROR', message: '注册失败，请稍后重试', details: error.message });
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

    // Supabase 登录/注册桥接 API
    // 前端使用 Supabase 完成验证后，调用此接口换取本地 JWT
    if (req.method === 'POST' && path === '/api/auth/supabase-login') {
      const b = await readBody(req);
      const { email, access_token, refresh_token, phone } = b;

      if (!access_token) {
        sendJson(res, 400, { error: 'MISSING_TOKEN', message: 'Supabase access_token is required' });
        return;
      }

      try {
        // 1. 验证 Supabase Token
        // 使用 Supabase Auth API 获取用户信息
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          console.error('Supabase not configured on server');
          sendJson(res, 500, { error: 'CONFIG_ERROR', message: 'Server Supabase configuration missing' });
          return;
        }

        const userResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'apikey': supabaseKey
          }
        });

        if (!userResp.ok) {
          console.error('Supabase token validation failed');
          sendJson(res, 401, { error: 'INVALID_TOKEN', message: 'Invalid Supabase token' });
          return;
        }

        const supabaseUser = await userResp.json();
        
        // 验证邮箱或手机号是否匹配
        const userEmail = supabaseUser.email;
        const userPhone = supabaseUser.phone;
        
        // 2. 在本地数据库查找或创建用户
        // 优先使用 email，其次 phone
        const identifier = email || userEmail || phone || userPhone;
        if (!identifier) {
           sendJson(res, 400, { error: 'USER_INFO_MISSING', message: 'User must have email or phone' });
           return;
        }

        let user = null;
        if (userEmail) {
          user = await userDB.findByEmail(userEmail);
        } else if (userPhone) {
          user = await userDB.findByPhone(userPhone);
        }

        const now = Date.now();
        
        if (!user) {
          // 创建新用户
          console.log(`[Supabase桥接] 创建新用户: ${identifier}`);
          // 生成随机密码占位
          const password_hash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
          
          const newUser = await userDB.createUser({
            username: identifier.split('@')[0], // 默认用户名
            email: userEmail || identifier, // 如果只有手机号，暂时用手机号当邮箱字段存（需 schema 支持）或者留空
            password_hash,
            phone: userPhone,
            auth_provider: 'supabase',
            email_verified: 1,
            created_at: now,
            updated_at: now
          });
          user = await userDB.findById(newUser.id);
        } else {
          console.log(`[Supabase桥接] 关联现有用户: ${user.id}`);
          // 可选：更新 auth_provider 信息
        }

        // 3. 颁发本地 JWT
        const token = generateToken({ userId: user.id, email: user.email });

        // 4. 初始化用户空间（如果是新用户或未初始化）
        await initializeUserSpace(user.id);

        sendJson(res, 200, {
          code: 0,
          message: '登录成功',
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            token,
            refreshToken: token,
            email_verified: true
          }
        });

      } catch (error) {
        console.error('Supabase login bridge failed:', error);
        sendJson(res, 500, { error: 'INTERNAL_ERROR', message: `Login failed: ${error.message}` });
      }
      return;
    }

    // 登录API
    if (req.method === 'POST' && path === '/api/auth/login') {
      const b = await readBody(req);
      let { email, password } = b;
      
      // 统一转换为小写
      if (email) email = email.toLowerCase();
      
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
          console.warn(`[用户登录] 失败 - 邮箱不存在: ${email} (normalized)`);
          sendJson(res, 401, { error: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' });
          return;
        }
        
        // 检查用户是否有password_hash字段（可能通过其他方式注册）
        if (!user.password_hash || user.password_hash === 'TEMP_HASH') {
          console.warn(`[用户登录] 失败 - 用户未完成注册流程: ${email}`);
          sendJson(res, 401, { error: 'INVALID_CREDENTIALS', message: '该邮箱尚未完成注册，请先注册' });
          return;
        }
        
        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
          console.warn(`[用户登录] 失败 - 密码错误: ${email}`);
          console.log(`[Debug] Provided password length: ${password.length}, Hash in DB: ${user.password_hash.substring(0, 10)}...`);
          sendJson(res, 401, { error: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' });
          return;
        }
        
        // 检查邮箱验证状态
        const emailVerified = user.email_verified === 1 || user.email_verified === true;
        
        // 特殊修正：如果是刚从Supabase同步过来的用户（或者历史遗留），可能没有password_hash
        // 但如果能走到这里，说明 verifyHash 通过了。
        // 如果是 Supabase Auth 登录的用户，不应该走 /api/auth/login，而是 /api/auth/supabase-login
        // 但如果用户试图用邮箱密码登录，我们需要确保本地存了密码hash。
        // 对于 Supabase Auth 托管的用户，本地可能不知道明文密码，无法验证。
        // 除非我们完全接管了 auth。
        
        // 既然我们现在是 Hybrid 模式，且 DB_TYPE=supabase，userDB 实际上是操作 Supabase 的 public.users 表
        // 而 Supabase 的 auth.users 表才存密码。
        // 所以，本地的 /api/auth/login 逻辑其实是有问题的，它试图验证 public.users 里的 password_hash
        // 但 Supabase Auth 不会把密码同步到 public.users。
        
        // 修正方案：如果 DB_TYPE 是 supabase，应该调用 Supabase 的 Auth API 来验证密码
        if (process.env.DB_TYPE === 'supabase') {
           const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
           const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
           
           if (supabaseUrl && supabaseKey) {
             console.log(`[用户登录] 委托 Supabase Auth 验证: ${email}`);
             const authResp = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
               method: 'POST',
               headers: {
                 'apikey': supabaseKey,
                 'Content-Type': 'application/json'
               },
               body: JSON.stringify({ email, password })
             });
             
             if (authResp.ok) {
               const authData = await authResp.json();
               console.log(`[用户登录] Supabase Auth 验证成功`);
               // 验证成功，颁发本地 Token
               // 确保本地 public.users 有这个用户
               let localUser = await userDB.findByEmail(email);
               if (!localUser) {
                 // 同步创建
                 const now = Date.now();
                 const newUser = await userDB.createUser({
                    username: email.split('@')[0],
                    email,
                    password_hash: 'MANAGED_BY_SUPABASE',
                    auth_provider: 'supabase',
                    email_verified: 1,
                    created_at: now,
                    updated_at: now
                 });
                 localUser = await userDB.findById(newUser.id);
               }
               
               const token = generateToken({ userId: localUser.id, email: localUser.email });
               
               // 初始化用户空间
               await initializeUserSpace(localUser.id);

               // Log Activity
               await activityDB.logActivity({
                 userId: localUser.id,
                 actionType: 'login',
                 entityType: 'user',
                 entityId: localUser.id,
                 details: { description: '邮箱登录 (Supabase)' },
                 ipAddress: req.socket.remoteAddress,
                 userAgent: req.headers['user-agent']
               });

               sendJson(res, 200, {
                  code: 0,
                  message: '登录成功',
                  data: {
                    id: localUser.id,
                    username: localUser.username,
                    email: localUser.email,
                    token,
                    email_verified: true
                  }
               });
               return;
             } else {
               console.warn(`[用户登录] Supabase Auth 验证失败: ${authResp.status}`);
               // 如果 Supabase 验证失败，继续尝试本地验证（为了兼容旧数据）
             }
           }
        }

        // 验证密码 (本地逻辑)
        // 修正变量冲突问题
        const isPasswordValidLocal = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValidLocal) {
           console.warn(`[用户登录] 失败 - 密码错误: ${email}`);
           console.log(`[Debug] Provided password length: ${password.length}, Hash in DB: ${user.password_hash.substring(0, 10)}...`);
           sendJson(res, 401, { error: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' });
           return;
         }
         
         // 检查邮箱验证状态
          // 修正变量冲突问题
          const emailVerifiedLocal = user.email_verified === 1 || user.email_verified === true;
          
          // 生成JWT令牌
          const token = generateToken({ userId: user.id, email: user.email });
          
          // 初始化用户空间
          await initializeUserSpace(user.id);

          console.log(`[用户登录] 成功 - 用户ID: ${user.id}, 邮箱: ${email}, 邮箱已验证: ${emailVerifiedLocal}`);
          
          // Log Activity
          await activityDB.logActivity({
            userId: user.id,
            actionType: 'login',
            entityType: 'user',
            entityId: user.id,
            details: { description: '邮箱登录 (Local)' },
            ipAddress: req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
          });

          sendJson(res, 200, {
            code: 0,
            message: emailVerifiedLocal ? '登录成功' : '登录成功，但您的邮箱尚未验证，请尽快验证',
            data: {
              id: user.id,
              username: user.username,
              email: user.email,
              token,
              email_verified: emailVerifiedLocal
            }
          });
       } catch (error) {
         console.error(`[用户登录] 异常 - 邮箱: ${email}, 错误:`, error);
         sendJson(res, 500, { error: 'INTERNAL_ERROR', message: `登录失败: ${error.message}` });
       }
       return;
     }
    if (req.method === 'POST' && path === '/api/auth/logout') {
      // JWT是无状态的，登出只需客户端删除令牌即可
      sendJson(res, 200, {
        code: 0,
        message: '退出成功',
        data: null
      });
      return;
    }

    // 获取当前用户信息
    if (req.method === 'GET' && (path === '/api/auth/me' || path === '/api/users/me')) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendJson(res, 401, { error: 'MISSING_TOKEN', message: '未提供令牌' });
        return;
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      
      if (!decoded) {
        sendJson(res, 401, { error: 'INVALID_TOKEN', message: '无效的令牌' });
        return;
      }
      
      try {
        const user = await userDB.findById(decoded.userId);
        if (!user) {
          sendJson(res, 404, { error: 'USER_NOT_FOUND', message: '用户不存在' });
          return;
        }
        
        sendJson(res, 200, {
          code: 0,
          message: '获取成功',
          data: {
            ...user,
            avatar: user.avatar_url, // 映射 avatar_url 为 avatar，兼容前端
            email_verified: user.email_verified === 1 || user.email_verified === true
          }
        });
      } catch (error) {
        console.error('获取用户信息失败:', error);
        sendJson(res, 500, { error: 'INTERNAL_ERROR', message: '获取用户信息失败' });
      }
      return;
    }
    
    // 更新当前用户信息
    if (req.method === 'PUT' && path === '/api/users/me') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendJson(res, 401, { error: 'MISSING_TOKEN', message: '未提供令牌' });
        return;
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      
      if (!decoded) {
        sendJson(res, 401, { error: 'INVALID_TOKEN', message: '无效的令牌' });
        return;
      }
      
      try {
        const updates = await readBody(req);
        // 过滤不允许更新的字段
        delete updates.id;
        delete updates.email; // 通常不允许改邮箱
        delete updates.password_hash;
        delete updates.created_at;
        
        // 兼容前端 avatar 字段，映射为 avatar_url
        if (updates.avatar && !updates.avatar_url) {
          updates.avatar_url = updates.avatar;
          delete updates.avatar;
        }
        
        console.log(`[更新资料] 用户ID: ${decoded.userId}, 更新内容:`, updates);
        
        const updatedUser = await userDB.updateById(decoded.userId, updates);
        
        if (!updatedUser) {
           sendJson(res, 404, { error: 'USER_NOT_FOUND', message: '更新失败，用户不存在' });
           return;
        }
        
        sendJson(res, 200, {
          code: 0,
          message: '更新成功',
          data: {
            ...updatedUser,
            avatar: updatedUser.avatar_url, // 映射 avatar_url 为 avatar，兼容前端
            email_verified: updatedUser.email_verified === 1 || updatedUser.email_verified === true
          }
        });
      } catch (error) {
        console.error('更新用户信息失败:', error);
        sendJson(res, 500, { error: 'INTERNAL_ERROR', message: `更新失败: ${error.message}` });
      }
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
    
    // 发送注册短信验证码API
    if (req.method === 'POST' && path === '/api/auth/send-register-sms-code') {
      const b = await readBody(req);
      const { phone } = b;
      
      if (!phone) {
        sendJson(res, 400, { error: 'MISSING_PHONE', message: '手机号不能为空' });
        return;
      }
      
      try {
        // 检查用户是否已注册
        const existingUser = await userDB.findByPhone(phone);
        if (existingUser) {
          sendJson(res, 400, { error: 'PHONE_ALREADY_REGISTERED', message: '该手机号已被注册' });
          return;
        }
        
        // 生成验证码
        const code = generateVerificationCode();
        // 验证码5分钟后过期
        const expiresAt = Date.now() + 5 * 60 * 1000;
        
        console.log(`生成注册验证码 ${code} 发送到 ${phone}，过期时间: ${new Date(expiresAt).toISOString()}`);
        
        // 发送短信验证码
        const success = await sendSmsVerificationCode(phone, code);
        
        if (success) {
          // 保存验证码到数据库
          await userDB.updateSmsVerificationCode(phone, code, expiresAt);
          
          sendJson(res, 200, {
            code: 0,
            message: '验证码已发送，请注意查收',
            data: {
              phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), // 隐藏中间4位
              // 开发环境直接返回验证码方便测试
              mockCode: code
            }
          });
        } else {
          sendJson(res, 500, {
            code: 500,
            message: '验证码发送失败，请稍后重试'
          });
        }
      } catch (error) {
        console.error('发送注册短信验证码失败:', error);
        sendJson(res, 500, {
          code: 500,
          message: '验证码发送失败，请稍后重试'
        });
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
              phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), // 隐藏中间4位
              // 开发环境直接返回验证码方便测试
              mockCode: code
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

    // 发送注册邮箱验证码API
    if (req.method === 'POST' && path === '/api/auth/send-register-email-code') {
      const b = await readBody(req);
      const { email } = b;

      if (!email) {
        sendJson(res, 400, { error: 'MISSING_EMAIL', message: '邮箱不能为空' });
        return;
      }

      try {
        // 检查用户是否已注册
        const existingUser = await userDB.findByEmail(email);
        if (existingUser) {
          sendJson(res, 400, { error: 'EMAIL_ALREADY_EXISTS', message: '该邮箱已被注册' });
          return;
        }
        
        const code = generateVerificationCode();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5分钟有效

        console.log(`生成注册邮箱验证码 ${code} 发送到 ${email}，过期时间: ${new Date(expiresAt).toISOString()}`);

        const success = await sendLoginEmailCode(email, code); // 复用发送验证码邮件的函数
        console.log(`邮件发送结果: ${success}`);
        
        if (success) {
          // 更新数据库中的邮箱验证码 (会创建临时用户记录或更新现有记录)
          console.log(`正在更新数据库邮箱验证码...`);
          await userDB.updateEmailLoginCode(email, code, expiresAt);
          console.log(`数据库更新成功`);
          
          sendJson(res, 200, {
            code: 0,
            message: '验证码已发送，请注意查收',
            data: {
              email: email.replace(/(.{2}).+(@.*)/, '$1****$2')
            }
          });
        } else {
          console.error(`邮件发送失败: sendLoginEmailCode returned false`);
          sendJson(res, 500, { code: 500, message: '验证码发送失败，请稍后重试' });
        }
      } catch (error) {
        console.error('发送注册邮箱验证码失败:', error);
        // 返回具体错误信息以便调试
        sendJson(res, 500, { error: 'INTERNAL_ERROR', message: `验证码发送失败: ${error.message}` });
      }
      return;
    }

    // 发送邮箱验证码API
    if (req.method === 'POST' && path === '/api/auth/send-email-code') {
      const b = await readBody(req);
      let { email } = b;
      
      // 统一转换为小写
      if (email) email = email.toLowerCase();

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

        const success = await sendLoginEmailCode(email, code);
        
        if (success) {
          // 更新数据库中的邮箱验证码
          await userDB.updateEmailLoginCode(email, code, expiresAt);
          
          sendJson(res, 200, {
            code: 0,
            message: '验证码已发送，请注意查收',
            data: {
              email: email.replace(/(.{2}).+(@.*)/, '$1****$2'),
              // 开发环境直接返回验证码方便测试
              mockCode: code
            }
          });
        } else {
          sendJson(res, 500, { code: 500, message: '验证码发送失败，请稍后重试' });
        }
      } catch (error) {
        console.error('发送邮箱验证码失败:', error);
        sendJson(res, 500, { error: 'INTERNAL_ERROR', message: `验证码发送失败: ${error.message}` });
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
        const { email_login_code, email_login_expires } = await userDB.getEmailLoginCode(email);
        const isValid = verifySmsCode(email_login_code, code, email_login_expires);
        
        if (isValid) {
          sendJson(res, 200, { code: 0, message: '验证码验证成功', data: null });
        } else {
          sendJson(res, 400, { code: 400, message: '验证码无效或已过期', data: null });
        }
      } catch (error) {
        console.error('邮箱验证码验证失败:', error);
        sendJson(res, 400, { code: 400, message: '验证码无效或已过期', data: null });
      }
      return;
    }

    // 重置密码API
    if (req.method === 'POST' && path === '/api/auth/reset-password') {
      const b = await readBody(req);
      let { email, code, newPassword } = b;
      
      if (email) email = email.toLowerCase();

      if (!email || !code || !newPassword) {
        sendJson(res, 400, { error: 'MISSING_PARAMETERS', message: '邮箱、验证码和新密码不能为空' });
        return;
      }

      try {
        // 1. 验证验证码
        const { email_login_code, email_login_expires } = await userDB.getEmailLoginCode(email);
        const isValid = verifySmsCode(email_login_code, code, email_login_expires);
        
        if (!isValid) {
          sendJson(res, 400, { error: 'INVALID_CODE', message: '验证码无效或已过期' });
          return;
        }

        // 2. 查找用户
        const user = await userDB.findByEmail(email);
        if (!user) {
          sendJson(res, 404, { error: 'USER_NOT_FOUND', message: '用户不存在' });
          return;
        }

        // 3. 更新密码
        const password_hash = await bcrypt.hash(newPassword, 10);
        await userDB.updateById(user.id, { password_hash, updated_at: Date.now() });

        // 4. 清除验证码 (可选，防止重放)
        // await userDB.updateEmailLoginCode(email, null, 0); 

        sendJson(res, 200, {
          code: 0,
          message: '密码重置成功，请使用新密码登录',
          data: null
        });

      } catch (error) {
        console.error('重置密码失败:', error);
        sendJson(res, 500, { error: 'INTERNAL_ERROR', message: `重置密码失败: ${error.message}` });
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
      } catch (error) {
        console.error(`[邮箱验证码登录] 异常 - 邮箱: ${email}, 错误:`, error);
        sendJson(res, 500, { error: 'INTERNAL_ERROR', message: `登录失败: ${error.message}` });
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
      
      const cacheKey = `leaderboard_posts_${timeRange}_${sortBy}_${limit}`;
      const cached = getFromCache(cacheKey);
      if (cached) {
        sendJson(res, 200, cached);
        return;
      }

      try {
        const posts = await leaderboardDB.getPostsLeaderboard({ timeRange, sortBy, limit })
        const data = { ok: true, data: posts };
        setCache(cacheKey, data, 60 * 1000); // Cache for 1 minute
        sendJson(res, 200, data)
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
      
      const cacheKey = `leaderboard_users_${timeRange}_${sortBy}_${limit}`;
      const cached = getFromCache(cacheKey);
      if (cached) {
        sendJson(res, 200, cached);
        return;
      }

      try {
        const users = await leaderboardDB.getUsersLeaderboard({ timeRange, sortBy, limit })
        const data = { ok: true, data: users };
        setCache(cacheKey, data, 60 * 1000);
        sendJson(res, 200, data)
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

    // 处理通义千问模型的视频生成请求
    if (req.method === 'POST' && path === '/api/qwen/videos/generate') {
      // 从环境变量获取API密钥
      let authKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY || ''
      authKey = authKey.trim();
      
      if (!authKey) {
        console.error('[Qwen Video] API Key missing.');
        sendJson(res, 503, { error: 'API_KEY_NOT_CONFIGURED', message: 'Qwen/DashScope API Key is missing.' });
        return
      }
      
      const b = await readBody(req)
      console.log('[Qwen Video] Request received:', b);
      
      // 处理通义千问视频生成
      try {
        const base = 'https://dashscope.aliyuncs.com/api/v1';
        const endpoint = `${base}/services/aigc/text2video/video-synthesis`;
        
        // 构造请求数据
        // 如果 content 中包含 image_url，则自动切换到 wanx2.1-i2v-turbo 模型，除非显式指定了其他模型
        let model = b.model || 'wanx2.1-t2v-turbo';
        const content = b.content || [{ type: 'text', text: b.prompt || 'Tianjin cultural design' }];
        const hasImage = content.some(item => item.type === 'image_url');
        
        if (hasImage && !b.model) {
           model = 'wanx2.1-i2v-turbo';
           console.log('[Qwen Video] Detected image input, switching to i2v model:', model);
        }

        const payload = {
          model: model,
          input: {
            content: content
          },
          parameters: {
            duration: b.duration,
            resolution: b.resolution,
            aspect_ratio: b.aspect_ratio
          }
        };
        
        console.log('[Qwen Video] Sending request to DashScope:', payload);
        
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authKey}`,
            'X-DashScope-Async': 'enable'
          },
          body: JSON.stringify(payload)
        });
        
        console.log('[Qwen Video] Response status:', resp.status);
        
        if (!resp.ok) {
          const errorData = await resp.json().catch(() => ({}));
          console.error('[Qwen Video] Error response:', errorData);
          sendJson(res, resp.status, { error: errorData.error || 'Video generation failed', data: errorData });
          return
        }
        
        const createData = await resp.json();
        console.log('[Qwen Video] Create task response:', createData);
        
        const taskId = createData?.output?.task_id || createData?.task_id;
        if (!taskId) {
          sendJson(res, 500, { error: 'TASK_ID_MISSING', message: 'Missing task ID in response', data: createData });
          return
        }
        
        // 轮询任务状态
        const startedAt = Date.now();
        const timeoutMs = 300000; // 5分钟超时
        while (Date.now() - startedAt < timeoutMs) {
          const taskResp = await fetch(`${base}/tasks/${taskId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authKey}`
            }
          });
          
          const taskData = await taskResp.json();
          console.log('[Qwen Video] Task status:', taskData?.output?.task_status || taskData?.task_status);
          
          if (!taskResp.ok) {
            sendJson(res, taskResp.status, { error: 'TASK_STATUS_ERROR', data: taskData });
            return
          }
          
          const status = String(taskData?.output?.task_status || taskData?.task_status || '').toUpperCase();
          if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELED' || status === 'CANCELLED') {
            if (status !== 'SUCCEEDED') {
              sendJson(res, 500, { error: 'TASK_FAILED', message: `Task failed with status: ${status}`, data: taskData });
              return
            }
            
            // 构建响应数据
            const videoUrl = taskData?.output?.results?.[0]?.video_url || taskData?.output?.video_url || '';
            const lastFrameUrl = taskData?.output?.results?.[0]?.last_frame_url || taskData?.output?.last_frame_url || '';
            
            const result = {
              video_url: videoUrl,
              last_frame_url: lastFrameUrl,
              task_id: taskId,
              status: status
            };
            
            console.log('[Qwen Video] Task succeeded:', result);
            sendJson(res, 200, { ok: true, data: result });
            return
          }
          
          // 等待3秒后再次轮询
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // 超时
        sendJson(res, 504, { error: 'TASK_TIMEOUT', message: 'Video generation task timed out after 5 minutes' });
      } catch (error) {
        console.error('[Qwen Video] Exception:', error);
        sendJson(res, 500, { error: error.message || 'Video generation failed' });
      }
      return
    }

    // ==========================================
    // 天津文化活动平台 Mock API
    // ==========================================
    
    // 获取活动列表
    if (req.method === 'GET' && path === '/api/tianjin/activities') {
       // 模拟活动数据
       const activities = [
         {
           id: 'act-001',
           title: '2025“津门古韵”创意设计大赛',
           cover: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?w=800&q=80',
           deadline: '2025-12-31',
           status: 'active',
           description: '征集以天津古建筑、非遗文化为主题的创意设计作品，形式不限。'
         },
         {
           id: 'act-002',
           title: '“海河之光”短视频挑战赛',
           cover: 'https://images.unsplash.com/photo-1574610758391-6c4c1587f1ee?w=800&q=80',
           deadline: '2025-10-15',
           status: 'active',
           description: '用镜头记录海河两岸的日新月异，展现天津现代化都市风貌。'
         },
         {
           id: 'act-003',
           title: '天津卫老字号新国潮',
           cover: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&q=80',
           deadline: '2025-08-20',
           status: 'ending_soon',
           description: '鼓励为狗不理、十八街麻花等老字号设计新国潮包装或宣传物料。'
         }
       ];
       sendJson(res, 200, { ok: true, data: activities });
       return;
    }

    // 提交作品
    if (req.method === 'POST' && path === '/api/tianjin/submit') {
      const b = await readBody(req);
      const { activityId, workTitle, workDesc, workUrl, authorName, authorPhone } = b;
      
      if (!activityId || !workUrl) {
        sendJson(res, 400, { error: 'MISSING_PARAMS', message: '缺少必要参数' });
        return;
      }
      
      // 模拟提交成功
      console.log(`[Tianjin Activity] Submission received: Activity ${activityId}, Work: ${workTitle}`);
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      sendJson(res, 200, { 
        ok: true, 
        message: '作品提交成功！',
        data: {
          submissionId: `sub-${Date.now()}`,
          submittedAt: Date.now(),
          status: 'pending_review'
        }
      });
      return;
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
      
      // 获取用户作品列表
  if (req.method === 'GET' && path === '/api/user/works') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    const limit = parseInt(req.url.searchParams.get('limit') || '50')
    const offset = parseInt(req.url.searchParams.get('offset') || '0')
    
    try {
      const works = await workDB.getWorksByUserId(decoded.userId, limit, offset)
      sendJson(res, 200, { code: 0, data: works })
    } catch (e) {
      console.error('[API] Get works failed:', e)
      sendJson(res, 500, { code: 1, message: '获取作品失败' })
    }
    return
  }

  // 获取用户统计数据
  if (req.method === 'GET' && path === '/api/user/stats') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    
    try {
      const stats = await workDB.getWorkStats(decoded.userId)
      const user = await userDB.findById(decoded.userId)
      
      // Calculate Points & Level
      let totalPoints = await achievementDB.getUserTotalPoints(decoded.userId)
      // Safety check for NaN or null
      if (typeof totalPoints !== 'number' || isNaN(totalPoints)) {
        totalPoints = 0
      }
      
      let level = 1
      let nextLevelPoints = 100
      let progress = 0
      
      if (totalPoints < 100) {
        level = 1
        nextLevelPoints = 100
        progress = (totalPoints / 100) * 100
      } else if (totalPoints < 500) {
        level = 2
        nextLevelPoints = 500
        progress = ((totalPoints - 100) / 400) * 100
      } else if (totalPoints < 2000) {
        level = 3
        nextLevelPoints = 2000
        progress = ((totalPoints - 500) / 1500) * 100
      } else {
        level = 4 // Max level for now
        nextLevelPoints = 2000
        progress = 100
      }
      
      const fullStats = {
        ...stats,
        followers_count: 0,
        following_count: 0,
        favorites_count: (await favoriteDB.getUserFavorites(decoded.userId)).length,
        membership_level: user.membership_level,
        membership_status: user.membership_status,
        points: totalPoints,
        level: level,
        level_progress: Math.min(Math.max(progress, 0), 100),
        next_level_points: nextLevelPoints
      }
      sendJson(res, 200, { code: 0, data: fullStats })
    } catch (e) {
      console.error('[API] Get stats failed:', e)
      sendJson(res, 500, { code: 1, message: '获取统计数据失败' })
    }
    return
  }

  // 获取积分历史
  if (req.method === 'GET' && path === '/api/user/points/history') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    
    try {
      const records = await achievementDB.getPointsRecords(decoded.userId)
      sendJson(res, 200, { code: 0, data: records })
    } catch (e) {
      console.error('[API] Get points history failed:', e)
      sendJson(res, 500, { code: 1, message: '获取积分记录失败' })
    }
    return
  }

  // 获取用户活动日志
  if (req.method === 'GET' && path === '/api/user/activities') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    
    try {
      const limit = parseInt(req.query.get('limit') || '20')
      const offset = parseInt(req.query.get('offset') || '0')
      const activities = await activityDB.getUserActivities(decoded.userId, limit, offset)
      sendJson(res, 200, { code: 0, data: activities })
    } catch (e) {
      console.error('[API] Get activities failed:', e)
      sendJson(res, 500, { code: 1, message: '获取活动日志失败' })
    }
    return
  }

  // 创建作品 (Mock implementation for now, just to award points)
  if (req.method === 'POST' && path === '/api/works') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    
    try {
      // In a real app, we would insert into works table. 
      // For now, we assume success and award points.
      // We should probably parse the body to get title/content
      
      // Award Points
      await achievementDB.addPointsRecord({
        userId: decoded.userId,
        source: 'creation',
        type: 'earn',
        points: 50,
        description: '发布新作品'
      })
      
      // Add notification
      await notificationDB.addNotification({
        userId: decoded.userId,
        title: '作品发布成功',
        content: '恭喜！您的作品已发布，获得50积分！',
        type: 'success'
      })

      // Log Activity
      await activityDB.logActivity({
        userId: decoded.userId,
        actionType: 'create_work',
        entityType: 'work',
        entityId: 'new_work', // In real app use returned ID
        details: { title: req.body.title || 'Untitled', description: '发布新作品' },
        ipAddress: req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      sendJson(res, 200, { code: 0, data: { id: Date.now(), ...req.body } }) // Echo back
    } catch (e) {
      console.error('[API] Create work failed:', e)
      sendJson(res, 500, { code: 1, message: '发布作品失败' })
    }
    return
  }

  // 点赞作品
  if (req.method === 'POST' && path.match(/^\/api\/works\/\d+\/like$/)) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    
    try {
      // Award Points
      await achievementDB.addPointsRecord({
        userId: decoded.userId,
        source: 'interaction',
        type: 'earn',
        points: 5,
        description: '点赞作品'
      })
      
      // Log Activity
      const workId = path.split('/')[3]
      await activityDB.logActivity({
        userId: decoded.userId,
        actionType: 'like_work',
        entityType: 'work',
        entityId: workId,
        details: { description: '点赞作品' },
        ipAddress: req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      sendJson(res, 200, { code: 0, success: true })
    } catch (e) {
      console.error('[API] Like work failed:', e)
      sendJson(res, 500, { code: 1, message: '点赞失败' })
    }
    return
  }


  // 获取通知列表
  if (req.method === 'GET' && path === '/api/notifications') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    const limit = parseInt(req.url.searchParams.get('limit') || '20')
    const offset = parseInt(req.url.searchParams.get('offset') || '0')
    
    try {
      const notifications = await notificationDB.getNotifications(decoded.userId, limit, offset)
      const unreadCount = await notificationDB.getUnreadCount(decoded.userId)
      sendJson(res, 200, { code: 0, data: { list: notifications, unread_count: unreadCount } })
    } catch (e) {
      console.error('[API] Get notifications failed:', e)
      sendJson(res, 500, { code: 1, message: '获取通知失败' })
    }
    return
  }

  // 标记所有通知为已读
  if (req.method === 'POST' && path === '/api/notifications/read-all') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    
    try {
      await notificationDB.markAllAsRead(decoded.userId)
      sendJson(res, 200, { code: 0, success: true })
    } catch (e) {
      console.error('[API] Mark all read failed:', e)
      sendJson(res, 500, { code: 1, message: '操作失败' })
    }
    return
  }

  // 标记单个通知为已读
  if (req.method === 'POST' && path.match(/^\/api\/notifications\/[\w-]+\/read$/)) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    const id = path.split('/')[3]
    
    try {
      await notificationDB.markAsRead(id, decoded.userId)
      sendJson(res, 200, { code: 0, success: true })
    } catch (e) {
      console.error('[API] Mark read failed:', e)
      sendJson(res, 500, { code: 1, message: '操作失败' })
    }
    return
  }

  // 获取用户成就
  if (req.method === 'GET' && path === '/api/user/achievements') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    
    try {
      const achievements = await achievementDB.getUserAchievements(decoded.userId)
      sendJson(res, 200, { code: 0, data: achievements })
    } catch (e) {
      console.error('[API] Get achievements failed:', e)
      sendJson(res, 500, { code: 1, message: '获取成就失败' })
    }
    return
  }

  // 获取用户积分记录
  if (req.method === 'GET' && path === '/api/user/points') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    
    try {
      const records = await achievementDB.getPointsRecords(decoded.userId)
      const total = await achievementDB.getUserTotalPoints(decoded.userId)
      sendJson(res, 200, { code: 0, data: { total, records } })
    } catch (e) {
      console.error('[API] Get points failed:', e)
      sendJson(res, 500, { code: 1, message: '获取积分失败' })
    }
    return
  }

  // 领取积分/签到
  if (req.method === 'POST' && path === '/api/user/points/claim') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    
    const b = await readBody(req)
    const { type, source, points, description } = b
    
    try {
      // 简单防刷：检查今日是否已签到 (如果是签到类型)
      if (type === 'daily') {
        const records = await achievementDB.getPointsRecords(decoded.userId, 100) // 获取最近100条
        const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
        // 注意：created_at 是时间戳，需要转换
        const hasSignedIn = records.some(r => {
           const recordDate = new Date(Number(r.created_at)).toISOString().split('T')[0]
           return r.type === 'daily' && recordDate === today
        })
        
        if (hasSignedIn) {
          sendJson(res, 400, { code: 1, message: '今日已签到' })
          return
        }
      }
      
      const newBalance = await achievementDB.addPointsRecord({
        userId: decoded.userId,
        source: source || '系统奖励',
        type: type || 'system',
        points: points || 0,
        description: description || '系统发放'
      })
      
      sendJson(res, 200, { code: 0, data: { balance: newBalance } })
    } catch (e) {
      console.error('[API] Claim points failed:', e)
      sendJson(res, 500, { code: 1, message: '操作失败' })
    }
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
          interests: typeof user.interests === 'string' ? JSON.parse(user.interests) : (user.interests || null),
          age: user.age || null,
          tags: typeof user.tags === 'string' ? JSON.parse(user.tags) : (user.tags || null),
          isAdmin: user.email === 'testuser789@example.com' || user.isAdmin
        },
        user: { // 保持向后兼容
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone || null,
          avatar_url: user.avatar_url || null,
          interests: typeof user.interests === 'string' ? JSON.parse(user.interests) : (user.interests || null),
          age: user.age || null,
          tags: typeof user.tags === 'string' ? JSON.parse(user.tags) : (user.tags || null),
          isAdmin: user.email === 'testuser789@example.com' || user.isAdmin
        }
      })
      return
    }
    

  // Error handled by middleware
}

// 仅在本地开发时启动服务器（非 Vercel 环境）
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const server = http.createServer(async (req, res) => {
    // 适配本地 http.createServer 的 req/res 到 handler
    await handler(req, res);
  });
  
  // 启动 WebSocket 服务器
  const wss = new WebSocketServer({
    server,
    path: '/ws'
  });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // 发送连接确认
    ws.send(JSON.stringify({
      type: 'connection_established',
      message: 'WebSocket connection established',
      timestamp: Date.now()
    }));
    
    ws.on('message', (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        console.log('WebSocket message received:', parsedMessage);
        
        // 处理不同类型的消息
        switch (parsedMessage.type) {
          case 'ping':
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: Date.now()
            }));
            break;
          case 'subscribe':
            // 处理订阅
            ws.send(JSON.stringify({
              type: 'subscribed',
              topic: parsedMessage.payload.topic,
              timestamp: Date.now()
            }));
            break;
          case 'unsubscribe':
            // 处理取消订阅
            ws.send(JSON.stringify({
              type: 'unsubscribed',
              topic: parsedMessage.payload.topic,
              timestamp: Date.now()
            }));
            break;
          default:
            // 转发其他消息到客户端
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
              }
            });
        }
      } catch (error) {
        console.error('WebSocket message processing error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  server.listen(PORT, () => {
    console.log(`Local API server running on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}/ws`);
  })
}
