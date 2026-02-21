// 修复奖品表的问题
// 1. 创建 update_updated_at_column 函数
// 2. 修复 RLS 策略 - 移除对 events.brand_id 的引用

import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const supabaseUrl = 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const fixStatements = [
  // 1. 创建更新时间戳函数
  {
    name: '创建 update_updated_at_column 函数',
    sql: `CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`
  },

  // 2. 删除错误的策略
  {
    name: '删除错误的奖品表策略(创建)',
    sql: `DROP POLICY IF EXISTS "允许组织者创建奖品" ON event_prizes;`
  },
  {
    name: '删除错误的奖品表策略(更新)',
    sql: `DROP POLICY IF EXISTS "允许组织者更新奖品" ON event_prizes;`
  },
  {
    name: '删除错误的奖品表策略(删除)',
    sql: `DROP POLICY IF EXISTS "允许组织者删除奖品" ON event_prizes;`
  },
  {
    name: '删除错误的获奖者表策略(查询)',
    sql: `DROP POLICY IF EXISTS "允许用户查看自己的获奖记录" ON prize_winners;`
  },
  {
    name: '删除错误的获奖者表策略(创建)',
    sql: `DROP POLICY IF EXISTS "允许组织者创建获奖记录" ON prize_winners;`
  },
  {
    name: '删除错误的获奖者表策略(更新)',
    sql: `DROP POLICY IF EXISTS "允许用户更新自己的领奖状态" ON prize_winners;`
  },

  // 3. 创建修复后的策略 - 只使用 organizer_id
  {
    name: '创建奖品表插入策略',
    sql: `CREATE POLICY "允许组织者创建奖品" ON event_prizes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_id
            AND e.organizer_id = auth.uid()
        )
    );`
  },
  {
    name: '创建奖品表更新策略',
    sql: `CREATE POLICY "允许组织者更新奖品" ON event_prizes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_id
            AND e.organizer_id = auth.uid()
        )
    );`
  },
  {
    name: '创建奖品表删除策略',
    sql: `CREATE POLICY "允许组织者删除奖品" ON event_prizes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_id
            AND e.organizer_id = auth.uid()
        )
    );`
  },
  {
    name: '创建获奖者表查询策略',
    sql: `CREATE POLICY "允许用户查看自己的获奖记录" ON prize_winners
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_id
            AND e.organizer_id = auth.uid()
        )
    );`
  },
  {
    name: '创建获奖者表插入策略',
    sql: `CREATE POLICY "允许组织者创建获奖记录" ON prize_winners
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_id
            AND e.organizer_id = auth.uid()
        )
    );`
  },
  {
    name: '创建获奖者表更新策略',
    sql: `CREATE POLICY "允许用户更新自己的领奖状态" ON prize_winners
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_id
            AND e.organizer_id = auth.uid()
        )
    );`
  }
];

async function executeFixes() {
  console.log('='.repeat(80));
  console.log('开始修复奖品表问题...');
  console.log('='.repeat(80));
  console.log(`共 ${fixStatements.length} 个修复步骤\n`);

  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  for (let i = 0; i < fixStatements.length; i++) {
    const { name, sql } = fixStatements[i];

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql });

      if (error) {
        // 如果 exec_sql 函数不存在
        if (error.message.includes('exec_sql')) {
          console.log(`[${i + 1}/${fixStatements.length}] ⚠️  跳过: ${name}`);
          console.log(`    原因: exec_sql 函数不存在\n`);
          skipCount++;
          continue;
        }

        // 忽略 "已存在" 类型的错误
        if (error.message.includes('already exists')) {
          console.log(`[${i + 1}/${fixStatements.length}] ⚠️  已存在，跳过: ${name}`);
          skipCount++;
          continue;
        }

        throw error;
      }

      console.log(`[${i + 1}/${fixStatements.length}] ✅ 成功: ${name}`);
      successCount++;
    } catch (error) {
      console.log(`[${i + 1}/${fixStatements.length}] ❌ 失败: ${name}`);
      console.log(`    错误: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('修复执行完成');
  console.log('='.repeat(80));
  console.log(`✅ 成功: ${successCount} 条`);
  console.log(`⚠️  跳过: ${skipCount} 条`);
  console.log(`❌ 失败: ${errorCount} 条`);

  if (errorCount > 0) {
    console.log('\n注意: 部分修复失败，请检查错误信息。');
  }

  // 验证修复结果
  console.log('\n' + '='.repeat(80));
  console.log('验证修复结果...');
  console.log('='.repeat(80));

  try {
    const { data, error } = await supabase
      .from('event_prizes')
      .select('id')
      .limit(1);

    if (error) {
      console.log(`❌ event_prizes 表访问失败: ${error.message}`);
    } else {
      console.log(`✅ event_prizes 表可正常访问`);
    }
  } catch (e) {
    console.log(`❌ event_prizes 表验证失败: ${e.message}`);
  }

  try {
    const { data, error } = await supabase
      .from('prize_winners')
      .select('id')
      .limit(1);

    if (error) {
      console.log(`❌ prize_winners 表访问失败: ${error.message}`);
    } else {
      console.log(`✅ prize_winners 表可正常访问`);
    }
  } catch (e) {
    console.log(`❌ prize_winners 表验证失败: ${e.message}`);
  }
}

executeFixes().catch(console.error);
