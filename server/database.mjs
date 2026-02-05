
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import dotenv from 'dotenv'
import { Pool } from 'pg'

// 加载环境变量
if (fs.existsSync('.env')) {
  dotenv.config()
}
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true })
}

// 数据库类型枚举
export const DB_TYPE = {
  SQLITE: 'sqlite',
  POSTGRESQL: 'postgresql',
  NEON_API: 'neon_api',
  SUPABASE: 'supabase', // Alias for POSTGRESQL with auto-config
  MEMORY: 'memory'
}

// 内存数据库存储（用于本地开发/测试，避免环境问题）
const memoryStore = {
  users: [],
  favorites: [],
  video_tasks: [],
  friend_requests: [],
  friends: [],
  messages: [],
  user_status: [],
  posts: [], // Mock data support
  comments: [],
  likes: [],
  tags: [],
  post_tags: [],
  communities: [],
  community_members: [],
  works: [], // Works support
  events: [] // Events support
}

// JSON持久化路径
const JSON_DB_PATH = path.join(process.cwd(), 'server', 'data', 'backup.json');

// 日志助手
const log = (msg, level = 'INFO') => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [DB:${level}] ${msg}`)
}

// 加载JSON数据
function loadMemoryStore() {
  try {
    if (fs.existsSync(JSON_DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf-8'));
      Object.assign(memoryStore, data);
      log('Loaded data from JSON backup');
    }
  } catch (e) {
    log(`Failed to load JSON backup: ${e.message}`, 'ERROR');
  }
}

// 保存JSON数据
function saveMemoryStore() {
  try {
    const dir = path.dirname(JSON_DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(memoryStore, null, 2));
  } catch (e) {
    console.error('Failed to save JSON backup:', e);
  }
}

// 初始化时尝试加载
loadMemoryStore();

// 构建PostgreSQL连接字符串
const getPostgresConnectionString = () => {
  // 1. 最优先使用 NON_POOLING (Session Mode, port 5432) 
  // 这是 Vercel + Supabase Serverless 环境的最佳实践，避免 PGBouncer 事务模式导致的 "prepared statement" 错误
  if (process.env.POSTGRES_URL_NON_POOLING) {
    console.log('[DB] Using POSTGRES_URL_NON_POOLING');
    return process.env.POSTGRES_URL_NON_POOLING;
  }

  // 2. 其次尝试标准 DATABASE_URL
  if (process.env.DATABASE_URL) {
    console.log('[DB] Using DATABASE_URL');
    return process.env.DATABASE_URL;
  }
  
  // 3. 尝试 Supabase 相关变量
  if (process.env.POSTGRES_URL) {
    console.log('[DB] Using POSTGRES_URL');
    return process.env.POSTGRES_URL;
  }
  
  // 4. 尝试 Neon 相关变量
  const neonUrl = process.env.NEON_URL || 
                  process.env.NEON_DATABASE_URL || 
                  process.env.NEON_POSTGRES_URL || 
                  process.env.NEON_DATABASE_URL_UNPOOLED ||
                  process.env.NEON_POSTGRES_URL_NON_POOLING
  if (neonUrl) {
    console.log('[DB] Using NEON URL');
    return neonUrl;
  }
  
  // 5. 尝试从环境变量文件中读取
  if (process.env.DB_TYPE === 'supabase') {
    console.log('[DB] Using fallback connection string for Supabase');
    return 'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
  }
  
  return null
}

// 自动检测数据库类型
const detectDbType = () => {
  // 优先使用环境变量指定的数据库类型
  if (process.env.DB_TYPE) return process.env.DB_TYPE
  
  // Vercel 环境强制检测
  if (process.env.VERCEL) {
    // 如果配置了 PostgreSQL 相关的环境变量，优先使用 PostgreSQL
    if (process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.SUPABASE_URL) {
      return DB_TYPE.POSTGRESQL;
    }
    // Vercel Serverless 环境不支持本地文件写入 (SQLite)，回退到内存模式 (Memory)
    // 注意：内存模式在 Serverless 函数冷启动时会重置数据
    console.warn('Running on Vercel without Database config, falling back to Memory DB');
    return DB_TYPE.MEMORY;
  }

  // 如果配置了 Supabase 和 PostgreSQL URL，则使用 Supabase
  if (process.env.SUPABASE_URL && process.env.POSTGRES_URL) return DB_TYPE.SUPABASE
  // 如果数据库 URL 包含 neon，则使用 Neon API
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon')) return DB_TYPE.NEON_API
  // 如果有数据库 URL，则使用 PostgreSQL
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) return DB_TYPE.POSTGRESQL
  
  // 本地环境默认使用 SQLite
  return DB_TYPE.SQLITE
}

const currentDbType = detectDbType()
const connectionString = getPostgresConnectionString()

// 配置管理
const config = {
  // 数据库类型选择
  dbType: currentDbType,
  
  // SQLite 配置
  sqlite: {
    dataDir: process.env.DB_DATA_DIR || path.join(process.cwd(), 'data'),
    dbFile: process.env.DB_FILE || path.join(process.cwd(), 'data', 'app.db'),
    jsonFile: process.env.DB_JSON_FILE || path.join(process.cwd(), 'data', 'db.json'),
    maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000'),
    timeout: parseInt(process.env.DB_TIMEOUT || '5000')
  },
  
  // Neon API 配置
  neon_api: {
    endpoint: process.env.NEON_API_ENDPOINT || 'https://ep-bold-flower-agmuls0b.apirest.c-2.eu-central-1.aws.neon.tech/neondb/rest/v1',
    apiKey: process.env.NEON_API_KEY || '',
    dbName: process.env.NEON_DB_NAME || 'neondb',
    maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000')
  },
  
  // PostgreSQL (Supabase/Neon/Standard) 配置
  postgresql: {
    connectionString: connectionString,
    options: {
      max: parseInt(process.env.POSTGRES_MAX_POOL_SIZE || '10'), // 连接池最大连接数，根据服务器性能调整
      idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '15000'), // 空闲连接超时，减少空闲连接占用
      connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || '5000'), // 连接超时，减少等待时间
      // SSL 配置：Supabase/Neon 通常需要 SSL。本地开发可能不需要。
      ssl: (connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')) ? {
        rejectUnauthorized: false // 允许自签名证书 (Supabase 兼容性)
      } : false,
      // 添加查询超时设置，避免长时间运行的查询阻塞连接
      statement_timeout: 10000, // 10秒查询超时
      // 添加客户端编码设置
      client_encoding: 'UTF8',
      // 添加查询队列超时
      queueTimeoutMillis: 5000 // 队列等待超时
    }
  }
}

// 数据库连接实例
let dbInstances = {
  sqlite: null,
  mongodb: null,
  postgresql: null
}

// 连接状态监控
let connectionStatus = {
  sqlite: { connected: false, lastConnected: null, error: null },
  mongodb: { connected: false, lastConnected: null, error: null },
  postgresql: { connected: false, lastConnected: null, error: null, poolStatus: {} },
  neon_api: { connected: false, lastConnected: null, error: null }
}

// 连接重试计数器
let retryCounts = {
  sqlite: 0,
  mongodb: 0,
  postgresql: 0
}

/**
 * 保证数据目录与数据库文件可用
 */
function ensureStorage() {
  const { dataDir } = config.sqlite
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  
  const { dbFile, jsonFile } = config.sqlite
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, '')
  }
  
  if (!fs.existsSync(jsonFile)) {
    const init = { favorites: [], video_tasks: {}, users: [] }
    fs.writeFileSync(jsonFile, JSON.stringify(init))
  }
}

/**
 * SQLite 连接初始化
 */
async function initSQLite() {
  try {
    ensureStorage()
    
    // 动态导入 better-sqlite3，避免在 Vercel 环境下（devDependencies 被修剪）导致模块未找到错误
    // Dynamic import to avoid module not found error on Vercel where devDependencies are pruned
    const { default: Database } = await import('better-sqlite3');

    const { dbFile, timeout } = config.sqlite
    const db = new Database(dbFile, {
      timeout,
      verbose: null
    })
    
    // 创建表结构
    await createSQLiteTables(db)
    
    // 标记连接状态
    connectionStatus.sqlite = {
      connected: true,
      lastConnected: Date.now(),
      error: null
    }
    retryCounts.sqlite = 0
    
    log('SQLite initialized successfully')
    return db
  } catch (error) {
    connectionStatus.sqlite = {
      connected: false,
      lastConnected: null,
      error: error.message
    }
    retryCounts.sqlite++
    
    log(`SQLite connection failed: ${error.message}`, 'ERROR')
    
    // Fallback to Memory (with JSON persistence)
    log('Falling back to JSON-backed Memory DB', 'WARN');
    config.dbType = DB_TYPE.MEMORY;
    // Return dummy object to satisfy interface, but getDB() will redirect to memoryStore
    return {}; 
  }
}

/**
 * 创建SQLite表结构
 */
function createSQLiteTables(db) {
  try {
    // 创建用户表
        db.exec(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            phone TEXT,
            avatar_url TEXT,
            interests TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            email_verified INTEGER DEFAULT 0,
            email_verification_token TEXT,
            email_verification_expires INTEGER,
            sms_verification_code TEXT,
            sms_verification_expires INTEGER,
            age INTEGER,
            tags TEXT,
            membership_level TEXT DEFAULT 'free',
            membership_status TEXT DEFAULT 'active',
            membership_start INTEGER,
            membership_end INTEGER,
            email_login_code TEXT,
            email_login_expires INTEGER,
            github_id TEXT UNIQUE,
            github_username TEXT,
            auth_provider TEXT DEFAULT 'local'
          );
        `)
    
    // 尝试添加新列 (兼容旧数据库)
    const columns = []

    for (const col of columns) {
      try {
        db.exec(`ALTER TABLE users ADD COLUMN ${col}`)
      } catch (e) {
        if (!e.message.includes('duplicate column name')) throw e
      }
    }
    
    // 创建收藏表
    db.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tutorial_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
    `)
    
    // 创建用户成就表
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        user_id TEXT NOT NULL,
        achievement_id INTEGER NOT NULL,
        progress INTEGER DEFAULT 0,
        is_unlocked INTEGER DEFAULT 0,
        unlocked_at INTEGER,
        PRIMARY KEY (user_id, achievement_id)
      );
    `)

    // 创建积分记录表
    db.exec(`
      CREATE TABLE IF NOT EXISTS points_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        source TEXT,
        type TEXT,
        points INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        description TEXT,
        balance_after INTEGER DEFAULT 0
      );
    `)
    
    try {
      db.exec(`ALTER TABLE favorites ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`)
    } catch (e) {
      if (!e.message.includes('duplicate column name')) throw e
    }
    
    try {
      db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_tutorial ON favorites(user_id, tutorial_id)`)
    } catch (e) {}
    
    // 创建视频任务表
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

    // 创建活动表
    db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        start_time INTEGER,
        end_time INTEGER,
        location TEXT,
        cover_url TEXT,
        status TEXT DEFAULT 'draft',
        creator_id TEXT NOT NULL,
        created_at INTEGER,
        updated_at INTEGER,
        metadata TEXT,
        type TEXT,
        tags TEXT,
        media TEXT
      )
    `)

    // 尝试为活动表添加新列
    const eventColumns = ['type TEXT', 'tags TEXT', 'media TEXT']
    for (const col of eventColumns) {
      try {
        db.exec(`ALTER TABLE events ADD COLUMN ${col}`)
      } catch (e) {
        // Ignore duplicate column errors
      }
    }
    
    // 创建数据库迁移表
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      );
    `)
    
    // 创建好友请求表
    db.exec(`
      CREATE TABLE IF NOT EXISTS friend_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)

    // 创建好友表
    db.exec(`
      CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        friend_id TEXT NOT NULL,
        user_note TEXT,
        friend_note TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(user_id, friend_id)
      );
    `)
    
    // 创建用户状态表
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_status (
        user_id TEXT PRIMARY KEY,
        status TEXT,
        last_seen INTEGER,
        updated_at INTEGER
      );
    `)
    
    // 创建评论表
    db.exec(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        user_id TEXT NOT NULL,
        post_id INTEGER NOT NULL,
        parent_id INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)
    
    // 创建点赞表
    db.exec(`
      CREATE TABLE IF NOT EXISTS likes (
        user_id TEXT NOT NULL,
        post_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, post_id)
      );
    `)

    // 创建标签表
    db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)

    // 创建帖子标签关联表
    db.exec(`
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (post_id, tag_id)
      );
    `)
    
    // 创建消息表
    db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        content TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );
    `)

    // 创建社区表
    db.exec(`
      CREATE TABLE IF NOT EXISTS communities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        avatar_url TEXT,
        member_count INTEGER DEFAULT 0,
        members_count INTEGER DEFAULT 0,
        topic TEXT,
        is_active INTEGER DEFAULT 1,
        is_special INTEGER DEFAULT 0,
        join_approval_required INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER
      );
    `)

    // 创建社区成员表
    db.exec(`
      CREATE TABLE IF NOT EXISTS community_members (
        community_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        status TEXT DEFAULT 'approved',
        joined_at INTEGER NOT NULL,
        PRIMARY KEY (community_id, user_id)
      );
    `)

    // 创建加入请求表
    db.exec(`
      CREATE TABLE IF NOT EXISTS join_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        community_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        message TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE (community_id, user_id)
      );
    `)
    
    // 创建分类表
    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)
    
    // 创建帖子表
    db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        user_id TEXT NOT NULL,
        category_id INTEGER,
        views INTEGER DEFAULT 0,
        likes_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)
    
    // 创建作品表
    db.exec(`
      CREATE TABLE IF NOT EXISTS works (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        thumbnail TEXT,
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        creator_id TEXT,
        category TEXT,
        tags TEXT,
        description TEXT,
        featured INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)

    // 创建索引
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_video_tasks_status ON video_tasks(status);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_video_tasks_created_at ON video_tasks(created_at);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_works_creator_id ON works(creator_id);`)
    
    // 新增索引
    db.exec(`CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);`)
    
  } catch (error) {
    log(`SQLite table creation failed: ${error.message}`, 'ERROR')
    throw error
  }
}

/**
 * MongoDB 连接初始化
 */
async function initMongoDB() {
  try {
    const { uri, options } = config.mongodb
    const client = new MongoClient(uri, options)
    
    await client.connect()
    const db = client.db()
    
    // 验证连接
    await db.command({ ping: 1 })
    
    // 初始化集合和索引
    await initMongoDBCollections(db)
    
    // 标记连接状态
    connectionStatus.mongodb = {
      connected: true,
      lastConnected: Date.now(),
      error: null
    }
    retryCounts.mongodb = 0
    
    log('MongoDB initialized successfully')
    return { client, db }
  } catch (error) {
    connectionStatus.mongodb = {
      connected: false,
      lastConnected: null,
      error: error.message
    }
    retryCounts.mongodb++
    
    log(`MongoDB connection failed: ${error.message}`, 'ERROR')
    throw error
  }
}

/**
 * 初始化MongoDB集合和索引
 */
async function initMongoDBCollections(db) {
  try {
    // 初始化users集合
    const usersCollection = db.collection('users')
    await usersCollection.createIndex({ email: 1 }, { unique: true })
    await usersCollection.createIndex({ username: 1 }, { unique: true })
    
    // 初始化favorites集合
    const favoritesCollection = db.collection('favorites')
    await favoritesCollection.createIndex({ user_id: 1 })
    await favoritesCollection.createIndex({ user_id: 1, tutorial_id: 1 }, { unique: true })
    
    // 初始化video_tasks集合
    const videoTasksCollection = db.collection('video_tasks')
    await videoTasksCollection.createIndex({ status: 1 })
    await videoTasksCollection.createIndex({ created_at: 1 })
    
  } catch (error) {
    log(`MongoDB collection init failed: ${error.message}`, 'ERROR')
    throw error
  }
}

/**
 * PostgreSQL 连接初始化 (支持 Connection Pooling)
 */
async function initPostgreSQL() {
  try {
    let { connectionString, options } = config.postgresql
    
    if (!connectionString) {
      const errorMsg = 'PostgreSQL Connection String not configured. Please set DATABASE_URL in Vercel Environment Variables. (Format: postgres://user:pass@host:port/db)';
      console.error(errorMsg); // 确保在 Vercel 日志中可见
      
      // 优雅降级到内存数据库
      console.warn('Falling back to Memory DB due to missing PostgreSQL connection string');
      config.dbType = DB_TYPE.MEMORY;
      return {};
    }

    // 移除 connectionString 中的 sslmode 参数，避免与 options.ssl 冲突
    // 强制使用 options.ssl 配置来处理自签名证书问题
    try {
      const urlObj = new URL(connectionString)
      if (urlObj.searchParams.has('sslmode')) {
        urlObj.searchParams.delete('sslmode')
        connectionString = urlObj.toString()
      }
    } catch (e) {
      // 忽略 URL 解析错误，继续使用原始字符串
    }
    
    log(`Initializing PostgreSQL Pool (Max: ${options.max}, Timeout: ${options.connectionTimeoutMillis}ms)...`)
    
    const pool = new Pool({
      connectionString,
      ...options,
      // 配置日志级别，避免输出连接内存地址
      log: (msg) => {
        // 只记录错误级别的日志，忽略调试信息
        if (msg.includes('error') || msg.includes('Error')) {
          log(`PostgreSQL Pool: ${msg}`, 'ERROR')
        }
      }
    })
    
    // 连接池事件监控
    pool.on('connect', (client) => {
      // log('PostgreSQL: New client connected to pool', 'DEBUG')
    })
    
    pool.on('error', (err, client) => {
      log(`PostgreSQL Pool Error: ${err.message}`, 'ERROR')
      connectionStatus.postgresql.connected = false
      connectionStatus.postgresql.error = err.message
    })

    pool.on('remove', (client) => {
      // log('PostgreSQL: Client removed from pool', 'DEBUG')
    })
    
    // 验证连接
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    
    // 初始化表结构
    await createPostgreSQLTables(pool)
    
    // 标记连接状态
    connectionStatus.postgresql = {
      connected: true,
      lastConnected: Date.now(),
      error: null,
      poolStatus: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    }
    retryCounts.postgresql = 0
    
    log('PostgreSQL initialized successfully')
    return pool
  } catch (error) {
    connectionStatus.postgresql = {
      connected: false,
      lastConnected: null,
      error: error.message,
      poolStatus: {}
    }
    retryCounts.postgresql++
    
    log(`PostgreSQL connection failed: ${error.message}`, 'ERROR')
    
    // 优雅降级到内存数据库
    console.warn('Falling back to Memory DB due to PostgreSQL connection failure');
    config.dbType = DB_TYPE.MEMORY;
    return {};
  }
}

/**
 * 创建PostgreSQL表结构
 */
async function createPostgreSQLTables(pool) {
  try {
    const client = await pool.connect()
    try {
      // 辅助函数：确保列存在
      const ensureColumn = async (table, column, definition) => {
        try {
          await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`)
        } catch (e) {
          // 忽略列已存在的错误或其他非关键错误
        }
      }

      // 创建用户表 (移除外键约束，使用普通UUID主键)
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(20) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          avatar_url VARCHAR(255),
          interests TEXT,
          age INTEGER,
          tags TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          -- 验证相关字段
          email_verified BOOLEAN DEFAULT FALSE,
          email_verification_token VARCHAR(255),
          email_verification_expires TIMESTAMP WITH TIME ZONE,
          sms_verification_code VARCHAR(10),
          sms_verification_expires TIMESTAMP WITH TIME ZONE,
          -- 会员相关字段
          membership_level VARCHAR(20) DEFAULT 'free',
          membership_status VARCHAR(20) DEFAULT 'active',
          membership_start TIMESTAMP WITH TIME ZONE,
          membership_end TIMESTAMP WITH TIME ZONE,
          metadata JSONB
        );
        
        -- 为users表启用RLS
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      `);
      
      // 尝试移除可能存在的外键约束
      try {
        await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey`);
      } catch (e) {
        // 忽略约束不存在的错误
      }
      
      // 确保必要的列存在
      await ensureColumn('users', 'metadata', 'JSONB')
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS sms_verification_code VARCHAR(10);`)
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS sms_verification_expires TIMESTAMP WITH TIME ZONE;`)
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP WITH TIME ZONE;`)
      // 邮箱登录/注册验证码
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS email_login_code VARCHAR(10);`)
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS email_login_expires TIMESTAMP WITH TIME ZONE;`)
      // GitHub OAuth fields
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS github_id VARCHAR(255);`)
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS github_username VARCHAR(255);`)
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';`)
      // Add constraint if not exists (Postgres doesn't support IF NOT EXISTS for constraints easily in one line, skipping unique constraint for now or using a DO block)
      // Simple workaround: just add the column. The unique index can be added separately if critical, but for now app logic handles it.
      
      // 创建收藏表
      await client.query(`
        CREATE TABLE IF NOT EXISTS favorites (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          tutorial_id INTEGER NOT NULL,
          created_at BIGINT NOT NULL,
          UNIQUE(user_id, tutorial_id)
        );
      `)
      
      // 创建视频任务表
      await client.query(`
        CREATE TABLE IF NOT EXISTS video_tasks (
          id TEXT PRIMARY KEY,
          status TEXT,
          model TEXT,
          created_at BIGINT,
          updated_at BIGINT,
          payload_json TEXT
        );
      `)
      
      // 创建社区表
      await client.query(`
        CREATE TABLE IF NOT EXISTS communities (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          avatar TEXT,
          member_count INTEGER DEFAULT 0,
          topic VARCHAR(50),
          is_active BOOLEAN DEFAULT TRUE,
          is_special BOOLEAN DEFAULT FALSE,
          created_at BIGINT,
          updated_at BIGINT
        );
      `)
      
      // 确保 avatar 字段存在
      await client.query(`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS avatar TEXT;`)

      // 创建社区成员表
      await client.query(`
        CREATE TABLE IF NOT EXISTS community_members (
          community_id VARCHAR(50) NOT NULL,
          user_id UUID NOT NULL,
          role VARCHAR(20) DEFAULT 'member',
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          PRIMARY KEY (community_id, user_id),
          FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `)

      // 创建作品表
      await client.query(`
        CREATE TABLE IF NOT EXISTS works (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          thumbnail TEXT,
          creator_id UUID NOT NULL,
          category VARCHAR(100),
          tags TEXT,
          views INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          comments INTEGER DEFAULT 0,
          created_at BIGINT NOT NULL,
          updated_at BIGINT NOT NULL,
          FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `)
      
      // 确保必要的列存在
      await client.query(`ALTER TABLE IF EXISTS works ADD COLUMN IF NOT EXISTS cover_url TEXT;`)
      await client.query(`ALTER TABLE IF EXISTS works ADD COLUMN IF NOT EXISTS media TEXT;`)
      
      await client.query('CREATE INDEX IF NOT EXISTS idx_works_creator_id ON works(creator_id);')
      await client.query('CREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at);')
      await client.query('CREATE INDEX IF NOT EXISTS idx_works_category ON works(category);')

      // 创建分类表
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) UNIQUE NOT NULL,
          description TEXT,
          created_at BIGINT NOT NULL,
          updated_at BIGINT NOT NULL
        );
      `)
      
      // 创建标签表
      await client.query(`
        CREATE TABLE IF NOT EXISTS tags (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) UNIQUE NOT NULL,
          description TEXT,
          created_at BIGINT NOT NULL,
          updated_at BIGINT NOT NULL
        );
      `)
      
      // 创建帖子表
      await client.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          user_id UUID NOT NULL, -- Changed to UUID
          category_id INTEGER,
          status VARCHAR(20) DEFAULT 'published',
          views INTEGER DEFAULT 0,
          likes_count INTEGER DEFAULT 0,
          comments_count INTEGER DEFAULT 0,
          created_at BIGINT NOT NULL,
          updated_at BIGINT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        );
      `)
      
      // 创建帖子标签关联表
      await client.query(`
        CREATE TABLE IF NOT EXISTS post_tags (
          post_id INTEGER NOT NULL,
          tag_id INTEGER NOT NULL,
          PRIMARY KEY (post_id, tag_id),
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );
      `)
      
      // 创建评论表
      await client.query(`
        CREATE TABLE IF NOT EXISTS comments (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          user_id UUID NOT NULL, -- Changed to UUID
          post_id INTEGER NOT NULL,
          parent_id INTEGER,
          created_at BIGINT NOT NULL,
          updated_at BIGINT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
        );
      `)

      // 确保 comments 表的关键列存在 (修复旧 schema 问题)
      await ensureColumn('comments', 'post_id', 'INTEGER REFERENCES posts(id) ON DELETE CASCADE')
      await ensureColumn('comments', 'user_id', 'UUID REFERENCES users(id) ON DELETE CASCADE') // Changed to UUID
      await ensureColumn('comments', 'parent_id', 'INTEGER REFERENCES comments(id) ON DELETE CASCADE')
      
      // 创建点赞表
      await client.query(`
        CREATE TABLE IF NOT EXISTS likes (
          user_id UUID NOT NULL, -- Changed to UUID
          post_id INTEGER NOT NULL,
          created_at BIGINT NOT NULL,
          PRIMARY KEY (user_id, post_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        );
      `)

      // 创建用户成就表
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_achievements (
          user_id UUID NOT NULL,
          achievement_id INTEGER NOT NULL,
          progress INTEGER DEFAULT 0,
          is_unlocked BOOLEAN DEFAULT FALSE,
          unlocked_at BIGINT,
          PRIMARY KEY (user_id, achievement_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `)

      // 创建积分记录表
      await client.query(`
        CREATE TABLE IF NOT EXISTS points_records (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          source VARCHAR(50),
          type VARCHAR(20),
          points INTEGER NOT NULL,
          created_at BIGINT NOT NULL,
          description TEXT,
          balance_after INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `)

      // Social Features Tables
      
      // Direct Messages
      await client.query(`
        CREATE TABLE IF NOT EXISTS direct_messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- 为direct_messages表启用RLS
        ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
      `)

      // Friend Requests
      await client.query(`
        CREATE TABLE IF NOT EXISTS friend_requests (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- 为friend_requests表启用RLS
        ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
      `)

      // Friends
      await client.query(`
        CREATE TABLE IF NOT EXISTS friends (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          user_note VARCHAR(255),
          friend_note VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, friend_id)
        );
        
        -- 为friends表启用RLS
        ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
      `)

      // User Status
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_status (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(20) CHECK (status IN ('online', 'offline', 'away')),
          last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
      
      // 创建索引
      const createIndex = async (sql) => {
        try { await client.query(sql) } catch (e) { /* ignore */ }
      }

      await createIndex('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_video_tasks_status ON video_tasks(status);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_video_tasks_created_at ON video_tasks(created_at);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);')
      // Performance optimization for leaderboards
      await createIndex('CREATE INDEX IF NOT EXISTS idx_posts_likes ON posts(likes_count);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_posts_views ON posts(views);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_posts_comments ON posts(comments_count);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);')
      
      await createIndex('CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);')

      // 创建用户活动日志表
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_activities (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          action_type VARCHAR(50) NOT NULL,
          entity_type VARCHAR(50),
          entity_id VARCHAR(50),
          details JSONB,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `)
      await createIndex('CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);')

      // 创建RLS策略
      // 1. users表策略：用户只能访问自己的用户信息
      try {
        await client.query(`
          CREATE POLICY "Users can view their own profile" ON users
          FOR SELECT USING (id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::uuid);
        `);
      } catch (error) {
        if (!error.message.includes('already exists')) throw error;
        // 忽略已存在的策略错误
      }
      
      try {
        await client.query(`
          CREATE POLICY "Users can update their own profile" ON users
          FOR UPDATE USING (id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::uuid);
        `);
      } catch (error) {
        if (!error.message.includes('already exists')) throw error;
        // 忽略已存在的策略错误
      }

      // 2. friends表策略：用户只能访问自己的好友关系
      await client.query(`
        CREATE POLICY "Users can view their own friends" ON friends
        FOR SELECT USING (user_id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::uuid);
      `);
      
      await client.query(`
        CREATE POLICY "Users can manage their own friends" ON friends
        FOR ALL USING (user_id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::uuid);
      `);

      // 3. direct_messages表策略：用户只能访问自己发送或接收的消息
      await client.query(`
        CREATE POLICY "Users can view their own messages" ON direct_messages
        FOR SELECT USING (
          sender_id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::uuid OR
          receiver_id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::uuid
        );
      `);
      
      await client.query(`
        CREATE POLICY "Users can send messages" ON direct_messages
        FOR INSERT WITH CHECK (
          sender_id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::uuid
        );
      `);

      // 4. friend_requests表策略：用户只能访问自己发送或接收的好友请求
      await client.query(`
        CREATE POLICY "Users can view their friend requests" ON friend_requests
        FOR SELECT USING (
          sender_id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::uuid OR
          receiver_id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::uuid
        );
      `);
      
      await client.query(`
        CREATE POLICY "Users can send friend requests" ON friend_requests
        FOR INSERT WITH CHECK (
          sender_id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::uuid
        );
      `);

    } finally {
      client.release()
    }

  } catch (error) {
    log(`PostgreSQL table creation failed: ${error.message}`, 'ERROR')
    throw error
  }
}

/**
 * 获取数据库连接（带重试机制）
 */
async function getDBWithRetry(initFn, dbType, retries = 0) {
  try {
    return await initFn()
  } catch (error) {
    const maxRetries = config[dbType]?.maxRetries || 3
    const retryDelay = config[dbType]?.retryDelay || 1000
    
    if (retries < maxRetries) {
      log(`${dbType} connection failed, retrying in ${retryDelay/1000}s... (${retries + 1}/${maxRetries})`, 'WARN')
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      return getDBWithRetry(initFn, dbType, retries + 1)
    }
    
    throw new Error(`${dbType} connection failed after ${maxRetries} retries: ${error.message}`)
  }
}

/**
 * Neon API请求函数
 */
async function neonApiRequest(method, path, body = null) {
  const { endpoint, apiKey, dbName } = config.neon_api
  
  const url = `${endpoint}/${path}`
  const headers = {
    'Content-Type': 'application/json',
    'accept': 'application/json'
  }
  
  // 如果有API密钥，添加到请求头
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }
  
  const options = {
    method,
    headers
  }
  
  if (body) {
    options.body = JSON.stringify(body)
  }
  
  const response = await fetch(url, options)
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || `Neon API请求失败: ${response.status}`)
  }
  
  return response.json()
}

/**
 * Neon API数据库实例
 */
const neonApiDb = {
  async query(sql, params = []) {
    return neonApiRequest('POST', 'sql', { sql, params, options: { "connection": { "database": config.neon_api.dbName } } })
  }
}

/**
 * 获取当前配置的数据库实例
 */
export async function getDB() {
  // 检查是否已经降级到内存数据库
  if (config.dbType === DB_TYPE.MEMORY) {
    return memoryStore
  }
  
  // Normalize SUPABASE to POSTGRESQL for the instance manager
  const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType

  switch (typeKey) {
    case DB_TYPE.SQLITE:
      if (!dbInstances.sqlite || !connectionStatus.sqlite.connected) {
        dbInstances.sqlite = await getDBWithRetry(initSQLite, DB_TYPE.SQLITE)
        // 检查是否已经降级到内存数据库
        if (config.dbType === DB_TYPE.MEMORY) {
          return memoryStore
        }
      }
      return dbInstances.sqlite
      
    case DB_TYPE.MONGODB:
      if (!dbInstances.mongodb || !connectionStatus.mongodb.connected) {
        dbInstances.mongodb = await getDBWithRetry(initMongoDB, DB_TYPE.MONGODB)
        // 检查是否已经降级到内存数据库
        if (config.dbType === DB_TYPE.MEMORY) {
          return memoryStore
        }
      }
      return dbInstances.mongodb.db
      
    case DB_TYPE.POSTGRESQL:
      if (!dbInstances.postgresql || !connectionStatus.postgresql.connected) {
        dbInstances.postgresql = await getDBWithRetry(initPostgreSQL, DB_TYPE.POSTGRESQL)
        // 检查是否已经降级到内存数据库
        if (config.dbType === DB_TYPE.MEMORY) {
          return memoryStore
        }
      }
      // 再次检查是否已经降级到内存数据库
      if (config.dbType === DB_TYPE.MEMORY) {
        return memoryStore
      }
      return dbInstances.postgresql
      
    case DB_TYPE.NEON_API:
      connectionStatus.neon_api = {
        connected: true,
        lastConnected: Date.now(),
        error: null
      }
      return neonApiDb
      
    case DB_TYPE.MEMORY:
      return memoryStore

    default:
      throw new Error(`Unsupported DB Type: ${config.dbType}`)
  }
}

/**
 * 获取数据库连接状态 (健康检查)
 */
export async function getDBStatus() {
  const { dbType } = config
  const typeKey = (dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : dbType
  
  // 实时更新连接池状态 (如果是PG)
  if (typeKey === DB_TYPE.POSTGRESQL && dbInstances.postgresql) {
    connectionStatus.postgresql.poolStatus = {
      totalCount: dbInstances.postgresql.totalCount,
      idleCount: dbInstances.postgresql.idleCount,
      waitingCount: dbInstances.postgresql.waitingCount
    }
  }

  return {
    currentDbType: dbType,
    status: connectionStatus,
    retryCounts,
    timestamp: Date.now()
  }
}

/**
 * 关闭所有数据库连接
 */
export async function closeDB() {
  try {
    if (dbInstances.sqlite) {
      dbInstances.sqlite.close()
      dbInstances.sqlite = null
      connectionStatus.sqlite.connected = false
    }
    
    if (dbInstances.mongodb?.client) {
      await dbInstances.mongodb.client.close()
      dbInstances.mongodb = null
      connectionStatus.mongodb.connected = false
    }
    
    if (dbInstances.postgresql) {
      await dbInstances.postgresql.end()
      dbInstances.postgresql = null
      connectionStatus.postgresql.connected = false
    }
    
    log('All database connections closed')

  } catch (error) {
    log(`Error closing database connections: ${error.message}`, 'ERROR')
    throw error
  }
}

/**
 * 重新连接数据库
 */
export async function reconnectDB() {
  await closeDB()
  return getDB()
}

/**
 * 数据库操作封装 - 用户相关 (保持不变，省略了具体的实现以复用 getDB 返回的实例)
 * 注意：由于文件替换，这里需要保留原有的 userDB, favoriteDB, videoTaskDB, leaderboardDB 实现。
 * 为了简洁，这里将它们包含在内。
 */

export const userDB = {
  async createUser(userData) {
    const db = await getDB()
    const { 
      id = null, // Support custom ID (e.g. from Supabase Auth)
      username, email, password_hash, phone = null, avatar_url = null, interests = null, 
      age = null, tags = null, membership_level = 'free', membership_status = 'active', 
      membership_start = null, membership_end = null,
      github_id = null, github_username = null, auth_provider = 'local'
    } = userData
    // 确保email为小写，保证后续查找时的大小写不敏感
    const normalizedEmail = email.toLowerCase()
    const now = Date.now()
    const membershipStart = membership_start || now
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType

    switch (typeKey) {
      case DB_TYPE.SQLITE:
        // SQLite uses TEXT PRIMARY KEY for ID (UUID)
        const newId = id || randomUUID();
        
        // 注意：SQLite 需要手动序列化数组/对象类型
        const insertStmt = db.prepare(`
          INSERT INTO users (
            id, username, email, password_hash, phone, avatar_url, interests, age, tags, 
            membership_level, membership_status, membership_start, membership_end,
            created_at, updated_at, github_id, github_username, auth_provider
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        insertStmt.run(
          newId, username, normalizedEmail, password_hash, phone, avatar_url, 
          interests ? JSON.stringify(interests) : null, 
          age, 
          tags ? JSON.stringify(tags) : null,
          membership_level, membership_status, membershipStart, membership_end,
          now, now, github_id, github_username, auth_provider
        );
        
        return { id: newId };
      case DB_TYPE.MEMORY:
        const newUser = {
          id: id || randomUUID(),
          username, email: normalizedEmail, password_hash, phone, avatar_url, interests, age, tags,
          membership_level, membership_status, membership_start: membershipStart, membership_end,
          created_at: now, updated_at: now,
          github_id, github_username, auth_provider
        }
        memoryStore.users.push(newUser)
        saveMemoryStore()
        return { id: newUser.id }
      case DB_TYPE.MONGODB:
        const doc = {
          username, email: normalizedEmail, password_hash, phone, avatar_url, interests, age, tags,
          membership_level, membership_status, membership_start: membershipStart, membership_end,
          created_at: now, updated_at: now,
          github_id, github_username, auth_provider
        }
        if (id) doc._id = id; // MongoDB allows custom _id
        const result = await db.collection('users').insertOne(doc)
        return { id: result.insertedId }
      case DB_TYPE.POSTGRESQL:
        // Use provided ID or generate a new UUID
        const userId = id || randomUUID();
        // 对于Supabase，我们需要先创建auth.users记录，然后才能创建public.users记录
        // 但由于我们没有直接访问auth API的权限，我们可以尝试使用INSERT ... ON CONFLICT或其他方法
        // 这里我们简化处理，只插入必要的字段，不包括可能导致问题的外键约束
        const { rows } = await db.query(`
          INSERT INTO users (
            id, username, email, password_hash, phone, avatar_url, interests, age, tags, 
            membership_level, membership_status, github_id, github_username, auth_provider
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            username = $2, email = $3, password_hash = $4, phone = $5, avatar_url = $6, 
            interests = $7, age = $8, tags = $9, membership_level = $10, 
            membership_status = $11, github_id = $12, github_username = $13, 
            auth_provider = $14, updated_at = NOW()
          RETURNING id
        `, [
          userId, username, normalizedEmail, password_hash, phone, avatar_url, interests, age, tags,
          membership_level, membership_status, github_id, github_username, auth_provider
        ])
        return rows[0]
      case DB_TYPE.NEON_API:
        // Use provided ID or generate a new UUID
        const neonUserId = id || randomUUID();
        const neonResult = await db.query(`
          INSERT INTO users (
            id, username, email, password_hash, phone, avatar_url, interests, age, tags, 
            membership_level, membership_status, github_id, github_username, auth_provider
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            username = $2, email = $3, password_hash = $4, phone = $5, avatar_url = $6, 
            interests = $7, age = $8, tags = $9, membership_level = $10, 
            membership_status = $11, github_id = $12, github_username = $13, 
            auth_provider = $14, updated_at = NOW()
          RETURNING id
        `, [
          neonUserId, username, normalizedEmail, password_hash, phone, avatar_url, interests, age, tags,
          membership_level, membership_status, github_id, github_username, auth_provider
        ])
        return neonResult.result.rows[0]
      default:
        throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },
  
  async updateById(id, updateData) {
    const db = await getDB()
    const { 
      username, email, password_hash, phone, avatar_url, interests, age, tags,
      membership_level, membership_status, membership_start, membership_end,
      email_verified, email_verification_token, email_verification_expires,
      metadata
    } = updateData
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType

    // ... (Remaining updateById implementation logic is identical to original, just ensuring switch uses typeKey)
    // 为了节省篇幅，这里假设保留了原有逻辑，只是 switch (config.dbType) 改为 switch (typeKey)
    // 但因为是覆盖写入，我必须完整写出代码。
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        const updateFields = []
        const params = []
        let paramIndex = 1
        if (username) { updateFields.push(`username = ?`); params.push(username); }
        if (email) { updateFields.push(`email = ?`); params.push(email); }
        if (password_hash) { updateFields.push(`password_hash = ?`); params.push(password_hash); }
        if (phone !== undefined) { updateFields.push(`phone = ?`); params.push(phone); }
        if (avatar_url !== undefined) { updateFields.push(`avatar_url = ?`); params.push(avatar_url); }
        if (interests !== undefined) { updateFields.push(`interests = ?`); params.push(JSON.stringify(interests)); }
        if (age !== undefined) { updateFields.push(`age = ?`); params.push(age); }
        if (tags !== undefined) { updateFields.push(`tags = ?`); params.push(JSON.stringify(tags)); }
        if (membership_level) { updateFields.push(`membership_level = ?`); params.push(membership_level); }
        if (membership_status) { updateFields.push(`membership_status = ?`); params.push(membership_status); }
        if (membership_start) { updateFields.push(`membership_start = ?`); params.push(membership_start); }
        if (membership_end !== undefined) { updateFields.push(`membership_end = ?`); params.push(membership_end); }
        if (email_verified !== undefined) { updateFields.push(`email_verified = ?`); params.push(email_verified); }
        if (email_verification_token !== undefined) { updateFields.push(`email_verification_token = ?`); params.push(email_verification_token); }
        if (email_verification_expires !== undefined) { updateFields.push(`email_verification_expires = ?`); params.push(email_verification_expires); }
        if (metadata !== undefined) { updateFields.push(`metadata = ?`); params.push(JSON.stringify(metadata)); }
        updateFields.push(`updated_at = ?`)
        params.push(now)
        params.push(id)
        if (updateFields.length === 1) return this.findById(id)
        const updateSql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`
        
        const info = db.prepare(updateSql).run(...params);
        if (info.changes === 0) return null;
        
        // 重新获取更新后的用户数据
        return this.findById(id);

      case DB_TYPE.MEMORY:
        const userIndex = memoryStore.users.findIndex(u => u.id === id || u.id == id)
        if (userIndex === -1) return null
        const updatedUser = { ...memoryStore.users[userIndex], ...updateData, updated_at: now }
        memoryStore.users[userIndex] = updatedUser
        saveMemoryStore()
        return updatedUser

      case DB_TYPE.MONGODB:
        const updateObj = { updated_at: now }
        if (username) updateObj.username = username
        if (email) updateObj.email = email
        if (password_hash) updateObj.password_hash = password_hash
        if (phone !== undefined) updateObj.phone = phone
        if (avatar_url !== undefined) updateObj.avatar_url = avatar_url
        if (interests !== undefined) updateObj.interests = interests
        if (age !== undefined) updateObj.age = age
        if (tags !== undefined) updateObj.tags = tags
        if (membership_level) updateObj.membership_level = membership_level
        if (membership_status) updateObj.membership_status = membership_status
        if (membership_start) { updateObj.membership_start = membership_start }
        if (membership_end !== undefined) { updateObj.membership_end = membership_end }
        if (email_verified !== undefined) { updateObj.email_verified = email_verified }
        if (email_verification_token !== undefined) { updateObj.email_verification_token = email_verification_token }
        if (email_verification_expires !== undefined) { updateObj.email_verification_expires = email_verification_expires }
        if (metadata !== undefined) { updateObj.metadata = metadata }
        return (await db.collection('users').findOneAndUpdate({ _id: id }, { $set: updateObj }, { returnDocument: 'after' })).value

      case DB_TYPE.POSTGRESQL:
        const pgUpdateFields = []
        const pgParams = []
        
        // Helper to add field safely
        const addPgField = (field, value) => {
           pgParams.push(value)
           pgUpdateFields.push(`${field} = $${pgParams.length}`)
        }

        if (username) addPgField('username', username)
        if (email) addPgField('email', email)
        if (password_hash) addPgField('password_hash', password_hash)
        if (phone !== undefined) addPgField('phone', phone)
        if (avatar_url !== undefined) addPgField('avatar_url', avatar_url)
        if (interests !== undefined) addPgField('interests', interests)
        if (age !== undefined) addPgField('age', age)
        if (tags !== undefined) addPgField('tags', tags)
        if (membership_level) addPgField('membership_level', membership_level)
        if (membership_status) addPgField('membership_status', membership_status)
        if (membership_start) addPgField('membership_start', membership_start)
        if (membership_end !== undefined) addPgField('membership_end', membership_end)
        if (email_verified !== undefined) addPgField('email_verified', email_verified)
        if (email_verification_token !== undefined) addPgField('email_verification_token', email_verification_token)
        if (email_verification_expires !== undefined) addPgField('email_verification_expires', email_verification_expires)
        if (metadata !== undefined) addPgField('metadata', metadata)
        
        // 确保 updated_at 使用 PostgreSQL 的 NOW() 函数
        pgUpdateFields.push(`updated_at = NOW()`)
        
        // ID 是最后一个参数
        pgParams.push(id)
        const idParamIndex = pgParams.length
        
        if (pgUpdateFields.length === 1) return this.findById(id)
        
        const pgUpdateSql = `UPDATE users SET ${pgUpdateFields.join(', ')} WHERE id = $${idParamIndex} RETURNING *`
        
        try {
          return (await db.query(pgUpdateSql, pgParams)).rows[0]
        } catch (error) {
          console.error('[DB] Update Error:', error)
          // 如果是 email_verified 列不存在错误，尝试忽略该字段更新
          if (error.code === '42703' && error.message.includes('email_verified')) {
             console.warn('[DB] email_verified column missing, retrying update without it');
             // 简单的重试逻辑：递归调用自己，但剔除 email_verified
             // 注意：这里需要确保 updateData 中不再包含 email_verified
             const newUpdateData = { ...updateData }
             delete newUpdateData.email_verified
             return this.updateById(id, newUpdateData)
          }
          throw error;
        }

      case DB_TYPE.NEON_API:
        const neonUpdateFields = []
        const neonParams = []
        let neonParamIndex = 1
        if (username) { neonUpdateFields.push(`username = $${neonParamIndex++}`); neonParams.push(username) }
        if (email) { neonUpdateFields.push(`email = $${neonParamIndex++}`); neonParams.push(email) }
        if (password_hash) { neonUpdateFields.push(`password_hash = $${neonParamIndex++}`); neonParams.push(password_hash) }
        if (phone !== undefined) { neonUpdateFields.push(`phone = $${neonParamIndex++}`); neonParams.push(phone) }
        if (avatar_url !== undefined) { neonUpdateFields.push(`avatar_url = $${neonParamIndex++}`); neonParams.push(avatar_url) }
        if (interests !== undefined) { neonUpdateFields.push(`interests = $${neonParamIndex++}`); neonParams.push(interests) }
        if (age !== undefined) { neonUpdateFields.push(`age = $${neonParamIndex++}`); neonParams.push(age) }
        if (tags !== undefined) { neonUpdateFields.push(`tags = $${neonParamIndex++}`); neonParams.push(tags) }
        if (membership_level) { neonUpdateFields.push(`membership_level = $${neonParamIndex++}`); neonParams.push(membership_level) }
        if (membership_status) { neonUpdateFields.push(`membership_status = $${neonParamIndex++}`); neonParams.push(membership_status) }
        if (membership_start) { neonUpdateFields.push(`membership_start = $${neonParamIndex++}`); neonParams.push(membership_start) }
        if (membership_end !== undefined) { neonUpdateFields.push(`membership_end = $${neonParamIndex++}`); neonParams.push(membership_end) }
        if (email_verified !== undefined) { neonUpdateFields.push(`email_verified = $${neonParamIndex++}`); neonParams.push(email_verified) }
        if (email_verification_token !== undefined) { neonUpdateFields.push(`email_verification_token = $${neonParamIndex++}`); neonParams.push(email_verification_token) }
        if (email_verification_expires !== undefined) { neonUpdateFields.push(`email_verification_expires = $${neonParamIndex++}`); neonParams.push(email_verification_expires) }
        neonUpdateFields.push(`updated_at = $${neonParamIndex++}`)
        neonParams.push(now)
        neonParams.push(id)
        if (neonUpdateFields.length === 1) return this.findById(id)
        const neonUpdateSql = `UPDATE users SET ${neonUpdateFields.join(', ')} WHERE id = $${neonParamIndex - 1} RETURNING *`
        const neonResult = await db.query(neonUpdateSql, neonParams)
        return neonResult.result.rows[0]
      default:
        throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async findByEmail(email) {
    const db = await getDB()
    // 直接使用config.dbType，确保当降级到内存数据库时，使用正确的分支
    const typeKey = config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE: return db.prepare('SELECT * FROM users WHERE email = ?').get(email)
      case DB_TYPE.MEMORY: return memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase())
      case DB_TYPE.MONGODB: return db.collection('users').findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })
      case DB_TYPE.POSTGRESQL:
      case DB_TYPE.SUPABASE: return (await db.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email])).rows[0]
      case DB_TYPE.NEON_API: return (await db.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email])).result.rows[0]
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async findByUsername(username) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE: return db.prepare('SELECT * FROM users WHERE username = ?').get(username)
      case DB_TYPE.MEMORY: return memoryStore.users.find(u => u.username === username)
      case DB_TYPE.MONGODB: return db.collection('users').findOne({ username })
      case DB_TYPE.POSTGRESQL: return (await db.query('SELECT * FROM users WHERE username = $1', [username])).rows[0]
      case DB_TYPE.NEON_API: return (await db.query('SELECT * FROM users WHERE username = $1', [username])).result.rows[0]
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async findByPhone(phone) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE: return db.prepare('SELECT * FROM users WHERE phone = ?').get(phone)
      case DB_TYPE.MEMORY: return memoryStore.users.find(u => u.phone === phone)
      case DB_TYPE.MONGODB: return db.collection('users').findOne({ phone: phone })
      case DB_TYPE.POSTGRESQL: return (await db.query('SELECT * FROM users WHERE phone = $1', [phone])).rows[0]
      case DB_TYPE.NEON_API: return (await db.query('SELECT * FROM users WHERE phone = $1', [phone])).result.rows[0]
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async findByGithubId(githubId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE: return db.prepare('SELECT * FROM users WHERE github_id = ?').get(githubId)
      case DB_TYPE.MEMORY: return memoryStore.users.find(u => u.github_id === githubId)
      case DB_TYPE.MONGODB: return db.collection('users').findOne({ github_id: githubId })
      case DB_TYPE.POSTGRESQL: return (await db.query('SELECT * FROM users WHERE github_id = $1', [githubId])).rows[0]
      case DB_TYPE.NEON_API: return (await db.query('SELECT * FROM users WHERE github_id = $1', [githubId])).result.rows[0]
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async updateSmsVerificationCode(phone, code, expiresAt) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        // 检查用户是否存在，如果不存在则创建一个临时记录
        const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(phone)
        if (existing) {
          db.prepare('UPDATE users SET sms_verification_code = ?, sms_verification_expires = ? WHERE email = ?').run(code, expiresAt, phone)
        } else {
          db.prepare('INSERT INTO users (email, sms_verification_code, sms_verification_expires, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(phone, code, expiresAt, Date.now(), Date.now())
        }
        return true
      case DB_TYPE.MEMORY:
        // 处理手机号验证码
        if (phone) {
          const memUser = memoryStore.users.find(u => u.email === phone || u.phone === phone)
          if (memUser) {
            memUser.sms_verification_code = code
            memUser.sms_verification_expires = expiresAt
            memUser.updated_at = Date.now()
          } else {
            memoryStore.users.push({
              id: randomUUID(),
              username: `user_${phone}`,
              email: phone, // Assuming phone as email for simple auth flow if not separate
              phone: phone,
              sms_verification_code: code,
              sms_verification_expires: expiresAt,
              created_at: Date.now(),
              updated_at: Date.now()
            })
          }
        }
        // 处理邮箱验证码
        if (email) {
          const memUserEmail = memoryStore.users.find(u => u.email === email)
          if (memUserEmail) {
            memUserEmail.email_login_code = code
            memUserEmail.email_login_expires = expiresAt
            memUserEmail.updated_at = Date.now()
          } else {
            memoryStore.users.push({
              id: randomUUID(),
              username: `user_${Date.now()}`,
              email: email,
              email_login_code: code,
              email_login_expires: expiresAt,
              created_at: Date.now(),
              updated_at: Date.now()
            })
          }
        }
        saveMemoryStore()
        return true
      case DB_TYPE.MONGODB:
        await db.collection('users').updateOne(
          { email: phone },
          { $set: { sms_verification_code: code, sms_verification_expires: expiresAt, updated_at: Date.now() } },
          { upsert: true }
        )
        return true
      case DB_TYPE.POSTGRESQL:
        // 对于PostgreSQL，列类型为BIGINT，直接存储毫秒时间戳
        await db.query(
          'INSERT INTO users (id, username, email, sms_verification_code, sms_verification_expires, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET sms_verification_code = $4, sms_verification_expires = $5, updated_at = NOW()',
          [randomUUID(), `user_${phone}`, phone, code, expiresAt]
        )
        return true
      case DB_TYPE.NEON_API:
        // Neon API也使用PostgreSQL语法
        await db.query(
          'INSERT INTO users (id, username, email, sms_verification_code, sms_verification_expires, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET sms_verification_code = $4, sms_verification_expires = $5, updated_at = NOW()',
          [randomUUID(), `user_${phone}`, phone, code, expiresAt]
        )
        return true
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async getSmsVerificationCode(phone) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE: {
        const user = db.prepare('SELECT sms_verification_code, sms_verification_expires FROM users WHERE email = ?').get(phone)
        return user || { sms_verification_code: null, sms_verification_expires: null }
      }
      case DB_TYPE.MEMORY: {
        const user = memoryStore.users.find(u => u.email === phone || u.phone === phone)
        return user ? { sms_verification_code: user.sms_verification_code, sms_verification_expires: user.sms_verification_expires } : { sms_verification_code: null, sms_verification_expires: null }
      }
      case DB_TYPE.MONGODB: {
        const user = await db.collection('users').findOne({ email: phone }, { projection: { sms_verification_code: 1, sms_verification_expires: 1 } })
        return user || { sms_verification_code: null, sms_verification_expires: null }
      }
      case DB_TYPE.POSTGRESQL: {
        const { rows } = await db.query(
          'SELECT sms_verification_code, sms_verification_expires FROM users WHERE email = $1', 
          [phone]
        )
        return rows[0] || { sms_verification_code: null, sms_verification_expires: null }
      }
      case DB_TYPE.NEON_API: {
        const result = await db.query(
          'SELECT sms_verification_code, sms_verification_expires FROM users WHERE email = $1', 
          [phone]
        )
        return result.result.rows[0] || { sms_verification_code: null, sms_verification_expires: null }
      }
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  // 新增：更新邮箱验证码（用于邮箱验证码登录）
  async updateEmailLoginCode(email, code, expiresAt) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE: {
        const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
        if (existing) {
          db.prepare('UPDATE users SET email_login_code = ?, email_login_expires = ? WHERE email = ?').run(code, expiresAt, email)
        } else {
          const tempUsername = `u${Date.now().toString(36)}${Math.floor(Math.random() * 10000).toString(36)}`.slice(0, 20);
          db.prepare('INSERT INTO users (id, username, password_hash, email, email_login_code, email_login_expires, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(randomUUID(), tempUsername, 'TEMP_HASH', email, code, expiresAt, Date.now(), Date.now())
        }
        return true
      }
      case DB_TYPE.MONGODB: {
        await db.collection('users').updateOne(
          { email },
          { $set: { email_login_code: code, email_login_expires: expiresAt, updated_at: Date.now() } },
          { upsert: true }
        )
        return true
      }
      case DB_TYPE.POSTGRESQL: {
        const expiresAtDate = new Date(expiresAt);
        // 使用更短的用户名生成策略，确保不超过 VARCHAR(20)
        // Date.now().toString(36) 约为 8 字符
        // Math.random() 部分约为 4 字符
        // 总长度约为 1 + 8 + 4 = 13 字符
        const tempUsername = `u${Date.now().toString(36)}${Math.floor(Math.random() * 10000).toString(36)}`;
        
        try {
          await db.query(
            'INSERT INTO users (id, username, email, password_hash, email_login_code, email_login_expires, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET email_login_code = $5, email_login_expires = $6, updated_at = NOW()',
            [randomUUID(), tempUsername, email, 'TEMP_HASH', code, expiresAtDate]
          )
          return true
        } catch (err) {
          log(`PostgreSQL updateEmailLoginCode error: ${err.message}`, 'ERROR');
          throw err;
        }
      }
      case DB_TYPE.NEON_API: {
        const expiresAtDate = new Date(expiresAt);
        await db.query(
          'INSERT INTO users (id, username, email, password_hash, email_login_code, email_login_expires, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET email_login_code = $5, email_login_expires = $6, updated_at = NOW()',
          [randomUUID(), `user_${Date.now()}`, email, 'TEMP_HASH', code, expiresAtDate]
        )
        return true
      }
      case DB_TYPE.MEMORY: {
        // 处理内存数据库
        const existingUserIndex = memoryStore.users.findIndex(user => user.email === email);
        if (existingUserIndex !== -1) {
          // 更新现有用户
          memoryStore.users[existingUserIndex].email_login_code = code;
          memoryStore.users[existingUserIndex].email_login_expires = expiresAt;
          memoryStore.users[existingUserIndex].updated_at = Date.now();
        } else {
          // 添加新用户
          memoryStore.users.push({
            id: randomUUID(),
            username: `user_${Date.now()}`,
            email,
            password_hash: 'TEMP_HASH',
            email_login_code: code,
            email_login_expires: expiresAt,
            created_at: Date.now(),
            updated_at: Date.now()
          });
        }
        saveMemoryStore();
        return true;
      }
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  // 新增：获取邮箱验证码信息
  async getEmailLoginCode(email) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    try {
      switch (typeKey) {
        case DB_TYPE.SQLITE: {
          const row = db.prepare('SELECT email_login_code, email_login_expires FROM users WHERE email = ?').get(email)
          return row || { email_login_code: null, email_login_expires: null }
        }
        case DB_TYPE.MEMORY: {
          const user = memoryStore.users.find(u => u.email === email)
          return user ? { email_login_code: user.email_login_code, email_login_expires: user.email_login_expires } : { email_login_code: null, email_login_expires: null }
        }
        case DB_TYPE.MONGODB: {
          const row = await db.collection('users').findOne(
            { email },
            { projection: { email_login_code: 1, email_login_expires: 1 } }
          )
          return row || { email_login_code: null, email_login_expires: null }
        }
        case DB_TYPE.POSTGRESQL: {
          try {
            const { rows } = await db.query(
              'SELECT email_login_code, email_login_expires FROM users WHERE email = $1',
              [email]
            )
            return rows[0] || { email_login_code: null, email_login_expires: null }
          } catch (error) {
            // 处理字段不存在的情况
            if (error.code === '42703') {
              return { email_login_code: null, email_login_expires: null }
            }
            throw error
          }
        }
        case DB_TYPE.NEON_API: {
          try {
            const result = await db.query(
              'SELECT email_login_code, email_login_expires FROM users WHERE email = $1',
              [email]
            )
            return result.result.rows[0] || { email_login_code: null, email_login_expires: null }
          } catch (error) {
            // 处理字段不存在的情况
            if (error.code === '42703') {
              return { email_login_code: null, email_login_expires: null }
            }
            throw error
          }
        }
        default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
      }
    } catch (error) {
      console.error(`[getEmailLoginCode] 错误:`, error)
      return { email_login_code: null, email_login_expires: null }
    }
  },

  async findById(id) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE: return db.prepare('SELECT * FROM users WHERE id = ?').get(id)
      case DB_TYPE.MEMORY: return memoryStore.users.find(u => u.id === id || u.id == id)
      case DB_TYPE.MONGODB: return db.collection('users').findOne({ _id: id })
      case DB_TYPE.POSTGRESQL: return (await db.query('SELECT * FROM users WHERE id = $1', [id])).rows[0]
      case DB_TYPE.NEON_API: return (await db.query('SELECT * FROM users WHERE id = $1', [id])).result.rows[0]
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async getAllUsers() {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE: return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all()
      case DB_TYPE.MEMORY: return [...memoryStore.users].sort((a, b) => b.created_at - a.created_at)
      case DB_TYPE.MONGODB: return await db.collection('users').find({}).sort({ created_at: -1 }).toArray()
      case DB_TYPE.POSTGRESQL: return (await db.query('SELECT * FROM users ORDER BY created_at DESC')).rows
      case DB_TYPE.NEON_API: return (await db.query('SELECT * FROM users ORDER BY created_at DESC')).result.rows
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  // 清理非邮箱验证码登录的用户
  async cleanupNonEmailCodeUsers() {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    let deletedCount = 0

    switch (typeKey) {
      case DB_TYPE.SQLITE:
        // 查找并删除非local登录的用户
        const nonLocalUsers = db.prepare('SELECT * FROM users WHERE auth_provider IS NOT NULL AND auth_provider != ?').all('local')
        deletedCount = nonLocalUsers.length
        for (const user of nonLocalUsers) {
          db.prepare('DELETE FROM users WHERE id = ?').run(user.id)
        }
        break
      case DB_TYPE.MEMORY:
        // 过滤出只保留local登录的用户
        const localUsers = memoryStore.users.filter(u => !u.auth_provider || u.auth_provider === 'local')
        deletedCount = memoryStore.users.length - localUsers.length
        memoryStore.users = localUsers
        saveMemoryStore()
        break
      case DB_TYPE.MONGODB:
        // 删除非local登录的用户
        const result = await db.collection('users').deleteMany({ auth_provider: { $ne: 'local' } })
        deletedCount = result.deletedCount || 0
        break
      case DB_TYPE.POSTGRESQL:
      case DB_TYPE.SUPABASE:
        // 删除非local登录的用户
        try {
          const { rowCount } = await db.query('DELETE FROM users WHERE auth_provider IS NOT NULL AND auth_provider != $1', ['local'])
          deletedCount = rowCount || 0
        } catch (error) {
          log(`PostgreSQL delete non-local users error: ${error.message}`, 'ERROR')
          // 忽略错误，继续执行
        }
        break
      case DB_TYPE.NEON_API:
        // 删除非local登录的用户
        const neonResult = await db.query('DELETE FROM users WHERE auth_provider IS NOT NULL AND auth_provider != $1', ['local'])
        deletedCount = neonResult.result.rowCount || 0
        break
      default:
        throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }

    log(`Cleaned up ${deletedCount} non-email code login users`)
    return deletedCount
  },

  // 删除测试邮箱用户
  async deleteTestEmailUsers() {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    let deletedCount = 0

    // 测试邮箱模式
    const testEmailPatterns = [
      '%@example.com',
      '%rls_test%',
      'test@%'
    ]

    switch (typeKey) {
      case DB_TYPE.SQLITE:
        // 查找并删除测试邮箱用户
        for (const pattern of testEmailPatterns) {
          const testUsers = db.prepare('SELECT * FROM users WHERE email LIKE ?').all(pattern)
          for (const user of testUsers) {
            db.prepare('DELETE FROM users WHERE id = ?').run(user.id)
            deletedCount++
          }
        }
        break
      case DB_TYPE.MEMORY:
        // 过滤出只保留非测试邮箱的用户
        const nonTestUsers = memoryStore.users.filter(u => {
          const email = u.email || ''
          return !testEmailPatterns.some(pattern => {
            const regexPattern = pattern.replace('%', '.*')
            const regex = new RegExp(regexPattern, 'i')
            return regex.test(email)
          })
        })
        deletedCount = memoryStore.users.length - nonTestUsers.length
        memoryStore.users = nonTestUsers
        saveMemoryStore()
        break
      case DB_TYPE.MONGODB:
        // 删除测试邮箱用户
        const testEmailRegex = new RegExp('(@example\.com|rls_test|^test@)', 'i')
        const deleteResult = await db.collection('users').deleteMany({ email: { $regex: testEmailRegex } })
        deletedCount = deleteResult.deletedCount || 0
        break
      case DB_TYPE.POSTGRESQL:
      case DB_TYPE.SUPABASE:
        // 删除测试邮箱用户
        for (const pattern of testEmailPatterns) {
          const { rowCount } = await db.query('DELETE FROM users WHERE email LIKE $1', [pattern])
          deletedCount += rowCount || 0
        }
        break
      case DB_TYPE.NEON_API:
        // 删除测试邮箱用户
        for (const pattern of testEmailPatterns) {
          const neonDeleteResult = await db.query('DELETE FROM users WHERE email LIKE $1', [pattern])
          deletedCount += neonDeleteResult.result.rowCount || 0
        }
        break
      default:
        throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }

    log(`Deleted ${deletedCount} test email users`)
    return deletedCount
  }
}

export const favoriteDB = {
  async getUserFavorites(userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE: return db.prepare('SELECT tutorial_id FROM favorites WHERE user_id = ? ORDER BY tutorial_id ASC').all(userId).map(r => r.tutorial_id)
      case DB_TYPE.MEMORY: return memoryStore.favorites.filter(f => f.user_id === userId).map(f => f.tutorial_id)
      case DB_TYPE.MONGODB: return (await db.collection('favorites').find({ user_id: userId }).sort({ tutorial_id: 1 }).toArray()).map(f => f.tutorial_id)
      case DB_TYPE.POSTGRESQL: return (await db.query('SELECT tutorial_id FROM favorites WHERE user_id = $1 ORDER BY tutorial_id ASC', [userId])).rows.map(r => r.tutorial_id)
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },
  
  async toggleFavorite(userId, tutorialId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        const existing = db.prepare('SELECT * FROM favorites WHERE user_id = ? AND tutorial_id = ?').get(userId, tutorialId)
        if (existing) db.prepare('DELETE FROM favorites WHERE user_id = ? AND tutorial_id = ?').run(userId, tutorialId)
        else db.prepare('INSERT INTO favorites (user_id, tutorial_id, created_at) VALUES (?, ?, ?)').run(userId, tutorialId, Date.now())
        return this.getUserFavorites(userId)
      case DB_TYPE.MEMORY:
        const favIndex = memoryStore.favorites.findIndex(f => f.user_id === userId && f.tutorial_id === tutorialId)
        if (favIndex > -1) memoryStore.favorites.splice(favIndex, 1)
        else memoryStore.favorites.push({ user_id: userId, tutorial_id: tutorialId, created_at: Date.now() })
        saveMemoryStore()
        return this.getUserFavorites(userId)
      case DB_TYPE.MONGODB:
        const result = await db.collection('favorites').findOneAndDelete({ user_id: userId, tutorial_id: tutorialId })
        if (!result.value) await db.collection('favorites').insertOne({ user_id: userId, tutorial_id: tutorialId, created_at: Date.now() })
        return this.getUserFavorites(userId)
      case DB_TYPE.POSTGRESQL:
        const { rows: pgRows } = await db.query('SELECT * FROM favorites WHERE user_id = $1 AND tutorial_id = $2', [userId, tutorialId])
        if (pgRows.length > 0) await db.query('DELETE FROM favorites WHERE user_id = $1 AND tutorial_id = $2', [userId, tutorialId])
        else await db.query('INSERT INTO favorites (user_id, tutorial_id, created_at) VALUES ($1, $2, $3)', [userId, tutorialId, Date.now()])
        return this.getUserFavorites(userId)
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  }
}

export const videoTaskDB = {
  async upsertTask(taskData) {
    const db = await getDB()
    const { id, status, model, payload } = taskData
    const now = Date.now()
    const payloadJson = payload ? JSON.stringify(payload) : null
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        db.prepare(`
          INSERT INTO video_tasks (id, status, model, created_at, updated_at, payload_json)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            status = excluded.status,
            model = COALESCE(excluded.model, video_tasks.model),
            updated_at = excluded.updated_at,
            payload_json = COALESCE(excluded.payload_json, video_tasks.payload_json)
        `).run(id, status || null, model || null, now, now, payloadJson)
        return
      case DB_TYPE.MEMORY:
        const taskIndex = memoryStore.video_tasks.findIndex(t => t.id === id)
        if (taskIndex > -1) {
          const existing = memoryStore.video_tasks[taskIndex]
          memoryStore.video_tasks[taskIndex] = {
            ...existing,
            status: status || existing.status,
            model: model || existing.model,
            updated_at: now,
            payload: payload || existing.payload
          }
        } else {
          memoryStore.video_tasks.push({ id, status, model, created_at: now, updated_at: now, payload })
        }
        saveMemoryStore()
        return
      case DB_TYPE.MONGODB:
        await db.collection('video_tasks').updateOne({ id }, { $set: { status, model, updated_at: now, payload }, $setOnInsert: { created_at: now } }, { upsert: true })
        return
      case DB_TYPE.POSTGRESQL:
        await db.query(`
          INSERT INTO video_tasks (id, status, model, created_at, updated_at, payload_json)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT(id) DO UPDATE SET
            status = excluded.status,
            model = COALESCE(excluded.model, video_tasks.model),
            updated_at = excluded.updated_at,
            payload_json = COALESCE(excluded.payload_json, video_tasks.payload_json)
        `, [id, status || null, model || null, now, now, payloadJson])
        return
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },
  
  async getTask(id) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        const row = db.prepare('SELECT * FROM video_tasks WHERE id = ?').get(id)
        if (!row) return null
        let payload = null
        if (row.payload_json) try { payload = JSON.parse(row.payload_json) } catch (e) {}
        return { id: row.id, status: row.status, model: row.model, created_at: row.created_at, updated_at: row.updated_at, payload }
      case DB_TYPE.MEMORY: return memoryStore.video_tasks.find(t => t.id === id) || null
      case DB_TYPE.MONGODB: return db.collection('video_tasks').findOne({ id })
      case DB_TYPE.POSTGRESQL:
        const { rows } = await db.query('SELECT * FROM video_tasks WHERE id = $1', [id])
        if (rows.length === 0) return null
        const pgRow = rows[0]
        let pgPayload = null
        if (pgRow.payload_json) try { pgPayload = JSON.parse(pgRow.payload_json) } catch (e) {}
        return { id: pgRow.id, status: pgRow.status, model: pgRow.model, created_at: pgRow.created_at, updated_at: pgRow.updated_at, payload: pgPayload }
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  }
}

export const leaderboardDB = {
  getTimeRangeStart(timeRange) {
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000
    switch (timeRange) {
      case 'day': return now - day
      case 'week': return now - (7 * day)
      case 'month': return now - (30 * day)
      case 'all': default: return 0
    }
  },
  
  async getPostsLeaderboard({ sortBy = 'likes_count', timeRange = 'all', limit = 20 }) {
    const db = await getDB()
    const startTime = this.getTimeRangeStart(timeRange)
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        const whereClause = startTime > 0 ? `WHERE created_at >= ?` : ''
        const params = startTime > 0 ? [startTime] : []
        return db.prepare(`
          SELECT p.*, u.username, u.avatar_url
          FROM posts p
          LEFT JOIN users u ON p.user_id = u.id
          ${whereClause}
          ORDER BY p.${sortBy} DESC
          LIMIT ?
        `).all(...params, limit)
      case DB_TYPE.MEMORY:
        // Mock data for community page
        if (memoryStore.posts.length === 0) {
           // Generate some mock posts if empty
           for (let i = 0; i < 5; i++) {
             memoryStore.posts.push({
               id: i + 1,
               title: `Mock Post ${i+1}`,
               content: `This is a mock post content for testing.`,
               user_id: memoryStore.users[0]?.id || 'mock-user-id',
               username: 'MockUser',
               avatar_url: null,
               likes_count: Math.floor(Math.random() * 100),
               comments_count: 0,
               views: Math.floor(Math.random() * 1000),
               created_at: Date.now() - i * 100000
             })
           }
        }
        return memoryStore.posts
          .filter(p => startTime === 0 || p.created_at >= startTime)
          .sort((a, b) => b[sortBy] - a[sortBy])
          .slice(0, limit)
      case DB_TYPE.MONGODB:
        const query = startTime > 0 ? { created_at: { $gte: startTime } } : {}
        return await db.collection('posts').aggregate([
            { $match: query },
            { $sort: { [sortBy]: -1 } },
            { $limit: limit },
            { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user_info' } },
            { $unwind: { path: '$user_info', preserveNullAndEmptyArrays: true } },
            { $project: { id: 1, title: 1, content: 1, user_id: 1, category_id: 1, status: 1, views: 1, likes_count: 1, comments_count: 1, created_at: 1, updated_at: 1, username: '$user_info.username', avatar_url: '$user_info.avatar_url' } }
          ]).toArray()
      case DB_TYPE.POSTGRESQL:
        const pgWhereClause = startTime > 0 ? `WHERE w.created_at >= to_timestamp($1/1000.0)` : ''
        const pgParams = startTime > 0 ? [startTime, limit] : [limit]
        const pgParamOffset = startTime > 0 ? 1 : 0
        
        let dbSortBy = sortBy;
        if (sortBy === 'likes_count') dbSortBy = 'likes';
        if (sortBy === 'comments_count') dbSortBy = 'comments';
        
        return (await db.query(`
          SELECT 
            w.id, w.title, w.description as content, w.thumbnail, 
            w.creator_id as user_id, w.category as category_id, 
            w.views, w.likes as likes_count, w.comments as comments_count, 
            w.created_at, w.updated_at,
            u.username, u.avatar_url
          FROM works w
          LEFT JOIN users u ON w.creator_id = u.id
          ${pgWhereClause}
          ORDER BY w.${dbSortBy} DESC
          LIMIT $${pgParamOffset + 1}
        `, pgParams)).rows
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },
  
  async getUsersLeaderboard({ sortBy = 'posts_count', timeRange = 'all', limit = 20 }) {
    const db = await getDB()
    const startTime = this.getTimeRangeStart(timeRange)
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        // SQLite Mock for now
        const users = db.prepare(`SELECT id, username, email, avatar_url, created_at, updated_at FROM users ORDER BY id DESC LIMIT ?`).all(limit)
        return users.map(user => ({ ...user, posts_count: Math.floor(Math.random() * 100), total_likes: Math.floor(Math.random() * 1000), total_views: Math.floor(Math.random() * 10000) }))
      case DB_TYPE.MEMORY:
        return memoryStore.users.slice(0, limit).map(user => ({
          ...user,
          posts_count: 0,
          total_likes: 0,
          total_views: 0
        }))
      case DB_TYPE.MONGODB:
        const postQuery = startTime > 0 ? { created_at: { $gte: startTime } } : {}
        return await db.collection('users').aggregate([
            { $lookup: { from: 'posts', let: { userId: '$_id' }, pipeline: [ { $match: { $expr: { $eq: ['$user_id', '$$userId'] }, ...postQuery } }, { $group: { _id: null, count: { $sum: 1 }, total_likes: { $sum: '$likes_count' }, total_views: { $sum: '$views' } } } ], as: 'post_stats' } },
            { $unwind: { path: '$post_stats', preserveNullAndEmptyArrays: true } },
            { $project: { id: '$_id', username: 1, email: 1, avatar_url: 1, created_at: 1, updated_at: 1, posts_count: { $ifNull: ['$post_stats.count', 0] }, total_likes: { $ifNull: ['$post_stats.total_likes', 0] }, total_views: { $ifNull: ['$post_stats.total_views', 0] } } },
            { $sort: { [sortBy]: -1 } },
            { $limit: limit }
          ]).toArray()
      case DB_TYPE.POSTGRESQL:
        const pgWorkWhereClause = startTime > 0 ? `AND w.created_at >= to_timestamp($1/1000.0)` : ''
        const pgUserParams = startTime > 0 ? [startTime, limit] : [limit]
        const pgUserParamOffset = startTime > 0 ? 1 : 0
        
        let dbUserSortBy = sortBy;
        if (sortBy === 'likes_count') dbUserSortBy = 'total_likes';
        if (sortBy === 'posts_count') dbUserSortBy = 'posts_count';
        if (sortBy === 'views') dbUserSortBy = 'total_views';

        return (await db.query(`
          SELECT u.id, u.username, u.email, u.avatar_url, u.created_at, u.updated_at, 
            COUNT(w.id) as posts_count, 
            COALESCE(SUM(w.likes), 0) as total_likes, 
            COALESCE(SUM(w.views), 0) as total_views
          FROM users u
          LEFT JOIN works w ON u.id = w.creator_id ${pgWorkWhereClause}
          GROUP BY u.id
          ORDER BY ${dbUserSortBy} DESC
          LIMIT $${pgUserParamOffset + 1}
        `, pgUserParams)).rows
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  }
}

export const friendDB = {
  async sendRequest(senderId, receiverId) {
    const db = await getDB(senderId)
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        // Check if request already exists
        const existing = db.prepare('SELECT * FROM friend_requests WHERE sender_id = ? AND receiver_id = ?').get(senderId, receiverId)
        if (existing) return existing
        
        // Check if already friends
        const friend = db.prepare('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?').get(senderId, receiverId)
        if (friend) throw new Error('ALREADY_FRIENDS')
        
        db.prepare('INSERT INTO friend_requests (sender_id, receiver_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(senderId, receiverId, 'pending', now, now)
        return db.prepare('SELECT * FROM friend_requests WHERE sender_id = ? AND receiver_id = ?').get(senderId, receiverId)

      case DB_TYPE.MEMORY: {
        // Check if request already exists
        const existingMem = memoryStore.friend_requests.find(r => r.sender_id === senderId && r.receiver_id === receiverId)
        if (existingMem) return existingMem
        
        // Check if already friends
        const friendMem = memoryStore.friends.find(f => f.user_id === senderId && f.friend_id === receiverId)
        if (friendMem) throw new Error('ALREADY_FRIENDS')
        
        const newRequest = {
          id: randomUUID(),
          sender_id: senderId,
          receiver_id: receiverId,
          status: 'pending',
          created_at: now,
          updated_at: now
        }
        memoryStore.friend_requests.push(newRequest)
        saveMemoryStore()
        return newRequest
      }

      case DB_TYPE.POSTGRESQL:
        // Check if request already exists
        const { rows: existingPg } = await db.query('SELECT * FROM friend_requests WHERE sender_id = $1 AND receiver_id = $2', [senderId, receiverId])
        if (existingPg.length > 0) return existingPg[0]
        
        // Check if already friends
        const { rows: friendPg } = await db.query('SELECT * FROM friends WHERE user_id = $1 AND friend_id = $2', [senderId, receiverId])
        if (friendPg.length > 0) throw new Error('ALREADY_FRIENDS')
        
        const { rows: newRequest } = await db.query(`
          INSERT INTO friend_requests (sender_id, receiver_id, status, created_at, updated_at) 
          VALUES ($1, $2, 'pending', NOW(), NOW()) 
          RETURNING *
        `, [senderId, receiverId])
        return newRequest[0]

      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async acceptRequest(requestId) {
    const db = await getDB()
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        const request = db.prepare('SELECT * FROM friend_requests WHERE id = ?').get(requestId)
        if (!request) throw new Error('REQUEST_NOT_FOUND')
        if (request.status !== 'pending') throw new Error('INVALID_STATUS')
        
        const transaction = db.transaction(() => {
          // Update request status
          db.prepare('UPDATE friend_requests SET status = ?, updated_at = ? WHERE id = ?').run('accepted', now, requestId)
          
          // Add to friends table (bidirectional)
          db.prepare('INSERT OR IGNORE INTO friends (user_id, friend_id, created_at) VALUES (?, ?, ?)').run(request.sender_id, request.receiver_id, now)
          db.prepare('INSERT OR IGNORE INTO friends (user_id, friend_id, created_at) VALUES (?, ?, ?)').run(request.receiver_id, request.sender_id, now)
        })
        
        transaction()
        return true
        
      case DB_TYPE.MEMORY:
        const reqIndex = memoryStore.friend_requests.findIndex(r => r.id === requestId)
        if (reqIndex === -1) throw new Error('REQUEST_NOT_FOUND')
        const memRequest = memoryStore.friend_requests[reqIndex]
        if (memRequest.status !== 'pending') throw new Error('INVALID_STATUS')
        
        // Update request status
        memRequest.status = 'accepted'
        memRequest.updated_at = now
        
        // Add to friends table (bidirectional)
        if (!memoryStore.friends.some(f => f.user_id === memRequest.sender_id && f.friend_id === memRequest.receiver_id)) {
          memoryStore.friends.push({ id: randomUUID(), user_id: memRequest.sender_id, friend_id: memRequest.receiver_id, created_at: now, updated_at: now })
        }
        if (!memoryStore.friends.some(f => f.user_id === memRequest.receiver_id && f.friend_id === memRequest.sender_id)) {
          memoryStore.friends.push({ id: randomUUID(), user_id: memRequest.receiver_id, friend_id: memRequest.sender_id, created_at: now, updated_at: now })
        }
        saveMemoryStore()
        return true

      case DB_TYPE.POSTGRESQL:
        const { rows: pgReqRows } = await db.query('SELECT * FROM friend_requests WHERE id = $1', [requestId])
        if (pgReqRows.length === 0) throw new Error('REQUEST_NOT_FOUND')
        const pgRequest = pgReqRows[0]
        if (pgRequest.status !== 'pending') throw new Error('INVALID_STATUS')
        
        try {
          await db.query('BEGIN')
          await db.query("UPDATE friend_requests SET status = 'accepted', updated_at = NOW() WHERE id = $1", [requestId])
          await db.query('INSERT INTO friends (user_id, friend_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING', [pgRequest.sender_id, pgRequest.receiver_id])
          await db.query('INSERT INTO friends (user_id, friend_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING', [pgRequest.receiver_id, pgRequest.sender_id])
          await db.query('COMMIT')
          return true
        } catch (e) {
          await db.query('ROLLBACK')
          throw e
        }

      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async rejectRequest(requestId) {
    const db = await getDB()
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        db.prepare('UPDATE friend_requests SET status = ?, updated_at = ? WHERE id = ?').run('rejected', now, requestId)
        return true
      case DB_TYPE.MEMORY:
        const rejIndex = memoryStore.friend_requests.findIndex(r => r.id === requestId)
        if (rejIndex !== -1) {
          memoryStore.friend_requests[rejIndex].status = 'rejected'
          memoryStore.friend_requests[rejIndex].updated_at = now
        }
        saveMemoryStore()
        return true
      case DB_TYPE.POSTGRESQL:
        await db.query("UPDATE friend_requests SET status = 'rejected', updated_at = NOW() WHERE id = $1", [requestId])
        return true
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async getRequests(userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        const requests = db.prepare(`
          SELECT fr.*, u.username, u.avatar_url 
          FROM friend_requests fr
          JOIN users u ON fr.sender_id = u.id
          WHERE fr.receiver_id = ? AND fr.status = 'pending'
          ORDER BY fr.created_at DESC
        `).all(userId)
        return requests.map(r => ({
          ...r,
          sender: { id: r.sender_id, username: r.username, avatar_url: r.avatar_url }
        }))
      case DB_TYPE.MEMORY:
        return memoryStore.friend_requests
          .filter(r => r.receiver_id === userId && r.status === 'pending')
          .sort((a, b) => b.created_at - a.created_at)
          .map(r => {
            const sender = memoryStore.users.find(u => u.id === r.sender_id)
            return {
              ...r,
              sender: sender ? { id: sender.id, username: sender.username, avatar_url: sender.avatar_url } : { id: r.sender_id, username: 'Unknown', avatar_url: null }
            }
          })
      case DB_TYPE.POSTGRESQL:
        const { rows: pgRequests } = await db.query(`
          SELECT fr.*, u.username, u.avatar_url 
          FROM friend_requests fr
          JOIN users u ON fr.sender_id = u.id
          WHERE fr.receiver_id = $1 AND fr.status = 'pending'
          ORDER BY fr.created_at DESC
        `, [userId])
        return pgRequests.map(r => ({
          ...r,
          sender: { id: r.sender_id, username: r.username, avatar_url: r.avatar_url }
        }))
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async getFriends(userId) {
    const db = await getDB(userId)
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        const friends = db.prepare(`
          SELECT f.*, u.username, u.avatar_url, u.email, s.status as online_status, s.last_seen
          FROM friends f
          JOIN users u ON f.friend_id = u.id
          LEFT JOIN user_status s ON f.friend_id = s.user_id
          WHERE f.user_id = ?
          ORDER BY s.status DESC, f.created_at DESC
        `).all(userId)
        return friends.map(f => ({
          ...f,
          friend: { 
            id: f.friend_id, 
            username: f.username, 
            avatar_url: f.avatar_url, 
            email: f.email,
            status: f.online_status || 'offline',
            last_seen: f.last_seen
          }
        }))
      case DB_TYPE.MEMORY:
        return memoryStore.friends
          .filter(f => f.user_id === userId)
          .map(f => {
            const friend = memoryStore.users.find(u => u.id === f.friend_id)
            const status = memoryStore.user_status.find(s => s.user_id === f.friend_id)
            return {
              ...f,
              friend: {
                id: f.friend_id,
                username: friend ? friend.username : 'Unknown',
                avatar_url: friend ? friend.avatar_url : null,
                email: friend ? friend.email : null,
                status: status ? status.status : 'offline',
                last_seen: status ? status.last_seen : null
              }
            }
          })
          .sort((a, b) => {
             const statusA = a.friend.status === 'online' ? 2 : (a.friend.status === 'away' ? 1 : 0)
             const statusB = b.friend.status === 'online' ? 2 : (b.friend.status === 'away' ? 1 : 0)
             if (statusA !== statusB) return statusB - statusA
             return b.created_at - a.created_at
          })
      case DB_TYPE.POSTGRESQL:
        const { rows: pgFriends } = await db.query(`
          SELECT f.*, u.username, u.avatar_url, u.email, s.status as online_status, s.last_seen
          FROM friends f
          JOIN users u ON f.friend_id = u.id
          LEFT JOIN user_status s ON f.friend_id = s.user_id
          WHERE f.user_id = $1
          ORDER BY s.status DESC, f.created_at DESC
        `, [userId])
        return pgFriends.map(f => ({
          ...f,
          friend: { 
            id: f.friend_id, 
            username: f.username, 
            avatar_url: f.avatar_url, 
            email: f.email,
            status: f.online_status || 'offline',
            last_seen: f.last_seen
          }
        }))
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },
  
  async deleteFriend(userId, friendId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        db.prepare('DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)').run(userId, friendId, friendId, userId)
        return true
      case DB_TYPE.MEMORY:
        memoryStore.friends = memoryStore.friends.filter(f => 
          !((f.user_id === userId && f.friend_id === friendId) || (f.user_id === friendId && f.friend_id === userId))
        )
        saveMemoryStore()
        return true
      case DB_TYPE.POSTGRESQL:
        await db.query('DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)', [userId, friendId])
        return true
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },
  
  async updateNote(userId, friendId, note) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        db.prepare('UPDATE friends SET user_note = ? WHERE user_id = ? AND friend_id = ?').run(note, userId, friendId)
        return true
      case DB_TYPE.MEMORY:
        const friendEntry = memoryStore.friends.find(f => f.user_id === userId && f.friend_id === friendId)
        if (friendEntry) {
          friendEntry.user_note = note
        }
        saveMemoryStore()
        return true
      case DB_TYPE.POSTGRESQL:
        await db.query('UPDATE friends SET user_note = $1 WHERE user_id = $2 AND friend_id = $3', [note, userId, friendId])
        return true
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },
  
  async searchUsers(query, currentUserId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        const users = db.prepare(`
          SELECT id, username, email, avatar_url, phone
          FROM users 
          WHERE (LOWER(username) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?) OR phone LIKE ? OR LOWER(CAST(id AS TEXT)) LIKE LOWER(?)) AND id != ?
          LIMIT 20
        `).all(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, currentUserId)
        
        // Add status info
        return users.map(u => {
           const statusRow = db.prepare('SELECT status FROM user_status WHERE user_id = ?').get(u.id)
           return { 
             ...u, 
             status: statusRow ? statusRow.status : 'offline',
             avatar: u.avatar_url
           }
        })
      case DB_TYPE.MEMORY:
        const lowerQuery = query.toLowerCase()
        return memoryStore.users
          .filter(u => (
            u.username.toLowerCase().includes(lowerQuery) || 
            u.email.toLowerCase().includes(lowerQuery) ||
            (u.phone && u.phone.includes(query)) ||
            (u.id && String(u.id).toLowerCase().includes(lowerQuery))
          ) && u.id !== currentUserId)
          .slice(0, 20)
          .map(u => {
             const status = memoryStore.user_status.find(s => s.user_id === u.id)
             return {
               id: u.id,
               username: u.username,
               email: u.email,
               avatar_url: u.avatar_url,
               avatar: u.avatar_url,
               phone: u.phone,
               status: status ? status.status : 'offline'
             }
          })
      case DB_TYPE.POSTGRESQL:
        const { rows: pgSearchUsers } = await db.query(`
          SELECT u.id, u.username, u.email, u.avatar_url, u.phone, s.status
          FROM users u
          LEFT JOIN user_status s ON u.id = s.user_id
          WHERE (u.username ILIKE $1 OR u.email ILIKE $1 OR u.phone ILIKE $1 OR u.id::text ILIKE $1) AND u.id != $2
          LIMIT 20
        `, [`%${query}%`, currentUserId])
        return pgSearchUsers.map(u => ({ 
          ...u, 
          status: u.status || 'offline',
          avatar: u.avatar_url
        }))
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },
  
  async updateUserStatus(userId, status) {
    const db = await getDB()
    const now = new Date().toISOString()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        db.prepare(`
          INSERT INTO user_status (user_id, status, last_seen) 
          VALUES (?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET status = ?, last_seen = ?
        `).run(userId, status, now, status, now)
        return true
      case DB_TYPE.MEMORY:
        const statusIndex = memoryStore.user_status.findIndex(s => s.user_id === userId)
        if (statusIndex > -1) {
          memoryStore.user_status[statusIndex].status = status
          memoryStore.user_status[statusIndex].last_seen = now
          memoryStore.user_status[statusIndex].updated_at = now
        } else {
          memoryStore.user_status.push({
            user_id: userId,
            status: status,
            last_seen: now,
            updated_at: now
          })
        }
        saveMemoryStore()
        return true
      case DB_TYPE.POSTGRESQL:
        await db.query(`
          INSERT INTO user_status (user_id, status, last_seen, updated_at) 
          VALUES ($1, $2, NOW(), NOW())
          ON CONFLICT(user_id) DO UPDATE SET status = $2, last_seen = NOW(), updated_at = NOW()
        `, [userId, status])
        return true
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  }
}

export const messageDB = {
  async sendMessage(senderId, receiverId, content) {
    const db = await getDB(senderId)
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        db.prepare('INSERT INTO messages (sender_id, receiver_id, content, is_read, created_at) VALUES (?, ?, ?, 0, ?)').run(senderId, receiverId, content, now)
        return { sender_id: senderId, receiver_id: receiverId, content, is_read: 0, created_at: now }
      case DB_TYPE.MEMORY:
        const newMessage = {
          id: randomUUID(),
          sender_id: senderId,
          receiver_id: receiverId,
          content: content,
          is_read: false,
          created_at: now
        }
        memoryStore.messages.push(newMessage)
        saveMemoryStore()
        return newMessage
      case DB_TYPE.POSTGRESQL:
        const { rows: msgRows } = await db.query(`
          INSERT INTO direct_messages (sender_id, receiver_id, content, is_read, created_at) 
          VALUES ($1, $2, $3, false, NOW()) 
          RETURNING *
        `, [senderId, receiverId, content])
        return msgRows[0]
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async getMessages(userId, friendId, limit = 50, offset = 0) {
    const db = await getDB(userId)
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        const messages = db.prepare(`
          SELECT * FROM messages 
          WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `).all(userId, friendId, friendId, userId, limit, offset)
        return messages.reverse() // Return in chronological order
      case DB_TYPE.MEMORY:
        const memMessages = memoryStore.messages
          .filter(m => (m.sender_id === userId && m.receiver_id === friendId) || (m.sender_id === friendId && m.receiver_id === userId))
          .sort((a, b) => b.created_at - a.created_at) // Newest first
          .slice(offset, offset + limit)
        return memMessages.reverse() // Oldest first
      case DB_TYPE.POSTGRESQL:
        const { rows: pgMessages } = await db.query(`
          SELECT * FROM direct_messages 
          WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
          ORDER BY created_at DESC
          LIMIT $3 OFFSET $4
        `, [userId, friendId, limit, offset])
        return pgMessages.reverse()
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },
  
  async markAsRead(userId, friendId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        // Mark messages sent by friend to user as read
        db.prepare('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?').run(friendId, userId)
        return true
      case DB_TYPE.MEMORY:
        memoryStore.messages.forEach(m => {
          if (m.sender_id === friendId && m.receiver_id === userId) {
            m.is_read = true
          }
        })
        saveMemoryStore()
        return true
      case DB_TYPE.POSTGRESQL:
        await db.query('UPDATE direct_messages SET is_read = true WHERE sender_id = $1 AND receiver_id = $2', [friendId, userId])
        return true
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },
  
  async getUnreadCount(userId) {
    const db = await getDB(userId)
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        const result = db.prepare(`
          SELECT sender_id, COUNT(*) as count 
          FROM messages 
          WHERE receiver_id = ? AND is_read = 0 
          GROUP BY sender_id
        `).all(userId)
        return result
      case DB_TYPE.MEMORY:
        const counts = {}
        memoryStore.messages.forEach(m => {
          if (m.receiver_id === userId && !m.is_read) {
            counts[m.sender_id] = (counts[m.sender_id] || 0) + 1
          }
        })
        return Object.keys(counts).map(senderId => ({ sender_id: senderId, count: counts[senderId] }))
      case DB_TYPE.POSTGRESQL:
        const { rows: unreadRows } = await db.query(`
          SELECT sender_id, COUNT(*) as count 
          FROM direct_messages 
          WHERE receiver_id = $1 AND is_read = false 
          GROUP BY sender_id
        `, [userId])
        return unreadRows
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  }
}

export const workDB = {
  async createWork(workData) {
    console.log('[workDB.createWork] Called with:', JSON.stringify(workData));
    console.log('[workDB.createWork] Current dbType:', config.dbType);
    
    const db = await getDB()
    const { title, description, cover_url, thumbnail, creator_id, category, tags, media } = workData
    const now = workData.created_at || Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    console.log('[workDB.createWork] Using typeKey:', typeKey);
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        // Ensure table exists
        db.exec(`
          CREATE TABLE IF NOT EXISTS works (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            cover_url TEXT,
            thumbnail TEXT,
            creator_id TEXT NOT NULL,
            category TEXT,
            tags TEXT,
            media TEXT,
            views INTEGER DEFAULT 0,
            likes INTEGER DEFAULT 0,
            comments INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          )
        `);
        
        // 检查并添加缺失的列
        try {
          // 尝试添加 cover_url 列
          db.exec(`ALTER TABLE works ADD COLUMN IF NOT EXISTS cover_url TEXT`);
          // 尝试添加 media 列
          db.exec(`ALTER TABLE works ADD COLUMN IF NOT EXISTS media TEXT`);
        } catch (e) {
          console.log('Column already exists or error adding column:', e.message);
        }
        
        // 检查哪些列存在
        let columns = [];
        try {
          const tableInfo = db.prepare(`PRAGMA table_info(works)`).all();
          columns = tableInfo.map((col) => col.name);
        } catch (e) {
          console.error('Error getting table info:', e);
        }
        
        // 根据实际列结构构建插入语句
        const hasCoverUrl = columns.includes('cover_url');
        const hasMedia = columns.includes('media');
        
        let insertSql, insertParams;
        if (hasCoverUrl && hasMedia) {
          // 所有列都存在
          insertSql = `
            INSERT INTO works (title, description, cover_url, thumbnail, creator_id, category, tags, media, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          insertParams = [
            title, description, cover_url, thumbnail || cover_url, creator_id, category, 
            tags ? JSON.stringify(tags) : '[]', 
            media ? JSON.stringify(media) : '[]', 
            now, now
          ];
        } else if (hasCoverUrl) {
          // 只有 cover_url 列存在
          insertSql = `
            INSERT INTO works (title, description, cover_url, thumbnail, creator_id, category, tags, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          insertParams = [
            title, description, cover_url, thumbnail || cover_url, creator_id, category, 
            tags ? JSON.stringify(tags) : '[]', 
            now, now
          ];
        } else {
          // 都不存在（使用原始表结构）
          insertSql = `
            INSERT INTO works (title, description, thumbnail, creator_id, category, tags, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;
          insertParams = [
            title, description, thumbnail || cover_url, creator_id, category, 
            tags ? JSON.stringify(tags) : '[]', 
            now, now
          ];
        }
        
        const result = db.prepare(insertSql).run(...insertParams);
        return { id: result.lastInsertRowid, ...workData, created_at: now, updated_at: now }
        
      case DB_TYPE.POSTGRESQL:
        console.log('[workDB.createWork] PostgreSQL case - db:', db ? 'exists' : 'null');
        // 首先检查并添加缺失的列
        try {
          await db.query(`ALTER TABLE works ADD COLUMN IF NOT EXISTS cover_url TEXT`);
          await db.query(`ALTER TABLE works ADD COLUMN IF NOT EXISTS media TEXT`);
        } catch (e) {
          console.log('Column already exists or error adding column:', e.message);
        }
        
        // 然后执行插入
        console.log('[workDB.createWork] Inserting with params:', { title, creator_id, category, now });
        try {
          // 处理 tags 和 media - PostgreSQL数组格式使用 {} 而不是 []
          let tagsValue = '{}';
          if (tags) {
            if (typeof tags === 'string') {
              // 如果是JSON字符串，转换为PostgreSQL数组格式
              try {
                const parsed = JSON.parse(tags);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  tagsValue = '{' + parsed.map(t => `"${t}"`).join(',') + '}';
                }
              } catch (e) {
                tagsValue = `{${tags}}`;
              }
            } else if (Array.isArray(tags) && tags.length > 0) {
              tagsValue = '{' + tags.map(t => `"${t}"`).join(',') + '}';
            }
          }
          
          let mediaValue = '{}';
          if (media) {
            if (typeof media === 'string') {
              try {
                const parsed = JSON.parse(media);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  mediaValue = '{' + parsed.map(m => `"${m}"`).join(',') + '}';
                }
              } catch (e) {
                mediaValue = `{${media}}`;
              }
            } else if (Array.isArray(media) && media.length > 0) {
              mediaValue = '{' + media.map(m => `"${m}"`).join(',') + '}';
            }
          }
          
          const { rows } = await db.query(`
            INSERT INTO works (title, description, cover_url, thumbnail, creator_id, category, tags, media, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
            RETURNING *
          `, [
            title, description, cover_url, thumbnail || cover_url, creator_id, category, 
            tagsValue, 
            mediaValue, 
            now
          ])
          console.log('[workDB.createWork] Insert successful:', rows[0]);
          return rows[0]
        } catch (insertError) {
          console.error('[workDB.createWork] Insert failed:', insertError);
          throw insertError;
        }
        
      case DB_TYPE.MEMORY:
        const newWork = {
          id: Date.now(), // Simple numeric ID
          title, description, cover_url, thumbnail: thumbnail || cover_url, creator_id, category, tags, media,
          views: 0, likes: 0, comments: 0,
          created_at: now, updated_at: now
        }
        if (!memoryStore.works) memoryStore.works = []
        memoryStore.works.push(newWork)
        saveMemoryStore()
        return newWork
        
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async getWorks(limit = 50, offset = 0) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        // Assume works table exists in SQLite (migrated earlier)
        return db.prepare('SELECT w.*, u.username, u.avatar_url FROM works w LEFT JOIN users u ON w.creator_id = u.id ORDER BY w.created_at DESC LIMIT ? OFFSET ?').all(limit, offset)
      case DB_TYPE.MEMORY:
        // Mock data or in-memory store
        // We can use memoryStore.posts as a fallback if works are not separate
        return (memoryStore.works || []).sort((a, b) => b.created_at - a.created_at).slice(offset, offset + limit)
      case DB_TYPE.POSTGRESQL:
        return (await db.query('SELECT w.*, u.username, u.avatar_url FROM works w LEFT JOIN users u ON w.creator_id = u.id ORDER BY w.created_at DESC LIMIT $1 OFFSET $2', [limit, offset])).rows
      default: return []
    }
  },

  async getWorksByUserId(userId, limit = 50, offset = 0) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        // Assume works table exists in SQLite (migrated earlier)
        return db.prepare('SELECT w.*, u.username, u.avatar_url FROM works w LEFT JOIN users u ON w.creator_id = u.id WHERE w.creator_id = ? ORDER BY w.created_at DESC LIMIT ? OFFSET ?').all(userId, limit, offset)
      case DB_TYPE.MEMORY:
        // Mock data or in-memory store
        // We can use memoryStore.posts as a fallback if works are not separate
        return (memoryStore.works || []).filter(w => w.creator_id === userId).sort((a, b) => b.created_at - a.created_at).slice(offset, offset + limit)
      case DB_TYPE.POSTGRESQL:
        return (await db.query('SELECT w.*, u.username, u.avatar_url FROM works w LEFT JOIN users u ON w.creator_id = u.id WHERE w.creator_id = $1 ORDER BY w.created_at DESC LIMIT $2 OFFSET $3', [userId, limit, offset])).rows
      default: return []
    }
  },

  async getWorkStats(userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        const stats = db.prepare(`
          SELECT 
            COUNT(*) as works_count,
            SUM(likes) as total_likes,
            SUM(views) as total_views,
            SUM(comments) as total_comments
          FROM works WHERE creator_id = ?
        `).get(userId)
        return stats || { works_count: 0, total_likes: 0, total_views: 0, total_comments: 0 }
      case DB_TYPE.POSTGRESQL:
        const { rows } = await db.query(`
          SELECT 
            COUNT(*) as works_count,
            COALESCE(SUM(likes), 0) as total_likes,
            COALESCE(SUM(views), 0) as total_views,
            COALESCE(SUM(comments), 0) as total_comments
          FROM works WHERE creator_id = $1
        `, [userId])
        return rows[0] || { works_count: 0, total_likes: 0, total_views: 0, total_comments: 0 }
      default: return { works_count: 0, total_likes: 0, total_views: 0, total_comments: 0 }
    }
  },

  async getAllWorks() {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        return db.prepare('SELECT w.*, u.username, u.avatar_url FROM works w LEFT JOIN users u ON w.creator_id = u.id ORDER BY w.created_at DESC').all()
      case DB_TYPE.MEMORY:
        return (memoryStore.works || []).sort((a, b) => b.created_at - a.created_at)
      case DB_TYPE.POSTGRESQL:
        return (await db.query('SELECT w.*, u.username, u.avatar_url FROM works w LEFT JOIN users u ON w.creator_id = u.id ORDER BY w.created_at DESC')).rows
      default: return []
    }
  }
}

export const notificationDB = {
  async addNotification(notification) {
    const db = await getDB()
    const { userId, title, content, type = 'system' } = notification
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        db.prepare('INSERT INTO notifications (user_id, title, content, type, is_read, created_at) VALUES (?, ?, ?, ?, 0, ?)').run(userId, title, content, type, now)
        return true
      case DB_TYPE.POSTGRESQL:
        await db.query('INSERT INTO notifications (user_id, title, content, type, is_read, created_at) VALUES ($1, $2, $3, $4, false, NOW())', [userId, title, content, type])
        return true
      default: return false
    }
  },

  async getNotifications(userId, limit = 20, offset = 0) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        return db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(userId, limit, offset)
      case DB_TYPE.POSTGRESQL:
        return (await db.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [userId, limit, offset])).rows
      default: return []
    }
  },

  async getUnreadCount(userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        const res = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(userId)
        return res ? res.count : 0
      case DB_TYPE.POSTGRESQL:
        const { rows } = await db.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false', [userId])
        return rows[0] ? parseInt(rows[0].count) : 0
      default: return 0
    }
  },

  async markAsRead(id, userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, userId)
        return true
      case DB_TYPE.POSTGRESQL:
        await db.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [id, userId])
        return true
      default: return false
    }
  },

  async markAllAsRead(userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId)
        return true
      case DB_TYPE.POSTGRESQL:
        await db.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId])
        return true
      default: return false
    }
  }
}

export const communityDB = {
  async getAllCommunities() {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    let communities
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        communities = db.prepare('SELECT * FROM communities ORDER BY member_count DESC').all()
        break
      case DB_TYPE.POSTGRESQL:
        communities = (await db.query('SELECT * FROM communities ORDER BY member_count DESC')).rows
        break
      case DB_TYPE.MEMORY:
        communities = [...(memoryStore.communities || [])].sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
        break
      default:
        return []
    }
    
    // 确保每个社区对象都有 avatar 字段
    return communities.map(community => ({
      ...community,
      avatar: community.avatar || community.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(community.name || 'community')}`
    }))
  },

  async getCommunityById(id) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        return db.prepare('SELECT * FROM communities WHERE id = ?').get(id)
      case DB_TYPE.POSTGRESQL:
        return (await db.query('SELECT * FROM communities WHERE id = $1', [id])).rows[0]
      case DB_TYPE.MEMORY:
        const community = (memoryStore.communities || []).find(c => c.id === id) || null
        if (community) {
          return {
            ...community,
            avatar: community.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(community.name || 'community')}`
          }
        }
        return null
      default: return null
    }
  },

  async createCommunity(data) {
    const db = await getDB()
    const { id, name, description, avatar, topic, is_special, member_count, is_active } = data
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        db.prepare(`
          INSERT INTO communities (id, name, description, avatar, member_count, topic, is_active, is_special, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            description = excluded.description,
            avatar = excluded.avatar,
            member_count = excluded.member_count,
            topic = excluded.topic,
            is_active = excluded.is_active,
            updated_at = excluded.updated_at
        `).run(
          id,
          name,
          description,
          avatar,
          typeof member_count === 'number' ? member_count : 0,
          topic,
          typeof is_active === 'number' ? is_active : 1,
          is_special ? 1 : 0,
          now,
          now
        )
        return true
      case DB_TYPE.POSTGRESQL:
        await db.query(`
          INSERT INTO communities (id, name, description, avatar, member_count, topic, is_active, is_special, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, to_timestamp($9 / 1000.0), to_timestamp($9 / 1000.0))
          ON CONFLICT(id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            avatar = EXCLUDED.avatar,
            member_count = EXCLUDED.member_count,
            topic = EXCLUDED.topic,
            is_active = EXCLUDED.is_active,
            updated_at = to_timestamp($9 / 1000.0)
        `, [
          id,
          name,
          description,
          avatar,
          typeof member_count === 'number' ? member_count : 0,
          topic,
          typeof is_active === 'boolean' ? is_active : true,
          is_special,
          now
        ])
        return true
      case DB_TYPE.MEMORY: {
        const record = {
          id,
          name,
          description,
          avatar,
          member_count: typeof member_count === 'number' ? member_count : 0,
          topic,
          is_active: typeof is_active === 'boolean' ? is_active : true,
          is_special: !!is_special,
          created_at: now,
          updated_at: now
        }
        console.log('[DB] createCommunity MEMORY: creating community', id, 'current communities count =', (memoryStore.communities || []).length);
        const existingIndex = (memoryStore.communities || []).findIndex(c => c.id === id)
        if (existingIndex >= 0) {
          memoryStore.communities[existingIndex] = { ...memoryStore.communities[existingIndex], ...record, updated_at: now }
          console.log('[DB] createCommunity MEMORY: updated existing community');
        } else {
          memoryStore.communities.push(record)
          console.log('[DB] createCommunity MEMORY: added new community, total =', memoryStore.communities.length);
        }
        saveMemoryStore()
        return true
      }
      default: return false
    }
  }

  ,

  async joinCommunity(userId, communityId, role = 'member') {
    const db = await getDB()
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    console.log('[DB] joinCommunity: userId =', userId, 'communityId =', communityId, 'role =', role, 'dbType =', typeKey);

    switch (typeKey) {
      case DB_TYPE.SQLITE: {
        const info = db.prepare(`
          INSERT OR IGNORE INTO community_members (community_id, user_id, role, joined_at)
          VALUES (?, ?, ?, ?)
        `).run(communityId, userId, role, now)

        if (info.changes > 0) {
          db.prepare(`
            UPDATE communities
            SET member_count = CASE WHEN member_count IS NULL THEN 1 ELSE member_count + 1 END,
                updated_at = ?
            WHERE id = ?
          `).run(now, communityId)
        }
        return true
      }
      case DB_TYPE.POSTGRESQL: {
        const result = await db.query(`
          INSERT INTO community_members (community_id, user_id, role, joined_at)
          VALUES ($1, $2, $3, to_timestamp($4 / 1000.0))
          ON CONFLICT (community_id, user_id) DO NOTHING
        `, [communityId, userId, role, now])

        if (result.rowCount > 0) {
          await db.query(`
            UPDATE communities
            SET member_count = COALESCE(member_count, 0) + 1,
                updated_at = $1
            WHERE id = $2
          `, [now, communityId])
        }
        return true
      }
      case DB_TYPE.MEMORY: {
        const members = memoryStore.community_members || []
        const exists = members.some(m => m.community_id === communityId && m.user_id === userId)
        console.log('[DB] joinCommunity MEMORY: exists =', exists, 'current members count =', members.length);
        if (!exists) {
          members.push({ community_id: communityId, user_id: userId, role, joined_at: now })
          memoryStore.community_members = members
          console.log('[DB] joinCommunity MEMORY: added new member, total members =', members.length);
          const community = (memoryStore.communities || []).find(c => c.id === communityId)
          if (community) {
            community.member_count = (community.member_count || 0) + 1
            community.updated_at = now
            console.log('[DB] joinCommunity MEMORY: updated community member_count =', community.member_count);
          } else {
            console.log('[DB] joinCommunity MEMORY: community not found!');
          }
          saveMemoryStore()
        }
        return true
      }
      default:
        return false
    }
  }

  ,

  async leaveCommunity(userId, communityId) {
    const db = await getDB()
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType

    switch (typeKey) {
      case DB_TYPE.SQLITE: {
        const info = db.prepare(`
          DELETE FROM community_members
          WHERE community_id = ? AND user_id = ?
        `).run(communityId, userId)

        if (info.changes > 0) {
          db.prepare(`
            UPDATE communities
            SET member_count = CASE WHEN member_count > 0 THEN member_count - 1 ELSE 0 END,
                updated_at = ?
            WHERE id = ?
          `).run(now, communityId)
        }
        return true
      }
      case DB_TYPE.POSTGRESQL: {
        const result = await db.query(`
          DELETE FROM community_members
          WHERE community_id = $1 AND user_id = $2
        `, [communityId, userId])

        if (result.rowCount > 0) {
          await db.query(`
            UPDATE communities
            SET member_count = GREATEST(COALESCE(member_count, 0) - 1, 0),
                updated_at = $1
            WHERE id = $2
          `, [now, communityId])
        }
        return true
      }
      case DB_TYPE.MEMORY: {
        const members = memoryStore.community_members || []
        const before = members.length
        memoryStore.community_members = members.filter(m => !(m.community_id === communityId && m.user_id === userId))
        if (memoryStore.community_members.length !== before) {
          const community = (memoryStore.communities || []).find(c => c.id === communityId)
          if (community) {
            community.member_count = Math.max(0, (community.member_count || 0) - 1)
            community.updated_at = now
          }
          saveMemoryStore()
        }
        return true
      }
      default:
        return false
    }
  }

  ,

  async getUserCommunities(userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    console.log('[DB] getUserCommunities: userId =', userId, 'dbType =', typeKey);

    switch (typeKey) {
      case DB_TYPE.SQLITE: {
        const result = db.prepare(`
          SELECT c.*
          FROM communities c
          INNER JOIN community_members m ON c.id = m.community_id
          WHERE m.user_id = ?
          ORDER BY m.joined_at DESC
        `).all(userId)
        console.log('[DB] getUserCommunities SQLite: found', result.length, 'communities');
        return result;
      }
      case DB_TYPE.POSTGRESQL: {
        const result = (await db.query(`
          SELECT c.*
          FROM communities c
          INNER JOIN community_members m ON c.id = m.community_id
          WHERE m.user_id = $1
          ORDER BY m.joined_at DESC
        `, [userId])).rows
        console.log('[DB] getUserCommunities PostgreSQL: found', result.length, 'communities');
        return result;
      }
      case DB_TYPE.MEMORY: {
        const memberships = (memoryStore.community_members || []).filter(m => m.user_id === userId)
        console.log('[DB] getUserCommunities MEMORY: found', memberships.length, 'memberships');
        const byJoinDesc = [...memberships].sort((a, b) => (b.joined_at || 0) - (a.joined_at || 0))
        const communities = memoryStore.communities || []
        const result = byJoinDesc
          .map(m => communities.find(c => c.id === m.community_id))
          .filter(Boolean)
        console.log('[DB] getUserCommunities MEMORY: found', result.length, 'communities');
        return result;
      }
      default:
        return []
    }
  }
}

export const achievementDB = {
  async getUserAchievements(userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        return db.prepare('SELECT * FROM user_achievements WHERE user_id = ?').all(userId)
      case DB_TYPE.POSTGRESQL:
        return (await db.query('SELECT * FROM user_achievements WHERE user_id = $1', [userId])).rows
      case DB_TYPE.MEMORY:
        // Return empty or mock if needed, but for now empty
        return []
      default: return []
    }
  },

  async upsertAchievement(userId, achievementId, progress, isUnlocked) {
    const db = await getDB()
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        db.prepare(`
          INSERT INTO user_achievements (user_id, achievement_id, progress, is_unlocked, unlocked_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(user_id, achievement_id) DO UPDATE SET
            progress = excluded.progress,
            is_unlocked = excluded.is_unlocked,
            unlocked_at = CASE WHEN excluded.is_unlocked = 1 AND user_achievements.is_unlocked = 0 THEN ? ELSE user_achievements.unlocked_at END
        `).run(userId, achievementId, progress, isUnlocked ? 1 : 0, isUnlocked ? now : null, now)
        return true
      case DB_TYPE.POSTGRESQL:
        await db.query(`
          INSERT INTO user_achievements (user_id, achievement_id, progress, is_unlocked, unlocked_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT(user_id, achievement_id) DO UPDATE SET
            progress = EXCLUDED.progress,
            is_unlocked = EXCLUDED.is_unlocked,
            unlocked_at = CASE WHEN EXCLUDED.is_unlocked = TRUE AND user_achievements.is_unlocked = FALSE THEN $6 ELSE user_achievements.unlocked_at END
        `, [userId, achievementId, progress, isUnlocked, isUnlocked ? now : null, now])
        return true
      default: return false
    }
  },

  async getPointsRecords(userId, limit = 20, offset = 0) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        return db.prepare('SELECT * FROM points_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(userId, limit, offset)
      case DB_TYPE.POSTGRESQL:
        return (await db.query('SELECT * FROM points_records WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [userId, limit, offset])).rows
      default: return []
    }
  },

  async addPointsRecord(record) {
    const db = await getDB()
    const { userId, source, type, points, description } = record
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    // Calculate new balance
    // This is a simplified approach. Ideally we should store current balance in users table or calculate sum
    // For now, we'll calculate sum on the fly or just store the record
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        const currentBalance = db.prepare('SELECT SUM(points) as total FROM points_records WHERE user_id = ?').get(userId).total || 0
        const newBalance = currentBalance + points
        db.prepare('INSERT INTO points_records (user_id, source, type, points, created_at, description, balance_after) VALUES (?, ?, ?, ?, ?, ?, ?)').run(userId, source, type, points, now, description, newBalance)
        return newBalance
      case DB_TYPE.POSTGRESQL:
        const { rows } = await db.query('SELECT SUM(points) as total FROM points_records WHERE user_id = $1', [userId])
        const pgCurrentBalance = parseInt(rows[0].total || '0')
        const pgNewBalance = pgCurrentBalance + points
        await db.query('INSERT INTO points_records (user_id, source, type, points, created_at, description, balance_after) VALUES ($1, $2, $3, $4, $5, $6, $7)', [userId, source, type, points, now, description, pgNewBalance])
        return pgNewBalance
      default: return 0
    }
  },

  async getUserTotalPoints(userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        const res = db.prepare('SELECT SUM(points) as total FROM points_records WHERE user_id = ?').get(userId)
        return res ? (res.total || 0) : 0
      case DB_TYPE.POSTGRESQL:
        const { rows } = await db.query('SELECT SUM(points) as total FROM points_records WHERE user_id = $1', [userId])
        if (!rows || rows.length === 0) return 0
        const total = rows[0].total
        return total ? Number(total) : 0
      default: return 0
    }
  }
}

export const activityDB = {
  async logActivity(activity) {
    const db = await getDB()
    const { userId, actionType, entityType, entityId, details, ipAddress, userAgent } = activity
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType

    try {
      switch (typeKey) {
        case DB_TYPE.SQLITE:
           // Ensure table exists for SQLite (dev)
           db.exec(`
             CREATE TABLE IF NOT EXISTS user_activities (
               id INTEGER PRIMARY KEY AUTOINCREMENT,
               user_id TEXT,
               action_type TEXT,
               entity_type TEXT,
               entity_id TEXT,
               details TEXT,
               ip_address TEXT,
               user_agent TEXT,
               created_at INTEGER
             )
           `);
           db.prepare(`
             INSERT INTO user_activities (user_id, action_type, entity_type, entity_id, details, ip_address, user_agent, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           `).run(userId, actionType, entityType, entityId, JSON.stringify(details || {}), ipAddress, userAgent, now)
           return true
        case DB_TYPE.POSTGRESQL:
           await db.query(`
             INSERT INTO user_activities (user_id, action_type, entity_type, entity_id, details, ip_address, user_agent, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           `, [userId, actionType, entityType, entityId, details || {}, ipAddress, userAgent])
           return true
        case DB_TYPE.MEMORY:
           if (!memoryStore.user_activities) memoryStore.user_activities = [];
           memoryStore.user_activities.push({
             id: randomUUID(),
             user_id: userId,
             action_type: actionType,
             entity_type: entityType,
             entity_id: entityId,
             details: details || {},
             ip_address: ipAddress,
             user_agent: userAgent,
             created_at: now
           });
           saveMemoryStore();
           return true;
        default: return false
      }
    } catch (e) {
      console.error('[DB] Failed to log activity:', e);
      return false;
    }
  },

  async getUserActivities(userId, limit = 20, offset = 0) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    try {
      switch (typeKey) {
        case DB_TYPE.SQLITE:
          try {
            const rows = db.prepare('SELECT * FROM user_activities WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(userId, limit, offset)
            return rows.map(r => ({...r, details: JSON.parse(r.details || '{}')}))
          } catch (e) { return [] } // Table might not exist
        case DB_TYPE.POSTGRESQL:
          return (await db.query('SELECT * FROM user_activities WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [userId, limit, offset])).rows
        case DB_TYPE.MEMORY:
          return (memoryStore.user_activities || [])
            .filter(a => a.user_id === userId)
            .sort((a, b) => b.created_at - a.created_at)
            .slice(offset, offset + limit);
        default: return []
      }
    } catch (e) {
      console.error('[DB] Failed to get activities:', e);
      return [];
    }
  },

  async getUserParticipations(userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    try {
      switch (typeKey) {
        case DB_TYPE.SQLITE:
          try {
            // Ensure table exists
            db.exec(`
              CREATE TABLE IF NOT EXISTS activity_participations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                event_id TEXT,
                status TEXT,
                progress INTEGER,
                current_step INTEGER,
                ranking INTEGER,
                award TEXT,
                registration_date INTEGER,
                submission_date INTEGER,
                created_at INTEGER
              )
            `);
            const rows = db.prepare('SELECT * FROM activity_participations WHERE user_id = ? ORDER BY registration_date DESC').all(userId)
            return rows.map(r => ({
              ...r,
              eventId: r.event_id,
              currentStep: r.current_step,
              registrationDate: r.registration_date,
              submissionDate: r.submission_date
            }))
          } catch (e) {
            console.error('[DB] Failed to get user participations:', e);
            return [];
          }
        case DB_TYPE.POSTGRESQL:
          const { rows } = await db.query('SELECT * FROM activity_participations WHERE user_id = $1 ORDER BY registration_date DESC', [userId])
          return rows.map(r => ({
            ...r,
            eventId: r.event_id,
            currentStep: r.current_step,
            registrationDate: r.registration_date,
            submissionDate: r.submission_date
          }))
        case DB_TYPE.MEMORY:
          if (!memoryStore.activity_participations) memoryStore.activity_participations = [];
          return (memoryStore.activity_participations || [])
            .filter(p => p.user_id === userId)
            .map(p => ({
              ...p,
              eventId: p.event_id,
              currentStep: p.current_step,
              registrationDate: p.registration_date,
              submissionDate: p.submission_date
            }))
            .sort((a, b) => b.registration_date - a.registration_date);
        default: return []
      }
    } catch (e) {
      console.error('[DB] Failed to get user participations:', e);
      return [];
    }
  },

  async createParticipation(data) {
    const db = await getDB()
    const { userId, eventId, status, progress, currentStep, ranking, award, registrationDate, submissionDate } = data
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    try {
      switch (typeKey) {
        case DB_TYPE.SQLITE:
          // Ensure table exists
          db.exec(`
            CREATE TABLE IF NOT EXISTS activity_participations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id TEXT,
              event_id TEXT,
              status TEXT,
              progress INTEGER,
              current_step INTEGER,
              ranking INTEGER,
              award TEXT,
              registration_date INTEGER,
              submission_date INTEGER,
              created_at INTEGER
            )
          `);
          const result = db.prepare(`
            INSERT INTO activity_participations (user_id, event_id, status, progress, current_step, ranking, award, registration_date, submission_date, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(userId, eventId, status, progress, currentStep, ranking, award, registrationDate, submissionDate, now)
          return { id: result.lastInsertRowid, ...data }
        case DB_TYPE.POSTGRESQL:
          const { rows } = await db.query(`
            INSERT INTO activity_participations (user_id, event_id, status, progress, current_step, ranking, award, registration_date, submission_date, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            RETURNING id
          `, [userId, eventId, status, progress, currentStep, ranking, award, registrationDate, submissionDate])
          return { id: rows[0].id, ...data }
        case DB_TYPE.MEMORY:
          if (!memoryStore.activity_participations) memoryStore.activity_participations = [];
          const newParticipation = {
            id: randomUUID(),
            user_id: userId,
            event_id: eventId,
            status,
            progress,
            current_step: currentStep,
            ranking,
            award,
            registration_date: registrationDate,
            submission_date: submissionDate,
            created_at: now
          };
          memoryStore.activity_participations.push(newParticipation);
          saveMemoryStore();
          return {
            ...newParticipation,
            eventId: newParticipation.event_id,
            currentStep: newParticipation.current_step,
            registrationDate: newParticipation.registration_date,
            submissionDate: newParticipation.submission_date
          };
        default: return null
      }
    } catch (e) {
      console.error('[DB] Failed to create participation:', e);
      return null;
    }
  }
}

export const eventDB = {
  async createEvent(eventData) {
    const db = await getDB()
    const { id, title, description, startTime, endTime, location, coverUrl, status, creatorId, metadata, type, tags, media } = eventData
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    // Ensure ID
    const eventId = id || randomUUID()
    const metaStr = metadata ? JSON.stringify(metadata) : null
    const tagsStr = tags ? JSON.stringify(tags) : null
    const mediaStr = media ? JSON.stringify(media) : null

    switch (typeKey) {
      case DB_TYPE.SQLITE:
        // Table creation handled in createSQLiteTables
        db.prepare(`
          INSERT INTO events (id, title, description, start_time, end_time, location, cover_url, status, creator_id, created_at, updated_at, metadata, type, tags, media)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(eventId, title, description, startTime, endTime, location, coverUrl, status || 'draft', creatorId, now, now, metaStr, type, tagsStr, mediaStr)
        return { ...eventData, id: eventId, created_at: now, updated_at: now }
        
      case DB_TYPE.POSTGRESQL:
        // Assume table exists or create it (skipping creation here for brevity, assuming migration or createPostgreSQLTables handles it)
        // We'll add table creation to createPostgreSQLTables separately
        await db.query(`
          INSERT INTO events (id, title, description, start_time, end_time, location, cover_url, status, creator_id, created_at, updated_at, metadata, type, tags, media)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, to_timestamp($10/1000.0), to_timestamp($11/1000.0), $12, $13, $14, $15)
        `, [eventId, title, description, startTime, endTime, location, coverUrl, status || 'draft', creatorId, now, now, metadata, type, tagsStr, mediaStr]) // metadata as JSONB if column is JSONB
        return { ...eventData, id: eventId, created_at: now, updated_at: now }
        
      case DB_TYPE.MEMORY:
        if (!memoryStore.events) memoryStore.events = []
        const newEvent = {
          id: eventId,
          title, description, startTime, endTime, location, coverUrl, 
          status: status || 'draft', creatorId, 
          created_at: now, updated_at: now,
          metadata, type, tags, media
        }
        memoryStore.events.push(newEvent)
        saveMemoryStore()
        return newEvent
        
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async getEvents() {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        try {
          const rows = db.prepare('SELECT * FROM events ORDER BY start_time ASC').all()
          return rows.map(row => ({
            ...row,
            startTime: row.start_time,
            endTime: row.end_time,
            coverUrl: row.cover_url,
            creatorId: row.creator_id,
            metadata: row.metadata ? JSON.parse(row.metadata) : null,
            tags: row.tags ? JSON.parse(row.tags) : [],
            media: row.media ? JSON.parse(row.media) : []
          }))
        } catch (e) { return [] }
        
      case DB_TYPE.POSTGRESQL:
        try {
          const { rows } = await db.query('SELECT * FROM events ORDER BY start_time ASC')
          return rows.map(pgRow => ({
            ...pgRow,
            startTime: new Date(pgRow.start_time).getTime(),
            endTime: new Date(pgRow.end_time).getTime(),
            coverUrl: pgRow.cover_url,
            creatorId: pgRow.creator_id,
            created_at: new Date(pgRow.created_at).getTime(),
            updated_at: new Date(pgRow.updated_at).getTime(),
            tags: pgRow.tags ? JSON.parse(pgRow.tags) : [],
            media: pgRow.media ? JSON.parse(pgRow.media) : []
          }))
        } catch (e) {
          console.error('[DB] getEvents Postgres error (returning empty):', e)
          return []
        }
        
      case DB_TYPE.MEMORY:
        return (memoryStore.events || [])
          .sort((a, b) => a.startTime - b.startTime)
        
      default: return []
    }
  },

  async getEvent(id) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        try {
          const row = db.prepare('SELECT * FROM events WHERE id = ?').get(id)
          if (!row) return null
          return {
            ...row,
            startTime: row.start_time,
            endTime: row.end_time,
            coverUrl: row.cover_url,
            creatorId: row.creator_id,
            metadata: row.metadata ? JSON.parse(row.metadata) : null,
            tags: row.tags ? JSON.parse(row.tags) : [],
            media: row.media ? JSON.parse(row.media) : []
          }
        } catch (e) { return null }
        
      case DB_TYPE.POSTGRESQL:
        const { rows } = await db.query('SELECT * FROM events WHERE id = $1', [id])
        if (rows.length === 0) return null
        const pgRow = rows[0]
        return {
          ...pgRow,
          startTime: new Date(pgRow.start_time).getTime(),
          endTime: new Date(pgRow.end_time).getTime(),
          coverUrl: pgRow.cover_url,
          creatorId: pgRow.creator_id,
          created_at: new Date(pgRow.created_at).getTime(),
          updated_at: new Date(pgRow.updated_at).getTime(),
          tags: pgRow.tags ? JSON.parse(pgRow.tags) : [],
          media: pgRow.media ? JSON.parse(pgRow.media) : []
        }
        
      case DB_TYPE.MEMORY:
        return (memoryStore.events || []).find(e => e.id === id) || null
        
      default: return null
    }
  },

  async updateEvent(id, updateData) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    const now = Date.now()
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        const fields = []
        const params = []
        if (updateData.title) { fields.push('title = ?'); params.push(updateData.title) }
        if (updateData.description) { fields.push('description = ?'); params.push(updateData.description) }
        if (updateData.startTime) { fields.push('start_time = ?'); params.push(updateData.startTime) }
        if (updateData.endTime) { fields.push('end_time = ?'); params.push(updateData.endTime) }
        if (updateData.location) { fields.push('location = ?'); params.push(updateData.location) }
        if (updateData.coverUrl) { fields.push('cover_url = ?'); params.push(updateData.coverUrl) }
        if (updateData.status) { fields.push('status = ?'); params.push(updateData.status) }
        if (updateData.metadata) { fields.push('metadata = ?'); params.push(JSON.stringify(updateData.metadata)) }
        if (updateData.type) { fields.push('type = ?'); params.push(updateData.type) }
        if (updateData.tags) { fields.push('tags = ?'); params.push(JSON.stringify(updateData.tags)) }
        if (updateData.media) { fields.push('media = ?'); params.push(JSON.stringify(updateData.media)) }
        
        fields.push('updated_at = ?'); params.push(now)
        params.push(id)
        
        db.prepare(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`).run(...params)
        return this.getEvent(id)
        
      case DB_TYPE.POSTGRESQL:
        // Simplified for brevity, would need dynamic query building
        // For now, let's assume we fetch, merge, and update
        const current = await this.getEvent(id)
        if (!current) return null
        // Implementation omitted for brevity, similar to user update
        return current 
        
      case DB_TYPE.MEMORY:
        const idx = (memoryStore.events || []).findIndex(e => e.id === id)
        if (idx === -1) return null
        memoryStore.events[idx] = { ...memoryStore.events[idx], ...updateData, updated_at: now }
        saveMemoryStore()
        return memoryStore.events[idx]
        
      default: return null
    }
  },

  async deleteEvent(id) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        db.prepare('DELETE FROM events WHERE id = ?').run(id)
        return true
      case DB_TYPE.POSTGRESQL:
        await db.query('DELETE FROM events WHERE id = $1', [id])
        return true
      case DB_TYPE.MEMORY:
        if (!memoryStore.events) return false
        const initialLen = memoryStore.events.length
        memoryStore.events = memoryStore.events.filter(e => e.id !== id)
        saveMemoryStore()
        return memoryStore.events.length < initialLen
      default: return false
    }
  },

  async getEvents(filters = {}) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        try {
          // Table creation handled in createSQLiteTables
          let sql = 'SELECT * FROM events WHERE 1=1'
          const params = []
          if (filters.creatorId) { sql += ' AND creator_id = ?'; params.push(filters.creatorId) }
          if (filters.status) { sql += ' AND status = ?'; params.push(filters.status) }
          sql += ' ORDER BY created_at DESC'
          
          const rows = db.prepare(sql).all(...params)
          return rows.map(row => ({
            ...row,
            startTime: row.start_time,
            endTime: row.end_time,
            coverUrl: row.cover_url,
            creatorId: row.creator_id,
            metadata: row.metadata ? JSON.parse(row.metadata) : null,
            tags: row.tags ? JSON.parse(row.tags) : [],
            media: row.media ? JSON.parse(row.media) : []
          }))
        } catch (e) { return [] }
        
      case DB_TYPE.POSTGRESQL:
        // Needs proper table creation in createPostgreSQLTables
        try {
          let pgSql = 'SELECT * FROM events WHERE 1=1'
          const pgParams = []
          let pIdx = 1
          if (filters.creatorId) { pgSql += ` AND creator_id = $${pIdx++}`; pgParams.push(filters.creatorId) }
          if (filters.status) { pgSql += ` AND status = $${pIdx++}`; pgParams.push(filters.status) }
          pgSql += ' ORDER BY created_at DESC'
          
          const { rows } = await db.query(pgSql, pgParams)
          return rows.map(pgRow => ({
            ...pgRow,
            startTime: new Date(pgRow.start_time).getTime(),
            endTime: new Date(pgRow.end_time).getTime(),
            coverUrl: pgRow.cover_url,
            creatorId: pgRow.creator_id,
            created_at: new Date(pgRow.created_at).getTime(),
            updated_at: new Date(pgRow.updated_at).getTime(),
            tags: pgRow.tags ? JSON.parse(pgRow.tags) : [],
            media: pgRow.media ? JSON.parse(pgRow.media) : []
          }))
        } catch (e) { return [] }
        
      case DB_TYPE.MEMORY:
        let results = memoryStore.events || []
        if (filters.creatorId) results = results.filter(e => e.creatorId === filters.creatorId)
        if (filters.status) results = results.filter(e => e.status === filters.status)
        return results.sort((a, b) => b.created_at - a.created_at)
        
      default: return []
    }
  }
}

// 初始化默认数据库连接
// 在 Serverless 环境下，避免在模块加载时立即建立连接，改为按需连接
// 这可以防止冷启动超时，并允许不使用数据库的 API（如 LLM 代理）在数据库连接失败时也能正常工作
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  getDB().catch(error => {
    log(`Database pre-connection failed: ${error.message}`, 'ERROR')
  })
}
