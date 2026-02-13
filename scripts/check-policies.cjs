/**
 * 检查 event-submissions 存储桶的 RLS 策略
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

async function checkPolicies() {
  console.log('检查 event-submissions 存储桶策略...\n');

  try {
    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('获取当前用户失败:', userError.message);
    } else if (user) {
      console.log('当前用户ID:', user.id);
      console.log('用户已认证: 是\n');
    } else {
      console.log('当前用户: 未登录\n');
    }

    // 尝试直接查询 storage.objects 表
    const { data: policies, error: policiesError } = await supabase
      .from('storage.objects')
      .select('*')
      .eq('bucket_id', 'event-submissions')
      .limit(1);

    if (policiesError) {
      console.log('查询 storage.objects 失败:', policiesError.message);
    } else {
      console.log('✅ 可以读取 storage.objects 表');
    }

    // 尝试上传一个测试文件
    console.log('\n尝试上传测试文件...');
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('event-submissions')
      .upload(`test/${Date.now()}_test.txt`, testFile, {
        upsert: true
      });

    if (uploadError) {
      console.error('❌ 上传失败:', uploadError.message);
      console.log('\n可能的解决方案:');
      console.log('1. 检查 INSERT 策略的 definition 是否正确');
      console.log('2. 确保策略的 bucket_id 条件是 "event-submissions"');
      console.log('3. 尝试删除并重新创建策略');
    } else {
      console.log('✅ 上传成功:', uploadData.path);
      
      // 清理测试文件
      await supabase.storage
        .from('event-submissions')
        .remove([uploadData.path]);
      console.log('✅ 测试文件已清理');
    }

  } catch (error) {
    console.error('执行失败:', error.message);
  }
}

checkPolicies();
