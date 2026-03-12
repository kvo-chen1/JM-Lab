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

async function checkJinbiData() {
  console.log('========================================');
  console.log('检查津币数据（Supabase）');
  console.log('========================================\n');

  // 获取所有用户的余额
  console.log('1. 所有用户的余额:');
  const { data: balances, error: balanceError } = await supabase
    .from('user_jinbi_balance')
    .select('*')
    .order('total_balance', { ascending: false });

  if (balanceError) {
    console.log('❌ 查询失败:', balanceError.message);
  } else {
    console.log(`   共 ${balances?.length || 0} 个用户有余额记录`);
    balances?.slice(0, 5).forEach(b => {
      console.log(`   - User: ${b.user_id}, Balance: ${b.total_balance}, Earned: ${b.total_earned}`);
    });
  }

  // 获取最近的充值记录
  console.log('\n2. 最近的充值记录:');
  const { data: records, error: recordError } = await supabase
    .from('jinbi_records')
    .select('*')
    .eq('type', 'purchase')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recordError) {
    console.log('❌ 查询失败:', recordError.message);
  } else {
    console.log(`   共 ${records?.length || 0} 条充值记录`);
    records?.forEach(r => {
      console.log(`   - User: ${r.user_id}, Amount: ${r.amount}, Time: ${r.created_at}`);
    });
  }

  // 检查 users 表中的用户
  console.log('\n3. users 表中的用户:');
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email, username')
    .limit(5);

  if (userError) {
    console.log('❌ 查询失败:', userError.message);
  } else {
    console.log(`   共 ${users?.length || 0} 个用户`);
    users?.forEach(u => {
      console.log(`   - ${u.id}: ${u.email} (${u.username})`);
    });
  }

  console.log('\n========================================');
  console.log('检查完成');
  console.log('========================================');
}

checkJinbiData();
