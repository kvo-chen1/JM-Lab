/**
 * 创建 event-submissions 存储桶
 * 使用 Supabase Admin API 绕过 SQL 权限限制
 * 
 * 使用方法:
 * 1. 在 Supabase Dashboard 获取 Service Role Key
 * 2. 设置环境变量: SUPABASE_URL 和 SUPABASE_SERVICE_KEY
 * 3. 运行: node scripts/create-storage-bucket.js
 */

const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('错误: 请设置 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  console.log('\n获取方法:');
  console.log('1. 打开 Supabase Dashboard');
  console.log('2. 进入 Project Settings > API');
  console.log('3. 复制 "service_role" key (注意保密!)');
  console.log('\n运行命令:');
  console.log('set SUPABASE_SERVICE_ROLE_KEY=your_key_here && node scripts/create-storage-bucket.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createBucket() {
  console.log('开始创建 event-submissions 存储桶...\n');

  try {
    // 1. 检查 bucket 是否已存在
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('获取 bucket 列表失败:', listError.message);
      return;
    }

    const existingBucket = buckets.find(b => b.name === 'event-submissions');
    
    if (existingBucket) {
      console.log('✅ event-submissions bucket 已存在');
    } else {
      // 2. 创建 bucket
      const { data, error: createError } = await supabase.storage.createBucket('event-submissions', {
        public: true,
        fileSizeLimit: 104857600, // 100MB
        allowedMimeTypes: [
          'image/*',
          'video/*',
          'audio/*',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ]
      });

      if (createError) {
        console.error('创建 bucket 失败:', createError.message);
        return;
      }

      console.log('✅ event-submissions bucket 创建成功');
    }

    // 3. 获取 bucket 详情
    const { data: bucketData, error: getError } = await supabase.storage.getBucket('event-submissions');
    
    if (getError) {
      console.error('获取 bucket 详情失败:', getError.message);
    } else {
      console.log('\nBucket 详情:');
      console.log('- 名称:', bucketData.name);
      console.log('- 公开:', bucketData.public ? '是' : '否');
      console.log('- 创建时间:', new Date(bucketData.created_at).toLocaleString());
    }

    console.log('\n🎉 存储桶创建完成！');
    console.log('\n下一步: 请在 Supabase Dashboard 中配置 RLS 策略:');
    console.log('1. 进入 Storage > event-submissions > Policies');
    console.log('2. 添加以下策略:');
    console.log('   - SELECT: bucket_id = \'event-submissions\' (允许所有人读取)');
    console.log('   - INSERT: bucket_id = \'event-submissions\' (允许认证用户上传)');
    console.log('   - UPDATE: bucket_id = \'event-submissions\' (允许认证用户更新)');
    console.log('   - DELETE: bucket_id = \'event-submissions\' (允许认证用户删除)');

  } catch (error) {
    console.error('执行失败:', error.message);
  }
}

createBucket();
