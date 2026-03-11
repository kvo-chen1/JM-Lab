/**
 * 设置 Supabase Storage Bucket
 * 用于存储商品图片
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  console.log('🔧 设置 Supabase Storage...\n');

  try {
    // 1. 创建 product-images bucket
    console.log('📁 创建 product-images bucket...');
    const { data: bucket, error: bucketError } = await supabase.storage
      .createBucket('product-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('  ✅ product-images bucket 已存在');
      } else {
        console.error('  ❌ 创建 bucket 失败:', bucketError.message);
      }
    } else {
      console.log('  ✅ product-images bucket 创建成功');
    }

    // 2. 设置 bucket 的公开访问策略
    console.log('\n🔒 设置 bucket 访问策略...');
    const { error: policyError } = await supabase.storage
      .from('product-images')
      .createSignedUrl('test.txt', 60);
    
    // 3. 测试 bucket 是否可用
    console.log('\n🧪 测试 bucket...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('  ❌ 获取 bucket 列表失败:', listError.message);
    } else {
      const productImagesBucket = buckets.find(b => b.name === 'product-images');
      if (productImagesBucket) {
        console.log('  ✅ product-images bucket 状态:', productImagesBucket.public ? '公开' : '私有');
      }
    }

    console.log('\n✨ Storage 设置完成！');
    console.log('\n📋 说明：');
    console.log('  - Bucket 名称: product-images');
    console.log('  - 公开访问: 是');
    console.log('  - 文件大小限制: 5MB');
    console.log('  - 允许格式: JPG, PNG, WebP, GIF');

  } catch (error) {
    console.error('\n❌ 设置失败:', error.message);
    process.exit(1);
  }
}

setupStorage();
