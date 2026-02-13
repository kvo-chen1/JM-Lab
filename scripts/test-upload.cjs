/**
 * 测试文件上传，诊断 RLS 问题
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTE1MzIsImV4cCI6MjA4MjA2NzUzMn0.plz64e2bkfbgiyabnyl2l2grvtpo-u8fcddxa-mjgx4';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testUpload() {
  console.log('测试文件上传...\n');

  // 1. 检查当前用户
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.log('❌ 用户未登录');
    console.log('请先登录后再测试上传\n');
    return;
  }

  console.log('✅ 当前用户:', user.id);
  console.log('✅ 用户邮箱:', user.email);
  console.log('');

  // 2. 测试上传
  console.log('尝试上传测试文件...');
  const testContent = 'test content';
  const testBlob = new Blob([testContent], { type: 'text/plain' });
  const testFileName = `test/${Date.now()}_test.txt`;
  
  const { data, error } = await supabase.storage
    .from('event-submissions')
    .upload(testFileName, testBlob, {
      upsert: true
    });

  if (error) {
    console.error('❌ 上传失败:', error.message);
    console.log('\n错误详情:', error);
    
    if (error.message.includes('row-level security')) {
      console.log('\n💡 这是 RLS 策略问题');
      console.log('解决方案:');
      console.log('1. 进入 Supabase Dashboard > Storage > event-submissions > Policies');
      console.log('2. 删除所有现有策略');
      console.log('3. 创建新策略:');
      console.log('   - Name: insert_policy');
      console.log('   - Operation: INSERT');
      console.log('   - Roles: authenticated');
      console.log('   - Definition: bucket_id = \'event-submissions\'');
    }
  } else {
    console.log('✅ 上传成功:', data.path);
    
    // 清理
    await supabase.storage
      .from('event-submissions')
      .remove([data.path]);
    console.log('✅ 测试文件已清理');
  }
}

// 如果提供了用户名密码，先登录
async function loginAndTest() {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  
  if (email && password) {
    console.log('使用提供的凭据登录...\n');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('登录失败:', error.message);
      return;
    }
    console.log('✅ 登录成功\n');
  }
  
  await testUpload();
}

loginAndTest();
