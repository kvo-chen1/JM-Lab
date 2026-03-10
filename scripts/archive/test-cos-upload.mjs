/**
 * 测试腾讯云 COS 上传
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { uploadToCOS, deleteFromCOS, isCOSConfigured } from './server/services/cosService.mjs';

console.log('🧪 测试腾讯云 COS 上传\n');
console.log('='.repeat(60));

// 检查配置
console.log('\n1️⃣ 检查 COS 配置...');
console.log('   COS_SECRET_ID:', process.env.COS_SECRET_ID ? '已设置' : '未设置');
console.log('   COS_SECRET_KEY:', process.env.COS_SECRET_KEY ? '已设置' : '未设置');
console.log('   COS_BUCKET:', process.env.COS_BUCKET);
console.log('   COS_REGION:', process.env.COS_REGION);
console.log('   COS_DOMAIN:', process.env.COS_DOMAIN);

if (!isCOSConfigured()) {
  console.log('\n❌ COS 配置不完整，请检查环境变量');
  process.exit(1);
}

console.log('   ✅ COS 配置完整');

// 创建一个测试图片（1x1 像素的透明 PNG）
const testImageBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64'
);

async function testUpload() {
  console.log('\n2️⃣ 测试上传文件...');
  
  try {
    const result = await uploadToCOS(
      testImageBuffer,
      'test-image.png',
      'image/png',
      'test'
    );
    
    console.log('   ✅ 上传成功！');
    console.log('   URL:', result.url);
    console.log('   Key:', result.key);
    console.log('   Size:', result.size, 'bytes');
    
    // 测试删除
    console.log('\n3️⃣ 测试删除文件...');
    const deleteSuccess = await deleteFromCOS(result.key);
    
    if (deleteSuccess) {
      console.log('   ✅ 删除成功！');
    } else {
      console.log('   ❌ 删除失败');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 所有测试通过！COS 配置正确。');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testUpload();
