// 测试充值 API
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
  console.log('测试充值 API');
  console.log('========================================\n');

  const testUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const packageId = 'pkg-001';
  const jinbiAmount = 1100;
  const amount = 10.00;

  try {
    // 1. 检查表结构
    console.log('1. 检查 jinbi_records 表结构...');
    const { data: recordTest, error: recordTestError } = await supabase
      .from('jinbi_records')
      .select('*')
      .limit(1);

    if (recordTestError) {
      console.log('❌ jinbi_records 表查询失败:', recordTestError.message);
    } else {
      console.log('✅ jinbi_records 表正常');
    }

    // 2. 检查 user_jinbi_balance 表
    console.log('\n2. 检查 user_jinbi_balance 表...');
    const { data: balanceTest, error: balanceTestError } = await supabase
      .from('user_jinbi_balance')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (balanceTestError && balanceTestError.code !== 'PGRST116') {
      console.log('❌ user_jinbi_balance 表查询失败:', balanceTestError.message);
    } else {
      console.log('✅ user_jinbi_balance 表正常');
      console.log('   当前余额:', balanceTest?.total_balance || 0);
    }

    // 3. 测试插入充值记录
    console.log('\n3. 测试插入充值记录...');
    const newBalance = (balanceTest?.total_balance || 0) + jinbiAmount;

    const { data: record, error: recordError } = await supabase
      .from('jinbi_records')
      .insert({
        user_id: testUserId,
        amount: jinbiAmount,
        type: 'purchase',
        source: 'wechat',
        description: `充值 ${jinbiAmount} 津币`,
        balance_after: newBalance,
        related_id: packageId,
        related_type: 'jinbi_package',
        metadata: JSON.stringify({
          paymentMethod: 'wechat',
          price: amount,
          packageId,
        }),
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

    // 4. 测试更新余额
    console.log('\n4. 测试更新余额...');
    if (balanceTest) {
      const { error: updateError } = await supabase
        .from('user_jinbi_balance')
        .update({
          total_balance: newBalance,
          available_balance: newBalance,
          total_earned: (balanceTest.total_earned || 0) + jinbiAmount,
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

    // 5. 验证结果
    console.log('\n5. 验证结果...');
    const { data: finalBalance, error: finalError } = await supabase
      .from('user_jinbi_balance')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (finalError) {
      console.log('❌ 查询最终余额失败:', finalError.message);
    } else {
      console.log('✅ 最终余额:', finalBalance.total_balance);
    }

  } catch (error) {
    console.error('测试失败:', error);
  }

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
}

testRecharge();
