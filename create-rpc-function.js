import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env' });

const connectionString = process.env.NEON_DATABASE_URL || process.env.NEON_URL;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const sql = `
-- 为 works 表添加浏览量字段
ALTER TABLE public.works
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_works_view_count ON public.works(view_count DESC);

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

-- 添加注释
COMMENT ON COLUMN public.works.view_count IS '作品浏览量统计';
COMMENT ON FUNCTION increment_work_view_count(UUID) IS '增加指定作品的浏览量并返回新的浏览量';
`;

async function createFunction() {
  try {
    console.log('Creating RPC function increment_work_view_count...');
    await pool.query(sql);
    console.log('✅ Function created successfully!');
    
    // 验证函数是否存在
    const result = await pool.query(`
      SELECT proname, proargtypes::regtype[] as arg_types
      FROM pg_proc 
      WHERE proname = 'increment_work_view_count'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Function verified:', result.rows[0]);
    } else {
      console.error('❌ Function not found after creation');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error creating function:', error.message);
    await pool.end();
    process.exit(1);
  }
}

createFunction();
