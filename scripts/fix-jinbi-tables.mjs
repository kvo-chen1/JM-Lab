import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: 'db.kizgwtrrsmkjeiddotup.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'csh200506207837',
  ssl: { rejectUnauthorized: false }
});

async function fixTables() {
  console.log('========================================');
  console.log('修复津币相关表结构');
  console.log('========================================\n');

  await client.connect();
  console.log('✅ 数据库连接成功\n');

  try {
    // 1. 修复 jinbi_records 表
    console.log('1. 修复 jinbi_records 表...');
    await client.query(`
      ALTER TABLE public.jinbi_records 
      ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
    `);
    console.log('   ✅ 添加 updated_at 列');

    // 2. 修复 user_jinbi_balance 表
    console.log('\n2. 修复 user_jinbi_balance 表...');
    await client.query(`
      ALTER TABLE public.user_jinbi_balance 
      ADD COLUMN IF NOT EXISTS total_consumed integer DEFAULT 0;
    `);
    console.log('   ✅ 添加 total_consumed 列');

    await client.query(`
      ALTER TABLE public.user_jinbi_balance 
      ADD COLUMN IF NOT EXISTS frozen_balance integer DEFAULT 0;
    `);
    console.log('   ✅ 添加 frozen_balance 列');

    // 3. 验证表结构
    console.log('\n3. 验证表结构...');
    const result = await client.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name IN ('jinbi_records', 'user_jinbi_balance')
      AND table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `);

    console.log('\n表结构:');
    let currentTable = '';
    result.rows.forEach(row => {
      if (row.table_name !== currentTable) {
        currentTable = row.table_name;
        console.log(`\n📋 ${currentTable}:`);
      }
      console.log(`   - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });

    console.log('\n========================================');
    console.log('✅ 表结构修复完成');
    console.log('========================================');

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    await client.end();
  }
}

fixTables();
