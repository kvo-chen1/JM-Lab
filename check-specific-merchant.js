import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kizgwtrrsmkjeiddotup.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpemd3dHJyc21ramVpZGRvdHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgxOTI2NSwiZXhwIjoyMDg4Mzk1MjY1fQ.Joc5d8ORWUfijvns7szuBONRkoIJubd6_B30fIM8HB0';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkSpecificMerchant() {
  const userId = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';
  
  console.log(`🔍 检查用户ID: ${userId}`);
  console.log('═══════════════════════════════════════\n');

  // 1. 检查 merchants 表中是否有该用户的记录
  console.log('📊 1. 查询 merchants 表');
  const { data: merchants, error: merchantError } = await supabaseAdmin
    .from('merchants')
    .select('*')
    .eq('user_id', userId);
  
  console.log('   查询结果:', { 
    count: merchants?.length || 0, 
    error: merchantError?.message || null,
    data: merchants
  });

  // 2. 检查 merchant_stores 表
  console.log('\n📊 2. 查询 merchant_stores 表');
  const { data: stores, error: storeError } = await supabaseAdmin
    .from('merchant_stores')
    .select('*')
    .eq('user_id', userId);
  
  console.log('   查询结果:', { 
    count: stores?.length || 0, 
    error: storeError?.message || null,
    data: stores
  });

  // 3. 检查所有商户记录
  console.log('\n📊 3. 所有商户记录');
  const { data: allMerchants } = await supabaseAdmin
    .from('merchants')
    .select('id, user_id, store_name');
  
  console.log('   所有商户:', allMerchants);

  console.log('\n═══════════════════════════════════════');
}

checkSpecificMerchant();
