
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import dotenv from 'dotenv'
import { Pool } from 'pg'
import { fileURLToPath } from 'url'

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// 加载环境变量
const envPath = path.join(projectRoot, '.env')
const envLocalPath = path.join(projectRoot, '.env.local')

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
  console.log('[DB] 已加载 .env 文件:', envPath)
}
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true })
  console.log('[DB] 已加载 .env.local 文件:', envLocalPath)
}

// 数据库类型枚举
export const DB_TYPE = {
  POSTGRESQL: 'postgresql',
  SUPABASE: 'supabase' // Alias for POSTGRESQL with auto-config
}

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
    // Vercel Serverless 环境必须使用 PostgreSQL
    throw new Error('Vercel environment requires PostgreSQL database. Please set DATABASE_URL or POSTGRES_URL environment variable.');
  }

  // 如果配置了 Supabase 和 PostgreSQL URL，则使用 Supabase
  if (process.env.SUPABASE_URL && process.env.POSTGRES_URL) return DB_TYPE.SUPABASE
  // 如果有数据库 URL，则使用 PostgreSQL
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) return DB_TYPE.POSTGRESQL
  
  // 本地环境也必须使用 PostgreSQL
  throw new Error('PostgreSQL database is required. Please set DATABASE_URL environment variable.');
}

const currentDbType = detectDbType()
const connectionString = getPostgresConnectionString()

// 配置管理
const config = {
  // 数据库类型选择
  dbType: currentDbType,
  
  // PostgreSQL (Supabase/Standard) 配置 - 优化连接池
  postgresql: {
    connectionString: connectionString,
    options: {
      // 连接池大小优化：Supabase Session模式限制最大连接数，使用更小的连接池
      max: parseInt(process.env.POSTGRES_MAX_POOL_SIZE || '3'),
      // 最小连接数：减少空闲连接占用
      min: parseInt(process.env.POSTGRES_MIN_POOL_SIZE || '0'),
      // 空闲连接超时：快速释放不用的连接
      idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '10000'),
      // 连接超时：Vercel环境使用更短的超时（5秒），避免函数超时
      connectionTimeoutMillis: isVercel ? 5000 : parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || '10000'),
      // 连接最大生命周期：防止连接长时间不释放
      maxLifetime: parseInt(process.env.POSTGRES_MAX_LIFETIME || '300000'), // 5分钟
      // SSL 配置：Supabase 通常需要 SSL。本地开发可能不需要。
      ssl: (connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')) ? {
        rejectUnauthorized: false // 允许自签名证书 (Supabase 兼容性)
      } : false,
      // 查询超时设置：Vercel环境使用更短的超时（5秒）
      statement_timeout: isVercel ? 5000 : 30000,
      // 客户端编码设置
      client_encoding: 'UTF8',
      // 连接重试策略
      retry: {
        maxRetries: isVercel ? 1 : 3,
        delay: 500,
        backoff: 'exponential'
      }
    }
  }
}

// 数据库连接实例
let dbInstances = {
  mongodb: null,
  postgresql: null
}

// 连接状态监控
let connectionStatus = {
  mongodb: { connected: false, lastConnected: null, error: null },
  postgresql: { connected: false, lastConnected: null, error: null, poolStatus: {} }
}

// 连接重试计数器
let retryCounts = {
  mongodb: 0,
  postgresql: 0
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
      throw new Error(errorMsg);
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
    
    // 初始化表结构（仅在非Vercel环境执行，避免Serverless冷启动超时）
    if (!isVercel) {
      await createPostgreSQLTables(pool)
    } else {
      console.log('[DB] Vercel环境：跳过表结构初始化，假设表已存在')
    }
    
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
    throw error;
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
          console.log(`[DB] Column ${column} added to ${table} or already exists`)
        } catch (e) {
          console.error(`[DB] Failed to add column ${column} to ${table}:`, e.message)
        }
      }

      // 创建AI分享表（确保表存在，无论 users 表是否存在）
      await client.query(`
        CREATE TABLE IF NOT EXISTS ai_shares (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id TEXT NOT NULL,
          friend_id TEXT,
          title TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          type TEXT,
          share_type TEXT NOT NULL,
          note TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `)
      console.log('[DB] ai_shares table ensured')

      // 创建社区帖子表（确保表存在，无论 users 表是否存在）
      await client.query(`
        CREATE TABLE IF NOT EXISTS community_posts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title VARCHAR(255),
          content TEXT,
          user_id TEXT,
          community_id TEXT,
          community_name VARCHAR(100),
          images TEXT[],
          thumbnail TEXT,
          views INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          comment_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
      await client.query('CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);')
      await client.query('CREATE INDEX IF NOT EXISTS idx_community_posts_community_id ON community_posts(community_id);')
      console.log('[DB] community_posts table ensured')

      // 检查 users 表是否已存在（Supabase 已创建）
      const { rows: existingUsers } = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      `)
      
      if (existingUsers.length > 0) {
        console.log('[DB] Tables already exist (managed by Supabase), checking column types...')
        
        // 检查 posts 表的列
        const { rows: postsColumns } = await client.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'posts'
        `)
        console.log('[DB] Posts table columns:', postsColumns.map(c => c.column_name))

        // 修改字段类型从 UUID 到 TEXT，以匹配 users.id 的类型
        const alterColumnType = async (table, column) => {
          try {
            await client.query(`ALTER TABLE ${table} ALTER COLUMN ${column} TYPE TEXT`)
            console.log(`[DB] Altered ${table}.${column} to TEXT`)
          } catch (e) {
            // 忽略错误（可能已经是 TEXT 类型或列不存在）
          }
        }

        // 修改所有外键字段类型
        await alterColumnType('favorites', 'user_id')
        await alterColumnType('community_members', 'user_id')
        await alterColumnType('communities', 'creator_id')
        await alterColumnType('posts', 'author_id')
        await alterColumnType('works', 'creator_id')
        await alterColumnType('comments', 'user_id')
        await alterColumnType('notifications', 'user_id')
        await alterColumnType('friend_requests', 'sender_id')
        await alterColumnType('friend_requests', 'receiver_id')
        await alterColumnType('friends', 'user_id')
        await alterColumnType('friends', 'friend_id')
        await alterColumnType('direct_messages', 'sender_id')
        await alterColumnType('direct_messages', 'receiver_id')
        await alterColumnType('user_status', 'user_id')
        
        // user_achievements 和 points_records 的 user_id 需要是 UUID 类型
        try {
          await client.query(`ALTER TABLE user_achievements ALTER COLUMN user_id TYPE UUID`)
          console.log('[DB] Altered user_achievements.user_id to UUID')
        } catch (e) {
          console.log('[DB] user_achievements.user_id column type check:', e.message)
        }
        try {
          await client.query(`ALTER TABLE points_records ALTER COLUMN user_id TYPE UUID`)
          console.log('[DB] Altered points_records.user_id to UUID')
        } catch (e) {
          console.log('[DB] points_records.user_id column type check:', e.message)
        }
        
        await alterColumnType('user_activities', 'user_id')
        await alterColumnType('activity_participations', 'user_id')

        // 修改 work_id 列类型为 TEXT 以支持 UUID
        await alterColumnType('comments', 'work_id')

        // 修改 avatar_url 列类型为 TEXT 以支持 Base64 图片数据
        try {
          await client.query(`
            ALTER TABLE users
            ALTER COLUMN avatar_url TYPE TEXT
          `)
          console.log('[DB] Altered users.avatar_url to TEXT')
        } catch (e) {
          // 列可能已经存在或类型已经正确，忽略错误
          if (!e.message.includes('does not exist')) {
            console.log('[DB] users.avatar_url column type check:', e.message)
          }
        }

        // 确保用户统计字段存在（排行榜使用）
        await ensureColumn('users', 'posts_count', 'INTEGER DEFAULT 0')
        await ensureColumn('users', 'likes_count', 'INTEGER DEFAULT 0')
        await ensureColumn('users', 'views', 'INTEGER DEFAULT 0')
        await ensureColumn('users', 'followers_count', 'INTEGER DEFAULT 0')
        await ensureColumn('users', 'following_count', 'INTEGER DEFAULT 0')

        // 确保 posts 表有必要的列
        console.log('[DB] Ensuring posts columns...')
        await ensureColumn('posts', 'community_id', 'TEXT')
        console.log('[DB] Added community_id column')
        await ensureColumn('posts', 'images', 'TEXT[] DEFAULT \'{}\'')
        console.log('[DB] Added images column')
        await ensureColumn('posts', 'videos', 'TEXT[] DEFAULT \'{}\'')
        console.log('[DB] Added videos column')
        await ensureColumn('posts', 'audios', 'TEXT[] DEFAULT \'{}\'')
        console.log('[DB] Added audios column')
        await ensureColumn('posts', 'upvotes', 'INTEGER DEFAULT 0')
        console.log('[DB] Added upvotes column')

        // 确保 comments 表有必要的列
        await ensureColumn('comments', 'work_id', 'TEXT')

        // 确保 notifications 表有必要的列
        await ensureColumn('notifications', 'comment_id', 'TEXT')
        await ensureColumn('notifications', 'post_id', 'TEXT')
        await ensureColumn('notifications', 'work_id', 'TEXT')
        await ensureColumn('notifications', 'sender_id', 'TEXT')
        await ensureColumn('notifications', 'is_read', 'BOOLEAN DEFAULT false')

        // 确保 messages 表有必要的列
        // 注意：user_id 列需要是 UUID 类型以匹配 users.id
        try {
          await client.query(`ALTER TABLE messages ALTER COLUMN user_id TYPE UUID`)
          console.log('[DB] Altered messages.user_id to UUID')
        } catch (e) {
          // 列可能不存在或类型已经正确
          await ensureColumn('messages', 'user_id', 'UUID')
        }
        await ensureColumn('messages', 'channel_id', 'TEXT')
        await ensureColumn('messages', 'content', 'TEXT')
        await ensureColumn('messages', 'type', 'VARCHAR(50) DEFAULT \'text\'')
        await ensureColumn('messages', 'metadata', 'JSONB DEFAULT \'{}\'')
        await ensureColumn('messages', 'status', 'VARCHAR(20) DEFAULT \'sent\'')
        await ensureColumn('messages', 'community_id', 'TEXT')
        await ensureColumn('messages', 'role', 'VARCHAR(20) DEFAULT \'user\'')

        // 创建作品收藏表 (work_favorites) - 确保新表被创建
        // 先删除旧表（如果存在）以更新结构
        try {
          await client.query(`DROP TABLE IF EXISTS work_favorites`)
        } catch (e) { /* ignore */ }
        await client.query(`
          CREATE TABLE IF NOT EXISTS work_favorites (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            work_id TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, work_id)
          );
        `)
        await client.query('CREATE INDEX IF NOT EXISTS idx_work_favorites_user_id ON work_favorites(user_id);')
        await client.query('CREATE INDEX IF NOT EXISTS idx_work_favorites_work_id ON work_favorites(work_id);')
        console.log('[DB] work_favorites table ensured')

        // 创建作品点赞表 (work_likes) - 确保新表被创建
        // 先删除旧表（如果存在）以更新结构
        try {
          await client.query(`DROP TABLE IF EXISTS work_likes`)
        } catch (e) { /* ignore */ }
        await client.query(`
          CREATE TABLE IF NOT EXISTS work_likes (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            work_id TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, work_id)
          );
        `)
        await client.query('CREATE INDEX IF NOT EXISTS idx_work_likes_user_id ON work_likes(user_id);')
        await client.query('CREATE INDEX IF NOT EXISTS idx_work_likes_work_id ON work_likes(work_id);')
        console.log('[DB] work_likes table ensured')

        // 创建活动表 (events)
        await client.query(`
          CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            content TEXT,
            start_date BIGINT,
            end_date BIGINT,
            location VARCHAR(255),
            image_url TEXT,
            status VARCHAR(50) DEFAULT 'draft',
            category VARCHAR(50),
            tags TEXT,
            organizer_id TEXT NOT NULL,
            organizer_name VARCHAR(255),
            organizer_avatar TEXT,
            max_participants INTEGER,
            participant_count INTEGER DEFAULT 0,
            visibility VARCHAR(20) DEFAULT 'public',
            created_at BIGINT DEFAULT extract(epoch from now()),
            updated_at BIGINT DEFAULT extract(epoch from now())
          );
        `)
        await client.query('CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);')
        await client.query('CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);')
        await client.query('CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);')
        console.log('[DB] events table ensured')

        // 添加活动时间相关字段（如果不存在）
        await client.query(`ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS registration_deadline BIGINT;`)
        await client.query(`ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS review_start_date BIGINT;`)
        await client.query(`ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS result_date BIGINT;`)
        await client.query(`ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS phase_status VARCHAR(50) DEFAULT 'registration';`)
        // 添加 start_time 和 end_time 字段（timestamp 类型，用于 ISO 格式时间）
        await client.query(`ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;`)
        await client.query(`ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;`)
        // 添加 brand_id 字段（用于品牌过滤）
        await client.query(`ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS brand_id TEXT;`)
        await client.query('CREATE INDEX IF NOT EXISTS idx_events_brand_id ON events(brand_id);')
        console.log('[DB] events time fields ensured')

        console.log('[DB] Column type check completed')
        return
      }

      // 创建用户表 (移除外键约束，使用普通UUID主键)
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          username VARCHAR(20) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          avatar_url TEXT, -- 改为 TEXT 以支持 Base64 图片数据
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
          metadata JSONB,
          -- 统计字段
          posts_count INTEGER DEFAULT 0,
          likes_count INTEGER DEFAULT 0,
          views INTEGER DEFAULT 0,
          followers_count INTEGER DEFAULT 0,
          following_count INTEGER DEFAULT 0
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
      // 用户个人资料字段
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS bio TEXT;`)
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS location VARCHAR(255);`)
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS occupation VARCHAR(255);`)
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS website VARCHAR(255);`)
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS github VARCHAR(255);`)
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS twitter VARCHAR(255);`)
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS cover_image VARCHAR(255);`)
      // 用户统计字段（排行榜使用）
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS posts_count INTEGER DEFAULT 0;`)
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;`)
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;`)
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;`)
      await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;`)
      // Add constraint if not exists (Postgres doesn't support IF NOT EXISTS for constraints easily in one line, skipping unique constraint for now or using a DO block)
      // Simple workaround: just add the column. The unique index can be added separately if critical, but for now app logic handles it.
      
      // 创建收藏表
      await client.query(`
        CREATE TABLE IF NOT EXISTS favorites (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
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
      // 确保 creator_id 字段存在
      await client.query(`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS creator_id TEXT;`)

      // 创建社区成员表
      await client.query(`
        CREATE TABLE IF NOT EXISTS community_members (
          community_id VARCHAR(50) NOT NULL,
          user_id TEXT NOT NULL,
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
        creator_id TEXT NOT NULL,
        category VARCHAR(100),
        tags TEXT,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        votes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `)
      
      // 确保必要的列存在
      await client.query(`ALTER TABLE IF EXISTS works ADD COLUMN IF NOT EXISTS cover_url TEXT;`)
      await client.query(`ALTER TABLE IF EXISTS works ADD COLUMN IF NOT EXISTS media TEXT;`)
      await client.query(`ALTER TABLE IF EXISTS works ADD COLUMN IF NOT EXISTS votes INTEGER DEFAULT 0;`)
      await client.query(`ALTER TABLE IF EXISTS works ADD COLUMN IF NOT EXISTS event_id TEXT;`)
      await client.query(`ALTER TABLE IF EXISTS works ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;`)
      
      await client.query('CREATE INDEX IF NOT EXISTS idx_works_creator_id ON works(creator_id);')
      await client.query('CREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at);')
      await client.query('CREATE INDEX IF NOT EXISTS idx_works_category ON works(category);')
      await client.query('CREATE INDEX IF NOT EXISTS idx_works_event_id ON works(event_id);')

      // 创建作品收藏表 (work_favorites)
      // 先删除旧表（如果存在）以更新结构
      try {
        await client.query(`DROP TABLE IF EXISTS work_favorites`)
      } catch (e) { /* ignore */ }
      await client.query(`
        CREATE TABLE IF NOT EXISTS work_favorites (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          work_id TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, work_id)
        );
      `)
      await client.query('CREATE INDEX IF NOT EXISTS idx_work_favorites_user_id ON work_favorites(user_id);')
      await client.query('CREATE INDEX IF NOT EXISTS idx_work_favorites_work_id ON work_favorites(work_id);')

      // 创建作品点赞表 (work_likes)
      // 先删除旧表（如果存在）以更新结构
      try {
        await client.query(`DROP TABLE IF EXISTS work_likes`)
      } catch (e) { /* ignore */ }
      await client.query(`
        CREATE TABLE IF NOT EXISTS work_likes (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          work_id TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, work_id)
        );
      `)
      await client.query('CREATE INDEX IF NOT EXISTS idx_work_likes_user_id ON work_likes(user_id);')
      await client.query('CREATE INDEX IF NOT EXISTS idx_work_likes_work_id ON work_likes(work_id);')

      // 创建活动参与者表 (event_participants)
      await client.query(`
        CREATE TABLE IF NOT EXISTS event_participants (
          id SERIAL PRIMARY KEY,
          event_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          status VARCHAR(20) DEFAULT 'registered',
          registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(event_id, user_id)
        );
      `)
      await client.query('CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);')
      await client.query('CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);')

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
          user_id TEXT NOT NULL, -- Changed to TEXT
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
      
      // 确保 posts 表有媒体字段
      await ensureColumn('posts', 'images', 'TEXT[] DEFAULT \'{}\'')
      await ensureColumn('posts', 'videos', 'TEXT[] DEFAULT \'{}\'')
      await ensureColumn('posts', 'audios', 'TEXT[] DEFAULT \'{}\'')
      await ensureColumn('posts', 'community_id', 'TEXT')
      
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
          user_id TEXT NOT NULL, -- Changed to TEXT
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
      await ensureColumn('comments', 'user_id', 'TEXT REFERENCES users(id) ON DELETE CASCADE') // Changed to TEXT
      await ensureColumn('comments', 'parent_id', 'INTEGER REFERENCES comments(id) ON DELETE CASCADE')
      await ensureColumn('comments', 'work_id', 'TEXT REFERENCES works(id) ON DELETE CASCADE')
      await ensureColumn('comments', 'images', 'TEXT') // 评论图片支持
      
      // 移除 post_id 的 NOT NULL 约束（因为我们现在支持 work_id）
      try {
        await client.query(`ALTER TABLE comments ALTER COLUMN post_id DROP NOT NULL`)
        console.log('[DB] Removed NOT NULL constraint from comments.post_id')
      } catch (e) {
        // 忽略错误（可能已经是 nullable）
      }
      
      // 创建点赞表
      await client.query(`
        CREATE TABLE IF NOT EXISTS likes (
          user_id TEXT NOT NULL, -- Changed to TEXT
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
      
      // Messages (for community chat)
      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          channel_id TEXT NOT NULL,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'text',
          metadata JSONB DEFAULT '{}',
          status VARCHAR(20) DEFAULT 'sent',
          community_id TEXT,
          role VARCHAR(20) DEFAULT 'user',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- 为messages表启用RLS
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
        
        -- 创建messages表的RLS策略
        CREATE POLICY IF NOT EXISTS messages_select_policy ON messages
          FOR SELECT USING (true);
        CREATE POLICY IF NOT EXISTS messages_insert_policy ON messages
          FOR INSERT WITH CHECK (true);
        CREATE POLICY IF NOT EXISTS messages_update_policy ON messages
          FOR UPDATE USING (true);
        CREATE POLICY IF NOT EXISTS messages_delete_policy ON messages
          FOR DELETE USING (true);
      `)
      
      // 创建messages表的索引
      await createIndex('CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_messages_community_id ON messages(community_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);')

      // Direct Messages
      await client.query(`
        CREATE TABLE IF NOT EXISTS direct_messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- 为direct_messages表启用RLS
        ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
        
        -- 删除旧的宽松策略（如果存在）
        DROP POLICY IF EXISTS direct_messages_select_policy ON direct_messages;
        DROP POLICY IF EXISTS direct_messages_insert_policy ON direct_messages;
        DROP POLICY IF EXISTS direct_messages_update_policy ON direct_messages;
        DROP POLICY IF EXISTS direct_messages_delete_policy ON direct_messages;
      `)

      // Friend Requests
      await client.query(`
        CREATE TABLE IF NOT EXISTS friend_requests (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          friend_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
          user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
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
          user_id TEXT NOT NULL,
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

      // 创建商业化合作申请表
      await client.query(`
        CREATE TABLE IF NOT EXISTS commercial_applications (
          id SERIAL PRIMARY KEY,
          work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
          creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          brand_name VARCHAR(255) NOT NULL,
          brand_logo TEXT,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'negotiating')),
          budget INTEGER,
          description TEXT,
          cultural_elements TEXT[],
          commercial_value INTEGER DEFAULT 0,
          market_potential INTEGER DEFAULT 0,
          submit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
      await createIndex('CREATE INDEX IF NOT EXISTS idx_commercial_applications_status ON commercial_applications(status);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_commercial_applications_creator_id ON commercial_applications(creator_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_commercial_applications_work_id ON commercial_applications(work_id);')

      // 创建商业化申请评论表
      await client.query(`
        CREATE TABLE IF NOT EXISTS commercial_application_comments (
          id SERIAL PRIMARY KEY,
          application_id INTEGER REFERENCES commercial_applications(id) ON DELETE CASCADE,
          author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
      await createIndex('CREATE INDEX IF NOT EXISTS idx_commercial_comments_application_id ON commercial_application_comments(application_id);')

      // 创建系统设置表
      await client.query(`
        CREATE TABLE IF NOT EXISTS site_settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(100) UNIQUE NOT NULL,
          value TEXT,
          category VARCHAR(50) DEFAULT 'general',
          description TEXT,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
      await createIndex('CREATE INDEX IF NOT EXISTS idx_site_settings_category ON site_settings(category);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);')

      // 创建设置历史记录表
      await client.query(`
        CREATE TABLE IF NOT EXISTS settings_history (
          id SERIAL PRIMARY KEY,
          setting_key VARCHAR(100) NOT NULL,
          old_value TEXT,
          new_value TEXT,
          changed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
          changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)

      // 创建广场作品收藏表
      await client.query(`
        CREATE TABLE IF NOT EXISTS works_bookmarks (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, work_id)
        );
      `)
      await createIndex('CREATE INDEX IF NOT EXISTS idx_works_bookmarks_user_id ON works_bookmarks(user_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_works_bookmarks_work_id ON works_bookmarks(work_id);')

      // 创建广场作品点赞表
      await client.query(`
        CREATE TABLE IF NOT EXISTS works_likes (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, work_id)
        );
      `)
      await createIndex('CREATE INDEX IF NOT EXISTS idx_works_likes_user_id ON works_likes(user_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_works_likes_work_id ON works_likes(work_id);')

      // 创建津脉模板收藏表
      await client.query(`
        CREATE TABLE IF NOT EXISTS tianjin_templates (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          thumbnail TEXT,
          category VARCHAR(100),
          tags TEXT,
          usage_count INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
      await createIndex('CREATE INDEX IF NOT EXISTS idx_tianjin_templates_category ON tianjin_templates(category);')

      // 创建模板收藏表
      await client.query(`
        CREATE TABLE IF NOT EXISTS template_favorites (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          template_id INTEGER NOT NULL REFERENCES tianjin_templates(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, template_id)
        );
      `)
      await createIndex('CREATE INDEX IF NOT EXISTS idx_template_favorites_user_id ON template_favorites(user_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_template_favorites_template_id ON template_favorites(template_id);')

      // 创建模板点赞表
      await client.query(`
        CREATE TABLE IF NOT EXISTS template_likes (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          template_id INTEGER NOT NULL REFERENCES tianjin_templates(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, template_id)
        );
      `)
      await createIndex('CREATE INDEX IF NOT EXISTS idx_template_likes_user_id ON template_likes(user_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_template_likes_template_id ON template_likes(template_id);')

      // 创建社区帖子收藏表
      await client.query(`
        CREATE TABLE IF NOT EXISTS community_post_favorites (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          post_id TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, post_id)
        );
      `)
      await createIndex('CREATE INDEX IF NOT EXISTS idx_community_post_favorites_user_id ON community_post_favorites(user_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_community_post_favorites_post_id ON community_post_favorites(post_id);')

      // 创建社区帖子点赞表
      await client.query(`
        CREATE TABLE IF NOT EXISTS community_post_likes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          post_id TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, post_id)
        );
      `)
      await createIndex('CREATE INDEX IF NOT EXISTS idx_community_post_likes_user_id ON community_post_likes(user_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_community_post_likes_post_id ON community_post_likes(post_id);')

      // 创建社区帖子表
      await client.query(`
        CREATE TABLE IF NOT EXISTS community_posts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title VARCHAR(255),
          content TEXT,
          user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
          community_id TEXT,
          community_name VARCHAR(100),
          images TEXT[],
          thumbnail TEXT,
          views INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          comment_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
      await createIndex('CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_community_posts_community_id ON community_posts(community_id);')

      // 创建活动收藏表
      await client.query(`
        CREATE TABLE IF NOT EXISTS event_favorites (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, event_id)
        );
      `)
      await createIndex('CREATE INDEX IF NOT EXISTS idx_event_favorites_user_id ON event_favorites(user_id);')
      await createIndex('CREATE INDEX IF NOT EXISTS idx_event_favorites_event_id ON event_favorites(event_id);')

      // 插入默认设置
      const defaultSettings = [
        // 通用设置
        { key: 'site_name', value: 'AI共创', category: 'general', description: '网站名称' },
        { key: 'site_description', value: 'AI驱动的传统文化创新平台', category: 'general', description: '网站描述' },
        { key: 'maintenance_mode', value: 'false', category: 'general', description: '维护模式' },
        { key: 'registration_enabled', value: 'true', category: 'general', description: '允许注册' },
        { key: 'email_verification', value: 'true', category: 'general', description: '需要邮箱验证' },
        { key: 'default_language', value: 'zh-CN', category: 'general', description: '默认语言' },
        { key: 'timezone', value: 'Asia/Shanghai', category: 'general', description: '时区' },
        // 通知设置
        { key: 'email_notifications', value: 'true', category: 'notifications', description: '邮件通知' },
        { key: 'push_notifications', value: 'true', category: 'notifications', description: '推送通知' },
        { key: 'new_user_alert', value: 'true', category: 'notifications', description: '新用户提醒' },
        { key: 'content_report_alert', value: 'true', category: 'notifications', description: '内容举报提醒' },
        // 安全设置
        { key: 'two_factor_auth', value: 'false', category: 'security', description: '双因素认证' },
        { key: 'login_attempts', value: '5', category: 'security', description: '最大登录尝试次数' },
        { key: 'password_expiry', value: '90', category: 'security', description: '密码过期天数' },
        { key: 'session_timeout', value: '30', category: 'security', description: '会话超时时间(分钟)' },
        { key: 'require_strong_password', value: 'true', category: 'security', description: '要求强密码' },
        // 存储设置
        { key: 'max_upload_size', value: '50', category: 'storage', description: '最大上传大小(MB)' },
        { key: 'allowed_file_types', value: 'jpg,png,gif,mp4,mp3', category: 'storage', description: '允许的文件类型' },
        { key: 'storage_provider', value: 'local', category: 'storage', description: '存储提供商' },
        { key: 'backup_enabled', value: 'true', category: 'storage', description: '启用备份' },
        { key: 'backup_frequency', value: 'daily', category: 'storage', description: '备份频率' },
      ]

      for (const setting of defaultSettings) {
        try {
          await client.query(`
            INSERT INTO site_settings (key, value, category, description)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (key) DO NOTHING
          `, [setting.key, setting.value, setting.category, setting.description])
        } catch (e) {
          // 忽略插入错误
        }
      }

      // 创建RLS策略
      // 1. users表策略：用户只能访问自己的用户信息
      try {
        await client.query(`
          CREATE POLICY "Users can view their own profile" ON users
          FOR SELECT USING (id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::text);
        `);
      } catch (error) {
        if (!error.message.includes('already exists')) throw error;
        // 忽略已存在的策略错误
      }

      try {
        await client.query(`
          CREATE POLICY "Users can update their own profile" ON users
          FOR UPDATE USING (id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::text);
        `);
      } catch (error) {
        if (!error.message.includes('already exists')) throw error;
        // 忽略已存在的策略错误
      }

      // 2. friends表策略：用户只能访问自己的好友关系
      try {
        await client.query(`
          CREATE POLICY "Users can view their own friends" ON friends
          FOR SELECT USING (user_id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::text);
        `);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }

      try {
        await client.query(`
          CREATE POLICY "Users can manage their own friends" ON friends
          FOR ALL USING (user_id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::text);
        `);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }

      // 3. direct_messages表策略：用户只能访问自己发送或接收的消息
      try {
        await client.query(`
          CREATE POLICY "Users can view their own messages" ON direct_messages
          FOR SELECT USING (
            sender_id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::text OR
            receiver_id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::text
          );
        `);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }

      try {
        await client.query(`
          CREATE POLICY "Users can send messages" ON direct_messages
          FOR INSERT WITH CHECK (
            sender_id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::text
          );
        `);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }

      // 4. friend_requests表策略：用户只能访问自己发送或接收的好友请求
      try {
        await client.query(`
          CREATE POLICY "Users can view their friend requests" ON friend_requests
          FOR SELECT USING (
            sender_id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::text OR
            receiver_id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::text
          );
        `);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }

      try {
        await client.query(`
          CREATE POLICY "Users can send friend requests" ON friend_requests
          FOR INSERT WITH CHECK (
            sender_id = COALESCE(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claim.userId', true))::text
          );
        `);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }

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
 * 获取当前配置的数据库实例
 */
export async function getDB() {
  // Normalize SUPABASE to POSTGRESQL for the instance manager
  const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType

  switch (typeKey) {
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
      github_id = null, github_username = null, auth_provider = 'local',
      is_new_user = true // 新用户默认需要完善资料
    } = userData
    // 确保email为小写，保证后续查找时的大小写不敏感
    const normalizedEmail = email.toLowerCase()
    const now = Date.now()
    const membershipStart = membership_start || now
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType

    switch (typeKey) {
      case DB_TYPE.MEMORY:
        const newUser = {
          id: id || randomUUID(),
          username, email: normalizedEmail, password_hash, phone, avatar_url, interests, age, tags,
          membership_level, membership_status, membership_start: membershipStart, membership_end,
          created_at: now, updated_at: now,
          github_id, github_username, auth_provider,
          is_new_user,
          // 统计字段（排行榜使用）
          posts_count: 0,
          likes_count: 0,
          views: 0,
          followers_count: 0,
          following_count: 0
        }
        memoryStore.users.push(newUser)
        saveMemoryStore()
        return { id: newUser.id }
      case DB_TYPE.MONGODB:
        const doc = {
          username, email: normalizedEmail, password_hash, phone, avatar_url, interests, age, tags,
          membership_level, membership_status, membership_start: membershipStart, membership_end,
          created_at: now, updated_at: now,
          github_id, github_username, auth_provider,
          is_new_user,
          // 统计字段（排行榜使用）
          posts_count: 0,
          likes_count: 0,
          views: 0,
          followers_count: 0,
          following_count: 0
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
            membership_level, membership_status, github_id, github_username, auth_provider,
            is_new_user
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (id) DO UPDATE SET
            username = $2, email = $3, password_hash = $4, phone = $5, avatar_url = $6, 
            interests = $7, age = $8, tags = $9, membership_level = $10, 
            membership_status = $11, github_id = $12, github_username = $13, 
            auth_provider = $14, is_new_user = $15, updated_at = NOW()
          RETURNING id
        `, [
          userId, username, normalizedEmail, password_hash, phone, avatar_url, interests, age, tags,
          membership_level, membership_status, github_id, github_username, auth_provider,
          is_new_user
        ])
        // 同时创建用户状态记录
        try {
          await db.query(`
            INSERT INTO user_status (user_id, status, last_seen, updated_at) 
            VALUES ($1, 'offline', NOW(), NOW())
            ON CONFLICT(user_id) DO NOTHING
          `, [userId])
        } catch (statusError) {
          // 如果创建状态记录失败，记录警告但不影响用户创建
          console.warn(`[createUser] 创建用户状态记录失败:`, statusError.message)
        }
        return rows[0]
      case DB_TYPE.NEON_API:
        // Use provided ID or generate a new UUID
        const neonUserId = id || randomUUID();
        const neonResult = await db.query(`
          INSERT INTO users (
            id, username, email, password_hash, phone, avatar_url, interests, age, tags, 
            membership_level, membership_status, github_id, github_username, auth_provider,
            is_new_user
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (id) DO UPDATE SET
            username = $2, email = $3, password_hash = $4, phone = $5, avatar_url = $6, 
            interests = $7, age = $8, tags = $9, membership_level = $10, 
            membership_status = $11, github_id = $12, github_username = $13, 
            auth_provider = $14, is_new_user = $15, updated_at = NOW()
          RETURNING id
        `, [
          neonUserId, username, normalizedEmail, password_hash, phone, avatar_url, interests, age, tags,
          membership_level, membership_status, github_id, github_username, auth_provider,
          is_new_user
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
      metadata,
      bio, location, occupation, website, github, twitter, cover_image
    } = updateData
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType

    // ... (Remaining updateById implementation logic is identical to original, just ensuring switch uses typeKey)
    // 为了节省篇幅，这里假设保留了原有逻辑，只是 switch (config.dbType) 改为 switch (typeKey)
    // 但因为是覆盖写入，我必须完整写出代码。
    
    switch (typeKey) {

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
        if (updateData.is_new_user !== undefined) { updateObj.is_new_user = updateData.is_new_user }
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
        // 用户个人资料字段
        if (bio !== undefined) addPgField('bio', bio)
        if (location !== undefined) addPgField('location', location)
        if (occupation !== undefined) addPgField('occupation', occupation)
        if (website !== undefined) addPgField('website', website)
        if (github !== undefined) addPgField('github', github)
        if (twitter !== undefined) addPgField('twitter', twitter)
        if (cover_image !== undefined) addPgField('cover_image', cover_image)
        if (updateData.is_new_user !== undefined) addPgField('is_new_user', updateData.is_new_user)

        // 确保 updated_at 使用数据库时间戳函数
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
        if (updateData.is_new_user !== undefined) { neonUpdateFields.push(`is_new_user = $${neonParamIndex++}`); neonParams.push(updateData.is_new_user) }
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

  async deleteById(id) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.MEMORY:
        const userIndex = memoryStore.users.findIndex(u => u.id === id || u.id == id)
        if (userIndex === -1) return false
        memoryStore.users.splice(userIndex, 1)
        saveMemoryStore()
        return true
      case DB_TYPE.MONGODB:
        const result = await db.collection('users').deleteOne({ _id: id })
        return result.deletedCount > 0
      case DB_TYPE.POSTGRESQL:
        await db.query('DELETE FROM users WHERE id = $1', [id])
        return true
      case DB_TYPE.NEON_API:
        await db.query('DELETE FROM users WHERE id = $1', [id])
        return true
      default:
        throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  // 更新用户 ID（用于与 Supabase Auth 同步）
  async updateUserId(oldId, newId) {
    console.log(`[DB] 开始更新用户ID: ${oldId} -> ${newId}`);
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    console.log(`[DB] 当前数据库类型: ${typeKey}`);
    
    switch (typeKey) {
      case DB_TYPE.MEMORY:
        const userIndex = memoryStore.users.findIndex(u => u.id === oldId || u.id == oldId)
        if (userIndex === -1) return false
        memoryStore.users[userIndex].id = newId
        memoryStore.users[userIndex].updated_at = Date.now()
        saveMemoryStore()
        return true
      case DB_TYPE.MONGODB:
        // MongoDB 中 _id 是主键，需要删除旧记录并创建新记录
        const user = await db.collection('users').findOne({ _id: oldId })
        if (!user) return false
        user._id = newId
        user.updated_at = Date.now()
        await db.collection('users').insertOne(user)
        await db.collection('users').deleteOne({ _id: oldId })
        return true
      case DB_TYPE.POSTGRESQL:
        // PostgreSQL 使用事务更新外键关联的记录
        try {
          console.log('[DB] 开始 PostgreSQL 事务...');
          await db.query('BEGIN')
          console.log('[DB] 事务已开始');
          
          // 更新关联表中的外键
          console.log('[DB] 更新 works 表...');
          await db.query('UPDATE works SET creator_id = $1 WHERE creator_id = $2', [newId, oldId])
          console.log('[DB] 更新 comments 表...');
          await db.query('UPDATE comments SET user_id = $1 WHERE user_id = $2', [newId, oldId])
          console.log('[DB] 更新 likes 表...');
          await db.query('UPDATE likes SET user_id = $1 WHERE user_id = $2', [newId, oldId])
          console.log('[DB] 更新 favorites 表...');
          await db.query('UPDATE favorites SET user_id = $1 WHERE user_id = $2', [newId, oldId])
          console.log('[DB] 更新 friend_requests 表...');
          await db.query('UPDATE friend_requests SET sender_id = $1 WHERE sender_id = $2', [newId, oldId])
          await db.query('UPDATE friend_requests SET receiver_id = $1 WHERE receiver_id = $2', [newId, oldId])
          console.log('[DB] 更新 messages 表...');
          await db.query('UPDATE messages SET sender_id = $1 WHERE sender_id = $2', [newId, oldId])
          await db.query('UPDATE messages SET receiver_id = $1 WHERE receiver_id = $2', [newId, oldId])
          console.log('[DB] 更新 user_status 表...');
          await db.query('UPDATE user_status SET user_id = $1 WHERE user_id = $2', [newId, oldId])
          console.log('[DB] 更新 community_members 表...');
          await db.query('UPDATE community_members SET user_id = $1 WHERE user_id = $2', [newId, oldId])
          // 最后更新用户表的 ID
          console.log('[DB] 更新 users 表...');
          await db.query('UPDATE users SET id = $1, updated_at = NOW() WHERE id = $2', [newId, oldId])
          await db.query('COMMIT')
          console.log('[DB] 事务已提交，用户ID更新成功');
          return true
        } catch (error) {
          await db.query('ROLLBACK')
          console.error('[DB] 更新用户ID失败:', error)
          throw error
        }
      case DB_TYPE.NEON_API:
        // Neon API 同样使用事务
        try {
          console.log('[DB] 开始 Neon API 事务...');
          await db.query('BEGIN')
          await db.query('UPDATE works SET creator_id = $1 WHERE creator_id = $2', [newId, oldId])
          await db.query('UPDATE comments SET user_id = $1 WHERE user_id = $2', [newId, oldId])
          await db.query('UPDATE likes SET user_id = $1 WHERE user_id = $2', [newId, oldId])
          await db.query('UPDATE favorites SET user_id = $1 WHERE user_id = $2', [newId, oldId])
          await db.query('UPDATE friend_requests SET sender_id = $1 WHERE sender_id = $2', [newId, oldId])
          await db.query('UPDATE friend_requests SET receiver_id = $1 WHERE receiver_id = $2', [newId, oldId])
          await db.query('UPDATE messages SET sender_id = $1 WHERE sender_id = $2', [newId, oldId])
          await db.query('UPDATE messages SET receiver_id = $1 WHERE receiver_id = $2', [newId, oldId])
          await db.query('UPDATE user_status SET user_id = $1 WHERE user_id = $2', [newId, oldId])
          await db.query('UPDATE community_members SET user_id = $1 WHERE user_id = $2', [newId, oldId])
          await db.query('UPDATE users SET id = $1, updated_at = NOW() WHERE id = $2', [newId, oldId])
          await db.query('COMMIT')
          console.log('[DB] Neon API 事务已提交，用户ID更新成功');
          return true
        } catch (error) {
          await db.query('ROLLBACK')
          console.error('[DB] 更新用户ID失败:', error)
          throw error
        }
      default:
        throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async findByEmail(email) {
    const db = await getDB()
    // 直接使用config.dbType，确保当降级到内存数据库时，使用正确的分支
    const typeKey = config.dbType
    switch (typeKey) {
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
        // 检查用户是否存在
        const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(phone)
        if (existingUser) {
          db.prepare('UPDATE users SET sms_verification_code = ?, sms_verification_expires = ?, updated_at = ? WHERE email = ?').run(code, expiresAt, Date.now(), phone)
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
        const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
        if (existingUser) {
          db.prepare('UPDATE users SET email_login_code = ?, email_login_expires = ?, updated_at = ? WHERE email = ?').run(code, expiresAt, Date.now(), email)
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
  },

  // OAuth 相关方法
  async findByProviderId(provider, providerId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.MEMORY:
        return memoryStore.users.find(u => u.provider === provider && u.provider_id === providerId)
      case DB_TYPE.MONGODB:
        return db.collection('users').findOne({ provider, provider_id: providerId })
      case DB_TYPE.POSTGRESQL:
        return (await db.query('SELECT * FROM users WHERE provider = $1 AND provider_id = $2', [provider, providerId])).rows[0]
      case DB_TYPE.NEON_API:
        return (await db.query('SELECT * FROM users WHERE provider = $1 AND provider_id = $2', [provider, providerId])).result.rows[0]
      default:
        throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async linkProvider(userId, provider, providerId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.MEMORY:
        const userIndex = memoryStore.users.findIndex(u => u.id === userId)
        if (userIndex !== -1) {
          memoryStore.users[userIndex].provider = provider
          memoryStore.users[userIndex].provider_id = providerId
          memoryStore.users[userIndex].updated_at = Date.now()
          saveMemoryStore()
        }
        return true
      case DB_TYPE.MONGODB:
        await db.collection('users').updateOne(
          { _id: userId },
          { $set: { provider, provider_id: providerId, updated_at: Date.now() } }
        )
        return true
      case DB_TYPE.POSTGRESQL:
        await db.query(
          'UPDATE users SET provider = $1, provider_id = $2, updated_at = NOW() WHERE id = $3',
          [provider, providerId, userId]
        )
        return true
      case DB_TYPE.NEON_API:
        await db.query(
          'UPDATE users SET provider = $1, provider_id = $2, updated_at = NOW() WHERE id = $3',
          [provider, providerId, userId]
        )
        return true
      default:
        throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async getUserById(id) {
    return this.findById(id)
  },

  async getUserByEmail(email) {
    return this.findByEmail(email)
  },

  async updateUser(id, updateData) {
    return this.updateById(id, updateData)
  }
}

export const favoriteDB = {
  async getUserFavorites(userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.MEMORY: return memoryStore.work_favorites?.filter(f => f.user_id === userId).map(f => f.work_id) || []
      case DB_TYPE.MONGODB: return (await db.collection('work_favorites').find({ user_id: userId }).sort({ work_id: 1 }).toArray()).map(f => f.work_id)
      case DB_TYPE.POSTGRESQL: return (await db.query('SELECT work_id FROM work_favorites WHERE user_id = $1 ORDER BY work_id ASC', [userId])).rows.map(r => r.work_id)
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async toggleFavorite(userId, workId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.MEMORY:
        if (!memoryStore.work_favorites) memoryStore.work_favorites = []
        const favIndex = memoryStore.work_favorites.findIndex(f => f.user_id === userId && f.work_id === workId)
        if (favIndex > -1) memoryStore.work_favorites.splice(favIndex, 1)
        else memoryStore.work_favorites.push({ user_id: userId, work_id: workId, created_at: Date.now() })
        saveMemoryStore()
        return this.getUserFavorites(userId)
      case DB_TYPE.MONGODB:
        const result = await db.collection('work_favorites').findOneAndDelete({ user_id: userId, work_id: workId })
        if (!result.value) await db.collection('work_favorites').insertOne({ user_id: userId, work_id: workId, created_at: Date.now() })
        return this.getUserFavorites(userId)
      case DB_TYPE.POSTGRESQL:
        const { rows: pgRows } = await db.query('SELECT * FROM work_favorites WHERE user_id = $1 AND work_id = $2', [userId, workId])
        if (pgRows.length > 0) await db.query('DELETE FROM work_favorites WHERE user_id = $1 AND work_id = $2', [userId, workId])
        else await db.query('INSERT INTO work_favorites (user_id, work_id, created_at) VALUES ($1, $2, NOW())', [userId, workId])
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
        const { rows: existingPg } = await db.query('SELECT * FROM friend_requests WHERE sender_id::text = $1 AND receiver_id::text = $2', [senderId, receiverId])
        if (existingPg.length > 0) return existingPg[0]
        
        // Check if already friends
        const { rows: friendPg } = await db.query('SELECT * FROM friends WHERE user_id::text = $1 AND friend_id::text = $2', [senderId, receiverId])
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
          JOIN users u ON fr.sender_id::text = u.id
          WHERE fr.receiver_id::text = $1 AND fr.status = 'pending'
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
    console.log('[friendDB.getFriends] 开始获取好友列表:', userId)
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    console.log('[friendDB.getFriends] 数据库类型:', typeKey)
    
    switch (typeKey) {
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
        console.log('[friendDB.getFriends] 执行 PostgreSQL 查询:', userId)
        const { rows: pgFriends } = await db.query(`
          SELECT f.*, u.username, u.avatar_url, u.email, s.status as online_status, s.last_seen
          FROM friends f
          JOIN users u ON f.friend_id::text = u.id::text
          LEFT JOIN user_status s ON f.friend_id::text = s.user_id::text
          WHERE f.user_id::text = $1::text
          ORDER BY s.status DESC, f.created_at DESC
        `, [userId])
        console.log('[friendDB.getFriends] 查询结果数量:', pgFriends.length)
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
      case DB_TYPE.MEMORY:
        memoryStore.friends = memoryStore.friends.filter(f => 
          !((f.user_id === userId && f.friend_id === friendId) || (f.user_id === friendId && f.friend_id === userId))
        )
        saveMemoryStore()
        return true
      case DB_TYPE.POSTGRESQL:
        await db.query('DELETE FROM friends WHERE (user_id::text = $1 AND friend_id::text = $2) OR (user_id::text = $2 AND friend_id::text = $1)', [userId, friendId])
        return true
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },
  
  async updateNote(userId, friendId, note) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.MEMORY:
        const friendEntry = memoryStore.friends.find(f => f.user_id === userId && f.friend_id === friendId)
        if (friendEntry) {
          friendEntry.user_note = note
        }
        saveMemoryStore()
        return true
      case DB_TYPE.POSTGRESQL:
        await db.query('UPDATE friends SET user_note = $1 WHERE user_id::text = $2 AND friend_id::text = $3', [note, userId, friendId])
        return true
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },
  
  async searchUsers(query, currentUserId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
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
        try {
          await db.query(`
            INSERT INTO user_status (user_id, status, last_seen, updated_at) 
            VALUES ($1, $2, NOW(), NOW())
            ON CONFLICT(user_id) DO UPDATE SET status = $2, last_seen = NOW(), updated_at = NOW()
          `, [userId, status])
          return true
        } catch (error) {
          // 打印详细的错误信息，以便调试
          console.error(`[updateUserStatus] 详细错误信息:`, {
            error: error,
            errorMessage: error.message,
            errorCode: error.code,
            errorStack: error.stack,
            userId: userId
          })
          
          // 检查是否是外键约束错误（处理多种可能的错误消息格式）
          if (error.code === '23503') { // PostgreSQL foreign key violation error code
            console.warn(`[updateUserStatus] 用户 ${userId} 不存在于 users 表，跳过状态更新`)
            // 返回 true 而不是抛出错误，避免前端显示错误
            return true
          }
          
          // 检查错误消息
          const errorMessage = error.message || error.toString() || ''
          if (errorMessage.includes('violates foreign key constraint') || 
              errorMessage.includes('user_status_user_id_fkey') ||
              (errorMessage.includes('insert or update on table') && errorMessage.includes('user_status'))) {
            console.warn(`[updateUserStatus] 用户 ${userId} 不存在于 users 表，跳过状态更新`)
            // 返回 true 而不是抛出错误，避免前端显示错误
            return true
          }
          
          // 其他错误，继续抛出
          throw error
        }
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
      case DB_TYPE.MEMORY:
        const memMessages = memoryStore.messages
          .filter(m => (m.sender_id === userId && m.receiver_id === friendId) || (m.sender_id === friendId && m.receiver_id === userId))
          .sort((a, b) => b.created_at - a.created_at) // Newest first
          .slice(offset, offset + limit)
        return memMessages.reverse() // Oldest first
      case DB_TYPE.POSTGRESQL:
        const { rows: pgMessages } = await db.query(`
          SELECT * FROM direct_messages 
          WHERE (sender_id::text = $1 AND receiver_id::text = $2) OR (sender_id::text = $2 AND receiver_id::text = $1)
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
      case DB_TYPE.MEMORY:
        memoryStore.messages.forEach(m => {
          if (m.sender_id === friendId && m.receiver_id === userId) {
            m.is_read = true
          }
        })
        saveMemoryStore()
        return true
      case DB_TYPE.POSTGRESQL:
        await db.query('UPDATE direct_messages SET is_read = true WHERE sender_id::text = $1 AND receiver_id::text = $2', [friendId, userId])
        return true
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },
  
  async getUnreadCount(userId) {
    const db = await getDB(userId)
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
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
          WHERE receiver_id::text = $1 AND is_read = false 
          GROUP BY sender_id
        `, [userId])
        return unreadRows
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async getConversations(userId) {
    const db = await getDB(userId)
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.MEMORY:
        // 获取所有与该用户相关的消息
        const userMessages = memoryStore.messages.filter(m => 
          m.sender_id === userId || m.receiver_id === userId
        )
        
        // 按对话分组
        const conversations = {}
        userMessages.forEach(m => {
          const friendId = m.sender_id === userId ? m.receiver_id : m.sender_id
          if (!conversations[friendId]) {
            conversations[friendId] = {
              friend_id: friendId,
              last_message: m.content,
              last_message_time: m.created_at,
              unread_count: m.receiver_id === userId && !m.is_read ? 1 : 0
            }
          } else {
            // 更新最后一条消息
            if (m.created_at > conversations[friendId].last_message_time) {
              conversations[friendId].last_message = m.content
              conversations[friendId].last_message_time = m.created_at
            }
            // 统计未读数
            if (m.receiver_id === userId && !m.is_read) {
              conversations[friendId].unread_count++
            }
          }
        })
        
        return Object.values(conversations).sort((a, b) => b.last_message_time - a.last_message_time)
        
      case DB_TYPE.POSTGRESQL:
        console.log('[DB] getConversations for user:', userId);
        const { rows: convRows } = await db.query(`
          WITH user_conversations AS (
            SELECT 
              CASE 
                WHEN sender_id::text = $1 THEN receiver_id::text
                ELSE sender_id::text
              END as friend_id,
              sender_id::text as sender_id,
              content as last_message,
              created_at as last_message_time,
              is_read,
              CASE 
                WHEN receiver_id::text = $1 AND is_read = false THEN 1
                ELSE 0
              END as is_unread
            FROM direct_messages
            WHERE sender_id::text = $1 OR receiver_id::text = $1
          ),
          latest_messages AS (
            SELECT DISTINCT ON (friend_id)
              friend_id,
              sender_id as last_sender_id,
              last_message,
              last_message_time,
              is_read as is_last_message_read
            FROM user_conversations
            ORDER BY friend_id, last_message_time DESC
          )
          SELECT 
            lm.friend_id as "userId",
            u.username,
            u.avatar_url as avatar,
            lm.last_message as "lastMessage",
            lm.last_message_time as "lastMessageTime",
            lm.last_sender_id as "lastSenderId",
            lm.is_last_message_read as "isLastMessageRead",
            COALESCE(SUM(uc.is_unread), 0)::int as "unreadCount"
          FROM latest_messages lm
          JOIN users u ON u.id::text = lm.friend_id
          LEFT JOIN user_conversations uc ON uc.friend_id = lm.friend_id
          GROUP BY lm.friend_id, u.username, u.avatar_url, lm.last_message, lm.last_message_time, lm.last_sender_id, lm.is_last_message_read
          ORDER BY lm.last_message_time DESC
        `, [userId])
        console.log('[DB] getConversations result:', convRows);
        return convRows
        
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
      case DB_TYPE.POSTGRESQL:
        console.log('[workDB.createWork] PostgreSQL case - db:', db ? 'exists' : 'null');
        
        // 检查 creator_id 是否有效
        if (!creator_id) {
          console.error('[workDB.createWork] ERROR: creator_id is null or undefined!');
          throw new Error('creator_id is required')
        }
        
        // 首先检查并添加缺失的列
        try {
          await db.query(`ALTER TABLE works ADD COLUMN IF NOT EXISTS cover_url TEXT`);
          await db.query(`ALTER TABLE works ADD COLUMN IF NOT EXISTS media TEXT`);
          await db.query(`ALTER TABLE works ADD COLUMN IF NOT EXISTS votes INTEGER DEFAULT 0`);
          // 添加 creator 列（如果不存在），用于存储创建者用户名
          await db.query(`ALTER TABLE works ADD COLUMN IF NOT EXISTS creator TEXT`);
          // 添加 video_url 列（如果不存在），用于存储视频URL
          await db.query(`ALTER TABLE works ADD COLUMN IF NOT EXISTS video_url TEXT`);
        } catch (e) {
          console.log('Column already exists or error adding column:', e.message);
        }
        
        // 获取用户信息以填充 creator 字段
        let creatorName = '';
        try {
          const userResult = await db.query(`SELECT username FROM users WHERE id = $1`, [creator_id]);
          if (userResult.rows.length > 0 && userResult.rows[0].username) {
            creatorName = userResult.rows[0].username;
          }
        } catch (e) {
          console.log('Failed to get user info:', e.message);
        }
        
        // 然后执行插入
        console.log('[workDB.createWork] Inserting with params:', { title, creator_id, creator: creatorName, category, now });
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
          
          // 获取 video_url
          const videoUrl = workData.video_url || workData.videoUrl || null;
          
          const { rows } = await db.query(`
            INSERT INTO works (title, description, cover_url, thumbnail, creator_id, creator, category, tags, media, video_url, views, likes, votes, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
          `, [
            title, description, cover_url, thumbnail || cover_url, creator_id, creatorName || '未知用户', category, 
            tagsValue, 
            mediaValue,
            videoUrl,
            0, // views
            0, // likes
            0, // votes
            now, // created_at
            now // updated_at
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
          video_url: workData.video_url || workData.videoUrl || null,
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
      case DB_TYPE.MEMORY:
        // Mock data or in-memory store
        // We can use memoryStore.posts as a fallback if works are not separate
        return (memoryStore.works || []).sort((a, b) => b.created_at - a.created_at).slice(offset, offset + limit)
      case DB_TYPE.POSTGRESQL:
        return (await db.query('SELECT w.*, u.username, u.avatar_url FROM works w LEFT JOIN users u ON w.creator_id = u.id ORDER BY w.created_at DESC LIMIT $1 OFFSET $2', [limit, offset])).rows
      default: return []
    }
  },

  async getWorkById(workId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.MEMORY:
        return (memoryStore.works || []).find(w => w.id === workId) || null
      case DB_TYPE.POSTGRESQL:
        try {
          // 首先尝试从 works 表查询
          const { rows: worksRows } = await db.query('SELECT w.*, u.username, u.avatar_url FROM works w LEFT JOIN users u ON w.creator_id = u.id WHERE w.id = $1', [workId])
          if (worksRows && worksRows.length > 0) {
            console.log('[workDB.getWorkById] Found in works table:', worksRows[0].id)
            return worksRows[0]
          }
          
          // 如果在 works 表找不到，尝试从 posts 表查询
          console.log('[workDB.getWorkById] Not found in works, trying posts table:', workId)
          const { rows: postsRows } = await db.query(`
            SELECT 
              p.id,
              p.title,
              p.content as description,
              p.images,
              COALESCE(p.images->>0, '') as thumbnail,
              COALESCE(p.images->>0, '') as cover_url,
              p.author_id as creator_id,
              p.created_at,
              p.updated_at,
              p.views,
              p.likes_count as likes,
              p.comments_count as comments,
              u.username,
              u.avatar_url
            FROM posts p 
            LEFT JOIN users u ON p.author_id = u.id 
            WHERE p.id = $1 AND p.status = 'published'
          `, [workId])
          
          if (postsRows && postsRows.length > 0) {
            console.log('[workDB.getWorkById] Found in posts table:', postsRows[0].id)
            return postsRows[0]
          }
          
          console.log('[workDB.getWorkById] Not found in either table:', workId)
          return null
        } catch (error) {
          console.error('[workDB.getWorkById] Error:', error)
          throw error
        }
      default: return null
    }
  },

  async getWorksByUserId(userId, limit = 50, offset = 0) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
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
      case DB_TYPE.MEMORY:
        return (memoryStore.works || []).sort((a, b) => b.created_at - a.created_at)
      case DB_TYPE.POSTGRESQL: {
        // 首先尝试从 works 表查询
        const { rows: worksRows } = await db.query('SELECT w.*, u.username, u.avatar_url FROM works w LEFT JOIN users u ON w.creator_id = u.id ORDER BY w.created_at DESC')
        console.log('[workDB.getAllWorks] Works count:', worksRows.length)
        
        // 如果 works 表有数据，直接返回
        if (worksRows.length > 0) {
          console.log('[workDB.getAllWorks] First work ID:', worksRows[0].id, 'type:', typeof worksRows[0].id)
          return worksRows
        }
        
        // 如果 works 表为空，从 posts 表获取已发布的帖子作为作品
        console.log('[workDB.getAllWorks] No works found, fetching from posts table')
        const { rows: postsRows } = await db.query(`
          SELECT 
            p.id,
            p.title,
            p.content as description,
            p.images,
            COALESCE(p.images->>0, '') as thumbnail,
            COALESCE(p.images->>0, '') as cover_url,
            p.author_id as creator_id,
            p.created_at,
            p.updated_at,
            p.views,
            p.likes_count as likes,
            p.comments_count as comments,
            u.username,
            u.avatar_url
          FROM posts p 
          LEFT JOIN users u ON p.author_id = u.id 
          WHERE p.status = 'published'
          ORDER BY p.created_at DESC
          LIMIT 20
        `)
        console.log('[workDB.getAllWorks] Posts count:', postsRows.length)
        if (postsRows.length > 0) {
          console.log('[workDB.getAllWorks] First post ID:', postsRows[0].id, 'type:', typeof postsRows[0].id)
        }
        return postsRows
      }
      default: return []
    }
  },

  // 添加作品评论
  async addComment(workId, userId, content, parentId = null, images = null) {
    console.log('[workDB.addComment] Called with:', { workId, userId, content: content?.substring(0, 50), parentId, imagesCount: images?.length })
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    const now = Date.now()
    const nowISO = new Date().toISOString()

    // 将图片数组转换为 JSON 字符串
    const imagesJson = images && images.length > 0 ? JSON.stringify(images) : null

    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        console.log('[workDB.addComment] Using PostgreSQL mode')
        // 确保 comments 表存在
        await db.query(`
          CREATE TABLE IF NOT EXISTS comments (
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            user_id TEXT NOT NULL,
            post_id INTEGER,
            work_id TEXT,
            parent_id INTEGER,
            images TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `)
        console.log('[workDB.addComment] Table ensured')

        // workId 现在是 TEXT 类型（UUID），不需要转换
        console.log('[workDB.addComment] workId:', workId)

        // 插入评论
        console.log('[workDB.addComment] Inserting comment...')
        const { rows } = await db.query(`
          INSERT INTO comments (content, user_id, work_id, parent_id, images, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $6)
          RETURNING *
        `, [content, userId, workId, parentId || null, imagesJson, nowISO])
        console.log('[workDB.addComment] Comment inserted:', rows[0]?.id)

        // 更新作品的评论数
        console.log('[workDB.addComment] Updating work comments count...')
        await db.query(`
          UPDATE works
          SET comments = COALESCE(comments, 0) + 1,
              updated_at = $1
          WHERE id = $2
        `, [nowISO, workId])
        console.log('[workDB.addComment] Work comments count updated')

        return rows[0]
      }
      case DB_TYPE.MEMORY: {
        const newComment = {
          id: Date.now(),
          content,
          user_id: userId,
          work_id: workId,
          parent_id: parentId,
          created_at: now,
          updated_at: now
        }
        if (!memoryStore.comments) memoryStore.comments = []
        memoryStore.comments.push(newComment)

        // 更新作品的评论数
        const work = (memoryStore.works || []).find(w => w.id === workId)
        if (work) {
          work.comments = (work.comments || 0) + 1
        }

        saveMemoryStore()
        return newComment
      }
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  // 获取作品评论列表
  async getWorkComments(workId, limit = 50, offset = 0) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType

    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        const { rows } = await db.query(`
          SELECT
            c.id,
            c.content,
            c.created_at,
            c.updated_at,
            c.parent_id,
            c.images,
            json_build_object(
              'id', u.id,
              'username', u.username,
              'avatar_url', u.avatar_url
            ) as user
          FROM comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.work_id = $1
          ORDER BY c.created_at ASC
          LIMIT $2 OFFSET $3
        `, [workId, limit, offset])
        return rows
      }
      case DB_TYPE.MEMORY: {
        const comments = (memoryStore.comments || [])
          .filter(c => c.work_id === workId)
          .sort((a, b) => b.created_at - a.created_at)
          .slice(offset, offset + limit)
        // 为每个评论添加作者信息
        return comments.map(comment => {
          const author = (memoryStore.users || []).find(u => u.id === comment.user_id)
          return {
            ...comment,
            author_name: author?.username || '用户',
            author_avatar: author?.avatar_url || ''
          }
        })
      }
      default:
        return []
    }
  },

  // 获取用户收藏的作品列表
  async getUserBookmarkedWorks(userId, limit = 50, offset = 0) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType

    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        // 首先获取收藏的作品ID
        const { rows: favRows } = await db.query(
          'SELECT work_id FROM work_favorites WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
          [userId, limit, offset]
        )
        if (favRows.length === 0) return []

        const workIds = favRows.map(r => r.work_id)
        
        // 然后获取作品详情（将 text 类型的 work_id 转换为 uuid 类型）
        // 使用子查询和显式类型转换
        let rows = []
        try {
          // 方法1: 使用 IN 子句，将 work_id 转换为 uuid
          const placeholders = workIds.map((_, i) => `$${i + 1}`).join(',')
          const { rows: worksData } = await db.query(
            `SELECT * FROM works WHERE id::text IN (${placeholders}) ORDER BY created_at DESC`,
            workIds
          )
          rows = worksData
        } catch (e) {
          // 如果失败，尝试使用 JOIN 方式
          console.warn('[DB] Query with IN failed, trying JOIN:', e.message)
          try {
            const { rows: worksData } = await db.query(
              `SELECT w.* FROM works w 
               INNER JOIN work_favorites wf ON w.id::text = wf.work_id 
               WHERE wf.user_id = $1 
               ORDER BY wf.created_at DESC 
               LIMIT $2 OFFSET $3`,
              [userId, limit, offset]
            )
            rows = worksData
          } catch (e2) {
            console.error('[DB] Both queries failed:', e2.message)
            return []
          }
        }

        // 单独获取作者信息
        const creatorIds = [...new Set(rows.map(w => w.creator_id).filter(Boolean))]
        let userMap = new Map()
        if (creatorIds.length > 0) {
          try {
            const { rows: userRows } = await db.query(
              `SELECT id, username, avatar_url FROM users WHERE id = ANY($1)`,
              [creatorIds]
            )
            userMap = new Map(userRows.map(u => [u.id, u]))
          } catch (e) {
            // 忽略用户查询错误
          }
        }

        // 合并数据
        return rows.map(work => ({
          ...work,
          username: userMap.get(work.creator_id)?.username || '未知用户',
          avatar_url: userMap.get(work.creator_id)?.avatar_url || ''
        }))
      }
      case DB_TYPE.MEMORY: {
        // 从内存中获取收藏记录
        const favorites = (memoryStore.work_favorites || [])
          .filter(f => f.user_id === userId)
          .sort((a, b) => b.created_at - a.created_at)
          .slice(offset, offset + limit)
        
        // 获取对应的作品
        const workIds = favorites.map(f => f.work_id)
        const works = (memoryStore.works || [])
          .filter(w => workIds.includes(w.id))
          .map(w => {
            const creator = (memoryStore.users || []).find(u => u.id === w.creator_id)
            return {
              ...w,
              username: creator?.username || '未知用户',
              avatar_url: creator?.avatar_url || ''
            }
          })
        return works
      }
      default:
        return []
    }
  },

  // 获取用户点赞的作品列表
  async getUserLikedWorks(userId, limit = 50, offset = 0) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType

    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        // 首先获取点赞的作品ID
        const { rows: likeRows } = await db.query(
          'SELECT work_id FROM work_likes WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
          [userId, limit, offset]
        )
        if (likeRows.length === 0) return []

        const workIds = likeRows.map(r => r.work_id)
        
        // 然后获取作品详情（将 text 类型的 work_id 转换为 uuid 类型）
        let rows = []
        try {
          // 方法1: 使用 IN 子句，将 work_id 转换为 uuid
          const placeholders = workIds.map((_, i) => `$${i + 1}`).join(',')
          const { rows: worksData } = await db.query(
            `SELECT * FROM works WHERE id::text IN (${placeholders}) ORDER BY created_at DESC`,
            workIds
          )
          rows = worksData
        } catch (e) {
          // 如果失败，尝试使用 JOIN 方式
          console.warn('[DB] Query with IN failed, trying JOIN:', e.message)
          try {
            const { rows: worksData } = await db.query(
              `SELECT w.* FROM works w 
               INNER JOIN work_likes wl ON w.id::text = wl.work_id 
               WHERE wl.user_id = $1 
               ORDER BY wl.created_at DESC 
               LIMIT $2 OFFSET $3`,
              [userId, limit, offset]
            )
            rows = worksData
          } catch (e2) {
            console.error('[DB] Both queries failed:', e2.message)
            return []
          }
        }

        // 单独获取作者信息
        const creatorIds = [...new Set(rows.map(w => w.creator_id).filter(Boolean))]
        let userMap = new Map()
        if (creatorIds.length > 0) {
          try {
            const { rows: userRows } = await db.query(
              `SELECT id, username, avatar_url FROM users WHERE id = ANY($1)`,
              [creatorIds]
            )
            userMap = new Map(userRows.map(u => [u.id, u]))
          } catch (e) {
            // 忽略用户查询错误
          }
        }

        // 合并数据
        return rows.map(work => ({
          ...work,
          username: userMap.get(work.creator_id)?.username || '未知用户',
          avatar_url: userMap.get(work.creator_id)?.avatar_url || ''
        }))
      }
      case DB_TYPE.MEMORY: {
        // 从内存中获取点赞记录
        const likes = (memoryStore.work_likes || [])
          .filter(l => l.user_id === userId)
          .sort((a, b) => b.created_at - a.created_at)
          .slice(offset, offset + limit)
        
        // 获取对应的作品
        const workIds = likes.map(l => l.work_id)
        const works = (memoryStore.works || [])
          .filter(w => workIds.includes(w.id))
          .map(w => {
            const creator = (memoryStore.users || []).find(u => u.id === w.creator_id)
            return {
              ...w,
              username: creator?.username || '未知用户',
              avatar_url: creator?.avatar_url || ''
            }
          })
        return works
      }
      default:
        return []
    }
  },

  // 点赞作品
  async likeWork(workId, userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        try {
          // 判断作品ID类型：UUID 格式（posts 表）或数字格式（works 表）
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workId);
          console.log('[workDB.likeWork] WorkId type:', isUUID ? 'UUID (posts)' : 'numeric (works)', workId);
          
          // 如果是 UUID 格式，使用 posts 表逻辑
          if (isUUID) {
            // 检查是否已点赞（使用 likes 表）
            const { rows: existing } = await db.query(
              'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
              [userId, workId]
            )
            
            if (existing.length > 0) {
              return { success: true, message: '已经点赞过了' }
            }
            
            // 获取作品信息和作者
            const { rows: postRows } = await db.query(
              'SELECT id, title, author_id FROM posts WHERE id = $1',
              [workId]
            )
            
            if (postRows.length === 0) {
              return { success: false, error: '作品不存在' }
            }
            
            const post = postRows[0]
            const authorId = post.author_id
            
            // 添加点赞记录到 likes 表
            await db.query(
              'INSERT INTO likes (user_id, post_id, created_at) VALUES ($1, $2, NOW())',
              [userId, workId]
            )
            
            // 更新 posts 表的点赞数
            await db.query(
              'UPDATE posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = $1',
              [workId]
            )
            
            // 给作品作者发送通知（如果不是自己点赞自己的作品）
            if (authorId && authorId !== userId) {
              try {
                // 获取点赞者信息
                const { rows: userRows } = await db.query(
                  'SELECT username FROM users WHERE id = $1',
                  [userId]
                )
                const likerName = userRows.length > 0 ? userRows[0].username : '有人'
                
                await db.query(
                  `INSERT INTO notifications (user_id, type, title, content, data, is_read, created_at) 
                   VALUES ($1, $2, $3, $4, $5, false, NOW())`,
                  [
                    authorId,
                    'like',
                    '作品收到新点赞',
                    `你的作品"${post.title || '未命名作品'}"收到了${likerName}的点赞`,
                    JSON.stringify({ work_id: workId, liker_id: userId }),
                    false
                  ]
                )
                console.log('[workDB.likeWork] Notification sent to author:', authorId)
              } catch (notifyError) {
                console.error('[workDB.likeWork] Failed to send notification:', notifyError)
              }
            }
            
            return { success: true, message: '点赞成功' }
          }
          
          // 处理后端 works 表的点赞（原有逻辑）
          // 检查是否已点赞
          const { rows: existing } = await db.query(
            'SELECT id FROM work_likes WHERE user_id = $1 AND work_id = $2',
            [userId, workId]
          )
          
          if (existing.length > 0) {
            return { success: true, message: '已经点赞过了' }
          }
          
          // 获取作品信息和作者
          const { rows: workRows } = await db.query(
            'SELECT id, title, creator_id FROM works WHERE id = $1',
            [workId]
          )
          
          if (workRows.length === 0) {
            return { success: false, error: '作品不存在' }
          }
          
          const work = workRows[0]
          const authorId = work.creator_id
          
          // 添加点赞记录
          await db.query(
            'INSERT INTO work_likes (user_id, work_id, created_at) VALUES ($1, $2, NOW())',
            [userId, workId]
          )
          
          // 更新作品点赞数
          await db.query(
            'UPDATE works SET likes = COALESCE(likes, 0) + 1 WHERE id = $1',
            [workId]
          )
          
          // 给作品作者发送通知（如果不是自己点赞自己的作品）
          if (authorId && authorId !== userId) {
            try {
              // 获取点赞者信息
              const { rows: userRows } = await db.query(
                'SELECT username FROM users WHERE id = $1',
                [userId]
              )
              const likerName = userRows.length > 0 ? userRows[0].username : '有人'
              
              await db.query(
                `INSERT INTO notifications (user_id, type, title, content, data, is_read, created_at) 
                 VALUES ($1, $2, $3, $4, $5, false, NOW())`,
                [
                  authorId,
                  'like',
                  '作品收到新点赞',
                  `你的作品"${work.title || '未命名作品'}"收到了${likerName}的点赞`,
                  JSON.stringify({ work_id: workId, liker_id: userId }),
                  false
                ]
              )
              console.log('[workDB.likeWork] Notification sent to author:', authorId)
            } catch (notifyError) {
              console.error('[workDB.likeWork] Failed to send notification:', notifyError)
              // 通知发送失败不影响点赞成功
            }
          }
          
          return { success: true, message: '点赞成功' }
        } catch (error) {
          console.error('[workDB.likeWork] Error:', error)
          return { success: false, error: error.message }
        }
      }
      case DB_TYPE.MEMORY: {
        if (!memoryStore.work_likes) memoryStore.work_likes = []
        
        const existing = memoryStore.work_likes.find(
          l => l.user_id === userId && l.work_id === workId
        )
        
        if (existing) {
          return { success: true, message: '已经点赞过了' }
        }
        
        memoryStore.work_likes.push({
          user_id: userId,
          work_id: workId,
          created_at: Date.now()
        })
        
        // 更新作品点赞数
        const work = (memoryStore.works || []).find(w => w.id === workId)
        if (work) {
          work.likes = (work.likes || 0) + 1
        }
        
        saveMemoryStore()
        return { success: true, message: '点赞成功' }
      }
      default:
        return { success: false, error: '不支持的数据库类型' }
    }
  },

  // 取消点赞作品
  async unlikeWork(workId, userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        try {
          // 删除点赞记录
          const { rowCount } = await db.query(
            'DELETE FROM work_likes WHERE user_id = $1 AND work_id = $2',
            [userId, workId]
          )
          
          if (rowCount > 0) {
            // 更新作品点赞数
            await db.query(
              'UPDATE works SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) WHERE id = $1',
              [workId]
            )
          }
          
          return { success: true, message: '取消点赞成功' }
        } catch (error) {
          console.error('[workDB.unlikeWork] Error:', error)
          return { success: false, error: error.message }
        }
      }
      case DB_TYPE.MEMORY: {
        if (!memoryStore.work_likes) return { success: true }
        
        const index = memoryStore.work_likes.findIndex(
          l => l.user_id === userId && l.work_id === workId
        )
        
        if (index > -1) {
          memoryStore.work_likes.splice(index, 1)
          
          // 更新作品点赞数
          const work = (memoryStore.works || []).find(w => w.id === workId)
          if (work) {
            work.likes = Math.max((work.likes || 0) - 1, 0)
          }
          
          saveMemoryStore()
        }
        
        return { success: true, message: '取消点赞成功' }
      }
      default:
        return { success: false, error: '不支持的数据库类型' }
    }
  },

  // 收藏作品
  async bookmarkWork(workId, userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        try {
          // 检查是否已收藏
          const { rows: existing } = await db.query(
            'SELECT id FROM work_favorites WHERE user_id = $1 AND work_id = $2',
            [userId, workId]
          )
          
          if (existing.length > 0) {
            return { success: true, isBookmarked: true, message: '已经收藏过了' }
          }
          
          // 添加收藏记录
          await db.query(
            'INSERT INTO work_favorites (user_id, work_id, created_at) VALUES ($1, $2, NOW())',
            [userId, workId]
          )
          
          return { success: true, isBookmarked: true, message: '收藏成功' }
        } catch (error) {
          console.error('[workDB.bookmarkWork] Error:', error)
          return { success: false, isBookmarked: false, error: error.message }
        }
      }
      case DB_TYPE.MEMORY: {
        if (!memoryStore.work_favorites) memoryStore.work_favorites = []
        
        const existing = memoryStore.work_favorites.find(
          f => f.user_id === userId && f.work_id === workId
        )
        
        if (existing) {
          return { success: true, isBookmarked: true, message: '已经收藏过了' }
        }
        
        memoryStore.work_favorites.push({
          user_id: userId,
          work_id: workId,
          created_at: Date.now()
        })
        
        saveMemoryStore()
        return { success: true, isBookmarked: true, message: '收藏成功' }
      }
      default:
        return { success: false, isBookmarked: false, error: '不支持的数据库类型' }
    }
  },

  // 取消收藏作品
  async unbookmarkWork(workId, userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        try {
          await db.query(
            'DELETE FROM work_favorites WHERE user_id = $1 AND work_id = $2',
            [userId, workId]
          )
          
          return { success: true, isBookmarked: false, message: '取消收藏成功' }
        } catch (error) {
          console.error('[workDB.unbookmarkWork] Error:', error)
          return { success: false, isBookmarked: true, error: error.message }
        }
      }
      case DB_TYPE.MEMORY: {
        if (!memoryStore.work_favorites) return { success: true, isBookmarked: false }
        
        const index = memoryStore.work_favorites.findIndex(
          f => f.user_id === userId && f.work_id === workId
        )
        
        if (index > -1) {
          memoryStore.work_favorites.splice(index, 1)
          saveMemoryStore()
        }
        
        return { success: true, isBookmarked: false, message: '取消收藏成功' }
      }
      default:
        return { success: false, isBookmarked: true, error: '不支持的数据库类型' }
    }
  },

  // 检查是否已点赞
  async isWorkLiked(workId, userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        const { rows } = await db.query(
          'SELECT id FROM work_likes WHERE user_id = $1 AND work_id = $2',
          [userId, workId]
        )
        return rows.length > 0
      }
      case DB_TYPE.MEMORY: {
        if (!memoryStore.work_likes) return false
        return memoryStore.work_likes.some(
          l => l.user_id === userId && l.work_id === workId
        )
      }
      default:
        return false
    }
  },

  // 检查是否已收藏
  async isWorkBookmarked(workId, userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        const { rows } = await db.query(
          'SELECT id FROM work_favorites WHERE user_id = $1 AND work_id = $2',
          [userId, workId]
        )
        return rows.length > 0
      }
      case DB_TYPE.MEMORY: {
        if (!memoryStore.work_favorites) return false
        return memoryStore.work_favorites.some(
          f => f.user_id === userId && f.work_id === workId
        )
      }
      default:
        return false
    }
  },

  // 获取用户点赞数量
  async getUserLikesCount(userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        const { rows } = await db.query(
          'SELECT COUNT(*) as count FROM work_likes WHERE user_id = $1',
          [userId]
        )
        return parseInt(rows[0]?.count || 0)
      }
      case DB_TYPE.MEMORY: {
        if (!memoryStore.work_likes) return 0
        return memoryStore.work_likes.filter(l => l.user_id === userId).length
      }
      default:
        return 0
    }
  },

  async getUserBookmarksCount(userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType

    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        const { rows } = await db.query(
          'SELECT COUNT(*) as count FROM work_favorites WHERE user_id = $1',
          [userId]
        )
        return parseInt(rows[0]?.count || 0)
      }
      case DB_TYPE.MEMORY: {
        if (!memoryStore.work_favorites) return 0
        return memoryStore.work_favorites.filter(f => f.user_id === userId).length
      }
      default:
        return 0
    }
  }
}

// 评论数据库操作
export const commentDB = {
  async addComment(commentData) {
    const db = await getDB()
    const { content, user_id, post_id, parent_id } = commentData
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL:
        const { rows } = await db.query('INSERT INTO comments (content, user_id, post_id, parent_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [content, user_id, post_id, parent_id || null, now, now])
        return rows[0]
      case DB_TYPE.MEMORY:
        const newComment = {
          id: Date.now(),
          content,
          user_id,
          post_id,
          parent_id: parent_id || null,
          created_at: now,
          updated_at: now
        }
        if (!memoryStore.comments) memoryStore.comments = []
        memoryStore.comments.push(newComment)
        saveMemoryStore()
        return newComment
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async getCommentsByPostId(postId, limit = 50, offset = 0) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL:
        return (await db.query('SELECT c.*, u.username, u.avatar_url FROM comments c LEFT JOIN users u ON c.user_id::text = u.id WHERE c.post_id = $1 ORDER BY c.created_at DESC LIMIT $2 OFFSET $3', [postId, limit, offset])).rows
      case DB_TYPE.MEMORY:
        return (memoryStore.comments || [])
          .filter(c => c.post_id === postId)
          .sort((a, b) => b.created_at - a.created_at)
          .slice(offset, offset + limit)
      default: return []
    }
  },

  async deleteComment(id, userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL:
        await db.query('DELETE FROM comments WHERE id = $1 AND user_id = $2', [id, userId])
        return true
      case DB_TYPE.MEMORY:
        if (memoryStore.comments) {
          memoryStore.comments = memoryStore.comments.filter(c => !(c.id === id && c.user_id === userId))
          saveMemoryStore()
        }
        return true
      default: return false
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
      case DB_TYPE.POSTGRESQL:
        return (await db.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [userId, limit, offset])).rows
      default: return []
    }
  },

  async getUnreadCount(userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
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
      case DB_TYPE.POSTGRESQL:
        await db.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId])
        return true
      default: return false
    }
  },

  async getTotalCount(userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL:
        const { rows } = await db.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = $1', [userId])
        return rows[0] ? parseInt(rows[0].count) : 0
      default: return 0
    }
  }
}

export const communityDB = {
  async getAllCommunities() {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    let communities
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL:
        communities = (await db.query('SELECT * FROM communities ORDER BY member_count DESC')).rows
        break
      case DB_TYPE.MEMORY:
        communities = [...(memoryStore.communities || [])].sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
        break
      default:
        return []
    }
    
    // 转换数据库字段为前端期望的格式（使用下划线命名以兼容现有前端代码）
    return communities.map(community => ({
      id: community.id,
      name: community.name,
      description: community.description,
      avatar: community.avatar || community.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(community.name || 'community')}`,
      member_count: community.member_count || 0,
      members_count: community.member_count || 0,
      topic: community.topic,
      is_active: community.is_active,
      is_special: community.is_special,
      creator_id: community.creator_id,
      created_at: community.created_at,
      updated_at: community.updated_at,
      tags: community.tags,
      bookmarks: community.bookmarks,
      theme: community.theme,
      layout_type: community.layout_type,
      cover: community.cover
    }))
  },

  async getCommunityById(id) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    let community
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL:
        const result = await db.query('SELECT * FROM communities WHERE id = $1', [id])
        community = result.rows[0]
        break
      case DB_TYPE.MEMORY:
        community = (memoryStore.communities || []).find(c => c.id === id) || null
        break
      default:
        return null
    }
    
    if (!community) return null
    
    // 转换数据库字段为前端期望的格式
    return {
      id: community.id,
      name: community.name,
      description: community.description,
      avatar: community.avatar || community.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(community.name || 'community')}`,
      member_count: community.member_count || 0,
      members_count: community.member_count || 0,
      topic: community.topic,
      is_active: community.is_active,
      is_special: community.is_special,
      creator_id: community.creator_id,
      created_at: community.created_at,
      updated_at: community.updated_at,
      tags: community.tags,
      bookmarks: community.bookmarks,
      theme: community.theme,
      layout_type: community.layout_type,
      cover: community.cover
    }
  },

  async getCommunityPosts(communityId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        // 关联 users 表获取作者信息，查询 posts 表
        const result = await db.query(`
          SELECT 
            p.*,
            u.username as author_name,
            u.avatar_url as author_avatar
          FROM posts p
          LEFT JOIN users u ON p.user_id = u.id
          WHERE p.community_id = $1
          ORDER BY p.created_at DESC
        `, [communityId])
        return result.rows
      }
      case DB_TYPE.MEMORY: {
        const posts = (memoryStore.posts || []).filter(p => p.community_id === communityId).sort((a, b) => b.created_at - a.created_at)
        // 为每个帖子添加作者信息
        return posts.map(post => {
          const author = (memoryStore.users || []).find(u => u.id === post.user_id)
          return {
            ...post,
            author_name: author?.username || '用户',
            author_avatar: author?.avatar_url || ''
          }
        })
      }
      default:
        return []
    }
  },

  async getPostComments(postId, limit = 3, offset = 0) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        // 关联 users 表获取评论作者信息
        const result = await db.query(`
          SELECT 
            c.*,
            u.username as author_name,
            u.avatar_url as author_avatar
          FROM comments c
          LEFT JOIN users u ON c.user_id = u.id
          WHERE c.post_id = $1
          ORDER BY c.created_at DESC
          LIMIT $2 OFFSET $3
        `, [postId, limit, offset])
        return result.rows
      }
      case DB_TYPE.MEMORY: {
        const comments = (memoryStore.comments || [])
          .filter(c => c.post_id === postId)
          .sort((a, b) => b.created_at - a.created_at)
          .slice(offset, offset + limit)
        // 为每个评论添加作者信息
        return comments.map(comment => {
          const author = (memoryStore.users || []).find(u => u.id === comment.user_id)
          return {
            ...comment,
            author_name: author?.username || '用户',
            author_avatar: author?.avatar_url || ''
          }
        })
      }
      default:
        return []
    }
  },

  async createCommunity(data) {
    const db = await getDB()
    const { id, name, description, avatar, topic, is_special, member_count, is_active, creator_id } = data
    const nowISO = new Date().toISOString()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL:
        await db.query(`
          INSERT INTO communities (id, name, description, avatar, member_count, topic, is_active, is_special, creator_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
          ON CONFLICT(id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            avatar = EXCLUDED.avatar,
            member_count = EXCLUDED.member_count,
            topic = EXCLUDED.topic,
            is_active = EXCLUDED.is_active,
            creator_id = EXCLUDED.creator_id,
            updated_at = $10
        `, [
          id,
          name,
          description,
          avatar,
          typeof member_count === 'number' ? member_count : 0,
          topic,
          typeof is_active === 'boolean' ? is_active : true,
          is_special,
          creator_id || null,
          nowISO
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
          creator_id: creator_id || null,
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
      case DB_TYPE.POSTGRESQL: {
        // 使用 ISO 格式的时间戳，避免时区问题
        const nowISO = new Date().toISOString()
        const result = await db.query(`
          INSERT INTO community_members (community_id, user_id, role, joined_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (community_id, user_id) DO NOTHING
        `, [communityId, userId, role, nowISO])

        if (result.rowCount > 0) {
          await db.query(`
            UPDATE communities
            SET member_count = COALESCE(member_count, 0) + 1,
                updated_at = $1
            WHERE id = $2
          `, [nowISO, communityId])
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
  },

  async isCommunityMember(userId, communityId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType

    switch (typeKey) {
      case DB_TYPE.MEMORY: {
        const members = memoryStore.community_members || []
        return members.some(m => m.community_id === communityId && m.user_id === userId)
      }
      case DB_TYPE.POSTGRESQL: {
        const { rows } = await db.query(`
          SELECT 1 FROM community_members
          WHERE community_id = $1 AND user_id::text = $2
        `, [communityId, userId])
        return rows.length > 0
      }
      default:
        return false
    }
  },

  async leaveCommunity(userId, communityId) {
    const db = await getDB()
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType

    switch (typeKey) {
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
  },

  // 更新社区创建者ID（用于与Supabase Auth同步）
  async updateCommunityCreatorId(communityId, newCreatorId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL:
        await db.query(`
          UPDATE communities
          SET creator_id = $1,
              updated_at = NOW()
          WHERE id = $2
        `, [newCreatorId, communityId])
        return true
      case DB_TYPE.MEMORY:
        const community = (memoryStore.communities || []).find(c => c.id === communityId)
        if (community) {
          community.creator_id = newCreatorId
          community.updated_at = Date.now()
          saveMemoryStore()
          return true
        }
        return false
      default:
        return false
    }
  },

  // 获取社区成员列表
  async getCommunityMembers(communityId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType

    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        const result = await db.query(`
          SELECT 
            cm.community_id,
            cm.user_id,
            cm.role,
            cm.joined_at,
            u.username,
            u.avatar_url
          FROM community_members cm
          LEFT JOIN users u ON cm.user_id = u.id
          WHERE cm.community_id = $1
          ORDER BY cm.joined_at DESC
        `, [communityId])
        
        return result.rows.map(row => ({
          id: `${row.community_id}-${row.user_id}`,
          user_id: row.user_id,
          username: row.username || '未知用户',
          avatar_url: row.avatar_url,
          role: row.role || 'member',
          joined_at: row.joined_at,
          is_online: false
        }))
      }
      case DB_TYPE.MEMORY: {
        const members = (memoryStore.community_members || [])
          .filter(m => m.community_id === communityId)
          .map(m => {
            const user = (memoryStore.users || []).find(u => u.id === m.user_id)
            return {
              id: `${m.community_id}-${m.user_id}`,
              user_id: m.user_id,
              username: user?.username || '未知用户',
              avatar_url: user?.avatar_url,
              role: m.role || 'member',
              joined_at: m.joined_at,
              is_online: false
            }
          })
        return members
      }
      default:
        return []
    }
  },

  // 获取社区统计数据
  async getCommunityStats(communityId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        // 获取本周开始时间（Unix 时间戳，秒）
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weekAgoSeconds = Math.floor(weekAgo.getTime() / 1000)
        
        // 获取帖子数、评论数、点赞数
        const postsResult = await db.query(`
          SELECT 
            COUNT(*) as post_count,
            COALESCE(SUM(upvotes), 0) as total_upvotes
          FROM posts 
          WHERE community_id = $1
        `, [communityId])
        
        // 获取本周新帖子数（created_at 是秒级时间戳）
        const weeklyPostsResult = await db.query(`
          SELECT COUNT(*) as weekly_posts
          FROM posts 
          WHERE community_id = $1 AND created_at >= $2
        `, [communityId, weekAgoSeconds])
        
        // 获取本周评论数（created_at 是 ISO 日期字符串）
        const weeklyCommentsResult = await db.query(`
          SELECT COUNT(*) as weekly_comments
          FROM comments c
          JOIN posts p ON c.post_id = p.id
          WHERE p.community_id = $1 AND c.created_at >= $2
        `, [communityId, weekAgo.toISOString()])
        
        // 获取在线人数（最近5分钟内有活动的用户）
        const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300
        const onlineResult = await db.query(`
          SELECT COUNT(*) as online_count
          FROM community_members
          WHERE community_id = $1 AND last_active >= $2
        `, [communityId, fiveMinutesAgo])
        
        // 获取本周访客数（本周内有活动的用户）
        const visitorsResult = await db.query(`
          SELECT COUNT(*) as visitor_count
          FROM community_members
          WHERE community_id = $1 AND last_active >= $2
        `, [communityId, weekAgoSeconds])
        
        return {
          post_count: parseInt(postsResult.rows[0]?.post_count || 0),
          total_upvotes: parseInt(postsResult.rows[0]?.total_upvotes || 0),
          weekly_visitors: parseInt(visitorsResult.rows[0]?.visitor_count || 0),
          weekly_interactions: parseInt(weeklyCommentsResult.rows[0]?.weekly_comments || 0) + parseInt(postsResult.rows[0]?.total_upvotes || 0),
          online_count: parseInt(onlineResult.rows[0]?.online_count || 0)
        }
      }
      case DB_TYPE.MEMORY: {
        // Memory 模式下返回模拟数据
        return {
          post_count: 0,
          total_upvotes: 0,
          weekly_visitors: 0,
          weekly_interactions: 0,
          online_count: 0
        }
      }
      default:
        return {
          post_count: 0,
          total_upvotes: 0,
          weekly_visitors: 0,
          weekly_interactions: 0,
          online_count: 0
        }
    }
  }

  ,

  async getUserCommunities(userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    console.log('[DB] getUserCommunities: userId =', userId, 'dbType =', typeKey);

    switch (typeKey) {
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
  },

  // 在社区中创建帖子
  async createCommunityPost({ communityId, userId, title, content, images = [], videos = [], audios = [] }) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    const nowTimestamp = Date.now() // 使用 bigint 时间戳

    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        // 插入帖子到 posts 表
        // 使用 user_id (not null) 而不是 author_id (nullable)
        // 注意：触发器需要 status = 'published' 才会记录活动
        const { rows } = await db.query(`
          INSERT INTO posts (title, content, user_id, community_id, status, images, videos, audios, views, created_at, updated_at)
          VALUES ($1, $2, $3, $4, 'published', $5::text[], $6::text[], $7::text[], 0, $8, $8)
          RETURNING *
        `, [title, content, userId, communityId, images || [], videos || [], audios || [], nowTimestamp])

        const post = rows[0]

        // 更新用户发帖数
        await db.query(`
          UPDATE users
          SET posts_count = COALESCE(posts_count, 0) + 1,
              updated_at = $1
          WHERE id = $2
        `, [nowTimestamp, userId])

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          user_id: post.user_id,
          community_id: post.community_id,
          images: post.images || [],
          videos: post.videos || [],
          audios: post.audios || [],
          upvotes: post.views || 0,
          created_at: post.created_at,
          updated_at: post.updated_at
        }
      }
      case DB_TYPE.MEMORY: {
        const id = Date.now().toString()
        const post = {
          id,
          title,
          content,
          user_id: userId,
          community_id: communityId,
          images: images || [],
          videos: videos || [],
          audios: audios || [],
          upvotes: 0,
          created_at: nowTimestamp,
          updated_at: nowTimestamp
        }

        if (!memoryStore.posts) {
          memoryStore.posts = []
        }
        memoryStore.posts.push(post)
        saveMemoryStore()

        return post
      }
      default:
        throw new Error('不支持的数据库类型')
    }
  },

  // 添加评论
  async addComment(postId, userId, content, parentId = null) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    const nowISO = new Date().toISOString()

    switch (typeKey) {
      case DB_TYPE.POSTGRESQL: {
        const { rows } = await db.query(`
          INSERT INTO comments (content, user_id, post_id, parent_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $5)
          RETURNING *
        `, [content, userId, postId, parentId, nowISO])

        const comment = rows[0]

        // 更新帖子的评论数
        await db.query(`
          UPDATE posts
          SET comments_count = COALESCE(comments_count, 0) + 1
          WHERE id = $1
        `, [postId])

        return {
          id: comment.id,
          content: comment.content,
          user_id: comment.user_id,
          post_id: comment.post_id,
          parent_id: comment.parent_id,
          created_at: comment.created_at,
          updated_at: comment.updated_at
        }
      }
      case DB_TYPE.MEMORY: {
        const newComment = {
          id: Date.now().toString(),
          content,
          user_id: userId,
          post_id: postId,
          parent_id: parentId,
          created_at: nowISO,
          updated_at: nowISO
        }

        if (!memoryStore.comments) {
          memoryStore.comments = []
        }
        memoryStore.comments.push(newComment)
        saveMemoryStore()

        return newComment
      }
      default:
        throw new Error('不支持的数据库类型')
    }
  }
}

export const achievementDB = {
  async getUserAchievements(userId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    switch (typeKey) {
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
      case DB_TYPE.POSTGRESQL:
        const { rows } = await db.query('SELECT SUM(points) as total FROM points_records WHERE user_id = $1', [userId])
        if (!rows || rows.length === 0) return 0
        const total = rows[0].total
        // 确保积分不会返回负数
        return total ? Math.max(0, Number(total)) : 0
      default: return 0
    }
  },

  // 添加积分（成就解锁等场景使用）
  async addPoints(userId, points, type, description) {
    const db = await getDB()
    const now = Date.now()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType

    switch (typeKey) {
      case DB_TYPE.POSTGRESQL:
        // 获取当前总积分
        const { rows: currentRows } = await db.query('SELECT SUM(points) as total FROM points_records WHERE user_id = $1', [userId])
        const currentBalance = parseInt(currentRows[0]?.total || '0')
        
        // 如果要扣除积分，检查余额是否足够
        if (points < 0 && currentBalance + points < 0) {
          console.log(`[DB] Insufficient points for user ${userId}: current=${currentBalance}, required=${Math.abs(points)}`)
          throw new Error('积分余额不足')
        }
        
        const newBalance = currentBalance + points

        // 插入积分记录
        await db.query(
          'INSERT INTO points_records (user_id, source, type, points, created_at, description, balance_after) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [userId, type, type, points, now, description, newBalance]
        )
        console.log(`[DB] Added ${points} points to user ${userId}, new balance: ${newBalance}`)
        return newBalance
      default:
        return 0
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
    const { id, title, description, content, startTime, endTime, start_date, end_date, location, coverUrl, thumbnailUrl, image_url, status, creatorId, organizerId, organizer_id, type, tags, media, maxParticipants, max_participants, isPublic = true } = eventData
    const nowISO = new Date().toISOString()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType

    // Ensure ID
    const eventId = id || randomUUID()
    // 使用 organizer_id 或 creator_id (支持多种字段名)
    const orgId = organizer_id || organizerId || creatorId
    // 支持 startTime (ISO string) 或 start_date (Unix timestamp)
    const startTimeValue = startTime || (start_date ? new Date(start_date * 1000).toISOString() : null)
    const endTimeValue = endTime || (end_date ? new Date(end_date * 1000).toISOString() : null)
    const thumbnailValue = thumbnailUrl || coverUrl || image_url
    const maxPartValue = maxParticipants || max_participants
    // 确保 tags 是数组格式（PostgreSQL text[] 类型）
    // 注意：空数组会导致 "malformed array literal" 错误，所以使用 null
    const tagsValue = Array.isArray(tags) && tags.length > 0 ? tags : null
    // media 是 jsonb 类型，可以是空数组
    const mediaValue = Array.isArray(media) ? media : []

    switch (typeKey) {

      case DB_TYPE.POSTGRESQL:
        // Assume table exists or create it (skipping creation here for brevity, assuming migration or createPostgreSQLTables handles it)
        // We'll add table creation to createPostgreSQLTables separately
        
        // 转换时间戳：优先使用 start_date/end_date (bigint)，否则使用 startTime/endTime (ISO string)
      // startTimestamp 和 endTimestamp 用于 start_time/end_time (timestamp 类型)
        const startTimestamp = start_date 
          ? new Date(start_date * 1000).toISOString() 
          : (startTime ? new Date(startTime).toISOString() : new Date().toISOString())
        const endTimestamp = end_date 
          ? new Date(end_date * 1000).toISOString() 
          : (endTime ? new Date(endTime).toISOString() : new Date(Date.now() + 86400000).toISOString())
        
        // created_at 是 bigint 类型（秒级时间戳），updated_at 是 timestamptz 类型（ISO 字符串）
        const nowTimestampSeconds = Math.floor(Date.now() / 1000)
        const nowTimestampISO = new Date().toISOString()
        
        console.log('[DB] Inserting event with values:', {
        eventId,
        title,
        tagsValue,
        tagsValueType: typeof tagsValue,
        mediaValue,
        mediaValueStringified: JSON.stringify(mediaValue)
      })
      
      // 同时需要 start_date/end_date (bigint) 和 start_time/end_time (timestamp)
      const startDateTimestamp = start_date || Math.floor(new Date(startTimestamp).getTime() / 1000)
      const endDateTimestamp = end_date || Math.floor(new Date(endTimestamp).getTime() / 1000)
      
      // 处理新添加的时间字段 - 使用秒级时间戳（对应数据库 bigint 类型）
      const parseTimeField = (value) => {
        if (!value) return null;
        if (typeof value === 'number') {
          // 如果已经是 Unix 时间戳（秒），直接返回
          return value;
        }
        // 如果是字符串，尝试解析为日期并转换为秒级时间戳
        const date = new Date(value);
        if (isNaN(date.getTime())) return null;
        return Math.floor(date.getTime() / 1000);
      };
      
      const registrationDeadline = parseTimeField(eventData.registration_deadline);
      const reviewStartDate = parseTimeField(eventData.review_start_date);
      const resultDate = parseTimeField(eventData.result_date);
      const phaseStatus = eventData.phase_status || 'registration'
      
      console.log('[DB] createEvent values:', {
        startDateTimestamp,
        endDateTimestamp,
        startTimestamp,
        endTimestamp,
        registrationDeadline,
        reviewStartDate,
        resultDate,
        nowTimestampSeconds,
        nowTimestampISO
      })
      
      await db.query(`
          INSERT INTO events (id, title, description, content, start_date, end_date, start_time, end_time, location, thumbnail_url, status, organizer_id, type, tags, media, max_participants, is_public, created_at, updated_at, registration_deadline, review_start_date, result_date, phase_status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $17, $18, $19, $20, $21, $22, $23)
        `, [eventId, title, description, content || description, startDateTimestamp, endDateTimestamp, startTimestamp, endTimestamp, location, thumbnailValue, status || 'draft', orgId, type || 'online', tagsValue, JSON.stringify(mediaValue), maxPartValue, isPublic, nowTimestampSeconds, nowTimestampISO, registrationDeadline, reviewStartDate, resultDate, phaseStatus])
        return { ...eventData, id: eventId, created_at: nowTimestampSeconds, updated_at: nowTimestampISO }
        
      case DB_TYPE.MEMORY:
        if (!memoryStore.events) memoryStore.events = []
        const now = Date.now()
        const newEvent = {
          id: eventId,
          title, description, content: content || description, 
          startTime: startTimeValue, endTime: endTimeValue, location, 
          thumbnailUrl: thumbnailValue, coverUrl: thumbnailValue,
          status: status || 'draft', creatorId, organizerId: orgId,
          created_at: now, updated_at: now,
          type, tags, media, maxParticipants: maxPartValue, isPublic
        }
        memoryStore.events.push(newEvent)
        saveMemoryStore()
        return newEvent
        
      default: throw new Error(`Unsupported DB Type: ${config.dbType}`)
    }
  },

  async getEvent(id) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL:
        const { rows } = await db.query('SELECT * FROM events WHERE id = $1', [id])
        if (rows.length === 0) return null
        const pgRow = rows[0]
        return {
          ...pgRow,
          startTime: pgRow.start_date * 1000,
          endTime: pgRow.end_date * 1000,
          coverUrl: pgRow.image_url,
          creatorId: pgRow.organizer_id,
          created_at: pgRow.created_at,
          updated_at: pgRow.updated_at,
          tags: pgRow.tags && typeof pgRow.tags === 'string' && pgRow.tags.trim() ? JSON.parse(pgRow.tags) : [],
          media: pgRow.image_url ? [{ url: pgRow.image_url, type: 'image' }] : []
        }
        
      case DB_TYPE.MEMORY:
        return (memoryStore.events || []).find(e => e.id === id) || null
        
      default: return null
    }
  },

  async updateEvent(id, updateData) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    const nowTimestampSeconds = Math.floor(Date.now() / 1000)
    const nowTimestampISO = new Date().toISOString()
    
    switch (typeKey) {
        
      case DB_TYPE.POSTGRESQL: {
        // 构建动态更新字段
        const updates = []
        const values = []
        let paramIndex = 1
        
        // 处理各个字段
        if (updateData.title !== undefined) {
          updates.push(`title = $${paramIndex++}`)
          values.push(updateData.title)
        }
        if (updateData.description !== undefined) {
          updates.push(`description = $${paramIndex++}`)
          values.push(updateData.description)
        }
        if (updateData.content !== undefined) {
          updates.push(`content = $${paramIndex++}`)
          values.push(updateData.content)
        }
        if (updateData.start_date !== undefined) {
          updates.push(`start_date = $${paramIndex++}`)
          values.push(updateData.start_date)
          // 同时更新 start_time
          updates.push(`start_time = $${paramIndex++}`)
          values.push(new Date(updateData.start_date * 1000).toISOString())
        }
        if (updateData.end_date !== undefined) {
          updates.push(`end_date = $${paramIndex++}`)
          values.push(updateData.end_date)
          // 同时更新 end_time
          updates.push(`end_time = $${paramIndex++}`)
          values.push(new Date(updateData.end_date * 1000).toISOString())
        }
        if (updateData.location !== undefined) {
          updates.push(`location = $${paramIndex++}`)
          values.push(updateData.location)
        }
        if (updateData.status !== undefined) {
          updates.push(`status = $${paramIndex++}`)
          values.push(updateData.status)
        }
        if (updateData.visibility !== undefined) {
          updates.push(`visibility = $${paramIndex++}`)
          values.push(updateData.visibility)
        }
        if (updateData.max_participants !== undefined) {
          updates.push(`max_participants = $${paramIndex++}`)
          values.push(updateData.max_participants)
        }
        if (updateData.participant_count !== undefined) {
          updates.push(`participant_count = $${paramIndex++}`)
          values.push(updateData.participant_count)
        }
        if (updateData.requirements !== undefined) {
          updates.push(`requirements = $${paramIndex++}`)
          values.push(updateData.requirements)
        }
        if (updateData.rewards !== undefined) {
          updates.push(`rewards = $${paramIndex++}`)
          values.push(updateData.rewards)
        }
        if (updateData.image_url !== undefined) {
          updates.push(`image_url = $${paramIndex++}`)
          values.push(updateData.image_url)
        }
        if (updateData.thumbnail_url !== undefined) {
          updates.push(`thumbnail_url = $${paramIndex++}`)
          values.push(updateData.thumbnail_url)
        }
        if (updateData.category !== undefined) {
          updates.push(`category = $${paramIndex++}`)
          values.push(updateData.category)
        }
        if (updateData.tags !== undefined) {
          updates.push(`tags = $${paramIndex++}`)
          values.push(updateData.tags)
        }
        if (updateData.type !== undefined) {
          updates.push(`type = $${paramIndex++}`)
          values.push(updateData.type)
        }
        if (updateData.is_public !== undefined) {
          updates.push(`is_public = $${paramIndex++}`)
          values.push(updateData.is_public)
        }
        if (updateData.registration_deadline !== undefined) {
          updates.push(`registration_deadline = $${paramIndex++}`)
          values.push(updateData.registration_deadline)
        }
        if (updateData.review_start_date !== undefined) {
          updates.push(`review_start_date = $${paramIndex++}`)
          values.push(updateData.review_start_date)
        }
        if (updateData.result_date !== undefined) {
          updates.push(`result_date = $${paramIndex++}`)
          values.push(updateData.result_date)
        }
        if (updateData.published_at !== undefined) {
          updates.push(`published_at = $${paramIndex++}`)
          values.push(updateData.published_at)
        }
        if (updateData.phase_status !== undefined) {
          updates.push(`phase_status = $${paramIndex++}`)
          values.push(updateData.phase_status)
        }
        
        // 总是更新 updated_at (使用 ISO 字符串，因为字段是 timestamptz 类型)
        updates.push(`updated_at = $${paramIndex++}`)
        values.push(nowTimestampISO)
        
        // 添加 id 作为最后一个参数
        values.push(id)
        
        const query = `
          UPDATE events 
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `
        
        const { rows } = await db.query(query, values)
        return rows[0] || null
      }
        
      case DB_TYPE.MEMORY:
        const idx = (memoryStore.events || []).findIndex(e => e.id === id)
        if (idx === -1) return null
        memoryStore.events[idx] = { ...memoryStore.events[idx], ...updateData, updated_at: nowTimestamp }
        saveMemoryStore()
        return memoryStore.events[idx]
        
      default: return null
    }
  },

  async deleteEvent(id) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    
    switch (typeKey) {
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

  async updateEventOrganizerId(eventId, newOrganizerId) {
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    const nowTimestamp = Math.floor(Date.now() / 1000)
    
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL:
        await db.query(
          'UPDATE events SET organizer_id = $1, updated_at = $2 WHERE id = $3',
          [newOrganizerId, nowTimestamp, eventId]
        )
        return true
      case DB_TYPE.MEMORY:
        const idx = (memoryStore.events || []).findIndex(e => e.id === eventId)
        if (idx === -1) return false
        memoryStore.events[idx].organizerId = newOrganizerId
        memoryStore.events[idx].creatorId = newOrganizerId
        memoryStore.events[idx].updated_at = nowTimestamp
        saveMemoryStore()
        return true
      default: return false
    }
  },

  async getEvents(filters = {}) {
    console.log('[DB] getEvents called with filters:', filters)
    const db = await getDB()
    const typeKey = (config.dbType === DB_TYPE.SUPABASE) ? DB_TYPE.POSTGRESQL : config.dbType
    console.log('[DB] getEvents typeKey:', typeKey, 'DB_TYPE.POSTGRESQL:', DB_TYPE.POSTGRESQL)
    
    switch (typeKey) {
      case DB_TYPE.POSTGRESQL:
        console.log('[DB] Matched POSTGRESQL case')
        // Needs proper table creation in createPostgreSQLTables
        try {
          let pgSql = 'SELECT * FROM events WHERE 1=1'
          const pgParams = []
          let pIdx = 1
          if (filters.creatorId) { 
            pgSql += ` AND organizer_id = $${pIdx++}`; 
            pgParams.push(filters.creatorId);
            console.log('[DB] Adding creatorId filter:', filters.creatorId);
          }
          if (filters.status) { 
            pgSql += ` AND status = $${pIdx++}`; 
            pgParams.push(filters.status);
            console.log('[DB] Adding status filter:', filters.status);
          }
          // 只有当 brandId 存在且不为空时才添加过滤条件
          // 使用 IS NOT DISTINCT FROM 来处理 NULL 值，或者匹配指定的 brand_id
          if (filters.brandId && filters.brandId.trim() !== '') { 
            pgSql += ` AND (brand_id = $${pIdx} OR brand_id IS NULL)`; 
            pgParams.push(filters.brandId);
            pIdx++;
            console.log('[DB] Adding brandId filter:', filters.brandId);
          }
          pgSql += ' ORDER BY created_at DESC'
          
          console.log('[DB] Executing SQL:', pgSql, 'with params:', pgParams)
          const { rows } = await db.query(pgSql, pgParams)
          console.log('[DB] getEvents query returned:', rows.length, 'rows')
          
          // 如果没有返回数据且有过滤条件，尝试查询所有数据看看原因
          if (rows.length === 0 && (filters.creatorId || filters.brandId)) {
            console.log('[DB] No results found, checking all events...');
            const allRows = await db.query('SELECT id, organizer_id, brand_id, title FROM events ORDER BY created_at DESC LIMIT 5');
            console.log('[DB] Sample events:', allRows.rows);
          }
          return rows.map(pgRow => {
            console.log('[DB] getEvents row:', { id: pgRow.id, image_url: pgRow.image_url, thumbnail_url: pgRow.thumbnail_url });
            return {
              ...pgRow,
              startTime: pgRow.start_date * 1000,
              endTime: pgRow.end_date * 1000,
              coverUrl: pgRow.image_url || pgRow.thumbnail_url,
              thumbnailUrl: pgRow.thumbnail_url || pgRow.image_url,
              imageUrl: pgRow.image_url || pgRow.thumbnail_url,
              creatorId: pgRow.organizer_id,
              created_at: pgRow.created_at,
              updated_at: pgRow.updated_at,
              tags: pgRow.tags && typeof pgRow.tags === 'string' && pgRow.tags.trim() ? JSON.parse(pgRow.tags) : [],
              media: pgRow.image_url ? [{ url: pgRow.image_url, type: 'image' }] : []
            };
          })
        } catch (e) { 
          console.error('[DB] getEvents(filters) error:', e)
          // 如果是 brand_id 列不存在的错误，尝试不使用 brand_id 过滤重新查询
          if (e.message && e.message.includes('column "brand_id" does not exist')) {
            console.log('[DB] brand_id column does not exist, retrying without brand filter')
            try {
              let pgSql = 'SELECT * FROM events WHERE 1=1'
              const pgParams = []
              let pIdx = 1
              if (filters.creatorId) { pgSql += ` AND organizer_id = $${pIdx++}`; pgParams.push(filters.creatorId) }
              if (filters.status) { pgSql += ` AND status = $${pIdx++}`; pgParams.push(filters.status) }
              pgSql += ' ORDER BY created_at DESC'
              
              console.log('[DB] Executing fallback SQL:', pgSql, 'with params:', pgParams)
              const { rows } = await db.query(pgSql, pgParams)
              console.log('[DB] getEvents fallback query returned:', rows.length, 'rows')
              return rows.map(pgRow => ({
                ...pgRow,
                startTime: pgRow.start_date * 1000,
                endTime: pgRow.end_date * 1000,
                coverUrl: pgRow.image_url || pgRow.thumbnail_url,
                thumbnailUrl: pgRow.thumbnail_url || pgRow.image_url,
                imageUrl: pgRow.image_url || pgRow.thumbnail_url,
                creatorId: pgRow.organizer_id,
                created_at: pgRow.created_at,
                updated_at: pgRow.updated_at,
                tags: pgRow.tags && typeof pgRow.tags === 'string' && pgRow.tags.trim() ? JSON.parse(pgRow.tags) : [],
                media: pgRow.image_url ? [{ url: pgRow.image_url, type: 'image' }] : []
              }))
            } catch (fallbackError) {
              console.error('[DB] getEvents fallback query error:', fallbackError)
              return []
            }
          }
          return [] 
        }
        
      case DB_TYPE.MEMORY:
        let results = memoryStore.events || []
        if (filters.creatorId) results = results.filter(e => e.creatorId === filters.creatorId)
        if (filters.status) results = results.filter(e => e.status === filters.status)
        if (filters.brandId) results = results.filter(e => e.brandId === filters.brandId)
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
