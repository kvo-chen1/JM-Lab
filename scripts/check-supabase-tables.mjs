// 检查 Supabase 津币相关表格
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkTables() {
  console.log('========================================');
  console.log('检查 Supabase 津币相关表格');
  console.log('========================================\n');

  const userId = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';

  // 1. 检查 user_jinbi_balance 表结构
  console.log('1. 检查 user_jinbi_balance 表结构:');
  try {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'user_jinbi_balance')
      .eq('table_schema', 'public');

    if (error) {
      console.log('   ❌ 查询失败:', error.message);
    } else {
      console.log('   表列信息:');
      columns?.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
      });
    }
  } catch (e) {
    console.log('   ⚠️ 无法获取表结构:', e.message);
  }

  // 2. 检查 user_jinbi_balance 数据
  console.log('\n2. 检查 user_jinbi_balance 数据:');
  const { data: balance, error: balanceError } = await supabase
    .from('user_jinbi_balance')
    .select('*')
    .eq('user_id', userId);

  if (balanceError) {
    console.log('   ❌ 查询失败:', balanceError.message);
  } else if (!balance || balance.length === 0) {
    console.log('   ❌ 没有找到该用户的余额记录');
  } else {
    console.log(`   ✅ 找到 ${balance.length} 条记录:`);
    balance.forEach((b, i) => {
      console.log(`      记录 ${i + 1}:`);
      console.log(`        user_id: ${b.user_id}`);
      console.log(`        total_balance: ${b.total_balance}`);
      console.log(`        available_balance: ${b.available_balance}`);
      console.log(`        frozen_balance: ${b.frozen_balance}`);
      console.log(`        total_earned: ${b.total_earned}`);
      console.log(`        total_spent: ${b.total_spent}`);
      console.log(`        last_updated: ${b.last_updated}`);
    });
  }

  // 3. 检查 jinbi_records 表
  console.log('\n3. 检查 jinbi_records 表:');
  const { data: records, error: recordsError } = await supabase
    .from('jinbi_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (recordsError) {
    console.log('   ❌ 查询失败:', recordsError.message);
  } else {
    console.log(`   ✅ 找到 ${records?.length || 0} 条记录`);
    records?.forEach((r, i) => {
      console.log(`      ${i + 1}. ${r.type}: ${r.amount} (${r.created_at})`);
    });
  }

  // 4. 检查是否有重复记录
  console.log('\n4. 检查 user_jinbi_balance 是否有重复记录:');
  const { data: allBalances } = await supabase
    .from('user_jinbi_balance')
    .select('user_id, total_balance');

  const userCount = {};
  allBalances?.forEach(b => {
    userCount[b.user_id] = (userCount[b.user_id] || 0) + 1;
  });

  let hasDuplicate = false;
  Object.entries(userCount).forEach(([uid, count]) => {
    if (count > 1) {
      console.log(`   ⚠️ 用户 ${uid} 有 ${count} 条记录!`);
      hasDuplicate = true;
    }
  });

  if (!hasDuplicate) {
    console.log('   ✅ 没有重复记录');
  }

  console.log('\n========================================');
}

checkTables();
