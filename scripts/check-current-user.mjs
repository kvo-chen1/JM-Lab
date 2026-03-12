// 检查当前登录用户的津币余额
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

async function checkCurrentUser() {
  console.log('========================================');
  console.log('检查当前登录用户的津币余额');
  console.log('========================================\n');

  // 获取所有用户的余额和邮箱
  const { data: balances, error } = await supabase
    .from('user_jinbi_balance')
    .select(`
      *,
      users:user_id (email, username)
    `)
    .order('last_updated', { ascending: false });

  if (error) {
    console.error('❌ 查询失败:', error.message);
    return;
  }

  console.log(`找到 ${balances?.length || 0} 个有余额记录的用户:\n`);

  balances?.forEach((b, index) => {
    console.log(`${index + 1}. 用户: ${b.user_id}`);
    console.log(`   邮箱: ${b.users?.email || 'N/A'}`);
    console.log(`   用户名: ${b.users?.username || 'N/A'}`);
    console.log(`   余额: ${b.total_balance}`);
    console.log(`   更新时间: ${b.last_updated}`);
    console.log('');
  });

  // 获取最近的充值记录
  console.log('\n最近的充值记录:');
  const { data: records } = await supabase
    .from('jinbi_records')
    .select(`
      *,
      users:user_id (email, username)
    `)
    .eq('type', 'purchase')
    .order('created_at', { ascending: false })
    .limit(5);

  records?.forEach((r, index) => {
    console.log(`${index + 1}. 用户: ${r.users?.email || r.user_id}`);
    console.log(`   金额: ${r.amount}`);
    console.log(`   时间: ${r.created_at}`);
    console.log('');
  });

  console.log('========================================');
  console.log('提示: 请检查浏览器控制台获取当前登录用户的ID');
  console.log('========================================');
}

checkCurrentUser();
