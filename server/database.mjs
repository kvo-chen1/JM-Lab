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
  // Vercel 环境优先使用 POSTGRES_URL（Vercel 集成 Supabase 时自动设置）
  // 注意：DATABASE_URL 可能包含占位符 [YOUR-PASSWORD]，不能使用
  if (process.env.VERCEL && process.env.POSTGRES_URL) {
    console.log('[DB] Using POSTGRES_URL (Vercel environment)');
    let url = process.env.POSTGRES_URL;
    try {
      const urlObj = new URL(url);
      if (urlObj.searchParams.has('sslmode')) {
        urlObj.searchParams.delete('sslmode');
        url = urlObj.toString();
        console.log('[DB] Removed sslmode from POSTGRES_URL');
      }
    } catch (e) {
      // 忽略 URL 解析错误
    }
    return url;
  }

  // 1. 优先使用 PgBouncer 事务模式 (端口 6543)
  // 这是 Supabase 推荐的连接方式，支持更多并发连接
  if (process.env.POSTGRES_URL) {
    console.log('[DB] Using POSTGRES_URL (PgBouncer Transaction Mode)');
    let url = process.env.POSTGRES_URL;
    try {
      const urlObj = new URL(url);
      if (urlObj.searchParams.has('sslmode')) {
        urlObj.searchParams.delete('sslmode');
        url = urlObj.toString();
        console.log('[DB] Removed sslmode from POSTGRES_URL');
      }
    } catch (e) {
      // 忽略 URL 解析错误
    }
    return url;
  }

  // 2. 本地环境使用 DATABASE_URL
  if (!process.env.VERCEL && process.env.DATABASE_URL) {
    console.log('[DB] Using DATABASE_URL (local environment)');
    return process.env.DATABASE_URL;
  }
  
  // 3. 使用 NON_POOLING (Session Mode, port 5432) - 仅作为备选
  // 注意：Session 模式限制最大连接数，不适合高并发
  if (process.env.POSTGRES_URL_NON_POOLING) {
    console.log('[DB] Using POSTGRES_URL_NON_POOLING (Session Mode - limited connections)');
    let url = process.env.POSTGRES_URL_NON_POOLING;
    try {
      const urlObj = new URL(url);
      if (urlObj.searchParams.has('sslmode')) {
        urlObj.searchParams.delete('sslmode');
        url = urlObj.toString();
        console.log('[DB] Removed sslmode from POSTGRES_URL_NON_POOLING');
      }
    } catch (e) {
      // 忽略 URL 解析错误
    }
    return url;
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
  
  // 5. Vercel环境下的fallback：使用 PgBouncer 事务模式
  if (process.env.VERCEL && process.env.SUPABASE_URL) {
    console.log('[DB] Using Vercel fallback connection string for Supabase (PgBouncer)');
    return 'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';
  }
  
  // 6. 本地环境fallback
  if (process.env.DB_TYPE === 'supabase') {
    console.log('[DB] Using fallback connection string for Supabase');
    return 'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';
  }
  
  return null
}

// 自动检测数据库类型
const detectDbType = () => {
  // 优先使用环境变量指定的数据库类型
  if (process.env.DB_TYPE) return process.env.DB_TYPE
  
  // Vercel 环境检测
  if (process.env.VERCEL) {
    // 如果配置了 PostgreSQL 相关的环境变量，优先使用 PostgreSQL
    if (process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.SUPABASE_URL) {
      return DB_TYPE.POSTGRESQL;
    }
    // Vercel 环境默认使用 PostgreSQL（即使没有环境变量，我们有 fallback 逻辑）
    return DB_TYPE.POSTGRESQL;
  }

  // 如果配置了 Supabase 和 PostgreSQL URL，则使用 Supabase
  if (process.env.SUPABASE_URL && process.env.POSTGRES_URL) return DB_TYPE.SUPABASE
  // 如果有数据库 URL，则使用 PostgreSQL
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) return DB_TYPE.POSTGRESQL
  
  // 本地环境默认使用 PostgreSQL
  return DB_TYPE.POSTGRESQL;
}

const currentDbType = detectDbType()
const connectionString = getPostgresConnectionString()

// 配置管理
const config = {
  // 数据库类型选择
  dbType: currentDbType,
  
  // PostgreSQL (Supabase/Standard) 配置 - 优化连接池
  // 注意：Supabase 免费计划限制：
  // - 出口流量：5GB/月（已超出）
  // - PgBouncer 连接数：最多 200 个并发连接
  // - Session 模式：最多 3 个连接（很容易超限）
  // 优化策略：使用 PgBouncer 事务模式 + 极小的连接池
  postgresql: {
    connectionString: connectionString,
    options: {
      // 连接池大小优化：使用极小的连接池
      // PgBouncer 事务模式支持更多连接，但仍需限制以减少出口流量
      max: parseInt(process.env.POSTGRES_MAX_POOL_SIZE || '1'),
      // 最小连接数：不保持空闲连接
      min: 0,
      // 空闲连接超时：快速释放不用的连接 (3秒)
      idleTimeoutMillis: 3000,
      // 连接超时：快速失败，避免长时间等待
      connectionTimeoutMillis: 5000,
      // 连接最大生命周期：防止连接长时间不释放 (1分钟)
      maxLifetime: 60000,
      // SSL 配置：Supabase 通常需要 SSL。本地开发可能不需要。
      ssl: (connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')) ? {
        rejectUnauthorized: false // 允许自签名证书 (Supabase 兼容性)
      } : false,
      // 查询超时设置：避免长时间运行的查询阻塞连接
      statement_timeout: 5000, // 5秒查询超时
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

// 简单的查询缓存 - 用于减少 Supabase 出口流量
const queryCache = new Map();
const QUERY_CACHE_TTL = 60000; // 1分钟缓存

// 缓存辅助函数
function getQueryCache(key) {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL) {
    return cached.data;
  }
  queryCache.delete(key);
  return null;
}

function setQueryCache(key, data) {
  queryCache.set(key, { data, timestamp: Date.now() });
}

// 定期清理过期缓存
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of queryCache.entries()) {
    if (now - value.timestamp > QUERY_CACHE_TTL) {
      queryCache.delete(key);
    }
  }
}, 300000); // 每5分钟清理一次

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

    log(`Initializing PostgreSQL Pool (Max: ${options.max}, Timeout: ${options.connectionTimeoutMillis}ms)...`)
    log(`Using connection string: ${connectionString?.substring(0, 50)}...`)
    
    // 构建 Pool 配置
    // Vercel 环境下需要特殊处理 SSL 配置
    const poolConfig = {
      connectionString,
      max: options.max,
      min: options.min,
      idleTimeoutMillis: options.idleTimeoutMillis,
      connectionTimeoutMillis: options.connectionTimeoutMillis,
      // 添加 maxLifetime 配置，防止连接长时间不释放
      maxLifetime: options.maxLifetime || 300000,
      // 配置日志级别，避免输出连接内存地址
      log: (msg) => {
        // 只记录错误级别的日志，忽略调试信息
        if (msg.includes('error') || msg.includes('Error')) {
          log(`PostgreSQL Pool: ${msg}`, 'ERROR')
        }
      }
    }
    
    // SSL 配置处理
    // Vercel 环境或远程连接需要禁用 SSL 证书验证
    if (connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')) {
      // 在 Vercel 环境下，强制禁用 SSL 证书验证
      // 这是必要的，因为 Supabase 使用自签名证书
      poolConfig.ssl = {
        rejectUnauthorized: false,
        // 允许不安全的 TLS 连接（仅用于开发/测试环境）
        // 在生产环境中应该使用正确的证书配置
      }
      log('SSL config: rejectUnauthorized=false')
    }
    
    const pool = new Pool(poolConfig)
    
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
      await ensureColumn('users', 'is_admin', 'BOOLEAN DEFAULT false')

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
          video_url TEXT,
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

      // 创建 notifications 表（通知）
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
          sender_name TEXT,
          sender_avatar TEXT,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          action_url TEXT,
          entity_type TEXT,
          entity_id UUID,
          is_read BOOLEAN DEFAULT false,
          read_at BIGINT,
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint
        )
      `)

      // 创建 notifications 索引
      await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type)`)

      // 创建 user_sessions 表（用户会话/在线状态）
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.user_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          session_token TEXT,
          ip_address TEXT,
          user_agent TEXT,
          last_active BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          UNIQUE(user_id)
        )
      `)

      // 创建 user_sessions 索引
      await client.query(`CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON public.user_sessions(last_active DESC)`)

      // 创建 messages 表（私信）
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          type TEXT DEFAULT 'text',
          status TEXT DEFAULT 'sent',
          is_read BOOLEAN DEFAULT false,
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint
        )
      `)

      // 创建 messages 索引
      await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON public.messages(receiver_id, is_read)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC)`)

      // 创建 follows 表（关注关系）
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.follows (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
          UNIQUE(follower_id, following_id)
        )
      `)

      // 创建 follows 索引
      await client.query(`CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id)`)

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
    // 生成缓存键
    const cacheKey = 'works_all_published';
    
    // 检查缓存
    const cached = getQueryCache(cacheKey);
    if (cached) {
      console.log('[DB] Cache hit for workDB.getAllWorks');
      return cached;
    }
    
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT w.*, u.username as creator, u.avatar_url
      FROM works w
      INNER JOIN users u ON w.creator_id::text = u.id::text
      WHERE w.status = 'published' AND w.visibility = 'public'
      ORDER BY w.created_at DESC
    `)
    
    // 缓存结果
    setQueryCache(cacheKey, rows);
    console.log('[DB] Cache set for workDB.getAllWorks');
    
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
  async getWorkById(id) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT w.*, u.username as creator, u.avatar_url
      FROM works w
      INNER JOIN users u ON w.creator_id::text = u.id::text
      WHERE w.id = $1
    `, [id])
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
      INSERT INTO works (id, creator_id, title, description, thumbnail, video_url, duration, status, visibility, category, tags, cultural_elements, created_at, updated_at, published_at, scheduled_publish_date, moderation_status, rejection_reason, reviewer_id, reviewed_at, views, likes, comments, shares, downloads, engagement_rate, is_featured, type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
      RETURNING id
    `, [
      id,
      creatorId,
      workData.title,
      workData.description,
      workData.thumbnail,
      workData.video_url || workData.videoUrl || null,
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
      workData.is_featured || false,
      workData.type || 'image'
    ])
    
    // 更新用户的作品数量
    try {
      await db.query(`
        UPDATE users 
        SET posts_count = posts_count + 1, updated_at = $1 
        WHERE id = $2
      `, [now, creatorId])
    } catch (updateError) {
      console.error('Failed to update user posts_count:', updateError)
      // 不影响主流程，继续返回作品ID
    }
    
    // 返回完整的作品数据，包括所有字段
    const createdWork = {
      id: rows[0].id,
      creator_id: creatorId,
      title: workData.title,
      description: workData.description,
      thumbnail: workData.thumbnail,
      video_url: workData.video_url || workData.videoUrl || null,
      duration: workData.duration,
      status: workData.status || 'draft',
      visibility: workData.visibility || 'private',
      category: workData.category,
      tags: workData.tags,
      cultural_elements: workData.culturalElements,
      created_at: now,
      updated_at: now,
      published_at: publishedAt,
      scheduled_publish_date: scheduledPublishDate,
      moderation_status: workData.moderation_status || 'pending',
      rejection_reason: workData.rejection_reason,
      reviewer_id: workData.reviewer_id,
      reviewed_at: reviewedAt,
      views: workData.views || 0,
      likes: workData.likes || 0,
      comments: workData.comments || 0,
      shares: workData.shares || 0,
      downloads: workData.downloads || 0,
      engagement_rate: workData.engagement_rate || 0,
      is_featured: workData.is_featured || false,
      type: workData.type || 'image'
    }
    
    return createdWork
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
      INSERT INTO works (id, creator_id, title, description, thumbnail, video_url, duration, status, visibility, category, tags, cultural_elements, created_at, updated_at, published_at, scheduled_publish_date, moderation_status, rejection_reason, reviewer_id, reviewed_at, views, likes, comments, shares, downloads, engagement_rate, is_featured, type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
      RETURNING id
    `, [
      id,
      creatorId,
      workData.title,
      workData.description,
      workData.thumbnail,
      workData.video_url || workData.videoUrl || null,
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
      workData.is_featured || false,
      workData.type || 'image'
    ])
    
    // 更新用户的作品数量
    try {
      await db.query(`
        UPDATE users 
        SET posts_count = posts_count + 1, updated_at = $1 
        WHERE id = $2
      `, [now, creatorId])
    } catch (updateError) {
      console.error('Failed to update user posts_count:', updateError)
      // 不影响主流程，继续返回作品ID
    }
    
    // 返回完整的作品数据，包括所有字段
    const createdWork = {
      id: rows[0].id,
      creator_id: creatorId,
      title: workData.title,
      description: workData.description,
      thumbnail: workData.thumbnail,
      video_url: workData.video_url || workData.videoUrl || null,
      duration: workData.duration,
      status: workData.status || 'draft',
      visibility: workData.visibility || 'private',
      category: workData.category,
      tags: workData.tags,
      cultural_elements: workData.culturalElements,
      created_at: now,
      updated_at: now,
      published_at: publishedAt,
      scheduled_publish_date: scheduledPublishDate,
      moderation_status: workData.moderation_status || 'pending',
      rejection_reason: workData.rejection_reason,
      reviewer_id: workData.reviewer_id,
      reviewed_at: reviewedAt,
      views: workData.views || 0,
      likes: workData.likes || 0,
      comments: workData.comments || 0,
      shares: workData.shares || 0,
      downloads: workData.downloads || 0,
      engagement_rate: workData.engagement_rate || 0,
      is_featured: workData.is_featured || false,
      type: workData.type || 'image'
    }
    
    return createdWork
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

    // 创建评论通知
    try {
      // 获取作品信息
      const { rows: workRows } = await db.query('SELECT creator_id, title FROM works WHERE id = $1', [workId])
      if (workRows.length > 0 && workRows[0].creator_id && workRows[0].creator_id !== userId) {
        // 获取评论者信息
        const { rows: userRows } = await db.query('SELECT username, avatar_url FROM users WHERE id = $1', [userId])
        const senderName = userRows[0]?.username || '有人'
        const senderAvatar = userRows[0]?.avatar_url || null

        // 如果是回复评论，获取被回复者信息
        let recipientId = workRows[0].creator_id
        let notificationTitle = `${senderName} 评论了你的作品`
        let notificationMessage = `作品《${workRows[0].title || '未命名作品'}》收到了新评论: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`

        if (parentId) {
          // 获取父评论信息
          const { rows: parentRows } = await db.query('SELECT user_id FROM work_comments WHERE id = $1', [parentId])
          if (parentRows.length > 0 && parentRows[0].user_id && parentRows[0].user_id !== userId) {
            recipientId = parentRows[0].user_id
            notificationTitle = `${senderName} 回复了你的评论`
            notificationMessage = `"${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`
          }
        }

        // 创建通知
        await notificationDB.create({
          user_id: recipientId,
          sender_id: userId,
          sender_name: senderName,
          sender_avatar: senderAvatar,
          type: parentId ? 'comment_reply' : 'comment',
          title: notificationTitle,
          message: notificationMessage,
          action_url: `/works/${workId}`,
          entity_type: 'work',
          entity_id: workId
        })
      }
    } catch (notifError) {
      console.error('Failed to create comment notification:', notifError)
      // 不影响主流程
    }

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

      // 获取作品创建者并更新其获赞数，同时创建通知
      try {
        const { rows: workRows } = await db.query('SELECT creator_id, title FROM works WHERE id = $1', [workId])
        if (workRows.length > 0 && workRows[0].creator_id) {
          await db.query(`
            UPDATE users
            SET likes_count = likes_count + 1, updated_at = $1
            WHERE id = $2
          `, [now, workRows[0].creator_id])

          // 获取点赞者信息
          const { rows: userRows } = await db.query('SELECT username, avatar_url FROM users WHERE id = $1', [userId])
          const senderName = userRows[0]?.username || '有人'
          const senderAvatar = userRows[0]?.avatar_url || null

          // 创建点赞通知（不给自己点赞发通知）
          if (workRows[0].creator_id !== userId) {
            try {
              await notificationDB.create({
                user_id: workRows[0].creator_id,
                sender_id: userId,
                sender_name: senderName,
                sender_avatar: senderAvatar,
                type: 'like',
                title: `${senderName} 赞了你的作品`,
                message: `作品《${workRows[0].title || '未命名作品'}》收到了新的点赞`,
                action_url: `/works/${workId}`,
                entity_type: 'work',
                entity_id: workId
              })
            } catch (notifError) {
              console.error('Failed to create like notification:', notifError)
              // 不影响主流程
            }
          }
        }
      } catch (updateError) {
        console.error('Failed to update user likes_count:', updateError)
        // 不影响主流程
      }

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
    const now = Math.floor(Date.now() / 1000)

    const { rowCount } = await db.query(`
      DELETE FROM work_likes WHERE work_id = $1 AND user_id = $2
    `, [workId, userId])

    if (rowCount > 0) {
      await db.query('UPDATE works SET likes = GREATEST(likes - 1, 0) WHERE id = $1', [workId])
      
      // 获取作品创建者并减少其获赞数
      try {
        const { rows } = await db.query('SELECT creator_id FROM works WHERE id = $1', [workId])
        if (rows.length > 0 && rows[0].creator_id) {
          await db.query(`
            UPDATE users 
            SET likes_count = GREATEST(likes_count - 1, 0), updated_at = $1 
            WHERE id = $2
          `, [now, rows[0].creator_id])
        }
      } catch (updateError) {
        console.error('Failed to update user likes_count:', updateError)
        // 不影响主流程
      }
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
    // 生成缓存键
    const cacheKey = `messages_unread_${userId}`;
    
    // 检查缓存
    const cached = getQueryCache(cacheKey);
    if (cached) {
      console.log('[DB] Cache hit for getUnreadCount');
      return cached;
    }
    
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
    
    // 缓存结果
    setQueryCache(cacheKey, counts);
    console.log('[DB] Cache set for getUnreadCount');
    
    return counts
  },
  async markAsRead(userId, friendId) {
    const db = await getDB()
    await db.query(`
      UPDATE messages 
      SET is_read = true 
      WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false
    `, [userId, friendId])
  },
  
  // 检查用户是否是另一个用户的关注者（粉丝）
  async isFollower(followerId, followingId) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT 1 FROM follows 
      WHERE follower_id = $1 AND following_id = $2
      LIMIT 1
    `, [followerId, followingId])
    return rows.length > 0
  },
  
  // 检查双方是否互相关注（回关）
  async isMutualFollow(userId1, userId2) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT 1 FROM follows 
      WHERE follower_id = $1 AND following_id = $2
      LIMIT 1
    `, [userId1, userId2])
    
    if (rows.length === 0) return false
    
    const { rows: rows2 } = await db.query(`
      SELECT 1 FROM follows 
      WHERE follower_id = $1 AND following_id = $2
      LIMIT 1
    `, [userId2, userId1])
    
    return rows2.length > 0
  },
  
  // 检查用户是否可以发送私信（权限控制）
  async canSendMessage(senderId, receiverId) {
    const db = await getDB()
    
    // 1. 检查接收者是否允许私信（这里默认允许，可以扩展为用户设置）
    // 2. 检查发送者是否是接收者的关注者（仅关注者可发送模式）
    const isFollower = await this.isFollower(senderId, receiverId)
    
    if (!isFollower) {
      return { allowed: false, reason: '仅关注者可发送私信' }
    }
    
    // 3. 检查是否是互相关注（回关）
    const isMutual = await this.isMutualFollow(senderId, receiverId)
    
    if (isMutual) {
      // 互相关注，可以无限发送
      return { allowed: true }
    }
    
    // 4. 单向关注情况：检查是否已发送过第一条消息且未收到回复
    // 发送者是关注者但不是互相关注，需要检查单向私信限制
    const { rows } = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM messages WHERE sender_id = $1 AND receiver_id = $2) as sent_count,
        (SELECT COUNT(*) FROM messages WHERE sender_id = $2 AND receiver_id = $1) as received_count
    `, [senderId, receiverId])
    
    const sentCount = parseInt(rows[0].sent_count)
    const receivedCount = parseInt(rows[0].received_count)
    
    // 如果没有发送过消息，允许发送第一条
    if (sentCount === 0) {
      return { allowed: true }
    }
    
    // 如果已发送消息但没有收到回复，禁止继续发送
    if (receivedCount === 0) {
      return { 
        allowed: false, 
        reason: '对方回复前，你无法继续发送私信',
        waitingForReply: true
      }
    }
    
    // 已收到回复，可以正常发送
    return { allowed: true }
  },
  
  // 获取用户的私信会话列表（包含最后一条消息预览）
  async getConversations(userId) {
    const db = await getDB()
    
    console.log('[getConversations] 查询用户会话:', userId, '类型:', typeof userId)
    
    try {
      // 使用简单的查询获取会话列表
      const { rows } = await db.query(`
        SELECT 
          u.id as partner_id,
          u.username,
          u.avatar_url,
          m.content as last_message,
          m.created_at as last_message_time,
          m.sender_id as last_sender_id,
          m.is_read as last_message_read,
          COALESCE(unread.count, 0) as unread_count
        FROM (
          SELECT 
            CASE 
              WHEN sender_id = $1 THEN receiver_id 
              ELSE sender_id 
            END as partner_id,
            MAX(created_at) as max_created_at
          FROM messages
          WHERE sender_id = $1 OR receiver_id = $1
          GROUP BY 
            CASE 
              WHEN sender_id = $1 THEN receiver_id 
              ELSE sender_id 
            END
        ) latest
        JOIN messages m ON (
          ((m.sender_id = $1 AND m.receiver_id = latest.partner_id) OR 
           (m.sender_id = latest.partner_id AND m.receiver_id = $1))
          AND m.created_at = latest.max_created_at
        )
        JOIN users u ON latest.partner_id = u.id
        LEFT JOIN (
          SELECT sender_id, COUNT(*) as count
          FROM messages
          WHERE receiver_id = $1 AND is_read = false
          GROUP BY sender_id
        ) unread ON latest.partner_id = unread.sender_id
        ORDER BY m.created_at DESC
      `, [userId])
      
      console.log('[getConversations] 查询结果:', rows.length, '个会话')
      
      return rows.map(row => ({
        userId: row.partner_id,
        username: row.username,
        avatar: row.avatar_url,
        lastMessage: row.last_message || '',
        lastMessageTime: row.last_message_time || '',
        lastSenderId: row.last_sender_id,
        isLastMessageRead: row.last_message_read,
        unreadCount: parseInt(row.unread_count)
      }))
    } catch (error) {
      console.error('[getConversations] SQL查询错误:', error)
      // 返回空数组而不是抛出错误
      return []
    }
  }
}

// 社区数据库操作
export const communityDB = {
  async getAllCommunities() {
    // 生成缓存键
    const cacheKey = 'communities_all';
    
    // 检查缓存
    const cached = getQueryCache(cacheKey);
    if (cached) {
      console.log('[DB] Cache hit for communityDB.getAllCommunities');
      return cached;
    }
    
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT c.*, u.username as creator_name, u.avatar_url as creator_avatar
      FROM communities c
      INNER JOIN users u ON c.creator_id::text = u.id::text
      ORDER BY c.member_count DESC
    `)
    
    // 缓存结果
    setQueryCache(cacheKey, rows);
    console.log('[DB] Cache set for communityDB.getAllCommunities');
    
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
    const oneWeekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 5 * 60

    const { rows } = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM community_members WHERE community_id::text = $1::text) as member_count,
        (SELECT COUNT(*) FROM posts WHERE community_id::text = $1::text AND status = 'published') as post_count,
        (SELECT COUNT(*) FROM comments c 
         JOIN posts p ON c.post_id = p.id 
         WHERE p.community_id::text = $1::text) as comment_count,
        (SELECT COUNT(DISTINCT user_id) FROM posts 
         WHERE community_id::text = $1::text AND created_at > $2) as weekly_visitors,
        (SELECT COUNT(*) FROM posts 
         WHERE community_id::text = $1::text AND created_at > $2) + 
        (SELECT COUNT(*) FROM comments c 
         JOIN posts p ON c.post_id = p.id 
         WHERE p.community_id::text = $1::text AND c.created_at > $2) as weekly_interactions,
        (SELECT COUNT(*) FROM community_members 
         WHERE community_id::text = $1::text AND last_active > $3) as online_count
    `, [communityId, oneWeekAgo, fiveMinutesAgo])

    return {
      member_count: parseInt(rows[0].member_count) || 0,
      post_count: parseInt(rows[0].post_count) || 0,
      comment_count: parseInt(rows[0].comment_count) || 0,
      weekly_visitors: parseInt(rows[0].weekly_visitors) || 0,
      weekly_interactions: parseInt(rows[0].weekly_interactions) || 0,
      online_count: parseInt(rows[0].online_count) || 0
    }
  },
  async updateUserSession(userId, sessionData = {}) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000)
    
    try {
      // 使用 UPSERT 更新或插入用户会话
      const { rows } = await db.query(`
        INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, last_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $5)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          session_token = COALESCE(EXCLUDED.session_token, user_sessions.session_token),
          ip_address = COALESCE(EXCLUDED.ip_address, user_sessions.ip_address),
          user_agent = COALESCE(EXCLUDED.user_agent, user_sessions.user_agent),
          last_active = $5
        RETURNING *
      `, [
        userId,
        sessionData.sessionToken || null,
        sessionData.ipAddress || null,
        sessionData.userAgent || null,
        now
      ])
      
      return rows[0]
    } catch (error) {
      console.error('[updateUserSession] Error:', error.message)
      return null
    }
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
    const nowISO = new Date().toISOString()
    const nowSeconds = Math.floor(Date.now() / 1000)
    const id = randomUUID()
    
    const { rows } = await db.query(`
      INSERT INTO comments (id, post_id, user_id, content, parent_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [id, postId, userId, content, parentId, nowISO, nowISO])
    
    // 更新帖子的评论数 (posts 表使用 BIGINT 时间戳)
    await db.query(`
      UPDATE posts SET comments_count = comments_count + 1, updated_at = $1 WHERE id = $2
    `, [nowSeconds, postId])
    
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
  },
  
  // 获取社群成员列表
  async getCommunityMembers(communityId) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT 
        cm.user_id as id,
        u.username,
        u.email,
        u.avatar_url as avatar,
        cm.role,
        cm.joined_at,
        u.is_online as is_online,
        u.last_active_at as last_active,
        (SELECT COUNT(*) FROM posts WHERE user_id = cm.user_id) as post_count
      FROM community_members cm
      JOIN users u ON cm.user_id::text = u.id::text
      WHERE cm.community_id::text = $1::text
      ORDER BY 
        CASE cm.role 
          WHEN 'owner' THEN 1 
          WHEN 'admin' THEN 2 
          WHEN 'editor' THEN 3 
          ELSE 4 
        END,
        cm.joined_at DESC
    `, [communityId])
    return rows
  },
  
  // 获取社群公告列表
  async getCommunityAnnouncements(communityId) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT 
        ca.id,
        ca.title,
        ca.content,
        ca.is_pinned,
        ca.created_at,
        ca.updated_at,
        u.username as author_name,
        u.avatar_url as author_avatar,
        (SELECT COUNT(*) FROM announcement_reads WHERE announcement_id = ca.id) as read_count
      FROM community_announcements ca
      JOIN users u ON ca.author_id::text = u.id::text
      WHERE ca.community_id::text = $1::text
      ORDER BY ca.is_pinned DESC, ca.created_at DESC
    `, [communityId])
    return rows
  },
  
  // 获取社群加入申请列表
  async getCommunityJoinRequests(communityId) {
    const db = await getDB()
    const { rows } = await db.query(`
      SELECT 
        cjr.id,
        cjr.user_id,
        u.username,
        u.avatar_url as avatar,
        cjr.request_message,
        cjr.status,
        cjr.created_at
      FROM community_join_requests cjr
      JOIN users u ON cjr.user_id::text = u.id::text
      WHERE cjr.community_id::text = $1::text AND cjr.status = 'pending'
      ORDER BY cjr.created_at DESC
    `, [communityId])
    return rows
  },
  
  // 更新成员角色
  async updateMemberRole(communityId, userId, newRole) {
    const db = await getDB()
    const { rowCount } = await db.query(`
      UPDATE community_members 
      SET role = $1, updated_at = NOW()
      WHERE community_id::text = $2::text AND user_id::text = $3::text
    `, [newRole, communityId, userId])
    return rowCount > 0
  },
  
  // 移除成员
  async removeMember(communityId, userId) {
    const db = await getDB()
    const { rowCount } = await db.query(`
      DELETE FROM community_members 
      WHERE community_id::text = $1::text AND user_id::text = $2::text
    `, [communityId, userId])
    
    if (rowCount > 0) {
      // 更新社群成员数
      await db.query(`
        UPDATE communities 
        SET member_count = member_count - 1 
        WHERE id::text = $1::text
      `, [communityId])
    }
    
    return rowCount > 0
  },
  
  // 发布公告
  async createAnnouncement(announcementData) {
    const db = await getDB()
    const id = randomUUID()
    
    const { rows } = await db.query(`
      INSERT INTO community_announcements (id, community_id, author_id, title, content, is_pinned, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [
      id,
      announcementData.communityId,
      announcementData.authorId,
      announcementData.title,
      announcementData.content,
      announcementData.isPinned || false
    ])
    
    return rows[0]
  },
  
  // 更新公告
  async updateAnnouncement(announcementId, updateData) {
    const db = await getDB()
    const { rows } = await db.query(`
      UPDATE community_announcements 
      SET title = $1, content = $2, is_pinned = $3, updated_at = NOW()
      WHERE id::text = $4::text
      RETURNING *
    `, [updateData.title, updateData.content, updateData.isPinned, announcementId])
    
    return rows[0]
  },
  
  // 删除公告
  async deleteAnnouncement(announcementId) {
    const db = await getDB()
    const { rowCount } = await db.query(`
      DELETE FROM community_announcements 
      WHERE id::text = $1::text
    `, [announcementId])
    
    return rowCount > 0
  },
  
  // 处理加入申请
  async handleJoinRequest(requestId, action) {
    const db = await getDB()
    
    if (action === 'approve') {
      // 获取申请信息
      const { rows } = await db.query(`
        SELECT community_id, user_id FROM community_join_requests 
        WHERE id::text = $1::text
      `, [requestId])
      
      if (rows.length === 0) return false
      
      const { community_id, user_id } = rows[0]
      
      // 添加成员
      await db.query(`
        INSERT INTO community_members (community_id, user_id, role, joined_at)
        VALUES ($1, $2, 'member', NOW())
        ON CONFLICT DO NOTHING
      `, [community_id, user_id])
      
      // 更新成员数
      await db.query(`
        UPDATE communities SET member_count = member_count + 1 WHERE id::text = $1::text
      `, [community_id])
    }
    
    // 更新申请状态
    const { rowCount } = await db.query(`
      UPDATE community_join_requests 
      SET status = $1, updated_at = NOW()
      WHERE id::text = $2::text
    `, [action === 'approve' ? 'approved' : 'rejected', requestId])
    
    return rowCount > 0
  }
}

// 通知数据库操作
export const notificationDB = {
  // 创建通知
  async create(notificationData) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000)
    const id = notificationData.id || randomUUID()

    try {
      const { rows } = await db.query(`
        INSERT INTO notifications (
          id, user_id, sender_id, sender_name, sender_avatar, type, title, message,
          action_url, entity_type, entity_id, is_read, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        id,
        notificationData.user_id,
        notificationData.sender_id || null,
        notificationData.sender_name || null,
        notificationData.sender_avatar || null,
        notificationData.type,
        notificationData.title,
        notificationData.message,
        notificationData.action_url || null,
        notificationData.entity_type || null,
        notificationData.entity_id || null,
        false,
        now,
        now
      ])

      return rows[0]
    } catch (error) {
      console.error('[notificationDB.create] Error:', error)
      throw error
    }
  },

  // 获取用户的通知列表
  async getNotifications(userId, limit = 20, offset = 0) {
    const db = await getDB()

    try {
      const { rows } = await db.query(`
        SELECT * FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset])

      return rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        senderId: row.sender_id,
        senderName: row.sender_name,
        senderAvatar: row.sender_avatar,
        type: row.type,
        title: row.title,
        message: row.message,
        actionUrl: row.action_url,
        entityType: row.entity_type,
        entityId: row.entity_id,
        read: row.is_read,
        readAt: row.read_at,
        timestamp: new Date(row.created_at * 1000).toISOString(),
        createdAt: row.created_at,
        sender: row.sender_id ? {
          id: row.sender_id,
          username: row.sender_name,
          avatar: row.sender_avatar
        } : undefined
      }))
    } catch (error) {
      console.error('[notificationDB.getNotifications] Error:', error)
      throw error
    }
  },

  // 获取未读通知数量
  async getUnreadCount(userId) {
    // 生成缓存键
    const cacheKey = `notifications_unread_${userId}`;
    
    // 检查缓存
    const cached = getQueryCache(cacheKey);
    if (cached !== null) {
      console.log('[DB] Cache hit for notificationDB.getUnreadCount');
      return cached;
    }
    
    const db = await getDB()

    try {
      const { rows } = await db.query(`
        SELECT COUNT(*) as count FROM notifications
        WHERE user_id = $1 AND is_read = false
      `, [userId])

      const count = parseInt(rows[0].count);
      
      // 缓存结果
      setQueryCache(cacheKey, count);
      console.log('[DB] Cache set for notificationDB.getUnreadCount');
      
      return count;
    } catch (error) {
      console.error('[notificationDB.getUnreadCount] Error:', error)
      return 0
    }
  },

  // 标记通知为已读
  async markAsRead(notificationId, userId) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000)

    try {
      const { rowCount } = await db.query(`
        UPDATE notifications
        SET is_read = true, read_at = $1, updated_at = $1
        WHERE id = $2 AND user_id = $3
      `, [now, notificationId, userId])

      return rowCount > 0
    } catch (error) {
      console.error('[notificationDB.markAsRead] Error:', error)
      throw error
    }
  },

  // 标记所有通知为已读
  async markAllAsRead(userId) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000)

    try {
      const { rowCount } = await db.query(`
        UPDATE notifications
        SET is_read = true, read_at = $1, updated_at = $1
        WHERE user_id = $2 AND is_read = false
      `, [now, userId])

      return rowCount
    } catch (error) {
      console.error('[notificationDB.markAllAsRead] Error:', error)
      throw error
    }
  },

  // 删除通知
  async delete(notificationId, userId) {
    const db = await getDB()

    try {
      const { rowCount } = await db.query(`
        DELETE FROM notifications
        WHERE id = $1 AND user_id = $2
      `, [notificationId, userId])

      return rowCount > 0
    } catch (error) {
      console.error('[notificationDB.delete] Error:', error)
      throw error
    }
  },

  // 获取单条通知
  async getById(notificationId, userId) {
    const db = await getDB()

    try {
      const { rows } = await db.query(`
        SELECT * FROM notifications
        WHERE id = $1 AND user_id = $2
      `, [notificationId, userId])

      return rows[0] || null
    } catch (error) {
      console.error('[notificationDB.getById] Error:', error)
      throw error
    }
  },

  // 获取用户通知总数
  async getTotalCount(userId) {
    const db = await getDB()

    try {
      const { rows } = await db.query(`
        SELECT COUNT(*) as count FROM notifications
        WHERE user_id = $1
      `, [userId])

      return parseInt(rows[0].count)
    } catch (error) {
      console.error('[notificationDB.getTotalCount] Error:', error)
      return 0
    }
  }
}

// 事件数据库操作
export const eventDB = {
  async create(eventData) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000) // 使用秒级时间戳
    const id = eventData.id || randomUUID()

    try {
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

      if (!rows || rows.length === 0) {
        throw new Error('Failed to create event: no rows returned')
      }

      // 返回创建的完整活动数据
      return {
        id: rows[0].id,
        title: eventData.title,
        description: eventData.description,
        startTime: eventData.start_date,
        endTime: eventData.end_date,
        location: eventData.location,
        organizerId: eventData.organizer_id,
        requirements: eventData.requirements,
        rewards: eventData.rewards,
        isPublic: eventData.visibility === 'public',
        status: eventData.status || 'draft',
        maxParticipants: eventData.max_participants,
        publishedAt: eventData.published_at,
        media: eventData.image_url ? [{ url: eventData.image_url, type: 'image' }] : [],
        category: eventData.category,
        tags: eventData.tags,
        platformEventId: eventData.platform_event_id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('[eventDB.create] Error:', error)
      throw error
    }
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

    try {
      const { rows } = await db.query(`
        UPDATE events
        SET ${fields.join(', ')}
        WHERE id = $${index}
        RETURNING *
      `, values)

      const event = rows[0]
      if (!event) {
        console.error(`[eventDB.update] Event not found: ${id}`)
        return null
      }

      // 转换为前端期望的 camelCase 格式
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        startTime: event.start_date,
        endTime: event.end_date,
        location: event.location,
        organizerId: event.organizer_id,
        requirements: event.requirements,
        rewards: event.rewards,
        isPublic: event.visibility === 'public',
        status: event.status,
        maxParticipants: event.max_participants,
        publishedAt: event.published_at,
        media: event.image_url ? [{ url: event.image_url, type: 'image' }] : [],
        category: event.category,
        tags: event.tags,
        platformEventId: event.platform_event_id,
        createdAt: event.created_at ? new Date(event.created_at * 1000).toISOString() : null,
        updatedAt: event.updated_at ? new Date(event.updated_at * 1000).toISOString() : null
      }
    } catch (error) {
      console.error('[eventDB.update] Error:', error)
      throw error
    }
  },
  async delete(id) {
    const db = await getDB()
    await db.query('DELETE FROM events WHERE id = $1', [id])
    return true
  },
  async getEvents(filters = {}) {
    // 生成缓存键
    const cacheKey = `events_${JSON.stringify(filters)}`;
    
    // 检查缓存
    const cached = getQueryCache(cacheKey);
    if (cached) {
      console.log('[DB] Cache hit for getEvents');
      return cached;
    }
    
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
    
    // 缓存结果
    setQueryCache(cacheKey, rows);
    console.log('[DB] Cache set for getEvents');
    
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
// 注意：getAllWorks、createWork、getWorksByUserId 和 getByCreatorId 方法已在上面定义，不要重复定义

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
