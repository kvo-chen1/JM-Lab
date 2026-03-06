import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL || 
                     process.env.POSTGRES_URL_NON_POOLING;

async function applyMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ 已连接到 Neon 数据库');

    // 1. 添加 view_count 字段
    console.log('\n1️⃣ 添加 view_count 字段到 works 表...');
    await client.query(`
      ALTER TABLE public.works
      ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0
    `);
    console.log('   ✅ view_count 字段已添加');

    // 2. 创建索引
    console.log('\n2️⃣ 创建索引...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_works_view_count ON public.works(view_count DESC)
    `);
    console.log('   ✅ 索引已创建');

    // 3. 创建增加浏览量的函数
    console.log('\n3️⃣ 创建 increment_work_view_count 函数...');
    await client.query(`
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
      $$ LANGUAGE plpgsql SECURITY DEFINER
    `);
    console.log('   ✅ 函数已创建');

    // 4. 验证函数是否存在
    console.log('\n4️⃣ 验证函数...');
    const result = await client.query(`
      SELECT proname, proargtypes::regtype[] as arg_types, prorettype::regtype as return_type
      FROM pg_proc
      WHERE proname = 'increment_work_view_count'
    `);
    
    if (result.rows.length > 0) {
      console.log('   ✅ 函数验证成功:');
      console.log(`      函数名: ${result.rows[0].proname}`);
      console.log(`      参数类型: ${result.rows[0].arg_types}`);
      console.log(`      返回类型: ${result.rows[0].return_type}`);
    } else {
      console.log('   ❌ 函数未找到');
    }

    // 5. 测试函数
    console.log('\n5️⃣ 测试函数...');
    // 先找一个存在的作品ID
    const workResult = await client.query(`
      SELECT id FROM public.works LIMIT 1
    `);
    
    if (workResult.rows.length > 0) {
      const workId = workResult.rows[0].id;
      console.log(`   测试作品ID: ${workId}`);
      
      const testResult = await client.query(`
        SELECT increment_work_view_count($1) as new_count
      `, [workId]);
      
      console.log(`   ✅ 函数测试成功，新浏览量: ${testResult.rows[0].new_count}`);
    } else {
      console.log('   ⚠️ 数据库中没有作品，跳过函数测试');
    }

    console.log('\n✅ 所有迁移步骤完成！');

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
