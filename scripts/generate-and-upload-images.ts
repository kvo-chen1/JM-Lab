/**
 * 批量生成AI图片并上传到Supabase Storage
 * 使用方法: npx ts-node scripts/generate-and-upload-images.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabase配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// AI图片生成配置
const AI_IMAGE_API = '/api/proxy/trae-api/api/ide/v1/text_to_image';

// 文化知识条目列表（与数据库中的数据对应）
const culturalItems = [
  {
    title: '杨柳青年画',
    prompt: 'Yangliuqing%20New%20Year%20paintings%20traditional%20workshop',
    filename: 'yangliuqing-painting.jpg'
  },
  {
    title: '泥人张彩塑',
    prompt: 'Traditional%20Chinese%20clay%20sculpture%20workshop%20Tianjin',
    filename: 'nirenzhang-clay.jpg'
  },
  {
    title: '天津方言',
    prompt: 'Tianjin%20dialect%20culture%20traditional%20street%20scene',
    filename: 'tianjin-dialect.jpg'
  },
  {
    title: '天津之眼',
    prompt: 'Tianjin%20Eye%20Ferris%20wheel%20night%20view',
    filename: 'tianjin-eye.jpg'
  },
  {
    title: '狗不理包子',
    prompt: 'Goubuli%20steamed%20buns%20traditional%20shop',
    filename: 'goubuli-baozi.jpg'
  },
  {
    title: '五大道建筑群',
    prompt: 'Tianjin%20Five%20Avenues%20historic%20buildings',
    filename: 'wudadao-buildings.jpg'
  },
  {
    title: '天津时调',
    prompt: 'Tianjin%20traditional%20folk%20music%20performance',
    filename: 'tianjin-shidiao.jpg'
  },
  {
    title: '天后宫',
    prompt: 'Tianjin%20Tianhou%20Palace%20temple%20architecture',
    filename: 'tianhou-palace.jpg'
  },
  {
    title: '传统纹样分类',
    prompt: 'Chinese%20traditional%20patterns%20geometric%20floral%20designs',
    filename: 'traditional-patterns.jpg'
  },
  {
    title: '非遗技艺介绍',
    prompt: 'Chinese%20intangible%20cultural%20heritage%20craftsmanship%20workshop',
    filename: 'intangible-heritage.jpg'
  },
  {
    title: '中国传统色彩体系',
    prompt: 'Chinese%20traditional%20color%20palette%20five%20elements%20philosophy',
    filename: 'traditional-colors.jpg'
  },
  {
    title: '传统建筑元素',
    prompt: 'Chinese%20traditional%20architecture%20elements%20dougong%20brackets',
    filename: 'traditional-architecture.jpg'
  },
  {
    title: '传统节日习俗',
    prompt: 'Chinese%20traditional%20festival%20celebrations%20lanterns%20red',
    filename: 'traditional-festivals.jpg'
  }
];

/**
 * 下载AI生成的图片
 */
async function downloadAIImage(prompt: string, outputPath: string): Promise<boolean> {
  try {
    const url = `${AI_IMAGE_API}?image_size=1024x1024&prompt=${prompt}`;
    console.log(`正在下载图片: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`下载失败: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 确保目录存在
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, buffer);
    console.log(`图片已保存: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`下载图片失败:`, error);
    return false;
  }
}

/**
 * 上传图片到Supabase Storage
 */
async function uploadToStorage(localPath: string, storagePath: string): Promise<string | null> {
  try {
    console.log(`正在上传到Storage: ${storagePath}`);
    
    const fileBuffer = fs.readFileSync(localPath);
    const { data, error } = await supabase.storage
      .from('cultural-assets')
      .upload(storagePath, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error('上传失败:', error);
      return null;
    }
    
    // 获取公共URL
    const { data: { publicUrl } } = supabase.storage
      .from('cultural-assets')
      .getPublicUrl(storagePath);
    
    console.log(`上传成功: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('上传图片失败:', error);
    return null;
  }
}

/**
 * 更新数据库中的图片URL
 */
async function updateDatabaseImageUrl(title: string, imageUrl: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('cultural_knowledge')
      .update({ image_url: imageUrl })
      .eq('title', title);
    
    if (error) {
      console.error(`更新数据库失败 [${title}]:`, error);
      return false;
    }
    
    console.log(`数据库已更新 [${title}]: ${imageUrl}`);
    return true;
  } catch (error) {
    console.error(`更新数据库失败 [${title}]:`, error);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('开始批量生成和上传AI图片...\n');
  
  const tempDir = path.join(__dirname, '..', 'temp-images');
  
  for (const item of culturalItems) {
    console.log(`\n处理: ${item.title}`);
    console.log('-'.repeat(50));
    
    const localPath = path.join(tempDir, item.filename);
    const storagePath = `knowledge-images/${item.filename}`;
    
    // 1. 下载AI图片
    const downloaded = await downloadAIImage(item.prompt, localPath);
    if (!downloaded) {
      console.error(`跳过 ${item.title} - 下载失败`);
      continue;
    }
    
    // 等待一下，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. 上传到Storage
    const publicUrl = await uploadToStorage(localPath, storagePath);
    if (!publicUrl) {
      console.error(`跳过 ${item.title} - 上传失败`);
      continue;
    }
    
    // 3. 更新数据库
    const updated = await updateDatabaseImageUrl(item.title, publicUrl);
    if (!updated) {
      console.error(`更新数据库失败 [${item.title}]`);
    }
    
    // 等待一下，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 清理临时文件
  console.log('\n清理临时文件...');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  console.log('\n✅ 批量处理完成！');
}

// 运行主函数
main().catch(console.error);
