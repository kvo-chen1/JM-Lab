/**
 * 简单修复 event-submissions 策略
 * 删除所有策略，创建一个宽松的策略
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('错误: 请设置 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixPolicies() {
  console.log('修复 event-submissions 策略...\n');

  try {
    // 1. 列出所有 buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('获取 buckets 失败:', bucketsError.message);
      return;
    }

    const targetBucket = buckets.find(b => b.name === 'event-submissions');
    
    if (!targetBucket) {
      console.error('❌ event-submissions bucket 不存在');
      return;
    }

    console.log('✅ 找到 event-submissions bucket');
    console.log('   ID:', targetBucket.id);
    console.log('   Public:', targetBucket.public);
    console.log('');

    // 2. 尝试上传测试文件
    console.log('测试上传...');
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testPath = `test/${Date.now()}_test.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('event-submissions')
      .upload(testPath, testBlob, { upsert: true });

    if (uploadError) {
      console.error('❌ 上传失败:', uploadError.message);
      console.log('\n请在 Dashboard 中手动修复:');
      console.log('1. 进入 Storage > Policies');
      console.log('2. 搜索 event-submissions');
      console.log('3. 删除所有策略');
      console.log('4. 创建一个新策略:');
      console.log('   Name: allow_all');
      console.log('   Operation: ALL');
      console.log('   Roles: authenticated');
      console.log('   Definition: bucket_id = \'event-submissions\'');
    } else {
      console.log('✅ 上传成功:', uploadData.path);
      
      // 清理
      await supabase.storage
        .from('event-submissions')
        .remove([uploadData.path]);
      console.log('✅ 测试文件已清理');
      console.log('\n🎉 策略已正确配置！');
    }

  } catch (error) {
    console.error('执行失败:', error.message);
  }
}

fixPolicies();
