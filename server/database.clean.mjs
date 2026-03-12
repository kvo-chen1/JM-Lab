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

      if (existingUsers.length === 0) {
        // 创建 users 表
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
            following_count INTEGER DEFAULT 0
          )
        `)
      } else {
        // 确保必要的列存在
        await ensureColumn('users', 'github_id', 'TEXT UNIQUE')
        await ensureColumn('users', 'github_username', 'TEXT')
        await ensureColumn('users', 'auth_provider', "TEXT DEFAULT 'local'")
        await ensureColumn('users', 'is_new_user', 'BOOLEAN DEFAULT true')
        await ensureColumn('users', 'membership_level', "TEXT DEFAULT 'free'")
        await ensureColumn('users', 'membership_status', "TEXT DEFAULT 'active'")
        await ensureColumn('users', 'membership_start', 'BIGINT')
        await ensureColumn('users', 'membership_end', 'BIGINT')
        await ensureColumn('users', 'posts_count', 'INTEGER DEFAULT 0')
        await ensureColumn('users', 'likes_count', 'INTEGER DEFAULT 0')
        await ensureColumn('users', 'views', 'INTEGER DEFAULT 0')
        await ensureColumn('users', 'followers_count', 'INTEGER DEFAULT 0')
        await ensureColumn('users', 'following_count', 'INTEGER DEFAULT 0')
      }

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

      // 创建 works 表
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

      // 创建 events 表
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          description TEXT,
          start_date BIGINT NOT NULL,
          end_date BIGINT NOT NULL,
          location TEXT,
          organizer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
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
          event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
          event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          work_id UUID REFERENCES public.works(id) ON DELETE SET NULL,
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

      // 创建 posts 表
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          status TEXT DEFAULT 'published',
          visibility TEXT DEFAULT 'public',
          topic TEXT,
          images TEXT[],
          likes INTEGER DEFAULT 0,
          comments INTEGER DEFAULT 0,
          views INTEGER DEFAULT 0
        )
      `)

      // 创建 comments 表
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          parent_id UUID REFERENCES public.comments(id) ON DELETE SET NULL
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
      await client.query(`CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_posts_community_id ON public.posts(community_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id)`)

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

// 导出配置和状态
export { config, connectionStatus, retryCounts }
