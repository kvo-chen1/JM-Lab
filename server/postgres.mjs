import { Pool } from 'pg'
import dotenv from 'dotenv'

// 加载环境变量
// 支持.env.local、.env.development.local等文件
dotenv.config({ path: '.env.local' })
dotenv.config()

// 获取PostgreSQL连接字符串
// 支持Supabase PostgreSQL
console.log('正在获取PostgreSQL连接字符串...')
console.log('环境变量检查:', {
  DATABASE_URL: !!process.env.DATABASE_URL,
  POSTGRES_URL: !!process.env.POSTGRES_URL,
  POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING
})

const DATABASE_URL = process.env.DATABASE_URL || 
                    process.env.POSTGRES_URL || 
                    process.env.POSTGRES_URL_NON_POOLING

console.log('最终使用的DATABASE_URL:', DATABASE_URL ? '已配置' : '未配置')

if (!DATABASE_URL) {
  console.error('ERROR: 未配置PostgreSQL连接环境变量')
  console.error('请在Vercel控制台中配置以下环境变量之一:')
  console.error('- DATABASE_URL')
  console.error('- POSTGRES_URL')
  console.error('- POSTGRES_URL_NON_POOLING')
  throw new Error('PostgreSQL连接环境变量未配置')
}

// 创建连接池
const isLocalhost = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isLocalhost ? false : {
    rejectUnauthorized: false,
    requestCert: true,
    agent: false
  },
  max: 5,
  min: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,
  statement_timeout: 30000,
  query_timeout: 30000
})

// 添加连接池事件监听
pool.on('connect', () => {
  console.log('PostgreSQL连接已建立')
})

pool.on('error', (err) => {
  console.error('PostgreSQL连接错误:', err.message)
})

/**
 * 初始化PostgreSQL数据库
 */
export async function initPostgreSQL() {
  try {
    const client = await pool.connect()
    console.log('PostgreSQL连接成功')

    // 创建用户表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        age INTEGER,
        tags TEXT,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `)

    // 创建索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);')

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
        name VARCHAR(30) UNIQUE NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `)

    // 创建内容表
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'published',
        visibility VARCHAR(20) NOT NULL DEFAULT 'public',
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `)

    // 创建内容标签关联表
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
      );
    `)

    // 创建评论表
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'approved',
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `)

    // 创建点赞表
    await client.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_id INTEGER NOT NULL,
        target_type VARCHAR(20) NOT NULL, -- post, comment
        created_at BIGINT NOT NULL,
        UNIQUE (user_id, target_id, target_type)
      );
    `)

    // 创建内容表索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);')

    // 创建评论表索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);')

    // 创建点赞表索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_id, target_type);')

    client.release()
    console.log('PostgreSQL表和索引初始化成功')
  } catch (error) {
    console.error('PostgreSQL初始化失败:', error.message)
    throw error
  }
}

/**
 * 获取PostgreSQL连接池
 */
export function getPostgreSQL() {
  return pool
}

/**
 * 关闭PostgreSQL连接池
 */
export async function closePostgreSQL() {
  await pool.end()
  console.log('PostgreSQL连接池已关闭')
}