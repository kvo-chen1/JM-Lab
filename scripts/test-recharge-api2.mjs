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

async function testRecharge() {
  console.log('========================================');
  console.log('测试充值 API (使用真实用户)');
  console.log('========================================\n');

  // 使用一个存在的用户ID
  const testUserId = '78340927-c853-4978-a90f-f54d7c6883d2';
  const packageId = 'pkg-001';
  const jinbiAmount = 1100;
  const amount = 10.00;

  try {
    // 1. 检查用户当前余额
    console.log('1. 检查用户当前余额...');
    const { data: balanceData, error: balanceError } = await supabase
      .from('user_jinbi_balance')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.log('❌ 查询余额失败:', balanceError.message);
    } else {
      console.log('✅ 当前余额:', balanceData?.total_balance || 0);
    }

    const currentBalance = balanceData?.total_balance || 0;
    const newBalance = currentBalance + jinbiAmount;

    // 2. 创建充值记录
    console.log('\n2. 创建充值记录...');
    const { data: record, error: recordError } = await supabase
      .from('jinbi_records')
      .insert({
        user_id: testUserId,
        amount: jinbiAmount,
        type: 'purchase',
        source: 'wechat',
        description: `充值 ${jinbiAmount} 津币`,
        balance_after: newBalance,
        related_id: null,
        related_type: 'jinbi_package',
        metadata: {
          paymentMethod: 'wechat',
          price: amount,
          packageId,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (recordError) {
      console.log('❌ 插入充值记录失败:', recordError.message);
      console.log('   错误代码:', recordError.code);
    } else {
      console.log('✅ 插入充值记录成功:', record.id);
    }

    // 3. 更新余额
    console.log('\n3. 更新余额...');
    if (balanceData) {
      const { error: updateError } = await supabase
        .from('user_jinbi_balance')
        .update({
          total_balance: newBalance,
          available_balance: newBalance,
          total_earned: (balanceData.total_earned || 0) + jinbiAmount,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', testUserId);

      if (updateError) {
        console.log('❌ 更新余额失败:', updateError.message);
      } else {
        console.log('✅ 更新余额成功');
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_jinbi_balance')
        .insert({
          user_id: testUserId,
          total_balance: newBalance,
          available_balance: newBalance,
          total_earned: jinbiAmount,
          total_spent: 0,
          total_consumed: 0,
          frozen_balance: 0,
          last_updated: new Date().toISOString(),
        });

      if (insertError) {
        console.log('❌ 插入余额记录失败:', insertError.message);
      } else {
        console.log('✅ 插入余额记录成功');
      }
    }

    // 4. 验证结果
    console.log('\n4. 验证结果...');
    const { data: finalBalance, error: finalError } = await supabase
      .from('user_jinbi_balance')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (finalError) {
      console.log('❌ 查询最终余额失败:', finalError.message);
    } else {
      console.log('✅ 最终余额:', finalBalance.total_balance);
      console.log('   总收入:', finalBalance.total_earned);
    }

  } catch (error) {
    console.error('测试失败:', error);
  }

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
}

testRecharge();
