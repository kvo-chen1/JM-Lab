import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kizgwtrrsmkjeiddotup.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpemd3dHJyc21ramVpZGRvdHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgxOTI2NSwiZXhwIjoyMDg4Mzk1MjY1fQ.Joc5d8ORWUfijvns7szuBONRkoIJubd6_B30fIM8HB0';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkMerchantData() {
  console.log('🏪 检查商户相关数据\n');
  console.log('═══════════════════════════════════════\n');

  // 1. 检查 merchants 表
  console.log('📊 1. 商户表 (merchants)');
  try {
    const { data: merchants, error, count } = await supabaseAdmin
      .from('merchants')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.log(`   ❌ 错误: ${error.message}`);
    } else {
      console.log(`   ✅ 商户数量: ${count || 0}`);
      if (merchants && merchants.length > 0) {
        merchants.forEach(m => {
          console.log(`      - ${m.store_name} (ID: ${m.id}, 用户: ${m.user_id})`);
        });
      }
    }
  } catch (error) {
    console.log(`   ❌ 异常: ${error.message}`);
  }

  // 2. 检查 merchant_stores 表
  console.log('\n📊 2. 商户店铺表 (merchant_stores)');
  try {
    const { data: stores, error, count } = await supabaseAdmin
      .from('merchant_stores')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.log(`   ❌ 错误: ${error.message}`);
    } else {
      console.log(`   ✅ 店铺数量: ${count || 0}`);
      if (stores && stores.length > 0) {
        stores.forEach(s => {
          console.log(`      - ${s.store_name} (ID: ${s.id})`);
        });
      }
    }
  } catch (error) {
    console.log(`   ❌ 异常: ${error.message}`);
  }

  // 3. 检查 orders 表
  console.log('\n📊 3. 订单表 (orders)');
  try {
    const { count, error } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`   ❌ 错误: ${error.message}`);
    } else {
      console.log(`   ✅ 订单数量: ${count || 0}`);
    }
  } catch (error) {
    console.log(`   ❌ 异常: ${error.message}`);
  }

  // 4. 检查 products 表
  console.log('\n📊 4. 商品表 (products)');
  try {
    const { count, error } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`   ❌ 错误: ${error.message}`);
    } else {
      console.log(`   ✅ 商品数量: ${count || 0}`);
    }
  } catch (error) {
    console.log(`   ❌ 异常: ${error.message}`);
  }

  // 5. 检查 RPC 函数是否存在
  console.log('\n📊 5. RPC 函数 (get_merchant_dashboard_stats)');
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_merchant_dashboard_stats', { merchant_id: 'test' });
    
    if (error) {
      console.log(`   ❌ 错误: ${error.message}`);
    } else {
      console.log(`   ✅ 函数存在，返回:`, data);
    }
  } catch (error) {
    console.log(`   ❌ 异常: ${error.message}`);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('📊 检查完成');
}

checkMerchantData();
