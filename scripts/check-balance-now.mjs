// 检查当前余额数据
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

async function checkBalanceNow() {
  console.log('========================================');
  console.log('检查当前余额数据');
  console.log('========================================\n');

  const userId = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';

  // 直接查询余额表
  console.log('1. 查询 user_jinbi_balance 表:');
  const { data, error } = await supabase
    .from('user_jinbi_balance')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.log('❌ 查询失败:', error.message);
    console.log('   错误代码:', error.code);
  } else if (!data) {
    console.log('❌ 没有找到该用户的余额记录');
  } else {
    console.log('✅ 余额记录:');
    console.log('   user_id:', data.user_id);
    console.log('   total_balance:', data.total_balance);
    console.log('   available_balance:', data.available_balance);
    console.log('   total_earned:', data.total_earned);
    console.log('   total_spent:', data.total_spent);
    console.log('   last_updated:', data.last_updated);
  }

  // 检查所有用户的余额
  console.log('\n2. 所有用户的余额:');
  const { data: allBalances } = await supabase
    .from('user_jinbi_balance')
    .select('user_id, total_balance')
    .order('total_balance', { ascending: false });

  allBalances?.forEach(b => {
    console.log(`   ${b.user_id}: ${b.total_balance}`);
  });

  console.log('\n========================================');
}

checkBalanceNow();
