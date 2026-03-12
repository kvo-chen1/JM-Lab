// 检查津币数据一致性
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

async function checkConsistency() {
  console.log('========================================');
  console.log('检查津币数据一致性');
  console.log('========================================\n');

  const userId = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'; // kvo1

  // 1. 检查余额表
  console.log('1. 检查 user_jinbi_balance 表:');
  const { data: balance, error: balanceError } = await supabase
    .from('user_jinbi_balance')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (balanceError) {
    console.log('   ❌ 查询失败:', balanceError.message);
  } else {
    console.log('   ✅ 余额记录:');
    console.log(`      - 总余额: ${balance.total_balance}`);
    console.log(`      - 可用余额: ${balance.available_balance}`);
    console.log(`      - 总收入: ${balance.total_earned}`);
    console.log(`      - 总支出: ${balance.total_spent || balance.total_consumed}`);
  }

  // 2. 检查所有充值记录
  console.log('\n2. 检查 jinbi_records 表（充值记录）:');
  const { data: records, error: recordsError } = await supabase
    .from('jinbi_records')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'purchase')
    .order('created_at', { ascending: false });

  if (recordsError) {
    console.log('   ❌ 查询失败:', recordsError.message);
  } else {
    console.log(`   ✅ 找到 ${records?.length || 0} 条充值记录`);
    let totalRecharge = 0;
    records?.forEach((r, i) => {
      console.log(`      ${i + 1}. 金额: ${r.amount}, 时间: ${r.created_at}`);
      totalRecharge += r.amount;
    });
    console.log(`   💰 充值总额: ${totalRecharge}`);
  }

  // 3. 检查所有消费记录
  console.log('\n3. 检查 jinbi_records 表（消费记录）:');
  const { data: spendings, error: spendingsError } = await supabase
    .from('jinbi_records')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'spend')
    .order('created_at', { ascending: false });

  if (spendingsError) {
    console.log('   ❌ 查询失败:', spendingsError.message);
  } else {
    console.log(`   ✅ 找到 ${spendings?.length || 0} 条消费记录`);
    let totalSpend = 0;
    spendings?.forEach((r, i) => {
      console.log(`      ${i + 1}. 金额: ${Math.abs(r.amount)}, 描述: ${r.description}`);
      totalSpend += Math.abs(r.amount);
    });
    console.log(`   💸 消费总额: ${totalSpend}`);
  }

  // 4. 数据一致性检查
  console.log('\n4. 数据一致性检查:');
  if (balance && records) {
    const calculatedEarned = records.reduce((sum, r) => sum + r.amount, 0);
    const calculatedSpent = spendings?.reduce((sum, r) => sum + Math.abs(r.amount), 0) || 0;
    const calculatedBalance = calculatedEarned - calculatedSpent;

    console.log(`   计算的总收入: ${calculatedEarned}`);
    console.log(`   数据库的总收入: ${balance.total_earned}`);
    console.log(`   计算的总消费: ${calculatedSpent}`);
    console.log(`   数据库的总消费: ${balance.total_spent || balance.total_consumed || 0}`);
    console.log(`   计算的余额: ${calculatedBalance}`);
    console.log(`   数据库的余额: ${balance.total_balance}`);

    if (calculatedBalance === balance.total_balance) {
      console.log('   ✅ 数据一致');
    } else {
      console.log('   ⚠️ 数据不一致！');
    }
  }

  console.log('\n========================================');
}

checkConsistency();
