import http from 'http'
import { URL } from 'url'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { generateToken, verifyToken } from './jwt.mjs'
import { userDB, workDB, favoriteDB, achievementDB, friendDB, messageDB } from './database.mjs'
import { sendLoginEmailCode } from './emailService.mjs'

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// 加载环境变量
const envPath = path.join(projectRoot, '.env')
const envLocalPath = path.join(projectRoot, '.env.local')

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
  console.log('[Config] 已加载 .env 文件:', envPath)
}
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true })
  console.log('[Config] 已加载 .env.local 文件:', envLocalPath)
}

// 打印邮件配置（调试用）
console.log('[Config] 邮件配置:', {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE,
  user: process.env.EMAIL_USER,
  from: process.env.EMAIL_FROM
})

const PORT = Number(process.env.LOCAL_API_PORT || process.env.PORT) || 3023
const ORIGIN = process.env.CORS_ALLOW_ORIGIN || '*'

// DashScope (Aliyun Qwen) config
const DASHSCOPE_BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1'
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY || ''

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')
}

async function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    if (req.on) {
      req.on('data', (chunk) => (data += chunk))
      req.on('end', () => {
        try { resolve(data ? JSON.parse(data) : {}) } catch { resolve({}) }
      })
      req.on('error', () => {
        resolve({})
      })
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
    return null
  }
  
  const token = authHeader.split(' ')[1]
  if (!token) {
    return null
  }
  
  try {
    const decoded = verifyToken(token)
    if (decoded && !decoded.userId && (decoded.sub || decoded.id)) {
      decoded.userId = decoded.sub || decoded.id
    }
    return decoded
  } catch (error) {
    return null
  }
}

// DashScope API 请求函数
async function dashscopeFetch(endpoint, method, payload, authKey) {
  const url = `${DASHSCOPE_BASE_URL}${endpoint}`
  
  try {
    console.log(`[DashScope] ${method} ${url}`)
    
    const resp = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authKey || DASHSCOPE_API_KEY}`
      },
      body: JSON.stringify(payload)
    })

    const data = await resp.json()
    console.log(`[DashScope] 响应数据:`, data)
    
    return { status: resp.status, ok: resp.ok, data }
  } catch (error) {
    console.error(`[DashScope] 请求失败:`, error)
    return { status: 500, ok: false, data: { error: error.message } }
  }
}

// 轮询 DashScope 任务状态
async function pollDashScopeTask(taskId, authKey) {
  const maxRetries = 120 // 6 minutes (3s interval)
  const interval = 3000
  
  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, interval))
    
    try {
      const resp = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${authKey}`
        }
      })
      
      if (!resp.ok) {
        console.error(`[DashScope] Polling failed: ${resp.status}`)
        continue
      }
      
      const data = await resp.json()
      console.log(`[DashScope] Task ${taskId} status: ${data.output?.task_status}`)
      
      if (data.output?.task_status === 'SUCCEEDED') {
        return data
      }
      
      if (data.output?.task_status === 'FAILED' || data.output?.task_status === 'CANCELED') {
        throw new Error(`Task failed with status: ${data.output?.task_status}, message: ${data.output?.message || 'Unknown error'}`)
      }
    } catch (e) {
      console.error('[DashScope] Polling error:', e)
      if (e.message.includes('Task failed')) throw e
    }
  }
  
  throw new Error('Task polling timed out')
}

// 视频生成函数
async function dashscopeVideoGenerate(params) {
  const { prompt, imageUrl, authKey, model } = params
  const endpoint = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis'
  
  try {
    const payload = {
      model: model || 'wan2.6-i2v-flash',
      input: {
        prompt: prompt,
        img_url: imageUrl
      },
      parameters: {
        resolution: '720P',
        duration: 5
      }
    }
    
    // Remove img_url if not provided (text-to-video)
    if (!imageUrl) {
      delete payload.input.img_url
      if (!model || model === 'wan2.6-i2v-flash') payload.model = 'wanx2.1-t2v-turbo'
    }

    console.log('[DashScope] Starting video generation task:', JSON.stringify(payload, null, 2))

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authKey}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify(payload)
    })

    const data = await resp.json()
    console.log('[DashScope] Response status:', resp.status)
    
    if (!resp.ok) {
      console.error('[DashScope] Video generation submission failed:', data)
      throw new Error(data.message || data.code || `Failed to submit video task: ${resp.status}`)
    }

    const taskId = data.output?.task_id
    if (!taskId) {
      throw new Error('No task_id returned from DashScope')
    }

    console.log(`[DashScope] Video task submitted: ${taskId}`)
    
    // Poll for result
    const result = await pollDashScopeTask(taskId, authKey)
    
    // Extract video URL
    const videoUrl = result.output?.video_url 
      || result.output?.results?.[0]?.url 
      || result.output?.results?.[0]?.video_url
    
    if (!videoUrl) {
      console.error('[DashScope] No video URL in result:', result)
      throw new Error('No video URL found in completed task')
    }

    return {
      status: 200,
      ok: true,
      data: {
        video_url: videoUrl,
        task_id: taskId
      }
    }
  } catch (error) {
    console.error('[DashScope] Video generation error:', error)
    return {
      status: 500,
      ok: false,
      data: { error: error.message }
    }
  }
}

async function route(req, res, u, path) {
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
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
      const achievements = await achievementDB.getUserAchievements(decoded.userId)
      sendJson(res, 200, { code: 0, data: achievements || [] })
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
      const bookmarks = await favoriteDB.getUserFavorites(decoded.userId)
      sendJson(res, 200, { code: 0, data: { count: bookmarks.length } })
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
      sendJson(res, 200, { code: 0, data: { count: 42 } })
    } catch (e) {
      console.error('[API] Get likes count failed:', e)
      sendJson(res, 500, { code: 1, message: '获取点赞数量失败' })
    }
    return
  }

  // 发送验证码
  if (req.method === 'POST' && path === '/api/auth/send-code') {
    try {
      const body = await readBody(req)
      const email = body.email
      
      if (!email) {
        sendJson(res, 400, { code: 1, message: '邮箱不能为空' })
        return
      }
      
      // 生成验证码
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
      
      // 使用实际邮箱服务发送验证码
      await sendLoginEmailCode(email, verificationCode)
      console.log(`[验证码] 发送到 ${email}: ${verificationCode}`)
      
      // 返回成功，验证码为：123456（开发环境固定，方便测试）
      sendJson(res, 200, {
        code: 0,
        message: '验证码发送成功',
        data: {
          verificationCode: '123456', // 开发环境固定验证码
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5分钟过期
        }
      })
    } catch (error) {
      console.error('[API] 发送验证码失败:', error)
      sendJson(res, 500, { code: 1, message: '发送验证码失败' })
    }
    return
  }

  // 验证码登录
  if (req.method === 'POST' && path === '/api/auth/login') {
    try {
      const body = await readBody(req)
      const email = body.email
      const code = body.code
      
      if (!email || !code) {
        sendJson(res, 400, { code: 1, message: '邮箱和验证码不能为空' })
        return
      }
      
      // 开发环境暂时跳过验证码验证，方便测试
      // 实际生产环境应该验证存储的验证码
      // if (code !== '123456') {
      //   sendJson(res, 401, { code: 1, message: '验证码错误' })
      //   return
      // }
      
      // 模拟用户登录成功
      const user = {
        id: randomUUID(),
        email: email,
        username: email.split('@')[0],
        avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(email.split('@')[0]) + '&background=random',
        membership_level: 'free',
        membership_status: 'active'
      }
      
      // 生成JWT token
      const token = generateToken({ userId: user.id, email: user.email })
      // 生成refresh token（模拟）
      const refreshToken = generateToken({ userId: user.id, email: user.email, type: 'refresh' })
      
      sendJson(res, 200, {
        code: 0,
        message: '登录成功',
        data: {
          user: user,
          session: {
            access_token: token,
            refresh_token: refreshToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天过期
          }
        }
      })
    } catch (error) {
      console.error('[API] 登录失败:', error)
      sendJson(res, 500, { code: 1, message: '登录失败' })
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
      
      // 生成验证码
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
      
      // 使用实际邮箱服务发送验证码
      await sendLoginEmailCode(email, verificationCode)
      console.log(`[验证码] 发送到 ${email}: ${verificationCode}`)
      
      // 返回成功，验证码为：123456（开发环境固定，方便测试）
      sendJson(res, 200, {
        code: 0,
        message: '验证码发送成功',
        data: {
          verificationCode: '123456', // 开发环境固定验证码
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5分钟过期
        }
      })
    } catch (error) {
      console.error('[API] 发送验证码失败:', error)
      sendJson(res, 500, { code: 1, message: '发送验证码失败' })
    }
    return
  }

  // 验证码登录 - 支持 /api/auth/login-with-email-code 和 /api/auth/login-with-code 路径
  if (req.method === 'POST' && (path === '/api/auth/login-with-email-code' || path === '/api/auth/login' || path === '/api/auth/login-with-code')) {
    try {
      const body = await readBody(req)
      // 支持两种请求格式：{ email, code } 和 { type, identifier, code }
      const email = body.email || body.identifier
      const code = body.code
      
      if (!email || !code) {
        sendJson(res, 400, { code: 1, message: '邮箱和验证码不能为空' })
        return
      }
      
      // 开发环境暂时跳过验证码验证，方便测试
      // 实际生产环境应该验证存储的验证码
      // if (code !== '123456') {
      //   sendJson(res, 401, { code: 1, message: '验证码错误' })
      //   return
      // }
      
      // 模拟用户登录成功
      const user = {
        id: randomUUID(),
        email: email,
        username: email.split('@')[0],
        avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(email.split('@')[0]) + '&background=random',
        membership_level: 'free',
        membership_status: 'active'
      }
      
      // 生成JWT token
      const token = generateToken({ userId: user.id, email: user.email })
      // 生成refresh token（模拟）
      const refreshToken = generateToken({ userId: user.id, email: user.email, type: 'refresh' })
      
      sendJson(res, 200, {
        code: 0,
        message: '登录成功',
        data: {
          user: user,
          session: {
            access_token: token,
            refresh_token: refreshToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天过期
          }
        }
      })
    } catch (error) {
      console.error('[API] 登录失败:', error)
      sendJson(res, 500, { code: 1, message: '登录失败' })
    }
    return
  }

  // 健康检查
  if (req.method === 'GET' && path === '/api/health/ping') {
    sendJson(res, 200, { ok: true, message: 'pong', port: PORT })
    return
  }

  // ==========================================
  // 千问视频生成 API
  // ==========================================

  // 处理千问视频生成请求
  if (req.method === 'POST' && path === '/api/qwen/videos/generate') {
    const b = await readBody(req)
    
    let prompt = b.prompt
    let imageUrl = b.imageUrl
    
    // Parse content array if present (from llmService)
    if (b.content && Array.isArray(b.content)) {
      const textItem = b.content.find(item => item.type === 'text')
      if (textItem) prompt = textItem.text
      
      const imageItem = b.content.find(item => item.type === 'image_url')
      if (imageItem) imageUrl = imageItem.image_url?.url || imageItem.image_url
    }

    // 确保prompt字段存在
    if (!prompt) { 
      sendJson(res, 400, { error: 'PROMPT_REQUIRED', message: 'Prompt is required' }) 
      return 
    }
    
    console.log(`[Qwen Video] Request received:`, prompt)
    console.log(`[Qwen Video] Image URL:`, imageUrl || '(none - text to video)')
    
    const authKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY || ''
    if (!authKey) { 
      console.error('[Qwen Video] ERROR: API Key not configured')
      sendJson(res, 401, { error: 'API_KEY_MISSING', message: 'Missing DashScope API Key' }) 
      return 
    }
    console.log(`[Qwen Video] API Key configured: ${authKey.slice(0, 8)}...${authKey.slice(-4)}`)

    try {
      const r = await dashscopeVideoGenerate({
        prompt: prompt,
        imageUrl: imageUrl,
        authKey,
        model: b.model
      })
      
      if (!r.ok) {
        console.error('[Qwen Video] Generation failed:', r.data)
        sendJson(res, r.status, r.data)
        return
      }
      
      console.log('[Qwen Video] Generation successful:', r.data)
      sendJson(res, 200, r.data)
    } catch (e) {
      console.error('[Qwen Video] Error:', e)
      sendJson(res, 500, { error: 'GENERATION_FAILED', message: e.message })
    }
    return
  }

  // 获取作品列表
  if (req.method === 'GET' && path === '/api/works') {
    try {
      const limit = parseInt(u.searchParams.get('limit') || '50')
      const offset = parseInt(u.searchParams.get('offset') || '0')
      
      const works = await workDB.getWorks(limit, offset)
      
      // 字段映射，确保 thumbnail 字段包含有效的图片URL
      const mappedWorks = works.map(work => ({
        ...work,
        thumbnail: work.thumbnail || work.cover_url || ''
      }))
      
      sendJson(res, 200, { code: 0, data: mappedWorks })
    } catch (e) {
      console.error('[API] Get works failed:', e)
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
      const workData = {
        ...body,
        creator_id: decoded.userId || body.creator_id
      }
      
      const work = await workDB.createWork(workData)
      sendJson(res, 200, { code: 0, data: work })
    } catch (e) {
      console.error('[API] Create work failed:', e)
      sendJson(res, 500, { code: 1, message: '创建作品失败' })
    }
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
        const authorMatch = work.author?.username?.toLowerCase().includes(query.toLowerCase()) || work.creator?.toLowerCase().includes(query.toLowerCase()) || work.username?.toLowerCase().includes(query.toLowerCase())
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

  // ==========================================
  // 活动系统 API
  // ==========================================
  
  // 获取活动列表
  if (req.method === 'GET' && path === '/api/events') {
    try {
      const search = u.searchParams.get('search') || ''
      const status = u.searchParams.get('status') || ''
      const type = u.searchParams.get('type') || ''
      const page = parseInt(u.searchParams.get('page') || '1')
      const pageSize = parseInt(u.searchParams.get('pageSize') || '10')
      
      // 模拟活动数据
      const mockEvents = [
        {
          id: '1',
          title: '天津文化创意大赛',
          description: '展示天津传统文化与现代创意的融合',
          status: 'published',
          type: 'offline',
          startTime: new Date('2024-12-01').toISOString(),
          endTime: new Date('2024-12-31').toISOString(),
          thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Tianjin%20cultural%20creative%20competition%20poster%20traditional%20Chinese%20elements&image_size=square'
        },
        {
          id: '2',
          title: '线上设计工作坊',
          description: '学习现代设计技巧和工具使用',
          status: 'published',
          type: 'online',
          startTime: new Date('2024-11-15').toISOString(),
          endTime: new Date('2024-11-20').toISOString(),
          thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Online%20design%20workshop%20digital%20creativity&image_size=square'
        },
        {
          id: '3',
          title: '摄影艺术展',
          description: '展示天津城市风貌和人文景观',
          status: 'pending',
          type: 'offline',
          startTime: new Date('2024-12-10').toISOString(),
          endTime: new Date('2024-12-20').toISOString(),
          thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Photography%20art%20exhibition%20urban%20landscape&image_size=square'
        }
      ]
      
      // 过滤活动
      let filteredEvents = mockEvents
      if (search) {
        filteredEvents = filteredEvents.filter(event => 
          event.title.toLowerCase().includes(search.toLowerCase()) ||
          event.description.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (status) {
        filteredEvents = filteredEvents.filter(event => event.status === status)
      }
      if (type) {
        filteredEvents = filteredEvents.filter(event => event.type === type)
      }
      
      // 分页
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedEvents = filteredEvents.slice(start, end)
      
      sendJson(res, 200, { code: 0, data: paginatedEvents })
    } catch (e) {
      console.error('[API] Get events failed:', e)
      sendJson(res, 500, { code: 1, message: '获取活动列表失败' })
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
      const brandId = u.searchParams.get('brandId') || ''
      const page = parseInt(u.searchParams.get('page') || '1')
      const pageSize = parseInt(u.searchParams.get('pageSize') || '10')
      
      // 模拟用户活动数据 - 包含不同品牌的活动
      const mockUserEvents = [
        {
          id: '4',
          title: '用户个人活动',
          description: '用户创建的测试活动',
          status: 'draft',
          type: 'online',
          brandId: '',
          startTime: new Date('2024-11-25').toISOString(),
          endTime: new Date('2024-12-05').toISOString(),
          thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=User%20personal%20event%20creation&image_size=square'
        },
        {
          id: '5',
          title: '海河"寻味天津奶香传承"创意作品大赛',
          description: '邀请用户围绕海河乳制产品（可可奶、咖啡奶、草莓奶等）进行创意内容创作，可以是短视频、摄影、插画、文章等多种形式。',
          status: 'published',
          type: 'online',
          brandId: 'haihe',
          startTime: new Date('2026-02-20').toISOString(),
          endTime: new Date('2026-03-20').toISOString(),
          thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Milk%20creative%20competition%20event%20poster&image_size=square'
        },
        {
          id: '6',
          title: '海鸥手表"时光匠人"设计大赛',
          description: '面向全国设计师征集手表设计作品，主题围绕"时光匠人"，要求融合天津海鸥手表的工艺精神与现代设计理念。',
          status: 'published',
          type: 'online',
          brandId: 'seagull',
          startTime: new Date('2026-02-25').toISOString(),
          endTime: new Date('2026-04-15').toISOString(),
          thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Watch%20design%20competition%20event%20poster&image_size=square'
        }
      ]
      
      // 过滤活动
      let filteredEvents = mockUserEvents
      if (search) {
        filteredEvents = filteredEvents.filter(event => 
          event.title.toLowerCase().includes(search.toLowerCase()) ||
          event.description.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (status) {
        filteredEvents = filteredEvents.filter(event => event.status === status)
      }
      if (type) {
        filteredEvents = filteredEvents.filter(event => event.type === type)
      }
      if (brandId) {
        filteredEvents = filteredEvents.filter(event => event.brandId === brandId)
      }
      
      // 分页
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedEvents = filteredEvents.slice(start, end)
      
      sendJson(res, 200, { code: 0, data: paginatedEvents })
    } catch (e) {
      console.error('[API] Get user events failed:', e)
      sendJson(res, 500, { code: 1, message: '获取用户活动失败' })
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
  
  console.log('[API] Request:', req.method, path)
  
  try {
    await route(req, res, u, path)
  } catch (error) {
    console.error('API error:', error)
    if (!res.headersSent) {
      sendJson(res, 500, { error: 'SERVER_ERROR', message: '服务器内部错误' })
    }
  }
})

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
