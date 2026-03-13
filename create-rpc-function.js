import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 使用 Supabase 连接字符串
const connectionString = process.env.POSTGRES_URL_NON_POOLING || 
                         process.env.POSTGRES_URL || 
                         process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ 未找到数据库连接字符串，请检查环境变量 POSTGRES_URL_NON_POOLING、POSTGRES_URL 或 DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

const sql = `
-- 为 works 表添加浏览量字段
ALTER TABLE public.works
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 为 posts 表添加浏览量字段
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_works_view_count ON public.works(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON public.posts(view_count DESC);

-- 创建增加浏览量的函数
CREATE OR REPLACE FUNCTION increment_work_view_count(work_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE public.works
    SET view_count = view_count + 1
    WHERE id = work_id
    RETURNING view_count INTO new_count;
    
    RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建增加帖子浏览量的函数
CREATE OR REPLACE FUNCTION increment_post_view_count(post_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE public.posts
    SET view_count = view_count + 1
    WHERE id = post_id
    RETURNING view_count INTO new_count;
    
    RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON COLUMN public.works.view_count IS '作品浏览量统计';
COMMENT ON COLUMN public.posts.view_count IS '帖子浏览量统计';
COMMENT ON FUNCTION increment_work_view_count(UUID) IS '增加指定作品的浏览量并返回新的浏览量';
COMMENT ON FUNCTION increment_post_view_count(UUID) IS '增加指定帖子的浏览量并返回新的浏览量';
`;

async function createFunction() {
  try {
    console.log('Creating RPC functions...');
    console.log('Using connection:', connectionString.replace(/:([^:@]+)@/, ':***@'));
    
    await pool.query(sql);
    console.log('✅ Functions created successfully!');
    
    // 验证函数是否存在
    const result = await pool.query(`
      SELECT proname, pg_get_function_arguments(oid) as arg_types
      FROM pg_proc 
      WHERE proname IN ('increment_work_view_count', 'increment_post_view_count')
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Functions verified:');
      result.rows.forEach(row => {
        console.log(`   - ${row.proname}(${row.arg_types})`);
      });
    } else {
      console.error('❌ Functions not found after creation');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error creating functions:', error.message);
    await pool.end();
    process.exit(1);
  }
}

createFunction();
