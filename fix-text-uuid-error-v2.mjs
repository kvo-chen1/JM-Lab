import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env') });
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

// 获取连接字符串
function getConnectionString() {
  return process.env.POSTGRES_URL_NON_POOLING || 
         process.env.DATABASE_URL || 
         process.env.POSTGRES_URL ||
         process.env.NEON_DATABASE_URL;
}

async function fixRPCFunction() {
  const connectionString = getConnectionString();
  
  if (!connectionString) {
    console.error('❌ 未找到数据库连接字符串');
    process.exit(1);
  }
  
  console.log('=================================');
  console.log('  修复 RPC 函数 text=uuid 错误');
  console.log('=================================\n');
  
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
      requestCert: true,
      agent: false
    }
  });
  
  try {
    // 删除旧函数（如果存在）
    console.log('🔄 删除旧函数...');
    await pool.query(`
      DROP FUNCTION IF EXISTS public.get_square_works_with_promotion(integer, integer, uuid);
    `);
    console.log('✅ 旧函数已删除\n');
    
    // 创建修复后的函数 - 修复 creator_id 类型不匹配问题
    console.log('🔄 创建修复后的函数...');
    await pool.query(`
CREATE OR REPLACE FUNCTION public.get_square_works_with_promotion(
  p_limit integer DEFAULT 20, 
  p_offset integer DEFAULT 0, 
  p_user_id uuid DEFAULT NULL::uuid
) RETURNS TABLE(
  id uuid, 
  work_type text, 
  title text, 
  thumbnail text, 
  video_url text, 
  creator_id uuid, 
  creator_username text, 
  creator_avatar text, 
  views integer, 
  likes integer, 
  comments integer, 
  created_at timestamp with time zone, 
  is_promoted boolean, 
  promoted_work_id uuid, 
  package_type text, 
  promotion_weight numeric
)
LANGUAGE plpgsql SECURITY DEFINER
AS $func$
DECLARE
  v_promoted_count INTEGER;
  v_normal_limit INTEGER;
BEGIN
  -- 计算需要插入的推广作品数量（约20%，至少1个）
  v_promoted_count := GREATEST(1, ROUND(p_limit * 0.2));
  v_normal_limit := p_limit - v_promoted_count;

  -- 返回推广作品
  RETURN QUERY
  SELECT
    pw.work_id::UUID as id,
    'promoted'::TEXT as work_type,
    po.work_title::TEXT as title,
    COALESCE(po.work_thumbnail, '')::TEXT as thumbnail,
    ''::TEXT as video_url,
    pw.user_id::UUID as creator_id,
    u.username::TEXT as creator_username,
    u.avatar_url::TEXT as creator_avatar,
    COALESCE(pw.actual_views, 0)::INTEGER as views,
    0::INTEGER as likes,
    0::INTEGER as comments,
    pw.created_at::TIMESTAMPTZ as created_at,
    TRUE as is_promoted,
    pw.id::UUID as promoted_work_id,
    pw.package_type::TEXT as package_type,
    pw.promotion_weight::DECIMAL(3,2) as promotion_weight
  FROM promoted_works pw
  JOIN promotion_orders po ON pw.order_id = po.id
  LEFT JOIN users u ON pw.user_id = u.id
  WHERE pw.status = 'active'
    AND pw.end_time > NOW()
    AND (p_user_id IS NULL OR pw.user_id != p_user_id)
  ORDER BY pw.promotion_weight DESC, pw.priority_score DESC
  LIMIT v_promoted_count;

  -- 返回普通作品
  RETURN QUERY
  SELECT
    w.id::UUID as id,
    'normal'::TEXT as work_type,
    w.title::TEXT as title,
    COALESCE(w.thumbnail, w.cover_url, '')::TEXT as thumbnail,
    COALESCE(w.video_url, '')::TEXT as video_url,
    w.creator_id::UUID as creator_id,
    u.username::TEXT as creator_username,
    u.avatar_url::TEXT as creator_avatar,
    COALESCE(w.views, 0)::INTEGER as views,
    COALESCE(w.likes, 0)::INTEGER as likes,
    COALESCE(w.comments, 0)::INTEGER as comments,
    to_timestamp(w.created_at::bigint / 1000.0)::TIMESTAMPTZ as created_at,
    FALSE as is_promoted,
    NULL::UUID as promoted_work_id,
    NULL::TEXT as package_type,
    NULL::DECIMAL as promotion_weight
  FROM works w
  LEFT JOIN users u ON w.creator_id::UUID = u.id
  WHERE w.status = 'published'
  ORDER BY w.created_at DESC
  LIMIT v_normal_limit
  OFFSET p_offset;
END;
$func$;
    `);
    
    console.log('✅ 函数创建成功\n');
    
    // 添加注释
    await pool.query(`
      COMMENT ON FUNCTION public.get_square_works_with_promotion(integer, integer, uuid) 
      IS '获取广场作品列表，包含推广作品（修复 text=uuid 错误）';
    `);
    
    // 测试函数
    console.log('🔄 测试函数调用...');
    const testResult = await pool.query(`
      SELECT * FROM get_square_works_with_promotion(5, 0, NULL);
    `);
    
    console.log(`✅ 函数测试成功，返回 ${testResult.rows.length} 条记录\n`);
    
    if (testResult.rows.length > 0) {
      console.log('📄 第一条记录:');
      const first = testResult.rows[0];
      console.log(`   标题: ${first.title}`);
      console.log(`   作者: ${first.creator_username}`);
      console.log(`   是否推广: ${first.is_promoted}`);
    }
    
    await pool.end();
    
    console.log('\n=================================');
    console.log('  ✅ 修复完成！');
    console.log('=================================');
    
  } catch (error) {
    console.error('\n❌ 修复失败!');
    console.error(`   错误信息: ${error.message}`);
    await pool.end();
    process.exit(1);
  }
}

fixRPCFunction();
