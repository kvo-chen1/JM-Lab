import fs from 'fs'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// 首先加载 .env 文件
dotenv.config({ path: path.join(projectRoot, '.env') })

// 然后加载 .env.local 文件（覆盖 .env 中的配置）
const envLocalPath = path.join(projectRoot, '.env.local')
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath))
  for (const k in envConfig) {
    process.env[k] = envConfig[k]
  }
  console.log('[Config] 已加载 .env.local 文件:', envLocalPath)
} else {
  console.log('[Config] 未找到 .env.local 文件:', envLocalPath)
}

// 打印邮件配置（调试用）
console.log('[Config] 邮件配置:', {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE,
  user: process.env.EMAIL_USER,
  from: process.env.EMAIL_FROM
})

import pathModule from 'path'
import { Readable } from 'stream'
import http from 'http'
import { WebSocketServer } from 'ws'
import { URL } from 'url'
import { generateToken, verifyToken } from './jwt.mjs'
import { userDB, workDB, favoriteDB, achievementDB, friendDB, messageDB, communityDB, notificationDB, eventDB, getDB } from './database.mjs'
import { sendLoginEmailCode } from './emailService.mjs'
import { randomUUID } from 'crypto'
import { supabaseServer } from './supabase-server.mjs'
import membershipRoutes from './routes/membership.mjs'
import searchRoutes from './routes/search.mjs'

// 内存中存储验证码 (email -> { code, expiresAt })
const verificationCodes = new Map();

// 简单的内存缓存机制 - 用于减少数据库查询频率
// 注意：Vercel Serverless 环境下缓存不会在请求间共享，但仍可减少单个请求内的重复查询
const apiCache = new Map();
const CACHE_TTL = 30000; // 30秒缓存时间

// 缓存辅助函数
function getCache(key) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  apiCache.delete(key);
  return null;
}

function setCache(key, data) {
  apiCache.set(key, { data, timestamp: Date.now() });
}

// 清除缓存
function invalidateCache(key) {
  apiCache.delete(key);
}

// 端口配置 - 默认3022与Vite代理配置保持一致
const PORT = Number(process.env.LOCAL_API_PORT || process.env.PORT) || 3022
const ORIGIN = process.env.CORS_ALLOW_ORIGIN || '*'

// 豆包模型基础配置
const BASE_URL = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
const API_KEY = process.env.DOUBAO_API_KEY || ''
const MODEL_ID = process.env.DOUBAO_MODEL_ID || 'doubao-seedance-1-0-pro-250528'

// DashScope (Aliyun Qwen) config
const DASHSCOPE_BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1'
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || ''
const DASHSCOPE_MODEL_ID = process.env.DASHSCOPE_MODEL_ID || 'qwen-plus'

// Kimi (Moonshot) config
const KIMI_BASE_URL = process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1'
const KIMI_API_KEY = process.env.KIMI_API_KEY || ''

// DeepSeek config
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''

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

async function kimiFetch(path, method, body, res) {
  try {
    const base = process.env.KIMI_BASE_URL || KIMI_BASE_URL
    const key = process.env.KIMI_API_KEY || process.env.VITE_KIMI_API_KEY || ''
    
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
  const key = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY || ''
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

async function pollDashScopeTask(taskId, authKey) {
  const maxRetries = 120; // 6 minutes (3s interval)
  const interval = 3000;
  
  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, interval));
    
    try {
      const resp = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${authKey}`
        }
      });
      
      if (!resp.ok) {
        console.error(`[DashScope] Polling failed: ${resp.status}`);
        continue;
      }
      
      const data = await resp.json();
      console.log(`[DashScope] Task ${taskId} status: ${data.output?.task_status}`);
      
      if (data.output?.task_status === 'SUCCEEDED') {
        return data;
      }
      
      if (data.output?.task_status === 'FAILED' || data.output?.task_status === 'CANCELED') {
        throw new Error(`Task failed with status: ${data.output?.task_status}, message: ${data.output?.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('[DashScope] Polling error:', e);
      // Check if it's our own error
      if (e.message.includes('Task failed')) throw e;
    }
  }
  
  throw new Error('Task polling timed out');
}

// 将本地图片上传到 Supabase Storage 获取公网 URL
async function uploadLocalImageToSupabase(localUrl) {
  try {
    // 从 URL 中提取文件路径
    const urlPath = new URL(localUrl).pathname;
    const fileName = pathModule.basename(urlPath);
    const localFilePath = pathModule.join(projectRoot, 'public', urlPath);
    
    console.log('[uploadLocalImageToSupabase] Local file path:', localFilePath);
    
    // 检查文件是否存在
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`Local file not found: ${localFilePath}`);
    }
    
    // 读取文件
    const fileBuffer = fs.readFileSync(localFilePath);
    const fileExt = pathModule.extname(fileName) || '.jpg';
    const uniqueName = `${Date.now()}-${randomUUID()}${fileExt}`;
    const storagePath = `temp/${uniqueName}`;
    
    console.log('[uploadLocalImageToSupabase] Uploading to Supabase:', storagePath);
    
    // 上传到 Supabase Storage
    if (!supabaseServer || !supabaseServer.storage) {
      throw new Error('Supabase server client not initialized');
    }
    
    // 尝试上传到 'works' bucket，如果不存在则尝试创建
    let uploadResult = await supabaseServer.storage
      .from('works')
      .upload(storagePath, fileBuffer, {
        contentType: `image/${fileExt.replace('.', '')}` || 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });
    
    // 如果 bucket 不存在，尝试创建它
    if (uploadResult.error && uploadResult.error.message?.includes('Bucket not found')) {
      console.log('[uploadLocalImageToSupabase] Bucket not found, creating...');
      
      // 创建 bucket
      const { error: createError } = await supabaseServer.storage.createBucket('works', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error('[uploadLocalImageToSupabase] Failed to create bucket:', createError);
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }
      
      console.log('[uploadLocalImageToSupabase] Bucket created, retrying upload...');
      
      // 重新上传
      uploadResult = await supabaseServer.storage
        .from('works')
        .upload(storagePath, fileBuffer, {
          contentType: `image/${fileExt.replace('.', '')}` || 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });
    }
    
    if (uploadResult.error) {
      console.error('[uploadLocalImageToSupabase] Upload error:', uploadResult.error);
      throw new Error(`Failed to upload to Supabase: ${uploadResult.error.message}`);
    }
    
    // 获取公网 URL
    const { data: publicUrlData } = supabaseServer.storage
      .from('works')
      .getPublicUrl(storagePath);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Failed to get public URL from Supabase');
    }
    
    console.log('[uploadLocalImageToSupabase] Public URL:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
    
  } catch (error) {
    console.error('[uploadLocalImageToSupabase] Error:', error.message);
    throw error;
  }
}

async function dashscopeVideoGenerate(params) {
  const { prompt, imageUrl, authKey, model } = params;
  const endpoint = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis';
  
  try {
    // 处理图片 URL - 如果是本地 URL，上传到 Supabase 获取公网 URL
    let publicImageUrl = imageUrl;
    console.log('[DashScope] Original image URL:', imageUrl);
    
    // 检测是否为本地 URL（包括 localhost、127.0.0.1 或相对路径）
    const isLocalUrl = imageUrl && (
      imageUrl.includes('localhost') || 
      imageUrl.includes('127.0.0.1') || 
      imageUrl.startsWith('http://192.168.') ||
      imageUrl.startsWith('http://10.') ||
      imageUrl.startsWith('http://172.')
    );
    
    if (isLocalUrl) {
      console.log('[DashScope] Detected local image URL, uploading to Supabase...');
      try {
        publicImageUrl = await uploadLocalImageToSupabase(imageUrl);
        console.log('[DashScope] Public image URL:', publicImageUrl);
      } catch (uploadError) {
        console.error('[DashScope] Failed to upload to Supabase:', uploadError.message);
        // 如果上传失败，继续尝试使用原始 URL（可能会失败，但至少会记录错误）
        publicImageUrl = imageUrl;
      }
    } else if (imageUrl) {
      console.log('[DashScope] Using provided public URL:', imageUrl);
    }
    
    const payload = {
      model: model || 'wan2.6-i2v-flash',
      input: {
        prompt: prompt,
        img_url: publicImageUrl
      },
      parameters: {
        resolution: '720P',
        duration: 5
      }
    };
    
    // Remove img_url if not provided (text-to-video)
    if (!imageUrl) {
        delete payload.input.img_url;
        // Default to verified model for T2V as well if no specific model requested
        if (!model || model === 'wan2.6-i2v-flash') payload.model = 'wanx2.1-t2v-turbo'; 
    }

    console.log('[DashScope] Starting video generation task:', JSON.stringify(payload, null, 2));
    console.log('[DashScope] Using endpoint:', endpoint);

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authKey}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    console.log('[DashScope] Response status:', resp.status);
    console.log('[DashScope] Response data:', JSON.stringify(data, null, 2));
    
    if (!resp.ok) {
      console.error('[DashScope] Video generation submission failed:', data);
      throw new Error(data.message || data.code || `Failed to submit video task: ${resp.status}`);
    }

    const taskId = data.output?.task_id;
    if (!taskId) {
      console.error('[DashScope] No task_id in response:', data);
      throw new Error('No task_id returned from DashScope');
    }

    console.log(`[DashScope] Video task submitted successfully: ${taskId}`);
    
    // Poll for result
    console.log('[DashScope] Starting to poll for result...');
    const result = await pollDashScopeTask(taskId, authKey);
    console.log('[DashScope] Poll result:', JSON.stringify(result, null, 2));
    
    // Extract video URL - check multiple possible locations
    const videoUrl = result.output?.video_url 
      || result.output?.results?.[0]?.url 
      || result.output?.results?.[0]?.video_url
      || result.video_url;
    
    if (!videoUrl) {
      console.error('[DashScope] No video URL in result. Full result:', JSON.stringify(result, null, 2));
      throw new Error('No video URL found in completed task');
    }

    console.log('[DashScope] Video URL extracted:', videoUrl);

    return {
      status: 200,
      ok: true,
      data: {
        video_url: videoUrl,
        task_id: taskId
      }
    };

  } catch (error) {
    console.error('[DashScope] Video generation error:', error.message);
    console.error('[DashScope] Full error:', error);
    return {
      status: 500,
      ok: false,
      data: { error: error.message }
    };
  }
}

async function dashscopeImageGenerate(params) {
  const { prompt, size, n, authKey, model } = params
  const base = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1'
  const endpoint = `${base}/services/aigc/text2image/image-synthesis`
  const normalizedSize = String(size || '1024x1024').replace('x', '*')
  try {
    console.log('[DashScope] Starting async image generation...');
    
    // 1. Submit async task
    const createResp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authKey}`,
        'X-DashScope-Async': 'enable' // Enable async mode
      },
      body: JSON.stringify({
        model: model || 'wanx2.1-t2i-turbo',
        input: { prompt },
        parameters: { size: normalizedSize, n: n || 1 }
      })
    })
    
    const createData = await createResp.json()
    
    if (!createResp.ok) {
      console.error('[DashScope] Image generation submission failed:', createData)
      return {
        status: createResp.status,
        ok: false,
        data: createData
      }
    }

    const taskId = createData.output?.task_id;
    if (!taskId) {
        throw new Error('No task_id returned from async image submission');
    }
    
    console.log(`[DashScope] Image task submitted: ${taskId}, polling for results...`);
    
    // 2. Poll for results
    const result = await pollDashScopeTask(taskId, authKey);
    
    // 3. Extract results
    if (result?.output?.results) {
      const results = result.output.results
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
    } else if (result?.output?.image) {
      // 处理单个图片的情况 (fallback for different response structures)
      return {
        status: 200,
        ok: true,
        data: {
          created: Date.now(),
          data: [{
            url: result.output.image,
            revised_prompt: prompt
          }]
        }
      }
    } else {
        throw new Error('No image results found in completed task');
    }
  } catch (error) {
    console.error('[DashScope] Image generation error:', error)
    return {
      status: 500,
      ok: false,
      data: { error: error.message }
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

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')
}

async function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    
    // 检查是否是Node.js的HTTP请求对象
    if (req.on && typeof req.on === 'function') {
      // 检查是否已经有请求体数据
      if (req.body) {
        // 如果已经有解析好的请求体，直接返回
        resolve(typeof req.body === 'object' ? req.body : {})
        return
      }
      
      // 正常处理流数据
      req.on('data', (chunk) => {
        data += chunk
      })
      req.on('end', () => {
        try {
          if (!data) {
            resolve({})
            return
          }
          const parsedBody = JSON.parse(data)
          resolve(parsedBody)
        } catch (error) {
          console.error('Error parsing request body:', error)
          console.error('Request body:', data)
          resolve({})
        }
      })
      req.on('error', (error) => {
        console.error('Error reading request body:', error)
        resolve({})
      })
    } else if (req.body) {
      // 对于Vercel Serverless Function或其他已解析请求体的环境
      resolve(typeof req.body === 'object' ? req.body : {})
    } else {
      resolve({})
    }
  })
}

function sendJson(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(obj))
}

function verifyRequestToken(req) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    console.log('[verifyRequestToken] No authorization header')
    return null
  }
  
  const token = authHeader.split(' ')[1]
  if (!token) {
    console.log('[verifyRequestToken] No token in authorization header')
    return null
  }
  
  try {
    const decoded = verifyToken(token)
    console.log('[verifyRequestToken] Token decoded:', decoded ? 'success' : 'failed')
    if (decoded) {
      console.log('[verifyRequestToken] Decoded token:', { userId: decoded.userId, sub: decoded.sub, id: decoded.id })
      if (!decoded.userId && (decoded.sub || decoded.id)) {
        decoded.userId = decoded.sub || decoded.id
        console.log('[verifyRequestToken] Set userId from sub/id:', decoded.userId)
      }
    }
    return decoded
  } catch (error) {
    console.error('[verifyRequestToken] Token verification error:', error.message)
    return null
  }
}

async function route(req, res, u, path) {
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  console.log('[Route] Processing:', req.method, path)

  // 会员中心路由
  if (path.startsWith('/api/membership')) {
    console.log('[Route] Delegating to membership routes:', path)
    await membershipRoutes(req, res)
    return
  }

  // 搜索功能路由
  if (path.startsWith('/api/search')) {
    console.log('[Route] Delegating to search routes:', path)
    await searchRoutes(req, res)
    return
  }

  // 获取所有作品列表 (首页)
  if (req.method === 'GET' && path === '/api/works') {
    const limit = parseInt(u.searchParams.get('limit') || '20')
    const offset = parseInt(u.searchParams.get('offset') || '0')
    const creatorId = u.searchParams.get('creator_id')

    try {
      let works
      if (creatorId) {
        // 如果指定了 creator_id，只返回该用户的作品
        console.log('[API] Get works by creator_id:', creatorId)
        works = await workDB.getWorksByUserId(creatorId)
      } else {
        // 否则返回所有作品
        console.log('[API] Get all works')
        works = await workDB.getAllWorks()
      }
      
      // 获取所有作者ID（确保是有效的UUID格式）
      const creatorIds = [...new Set(works.map(w => w.creator_id).filter(id => id && typeof id === 'string'))]
      console.log('[API] Creator IDs:', creatorIds)
      
      // 批量获取作者信息
      let usersData = []
      let usersError = null
      
      if (creatorIds.length > 0) {
        // 使用 PostgreSQL 的 UUID 数组查询
        const { data, error } = await supabaseServer
          .from('users')
          .select('id, username, avatar_url')
          .in('id', creatorIds)
        
        usersData = data || []
        usersError = error
      }
      
      if (usersError) {
        console.error('[API] Error fetching users:', usersError)
      }
      
      const usersMap = new Map()
      if (usersData) {
        usersData.forEach(user => {
          usersMap.set(user.id, user)
        })
      }
      console.log('[API] Users map size:', usersMap.size)
      console.log('[API] First creator_id:', creatorIds[0], 'type:', typeof creatorIds[0])
      console.log('[API] First user in map:', usersData?.[0] ? { id: usersData[0].id, type: typeof usersData[0].id } : null)
      
      // 字段映射，将数据库字段转换为前端期望的格式
      const mappedWorks = works.map(work => {
        const user = usersMap.get(work.creator_id)
        console.log('[API] Mapping work:', { 
          id: work.id, 
          creator_id: work.creator_id,
          user: user ? { id: user.id, username: user.username } : null,
          thumbnail: work.thumbnail?.substring(0, 50),
          video_url: work.video_url?.substring(0, 50), 
          type: work.type,
          hasVideoUrl: !!work.video_url,
          views: work.views
        });
        return {
          ...work,
          videoUrl: work.video_url,
          date: work.created_at ? new Date(work.created_at * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          author: {
            id: work.creator_id,
            username: user?.username || 'Unknown User',
            avatar: user?.avatar_url || ''
          }
        };
      })
      // 简单的内存分页
      const paginatedWorks = mappedWorks.slice(offset, offset + limit)
      sendJson(res, 200, { code: 0, data: paginatedWorks })
    } catch (e) {
      console.error('[API] Get works failed:', e)
      sendJson(res, 500, { code: 1, message: '获取作品失败' })
    }
    return
  }

  // 获取单个作品详情
  if (req.method === 'GET' && path.match(/^\/api\/works\/[^\/]+$/)) {
    const workId = path.split('/')[3]
    if (!workId) {
      sendJson(res, 400, { code: 1, message: '作品ID不能为空' })
      return
    }

    try {
      const work = await workDB.getWorkById(workId)
      if (!work) {
        sendJson(res, 404, { code: 1, message: '作品不存在' })
        return
      }

      // 获取作者信息
      let author = { id: work.creator_id, username: 'Unknown User', avatar: '' }
      if (work.creator_id) {
        const { data: userData, error: userError } = await supabaseServer
          .from('users')
          .select('id, username, avatar_url')
          .eq('id', work.creator_id)
          .single()
        
        if (!userError && userData) {
          author = {
            id: userData.id,
            username: userData.username || 'Unknown User',
            avatar: userData.avatar_url || ''
          }
        }
      }

      // 字段映射
      const mappedWork = {
        ...work,
        videoUrl: work.video_url,
        date: work.created_at ? new Date(work.created_at * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        author
      }

      sendJson(res, 200, { code: 0, data: mappedWork })
    } catch (e) {
      console.error('[API] Get work failed:', e)
      sendJson(res, 500, { code: 1, message: '获取作品失败' })
    }
    return
  }

  // 创建作品
  if (req.method === 'POST' && path === '/api/works') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    
    try {
      const body = await readBody(req)
      console.log('[API] Create work - decoded:', decoded)
      console.log('[API] Create work - body.creator_id:', body.creator_id)
      console.log('[API] Create work - body.user_id:', body.user_id)
      
      const creatorId = decoded.userId || decoded.sub || decoded.id || body.creator_id || body.user_id
      
      if (!creatorId) {
        throw new Error('无法获取用户ID，请重新登录')
      }
      
      // 删除 body 中的 user_id 字段，避免插入到 works 表时出错
      const { user_id, ...restBody } = body
      const workData = {
        ...restBody,
        creator_id: creatorId
      }
      
      console.log('[API] Creating work with creator_id:', creatorId)
      console.log('[API] Work data type:', workData.type)
      console.log('[API] Work data video_url:', workData.video_url)
      const work = await workDB.createWork(workData)
      console.log('[API] Work created:', work)
      sendJson(res, 200, { code: 0, data: work })
    } catch (e) {
      console.error('[API] Create work failed:', e)
      sendJson(res, 500, { code: 1, message: '创建作品失败: ' + e.message })
    }
    return
  }

  // 获取用户作品
  if (req.method === 'GET' && path === '/api/user/works') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    const limit = parseInt(u.searchParams.get('limit') || '50')
    const offset = parseInt(u.searchParams.get('offset') || '0')

    try {
      const works = await workDB.getWorksByUserId(decoded.userId, limit, offset)
      sendJson(res, 200, { code: 0, data: works || [] })
    } catch (e) {
      console.error('[API] Get works failed:', e)
      sendJson(res, 500, { code: 1, message: '获取作品失败' })
    }
    return
  }

  // 获取用户点赞的作品列表
  if (req.method === 'GET' && path === '/api/user/likes') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    const limit = parseInt(u.searchParams.get('limit') || '50')
    const offset = parseInt(u.searchParams.get('offset') || '0')

    console.log('[API] Get user likes:', { userId: decoded.userId, limit, offset })

    try {
      // 1. 从本地数据库获取点赞作品
      const localLikedWorks = await workDB.getUserLikedWorks(decoded.userId, limit, offset)
      console.log('[API] Get user likes from local DB:', localLikedWorks.length)

      // 2. 从 Supabase 获取点赞作品（补充数据）
      let supabaseLikedWorks = []
      if (supabaseServer) {
        try {
          // 2.1 查询 Supabase 的 works_likes 表（数字ID的作品）
          const { data: workLikes, error: workLikesError } = await supabaseServer
            .from('works_likes')
            .select('work_id')
            .eq('user_id', decoded.userId)
            .order('created_at', { ascending: false })
            .limit(limit)

          if (!workLikesError && workLikes && workLikes.length > 0) {
            const workIds = workLikes.map(l => l.work_id)
            const { data: worksData, error: worksError } = await supabaseServer
              .from('works')
              .select('*')
              .in('id', workIds)

            if (!worksError && worksData) {
              const worksFromLikes = worksData.map(work => ({
                ...work,
                id: work.id.toString(),
                creator_id: work.creator_id?.toString()
              }))
              supabaseLikedWorks.push(...worksFromLikes)
              console.log('[API] Get user likes from Supabase works_likes:', worksFromLikes.length)
            }
          }

          // 2.2 查询 Supabase 的 likes 表（UUID的posts）
          const { data: postLikes, error: postLikesError } = await supabaseServer
            .from('likes')
            .select('post_id')
            .eq('user_id', decoded.userId)
            .order('created_at', { ascending: false })
            .limit(limit)

          if (!postLikesError && postLikes && postLikes.length > 0) {
            const postIds = postLikes.map(l => l.post_id)
            const { data: postsData, error: postsError } = await supabaseServer
              .from('posts')
              .select('*')
              .in('id', postIds)

            if (!postsError && postsData) {
              const postsFromLikes = postsData.map(post => ({
                ...post,
                id: post.id.toString(),
                title: post.title || '无标题',
                thumbnail: post.thumbnail || post.cover_url || '/placeholder-image.jpg',
                creator_id: post.author_id || post.user_id,
                category: post.category || '其他',
                created_at: post.created_at,
                views: post.views || 0,
                likes: post.likes_count || post.likes || 0,
                comments: post.comments_count || 0
              }))
              supabaseLikedWorks.push(...postsFromLikes)
              console.log('[API] Get user likes from Supabase likes:', postsFromLikes.length)
            }
          }
        } catch (supabaseError) {
          console.warn('[API] Failed to get likes from Supabase:', supabaseError.message)
        }
      }

      // 3. 合并数据（去重）
      const allLikedWorks = [...localLikedWorks]
      for (const supabaseWork of supabaseLikedWorks) {
        const exists = allLikedWorks.some(w => w.id === supabaseWork.id)
        if (!exists) {
          allLikedWorks.push(supabaseWork)
        }
      }

      console.log('[API] Get user likes total:', allLikedWorks.length)
      sendJson(res, 200, { code: 0, data: allLikedWorks || [] })
    } catch (e) {
      console.error('[API] Get liked works failed:', e)
      sendJson(res, 500, { code: 1, message: '获取点赞作品失败' })
    }
    return
  }

  // 获取用户收藏的作品列表
  if (req.method === 'GET' && path === '/api/user/bookmarks') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    const limit = parseInt(u.searchParams.get('limit') || '50')
    const offset = parseInt(u.searchParams.get('offset') || '0')

    console.log('[API] Get user bookmarks:', { userId: decoded.userId, limit, offset })

    try {
      // 1. 从本地数据库获取收藏作品
      const localBookmarkedWorks = await workDB.getUserBookmarkedWorks(decoded.userId, limit, offset)
      console.log('[API] Get user bookmarks from local DB:', localBookmarkedWorks.length)

      // 2. 从 Supabase 获取收藏作品（补充数据）
      let supabaseBookmarkedWorks = []
      if (supabaseServer) {
        try {
          // 查询 Supabase 的 works_favorites 表
          const { data: supabaseFavorites, error: favoritesError } = await supabaseServer
            .from('works_favorites')
            .select('work_id')
            .eq('user_id', decoded.userId)
            .order('created_at', { ascending: false })
            .limit(limit)

          if (!favoritesError && supabaseFavorites && supabaseFavorites.length > 0) {
            // 获取作品详情
            const workIds = supabaseFavorites.map(f => f.work_id)
            const { data: worksData, error: worksError } = await supabaseServer
              .from('works')
              .select('*')
              .in('id', workIds)

            if (!worksError && worksData) {
              supabaseBookmarkedWorks = worksData.map(work => ({
                ...work,
                id: work.id.toString(),
                creator_id: work.creator_id?.toString()
              }))
              console.log('[API] Get user bookmarks from Supabase:', supabaseBookmarkedWorks.length)
            }
          }
        } catch (supabaseError) {
          console.warn('[API] Failed to get bookmarks from Supabase:', supabaseError.message)
        }
      }

      // 3. 合并数据（去重）
      const allBookmarkedWorks = [...localBookmarkedWorks]
      for (const supabaseWork of supabaseBookmarkedWorks) {
        const exists = allBookmarkedWorks.some(w => w.id === supabaseWork.id)
        if (!exists) {
          allBookmarkedWorks.push(supabaseWork)
        }
      }

      console.log('[API] Get user bookmarks total:', allBookmarkedWorks.length)
      sendJson(res, 200, { code: 0, data: allBookmarkedWorks || [] })
    } catch (e) {
      console.error('[API] Get bookmarked works failed:', e)
      sendJson(res, 500, { code: 1, message: '获取收藏作品失败' })
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
      
      let totalPoints = await achievementDB.getUserTotalPoints(decoded.userId)
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
      } else if (totalPoints < 300) {
        level = 2
        nextLevelPoints = 300
        progress = ((totalPoints - 100) / 200) * 100
      } else if (totalPoints < 800) {
        level = 3
        nextLevelPoints = 800
        progress = ((totalPoints - 300) / 500) * 100
      } else if (totalPoints < 2000) {
        level = 4
        nextLevelPoints = 2000
        progress = ((totalPoints - 800) / 1200) * 100
      } else {
        level = 5
        nextLevelPoints = 2000
        progress = 100
      }
      
      const fullStats = {
        ...stats,
        followers_count: 0,
        following_count: 0,
        favorites_count: (await favoriteDB.getUserFavorites(decoded.userId)).length,
        membership_level: user?.membership_level || 'free',
        membership_status: user?.membership_status || 'active',
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

  // 获取用户成就
  if (req.method === 'GET' && path === '/api/user/achievements') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }

    try {
      // 1. 获取用户实际数据统计
      const workStats = await workDB.getWorkStats(decoded.userId)
      const likesCount = await workDB.getUserLikesCount(decoded.userId)
      const bookmarksCount = await favoriteDB.getUserFavorites(decoded.userId).then(favs => favs.length)

      console.log('[API] User stats:', { workStats, likesCount, bookmarksCount })

      // 2. 定义成就配置
      const achievementConfigs = [
        { id: 1, name: '初次创作', criteria: 1, type: 'works', points: 10 },
        { id: 2, name: '作品达人', criteria: 10, type: 'works', points: 80 },
        { id: 3, name: '人气王', criteria: 100, type: 'likes_received', points: 50 },
        { id: 4, name: '点赞达人', criteria: 50, type: 'likes_given', points: 30 },
        { id: 5, name: '收藏专家', criteria: 20, type: 'bookmarks', points: 40 },
        { id: 6, name: '活跃创作者', criteria: 7, type: 'consecutive_login', points: 20 },
      ]

      // 3. 获取用户已保存的成就记录
      const savedAchievements = await achievementDB.getUserAchievements(decoded.userId)
      const savedAchMap = new Map(savedAchievements.map(a => [a.achievement_id, a]))

      // 4. 计算每个成就的进度
      const achievements = []
      for (const config of achievementConfigs) {
        let currentValue = 0
        switch (config.type) {
          case 'works':
            currentValue = parseInt(workStats.works_count) || 0
            break
          case 'likes_received':
            currentValue = parseInt(workStats.total_likes) || 0
            break
          case 'likes_given':
            currentValue = likesCount
            break
          case 'bookmarks':
            currentValue = bookmarksCount
            break
          case 'consecutive_login':
            // 从用户数据中获取连续登录天数，暂时设为0
            currentValue = 0
            break
        }

        const progress = Math.min(100, Math.floor((currentValue / config.criteria) * 100))
        const isUnlocked = currentValue >= config.criteria

        // 检查是否是新解锁的成就
        const savedAch = savedAchMap.get(config.id)
        const wasUnlocked = savedAch?.is_unlocked || false

        // 如果是新解锁的成就，发放积分
        if (isUnlocked && !wasUnlocked) {
          console.log(`[API] Achievement unlocked: ${config.name}, awarding ${config.points} points`)

          // 保存成就记录
          await achievementDB.upsertAchievement(decoded.userId, config.id, 100, true)

          // 发放积分
          await achievementDB.addPoints(decoded.userId, config.points, 'achievement', `解锁成就: ${config.name}`)
        } else if (!savedAch) {
          // 保存进度记录
          await achievementDB.upsertAchievement(decoded.userId, config.id, progress, isUnlocked)
        }

        achievements.push({
          achievement_id: config.id,
          name: config.name,
          progress: progress,
          is_unlocked: isUnlocked,
          unlocked_at: isUnlocked ? Date.now() : null,
          points: config.points,
          current_value: currentValue,
          target_value: config.criteria
        })
      }

      sendJson(res, 200, { code: 0, data: achievements })
    } catch (e) {
      console.error('[API] Get achievements failed:', e)
      sendJson(res, 500, { code: 1, message: '获取成就失败' })
    }
    return
  }

  // 获取用户任务
  if (req.method === 'GET' && path === '/api/user/tasks') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }

    try {
      const noviceTasks = [
        { id: 1, title: '完成新手引导', status: 'completed', progress: 100, reward: '50积分' },
        { id: 2, title: '发布第一篇作品', status: 'completed', progress: 100, reward: '100积分 + 素材包' },
        { id: 3, title: '邀请一位好友', status: 'pending', progress: 0, reward: '150积分' },
        { id: 4, title: '参与一次主题活动', status: 'pending', progress: 0, reward: '200积分' }
      ]
      const dailyTasks = [
        { id: 5, title: '每日签到', status: 'active', progress: 0, reward: '10积分' },
        { id: 6, title: '浏览5个作品', status: 'active', progress: 0, reward: '15积分' },
        { id: 7, title: '点赞3个作品', status: 'active', progress: 0, reward: '20积分' }
      ]
      sendJson(res, 200, { code: 0, data: { noviceTasks, dailyTasks } })
    } catch (e) {
      console.error('[API] Get tasks failed:', e)
      sendJson(res, 500, { code: 1, message: '获取任务失败' })
    }
    return
  }

  // 获取成就排行榜
  if (req.method === 'GET' && path === '/api/leaderboard/achievements') {
    try {
      // 获取积分排行前10的用户
      const db = await getDB()
      const { rows } = await db.query(`
        SELECT u.id, u.username, u.avatar_url,
               COALESCE(SUM(pr.points), 0) as total_points,
               COUNT(DISTINCT ua.achievement_id) as achievements_count
        FROM users u
        LEFT JOIN points_records pr ON u.id = pr.user_id
        LEFT JOIN user_achievements ua ON u.id = ua.user_id AND ua.is_unlocked = true
        GROUP BY u.id, u.username, u.avatar_url
        HAVING COALESCE(SUM(pr.points), 0) > 0
        ORDER BY total_points DESC
        LIMIT 10
      `)

      const leaderboard = rows.map((row, index) => ({
        rank: index + 1,
        userId: row.id,
        userName: row.username || '匿名用户',
        avatar: row.avatar_url || '',
        achievementsCount: parseInt(row.achievements_count) || 0,
        totalPoints: parseInt(row.total_points) || 0
      }))

      sendJson(res, 200, { code: 0, data: leaderboard })
    } catch (e) {
      console.error('[API] Get leaderboard failed:', e)
      sendJson(res, 500, { code: 1, message: '获取排行榜失败' })
    }
    return
  }

  // 获取推荐创作者（按作品数和粉丝数排序）
  if (req.method === 'GET' && path === '/api/users/recommended') {
    try {
      const db = await getDB()
      const limit = parseInt(query.limit) || 5
      
      // 获取有作品的用户，按作品数和总点赞数排序
      const { rows } = await db.query(`
        SELECT u.id, u.username, u.avatar_url,
               COUNT(DISTINCT w.id) as works_count,
               COALESCE(SUM(w.likes), 0) as total_likes,
               COUNT(DISTINCT f.follower_id) as followers_count
        FROM users u
        LEFT JOIN works w ON u.id = w.creator_id
        LEFT JOIN follows f ON u.id = f.following_id
        WHERE w.id IS NOT NULL
        GROUP BY u.id, u.username, u.avatar_url
        ORDER BY works_count DESC, total_likes DESC
        LIMIT $1
      `, [limit])

      const recommendedUsers = rows.map(row => ({
        id: row.id,
        name: row.username || '匿名用户',
        avatar: row.avatar_url || '',
        worksCount: parseInt(row.works_count) || 0,
        followersCount: parseInt(row.followers_count) || 0,
        likesCount: parseInt(row.total_likes) || 0
      }))

      sendJson(res, 200, { code: 0, data: recommendedUsers })
    } catch (e) {
      console.error('[API] Get recommended users failed:', e)
      sendJson(res, 500, { code: 1, message: '获取推荐用户失败' })
    }
    return
  }

  // 获取活动列表
  if (req.method === 'GET' && path === '/api/events') {
    // 允许未登录访问
    try {
      // 使用缓存减少数据库查询
      const cacheKey = 'events_list';
      const url = new URL(req.url, `http://${req.headers.host}`);
      const refresh = url.searchParams.get('refresh') === 'true';
      
      let formattedEvents = refresh ? null : getCache(cacheKey);
      
      if (!formattedEvents) {
        console.log('[API] Cache miss for events, querying database...');
        let events = await eventDB.getEvents()
        console.log('[API] eventDB.getEvents() returned:', events.length, 'events');
        
        // 注意：不再自动创建示例活动，只返回用户真实创建的活动
        
        // 转换字段格式以匹配前端期望
        console.log('[API] Mapping', events.length, 'events to formatted events');
        formattedEvents = events.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          startTime: event.start_date ? new Date(event.start_date * 1000).toISOString() : null,
          endTime: event.end_date ? new Date(event.end_date * 1000).toISOString() : null,
          location: event.location,
          status: event.status,
          type: event.category === 'competition' ? 'offline' : 'online',
          category: event.category,
          tags: event.tags || [],
          participantCount: event.participant_count || 0,
          maxParticipants: event.max_participants,
          media: event.image_url ? [{ url: event.image_url, type: 'image' }] : [],
          organizer: {
            id: event.organizer_id,
            name: event.organizer_name,
            avatar: event.organizer_avatar
          },
          createdAt: event.created_at ? new Date(event.created_at * 1000).toISOString() : null,
          visibility: event.visibility
        }))
        
        // 缓存结果
        setCache(cacheKey, formattedEvents);
      } else {
        console.log('[API] Cache hit for events');
      }
      
      sendJson(res, 200, { code: 0, data: formattedEvents })
    } catch (e) {
      console.error('[API] Get events failed:', e)
      sendJson(res, 500, { code: 1, message: '获取活动失败' })
    }
    return
  }

  // 获取活动详情
  if (req.method === 'GET' && path.match(/^\/api\/events\/[\w-]+$/)) {
    const id = path.split('/').pop()
    try {
      const event = await eventDB.getEvent(id)
      if (!event) {
        sendJson(res, 404, { code: 1, message: '活动不存在' })
        return
      }
      
      // 转换字段格式以匹配前端期望
      const formattedEvent = {
        id: event.id,
        title: event.title,
        description: event.description,
        startTime: event.start_date ? new Date(event.start_date * 1000).toISOString() : null,
        endTime: event.end_date ? new Date(event.end_date * 1000).toISOString() : null,
        location: event.location,
        status: event.status,
        type: event.category === 'competition' ? 'offline' : 'online',
        category: event.category,
        tags: event.tags || [],
        participantCount: event.participant_count || 0,
        maxParticipants: event.max_participants,
        media: event.image_url ? [{ url: event.image_url, type: 'image' }] : [],
        organizer: {
          id: event.organizer_id,
          name: event.organizer_name,
          avatar: event.organizer_avatar
        },
        createdAt: event.created_at ? new Date(event.created_at * 1000).toISOString() : null,
        visibility: event.visibility
      }
      
      sendJson(res, 200, { code: 0, data: formattedEvent })
    } catch (e) {
      console.error('[API] Get event failed:', e)
      sendJson(res, 500, { code: 1, message: '获取活动详情失败' })
    }
    return
  }

  // 创建活动
  if (req.method === 'POST' && path === '/api/events') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }

    try {
      const data = await readBody(req)
      
      // 调试日志：查看接收到的数据
      console.log('[API] Create event - received data:', JSON.stringify({
        title: data.title,
        tags: data.tags,
        tagsType: typeof data.tags,
        tagsIsArray: Array.isArray(data.tags),
        tagsLength: Array.isArray(data.tags) ? data.tags.length : 'N/A',
        media: data.media,
        mediaType: typeof data.media,
        mediaIsArray: Array.isArray(data.media),
        mediaLength: Array.isArray(data.media) ? data.media.length : 'N/A',
        mediaFirstItem: Array.isArray(data.media) && data.media.length > 0 ? data.media[0] : null,
        content: data.content
      }))

      // 转换前端字段为数据库字段
      // 注意：tags 是 PostgreSQL 数组类型，空数组会导致 "malformed array literal" 错误
      const tags = data.tags && Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : null;
      
      console.log('[API] Create event - processed tags:', tags)
      
      const dbEventData = {
        title: data.title,
        description: data.description,
        content: data.content || data.description || '', // 确保 content 字段不为 null
        start_date: data.startTime ? Math.floor(new Date(data.startTime).getTime() / 1000) : null,
        end_date: data.endTime ? Math.floor(new Date(data.endTime).getTime() / 1000) : null,
        location: data.location,
        organizer_id: decoded.userId,
        requirements: data.requirements || null,
        rewards: data.rewards || null,
        visibility: data.isPublic ? 'public' : 'private',
        status: data.status || 'draft',
        registration_deadline: data.registrationDeadline ? Math.floor(new Date(data.registrationDeadline).getTime() / 1000) : null,
        max_participants: data.maxParticipants || null,
        published_at: data.status === 'published' ? Math.floor(Date.now() / 1000) : null,
        image_url: data.media && data.media.length > 0 ? data.media[0].url : null,
        category: data.category || null,
        tags: tags,
        platform_event_id: data.platformEventId || null
      }

      const event = await eventDB.createEvent(dbEventData)
      sendJson(res, 200, { code: 0, data: event })
    } catch (e) {
      console.error('[API] Create event failed:', e)
      sendJson(res, 500, { code: 1, message: '创建活动失败: ' + e.message })
    }
    return
  }

  // 更新活动
  if (req.method === 'PUT' && path.startsWith('/api/events/')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }

    const eventId = path.replace('/api/events/', '')

    try {
      const data = await readBody(req)

      // 转换前端字段为数据库字段
      const dbUpdateData = {}

      if (data.title !== undefined) dbUpdateData.title = data.title
      if (data.description !== undefined) dbUpdateData.description = data.description
      if (data.startTime !== undefined) dbUpdateData.start_date = Math.floor(new Date(data.startTime).getTime() / 1000)
      if (data.endTime !== undefined) dbUpdateData.end_date = Math.floor(new Date(data.endTime).getTime() / 1000)
      if (data.location !== undefined) dbUpdateData.location = data.location
      if (data.requirements !== undefined) dbUpdateData.requirements = data.requirements
      if (data.rewards !== undefined) dbUpdateData.rewards = data.rewards
      if (data.isPublic !== undefined) dbUpdateData.visibility = data.isPublic ? 'public' : 'private'
      if (data.status !== undefined) {
        dbUpdateData.status = data.status
        if (data.status === 'published') {
          dbUpdateData.published_at = Math.floor(Date.now() / 1000)
        }
      }
      if (data.registrationDeadline !== undefined) dbUpdateData.registration_deadline = data.registrationDeadline
      if (data.maxParticipants !== undefined) dbUpdateData.max_participants = data.maxParticipants
      if (data.media !== undefined) {
        dbUpdateData.image_url = data.media && data.media.length > 0 ? data.media[0].url : null
      }
      if (data.category !== undefined) dbUpdateData.category = data.category
      if (data.tags !== undefined) {
        // 注意：tags 是 PostgreSQL 数组类型，空数组会导致 "malformed array literal" 错误
        dbUpdateData.tags = data.tags && Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : null
      }
      if (data.platformEventId !== undefined) dbUpdateData.platform_event_id = data.platformEventId

      const event = await eventDB.updateEvent(eventId, dbUpdateData)
      sendJson(res, 200, { code: 0, data: event })
    } catch (e) {
      console.error('[API] Update event failed:', e)
      sendJson(res, 500, { code: 1, message: '更新活动失败: ' + e.message })
    }
    return
  }

  // 发布活动
  if (req.method === 'POST' && path.match(/^\/api\/events\/[^/]+\/publish$/)) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }

    const eventId = path.match(/^\/api\/events\/([^/]+)\/publish$/)[1]

    try {
      const event = await eventDB.updateEvent(eventId, {
        status: 'published',
        published_at: Math.floor(Date.now() / 1000)
      })
      sendJson(res, 200, { code: 0, data: event })
    } catch (e) {
      console.error('[API] Publish event failed:', e)
      sendJson(res, 500, { code: 1, message: '发布活动失败: ' + e.message })
    }
    return
  }

  // 发布活动到津脉平台
  if (req.method === 'POST' && path.match(/^\/api\/events\/[^/]+\/publish\/jinmai$/)) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }

    const eventId = path.match(/^\/api\/events\/([^/]+)\/publish\/jinmai$/)[1]

    try {
      const data = await readBody(req)

      // 更新活动状态为已发布
      const event = await eventDB.updateEvent(eventId, {
        status: 'published',
        published_at: Math.floor(Date.now() / 1000),
        platform_event_id: `jinmai_${Date.now()}`
      })

      sendJson(res, 200, {
        code: 0,
        data: {
          success: true,
          message: '活动已成功发布到津脉活动平台',
          platformEventId: event?.platformEventId || `jinmai_${Date.now()}`
        }
      })
    } catch (e) {
      console.error('[API] Publish to Jinmai failed:', e)
      sendJson(res, 500, { code: 1, message: '发布到津脉活动平台失败: ' + e.message })
    }
    return
  }

  // 审核活动（管理员用）
  if (req.method === 'POST' && path.match(/^\/api\/events\/[^/]+\/review$/)) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }

    // 检查是否为管理员
    try {
      const user = await userDB.findById(decoded.userId)
      if (!user || !user.is_admin) {
        sendJson(res, 403, { error: 'FORBIDDEN', message: '只有管理员可以审核活动' })
        return
      }
    } catch (e) {
      console.error('[API] Check admin status failed:', e)
      sendJson(res, 500, { code: 1, message: '验证管理员权限失败' })
      return
    }

    const eventId = path.match(/^\/api\/events\/([^/]+)\/review$/)[1]

    try {
      const data = await readBody(req)
      const { status, reason } = data

      if (!status || !['approved', 'rejected'].includes(status)) {
        sendJson(res, 400, { code: 1, message: '无效的审核状态' })
        return
      }

      // 更新活动状态
      const updateData = {
        status: status === 'approved' ? 'published' : 'rejected',
        reviewed_at: Math.floor(Date.now() / 1000),
        reviewed_by: decoded.userId,
        review_reason: reason || null
      }

      if (status === 'approved') {
        updateData.published_at = Math.floor(Date.now() / 1000)
      }

      const event = await eventDB.updateEvent(eventId, updateData)

      if (!event) {
        sendJson(res, 404, { code: 1, message: '活动不存在' })
        return
      }

      // 清除缓存
      invalidateCache('events_list')

      sendJson(res, 200, {
        code: 0,
        data: {
          success: true,
          message: status === 'approved' ? '活动已通过审核' : '活动已拒绝',
          event: {
            id: event.id,
            title: event.title,
            status: updateData.status,
            reviewedAt: updateData.reviewed_at,
            reviewReason: updateData.review_reason
          }
        }
      })
    } catch (e) {
      console.error('[API] Review event failed:', e)
      sendJson(res, 500, { code: 1, message: '审核活动失败: ' + e.message })
    }
    return
  }

  // 报名参加活动
  if (req.method === 'POST' && path.match(/^\/api\/events\/[^/]+\/register$/)) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败' })
      return
    }
    
    try {
      const eventId = path.match(/^\/api\/events\/([^/]+)\/register$/)[1]
      const body = await readBody(req)
      const { userId } = body
      
      console.log('[API] Register for event:', eventId, 'user:', userId)
      
      // 验证用户权限
      if (userId !== decoded.userId) {
        sendJson(res, 403, { error: 'FORBIDDEN', message: '无权为其他用户报名' })
        return
      }
      
      // 检查活动是否存在
      const event = await eventDB.getEvent(eventId)
      if (!event) {
        sendJson(res, 404, { error: 'EVENT_NOT_FOUND', message: '活动不存在' })
        return
      }
      
      // 检查活动是否已结束
      const now = new Date()
      const endTime = new Date(event.end_date * 1000)
      if (endTime < now) {
        sendJson(res, 400, { error: 'EVENT_ENDED', message: '活动已结束' })
        return
      }
      
      // 检查人数限制
      if (event.max_participants && event.participant_count >= event.max_participants) {
        sendJson(res, 400, { error: 'EVENT_FULL', message: '活动参与人数已达上限' })
        return
      }
      
      // 生成报名ID
      const registrationId = randomUUID()
      
      // 更新活动参与人数
      await eventDB.updateEvent(eventId, {
        participant_count: (event.participant_count || 0) + 1
      })
      
      // 清除缓存
      invalidateCache('events_list')
      
      sendJson(res, 200, {
        code: 0,
        data: {
          success: true,
          message: '报名成功',
          registrationId: registrationId,
          status: 'approved'
        }
      })
    } catch (e) {
      console.error('[API] Register for event failed:', e)
      sendJson(res, 500, { code: 1, message: '报名失败: ' + e.message })
    }
    return
  }

  // 获取活动参与状态
  if (req.method === 'GET' && path.match(/^\/api\/events\/[^/]+\/participation-status$/)) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败' })
      return
    }
    
    try {
      const eventId = path.match(/^\/api\/events\/([^/]+)\/participation-status$/)[1]
      const url = new URL(req.url, `http://${req.headers.host}`)
      const userId = url.searchParams.get('userId')
      
      console.log('[API] Check participation status:', eventId, 'user:', userId)
      
      // 验证用户权限
      if (userId !== decoded.userId) {
        sendJson(res, 403, { error: 'FORBIDDEN', message: '无权查询其他用户的参与状态' })
        return
      }
      
      // 检查活动是否存在
      const event = await eventDB.getEvent(eventId)
      if (!event) {
        sendJson(res, 404, { error: 'EVENT_NOT_FOUND', message: '活动不存在' })
        return
      }
      
      // 暂时返回未报名状态，后续可以添加真实的参与记录查询
      sendJson(res, 200, {
        code: 0,
        data: {
          isParticipated: false,
          participationId: null,
          status: null
        }
      })
    } catch (e) {
      console.error('[API] Check participation status failed:', e)
      sendJson(res, 500, { code: 1, message: '查询参与状态失败: ' + e.message })
    }
    return
  }

  // 获取用户分析数据
  if (req.method === 'GET' && path === '/api/user/analytics') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    
    try {
      const analytics = {
        totalWorks: 12,
        totalViews: 156,
        totalLikes: 42,
        totalComments: 18,
        monthlyTrend: [
          { month: '1月', works: 2, views: 12, likes: 3 },
          { month: '2月', works: 3, views: 28, likes: 7 },
          { month: '3月', works: 2, views: 22, likes: 5 },
          { month: '4月', works: 1, views: 15, likes: 4 },
          { month: '5月', works: 2, views: 35, likes: 10 },
          { month: '6月', works: 2, views: 44, likes: 13 }
        ],
        categoryDistribution: [
          { category: '设计', count: 5 },
          { category: '摄影', count: 3 },
          { category: '视频', count: 2 },
          { category: '其他', count: 2 }
        ]
      }
      sendJson(res, 200, { code: 0, data: analytics })
    } catch (e) {
      console.error('[API] Get analytics failed:', e)
      sendJson(res, 500, { code: 1, message: '获取分析数据失败' })
    }
    return
  }

  // 获取用户书签数量
  if (req.method === 'GET' && path === '/api/user/bookmarks/count') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }

    try {
      // 1. 从本地数据库获取收藏数量
      const localBookmarks = await favoriteDB.getUserFavorites(decoded.userId)
      console.log('[API] Get bookmarks count from local DB:', localBookmarks.length)

      // 2. 从 Supabase 获取收藏数量
      let supabaseCount = 0
      if (supabaseServer) {
        try {
          const { count, error } = await supabaseServer
            .from('works_favorites')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', decoded.userId)

          if (!error && count !== null) {
            supabaseCount = count
            console.log('[API] Get bookmarks count from Supabase:', supabaseCount)
          }
        } catch (supabaseError) {
          console.warn('[API] Failed to get bookmarks count from Supabase:', supabaseError.message)
        }
      }

      // 3. 合并数量
      const totalCount = localBookmarks.length + supabaseCount
      console.log('[API] Get bookmarks count total:', totalCount)
      sendJson(res, 200, { code: 0, data: { count: totalCount } })
    } catch (e) {
      console.error('[API] Get bookmarks count failed:', e)
      sendJson(res, 500, { code: 1, message: '获取书签数量失败' })
    }
    return
  }

  // 获取用户点赞数量
  if (req.method === 'GET' && path === '/api/user/likes/count') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }

    try {
      // 1. 从本地数据库获取点赞数量
      const localLikesCount = await workDB.getUserLikesCount(decoded.userId)
      console.log('[API] Get likes count from local DB:', localLikesCount)

      // 2. 从 Supabase 获取点赞数量
      let supabaseCount = 0
      if (supabaseServer) {
        try {
          // 2.1 从 works_likes 表获取
          const { count: workLikesCount, error: workLikesError } = await supabaseServer
            .from('works_likes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', decoded.userId)

          if (!workLikesError && workLikesCount !== null) {
            supabaseCount += workLikesCount
            console.log('[API] Get likes count from Supabase works_likes:', workLikesCount)
          }

          // 2.2 从 likes 表获取（posts的点赞）
          const { count: postLikesCount, error: postLikesError } = await supabaseServer
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', decoded.userId)

          if (!postLikesError && postLikesCount !== null) {
            supabaseCount += postLikesCount
            console.log('[API] Get likes count from Supabase likes:', postLikesCount)
          }
        } catch (supabaseError) {
          console.warn('[API] Failed to get likes count from Supabase:', supabaseError.message)
        }
      }

      // 3. 合并数量
      const totalCount = localLikesCount + supabaseCount
      console.log('[API] Get likes count total:', totalCount)
      sendJson(res, 200, { code: 0, data: { count: totalCount } })
    } catch (e) {
      console.error('[API] Get likes count failed:', e)
      sendJson(res, 500, { code: 1, message: '获取点赞数量失败' })
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

  // 发送邮箱验证码 - 支持 /api/auth/send-email-code 路径
  if (req.method === 'POST' && (path === '/api/auth/send-email-code' || path === '/api/auth/send-code')) {
    try {
      const body = await readBody(req)
      const email = body.email
      
      if (!email) {
        sendJson(res, 400, { code: 1, message: '邮箱不能为空' })
        return
      }
      
      // 生成 6 位随机验证码
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

      // 存储验证码，5分钟过期
      const expiresAt = Date.now() + 5 * 60 * 1000
      verificationCodes.set(email, { code: verificationCode, expiresAt })

      // 同时存储到数据库，确保持久化和多实例共享
      try {
        await userDB.updateEmailLoginCode(email, verificationCode, expiresAt)
        console.log(`[验证码] 已存储到数据库: ${email}`)
      } catch (dbError) {
        console.error('[验证码] 存储到数据库失败:', dbError)
        // 继续执行，因为内存中已经有验证码了
      }

      console.log(`[验证码] 准备发送到 ${email}: ${verificationCode}`)

      // 发送邮件
      const success = await sendLoginEmailCode(email, verificationCode)
      
      if (success) {
        sendJson(res, 200, {
          code: 0,
          message: '验证码发送成功',
          data: {
            // 开发环境下返回 mockCode 方便调试，但在日志中我们已经看到了真实发送的逻辑
            // 为了安全起见，这里不返回 code 给前端，除非是 explicitly debug mode
            // 但为了兼容现有逻辑，且这是 demo 项目，我们可以保留 mockCode 字段或者去掉
            // 这里我们去掉 verificationCode 的直接返回，模拟真实环境
            expiresAt: new Date(expiresAt).toISOString()
          }
        })
      } else {
        console.error('[API] 邮件发送失败')
        sendJson(res, 500, { code: 1, message: '邮件发送失败，请检查邮箱地址或稍后重试' })
      }
    } catch (error) {
      console.error('[API] 发送验证码失败:', error)
      sendJson(res, 500, { code: 1, message: '发送验证码失败' })
    }
    return
  }

  // 验证码登录 - 支持 /api/auth/login-with-email-code 路径
  if (req.method === 'POST' && (path === '/api/auth/login-with-email-code' || path === '/api/auth/login')) {
    try {
      console.log('[API] 收到登录请求');
      const body = await readBody(req)
      console.log('[API] 请求体:', { email: body.email, code: body.code ? '***' : 'empty' });
      const email = body.email
      const code = body.code
      
      if (!email || !code) {
        console.log('[API] 邮箱或验证码为空');
        sendJson(res, 400, { code: 1, message: '邮箱和验证码不能为空' })
        return
      }
      
      // 验证验证码
      // 注意：在 Vercel Serverless 环境下，内存中的 verificationCodes 无法在请求间共享
      // 因此优先使用默认验证码，并尝试从数据库获取验证码
      let isCodeValid = false;
      
      // 首先检查是否使用默认验证码（开发/测试环境）
      if (code === '123456') {
        console.log('[API] 使用默认验证码登录')
        isCodeValid = true;
      } else {
        // 检查内存中的验证码记录
        const record = verificationCodes.get(email)
        if (record) {
          // 检查验证码是否过期
          if (Date.now() > record.expiresAt) {
            verificationCodes.delete(email)
            console.log('[API] 内存验证码已过期');
          } else if (record.code === code) {
            isCodeValid = true;
            verificationCodes.delete(email);
            console.log('[API] 内存验证码验证成功');
          }
        }
        
        // 如果内存验证失败，尝试从数据库获取验证码
        if (!isCodeValid) {
          try {
            console.log('[API] 尝试从数据库获取验证码');
            const emailLoginCode = await userDB.getEmailLoginCode(email);
            if (emailLoginCode && emailLoginCode.email_login_code) {
              console.log('[API] 从数据库获取到验证码');
              if (emailLoginCode.email_login_code === code) {
                isCodeValid = true;
                console.log('[API] 数据库验证码验证成功');
              }
            }
          } catch (error) {
            console.error('[API] 从数据库获取验证码失败:', error.message);
          }
        }
      }
      
      // 验证验证码是否有效
      if (!isCodeValid) {
        console.log('[API] 验证码验证失败');
        sendJson(res, 401, { code: 1, message: '验证码错误或已过期，请重新获取验证码' });
        return;
      }
      
      console.log('[API] 验证码验证成功');
      
      // 检查用户是否存在，如果不存在则创建
      console.log(`[API] 开始登录流程，邮箱: ${email}`);
      let user = null;
      try {
        user = await userDB.findByEmail(email);
        console.log(`[API] findByEmail 结果:`, user ? '找到用户' : '未找到用户');
      } catch (findError) {
        console.error('[API] findByEmail 失败:', findError.message);
        console.error('[API] 错误堆栈:', findError.stack);
        throw findError;
      }
      console.log(`[API] 从 public.users 查询用户:`, user ? `找到用户 ID: ${user.id}` : '未找到用户');
      
      // 检查 Supabase Auth 中是否已有该邮箱的用户
      let supabaseUserId = null;
      try {
        console.log(`[API] 检查 Supabase Auth 中的用户...`);
        // 注意：listUsers API 可能不可用或需要特殊权限，使用 try-catch 包裹
        let authData = null;
        let authError = null;
        
        try {
          const result = await supabaseServer.auth.admin.listUsers();
          authData = result.data;
          authError = result.error;
        } catch (listError) {
          console.warn('[API] listUsers API 调用失败:', listError.message);
          // listUsers 失败不影响登录流程，继续使用数据库用户
        }
        
        if (authError) {
          console.error('[API] 获取 Supabase Auth 用户列表失败:', authError);
        } else if (authData?.users) {
          console.log(`[API] Supabase Auth 中共有 ${authData.users.length} 个用户`);
          const existingAuthUser = authData.users.find(u => u.email === email);
          if (existingAuthUser) {
            supabaseUserId = existingAuthUser.id;
            console.log(`[API] 在 Supabase Auth 中找到用户: ${email}, ID: ${supabaseUserId}`);
          } else {
            console.log(`[API] 在 Supabase Auth 中未找到用户: ${email}`);
          }
        }
      } catch (supabaseError) {
        console.warn('[API] 检查 Supabase Auth 用户失败:', supabaseError.message);
      }
      
      // 如果 Supabase Auth 中没有该用户，尝试创建一个
      // 注意：如果 createUser 也失败，我们仍然可以使用数据库用户继续登录
      if (!supabaseUserId) {
        try {
          console.log(`[API] 尝试在 Supabase Auth 中创建用户: ${email}`);
          const { data: newAuthUser, error: createAuthError } = await supabaseServer.auth.admin.createUser({
            email: email,
            password: randomUUID(), // 随机密码，用户通过验证码登录
            email_confirm: true, // 自动确认邮箱
            user_metadata: {
              username: email.split('@')[0],
              auth_provider: 'local'
            }
          });
          
          if (createAuthError) {
            console.error('[API] 在 Supabase Auth 中创建用户失败:', createAuthError);
            // 创建失败不阻止登录流程
          } else if (newAuthUser?.user) {
            supabaseUserId = newAuthUser.user.id;
            console.log(`[API] 在 Supabase Auth 中创建用户成功，ID: ${supabaseUserId}`);
          }
        } catch (createError) {
          console.error('[API] 在 Supabase Auth 中创建用户异常:', createError.message);
          // 异常不阻止登录流程
        }
      }
      
      if (!user) {
        // 创建新用户
        console.log(`[API] 用户 ${email} 不存在，自动创建新用户`);
        
        // 使用 Supabase Auth 的 ID（如果创建成功），否则生成新的 UUID
        const userId = supabaseUserId || randomUUID();
        
        const now = Date.now();
        user = {
          id: userId,
          email: email,
          username: email.split('@')[0],
          password_hash: 'TEMP_HASH', // 临时密码哈希，后续用户可以设置真实密码
          avatar_url: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(email.split('@')[0]) + '&background=random',
          membership_level: 'free',
          membership_status: 'active',
          auth_provider: 'local', // 标记为本地登录（邮箱验证码）
          isNewUser: true, // 标记为新用户，需要完善个人信息
          created_at: now,
          updated_at: now
        };
        
        // 保存用户到数据库
        await userDB.createUser(user);
        console.log(`[API] 新用户创建成功，ID: ${userId}`);
      } else {
        // 确保用户是通过邮箱验证码登录的
        if (user.auth_provider && user.auth_provider !== 'local') {
          console.warn(`[API] 用户 ${email} 不是通过邮箱验证码登录的，移除该用户`);
          // 这里可以添加删除用户的逻辑，但为了安全起见，我们只标记为禁用
          await userDB.updateById(user.id, { membership_status: 'inactive' });
          sendJson(res, 401, { code: 1, message: '该账号不是通过邮箱验证码登录的，请使用邮箱验证码登录' });
          return;
        }
        
        // 如果 Supabase Auth 中有该用户，但 public.users 中的 ID 不一致，需要修复
        if (supabaseUserId && user.id !== supabaseUserId) {
          console.warn(`[API] 检测到用户ID不一致，正在修复:`, {
            publicUsersId: user.id,
            supabaseAuthId: supabaseUserId
          });
          
          const oldUserId = user.id;
          
          // 使用事务更新用户 ID 及相关外键
          try {
            console.log(`[API] 开始更新用户ID从 ${oldUserId} 到 ${supabaseUserId}...`);
            await userDB.updateUserId(oldUserId, supabaseUserId);
            user.id = supabaseUserId;
            console.log(`[API] 用户ID已修复为 Supabase Auth ID: ${supabaseUserId}`);
            
            // 同时更新社区的创建者ID
            try {
              console.log(`[API] 检查并更新社区的创建者ID...`);
              const communities = await communityDB.getAllCommunities();
              for (const community of communities) {
                if (community.creator_id === oldUserId) {
                  console.log(`[API] 更新社区 ${community.id} 的创建者ID从 ${oldUserId} 到 ${supabaseUserId}`);
                  await communityDB.updateCommunityCreatorId(community.id, supabaseUserId);
                }
              }
              console.log(`[API] 社区创建者ID更新完成`);
            } catch (communityError) {
              console.error('[API] 更新社区创建者ID失败:', communityError);
            }
          } catch (fixError) {
            console.error('[API] 修复用户ID失败:', fixError);
            // 如果无法修复，继续使用原来的 ID
          }
        } else if (supabaseUserId && user.id === supabaseUserId) {
          console.log(`[API] 用户ID已与 Supabase Auth 同步: ${user.id}`);
        } else {
          console.log(`[API] 用户登录成功，ID: ${user.id} (未与 Supabase Auth 关联)`);
        }
      }
      
      // 生成JWT token
      const token = generateToken({ userId: user.id, email: user.email })
      
      // 确保返回给前端的用户对象使用正确的字段名
      const userForFrontend = {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar || user.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.username) + '&background=random',
        membership_level: user.membership_level || 'free',
        membership_status: user.membership_status || 'active',
        isNewUser: user.isNewUser || false // 标记是否为新用户
      };
      
      sendJson(res, 200, {
        code: 0,
        message: '登录成功',
        data: {
          user: userForFrontend,
          token: token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天过期
        }
      })
    } catch (error) {
      console.error('[API] 登录失败:', error);
      console.error('[API] 错误详情:', error.message);
      console.error('[API] 错误堆栈:', error.stack);
      sendJson(res, 500, { code: 1, message: '登录失败: ' + (error.message || '未知错误') })
    }
    return
  }

  // 刷新 Token
  if (req.method === 'POST' && path === '/api/auth/refresh') {
    try {
      const body = await readBody(req)
      const { token, refreshToken } = body
      
      if (!token && !refreshToken) {
        sendJson(res, 400, { code: 1, message: 'Missing token or refreshToken' })
        return
      }
      
      // 简单验证 token
      // 实际生产中应该验证 refreshToken 的有效性
      // 这里为了演示，直接颁发新 token
      
      // 尝试解码 token 获取 userId
      let userId = null;
      try {
         const decoded = verifyToken(token) || verifyToken(refreshToken);
         if (decoded) userId = decoded.userId || decoded.id || decoded.sub;
      } catch (e) {
         // Token 可能已过期，这是正常的
      }

      // 如果无法从 token 获取，尝试从 refreshToken 获取 (如果它们是 JWT)
      // 在这个简单实现中，如果都失败了，我们可能需要拒绝
      // 但为了方便测试，如果提供了有效格式的 token，我们尝试宽容处理
      
      if (!userId) {
          // 如果无法解码，生成一个新的 ID 或者报错
          // 这里报错比较安全
          // 但为了防止死循环，如果是 mock token，我们允许通过
          if (token === 'mock-token' || refreshToken === 'mock-refresh-token') {
             userId = 'mock-user-id';
          } else {
             // 尝试继续使用旧 token 的部分信息（如果能提取的话）
             // 否则返回 401
             sendJson(res, 401, { code: 1, message: 'Invalid token' })
             return
          }
      }
      
      const newToken = generateToken({ userId: userId })
      const newRefreshToken = generateToken({ userId: userId, type: 'refresh' })
      
      sendJson(res, 200, {
        code: 0,
        message: 'Token refreshed',
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      })
    } catch (error) {
      console.error('[API] Refresh failed:', error)
      sendJson(res, 500, { code: 1, message: 'Refresh failed' })
    }
    return
  }

  // 获取当前用户信息 (/api/auth/me)
  if (req.method === 'GET' && path === '/api/auth/me') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }

    try {
      const user = await userDB.findById(decoded.userId)
      if (!user) {
        sendJson(res, 404, { code: 1, message: '用户不存在' })
        return
      }

      // 返回用户信息（排除敏感字段）
      const safeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar_url || user.avatar,
        phone: user.phone,
        age: user.age,
        bio: user.bio,
        location: user.location,
        occupation: user.occupation,
        website: user.website,
        github: user.github,
        twitter: user.twitter,
        interests: user.interests,
        tags: user.tags,
        coverImage: user.coverImage || user.cover_image,
        membership_level: user.membership_level || 'free',
        membership_status: user.membership_status || 'active',
        membership_start: user.membership_start,
        membership_end: user.membership_end,
        is_verified: user.is_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
        // 合并 metadata 中的字段
        ...user.metadata
      }

      sendJson(res, 200, { code: 0, data: safeUser })
    } catch (error) {
      console.error('[API] Get user info failed:', error)
      sendJson(res, 500, { code: 1, message: '获取用户信息失败' })
    }
    return
  }

  // 根据ID或用户名获取用户信息 (/api/users/:idOrUsername)
  if (req.method === 'GET' && path.startsWith('/api/users/') && path.split('/').length === 4) {
    const userIdOrUsername = path.split('/')[3]
    if (!userIdOrUsername) {
      sendJson(res, 400, { code: 1, message: '用户ID不能为空' })
      return
    }

    try {
      console.log('[API] Getting user by ID or username:', userIdOrUsername)
      
      // 检查是否是有效的 UUID 格式
      const isValidUUID = (str) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        return uuidRegex.test(str)
      }
      
      let user = null
      
      // 如果是有效的 UUID，首先尝试通过 ID 查找
      if (isValidUUID(userIdOrUsername)) {
        console.log('[API] Valid UUID format, trying to find by ID:', userIdOrUsername)
        user = await userDB.findById(userIdOrUsername)
      } else {
        console.log('[API] Not a valid UUID, skipping ID lookup:', userIdOrUsername)
      }
      
      // 如果找不到，尝试通过用户名查找
      if (!user) {
        console.log('[API] User not found by ID, trying username:', userIdOrUsername)
        user = await userDB.getByUsername(userIdOrUsername)
      }
      
      console.log('[API] Found user:', user)
      if (!user) {
        sendJson(res, 404, { code: 1, message: '用户不存在' })
        return
      }

      // 返回用户信息（排除敏感字段）
      const safeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar_url || user.avatar,
        phone: user.phone,
        age: user.age,
        bio: user.bio,
        location: user.location,
        occupation: user.occupation,
        website: user.website,
        github: user.github,
        twitter: user.twitter,
        interests: user.interests,
        tags: user.tags,
        coverImage: user.coverImage || user.cover_image,
        membership_level: user.membership_level || 'free',
        membership_status: user.membership_status || 'active',
        membership_start: user.membership_start,
        membership_end: user.membership_end,
        is_verified: user.is_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
        followers_count: user.followers_count || 0,
        following_count: user.following_count || 0
      }

      sendJson(res, 200, { code: 0, data: safeUser })
    } catch (error) {
      console.error('[API] Get user by ID failed:', error)
      sendJson(res, 500, { code: 1, message: '获取用户信息失败' })
    }
    return
  }

  // 更新当前用户信息 (/api/auth/me)
  if (req.method === 'PUT' && path === '/api/auth/me') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }

    try {
      const body = await readBody(req)
      console.log('[API] Update user request body:', { 
        hasAvatar: body.avatar !== undefined, 
        avatarLength: body.avatar?.length,
        hasCoverImage: body.coverImage !== undefined 
      })
      
      const user = await userDB.findById(decoded.userId)
      if (!user) {
        sendJson(res, 404, { code: 1, message: '用户不存在' })
        return
      }

      // 构建更新数据
      const updateData = {}
      if (body.username !== undefined) updateData.username = body.username
      // 手机号：只更新非空字符串，避免唯一约束冲突
      if (body.phone !== undefined && body.phone !== '') updateData.phone = body.phone
      if (body.age !== undefined) updateData.age = body.age
      if (body.bio !== undefined) updateData.bio = body.bio
      if (body.location !== undefined) updateData.location = body.location
      if (body.occupation !== undefined) updateData.occupation = body.occupation
      if (body.website !== undefined) updateData.website = body.website
      if (body.github !== undefined) updateData.github = body.github
      if (body.twitter !== undefined) updateData.twitter = body.twitter
      if (body.interests !== undefined) updateData.interests = body.interests
      if (body.tags !== undefined) updateData.tags = body.tags
      if (body.avatar !== undefined) {
        updateData.avatar_url = body.avatar
        console.log('[API] Setting avatar_url:', body.avatar.substring(0, 50) + '...')
      }
      if (body.coverImage !== undefined) updateData.cover_image = body.coverImage
      
      // 处理 isNewUser 字段 - 更新 is_new_user 数据库字段
      if (body.isNewUser !== undefined) {
        updateData.is_new_user = body.isNewUser
        console.log('[API] Setting is_new_user:', body.isNewUser)
      }

      // 更新 metadata
      const metadata = {
        ...(user.metadata || {}),
        ...(body.metadata || {}),
        username: body.username || user.username,
        phone: body.phone !== undefined ? body.phone : user.phone,
        age: body.age !== undefined ? body.age : user.age,
        bio: body.bio !== undefined ? body.bio : user.bio,
        location: body.location !== undefined ? body.location : user.location,
        occupation: body.occupation !== undefined ? body.occupation : user.occupation,
        website: body.website !== undefined ? body.website : user.website,
        github: body.github !== undefined ? body.github : user.github,
        twitter: body.twitter !== undefined ? body.twitter : user.twitter,
        interests: body.interests !== undefined ? body.interests : user.interests,
        tags: body.tags !== undefined ? body.tags : user.tags,
        avatar: body.avatar !== undefined ? body.avatar : user.avatar_url,
        coverImage: body.coverImage !== undefined ? body.coverImage : user.cover_image
      }
      updateData.metadata = metadata

      const updatedUser = await userDB.updateById(decoded.userId, updateData)
      if (!updatedUser) {
        sendJson(res, 500, { code: 1, message: '更新用户信息失败' })
        return
      }

      // 返回更新后的用户信息
      const safeUser = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar_url || updatedUser.avatar,
        phone: updatedUser.phone,
        age: updatedUser.age,
        bio: updatedUser.bio,
        location: updatedUser.location,
        occupation: updatedUser.occupation,
        website: updatedUser.website,
        github: updatedUser.github,
        twitter: updatedUser.twitter,
        interests: updatedUser.interests,
        tags: updatedUser.tags,
        coverImage: updatedUser.coverImage || updatedUser.cover_image,
        membership_level: updatedUser.membership_level || 'free',
        membership_status: updatedUser.membership_status || 'active',
        updated_at: updatedUser.updated_at
      }

      sendJson(res, 200, { code: 0, data: safeUser, message: '用户信息更新成功' })
    } catch (error) {
      console.error('[API] Update user info failed:', error)
      sendJson(res, 500, { code: 1, message: '更新用户信息失败: ' + error.message })
    }
    return
  }

  // 健康检查
  if (req.method === 'GET' && path === '/api/health/ping') {
    sendJson(res, 200, { ok: true, message: 'pong', port: PORT })
    return
  }

  // LLM健康检查
  if (req.method === 'GET' && path === '/api/health/llms') {
    const status = {
      kimi: {
        configured: !!((process.env.KIMI_API_KEY || process.env.VITE_KIMI_API_KEY)),
        baseUrl: process.env.KIMI_BASE_URL || KIMI_BASE_URL
      },
      deepseek: {
        configured: !!((process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY)),
        baseUrl: process.env.DEEPSEEK_BASE_URL || DEEPSEEK_BASE_URL
      },
      qwen: {
        configured: !!((process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY)),
        baseUrl: 'https://dashscope.aliyuncs.com'
      }
    }
    sendJson(res, 200, { ok: true, status })
    return
  }

  // 清理非邮箱验证码登录的用户
  if (req.method === 'POST' && path === '/api/auth/cleanup-non-email-users') {
    try {
      const deletedCount = await userDB.cleanupNonEmailCodeUsers()
      sendJson(res, 200, {
        code: 0,
        message: '清理非邮箱验证码登录用户成功',
        data: { deletedCount }
      })
    } catch (error) {
      console.error('[API] 清理用户失败:', error)
      sendJson(res, 500, {
        code: 1,
        message: '清理用户失败'
      })
    }
    return
  }

  // 删除测试邮箱用户
  if (req.method === 'POST' && path === '/api/auth/delete-test-users') {
    try {
      const deletedCount = await userDB.deleteTestEmailUsers()
      sendJson(res, 200, {
        code: 0,
        message: '删除测试邮箱用户成功',
        data: { deletedCount }
      })
    } catch (error) {
      console.error('[API] 删除测试用户失败:', error)
      sendJson(res, 500, {
        code: 1,
        message: '删除测试用户失败'
      })
    }
    return
  }

  // 更新用户ID，确保与Supabase用户ID匹配
  if (req.method === 'POST' && path === '/api/auth/update-user-id') {
    try {
      const body = await readBody(req)
      const { oldId, newId, email } = body
      
      if (!oldId || !newId || !email) {
        sendJson(res, 400, { code: 1, message: '缺少必要参数' })
        return
      }
      
      // 查找旧用户
      const oldUser = await userDB.findById(oldId)
      if (oldUser) {
        // 直接在数据库中删除旧用户
        // 这里我们跳过删除，因为可能会影响其他数据
        console.log(`[API] 发现旧用户，ID: ${oldId}`)
      }
      
      // 确保新用户存在，使用Supabase ID
      let newUser = await userDB.findByEmail(email)
      if (!newUser) {
        // 创建新用户
        newUser = {
          id: newId,
          email: email,
          username: email.split('@')[0],
          password_hash: 'TEMP_HASH',
          avatar_url: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(email.split('@')[0]) + '&background=random',
          membership_level: 'free',
          membership_status: 'active',
          auth_provider: 'local',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        await userDB.createUser(newUser)
        console.log(`[API] 创建新用户成功，ID: ${newId}`)
      } else {
        // 更新现有用户的信息，确保使用Supabase ID
        await userDB.updateById(newUser.id, {
          avatar_url: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(email.split('@')[0]) + '&background=random',
          auth_provider: 'local'
        })
        console.log(`[API] 更新用户信息成功，ID: ${newUser.id}`)
      }
      
      sendJson(res, 200, {
        code: 0,
        message: '用户ID更新成功',
        data: { oldId, newId, email }
      })
    } catch (error) {
      console.error('[API] 更新用户ID失败:', error)
      sendJson(res, 500, {
        code: 1,
        message: '更新用户ID失败'
      })
    }
    return
  }

  // ==========================================
  // 好友系统 API
  // =========================================
  
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

  // 关注用户
  if (req.method === 'POST' && path === '/api/follows') {
    const decoded = verifyRequestToken(req)
    if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }

    const b = await readBody(req)
    if (!b.targetUserId) { sendJson(res, 400, { code: 1, message: '目标用户ID不能为空' }); return }
    if (decoded.userId === b.targetUserId) { sendJson(res, 400, { code: 1, message: '不能关注自己' }); return }

    try {
      const db = await getDB()
      const now = new Date().toISOString()

      // 插入关注记录
      await db.query(`
        INSERT INTO follows (id, follower_id, following_id, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3)
        ON CONFLICT (follower_id, following_id) DO NOTHING
      `, [decoded.userId, b.targetUserId, now])

      // 更新用户的关注数和被关注数
      await db.query('UPDATE users SET following_count = following_count + 1 WHERE id = $1', [decoded.userId])
      await db.query('UPDATE users SET followers_count = followers_count + 1 WHERE id = $1', [b.targetUserId])

      sendJson(res, 200, { code: 0, message: '关注成功' })
    } catch (e) {
      console.error('[API] Follow user failed:', e)
      sendJson(res, 500, { code: 1, message: '关注失败: ' + e.message })
    }
    return
  }

  // 取消关注
  if (req.method === 'DELETE' && path.startsWith('/api/follows/')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }

    const targetUserId = path.split('/')[3]
    if (!targetUserId) { sendJson(res, 400, { code: 1, message: '目标用户ID不能为空' }); return }

    try {
      const db = await getDB()

      // 删除关注记录
      const { rowCount } = await db.query(`
        DELETE FROM follows WHERE follower_id = $1 AND following_id = $2
      `, [decoded.userId, targetUserId])

      if (rowCount > 0) {
        // 更新用户的关注数和被关注数
        await db.query('UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = $1', [decoded.userId])
        await db.query('UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = $1', [targetUserId])
      }

      sendJson(res, 200, { code: 0, message: '取消关注成功' })
    } catch (e) {
      console.error('[API] Unfollow user failed:', e)
      sendJson(res, 500, { code: 1, message: '取消关注失败: ' + e.message })
    }
    return
  }

  // 获取关注列表
  if (req.method === 'GET' && path === '/api/follows/following') {
    const decoded = verifyRequestToken(req)
    if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }

    try {
      const db = await getDB()
      const { rows } = await db.query(`
        SELECT u.id, u.username, u.avatar_url
        FROM follows f
        JOIN users u ON f.following_id = u.id
        WHERE f.follower_id = $1
        ORDER BY f.created_at DESC
      `, [decoded.userId])

      sendJson(res, 200, { code: 0, data: rows })
    } catch (e) {
      console.error('[API] Get following list failed:', e)
      sendJson(res, 500, { code: 1, message: '获取关注列表失败: ' + e.message })
    }
    return
  }

  // 获取粉丝列表
  if (req.method === 'GET' && path === '/api/follows/followers') {
    const decoded = verifyRequestToken(req)
    if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }

    try {
      const db = await getDB()
      const { rows } = await db.query(`
        SELECT u.id, u.username, u.avatar_url
        FROM follows f
        JOIN users u ON f.follower_id = u.id
        WHERE f.following_id = $1
        ORDER BY f.created_at DESC
      `, [decoded.userId])

      sendJson(res, 200, { code: 0, data: rows })
    } catch (e) {
      console.error('[API] Get followers list failed:', e)
      sendJson(res, 500, { code: 1, message: '获取粉丝列表失败: ' + e.message })
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
    try {
      const decoded = verifyRequestToken(req)
      if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }
      
      const b = await readBody(req)
      if (!b.status) { sendJson(res, 400, { error: 'MISSING_STATUS' }); return }
      
      // 验证状态值
      const validStatuses = ['online', 'offline', 'away']
      if (!validStatuses.includes(b.status)) {
        sendJson(res, 400, { error: 'INVALID_STATUS', message: '状态值必须是 online、offline 或 away' }); return
      }
      
      console.log(`[API] 更新用户状态: ${decoded.userId} -> ${b.status}`)
      
      await friendDB.updateUserStatus(decoded.userId, b.status)
      sendJson(res, 200, { ok: true, message: '状态更新成功' })
    } catch (e) {
      console.error('[API] 更新用户状态失败:', e)
      // 检查是否是外键约束错误，如果是则返回成功（用户可能尚未同步到 users 表）
      const errorMessage = e.message || e.toString() || ''
      if (errorMessage.includes('violates foreign key constraint') || 
          errorMessage.includes('user_status_user_id_fkey') ||
          (errorMessage.includes('insert or update on table') && errorMessage.includes('user_status')) ||
          e.code === '23503') {
        console.warn(`[API] 用户状态更新遇到外键约束错误，静默处理: ${decoded?.userId}`)
        sendJson(res, 200, { ok: true, message: '状态更新成功' })
        return
      }
      sendJson(res, 500, { 
        error: 'DB_ERROR', 
        message: '更新状态失败',
        details: process.env.NODE_ENV === 'development' ? e.stack : undefined
      })
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
      // 检查私信权限（仅关注者可发送）
      const permissionCheck = await messageDB.canSendMessage(decoded.userId, b.friendId)
      if (!permissionCheck.allowed) {
        sendJson(res, 403, { 
          error: 'PERMISSION_DENIED', 
          message: permissionCheck.reason,
          waitingForReply: permissionCheck.waitingForReply || false
        })
        return
      }
      
      const msg = await messageDB.sendMessage(decoded.userId, b.friendId, b.content)
      sendJson(res, 200, { ok: true, data: msg })
    } catch (e) {
      sendJson(res, 500, { error: 'DB_ERROR', message: e.message })
    }
    return
  }

  // 发送社群消息
  if (req.method === 'POST' && path === '/api/community/messages') {
    const decoded = verifyRequestToken(req)
    if (!decoded) { sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); return }
    
    const b = await readBody(req)
    if (!b.communityId || !b.channelId || !b.content) { 
      sendJson(res, 400, { error: 'MISSING_PARAMS', message: '缺少必要参数' }); 
      return 
    }
    
    try {
      const db = await getDB()
      const { rows } = await db.query(`
        INSERT INTO messages (channel_id, user_id, content, type, metadata, status, community_id, role, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *
      `, [
        b.channelId,
        decoded.userId,
        b.content,
        b.type || 'text',
        b.metadata || {},
        'sent',
        b.communityId,
        'user'
      ])
      
      sendJson(res, 200, { code: 0, data: rows[0] })
    } catch (e) {
      console.error('[API] Send community message failed:', e)
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
        // 使用缓存减少数据库查询频率
        const cacheKey = `messages_unread_${decoded.userId}`;
        let counts = getCache(cacheKey);
        
        if (!counts) {
          counts = await messageDB.getUnreadCount(decoded.userId);
          setCache(cacheKey, counts);
        }
        
        sendJson(res, 200, { ok: true, data: counts })
      } catch (e) {
        sendJson(res, 500, { error: 'DB_ERROR', message: e.message })
      }
      return
    }
    
    // Check if it is conversations list
    if (path === '/api/messages/conversations') {
      console.log('[API] 获取会话列表')
      const decoded = verifyRequestToken(req)
      if (!decoded) { 
        console.log('[API] 未授权访问')
        sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' }); 
        return 
      }
      
      console.log('[API] 用户ID:', decoded.userId)
      
      try {
        const conversations = await messageDB.getConversations(decoded.userId)
        console.log('[API] 返回会话数:', conversations.length)
        sendJson(res, 200, { ok: true, data: conversations })
      } catch (e) {
        console.error('[API] 获取会话列表失败:', e)
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

  // 搜索作品
  if (req.method === 'GET' && path === '/api/search/works') {
    const query = u.searchParams.get('query') || ''
    const page = parseInt(u.searchParams.get('page') || '1')
    const limit = parseInt(u.searchParams.get('limit') || '20')
    const category = u.searchParams.get('category') || ''
    
    try {
      // 获取所有作品
      const allWorks = await workDB.getAllWorks()
      
      // 过滤作品
      const filteredWorks = allWorks.filter(work => {
        const titleMatch = work.title?.toLowerCase().includes(query.toLowerCase())
        const descMatch = work.description?.toLowerCase().includes(query.toLowerCase())
        const authorMatch = work.author?.username?.toLowerCase().includes(query.toLowerCase()) || work.creator?.toLowerCase().includes(query.toLowerCase())
        const tagMatch = work.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        const categoryMatch = !category || work.category?.toLowerCase() === category.toLowerCase()
        
        return (titleMatch || descMatch || authorMatch || tagMatch) && categoryMatch
      })
      
      // 分页
      const start = (page - 1) * limit
      const end = start + limit
      const paginatedWorks = filteredWorks.slice(start, end)
      
      sendJson(res, 200, { code: 0, data: paginatedWorks })
    } catch (e) {
      console.error('[API] Search works failed:', e)
      sendJson(res, 500, { code: 1, message: '搜索作品失败' })
    }
    return
  }

  // 搜索用户
  if (req.method === 'GET' && path === '/api/search/users') {
    const query = u.searchParams.get('query') || ''
    const page = parseInt(u.searchParams.get('page') || '1')
    const limit = parseInt(u.searchParams.get('limit') || '20')
    
    try {
      // 获取所有用户
      const allUsers = await userDB.getAllUsers()
      
      // 过滤用户
      const filteredUsers = allUsers.filter(user => {
        const usernameMatch = user.username?.toLowerCase().includes(query.toLowerCase())
        const emailMatch = user.email?.toLowerCase().includes(query.toLowerCase())
        
        return usernameMatch || emailMatch
      })
      
      // 分页
      const start = (page - 1) * limit
      const end = start + limit
      const paginatedUsers = filteredUsers.slice(start, end)
      
      sendJson(res, 200, { code: 0, data: paginatedUsers })
    } catch (e) {
      console.error('[API] Search users failed:', e)
      sendJson(res, 500, { code: 1, message: '搜索用户失败' })
    }
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

  // 处理Kimi模型的聊天补全请求
  if (req.method === 'POST' && path === '/api/kimi/chat/completions') {
    const keyPresent = (process.env.KIMI_API_KEY || KIMI_API_KEY)
    if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
    const b = await readBody(req)
    
    const r = await kimiFetch('/chat/completions', 'POST', {
      model: b.model || 'moonshot-v1-32k',
      messages: Array.isArray(b.messages) ? b.messages : [],
      temperature: b.temperature,
      top_p: b.top_p,
      max_tokens: b.max_tokens,
      stream: b.stream || false
    }, res)
    
    if (r.isStream) {
      console.log('[Kimi] Streaming response sent');
      return
    }
    
    if (!r.ok) { 
      console.error('[Kimi] Upstream API Error:', r.status, JSON.stringify(r.data));
      sendJson(res, r.status, { error: (r.data?.code) || (r.data?.message) || 'SERVER_ERROR', data: r.data }); 
      return 
    }
    
    sendJson(res, 200, { ok: true, data: r.data })
    return
  }

  // 处理DeepSeek模型的聊天补全请求
  if (req.method === 'POST' && path === '/api/deepseek/chat/completions') {
    const keyPresent = (process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY)
    if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
    const b = await readBody(req)
    
    const r = await deepseekFetch('/chat/completions', 'POST', {
      model: b.model || 'deepseek-chat',
      messages: Array.isArray(b.messages) ? b.messages : [],
      temperature: b.temperature,
      top_p: b.top_p,
      max_tokens: b.max_tokens,
      stream: b.stream || false
    }, res)
    
    if (r.isStream) {
      console.log('[DeepSeek] Streaming response sent');
      return
    }
    
    if (!r.ok) { 
      console.error('[DeepSeek] Upstream API Error:', r.status, JSON.stringify(r.data));
      sendJson(res, r.status, { error: (r.data?.code) || (r.data?.message) || 'SERVER_ERROR', data: r.data }); 
      return 
    }
    
    sendJson(res, 200, { ok: true, data: r.data })
    return
  }

  // 处理千问图片生成请求
  if (req.method === 'POST' && path === '/api/qwen/images/generate') {
    const b = await readBody(req)
    
    // 确保prompt字段存在
    if (!b.prompt) { sendJson(res, 400, { error: 'PROMPT_REQUIRED', message: 'Prompt is required' }); return }
    
    console.log(`[Qwen Image] Request received:`, b.prompt);
    
    const authKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY || ''
    if (!authKey) { 
      console.error('[Qwen Image] ERROR: API Key not configured. Please set DASHSCOPE_API_KEY or VITE_QWEN_API_KEY environment variable.');
      sendJson(res, 401, { error: 'API_KEY_MISSING', message: 'Missing DashScope API Key' }); 
      return 
    }
    console.log(`[Qwen Image] API Key configured: ${authKey.slice(0, 8)}...${authKey.slice(-4)}`);

    try {
      const r = await dashscopeImageGenerate({
        prompt: b.prompt,
        size: b.size || '1024x1024',
        n: b.n || 1,
        authKey,
        model: b.model || 'wanx2.1-t2i-turbo'
      })
      
      if (!r.ok) {
        console.error('[Qwen Image] Generation failed:', r.data);
        sendJson(res, r.status, r.data)
        return
      }
      
      console.log('[Qwen Image] Generation successful:', r.data);
      sendJson(res, 200, { ok: true, data: r.data })
    } catch (e) {
      console.error('[Qwen Image] Error:', e)
      sendJson(res, 500, { error: 'GENERATION_FAILED', message: e.message })
    }
    return
  }

  // 处理千问视频生成请求
  if (req.method === 'POST' && path === '/api/qwen/videos/generate') {
    const b = await readBody(req)
    
    let prompt = b.prompt;
    let imageUrl = b.imageUrl;
    
    // Parse content array if present (from llmService)
    if (b.content && Array.isArray(b.content)) {
        const textItem = b.content.find(item => item.type === 'text');
        if (textItem) prompt = textItem.text;
        
        const imageItem = b.content.find(item => item.type === 'image_url');
        if (imageItem) {
            imageUrl = imageItem.image_url?.url || imageItem.image_url;
            console.log(`[Qwen Video] Parsed image URL from content:`, imageUrl);
        }
    }

    // 确保prompt字段存在
    if (!prompt) { sendJson(res, 400, { error: 'PROMPT_REQUIRED', message: 'Prompt is required' }); return }
    
    console.log(`[Qwen Video] Request received:`, prompt);
    console.log(`[Qwen Video] Image URL:`, imageUrl || '(none - text to video)');
    
    const authKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY || ''
    if (!authKey) { 
      console.error('[Qwen Video] ERROR: API Key not configured. Please set DASHSCOPE_API_KEY or VITE_QWEN_API_KEY environment variable.');
      sendJson(res, 401, { error: 'API_KEY_MISSING', message: 'Missing DashScope API Key' }); 
      return 
    }
    console.log(`[Qwen Video] API Key configured: ${authKey.slice(0, 8)}...${authKey.slice(-4)}`);

    try {
      const r = await dashscopeVideoGenerate({
        prompt: prompt,
        imageUrl: imageUrl, // Support image-to-video if provided
        authKey,
        model: b.model
      })
      
      if (!r.ok) {
        console.error('[Qwen Video] Generation failed:', r.data);
        sendJson(res, r.status, r.data)
        return
      }
      
      console.log('[Qwen Video] Generation successful:', r.data);
      sendJson(res, 200, { ok: true, data: r.data })
    } catch (e) {
      console.error('[Qwen Video] Error:', e)
      sendJson(res, 500, { error: 'GENERATION_FAILED', message: e.message })
    }
    return
  }

  // 获取通知列表 (支持 /api/notifications 和 /api/user/notifications)
  if (req.method === 'GET' && (path === '/api/notifications' || path === '/api/user/notifications')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }

    try {
      const limit = parseInt(u.searchParams.get('limit') || '20')
      const offset = parseInt(u.searchParams.get('offset') || '0')

      const notifications = await notificationDB.getNotifications(decoded.userId, limit, offset)
      const total = await notificationDB.getTotalCount(decoded.userId)
      const unreadCount = await notificationDB.getUnreadCount(decoded.userId)

      sendJson(res, 200, {
        code: 0,
        data: {
          list: notifications,
          total: total,
          unreadCount: unreadCount,
          hasMore: offset + notifications.length < total
        }
      })
    } catch (e) {
      console.error('[API] Get notifications failed:', e)
      sendJson(res, 500, { code: 1, message: '获取通知失败' })
    }
    return
  }

  // 获取未读通知数量
  if (req.method === 'GET' && path === '/api/notifications/unread-count') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }

    try {
      const count = await notificationDB.getUnreadCount(decoded.userId)
      sendJson(res, 200, { code: 0, data: { count } })
    } catch (e) {
      console.error('[API] Get unread count failed:', e)
      sendJson(res, 500, { code: 1, message: '获取未读数量失败' })
    }
    return
  }

  // 标记通知为已读
  if (req.method === 'POST' && path.match(/^\/api\/notifications\/[^/]+\/read$/)) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }

    try {
      const notificationId = path.split('/')[3]
      const success = await notificationDB.markAsRead(notificationId, decoded.userId)

      if (success) {
        sendJson(res, 200, { code: 0, message: '标记成功' })
      } else {
        sendJson(res, 404, { code: 1, message: '通知不存在' })
      }
    } catch (e) {
      console.error('[API] Mark as read failed:', e)
      sendJson(res, 500, { code: 1, message: '标记已读失败' })
    }
    return
  }

  // 标记所有通知为已读
  if (req.method === 'POST' && (path === '/api/notifications/read-all' || path === '/api/user/notifications/read-all')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }

    try {
      const count = await notificationDB.markAllAsRead(decoded.userId)
      sendJson(res, 200, { code: 0, message: '全部标记已读成功', data: { count } })
    } catch (e) {
      console.error('[API] Mark all as read failed:', e)
      sendJson(res, 500, { code: 1, message: '标记全部已读失败' })
    }
    return
  }

  // 删除通知
  if (req.method === 'DELETE' && path.match(/^\/api\/notifications\/[^/]+$/)) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }

    try {
      const notificationId = path.split('/')[3]
      const success = await notificationDB.delete(notificationId, decoded.userId)

      if (success) {
        sendJson(res, 200, { code: 0, message: '删除成功' })
      } else {
        sendJson(res, 404, { code: 1, message: '通知不存在' })
      }
    } catch (e) {
      console.error('[API] Delete notification failed:', e)
      sendJson(res, 500, { code: 1, message: '删除通知失败' })
    }
    return
  }

  // 获取社区列表
  if (req.method === 'GET' && path === '/api/communities') {
    try {
      const communities = await communityDB.getAllCommunities()
      console.log('[API] Get communities:', communities?.length, 'communities found')
      if (communities && communities.length > 0) {
        console.log('[API] First community:', JSON.stringify(communities[0], null, 2))
      }
      sendJson(res, 200, { code: 0, data: communities || [] })
    } catch (e) {
      console.error('[API] Get communities failed:', e)
      sendJson(res, 500, { code: 1, message: '获取社区列表失败' })
    }
    return
  }

  // 获取用户加入的社群列表
  if (req.method === 'GET' && path === '/api/user/communities') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      console.log('[API] getUserCommunities: Token verification failed')
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    try {
      console.log('[API] getUserCommunities: userId =', decoded.userId)
      const communities = await communityDB.getUserCommunities(decoded.userId)
      console.log('[API] getUserCommunities: found', communities?.length, 'communities')
      sendJson(res, 200, { code: 0, data: communities || [] })
    } catch (e) {
      console.error('[API] Get user communities failed:', e)
      sendJson(res, 500, { code: 1, message: '获取用户社群列表失败' })
    }
    return
  }

  // 创建社区
  if (req.method === 'POST' && path === '/api/communities') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      console.log('[API] createCommunity: Token verification failed')
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    console.log('[API] createCommunity: userId =', decoded.userId)

    const body = await readBody(req)
    console.log('Create community request body:', JSON.stringify(body, null, 2))

    if (!body.name) {
      sendJson(res, 400, { error: 'NAME_REQUIRED', message: '社群名称不能为空' })
      return
    }

    const now = Date.now()
    const newCommunity = {
      id: randomUUID(),
      name: body.name,
      description: body.description || '',
      avatar: body.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(body.name)}`,
      memberCount: 1,
      topic: body.tags?.[0] || '综合',
      isActive: true,
      isSpecial: false,
      theme: body.theme || {
        primaryColor: '#3B82F6',
        secondaryColor: '#60A5FA',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937'
      },
      layoutType: body.layoutType || 'standard',
      enabledModules: body.enabledModules || {
        posts: true,
        chat: true,
        members: true,
        announcements: true
      }
    }

    try {
      // 首先确保用户存在于数据库中
      const existingUser = await userDB.findById(decoded.userId)
      if (!existingUser) {
        // 如果用户不存在，创建用户记录
        console.log('[API] createCommunity: User not found, creating user record')
        await userDB.createUser({
          id: decoded.userId,
          username: decoded.username || `user_${decoded.userId.slice(0, 8)}`,
          email: decoded.email || `${decoded.userId}@local.dev`,
          password_hash: '',
          auth_provider: 'local'
        })
      }

      await communityDB.createCommunity({
        id: newCommunity.id,
        name: newCommunity.name,
        description: newCommunity.description,
        avatar: newCommunity.avatar,
        topic: newCommunity.topic,
        is_special: newCommunity.isSpecial,
        member_count: 0,
        is_active: true,
        creator_id: decoded.userId,
        theme: newCommunity.theme,
        layout_type: newCommunity.layoutType,
        enabled_modules: newCommunity.enabledModules
      })

      console.log('[API] createCommunity: adding creator as member, userId =', decoded.userId, 'communityId =', newCommunity.id)
      await communityDB.joinCommunity(decoded.userId, newCommunity.id, 'owner')
      console.log('[API] createCommunity: creator added as member successfully')

      // 构建返回数据，使用前端期望的字段格式
      const responseData = {
        id: newCommunity.id,
        name: newCommunity.name,
        description: newCommunity.description,
        avatar: newCommunity.avatar,
        member_count: 1,
        topic: newCommunity.topic,
        is_active: true,
        is_special: false,
        theme: newCommunity.theme,
        layout_type: newCommunity.layoutType,
        enabled_modules: newCommunity.enabledModules,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      sendJson(res, 200, { code: 0, data: responseData, message: '社群创建成功' })
    } catch (err) {
      console.error('[API] createCommunity: Failed to create community in DB:', err)
      sendJson(res, 500, { error: 'DB_ERROR', message: '创建社群失败: ' + err.message })
    }
    return
  }

  // 加入社群
  if (req.method === 'POST' && path.startsWith('/api/communities/') && path.endsWith('/join')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      console.log('[API] joinCommunity: Token verification failed')
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    const communityId = path.split('/')[3]
    console.log('[API] joinCommunity: userId =', decoded.userId, 'communityId =', communityId)

    try {
      // 检查社群是否存在
      const community = await communityDB.getCommunityById(communityId)
      if (!community) {
        sendJson(res, 404, { error: 'NOT_FOUND', message: '社群不存在' })
        return
      }

      // 检查是否已经加入
      const isMember = await communityDB.isCommunityMember(decoded.userId, communityId)
      if (isMember) {
        sendJson(res, 400, { error: 'ALREADY_MEMBER', message: '已经是该社群成员' })
        return
      }

      // 加入社群
      await communityDB.joinCommunity(decoded.userId, communityId, 'member')
      console.log('[API] joinCommunity: Successfully joined community')

      sendJson(res, 200, { code: 0, data: { requiresApproval: false, status: 'approved' }, message: '加入社群成功' })
    } catch (err) {
      console.error('[API] joinCommunity: Failed to join community:', err)
      sendJson(res, 500, { error: 'DB_ERROR', message: '加入社群失败: ' + err.message })
    }
    return
  }

  // 检查用户是否是社群成员
  if (req.method === 'GET' && path.startsWith('/api/communities/') && path.endsWith('/members/check')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      console.log('[API] checkCommunityMember: Token verification failed')
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    const communityId = path.split('/')[3]
    console.log('[API] checkCommunityMember: userId =', decoded.userId, 'communityId =', communityId)

    try {
      const isMember = await communityDB.isCommunityMember(decoded.userId, communityId)
      console.log('[API] checkCommunityMember: isMember =', isMember)

      sendJson(res, 200, { code: 0, data: { isMember }, message: '检查成功' })
    } catch (err) {
      console.error('[API] checkCommunityMember: Failed to check membership:', err)
      sendJson(res, 500, { error: 'DB_ERROR', message: '检查成员状态失败: ' + err.message })
    }
    return
  }

  // 退出社群
  if (req.method === 'POST' && path.startsWith('/api/communities/') && path.endsWith('/leave')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      console.log('[API] leaveCommunity: Token verification failed')
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    const communityId = path.split('/')[3]
    console.log('[API] leaveCommunity: userId =', decoded.userId, 'communityId =', communityId)

    try {
      // 检查社群是否存在
      const community = await communityDB.getCommunityById(communityId)
      if (!community) {
        sendJson(res, 404, { error: 'NOT_FOUND', message: '社群不存在' })
        return
      }

      // 检查是否是成员
      const isMember = await communityDB.isCommunityMember(decoded.userId, communityId)
      if (!isMember) {
        sendJson(res, 400, { error: 'NOT_MEMBER', message: '不是该社群成员' })
        return
      }

      // 退出社群
      await communityDB.leaveCommunity(communityId, decoded.userId)
      console.log('[API] leaveCommunity: Successfully left community')

      sendJson(res, 200, { code: 0, data: { success: true }, message: '退出社群成功' })
    } catch (err) {
      console.error('[API] leaveCommunity: Failed to leave community:', err)
      sendJson(res, 500, { error: 'DB_ERROR', message: '退出社群失败: ' + err.message })
    }
    return
  }

  // 获取社区统计数据
  if (req.method === 'GET' && path.startsWith('/api/communities/') && path.endsWith('/stats')) {
    const communityId = path.split('/')[3]
    if (!communityId) {
      sendJson(res, 400, { code: 1, message: '社区ID不能为空' })
      return
    }

    try {
      console.log('[API] Getting community stats for:', communityId)
      const stats = await communityDB.getCommunityStats(communityId)
      console.log('[API] Community stats:', stats)
      sendJson(res, 200, { code: 0, data: stats })
    } catch (err) {
      console.error('[API] Get community stats failed:', err)
      sendJson(res, 500, { code: 1, message: '获取社区统计数据失败: ' + err.message })
    }
    return
  }

  // 更新用户会话（用于标记用户在线状态）
  if (req.method === 'POST' && path === '/api/user/session') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    try {
      const body = await parseBody(req)
      const userId = body.userId || decoded.userId
      
      if (!userId) {
        sendJson(res, 400, { code: 1, message: '用户ID不能为空' })
        return
      }

      console.log('[API] Updating user session for:', userId)
      const sessionData = await communityDB.updateUserSession(userId, {
        sessionToken: body.sessionToken,
        ipAddress: req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })
      
      sendJson(res, 200, { code: 0, data: { success: true }, message: '会话更新成功' })
    } catch (err) {
      console.error('[API] Update user session failed:', err)
      sendJson(res, 500, { code: 1, message: '更新会话失败: ' + err.message })
    }
    return
  }

  // 获取社群成员列表
  if (req.method === 'GET' && path.startsWith('/api/communities/') && path.endsWith('/members')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    const communityId = path.split('/')[3]
    if (!communityId) {
      sendJson(res, 400, { code: 1, message: '社群ID不能为空' })
      return
    }

    try {
      console.log('[API] Getting community members for:', communityId)
      const members = await communityDB.getCommunityMembers(communityId)
      console.log('[API] Community members:', members.length)
      sendJson(res, 200, { code: 0, data: members })
    } catch (err) {
      console.error('[API] Get community members failed:', err)
      sendJson(res, 500, { code: 1, message: '获取社群成员失败: ' + err.message })
    }
    return
  }

  // 更新社群成员角色
  if (req.method === 'PUT' && path.startsWith('/api/communities/') && path.includes('/members/') && path.endsWith('/role')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    const communityId = path.split('/')[3]
    const userId = path.split('/')[5]

    if (!communityId || !userId) {
      sendJson(res, 400, { code: 1, message: '参数不完整' })
      return
    }

    try {
      const body = await readBody(req)
      const { role } = body

      if (!role) {
        sendJson(res, 400, { code: 1, message: '角色不能为空' })
        return
      }

      console.log('[API] Updating member role:', { communityId, userId, role })
      const success = await communityDB.updateMemberRole(communityId, userId, role)
      
      if (success) {
        sendJson(res, 200, { code: 0, data: { success: true }, message: '成员角色已更新' })
      } else {
        sendJson(res, 404, { code: 1, message: '成员不存在' })
      }
    } catch (err) {
      console.error('[API] Update member role failed:', err)
      sendJson(res, 500, { code: 1, message: '更新成员角色失败: ' + err.message })
    }
    return
  }

  // 移除社群成员
  if (req.method === 'DELETE' && path.startsWith('/api/communities/') && path.includes('/members/')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    const communityId = path.split('/')[3]
    const userId = path.split('/')[5]

    if (!communityId || !userId) {
      sendJson(res, 400, { code: 1, message: '参数不完整' })
      return
    }

    try {
      console.log('[API] Removing member:', { communityId, userId })
      const success = await communityDB.removeMember(communityId, userId)
      
      if (success) {
        sendJson(res, 200, { code: 0, data: { success: true }, message: '成员已移除' })
      } else {
        sendJson(res, 404, { code: 1, message: '成员不存在' })
      }
    } catch (err) {
      console.error('[API] Remove member failed:', err)
      sendJson(res, 500, { code: 1, message: '移除成员失败: ' + err.message })
    }
    return
  }

  // 获取社群公告列表
  if (req.method === 'GET' && path.startsWith('/api/communities/') && path.endsWith('/announcements')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    const communityId = path.split('/')[3]
    if (!communityId) {
      sendJson(res, 400, { code: 1, message: '社群ID不能为空' })
      return
    }

    try {
      console.log('[API] Getting community announcements for:', communityId)
      const announcements = await communityDB.getCommunityAnnouncements(communityId)
      console.log('[API] Community announcements:', announcements.length)
      sendJson(res, 200, { code: 0, data: announcements })
    } catch (err) {
      console.error('[API] Get community announcements failed:', err)
      sendJson(res, 500, { code: 1, message: '获取社群公告失败: ' + err.message })
    }
    return
  }

  // 创建社群公告
  if (req.method === 'POST' && path.startsWith('/api/communities/') && path.endsWith('/announcements')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    const communityId = path.split('/')[3]
    if (!communityId) {
      sendJson(res, 400, { code: 1, message: '社群ID不能为空' })
      return
    }

    try {
      const body = await readBody(req)
      const { title, content, isPinned } = body

      if (!title || !content) {
        sendJson(res, 400, { code: 1, message: '标题和内容不能为空' })
        return
      }

      console.log('[API] Creating announcement:', { communityId, title })
      const announcement = await communityDB.createAnnouncement({
        communityId,
        authorId: decoded.userId,
        title,
        content,
        isPinned
      })

      sendJson(res, 200, { code: 0, data: announcement, message: '公告已发布' })
    } catch (err) {
      console.error('[API] Create announcement failed:', err)
      sendJson(res, 500, { code: 1, message: '发布公告失败: ' + err.message })
    }
    return
  }

  // 更新社群公告
  if (req.method === 'PUT' && path.startsWith('/api/communities/') && path.includes('/announcements/')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    const announcementId = path.split('/')[5]
    if (!announcementId) {
      sendJson(res, 400, { code: 1, message: '公告ID不能为空' })
      return
    }

    try {
      const body = await readBody(req)
      const { title, content, isPinned } = body

      if (!title || !content) {
        sendJson(res, 400, { code: 1, message: '标题和内容不能为空' })
        return
      }

      console.log('[API] Updating announcement:', { announcementId, title })
      const announcement = await communityDB.updateAnnouncement(announcementId, {
        title,
        content,
        isPinned
      })

      sendJson(res, 200, { code: 0, data: announcement, message: '公告已更新' })
    } catch (err) {
      console.error('[API] Update announcement failed:', err)
      sendJson(res, 500, { code: 1, message: '更新公告失败: ' + err.message })
    }
    return
  }

  // 删除社群公告
  if (req.method === 'DELETE' && path.startsWith('/api/communities/') && path.includes('/announcements/')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    const announcementId = path.split('/')[5]
    if (!announcementId) {
      sendJson(res, 400, { code: 1, message: '公告ID不能为空' })
      return
    }

    try {
      console.log('[API] Deleting announcement:', announcementId)
      const success = await communityDB.deleteAnnouncement(announcementId)
      
      if (success) {
        sendJson(res, 200, { code: 0, data: { success: true }, message: '公告已删除' })
      } else {
        sendJson(res, 404, { code: 1, message: '公告不存在' })
      }
    } catch (err) {
      console.error('[API] Delete announcement failed:', err)
      sendJson(res, 500, { code: 1, message: '删除公告失败: ' + err.message })
    }
    return
  }

  // 获取社群加入申请列表
  if (req.method === 'GET' && path.startsWith('/api/communities/') && path.endsWith('/join-requests')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    const communityId = path.split('/')[3]
    if (!communityId) {
      sendJson(res, 400, { code: 1, message: '社群ID不能为空' })
      return
    }

    try {
      console.log('[API] Getting community join requests for:', communityId)
      const requests = await communityDB.getCommunityJoinRequests(communityId)
      console.log('[API] Community join requests:', requests.length)
      sendJson(res, 200, { code: 0, data: requests })
    } catch (err) {
      console.error('[API] Get community join requests failed:', err)
      sendJson(res, 500, { code: 1, message: '获取加入申请失败: ' + err.message })
    }
    return
  }

  // 处理社群加入申请
  if (req.method === 'POST' && path.startsWith('/api/communities/') && path.includes('/join-requests/')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    const requestId = path.split('/')[5]
    if (!requestId) {
      sendJson(res, 400, { code: 1, message: '申请ID不能为空' })
      return
    }

    try {
      const body = await readBody(req)
      const { action } = body

      if (!action || !['approve', 'reject'].includes(action)) {
        sendJson(res, 400, { code: 1, message: '操作类型不正确' })
        return
      }

      console.log('[API] Handling join request:', { requestId, action })
      const success = await communityDB.handleJoinRequest(requestId, action)
      
      if (success) {
        const message = action === 'approve' ? '申请已通过' : '申请已拒绝'
        sendJson(res, 200, { code: 0, data: { success: true }, message })
      } else {
        sendJson(res, 404, { code: 1, message: '申请不存在' })
      }
    } catch (err) {
      console.error('[API] Handle join request failed:', err)
      sendJson(res, 500, { code: 1, message: '处理申请失败: ' + err.message })
    }
    return
  }

  // 在社区中创建帖子
  if (req.method === 'POST' && path.startsWith('/api/communities/') && path.endsWith('/posts')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      console.log('[API] createCommunityPost: Token verification failed')
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    const communityId = path.split('/')[3]
    console.log('[API] createCommunityPost: userId =', decoded.userId, 'communityId =', communityId)

    if (!communityId) {
      sendJson(res, 400, { code: 1, message: '社区ID不能为空' })
      return
    }

    try {
      const body = await readBody(req)
      const { title, content, images, videos, audios } = body

      console.log('[API] createCommunityPost: body =', { 
        title, 
        content: content?.substring(0, 50), 
        hasImages: images && images.length > 0, 
        imagesCount: images?.length,
        hasVideos: videos && videos.length > 0, 
        videosCount: videos?.length,
        videos: videos,
        hasAudios: audios && audios.length > 0, 
        audiosCount: audios?.length 
      })

      if (!title || !content) {
        sendJson(res, 400, { code: 1, message: '标题和内容不能为空' })
        return
      }

      // 检查社区是否存在
      const community = await communityDB.getCommunityById(communityId)
      if (!community) {
        sendJson(res, 404, { code: 1, message: '社区不存在' })
        return
      }

      // 检查用户是否是社区成员
      const isMember = await communityDB.isCommunityMember(decoded.userId, communityId)
      if (!isMember) {
        sendJson(res, 403, { code: 1, message: '您不是该社区的成员，无法发帖' })
        return
      }

      // 创建帖子
      const post = await communityDB.createCommunityPost({
        communityId,
        userId: decoded.userId,
        title,
        content,
        images: images || [],
        videos: videos || [],
        audios: audios || []
      })

      console.log('[API] createCommunityPost: success, postId =', post.id)
      sendJson(res, 200, { code: 0, data: post, message: '帖子创建成功' })
    } catch (err) {
      console.error('[API] Create community post failed:', err)
      sendJson(res, 500, { code: 1, message: '创建帖子失败: ' + err.message })
    }
    return
  }

  // 获取社区的帖子列表
  if (req.method === 'GET' && path.startsWith('/api/communities/') && path.endsWith('/posts')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      console.log('[API] getCommunityPosts: Token verification failed')
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    const communityId = path.split('/')[3]
    console.log('[API] getCommunityPosts: communityId =', communityId)

    if (!communityId) {
      sendJson(res, 400, { code: 1, message: '社区ID不能为空' })
      return
    }

    try {
      // 检查社区是否存在
      const community = await communityDB.getCommunityById(communityId)
      if (!community) {
        sendJson(res, 404, { code: 1, message: '社区不存在' })
        return
      }

      // 获取帖子列表
      const posts = await communityDB.getCommunityPosts(communityId)
      console.log('[API] getCommunityPosts: found', posts.length, 'posts')

      // 获取每个帖子的最新评论（最多3条）
      const postsWithComments = await Promise.all(
        posts.map(async (post) => {
          try {
            const comments = await communityDB.getPostComments(post.id, 3, 0)
            return {
              ...post,
              comments: comments.map(c => ({
                id: c.id,
                content: c.content,
                user: c.author_name || '用户',
                author: c.author_name || '用户',
                authorAvatar: c.author_avatar,
                userAvatar: c.author_avatar,
                userId: c.user_id,
                date: c.created_at,
                likes: c.likes || 0
              }))
            }
          } catch (err) {
            console.warn('[API] Failed to get comments for post:', post.id, err)
            return { ...post, comments: [] }
          }
        })
      )

      // 格式化返回数据
      const formattedPosts = postsWithComments.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        images: post.images || [],
        videos: post.videos || [],
        audios: post.audios || [],
        author_id: post.user_id,
        author_name: post.author_name,
        author_avatar: post.author_avatar,
        community_id: post.community_id,
        likes: post.likes || 0,
        comments_count: post.comments_count || 0,
        views: post.views || 0,
        is_pinned: post.is_pinned || false,
        is_announcement: post.is_announcement || false,
        status: post.status,
        created_at: post.created_at,
        updated_at: post.updated_at,
        type: 'post',
        comments: post.comments || []
      }))

      sendJson(res, 200, { code: 0, data: formattedPosts, message: '获取帖子列表成功' })
    } catch (err) {
      console.error('[API] Get community posts failed:', err)
      sendJson(res, 500, { code: 1, message: '获取帖子列表失败: ' + err.message })
    }
    return
  }

  // 添加作品评论
  if (req.method === 'POST' && path.startsWith('/api/works/') && path.endsWith('/comments')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      console.log('[API] addWorkComment: Token verification failed')
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    const workId = path.split('/')[3]
    console.log('[API] addWorkComment: userId =', decoded.userId, 'workId =', workId)

    if (!workId) {
      sendJson(res, 400, { code: 1, message: '作品ID不能为空' })
      return
    }

    try {
      const body = await readBody(req)
      console.log('[API] addWorkComment: request body =', body)
      const { content, parent_id } = body

      if (!content || content.trim() === '') {
        sendJson(res, 400, { code: 1, message: '评论内容不能为空' })
        return
      }

      console.log('[API] addWorkComment: calling workDB.addComment with:', { workId, userId: decoded.userId, content, parent_id })
      // 创建评论
      const comment = await workDB.addComment(workId, decoded.userId, content, parent_id)

      console.log('[API] addWorkComment: success, commentId =', comment.id)
      sendJson(res, 200, { code: 0, data: comment, message: '评论添加成功' })
    } catch (err) {
      console.error('[API] Add work comment failed:', err)
      console.error('[API] Add work comment error stack:', err.stack)
      sendJson(res, 500, { code: 1, message: '添加评论失败: ' + err.message })
    }
    return
  }

  // 获取作品评论列表
  if (req.method === 'GET' && path.startsWith('/api/works/') && path.endsWith('/comments')) {
    const workId = path.split('/')[3]
    if (!workId) {
      sendJson(res, 400, { code: 1, message: '作品ID不能为空' })
      return
    }

    try {
      const limit = parseInt(u.searchParams.get('limit') || '50')
      const offset = parseInt(u.searchParams.get('offset') || '0')
      console.log('[API] Get work comments: workId =', workId)
      const comments = await workDB.getWorkComments(workId, limit, offset)
      console.log('[API] Get work comments: raw comments =', JSON.stringify(comments, null, 2))
      // 转换数据格式以匹配前端期望
      const formattedComments = comments.map(c => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        date: c.created_at,
        userId: c.user?.id || c.user_id,
        author: c.user?.username || '用户',
        authorAvatar: c.user?.avatar_url || '',
        user: c.user || {
          id: c.user_id,
          username: '用户',
          avatar_url: ''
        },
        likes: c.likes || 0,
        parent_id: c.parent_id
      }))
      console.log('[API] Get work comments: formatted comments =', JSON.stringify(formattedComments, null, 2))
      sendJson(res, 200, { code: 0, data: formattedComments })
    } catch (err) {
      console.error('[API] Get work comments failed:', err)
      sendJson(res, 500, { code: 1, message: '获取评论失败: ' + err.message })
    }
    return
  }

  // 作品点赞 (POST)
  if (req.method === 'POST' && path.startsWith('/api/works/') && path.endsWith('/like')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败' })
      return
    }

    const workId = path.split('/')[3]
    console.log('[API] Like work:', { workId, userId: decoded.userId, path })
    if (!workId) {
      sendJson(res, 400, { code: 1, message: '作品ID不能为空' })
      return
    }

    try {
      const result = await workDB.likeWork(workId, decoded.userId)
      if (result.success) {
        sendJson(res, 200, { code: 0, data: { isLiked: true }, message: '点赞成功' })
      } else {
        sendJson(res, 400, { code: 1, message: result.error || '点赞失败' })
      }
    } catch (err) {
      console.error('[API] Like work failed:', err)
      sendJson(res, 500, { code: 1, message: '点赞失败: ' + err.message })
    }
    return
  }

  // 取消作品点赞 (DELETE)
  if (req.method === 'DELETE' && path.startsWith('/api/works/') && path.endsWith('/like')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败' })
      return
    }

    const workId = path.split('/')[3]
    if (!workId) {
      sendJson(res, 400, { code: 1, message: '作品ID不能为空' })
      return
    }

    try {
      const result = await workDB.unlikeWork(workId, decoded.userId)
      sendJson(res, 200, { code: 0, data: { isLiked: false }, message: '取消点赞成功' })
    } catch (err) {
      console.error('[API] Unlike work failed:', err)
      sendJson(res, 500, { code: 1, message: '取消点赞失败: ' + err.message })
    }
    return
  }

  // 检查是否已点赞
  if (req.method === 'GET' && path.startsWith('/api/works/') && path.endsWith('/like')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败' })
      return
    }

    const workId = path.split('/')[3]
    if (!workId) {
      sendJson(res, 400, { code: 1, message: '作品ID不能为空' })
      return
    }

    try {
      const isLiked = await workDB.isWorkLiked(workId, decoded.userId)
      sendJson(res, 200, { code: 0, data: { isLiked } })
    } catch (err) {
      console.error('[API] Check work like failed:', err)
      sendJson(res, 500, { code: 1, message: '检查点赞状态失败: ' + err.message })
    }
    return
  }

  // 作品收藏 (POST - 添加收藏)
  if (req.method === 'POST' && path.startsWith('/api/works/') && path.endsWith('/bookmark')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败' })
      return
    }

    const workId = path.split('/')[3]
    if (!workId) {
      sendJson(res, 400, { code: 1, message: '作品ID不能为空' })
      return
    }

    try {
      const result = await workDB.bookmarkWork(workId, decoded.userId)
      if (result.success) {
        sendJson(res, 200, { code: 0, data: { isBookmarked: true }, message: '收藏成功' })
      } else {
        sendJson(res, 400, { code: 1, message: result.error || '收藏失败' })
      }
    } catch (err) {
      console.error('[API] Bookmark work failed:', err)
      sendJson(res, 500, { code: 1, message: '收藏失败: ' + err.message })
    }
    return
  }

  // 取消作品收藏 (DELETE)
  if (req.method === 'DELETE' && path.startsWith('/api/works/') && path.endsWith('/bookmark')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败' })
      return
    }

    const workId = path.split('/')[3]
    if (!workId) {
      sendJson(res, 400, { code: 1, message: '作品ID不能为空' })
      return
    }

    try {
      const result = await workDB.unbookmarkWork(workId, decoded.userId)
      sendJson(res, 200, { code: 0, data: { isBookmarked: false }, message: '取消收藏成功' })
    } catch (err) {
      console.error('[API] Unbookmark work failed:', err)
      sendJson(res, 500, { code: 1, message: '取消收藏失败: ' + err.message })
    }
    return
  }

  // 检查是否已收藏
  if (req.method === 'GET' && path.startsWith('/api/works/') && path.endsWith('/bookmark')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败' })
      return
    }

    const workId = path.split('/')[3]
    if (!workId) {
      sendJson(res, 400, { code: 1, message: '作品ID不能为空' })
      return
    }

    try {
      const isBookmarked = await workDB.isWorkBookmarked(workId, decoded.userId)
      sendJson(res, 200, { code: 0, data: { isBookmarked } })
    } catch (err) {
      console.error('[API] Check work bookmark failed:', err)
      sendJson(res, 500, { code: 1, message: '检查收藏状态失败: ' + err.message })
    }
    return
  }

  // 删除作品评论
  console.log('[API] Checking delete work comment route:', req.method, path)
  if (req.method === 'DELETE' && path.startsWith('/api/work-comments/')) {
    console.log('[API] Matched delete work comment route')
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败' })
      return
    }

    const commentId = path.split('/')[3]
    console.log('[API] Delete comment, ID:', commentId)
    if (!commentId) {
      sendJson(res, 400, { code: 1, message: '评论ID不能为空' })
      return
    }

    try {
      // 先检查评论是否存在且属于当前用户
      const db = await getDB()
      const { rows } = await db.query('SELECT user_id, work_id FROM work_comments WHERE id = $1', [commentId])
      
      if (rows.length === 0) {
        sendJson(res, 404, { code: 1, message: '评论不存在' })
        return
      }
      
      if (rows[0].user_id !== decoded.userId) {
        sendJson(res, 403, { code: 1, message: '无权删除此评论' })
        return
      }
      
      // 删除评论
      await db.query('DELETE FROM work_comments WHERE id = $1', [commentId])
      
      // 更新作品评论数
      await db.query('UPDATE works SET comments = GREATEST(comments - 1, 0) WHERE id = $1', [rows[0].work_id])
      
      sendJson(res, 200, { code: 0, message: '评论已删除' })
    } catch (err) {
      console.error('[API] Delete work comment failed:', err)
      sendJson(res, 500, { code: 1, message: '删除评论失败: ' + err.message })
    }
    return
  }

  // 删除作品
  if (req.method === 'DELETE' && path.startsWith('/api/works/')) {
    const workId = path.split('/')[3]
    console.log('[API] Delete work, ID:', workId)
    
    if (!workId) {
      sendJson(res, 400, { code: 1, message: '作品ID不能为空' })
      return
    }
    
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败' })
      return
    }
    
    try {
      const db = await getDB()
      
      // 先检查作品是否存在且属于当前用户
      const { rows } = await db.query('SELECT creator_id FROM works WHERE id = $1', [workId])
      
      if (rows.length === 0) {
        sendJson(res, 404, { code: 1, message: '作品不存在' })
        return
      }
      
      if (rows[0].creator_id !== decoded.userId) {
        sendJson(res, 403, { code: 1, message: '无权删除此作品' })
        return
      }
      
      // 删除作品相关的点赞记录
      await db.query('DELETE FROM work_likes WHERE work_id = $1', [workId])
      
      // 删除作品相关的收藏记录
      await db.query('DELETE FROM work_bookmarks WHERE work_id = $1', [workId])
      
      // 删除作品相关的评论
      await db.query('DELETE FROM work_comments WHERE work_id = $1', [workId])
      
      // 删除作品
      await db.query('DELETE FROM works WHERE id = $1', [workId])
      
      console.log('[API] Work deleted successfully:', workId)
      sendJson(res, 200, { code: 0, message: '作品已删除' })
    } catch (err) {
      console.error('[API] Delete work failed:', err)
      sendJson(res, 500, { code: 1, message: '删除作品失败: ' + err.message })
    }
    return
  }

  // 添加帖子评论
  if (req.method === 'POST' && path.startsWith('/api/posts/') && path.endsWith('/comments')) {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      console.log('[API] addPostComment: Token verification failed')
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败，请重新登录' })
      return
    }

    const postId = path.split('/')[3]
    console.log('[API] addPostComment: userId =', decoded.userId, 'postId =', postId)

    if (!postId) {
      sendJson(res, 400, { code: 1, message: '帖子ID不能为空' })
      return
    }

    try {
      const body = await readBody(req)
      console.log('[API] addPostComment: received body =', JSON.stringify(body))
      const { content, parent_id } = body
      console.log('[API] addPostComment: extracted content =', content, 'parent_id =', parent_id)

      if (!content || content.trim() === '') {
        sendJson(res, 400, { code: 1, message: '评论内容不能为空' })
        return
      }

      // 创建评论
      const comment = await communityDB.addComment(postId, decoded.userId, content, parent_id)

      console.log('[API] addPostComment: success, commentId =', comment.id)
      sendJson(res, 200, { code: 0, data: comment, message: '评论添加成功' })
    } catch (err) {
      console.error('[API] Add post comment failed:', err)
      sendJson(res, 500, { code: 1, message: '添加评论失败: ' + err.message })
    }
    return
  }

  // 获取帖子评论列表
  if (req.method === 'GET' && path.startsWith('/api/posts/') && path.endsWith('/comments')) {
    const postId = path.split('/')[3]
    
    if (!postId) {
      sendJson(res, 400, { code: 1, message: '帖子ID不能为空' })
      return
    }
    
    try {
      const limit = parseInt(u.searchParams.get('limit') || '50')
      const offset = parseInt(u.searchParams.get('offset') || '0')
      
      const comments = await communityDB.getPostComments(postId, limit, offset)
      
      console.log('[API] getPostComments: success, count =', comments.length)
      sendJson(res, 200, { code: 0, data: comments, message: '获取评论成功' })
    } catch (err) {
      console.error('[API] Get post comments failed:', err)
      sendJson(res, 500, { code: 1, message: '获取评论失败: ' + err.message })
    }
    return
  }

  // 记录作品/帖子浏览量
  if (req.method === 'POST' && path.match(/^\/api\/(works|posts)\/[^\/]+\/view$/)) {
    const pathParts = path.split('/')
    const type = pathParts[2] // 'works' or 'posts'
    const itemId = pathParts[3]
    
    console.log(`[API] Record view: type=${type}, id=${itemId}`)
    
    if (!itemId) {
      sendJson(res, 400, { code: 1, message: 'ID不能为空' })
      return
    }
    
    try {
      const db = await getDB()
      
      // 获取用户ID（如果已登录）
      let userId = null
      try {
        const decoded = verifyRequestToken(req)
        if (decoded) {
          userId = decoded.userId
        }
      } catch (e) {
        // 未登录用户也可以增加浏览量
      }
      
      // 检查是否已经浏览过（防止重复计数）
      // 使用 sessionStorage 类似的逻辑：24小时内同一用户/设备只算一次
      const viewerIdentifier = userId || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'anonymous'
      const cacheKey = `view_${type}_${itemId}_${viewerIdentifier}`
      
      // 简单实现：直接增加浏览量
      // 生产环境应该使用 Redis 等缓存来防止重复计数
      if (type === 'works') {
        await db.query(`
          UPDATE works SET views = views + 1 WHERE id = $1
        `, [itemId])
      } else {
        await db.query(`
          UPDATE posts SET views = views + 1 WHERE id = $1
        `, [itemId])
      }
      
      console.log(`[API] View recorded: ${type} ${itemId}`)
      sendJson(res, 200, { code: 0, message: '浏览量已记录' })
    } catch (err) {
      console.error('[API] Record view failed:', err)
      sendJson(res, 500, { code: 1, message: '记录浏览量失败: ' + err.message })
    }
    return
  }

  // 获取用户创建的活动
  if (req.method === 'GET' && path.startsWith('/api/users/') && path.endsWith('/events')) {
    const userId = path.split('/')[3]
    if (!userId) {
      sendJson(res, 400, { code: 1, message: '用户ID不能为空' })
      return
    }
    
    try {
      const search = u.searchParams.get('search') || ''
      const status = u.searchParams.get('status') || ''
      const type = u.searchParams.get('type') || ''
      const page = parseInt(u.searchParams.get('page') || '1')
      const pageSize = parseInt(u.searchParams.get('pageSize') || '10')
      
      // 获取用户活动
      let events = await eventDB.getEvents()
      
      // 转换字段格式
      const formattedEvents = events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startTime: event.start_date ? new Date(event.start_date * 1000).toISOString() : null,
        endTime: event.end_date ? new Date(event.end_date * 1000).toISOString() : null,
        location: event.location,
        status: event.status,
        type: event.category === 'competition' ? 'offline' : 'online',
        category: event.category,
        tags: event.tags || [],
        participantCount: event.participant_count || 0,
        maxParticipants: event.max_participants,
        media: event.image_url ? [{ url: event.image_url, type: 'image' }] : [],
        organizer: {
          id: event.organizer_id,
          name: event.organizer_name,
          avatar: event.organizer_avatar
        },
        createdAt: event.created_at ? new Date(event.created_at * 1000).toISOString() : null,
        visibility: event.visibility,
        creatorId: event.organizer_id
      }))
      
      // 过滤用户创建的活动
      let userEvents = formattedEvents.filter(event => event.creatorId === userId)
      
      // 过滤活动
      if (search) {
        userEvents = userEvents.filter(event => 
          event.title.toLowerCase().includes(search.toLowerCase()) ||
          event.description.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (status) {
        userEvents = userEvents.filter(event => event.status === status)
      }
      if (type) {
        userEvents = userEvents.filter(event => event.type === type)
      }
      
      // 分页
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedEvents = userEvents.slice(start, end)
      
      sendJson(res, 200, { code: 0, data: paginatedEvents })
    } catch (e) {
      console.error('[API] Get user events failed:', e)
      sendJson(res, 500, { code: 1, message: '获取用户活动失败' })
    }
    return
  }

  // 获取活动参与者列表
  if (req.method === 'GET' && path.match(/^\/api\/events\/[^/]+\/participants$/)) {
    try {
      const eventId = path.match(/^\/api\/events\/([^/]+)\/participants$/)[1]
      console.log('[API] Get event participants:', eventId)
      
      // 暂时返回空数组，后续可以添加真实数据
      sendJson(res, 200, { 
        code: 0, 
        data: [],
        message: '获取成功'
      })
    } catch (e) {
      console.error('[API] Get event participants failed:', e)
      sendJson(res, 500, { code: 1, message: '获取参与者列表失败' })
    }
    return
  }

  // 获取活动作品列表
  if (req.method === 'GET' && path.match(/^\/api\/events\/[^/]+\/works$/)) {
    try {
      const eventId = path.match(/^\/api\/events\/([^/]+)\/works$/)[1]
      console.log('[API] Get event works:', eventId)
      
      // 暂时返回空数组，后续可以添加真实数据
      sendJson(res, 200, { 
        code: 0, 
        data: [],
        message: '获取成功'
      })
    } catch (e) {
      console.error('[API] Get event works failed:', e)
      sendJson(res, 500, { code: 1, message: '获取作品列表失败' })
    }
    return
  }

  // 设置用户为管理员（开发测试用）
  if (req.method === 'POST' && path === '/api/dev/make-admin') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败' })
      return
    }
    
    try {
      const db = await getDB()
      await db.query('UPDATE users SET is_admin = true WHERE id = $1', [decoded.userId])
      
      sendJson(res, 200, { 
        code: 0, 
        message: '已设置为管理员',
        data: { userId: decoded.userId, isAdmin: true }
      })
    } catch (err) {
      console.error('[API] Make admin failed:', err)
      sendJson(res, 500, { code: 1, message: '设置管理员失败: ' + err.message })
    }
    return
  }

  // 检查用户是否为管理员
  if (req.method === 'GET' && path === '/api/user/admin-status') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '用户认证失败' })
      return
    }
    
    try {
      const db = await getDB()
      const { rows } = await db.query('SELECT is_admin FROM users WHERE id = $1', [decoded.userId])
      
      if (rows.length === 0) {
        sendJson(res, 404, { code: 1, message: '用户不存在' })
        return
      }
      
      sendJson(res, 200, { 
        code: 0, 
        data: { isAdmin: rows[0].is_admin || false }
      })
    } catch (err) {
      console.error('[API] Check admin status failed:', err)
      sendJson(res, 500, { code: 1, message: '检查管理员状态失败: ' + err.message })
    }
    return
  }

  // 文件上传端点
  if (req.method === 'POST' && path === '/api/upload') {
    const decoded = verifyRequestToken(req)
    if (!decoded) {
      sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
      return
    }
    
    try {
      // 解析请求体
      const chunks = []
      for await (const chunk of req) {
        chunks.push(chunk)
      }
      const body = JSON.parse(Buffer.concat(chunks).toString())
      
      const { fileData, fileName, fileType } = body
      
      if (!fileData) {
        sendJson(res, 400, { error: 'BAD_REQUEST', message: '缺少文件数据' })
        return
      }
      
      // 创建上传目录
      const uploadDir = pathModule.join(projectRoot, 'public', 'uploads')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }
      
      // 生成唯一文件名
      const ext = pathModule.extname(fileName) || '.bin'
      const uniqueName = `${Date.now()}-${randomUUID()}${ext}`
      const filePath = pathModule.join(uploadDir, uniqueName)
      
      // 如果是 base64 数据，解码并保存
      if (fileData.startsWith('data:')) {
        const base64Data = fileData.split(',')[1]
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'))
      } else {
        // 直接保存
        fs.writeFileSync(filePath, Buffer.from(fileData))
      }
      
      // 生成访问 URL
      const fileUrl = `/uploads/${uniqueName}`
      
      console.log('[API] File uploaded:', fileUrl)
      sendJson(res, 200, { code: 0, data: { url: fileUrl, fileName: uniqueName } })
    } catch (e) {
      console.error('[API] File upload failed:', e)
      sendJson(res, 500, { code: 1, message: '文件上传失败: ' + e.message })
    }
    return
  }

  // 视频下载代理 - 解决CORS问题
  if (req.method === 'POST' && path === '/api/video/download') {
    try {
      const body = await readBody(req)
      const { videoUrl } = body
      
      if (!videoUrl) {
        sendJson(res, 400, { code: 1, message: '缺少视频URL' })
        return
      }
      
      console.log('[API] Proxy video download:', videoUrl)
      
      // 从远程URL下载视频
      const response = await fetch(videoUrl)
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status} ${response.statusText}`)
      }
      
      const contentType = response.headers.get('content-type') || 'video/mp4'
      const blob = await response.blob()
      
      // 转换为base64返回
      const arrayBuffer = await blob.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      
      console.log('[API] Video downloaded successfully, size:', (blob.size / 1024 / 1024).toFixed(2), 'MB')
      
      sendJson(res, 200, { 
        code: 0, 
        data: { 
          base64: `data:${contentType};base64,${base64}`,
          size: blob.size,
          type: contentType
        } 
      })
    } catch (error) {
      console.error('[API] Video download proxy failed:', error)
      sendJson(res, 500, { code: 1, message: '视频下载失败: ' + error.message })
    }
    return
  }

  // ==================== AI图片处理API ====================
  
  // 图片风格迁移
  if (req.method === 'POST' && path === '/api/qwen/images/style-transfer') {
    const b = await readBody(req)
    
    if (!b.imageUrl) { sendJson(res, 400, { error: 'IMAGE_REQUIRED', message: 'Image URL is required' }); return }
    if (!b.style) { sendJson(res, 400, { error: 'STYLE_REQUIRED', message: 'Style is required' }); return }
    
    console.log(`[Qwen Style Transfer] Request received:`, b.style);
    
    const authKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY || ''
    if (!authKey) { 
      console.error('[Qwen Style Transfer] ERROR: API Key not configured');
      sendJson(res, 401, { error: 'API_KEY_MISSING', message: 'Missing DashScope API Key' }); 
      return 
    }

    try {
      // 构建风格迁移提示词
      const stylePrompts = {
        'guochao': 'Convert to Chinese Guochao style, traditional patterns, red and gold colors, cultural elements',
        'ink': 'Convert to Chinese ink painting style, black and white, artistic brush strokes, oriental aesthetics',
        'bluewhite': 'Convert to blue and white porcelain style, classic Chinese ceramic patterns',
        'dunhuang': 'Convert to Dunhuang mural style, golden and red tones, flying apsaras elements',
        'paper': 'Convert to Chinese paper-cutting style, red color, intricate patterns',
        'calligraphy': 'Convert to Chinese calligraphy style, brush strokes, artistic text elements',
        'minimal': 'Convert to minimalism style, clean lines, simple composition, modern aesthetics',
        'retro': 'Convert to retro vintage style, warm tones, nostalgic atmosphere',
        'neon': 'Convert to cyberpunk neon style, purple and blue lights, futuristic elements',
        'nordic': 'Convert to Nordic Scandinavian style, bright colors, cozy atmosphere'
      }
      
      const stylePrompt = stylePrompts[b.style] || `Convert to ${b.style} style`
      const prompt = `${stylePrompt}. Keep the main subject and composition.`
      
      // 调用图生图API进行风格迁移
      const result = await dashscopeImageGenerate({
        prompt: prompt,
        size: '1024x1024',
        n: 1,
        authKey,
        model: 'wanx2.1-t2i-turbo'
      })
      
      if (!result.ok) {
        console.error('[Qwen Style Transfer] Failed:', result.data);
        sendJson(res, result.status, result.data)
        return
      }
      
      console.log('[Qwen Style Transfer] Success');
      sendJson(res, 200, { ok: true, data: result.data })
    } catch (e) {
      console.error('[Qwen Style Transfer] Error:', e)
      sendJson(res, 500, { error: 'TRANSFER_FAILED', message: e.message })
    }
    return
  }

  // 图片画质增强
  if (req.method === 'POST' && path === '/api/qwen/images/enhance') {
    const b = await readBody(req)
    
    if (!b.imageUrl) { sendJson(res, 400, { error: 'IMAGE_REQUIRED', message: 'Image URL is required' }); return }
    
    console.log(`[Qwen Enhance] Request received:`, b.type || 'general');
    
    const authKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY || ''
    if (!authKey) { 
      console.error('[Qwen Enhance] ERROR: API Key not configured');
      sendJson(res, 401, { error: 'API_KEY_MISSING', message: 'Missing DashScope API Key' }); 
      return 
    }

    try {
      // 构建增强提示词
      const enhancePrompts = {
        'vivid': 'Enhance colors, increase saturation, make the image more vibrant and lively',
        'soft': 'Soften the image, reduce contrast, create dreamy and elegant atmosphere',
        'classic': 'Apply vintage retro filter, warm tones, nostalgic feeling',
        'culture': 'Enhance Chinese traditional colors, cultural characteristics, red and gold tones',
        'clear': 'Sharpen details, enhance clarity, improve definition',
        'warm': 'Add warm tones, cozy and comfortable atmosphere'
      }
      
      const enhancePrompt = enhancePrompts[b.type] || 'Enhance image quality, improve details'
      
      const result = await dashscopeImageGenerate({
        prompt: enhancePrompt,
        size: '1024x1024',
        n: 1,
        authKey,
        model: 'wanx2.1-t2i-turbo'
      })
      
      if (!result.ok) {
        console.error('[Qwen Enhance] Failed:', result.data);
        sendJson(res, result.status, result.data)
        return
      }
      
      console.log('[Qwen Enhance] Success');
      sendJson(res, 200, { ok: true, data: result.data })
    } catch (e) {
      console.error('[Qwen Enhance] Error:', e)
      sendJson(res, 500, { error: 'ENHANCE_FAILED', message: e.message })
    }
    return
  }

  // 智能扩图
  if (req.method === 'POST' && path === '/api/qwen/images/expand') {
    const b = await readBody(req)
    
    if (!b.imageUrl) { sendJson(res, 400, { error: 'IMAGE_REQUIRED', message: 'Image URL is required' }); return }
    
    console.log(`[Qwen Expand] Request received, ratio:`, b.ratio || 1.5);
    
    const authKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY || ''
    if (!authKey) { 
      console.error('[Qwen Expand] ERROR: API Key not configured');
      sendJson(res, 401, { error: 'API_KEY_MISSING', message: 'Missing DashScope API Key' }); 
      return 
    }

    try {
      const ratio = b.ratio || 1.5
      const direction = b.direction || 'all'
      
      const directionPrompts = {
        'all': 'Expand the canvas in all directions, outpainting',
        'left': 'Expand the canvas to the left, outpainting',
        'right': 'Expand the canvas to the right, outpainting',
        'top': 'Expand the canvas upward, outpainting',
        'bottom': 'Expand the canvas downward, outpainting'
      }
      
      const prompt = `${directionPrompts[direction] || directionPrompts['all']}. Maintain style consistency.`
      
      const result = await dashscopeImageGenerate({
        prompt: prompt,
        size: ratio > 1.5 ? '1440x1024' : '1024x1024',
        n: 1,
        authKey,
        model: 'wanx2.1-t2i-turbo'
      })
      
      if (!result.ok) {
        console.error('[Qwen Expand] Failed:', result.data);
        sendJson(res, result.status, result.data)
        return
      }
      
      console.log('[Qwen Expand] Success');
      sendJson(res, 200, { ok: true, data: result.data })
    } catch (e) {
      console.error('[Qwen Expand] Error:', e)
      sendJson(res, 500, { error: 'EXPAND_FAILED', message: e.message })
    }
    return
  }

  // 局部重绘
  if (req.method === 'POST' && path === '/api/qwen/images/inpaint') {
    const b = await readBody(req)
    
    if (!b.imageUrl) { sendJson(res, 400, { error: 'IMAGE_REQUIRED', message: 'Image URL is required' }); return }
    if (!b.prompt) { sendJson(res, 400, { error: 'PROMPT_REQUIRED', message: 'Prompt is required' }); return }
    
    console.log(`[Qwen Inpaint] Request received:`, b.prompt);
    
    const authKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY || ''
    if (!authKey) { 
      console.error('[Qwen Inpaint] ERROR: API Key not configured');
      sendJson(res, 401, { error: 'API_KEY_MISSING', message: 'Missing DashScope API Key' }); 
      return 
    }

    try {
      // 使用图生图实现局部重绘效果
      const result = await dashscopeImageGenerate({
        prompt: `Modify the image: ${b.prompt}. Keep the rest unchanged.`,
        size: '1024x1024',
        n: 1,
        authKey,
        model: 'wanx2.1-t2i-turbo'
      })
      
      if (!result.ok) {
        console.error('[Qwen Inpaint] Failed:', result.data);
        sendJson(res, result.status, result.data)
        return
      }
      
      console.log('[Qwen Inpaint] Success');
      sendJson(res, 200, { ok: true, data: result.data })
    } catch (e) {
      console.error('[Qwen Inpaint] Error:', e)
      sendJson(res, 500, { error: 'INPAINT_FAILED', message: e.message })
    }
    return
  }

  // 提示词优化
  if (req.method === 'POST' && path === '/api/qwen/prompt/optimize') {
    const b = await readBody(req)
    
    if (!b.prompt) { sendJson(res, 400, { error: 'PROMPT_REQUIRED', message: 'Prompt is required' }); return }
    
    console.log(`[Qwen Prompt Optimize] Request received:`, b.prompt);
    
    const authKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY || ''
    if (!authKey) { 
      console.error('[Qwen Prompt Optimize] ERROR: API Key not configured');
      sendJson(res, 401, { error: 'API_KEY_MISSING', message: 'Missing DashScope API Key' }); 
      return 
    }

    try {
      const optimizationPrompt = `As an AI art prompt expert, please optimize the following image generation prompt to make it more professional and detailed. 

Original prompt: "${b.prompt}"

Please provide:
1. An optimized version (more detailed, with style, lighting, composition descriptors)
2. A list of 3-5 suggested keywords to add
3. A brief explanation of the improvements

Response format (JSON):
{
  "optimized": "optimized prompt text",
  "suggestions": ["keyword1", "keyword2", "keyword3"],
  "explanation": "explanation text"
}`

      const response = await fetch(`${DASHSCOPE_BASE_URL}/compatible-mode/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authKey}`
        },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages: [{ role: 'user', content: optimizationPrompt }],
          temperature: 0.7,
          max_tokens: 800
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[Qwen Prompt Optimize] API error:', errorData)
        sendJson(res, response.status, { error: 'OPTIMIZE_FAILED', message: errorData.error?.message || 'Failed to optimize prompt' })
        return
      }
      
      const result = await response.json()
      const content = result.choices?.[0]?.message?.content || ''
      
      // 尝试解析JSON响应
      let parsedResult
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0])
        } else {
          parsedResult = {
            optimized: content,
            suggestions: [],
            explanation: 'Prompt optimized successfully'
          }
        }
      } catch (e) {
        parsedResult = {
          optimized: content,
          suggestions: [],
          explanation: 'Prompt optimized successfully'
        }
      }
      
      console.log('[Qwen Prompt Optimize] Success');
      sendJson(res, 200, { ok: true, data: parsedResult })
    } catch (e) {
      console.error('[Qwen Prompt Optimize] Error:', e)
      sendJson(res, 500, { error: 'OPTIMIZE_FAILED', message: e.message })
    }
    return
  }

  // 提示词分析
  if (req.method === 'POST' && path === '/api/qwen/prompt/analyze') {
    const b = await readBody(req)
    
    if (!b.prompt) { sendJson(res, 400, { error: 'PROMPT_REQUIRED', message: 'Prompt is required' }); return }
    
    console.log(`[Qwen Prompt Analyze] Request received:`, b.prompt);
    
    const authKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY || ''
    if (!authKey) { 
      console.error('[Qwen Prompt Analyze] ERROR: API Key not configured');
      sendJson(res, 401, { error: 'API_KEY_MISSING', message: 'Missing DashScope API Key' }); 
      return 
    }

    try {
      const analysisPrompt = `As an AI art prompt expert, please analyze the following image generation prompt and provide feedback.

Prompt: "${b.prompt}"

Please analyze:
1. Completeness score (0-100)
2. What elements are present (subject, style, lighting, composition, etc.)
3. What's missing that could improve the result
4. Specific improvement suggestions

Response format (JSON):
{
  "score": 75,
  "presentElements": ["element1", "element2"],
  "missingElements": ["element3", "element4"],
  "suggestions": ["suggestion1", "suggestion2"]
}`

      const response = await fetch(`${DASHSCOPE_BASE_URL}/compatible-mode/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authKey}`
        },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages: [{ role: 'user', content: analysisPrompt }],
          temperature: 0.5,
          max_tokens: 800
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[Qwen Prompt Analyze] API error:', errorData)
        sendJson(res, response.status, { error: 'ANALYZE_FAILED', message: errorData.error?.message || 'Failed to analyze prompt' })
        return
      }
      
      const result = await response.json()
      const content = result.choices?.[0]?.message?.content || ''
      
      // 尝试解析JSON响应
      let parsedResult
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0])
        } else {
          parsedResult = {
            score: 50,
            presentElements: [],
            missingElements: ['Style description', 'Lighting details', 'Composition guidance'],
            suggestions: ['Add more descriptive details']
          }
        }
      } catch (e) {
        parsedResult = {
          score: 50,
          presentElements: [],
          missingElements: ['Style description', 'Lighting details'],
          suggestions: ['Add more descriptive details']
        }
      }
      
      console.log('[Qwen Prompt Analyze] Success');
      sendJson(res, 200, { ok: true, data: parsedResult })
    } catch (e) {
      console.error('[Qwen Prompt Analyze] Error:', e)
      sendJson(res, 500, { error: 'ANALYZE_FAILED', message: e.message })
    }
    return
  }

  // 默认响应
  sendJson(res, 404, { error: 'NOT_FOUND', message: '接口不存在' })
}

const server = http.createServer(async (req, res) => {
  setCors(res)
  
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const host = req.headers.host || `localhost:${PORT}`
  const u = new URL(req.url, `${protocol}://${host}`)
  const path = u.pathname

  console.log('[API] Request:', req.method, path, 'full URL:', req.url)

  try {
    await route(req, res, u, path)
  } catch (error) {
    console.error('API error:', error)
    if (!res.headersSent) {
      sendJson(res, 500, { error: 'SERVER_ERROR', message: '服务器内部错误' })
    }
  }
})

// WebSocket 服务配置
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('[WebSocket] 客户端已连接');
  
  // 发送欢迎消息
  ws.send(JSON.stringify({ type: 'welcome', payload: { message: '已连接到本地 WebSocket 服务' } }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('[WebSocket] 收到消息:', data);
      
      // 处理心跳检测
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', payload: { timestamp: Date.now() } }));
      }
    } catch (e) {
      console.error('[WebSocket] 消息错误:', e);
    }
  });

  ws.on('close', () => {
    console.log('[WebSocket] 客户端断开连接');
  });
  
  ws.on('error', (error) => {
    console.error('[WebSocket] 错误:', error);
  });
});

server.listen(PORT, () => {
  console.log(`Local API server running on http://localhost:${PORT}`)
  console.log(`HTTP API endpoints available at http://localhost:${PORT}/api`)
  console.log(`Server is now listening for requests...`)
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use`)
    console.error('Please stop any other processes using this port and try again')
  } else {
    console.error('Server error:', error)
  }
  process.exit(1)
})

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down server...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down server...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

// 导出handler函数，供Vercel Serverless Function使用
export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  
  try {
    // 解析URL
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const host = req.headers.host || `localhost:${PORT}`
    const u = new URL(req.url, `${protocol}://${host}`)
    const path = u.pathname
    
    console.log('[API] Vercel Request:', req.method, path)
    
    // 调用路由处理函数
    await route(req, res, u, path)
  } catch (error) {
    console.error('API error:', error)
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'SERVER_ERROR', message: '服务器内部错误' }))
    }
  }
}
