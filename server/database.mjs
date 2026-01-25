
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
  post_tags: []
}

// JSON持久化路径
const JSON_DB_PATH = path.join(process.cwd(), 'server', 'data', 'backup.json');

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

// 日志助手
const log = (msg, level = 'INFO') => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [DB:${level}] ${msg}`)
}

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
      max: parseInt(process.env.POSTGRES_MAX_POOL_SIZE || '20'), // 连接池最大连接数
      idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000'), // 空闲连接超时
      connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || '10000'), // 连接超时
      // SSL 配置：Supabase/Neon 通常需要 SSL。本地开发可能不需要。
      ssl: (connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')) ? {
        rejectUnauthorized: false // 允许自签名证书 (Supabase 兼容性)
      } : false
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
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
            sms_verification_expires INTEGER
          );
        `)
    
    // 尝试添加新列 (兼容旧数据库)
    const columns = [
      'age INTEGER',
      'tags TEXT',
      "membership_level TEXT DEFAULT 'free'",
      "membership_status TEXT DEFAULT 'active'",
      'membership_start INTEGER',
      'membership_end INTEGER',
      'email_login_code TEXT',
      'email_login_expires INTEGER',
      'github_id TEXT UNIQUE',
      'github_username TEXT',
      "auth_provider TEXT DEFAULT 'local'"
    ]

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
    
    // 创建数据库迁移表
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      );
    `)
    
    // 创建索引
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_video_tasks_status ON video_tasks(status);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_video_tasks_created_at ON video_tasks(created_at);`)
    
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
  const { dbType } = config
  
  // Normalize SUPABASE to POSTGRESQL for the instance manager
  const typeKey = (dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : dbType

  switch (typeKey) {
    case DB_TYPE.SQLITE:
      if (!dbInstances.sqlite || !connectionStatus.sqlite.connected) {
        dbInstances.sqlite = await getDBWithRetry(initSQLite, DB_TYPE.SQLITE)
      }
      return dbInstances.sqlite
      
    case DB_TYPE.MONGODB:
      if (!dbInstances.mongodb || !connectionStatus.mongodb.connected) {
        dbInstances.mongodb = await getDBWithRetry(initMongoDB, DB_TYPE.MONGODB)
      }
      return dbInstances.mongodb.db
      
    case DB_TYPE.POSTGRESQL:
      if (!dbInstances.postgresql || !connectionStatus.postgresql.connected) {
        dbInstances.postgresql = await getDBWithRetry(initPostgreSQL, DB_TYPE.POSTGRESQL)
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
      throw new Error(`Unsupported DB Type: ${dbType}`)
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
        // SQLite usually uses AUTOINCREMENT, but we can try to force ID if needed or ignore it.
        // For simplicity, we stick to AUTOINCREMENT for SQLite unless we change schema to UUID.
        // Schema says: id INTEGER PRIMARY KEY AUTOINCREMENT. So we can't easily insert UUID string.
        // We will ignore custom ID for SQLite for now as it's dev only.
        return db.prepare(`
          INSERT INTO users (
            username, email, password_hash, phone, avatar_url, interests, age, tags, 
            membership_level, membership_status, membership_start, membership_end,
            created_at, updated_at, github_id, github_username, auth_provider
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING id
        `).get(
          username, normalizedEmail, password_hash, phone, avatar_url, interests, age, tags,
          membership_level, membership_status, membershipStart, membership_end,
          now, now, github_id, github_username, auth_provider
        )
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
        if (interests !== undefined) { updateFields.push(`interests = ?`); params.push(interests); }
        if (age !== undefined) { updateFields.push(`age = ?`); params.push(age); }
        if (tags !== undefined) { updateFields.push(`tags = ?`); params.push(tags); }
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
        const updateSql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ? RETURNING *`
        return db.prepare(updateSql).get(...params)

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
        let pgParamIndex = 1
        if (username) { pgUpdateFields.push(`username = $${pgParamIndex++}`); pgParams.push(username) }
        if (email) { pgUpdateFields.push(`email = $${pgParamIndex++}`); pgParams.push(email) }
        if (password_hash) { pgUpdateFields.push(`password_hash = $${pgParamIndex++}`); pgParams.push(password_hash) }
        if (phone !== undefined) { pgUpdateFields.push(`phone = $${pgParamIndex++}`); pgParams.push(phone) }
        if (avatar_url !== undefined) { pgUpdateFields.push(`avatar_url = $${pgParamIndex++}`); pgParams.push(avatar_url) }
        if (interests !== undefined) { pgUpdateFields.push(`interests = $${pgParamIndex++}`); pgParams.push(interests) }
        if (age !== undefined) { pgUpdateFields.push(`age = $${pgParamIndex++}`); pgParams.push(age) }
        if (tags !== undefined) { pgUpdateFields.push(`tags = $${pgParamIndex++}`); pgParams.push(tags) }
        if (membership_level) { pgUpdateFields.push(`membership_level = $${pgParamIndex++}`); pgParams.push(membership_level) }
        if (membership_status) { pgUpdateFields.push(`membership_status = $${pgParamIndex++}`); pgParams.push(membership_status) }
        if (membership_start) { pgUpdateFields.push(`membership_start = $${pgParamIndex++}`); pgParams.push(membership_start) }
        if (membership_end !== undefined) { pgUpdateFields.push(`membership_end = $${pgParamIndex++}`); pgParams.push(membership_end) }
        if (email_verified !== undefined) { pgUpdateFields.push(`email_verified = $${pgParamIndex++}`); pgParams.push(email_verified) }
        if (email_verification_token !== undefined) { pgUpdateFields.push(`email_verification_token = $${pgParamIndex++}`); pgParams.push(email_verification_token) }
        if (email_verification_expires !== undefined) { pgUpdateFields.push(`email_verification_expires = $${pgParamIndex++}`); pgParams.push(email_verification_expires) }
        if (metadata !== undefined) { pgUpdateFields.push(`metadata = $${pgParamIndex++}`); pgParams.push(metadata); }
        
        // 关键修复：确保 updated_at 使用 PostgreSQL 的 NOW() 函数，而不是 JavaScript 的 timestamp
        // 否则如果 updated_at 字段类型是 timestamp with time zone，传入 int 会报错
        pgUpdateFields.push(`updated_at = NOW()`)
        
        pgParams.push(id)
        if (pgUpdateFields.length === 1) return this.findById(id)
        
        // id 参数索引是最后一个
        const pgUpdateSql = `UPDATE users SET ${pgUpdateFields.join(', ')} WHERE id = $${pgParamIndex} RETURNING *`
        try {
          return (await db.query(pgUpdateSql, pgParams)).rows[0]
        } catch (error) {
          // 如果是 email_verified 列不存在错误，尝试忽略该字段更新
          if (error.code === '42703' && error.message.includes('email_verified')) {
             console.warn('[DB] email_verified column missing, retrying update without it');
             // 移除 email_verified 相关参数
             const newFields = pgUpdateFields.filter(f => !f.startsWith('email_verified'));
             // 重新构建参数数组（比较复杂，简单起见只重试核心字段或抛出更友好错误）
             // 由于参数索引错位问题，这里简单地抛出警告，建议运行迁移脚本
             throw new Error('Database schema mismatch: Missing email_verified column. Please run database migrations.');
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
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE: return db.prepare('SELECT * FROM users WHERE email = ?').get(email)
      case DB_TYPE.MEMORY: return memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase())
      case DB_TYPE.MONGODB: return db.collection('users').findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })
      case DB_TYPE.POSTGRESQL: return (await db.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email])).rows[0]
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
          const dummyUser = `user_${Date.now()}_${Math.floor(Math.random()*1000)}`;
          const dummyPass = '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // Dummy hash
          db.prepare('INSERT INTO users (username, password_hash, email, email_login_code, email_login_expires, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(dummyUser, dummyPass, email, code, expiresAt, Date.now(), Date.now())
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
        const pgWhereClause = startTime > 0 ? `WHERE p.created_at >= $1` : ''
        const pgParams = startTime > 0 ? [startTime, limit] : [limit]
        const pgParamOffset = startTime > 0 ? 1 : 0
        return (await db.query(`
          SELECT p.*, u.username, u.avatar_url
          FROM posts p
          LEFT JOIN users u ON p.user_id = u.id
          ${pgWhereClause}
          ORDER BY p.${sortBy} DESC
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
        const pgPostWhereClause = startTime > 0 ? `AND p.created_at >= $1` : ''
        const pgUserParams = startTime > 0 ? [startTime, limit] : [limit]
        const pgUserParamOffset = startTime > 0 ? 1 : 0
        return (await db.query(`
          SELECT u.id, u.username, u.email, u.avatar_url, u.created_at, u.updated_at, COUNT(p.id) as posts_count, COALESCE(SUM(p.likes_count), 0) as total_likes, COALESCE(SUM(p.views), 0) as total_views
          FROM users u
          LEFT JOIN posts p ON u.id = p.user_id ${pgPostWhereClause}
          GROUP BY u.id
          ORDER BY ${sortBy} DESC
          LIMIT $${pgUserParamOffset + 1}
        `, pgUserParams)).rows
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  }
}

export const friendDB = {
  async sendRequest(senderId, receiverId) {
    const db = await getDB()
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
    const db = await getDB()
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
          WHERE (username LIKE ? OR email LIKE ? OR phone LIKE ? OR CAST(id AS TEXT) LIKE ?) AND id != ?
          LIMIT 20
        `).all(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, currentUserId)
        
        // Add status info
        return users.map(u => {
           const statusRow = db.prepare('SELECT status FROM user_status WHERE user_id = ?').get(u.id)
           return { ...u, status: statusRow ? statusRow.status : 'offline' }
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
        return pgSearchUsers.map(u => ({ ...u, status: u.status || 'offline' }))
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
    const db = await getDB()
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
    const db = await getDB()
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
    const db = await getDB()
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
  async getWorksByUserId(userId, limit = 50, offset = 0) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.SQLITE:
        // Assume works table exists in SQLite (migrated earlier)
        return db.prepare('SELECT * FROM works WHERE creator_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(userId, limit, offset)
      case DB_TYPE.MEMORY:
        // Mock data or in-memory store
        // We can use memoryStore.posts as a fallback if works are not separate
        return (memoryStore.works || []).filter(w => w.creator_id === userId).sort((a, b) => b.created_at - a.created_at).slice(offset, offset + limit)
      case DB_TYPE.POSTGRESQL:
        return (await db.query('SELECT * FROM works WHERE creator_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [userId, limit, offset])).rows
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
