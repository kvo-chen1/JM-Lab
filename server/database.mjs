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
      // 连接池大小优化：Serverless环境使用较小的连接池
      max: parseInt(process.env.POSTGRES_MAX_POOL_SIZE || (process.env.VERCEL ? '5' : '10')),
      // 最小连接数：保持一定连接以减少连接建立开销
      min: parseInt(process.env.POSTGRES_MIN_POOL_SIZE || '2'),
      // 空闲连接超时：快速释放不用的连接
      idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '10000'),
      // 连接超时：快速失败，避免长时间等待
      connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || '3000'),
      // 连接最大生命周期：防止连接长时间不释放
      maxLifetime: parseInt(process.env.POSTGRES_MAX_LIFETIME || '300000'), // 5分钟
      // SSL 配置：Supabase 通常需要 SSL。本地开发可能不需要。
      ssl: (connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')) ? {
        rejectUnauthorized: false // 允许自签名证书 (Supabase 兼容性)
      } : false,
      // 查询超时设置：避免长时间运行的查询阻塞连接
      statement_timeout: 8000, // 8秒查询超时
      // 客户端编码设置
      client_encoding: 'UTF8',
      // 连接重试策略
      retry: {
        maxRetries: 3,
        delay: 1000,
        backoff: 'exponential'
      }
    }
  }
}

// 数据库连接实例
let dbInstances = {
  postgresql: null
}

// 连接状态监控
let connectionStatus = {
  postgresql: { connected: false, lastConnected: null, error: null, poolStatus: {} }
}

// 连接重试计数器
let retryCounts = {
  postgresql: 0
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
        } catch (e) {
          // 忽略列已存在的错误或其他非关键错误
        }
      }

      // 检查 users 表是否已存在（Supabase 已创建）
      const { rows: existingUsers } = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users'
      `)

      // 创建 users 表（如果不存在）
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT,
          phone TEXT UNIQUE,
          avatar_url TEXT,
          interests TEXT[],
          age INTEGER,
          tags TEXT[],
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          github_id TEXT UNIQUE,
          github_username TEXT,
          auth_provider TEXT DEFAULT 'local',
          is_new_user BOOLEAN DEFAULT true,
          membership_level TEXT DEFAULT 'free',
          membership_status TEXT DEFAULT 'active',
          membership_start BIGINT,
          membership_end BIGINT,
          posts_count INTEGER DEFAULT 0,
          likes_count INTEGER DEFAULT 0,
          views INTEGER DEFAULT 0,
          followers_count INTEGER DEFAULT 0,
          following_count INTEGER DEFAULT 0,
          email_login_code TEXT,
          email_login_expires BIGINT
        )
      `)

      // 确保 users 表有所有必需的列
      await ensureColumn('users', 'bio', 'TEXT')
      await ensureColumn('users', 'location', 'TEXT')
      await ensureColumn('users', 'occupation', 'TEXT')
      await ensureColumn('users', 'website', 'TEXT')
      await ensureColumn('users', 'social_links', 'JSONB')
      await ensureColumn('users', 'github', 'TEXT')
      await ensureColumn('users', 'twitter', 'TEXT')
      await ensureColumn('users', 'cover_image', 'TEXT')
      await ensureColumn('users', 'metadata', 'JSONB')

      // 创建 friends 表
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.friends (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          UNIQUE(user_id, friend_id)
        )
      `)

      // 创建 favorites 表
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.favorites (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          tutorial_id TEXT NOT NULL,
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint
        )
      `)

      // 创建 user_activities 表
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.user_activities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          action_type TEXT NOT NULL,
          entity_type TEXT,
          entity_id TEXT,
          target_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
          details JSONB,
          content TEXT,
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint
        )
      `)

      // 创建 communities 表
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.communities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          avatar TEXT,
          member_count INTEGER DEFAULT 0,
          topic TEXT,
          is_active BOOLEAN DEFAULT true,
          is_special BOOLEAN DEFAULT false,
          creator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          theme JSONB,
          layout_type TEXT DEFAULT 'standard',
          enabled_modules JSONB
        )
      `)

      // 创建 community_members 表
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.community_members (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          role TEXT DEFAULT 'member',
          joined_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          last_active BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          UNIQUE(community_id, user_id)
        )
      `)

      // 创建 works 表（如果不存在）
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.works (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          thumbnail TEXT,
          duration INTEGER,
          status TEXT DEFAULT 'draft',
          visibility TEXT DEFAULT 'private',
          category TEXT,
          tags TEXT[],
          cultural_elements TEXT[],
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          published_at BIGINT,
          scheduled_publish_date BIGINT,
          moderation_status TEXT DEFAULT 'pending',
          rejection_reason TEXT,
          reviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
          reviewed_at BIGINT,
          views INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          comments INTEGER DEFAULT 0,
          shares INTEGER DEFAULT 0,
          downloads INTEGER DEFAULT 0,
          engagement_rate FLOAT DEFAULT 0,
          is_featured BOOLEAN DEFAULT false
        )
      `)

      // 确保 works 表有所有必需的列
      await ensureColumn('works', 'visibility', "TEXT DEFAULT 'private'")
      await ensureColumn('works', 'status', "TEXT DEFAULT 'draft'")
      await ensureColumn('works', 'category', 'TEXT')
      await ensureColumn('works', 'tags', 'TEXT[]')
      await ensureColumn('works', 'cultural_elements', 'TEXT[]')
      await ensureColumn('works', 'moderation_status', "TEXT DEFAULT 'pending'")
      await ensureColumn('works', 'rejection_reason', 'TEXT')
      await ensureColumn('works', 'reviewer_id', 'UUID')
      await ensureColumn('works', 'reviewed_at', 'BIGINT')
      await ensureColumn('works', 'published_at', 'BIGINT')
      await ensureColumn('works', 'scheduled_publish_date', 'BIGINT')
      await ensureColumn('works', 'views', 'INTEGER DEFAULT 0')
      await ensureColumn('works', 'likes', 'INTEGER DEFAULT 0')
      await ensureColumn('works', 'comments', 'INTEGER DEFAULT 0')
      await ensureColumn('works', 'shares', 'INTEGER DEFAULT 0')
      await ensureColumn('works', 'downloads', 'INTEGER DEFAULT 0')
      await ensureColumn('works', 'engagement_rate', 'FLOAT DEFAULT 0')
      await ensureColumn('works', 'is_featured', 'BOOLEAN DEFAULT false')

      // 创建 events 表（如果不存在）
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          description TEXT,
          start_date BIGINT NOT NULL,
          end_date BIGINT NOT NULL,
          location TEXT,
          organizer_id UUID,
          requirements TEXT,
          rewards TEXT,
          visibility TEXT DEFAULT 'public',
          status TEXT DEFAULT 'draft',
          registration_deadline BIGINT,
          max_participants INTEGER,
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          published_at BIGINT,
          image_url TEXT,
          category TEXT,
          tags TEXT[],
          platform_event_id TEXT
        )
      `)

      // 创建 event_participants 表
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.event_participants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          event_id UUID NOT NULL,
          user_id UUID NOT NULL,
          status TEXT DEFAULT 'pending',
          registration_date BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          UNIQUE(event_id, user_id)
        )
      `)

      // 创建 event_submissions 表
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.event_submissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          event_id UUID NOT NULL,
          user_id UUID NOT NULL,
          work_id UUID,
          work_title TEXT,
          work_thumbnail TEXT,
          description TEXT,
          status TEXT DEFAULT 'pending',
          score INTEGER,
          feedback TEXT,
          submission_date BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint
        )
      `)

      // 创建 posts 表（社群帖子）
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          community_id TEXT NOT NULL,
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          images TEXT[],
          likes INTEGER DEFAULT 0,
          comments_count INTEGER DEFAULT 0,
          views INTEGER DEFAULT 0,
          is_pinned BOOLEAN DEFAULT false,
          is_announcement BOOLEAN DEFAULT false,
          status TEXT DEFAULT 'published',
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint
        )
      `)

      // 创建 comments 表（帖子评论）
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
          likes INTEGER DEFAULT 0,
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint
        )
      `)

      // 创建 work_comments 表（作品评论）
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.work_comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          work_id UUID NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          parent_id UUID REFERENCES public.work_comments(id) ON DELETE CASCADE,
          likes INTEGER DEFAULT 0,
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint
        )
      `)

      // 创建 work_likes 表（作品点赞）
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.work_likes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          work_id UUID NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          UNIQUE(work_id, user_id)
        )
      `)

      // 创建 work_bookmarks 表（作品收藏）
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.work_bookmarks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          work_id UUID NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          UNIQUE(work_id, user_id)
        )
      `)

      // 创建 indexes
      await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_communities_name ON public.communities(name)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_works_creator_id ON public.works(creator_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_works_status ON public.works(status)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON public.events(organizer_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_event_submissions_event_id ON public.event_submissions(event_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_event_submissions_user_id ON public.event_submissions(user_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_posts_community_id ON public.posts(community_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_work_comments_work_id ON public.work_comments(work_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_work_comments_user_id ON public.work_comments(user_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_work_likes_work_id ON public.work_likes(work_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_work_likes_user_id ON public.work_likes(user_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_work_bookmarks_work_id ON public.work_bookmarks(work_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_work_bookmarks_user_id ON public.work_bookmarks(user_id)`)

      log('PostgreSQL tables initialized successfully')
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
    dbType,
    connectionStatus,
    retryCounts,
    config: {
      postgresql: {
        connectionString: config.postgresql.connectionString,
        poolSize: config.postgresql.options.max
      }
    }
  }
}

// 用户数据库操作
export const userDB = {
  async findById(id) {
    const db = await getDB()
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id])
    return rows[0] || null
  },
  async getById(id) {
    return this.findById(id)
  },
  async findByEmail(email) {
    const db = await getDB()
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email])
    return rows[0] || null
  },
  async getByEmail(email) {
    return this.findByEmail(email)
  },
  async getByUsername(username) {
    const db = await getDB()
    const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username])
    return rows[0] || null
  },
  async getByPhone(phone) {
    const db = await getDB()
    const { rows } = await db.query('SELECT * FROM users WHERE phone = $1', [phone])
    return rows[0] || null
  },
  async getByGithubId(githubId) {
    const db = await getDB()
    const { rows } = await db.query('SELECT * FROM users WHERE github_id = $1', [githubId])
    return rows[0] || null
  },
  async createUser(userData) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000) // 使用秒级时间戳，与表结构一致
    const id = userData.id || randomUUID()
    
    try {
      const { rows } = await db.query(`
        INSERT INTO users (id, username, email, password_hash, phone, avatar_url, interests, age, tags, created_at, updated_at, github_id, github_username, auth_provider, is_new_user, membership_level, membership_status, membership_start, membership_end, email_login_code, email_login_expires)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING id
      `, [
        id,
        userData.username,
        userData.email,
        userData.password_hash,
        userData.phone,
        userData.avatar_url,
        userData.interests,
        userData.age,
        userData.tags,
        now,
        now,
        userData.github_id,
        userData.github_username,
        userData.auth_provider || 'local',
        userData.is_new_user || true,
        userData.membership_level || 'free',
        userData.membership_status || 'active',
        userData.membership_start,
        userData.membership_end,
        userData.email_login_code,
        userData.email_login_expires
      ])
      
      return { id: rows[0].id }
    } catch (error) {
      // 处理数据库类型错误，如果字段类型不匹配，尝试使用不同的格式
      if (error.code === '22008') {
        console.log('[DB] 时间类型错误，尝试使用时间字符串格式创建用户')
        const nowString = new Date().toISOString()
        const { rows } = await db.query(`
          INSERT INTO users (id, username, email, password_hash, phone, avatar_url, interests, age, tags, created_at, updated_at, github_id, github_username, auth_provider, is_new_user, membership_level, membership_status, membership_start, membership_end, email_login_code, email_login_expires)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
          RETURNING id
        `, [
          id,
          userData.username,
          userData.email,
          userData.password_hash,
          userData.phone,
          userData.avatar_url,
          userData.interests,
          userData.age,
          userData.tags,
          nowString,
          nowString,
          userData.github_id,
          userData.github_username,
          userData.auth_provider || 'local',
          userData.is_new_user || true,
          userData.membership_level || 'free',
          userData.membership_status || 'active',
          userData.membership_start,
          userData.membership_end,
          userData.email_login_code,
          userData.email_login_expires
        ])
        
        return { id: rows[0].id }
      } else {
        throw error
      }
    }
  },
  async create(userData) {
    return this.createUser(userData)
  },
  async updateById(id, updateData) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000) // 使用秒级时间戳，与表结构一致
    
    const fields = []
    const values = []
    let index = 1
    
    for (const [key, value] of Object.entries(updateData)) {
      fields.push(`${key} = $${index++}`)
      values.push(value)
    }
    fields.push(`updated_at = $${index++}`)
    values.push(now)
    values.push(id)
    
    try {
      const { rows } = await db.query(`
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${index}
        RETURNING *
      `, values)
      
      return rows[0] || null
    } catch (error) {
      // 处理数据库类型错误
      if (error.code === '22008') {
        console.log('[DB] 时间类型错误，尝试使用字符串格式更新用户')
        // 重新构建values数组，使用ISO字符串格式的时间
        const valuesWithStringTime = [...values]
        valuesWithStringTime[values.length - 2] = new Date().toISOString()
        
        const { rows } = await db.query(`
          UPDATE users
          SET ${fields.join(', ')}
          WHERE id = $${index}
          RETURNING *
        `, valuesWithStringTime)
        
        return rows[0] || null
      }
      throw error
    }
  },
  async update(id, updateData) {
    return this.updateById(id, updateData)
  },
  async updateEmailLoginCode(email, code, expiresAt) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000) // 使用秒级时间戳
    
    try {
      const { rows } = await db.query(`
        UPDATE users
        SET email_login_code = $1, email_login_expires = $2, updated_at = $3
        WHERE email = $4
        RETURNING *
      `, [code, expiresAt, now, email])
      
      if (rows.length === 0) {
        // 如果用户不存在，创建一个新用户
        await this.createUser({
          username: email.split('@')[0],
          email: email,
          email_login_code: code,
          email_login_expires: expiresAt
        })
      }
    } catch (error) {
      // 处理数据库类型错误，如果字段类型不匹配，尝试使用不同的格式
      if (error.code === '22008') {
        console.log('[DB] 时间类型错误，尝试使用时间字符串格式存储验证码过期时间')
        const { rows } = await db.query(`
          UPDATE users
          SET email_login_code = $1, email_login_expires = $2, updated_at = $3
          WHERE email = $4
          RETURNING *
        `, [code, new Date(expiresAt).toISOString(), now, email])
        
        if (rows.length === 0) {
          await this.createUser({
            username: email.split('@')[0],
            email: email,
            email_login_code: code,
            email_login_expires: new Date(expiresAt).toISOString()
          })
        }
      } else {
        throw error
      }
    }
  },
  async getEmailLoginCode(email) {
    const db = await getDB()
    const { rows } = await db.query('SELECT email_login_code, email_login_expires FROM users WHERE email = $1', [email])
    return rows[0] || null
  },
  async updateUserId(oldUserId, newUserId) {
    const db = await getDB()
    await db.query('UPDATE users SET id = $1 WHERE id = $2', [newUserId, oldUserId])
  },
  async cleanupNonEmailCodeUsers() {
    const db = await getDB()
    const { rowCount } = await db.query('DELETE FROM users WHERE email_login_code IS NULL AND auth_provider = \'local\'')
    return rowCount
  },
  async deleteTestEmailUsers() {
    const db = await getDB()
    const { rowCount } = await db.query('DELETE FROM users WHERE email LIKE \'%test%\' OR email LIKE \'%example%\'')
    return rowCount
  },
  async getAllUsers() {
    const db = await getDB()
    const { rows } = await db.query('SELECT * FROM users ORDER BY created_at DESC')
    return rows
  },
  async getAll() {
    return this.getAllUsers()
  },
  async delete(id) {
    const db = await getDB()
    await db.query('DELETE FROM users WHERE id = $1', [id])
  }
}

// 作品数据库操作
export const workDB = {
  async getAllWorks() {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT w.*, u.username as creator, u.avatar_url
      FROM works w
      INNER JOIN users u ON w.creator_id::text = u.id::text
      WHERE w.status = 'published' AND w.visibility = 'public'
      ORDER BY w.created_at DESC
    `)
    return rows
  },
  async getAll(offset = 0, limit = 10) {
    const db = await getDB()
    const { rows } = await db.query('SELECT * FROM works ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset])
    return rows
  },
  async getById(id) {
    const db = await getDB()
    const { rows } = await db.query('SELECT * FROM works WHERE id = $1', [id])
    return rows[0] || null
  },
  async getWorksByUserId(userId, limit = 10, offset = 0) {
    const db = await getDB()
    const { rows } = await db.query('SELECT * FROM works WHERE creator_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [userId, limit, offset])
    return rows
  },
  async getByCreatorId(creatorId, offset = 0, limit = 10) {
    return this.getWorksByUserId(creatorId, limit, offset)
  },
  async createWork(workData) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000) // 使用秒级时间戳
    const id = workData.id || randomUUID()
    
    // 支持 creator_id 和 creatorId 两种字段名
    const creatorId = workData.creator_id || workData.creatorId
    
    if (!creatorId) {
      throw new Error('creator_id is required')
    }
    
    // 处理时间戳字段 - 确保是整数（秒级时间戳）
    const parseTimestamp = (value) => {
      if (!value) return null
      if (typeof value === 'number') return Math.floor(value)
      if (typeof value === 'string') {
        // 如果是 ISO 字符串，转换为秒级时间戳
        const date = new Date(value)
        return isNaN(date.getTime()) ? null : Math.floor(date.getTime() / 1000)
      }
      return null
    }
    
    const publishedAt = parseTimestamp(workData.published_at)
    const scheduledPublishDate = parseTimestamp(workData.scheduled_publish_date)
    const reviewedAt = parseTimestamp(workData.reviewed_at)
    
    const { rows } = await db.query(`
      INSERT INTO works (id, creator_id, title, description, thumbnail, duration, status, visibility, category, tags, cultural_elements, created_at, updated_at, published_at, scheduled_publish_date, moderation_status, rejection_reason, reviewer_id, reviewed_at, views, likes, comments, shares, downloads, engagement_rate, is_featured)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      RETURNING id
    `, [
      id,
      creatorId,
      workData.title,
      workData.description,
      workData.thumbnail,
      workData.duration,
      workData.status || 'draft',
      workData.visibility || 'private',
      workData.category,
      workData.tags,
      workData.culturalElements,
      now,
      now,
      publishedAt,
      scheduledPublishDate,
      workData.moderation_status || 'pending',
      workData.rejection_reason,
      workData.reviewer_id,
      reviewedAt,
      workData.views || 0,
      workData.likes || 0,
      workData.comments || 0,
      workData.shares || 0,
      workData.downloads || 0,
      workData.engagement_rate || 0,
      workData.is_featured || false
    ])
    
    return { id: rows[0].id }
  },
  // create 方法是 createWork 的别名，直接调用 createWork 的实现
  // 注意：不要在这里调用 this.createWork，因为 createWork 可能指向此方法，导致循环调用
  async create(workData) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000)
    const id = workData.id || randomUUID()
    
    // 支持 creator_id 和 creatorId 两种字段名
    const creatorId = workData.creator_id || workData.creatorId
    
    if (!creatorId) {
      throw new Error('creator_id is required')
    }
    
    // 处理时间戳字段 - 确保是整数（秒级时间戳）
    const parseTimestamp = (value) => {
      if (!value) return null
      if (typeof value === 'number') return Math.floor(value)
      if (typeof value === 'string') {
        // 如果是 ISO 字符串，转换为秒级时间戳
        const date = new Date(value)
        return isNaN(date.getTime()) ? null : Math.floor(date.getTime() / 1000)
      }
      return null
    }
    
    const publishedAt = parseTimestamp(workData.published_at)
    const scheduledPublishDate = parseTimestamp(workData.scheduled_publish_date)
    const reviewedAt = parseTimestamp(workData.reviewed_at)
    
    const { rows } = await db.query(`
      INSERT INTO works (id, creator_id, title, description, thumbnail, duration, status, visibility, category, tags, cultural_elements, created_at, updated_at, published_at, scheduled_publish_date, moderation_status, rejection_reason, reviewer_id, reviewed_at, views, likes, comments, shares, downloads, engagement_rate, is_featured)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      RETURNING id
    `, [
      id,
      creatorId,
      workData.title,
      workData.description,
      workData.thumbnail,
      workData.duration,
      workData.status || 'draft',
      workData.visibility || 'private',
      workData.category,
      workData.tags,
      workData.culturalElements,
      now,
      now,
      publishedAt,
      scheduledPublishDate,
      workData.moderation_status || 'pending',
      workData.rejection_reason,
      workData.reviewer_id,
      reviewedAt,
      workData.views || 0,
      workData.likes || 0,
      workData.comments || 0,
      workData.shares || 0,
      workData.downloads || 0,
      workData.engagement_rate || 0,
      workData.is_featured || false
    ])
    
    return { id: rows[0].id }
  },
  async getWorkStats(userId) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT 
        COUNT(*) as total_works,
        SUM(views) as total_views,
        SUM(likes) as total_likes,
        SUM(comments) as total_comments,
        SUM(shares) as total_shares,
        SUM(downloads) as total_downloads
      FROM works
      WHERE creator_id = $1
    `, [userId])
    return rows[0]
  },
  async addComment(workId, userId, content, parentId = null) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000) // 使用秒级时间戳
    const id = randomUUID()

    const { rows } = await db.query(`
      INSERT INTO work_comments (id, work_id, user_id, content, created_at, updated_at, parent_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [id, workId, userId, content, now, now, parentId])

    // 更新作品评论数
    await db.query('UPDATE works SET comments = comments + 1 WHERE id = $1', [workId])

    return rows[0]
  },

  async getWorkComments(workId, limit = 50, offset = 0) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT
        wc.id,
        wc.content,
        wc.created_at,
        wc.updated_at,
        wc.parent_id,
        wc.likes,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'avatar_url', u.avatar_url
        ) as user
      FROM work_comments wc
      JOIN users u ON wc.user_id = u.id
      WHERE wc.work_id = $1
      ORDER BY wc.created_at ASC
      LIMIT $2 OFFSET $3
    `, [workId, limit, offset])
    return rows
  },

  async likeWork(workId, userId) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000)

    try {
      await db.query(`
        INSERT INTO work_likes (id, work_id, user_id, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3)
      `, [workId, userId, now])

      // 更新作品点赞数
      await db.query('UPDATE works SET likes = likes + 1 WHERE id = $1', [workId])
      return { success: true }
    } catch (error) {
      // 唯一约束错误表示已经点赞过
      if (error.code === '23505') {
        return { success: false, error: 'Already liked' }
      }
      throw error
    }
  },

  async unlikeWork(workId, userId) {
    const db = await getDB()

    const { rowCount } = await db.query(`
      DELETE FROM work_likes WHERE work_id = $1 AND user_id = $2
    `, [workId, userId])

    if (rowCount > 0) {
      await db.query('UPDATE works SET likes = GREATEST(likes - 1, 0) WHERE id = $1', [workId])
    }

    return { success: rowCount > 0 }
  },

  async isWorkLiked(workId, userId) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT 1 FROM work_likes WHERE work_id = $1 AND user_id = $2
    `, [workId, userId])
    return rows.length > 0
  },

  async bookmarkWork(workId, userId) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000)

    try {
      await db.query(`
        INSERT INTO work_bookmarks (id, work_id, user_id, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3)
      `, [workId, userId, now])
      return { success: true }
    } catch (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Already bookmarked' }
      }
      throw error
    }
  },

  async unbookmarkWork(workId, userId) {
    const db = await getDB()

    await db.query(`
      DELETE FROM work_bookmarks WHERE work_id = $1 AND user_id = $2
    `, [workId, userId])

    return { success: true }
  },

  async isWorkBookmarked(workId, userId) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT 1 FROM work_bookmarks WHERE work_id = $1 AND user_id = $2
    `, [workId, userId])
    return rows.length > 0
  },

  async getUserBookmarkedWorks(userId, limit = 20, offset = 0) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT w.*, u.username as creator_name, u.avatar_url as creator_avatar
      FROM work_bookmarks wb
      JOIN works w ON wb.work_id = w.id
      JOIN users u ON w.creator_id = u.id
      WHERE wb.user_id = $1
      ORDER BY wb.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset])
    return rows
  },
  async getUserLikedWorks(userId, limit = 20, offset = 0) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT w.*, u.username as creator_name, u.avatar_url as creator_avatar
      FROM work_likes wl
      JOIN works w ON wl.work_id = w.id
      JOIN users u ON w.creator_id = u.id
      WHERE wl.user_id = $1
      ORDER BY wl.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset])
    return rows
  },
  async update(id, updateData) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000) // 使用秒级时间戳
    
    const fields = []
    const values = []
    let index = 1
    
    for (const [key, value] of Object.entries(updateData)) {
      fields.push(`${key} = $${index++}`)
      values.push(value)
    }
    fields.push(`updated_at = $${index++}`)
    values.push(now)
    values.push(id)
    
    const { rows } = await db.query(`
      UPDATE works
      SET ${fields.join(', ')}
      WHERE id = $${index}
      RETURNING *
    `, values)
    
    return rows[0] || null
  },
  async delete(id) {
    const db = await getDB()
    await db.query('DELETE FROM works WHERE id = $1', [id])
  }
}

// 收藏数据库操作
export const favoriteDB = {
  async getByUserId(userId) {
    const db = await getDB()
    const { rows } = await db.query('SELECT * FROM favorites WHERE user_id = $1', [userId])
    return rows
  },
  async create(userId, tutorialId) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000) // 使用秒级时间戳
    const id = randomUUID()
    
    await db.query(`
      INSERT INTO favorites (id, user_id, tutorial_id, created_at)
      VALUES ($1, $2, $3, $4)
    `, [id, userId, tutorialId, now])
    
    return { id }
  },
  async delete(userId, tutorialId) {
    const db = await getDB()
    await db.query('DELETE FROM favorites WHERE user_id = $1 AND tutorial_id = $2', [userId, tutorialId])
  }
}

// 成就数据库操作
export const achievementDB = {
  async getByUserId(userId) {
    // 这里可以添加成就相关的实现
    return []
  }
}

// 好友数据库操作
export const friendDB = {
  async searchUsers(query, currentUserId) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT id, username, email, avatar_url
      FROM users
      WHERE id != $1 AND (username ILIKE $2 OR email ILIKE $2)
      LIMIT 10
    `, [currentUserId, `%${query}%`])
    return rows
  },
  async sendRequest(senderId, receiverId) {
    // 这里可以添加好友请求相关的实现
    return { id: randomUUID(), sender_id: senderId, receiver_id: receiverId, status: 'pending', created_at: Math.floor(Date.now() / 1000) }
  },
  async getRequests(userId) {
    // 这里可以添加获取好友请求相关的实现
    return []
  },
  async acceptRequest(requestId) {
    // 这里可以添加接受好友请求相关的实现
  },
  async rejectRequest(requestId) {
    // 这里可以添加拒绝好友请求相关的实现
  },
  async getFriends(userId) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT f.id, f.friend_id, u.username, u.avatar_url
      FROM friends f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = $1
    `, [userId])
    
    return rows.map(row => ({
      id: row.id,
      friend_id: row.friend_id,
      friend: {
        id: row.friend_id,
        username: row.username,
        avatar_url: row.avatar_url
      }
    }))
  },
  async deleteFriend(userId, friendId) {
    const db = await getDB()
    await db.query('DELETE FROM friends WHERE user_id = $1 AND friend_id = $2', [userId, friendId])
  },
  async updateNote(userId, friendId, note) {
    // 这里可以添加更新好友备注相关的实现
  }
}

// 消息数据库操作
export const messageDB = {
  async sendMessage(senderId, receiverId, content) {
    const db = await getDB()
    const now = new Date().toISOString()
    const id = randomUUID()
    
    const { rows } = await db.query(`
      INSERT INTO messages (id, sender_id, receiver_id, content, type, status, is_read, created_at)
      VALUES ($1, $2, $3, $4, 'text', 'sent', false, $5)
      RETURNING *
    `, [id, senderId, receiverId, content.trim(), now])
    
    return rows[0]
  },
  async getMessages(userId, friendId, limit = 50, offset = 0) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT * FROM messages 
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
      LIMIT $3 OFFSET $4
    `, [userId, friendId, limit, offset])
    return rows
  },
  async getUnreadCount(userId) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT sender_id, COUNT(*) as count
      FROM messages
      WHERE receiver_id = $1 AND is_read = false
      GROUP BY sender_id
    `, [userId])
    
    const counts = {}
    rows.forEach(row => {
      counts[row.sender_id] = parseInt(row.count)
    })
    return counts
  },
  async markAsRead(userId, friendId) {
    const db = await getDB()
    await db.query(`
      UPDATE messages 
      SET is_read = true 
      WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false
    `, [userId, friendId])
  }
}

// 社区数据库操作
export const communityDB = {
  async getAllCommunities() {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT c.*, u.username as creator_name, u.avatar_url as creator_avatar
      FROM communities c
      INNER JOIN users u ON c.creator_id::text = u.id::text
      ORDER BY c.member_count DESC
    `)
    return rows
  },
  async getAll() {
    return this.getAllCommunities()
  },
  async getCommunityById(id) {
    const db = await getDB()
    const { rows } = await db.query('SELECT * FROM communities WHERE id::text = $1::text', [id])
    return rows[0] || null
  },
  async getById(id) {
    return this.getCommunityById(id)
  },
  async createCommunity(communityData) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000) // 使用秒级时间戳
    const id = communityData.id || randomUUID()
    
    try {
      const { rows } = await db.query(`
        INSERT INTO communities (id, name, description, avatar, member_count, topic, is_active, is_special, creator_id, created_at, updated_at, theme, layout_type, enabled_modules)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, name, description, avatar, member_count, topic, is_active, is_special
      `, [
        id,
        communityData.name,
        communityData.description,
        communityData.avatar,
        communityData.member_count || 0,
        communityData.topic,
        communityData.is_active || true,
        communityData.is_special || false,
        communityData.creator_id,
        now,
        now,
        communityData.theme ? JSON.stringify(communityData.theme) : null,
        communityData.layout_type || 'standard',
        communityData.enabled_modules ? JSON.stringify(communityData.enabled_modules) : null
      ])
      
      return rows[0]
    } catch (error) {
      // 处理时间戳类型错误
      if (error.code === '22008') {
        console.log('[DB] 时间戳类型错误，尝试使用字符串格式创建社群')
        const nowString = new Date().toISOString()
        const { rows } = await db.query(`
          INSERT INTO communities (id, name, description, avatar, member_count, topic, is_active, is_special, creator_id, created_at, updated_at, theme, layout_type, enabled_modules)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING id, name, description, avatar, member_count, topic, is_active, is_special
        `, [
          id,
          communityData.name,
          communityData.description,
          communityData.avatar,
          communityData.member_count || 0,
          communityData.topic,
          communityData.is_active || true,
          communityData.is_special || false,
          communityData.creator_id,
          nowString,
          nowString,
          communityData.theme ? JSON.stringify(communityData.theme) : null,
          communityData.layout_type || 'standard',
          communityData.enabled_modules ? JSON.stringify(communityData.enabled_modules) : null
        ])
        return rows[0]
      }
      throw error
    }
  },
  async create(communityData) {
    return this.createCommunity(communityData)
  },
  async updateCommunityCreatorId(communityId, creatorId) {
    const db = await getDB()
    await db.query('UPDATE communities SET creator_id = $1 WHERE id = $2', [creatorId, communityId])
  },
  async joinCommunity(userId, communityId, role = 'member') {
    const db = await getDB()
    
    try {
      // 根据实际表结构插入数据（使用 DEFAULT now() 让数据库自动处理时间戳）
      await db.query(`
        INSERT INTO community_members (community_id, user_id, role)
        VALUES ($1, $2, $3)
      `, [communityId, userId, role])
      
      // 更新社区成员数
      await db.query('UPDATE communities SET member_count = member_count + 1 WHERE id::text = $1::text', [communityId])
      
      console.log(`[joinCommunity] Success: user ${userId} joined community ${communityId}`)
      return true
    } catch (error) {
      console.error(`[joinCommunity] Error: user ${userId} failed to join community ${communityId}:`, error.message)
      // 忽略唯一约束错误
      return false
    }
  },
  async leaveCommunity(communityId, userId) {
    const db = await getDB()
    
    const { rowCount } = await db.query('DELETE FROM community_members WHERE community_id::text = $1::text AND user_id::text = $2::text', [communityId, userId])
    
    if (rowCount > 0) {
      await db.query('UPDATE communities SET member_count = member_count - 1 WHERE id::text = $1::text', [communityId])
    }
    
    return rowCount > 0
  },
  async isCommunityMember(userId, communityId) {
    const db = await getDB()
    const { rows } = await db.query('SELECT * FROM community_members WHERE community_id::text = $1::text AND user_id::text = $2::text', [communityId, userId])
    return rows.length > 0
  },
  async getCommunityStats(communityId) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM community_members WHERE community_id = $1) as member_count,
        0 as post_count,
        0 as comment_count
    `, [communityId])
    return rows[0]
  },
  async createCommunityPost(postData) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000)
    const id = randomUUID()
    
    const { rows } = await db.query(`
      INSERT INTO posts (id, community_id, user_id, title, content, images, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      id,
      postData.communityId,
      postData.userId,
      postData.title,
      postData.content,
      postData.images || [],
      'published',
      now,
      now
    ])
    
    return rows[0]
  },
  async addComment(postId, userId, content, parentId = null) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000)
    const id = randomUUID()
    
    const { rows } = await db.query(`
      INSERT INTO comments (id, post_id, user_id, content, parent_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [id, postId, userId, content, parentId, now, now])
    
    // 更新帖子的评论数
    await db.query(`
      UPDATE posts SET comments_count = comments_count + 1, updated_at = $1 WHERE id = $2
    `, [now, postId])
    
    return rows[0]
  },
  async getCommunityPosts(communityId, limit = 20, offset = 0) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT p.*, u.username as author_name, u.avatar_url as author_avatar
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.community_id = $1 AND p.status = 'published'
      ORDER BY p.is_pinned DESC, p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [communityId, limit, offset])
    return rows
  },
  async getPostComments(postId, limit = 50, offset = 0) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT c.*, u.username as author_name, u.avatar_url as author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3
    `, [postId, limit, offset])
    return rows
  },
  async getUserCommunities(userId) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT c.*
      FROM communities c
      JOIN community_members cm ON c.id::text = cm.community_id::text
      WHERE cm.user_id::text = $1::text
    `, [userId])
    
    return rows
  }
}

// 通知数据库操作
export const notificationDB = {
  async getByUserId(userId) {
    // 这里可以添加通知相关的实现
    return []
  },
  async getNotifications(userId) {
    // 返回通知列表
    return []
  }
}

// 事件数据库操作
export const eventDB = {
  async create(eventData) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000) // 使用秒级时间戳
    const id = eventData.id || randomUUID()
    
    const { rows } = await db.query(`
      INSERT INTO events (id, title, description, start_date, end_date, location, organizer_id, requirements, rewards, visibility, status, registration_deadline, max_participants, created_at, updated_at, published_at, image_url, category, tags, platform_event_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING id
    `, [
      id,
      eventData.title,
      eventData.description,
      eventData.start_date,
      eventData.end_date,
      eventData.location,
      eventData.organizer_id,
      eventData.requirements,
      eventData.rewards,
      eventData.visibility || 'public',
      eventData.status || 'draft',
      eventData.registration_deadline,
      eventData.max_participants,
      now,
      now,
      eventData.published_at,
      eventData.image_url,
      eventData.category,
      eventData.tags,
      eventData.platform_event_id
    ])
    
    return { id: rows[0].id }
  },
  async getById(id) {
    const db = await getDB()
    const { rows } = await db.query('SELECT * FROM events WHERE id = $1', [id])
    return rows[0] || null
  },
  async update(id, updateData) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000) // 使用秒级时间戳
    
    const fields = []
    const values = []
    let index = 1
    
    for (const [key, value] of Object.entries(updateData)) {
      fields.push(`${key} = $${index++}`)
      values.push(value)
    }
    fields.push(`updated_at = $${index++}`)
    values.push(now)
    values.push(id)
    
    const { rows } = await db.query(`
      UPDATE events
      SET ${fields.join(', ')}
      WHERE id = $${index}
      RETURNING *
    `, values)
    
    return rows[0] || null
  },
  async delete(id) {
    const db = await getDB()
    await db.query('DELETE FROM events WHERE id = $1', [id])
    return true
  },
  async getEvents(filters = {}) {
    const db = await getDB()
    let sql = `
      SELECT e.*, u.username as organizer_name, u.avatar_url as organizer_avatar
      FROM events e
      INNER JOIN users u ON e.organizer_id::text = u.id::text
      WHERE 1=1
    `
    const params = []
    let index = 1
    
    if (filters.creatorId) {
      sql += ` AND e.creator_id = $${index++}`
      params.push(filters.creatorId)
    }
    if (filters.status) {
      sql += ` AND e.status = $${index++}`
      params.push(filters.status)
    }
    
    sql += ' ORDER BY e.created_at DESC'
    
    const { rows } = await db.query(sql, params)
    return rows
  }
}

// 评论数据库操作
export const commentDB = {
  async create(postId, userId, content, parentId = null) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000) // 使用秒级时间戳
    const id = randomUUID()
    
    const { rows } = await db.query(`
      INSERT INTO comments (id, post_id, user_id, content, created_at, updated_at, parent_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [id, postId, userId, content, now, now, parentId])
    
    return { id: rows[0].id }
  },
  async getByPostId(postId) {
    const db = await getDB()
    const { rows } = await db.query('SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC', [postId])
    return rows
  },
  async delete(id, userId) {
    const db = await getDB()
    await db.query('DELETE FROM comments WHERE id = $1 AND user_id = $2', [id, userId])
  }
}

// 活动数据库操作
export const activityDB = {
  async create(userId, actionType, entityType, entityId, details, content, targetId = null) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000) // 使用秒级时间戳
    const id = randomUUID()
    
    await db.query(`
      INSERT INTO user_activities (id, user_id, action_type, entity_type, entity_id, target_id, details, content, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [id, userId, actionType, entityType, entityId, targetId, details, content, now])
    
    return { id }
  },
  async getByUserId(userId, limit = 50) {
    const db = await getDB()
    const { rows } = await db.query('SELECT * FROM user_activities WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2', [userId, limit])
    return rows
  }
}

// 添加缺失的方法，确保API调用正常工作
// userDB 额外方法
userDB.updateUserId = async function(oldUserId, newUserId) {
  const db = await getDB()
  // 这里需要实现用户ID更新的逻辑，包括更新所有相关表的外键
  // 为了简化，我们只更新用户表本身
  await db.query('UPDATE users SET id = $1 WHERE id = $2', [newUserId, oldUserId])
}

// workDB 额外方法
// 注意：getAllWorks 方法已在上面定义，不要重复定义

workDB.createWork = function(workData) {
  return this.create(workData)
}

workDB.getWorksByUserId = function(userId, limit = 10, offset = 0) {
  return this.getByCreatorId(userId, offset, limit)
}

workDB.getWorkStats = async function(userId) {
  const db = await getDB()
  const { rows } = await db.query(`
    SELECT 
      COUNT(*) as total_works,
      SUM(views) as total_views,
      SUM(likes) as total_likes,
      SUM(comments) as total_comments
    FROM works 
    WHERE creator_id = $1
  `, [userId])
  return rows[0] || { total_works: 0, total_views: 0, total_likes: 0, total_comments: 0 }
}

// achievementDB 额外方法
achievementDB.getUserTotalPoints = async function(userId) {
  // 简化实现，返回固定值
  return 0
}

achievementDB.getUserAchievements = async function(userId) {
  // 简化实现，返回空数组
  return []
}

achievementDB.getPointsRecords = async function(userId) {
  // 简化实现，返回空数组
  return []
}

// favoriteDB 额外方法
favoriteDB.getUserFavorites = function(userId) {
  return this.getByUserId(userId)
}

// eventDB 额外方法
eventDB.createEvent = function(eventData) {
  return this.create(eventData)
}

eventDB.getEvent = function(id) {
  return this.getById(id)
}

// communityDB 额外方法
communityDB.getAll = function() {
  return this.getAllCommunities()
}

communityDB.updateCommunityCreatorId = async function(communityId, creatorId) {
  const db = await getDB()
  await db.query('UPDATE communities SET creator_id = $1 WHERE id = $2', [creatorId, communityId])
}

// 导出配置和状态
export { config, connectionStatus, retryCounts }

// 初始化默认数据库连接
// 在 Serverless 环境下，避免在模块加载时立即建立连接，改为按需连接
// 这可以防止冷启动超时，并允许不使用数据库的 API（如 LLM 代理）在数据库连接失败时也能正常工作
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  getDB().catch(error => {
    log(`Database pre-connection failed: ${error.message}`, 'ERROR')
  })
}
