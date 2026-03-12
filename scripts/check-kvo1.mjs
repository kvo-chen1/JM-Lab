// 检查 kvo1 用户的津币数据
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

async function checkKvo1() {
  console.log('========================================');
  console.log('检查 kvo1 用户的津币数据');
  console.log('========================================\n');

  // 1. 先找到 kvo1 的用户ID
  console.log('1. 查找 kvo1 的用户ID...');
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email, username')
    .ilike('username', 'kvo1');

  if (userError) {
    console.log('❌ 查询用户失败:', userError.message);
    return;
  }

  if (!users || users.length === 0) {
    console.log('❌ 未找到 kvo1 用户');
    return;
  }

  const kvo1 = users[0];
  console.log('✅ 找到用户:');
  console.log(`   ID: ${kvo1.id}`);
  console.log(`   邮箱: ${kvo1.email}`);
  console.log(`   用户名: ${kvo1.username}`);

  // 2. 检查该用户的余额
  console.log('\n2. 检查余额记录...');
  const { data: balance, error: balanceError } = await supabase
    .from('user_jinbi_balance')
    .select('*')
    .eq('user_id', kvo1.id)
    .single();

  if (balanceError) {
    if (balanceError.code === 'PGRST116') {
      console.log('❌ 该用户没有余额记录');
    } else {
      console.log('❌ 查询余额失败:', balanceError.message);
    }
  } else {
    console.log('✅ 余额记录:');
    console.log(`   总余额: ${balance.total_balance}`);
    console.log(`   可用余额: ${balance.available_balance}`);
    console.log(`   冻结余额: ${balance.frozen_balance}`);
    console.log(`   总收入: ${balance.total_earned}`);
    console.log(`   总消费: ${balance.total_consumed || balance.total_spent}`);
  }

  // 3. 检查该用户的充值记录
  console.log('\n3. 检查充值记录...');
  const { data: records, error: recordError } = await supabase
    .from('jinbi_records')
    .select('*')
    .eq('user_id', kvo1.id)
    .eq('type', 'purchase')
    .order('created_at', { ascending: false });

  if (recordError) {
    console.log('❌ 查询记录失败:', recordError.message);
  } else {
    console.log(`✅ 找到 ${records?.length || 0} 条充值记录`);
    records?.forEach((r, i) => {
      console.log(`   ${i + 1}. 金额: ${r.amount}, 时间: ${r.created_at}`);
    });
  }

  // 4. 检查所有用户的余额（对比）
  console.log('\n4. 所有有余额的用户:');
  const { data: allBalances } = await supabase
    .from('user_jinbi_balance')
    .select('user_id, total_balance')
    .order('total_balance', { ascending: false });

  allBalances?.forEach(b => {
    console.log(`   - ${b.user_id}: ${b.total_balance}`);
  });

  console.log('\n========================================');
  console.log('检查完成');
  console.log('========================================');
}

checkKvo1();
