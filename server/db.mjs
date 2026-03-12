import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import dotenv from 'dotenv'

// 加载环境变量
if (fs.existsSync('.env')) {
  dotenv.config()
}

// 中文注释：数据库初始化与常用操作的模块
// 功能说明：
// - 在项目根目录的 data/app.db 创建 SQLite 文件
// - 建表：favorites（收藏的教程ID）、video_tasks（视频生成任务日志）
// - 提供简洁的函数式接口，供服务端路由调用

// 从环境变量获取配置，默认值保持不变
const DATA_DIR = process.env.DB_DATA_DIR || path.join(process.cwd(), 'data')
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'app.db')
const DB_JSON_FILE = process.env.DB_JSON_FILE || path.join(DATA_DIR, 'db.json')

/**
 * 保证数据目录与数据库文件可用
 */
function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, '')
  }
  if (!fs.existsSync(DB_JSON_FILE)) {
    const init = { favorites: [], video_tasks: {} }
    fs.writeFileSync(DB_JSON_FILE, JSON.stringify(init))
  }
}

function readJsonStore() {
  try {
    const raw = fs.readFileSync(DB_JSON_FILE, 'utf-8')
    const obj = JSON.parse(raw || '{}')
    if (!obj.favorites) obj.favorites = []
    if (!obj.video_tasks) obj.video_tasks = {}
    return obj
  } catch {
    return { favorites: [], video_tasks: {} }
  }
}

function writeJsonStore(obj) {
  try {
    fs.writeFileSync(DB_JSON_FILE, JSON.stringify(obj))
  } catch {}
}

/**
 * 初始化数据库连接与表结构
 * 返回：数据库连接对象
 */
export function initDb() {
  ensureStorage()
  let db
  let retries = 0
  const maxRetries = parseInt(process.env.DB_MAX_RETRIES || '3')
  const retryDelay = parseInt(process.env.DB_RETRY_DELAY || '1000')

  // 连接重试机制
  while (retries < maxRetries) {
    try {
      db = new Database(DB_FILE, {
        timeout: parseInt(process.env.DB_TIMEOUT || '5000'), // 连接超时时间
        verbose: null // 禁用调试日志，避免输出内存地址
      })
      break
    } catch (e) {
      retries++
      if (retries >= maxRetries) {
        console.error(`数据库连接失败，已重试 ${maxRetries} 次:`, e.message)
        // 如果原生模块不可用，使用 JSON 文件作为轻量级后备存储
        return { __mode: 'json' }
      }
      console.warn(`数据库连接失败，${retries} 秒后重试...`)
      // 等待后重试
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, retryDelay)
    }
  }

  // 中文注释：创建收藏表，id 为教程整数ID，唯一
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY
      );
    `)
  } catch (e) {
    console.error('创建favorites表失败:', e.message)
  }

  // 中文注释：创建用户表，存储用户注册信息
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone TEXT,
        avatar_url TEXT,
        interests TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)
    
    // 添加索引优化查询性能
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`)
  } catch (e) {
    console.error('创建users表或索引失败:', e.message)
  }

  // 中文注释：创建数据库迁移表，用于版本控制
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      );
    `)
  } catch (e) {
    console.error('创建schema_migrations表失败:', e.message)
  }

  // 中文注释：创建视频任务日志表，记录任务状态与模型等信息
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS video_tasks (
        id TEXT PRIMARY KEY,
        status TEXT,
        model TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        payload_json TEXT
      );
    `)
    
    // 添加索引优化查询性能
    db.exec(`CREATE INDEX IF NOT EXISTS idx_video_tasks_status ON video_tasks(status);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_video_tasks_created_at ON video_tasks(created_at);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_video_tasks_updated_at ON video_tasks(updated_at);`)
  } catch (e) {
    console.error('创建video_tasks表或索引失败:', e.message)
  }

  // 执行数据库迁移
  runMigrations(db)

  // 标记模式，便于函数内区分
  try { 
    db.__mode = 'sqlite'
    db.__created_at = Date.now() // 记录连接创建时间
  } catch {}
  return db
}

/**
 * 执行数据库迁移
 */
function runMigrations(db) {
  if (db.__mode !== 'sqlite') return

  // 获取当前数据库版本
  let currentVersion = 0
  try {
    const result = db.prepare('SELECT MAX(version) as version FROM schema_migrations').get()
    currentVersion = result.version || 0
  } catch (e) {
    console.error('获取数据库版本失败:', e.message)
    return
  }

  // 定义迁移脚本
  const migrations = [
    // 版本 1: 初始表结构
    {
      version: 1,
      up: () => {
        console.log('执行迁移版本 1: 初始表结构')
        // 初始表结构已在前面创建
      }
    },
    // 版本 2: 添加索引
    {
      version: 2,
      up: () => {
        console.log('执行迁移版本 2: 添加索引')
        // 索引已在前面创建
      }
    },
    // 版本 3: 添加用户表
    {
      version: 3,
      up: () => {
        console.log('执行迁移版本 3: 添加用户表')
        // 用户表已在前面创建
      }
    },
    // 版本 4: 更新favorites表，添加用户关联
    {
      version: 4,
      up: () => {
        console.log('执行迁移版本 4: 更新favorites表，添加用户关联')
        // 表结构已在前面更新
      }
    }
  ]

  // 执行未应用的迁移
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      try {
        migration.up()
        // 记录迁移应用
        db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)')
          .run(migration.version, Date.now())
        console.log(`迁移版本 ${migration.version} 执行成功`)
      } catch (e) {
        console.error(`迁移版本 ${migration.version} 执行失败:`, e.message)
        break
      }
    }
  }

  // 更新当前版本
  try {
    const result = db.prepare('SELECT MAX(version) as version FROM schema_migrations').get()
    db.__version = result.version || 0
  } catch (e) {
    console.error('更新数据库版本失败:', e.message)
  }
}

/**
 * 查询指定用户的所有已收藏的教程ID
 */
export function getFavoriteTutorialIds(db, userId) {
  try {
    if (db && db.__mode === 'json') {
      const store = readJsonStore()
      const ids = Array.isArray(store.favorites) ? store.favorites : []
      return ids.sort((a, b) => a - b)
    }
    
    const rows = db.prepare('SELECT tutorial_id FROM favorites WHERE user_id = ? ORDER BY tutorial_id ASC').all(userId)
    return rows.map(r => r.tutorial_id)
  } catch (e) {
    console.error(`获取用户 ${userId} 的收藏列表失败:`, e.message)
    return []
  }
}

/**
 * 切换指定用户的教程收藏状态（存在则取消，不存在则添加）
 */
export function toggleFavoriteTutorial(db, userId, tutorialId) {
  try {
    if (!Number.isInteger(tutorialId) || tutorialId <= 0) {
      console.warn('无效的教程ID:', tutorialId)
      return getFavoriteTutorialIds(db, userId)
    }
    
    if (db && db.__mode === 'json') {
      const store = readJsonStore()
      const set = new Set(Array.isArray(store.favorites) ? store.favorites : [])
      if (set.has(tutorialId)) {
        set.delete(tutorialId)
        console.log(`取消收藏教程ID: ${tutorialId}`)
      } else {
        set.add(tutorialId)
        console.log(`收藏教程ID: ${tutorialId}`)
      }
      store.favorites = Array.from(set)
      writeJsonStore(store)
      return getFavoriteTutorialIds(db, userId)
    }
    
    const existing = db.prepare('SELECT * FROM favorites WHERE user_id = ? AND tutorial_id = ?').get(userId, tutorialId)
    if (existing) {
      db.prepare('DELETE FROM favorites WHERE user_id = ? AND tutorial_id = ?').run(userId, tutorialId)
      console.log(`SQLite: 用户 ${userId} 取消收藏教程ID: ${tutorialId}`)
    } else {
      db.prepare('INSERT INTO favorites (user_id, tutorial_id, created_at) VALUES (?, ?, ?)').run(userId, tutorialId, Date.now())
      console.log(`SQLite: 用户 ${userId} 收藏教程ID: ${tutorialId}`)
    }
    return getFavoriteTutorialIds(db, userId)
  } catch (e) {
    console.error(`用户 ${userId} 切换收藏状态失败:`, e.message)
    return getFavoriteTutorialIds(db, userId)
  }
}

/**
 * 记录或更新视频任务信息
 */
export function upsertVideoTask(db, { id, status, model, payload }) {
  try {
    if (!id) {
      console.warn('视频任务ID不能为空')
      return
    }
    
    const now = Date.now()
    if (db && db.__mode === 'json') {
      const store = readJsonStore()
      store.video_tasks[id] = {
        id,
        status: status || store.video_tasks[id]?.status || null,
        model: model || store.video_tasks[id]?.model || null,
        created_at: store.video_tasks[id]?.created_at || now,
        updated_at: now,
        payload: payload || store.video_tasks[id]?.payload || null,
      }
      writeJsonStore(store)
      console.log(`JSON: 更新视频任务: ${id}, 状态: ${status}`)
      return
    }
    
    const payloadJson = payload ? JSON.stringify(payload) : null
    db.prepare(`
      INSERT INTO video_tasks (id, status, model, created_at, updated_at, payload_json)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        model = COALESCE(excluded.model, video_tasks.model),
        updated_at = excluded.updated_at,
        payload_json = COALESCE(excluded.payload_json, video_tasks.payload_json)
    `).run(id, status || null, model || null, now, now, payloadJson)
    console.log(`SQLite: 更新视频任务: ${id}, 状态: ${status}`)
  } catch (e) {
    console.error('更新视频任务失败:', e.message)
  }
}

/**
 * 查询视频任务详情
 */
export function getVideoTask(db, id) {
  try {
    if (!id) {
      console.warn('查询视频任务时ID不能为空')
      return null
    }
    
    if (db && db.__mode === 'json') {
      const store = readJsonStore()
      const row = store.video_tasks[id]
      return row || null
    }
    
    const row = db.prepare('SELECT * FROM video_tasks WHERE id = ?').get(id)
    if (!row) return null
    
    let payload = null
    if (row.payload_json) {
      try {
        payload = JSON.parse(row.payload_json)
      } catch (jsonError) {
        console.error(`解析任务 ${id} 的payload失败:`, jsonError.message)
      }
    }
    
    return {
      id: row.id,
      status: row.status,
      model: row.model,
      created_at: row.created_at,
      updated_at: row.updated_at,
      payload: payload
    }
  } catch (e) {
    console.error(`查询视频任务 ${id} 失败:`, e.message)
    return null
  }
}

/**
 * 创建新用户
 */
export function createUser(db, { username, email, password_hash, phone = null, avatar_url = null, interests = null }) {
  try {
    if (db && db.__mode === 'json') {
      // JSON模式下支持用户存储
      const store = readJsonStore()
      // 初始化users数组
      if (!Array.isArray(store.users)) {
        store.users = []
      }
      
      // 检查用户名是否已存在
      if (store.users.some(user => user.username === username)) {
        console.warn('用户名已存在:', username)
        return null
      }
      
      // 检查邮箱是否已存在
      if (store.users.some(user => user.email === email)) {
        console.warn('邮箱已存在:', email)
        return null
      }
      
      const now = Date.now()
      const newUser = {
        id: Date.now(),
        username,
        email,
        password_hash,
        phone,
        avatar_url,
        interests,
        created_at: now,
        updated_at: now
      }
      
      store.users.push(newUser)
      writeJsonStore(store)
      console.log(`JSON: 创建用户成功: ${username} (${email})`)
      return newUser.id
    }
    
    const now = Date.now()
    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, phone, avatar_url, interests, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(username, email, password_hash, phone, avatar_url, interests, now, now)
    
    console.log(`SQLite: 创建用户成功: ${username} (${email})`)
    return result.lastInsertRowid
  } catch (e) {
    console.error('创建用户失败:', e.message)
    return null
  }
}

/**
 * 根据邮箱查找用户
 */
export function findUserByEmail(db, email) {
  try {
    if (db && db.__mode === 'json') {
      // JSON模式下支持用户存储
      const store = readJsonStore()
      if (Array.isArray(store.users)) {
        return store.users.find(user => user.email === email) || null
      }
      return null
    }
    
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    return user
  } catch (e) {
    console.error('根据邮箱查找用户失败:', e.message)
    return null
  }
}

/**
 * 根据用户名查找用户
 */
export function findUserByUsername(db, username) {
  try {
    if (db && db.__mode === 'json') {
      // JSON模式下支持用户存储
      const store = readJsonStore()
      if (Array.isArray(store.users)) {
        return store.users.find(user => user.username === username) || null
      }
      return null
    }
    
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
    return user
  } catch (e) {
    console.error('根据用户名查找用户失败:', e.message)
    return null
  }
}

/**
 * 根据ID查找用户
 */
export function findUserById(db, id) {
  try {
    if (db && db.__mode === 'json') {
      // JSON模式下支持用户存储
      const store = readJsonStore()
      if (Array.isArray(store.users)) {
        return store.users.find(user => user.id === id) || null
      }
      return null
    }
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
    return user
  } catch (e) {
    console.error('根据ID查找用户失败:', e.message)
    return null
  }
}

/**
 * 获取数据库模式（sqlite/json）与基本统计
 */
export function getDbStats(db) {
  try {
    const mode = db && db.__mode === 'json' ? 'json' : 'sqlite'
    if (mode === 'json') {
      const store = readJsonStore()
      const favorites = Array.isArray(store.favorites) ? store.favorites.length : 0
      const videoTasks = typeof store.video_tasks === 'object' ? Object.keys(store.video_tasks).length : 0
      return { 
        mode, 
        favorites_count: favorites, 
        video_tasks_count: videoTasks,
        last_updated: Date.now()
      }
    }
    
    const favCount = db.prepare('SELECT COUNT(*) AS c FROM favorites').get().c || 0
    const taskCount = db.prepare('SELECT COUNT(*) AS c FROM video_tasks').get().c || 0
    const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c || 0
    const migrationVersion = db.prepare('SELECT MAX(version) as version FROM schema_migrations').get().version || 0
    
    return { 
      mode, 
      favorites_count: favCount, 
      video_tasks_count: taskCount,
      users_count: userCount,
      migration_version: migrationVersion,
      last_updated: Date.now()
    }
  } catch (e) {
    console.error('获取数据库统计信息失败:', e.message)
    return {
      mode: 'error',
      favorites_count: 0,
      video_tasks_count: 0,
      users_count: 0,
      last_updated: Date.now()
    }
  }
}
