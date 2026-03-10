import { processImageUrl } from './src/utils/imageUrlUtils';

// 从mock数据中提取的图片URL
const testUrls = [
  'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop',
  'https://picsum.photos/100/100?random=1',
  'https://picsum.photos/800/600?random=2'
];

console.log('=== 测试mock数据中的图片URL处理 ===');

testUrls.forEach((url, index) => {
  console.log(`\n测试 ${index + 1}:`);
  console.log(`原始URL: ${url}`);
  try {
    const result = processImageUrl(url);
    console.log(`处理后URL: ${result}`);
    console.log(`URL是否改变: ${result !== url}`);
    console.log(`URL是否有效: ${result.startsWith('http')}`);
  } catch (error) {
    console.error(`处理出错: ${error}`);
  }
});
