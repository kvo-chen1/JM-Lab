/**
 * 创建商业化相关表
 */

import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(projectRoot, '.env') })

const envLocalPath = path.join(projectRoot, '.env.local')
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath))
  for (const k in envConfig) {
    process.env[k] = envConfig[k]
  }
}

const connectionString = process.env.DATABASE_URL || 
                        process.env.POSTGRES_URL_NON_POOLING ||
                        process.env.POSTGRES_URL ||
                        process.env.NEON_DATABASE_URL

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { 
    rejectUnauthorized: false 
  }
})

async function createCommercialTables() {
  const client = await pool.connect()
  
  try {
    console.log('[Create Commercial Tables] 开始创建商业化相关表...')

    // 1. 创建 commercial_applications 表（商业化申请表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS commercial_applications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          work_id UUID REFERENCES works(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          brand_name TEXT,
          brand_logo TEXT,
          budget INTEGER DEFAULT 0,
          description TEXT,
          cultural_elements TEXT[],
          commercial_value INTEGER DEFAULT 0,
          market_potential INTEGER DEFAULT 0,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'negotiating')),
          submit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('[Create Commercial Tables] commercial_applications 表已创建')

    // 2. 创建 commercial_application_comments 表（商业化申请评论表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS commercial_application_comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          application_id UUID NOT NULL REFERENCES commercial_applications(id) ON DELETE CASCADE,
          author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('[Create Commercial Tables] commercial_application_comments 表已创建')

    // 3. 创建 ip_assets 表（IP资产表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS ip_assets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT DEFAULT 'character',
          original_work_id UUID REFERENCES works(id) ON DELETE SET NULL,
          commercial_value INTEGER DEFAULT 0,
          thumbnail TEXT,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('[Create Commercial Tables] ip_assets 表已创建')

    // 4. 创建 brand_tasks 表（品牌任务表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS brand_tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          brand_name TEXT NOT NULL,
          brand_logo TEXT,
          title TEXT NOT NULL,
          description TEXT,
          requirements TEXT,
          reward INTEGER DEFAULT 0,
          deadline TIMESTAMP WITH TIME ZONE,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('[Create Commercial Tables] brand_tasks 表已创建')

    // 5. 创建 knowledge_base 表（知识库表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_base (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT,
          tags TEXT[],
          author_id UUID REFERENCES users(id) ON DELETE SET NULL,
          views INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('[Create Commercial Tables] knowledge_base 表已创建')

    // 插入示例数据
    console.log('[Create Commercial Tables] 插入示例数据...')

    // 插入示例商业化申请
    try {
      await client.query(`
        INSERT INTO commercial_applications (work_id, user_id, brand_name, budget, description, status)
        SELECT 
          w.id,
          w.creator_id::uuid,
          '示例品牌',
          5000,
          '这是一个示例商业化申请',
          'pending'
        FROM works w
        WHERE w.creator_id IS NOT NULL
        LIMIT 3
        ON CONFLICT DO NOTHING
      `)
    } catch (e) {
      console.log('[Create Commercial Tables] 商业化申请示例数据插入失败:', e.message)
    }

    // 插入示例IP资产
    try {
      await client.query(`
        INSERT INTO ip_assets (user_id, name, description, type, commercial_value, status)
        SELECT 
          id,
          '示例IP资产',
          '这是一个示例IP资产',
          'character',
          10000,
          'active'
        FROM users
        LIMIT 2
        ON CONFLICT DO NOTHING
      `)
    } catch (e) {
      console.log('[Create Commercial Tables] IP资产示例数据插入失败:', e.message)
    }

    // 插入示例品牌任务
    await client.query(`
      INSERT INTO brand_tasks (brand_name, title, description, requirements, reward, status)
      VALUES 
        ('品牌A', '创作推广任务', '为品牌A创作推广内容', '视频形式，时长30秒', 1000, 'active'),
        ('品牌B', '图文推广任务', '为品牌B创作图文内容', '图片不少于3张', 500, 'active')
      ON CONFLICT DO NOTHING
    `)

    // 插入示例知识库内容
    await client.query(`
      INSERT INTO knowledge_base (title, content, category, tags, views, likes, status)
      VALUES 
        ('津小脉使用指南', '这是一份详细的使用指南...', '教程', ARRAY['使用指南', '入门'], 100, 20, 'published'),
        ('创作技巧分享', '分享一些创作技巧...', '技巧', ARRAY['创作', '技巧'], 50, 10, 'published')
      ON CONFLICT DO NOTHING
    `)

    console.log('[Create Commercial Tables] 示例数据已插入')
    console.log('[Create Commercial Tables] 所有商业化表创建完成！')
    
  } catch (error) {
    console.error('[Create Commercial Tables] 创建表失败:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

createCommercialTables().catch(console.error)
