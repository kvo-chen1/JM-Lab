/**
 * 诊断上传问题
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

async function diagnose() {
  console.log('=== 上传问题诊断 ===\n');

  // 1. 检查当前会话
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.log('❌ 获取会话失败:', sessionError.message);
  } else if (session) {
    console.log('✅ 用户已登录');
    console.log('   用户ID:', session.user.id);
    console.log('   角色:', session.user.role);
    console.log('   Token:', session.access_token.substring(0, 20) + '...');
  } else {
    console.log('❌ 用户未登录（没有会话）');
  }
  console.log('');

  // 2. 检查 bucket 信息
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.log('❌ 获取 buckets 失败:', bucketsError.message);
  } else {
    const targetBucket = buckets.find(b => b.name === 'event-submissions');
    if (targetBucket) {
      console.log('✅ 找到 event-submissions bucket');
      console.log('   ID:', targetBucket.id);
      console.log('   名称:', targetBucket.name);
      console.log('   公开:', targetBucket.public);
    } else {
      console.log('❌ event-submissions bucket 不存在');
    }
  }
  console.log('');

  // 3. 尝试上传（使用当前会话）
  if (session) {
    console.log('尝试上传测试文件...');
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testPath = `test/${Date.now()}_diagnose.txt`;
    
    const { data, error } = await supabase.storage
      .from('event-submissions')
      .upload(testPath, testBlob, { upsert: true });

    if (error) {
      console.error('❌ 上传失败:', error.message);
      console.log('\n错误详情:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ 上传成功:', data.path);
      
      // 清理
      await supabase.storage
        .from('event-submissions')
        .remove([data.path]);
      console.log('✅ 测试文件已清理');
    }
  } else {
    console.log('跳过上传测试（用户未登录）');
  }
}

diagnose();
