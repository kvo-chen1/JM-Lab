/**
 * 创建后台管理缺失的表
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

async function createMissingAdminTables() {
  const client = await pool.connect()
  
  try {
    console.log('[Create Admin Tables] 开始创建后台管理缺失的表...\n')

    // 1. 创建 promoted_works 表（推广作品表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS promoted_works (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        promotion_type VARCHAR(50) DEFAULT 'featured',
        status VARCHAR(50) DEFAULT 'active',
        start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        end_date TIMESTAMP WITH TIME ZONE,
        priority INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('✅ promoted_works 表已创建')

    // 2. 创建 brand_task_submissions 表（品牌任务提交表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS brand_task_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES brand_tasks(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        work_id UUID REFERENCES works(id) ON DELETE SET NULL,
        content TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        reward_amount INTEGER DEFAULT 0,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('✅ brand_task_submissions 表已创建')

    // 3. 创建 cultural_knowledge 表（文化知识库表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS cultural_knowledge (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100),
        tags TEXT[],
        author_id UUID REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'published',
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('✅ cultural_knowledge 表已创建')

    // 4. 创建 active_promotions 表（活动推广表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS active_promotions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        promotion_type VARCHAR(50) DEFAULT 'banner',
        target_url TEXT,
        image_url TEXT,
        start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        end_date TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'active',
        priority INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('✅ active_promotions 表已创建')

    // 5. 创建 pending_tasks 表（待处理任务表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS pending_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        task_type VARCHAR(50) DEFAULT 'review',
        related_id UUID,
        related_type VARCHAR(50),
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'pending',
        priority INTEGER DEFAULT 0,
        due_date TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('✅ pending_tasks 表已创建')

    // 插入示例数据
    console.log('\n插入示例数据...')

    // 插入推广作品示例
    try {
      await client.query(`
        INSERT INTO promoted_works (work_id, user_id, status, priority)
        SELECT w.id, w.creator_id::uuid, 'active', 1
        FROM works w
        WHERE w.status = 'published'
        LIMIT 2
        ON CONFLICT DO NOTHING
      `)
      console.log('✅ 推广作品示例数据已插入')
    } catch (e) {
      console.log('⚠️ 推广作品示例数据插入失败:', e.message)
    }

    // 插入文化知识示例
    await client.query(`
      INSERT INTO cultural_knowledge (title, content, category, tags, status)
      VALUES 
        ('天津文化介绍', '天津是中国北方重要的港口城市...', '文化', ARRAY['天津', '文化'], 'published'),
        ('津味小吃', '天津特色小吃包括狗不理包子...', '美食', ARRAY['美食', '天津'], 'published'),
        ('天津历史', '天津有着600多年的建城史...', '历史', ARRAY['历史', '天津'], 'published')
      ON CONFLICT DO NOTHING
    `)
    console.log('✅ 文化知识示例数据已插入')

    // 插入活动推广示例
    await client.query(`
      INSERT INTO active_promotions (name, description, promotion_type, status, priority)
      VALUES 
        ('首页Banner', '首页顶部轮播图', 'banner', 'active', 1),
        ('推荐活动', '精选推荐活动', 'featured', 'active', 2)
      ON CONFLICT DO NOTHING
    `)
    console.log('✅ 活动推广示例数据已插入')

    console.log('\n[Create Admin Tables] 所有表创建完成！')
    
  } catch (error) {
    console.error('[Create Admin Tables] 创建表失败:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

createMissingAdminTables().catch(console.error)
