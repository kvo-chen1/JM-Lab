#!/usr/bin/env tsx
/**
 * 文化知识库图片批量生成脚本
 * 
 * 使用方法:
 * npx tsx scripts/generate-cultural-knowledge-images.ts [options]
 * 
 * 选项:
 * --batch-size <number>  每批处理数量 (默认: 5)
 * --limit <number>       总共处理数量 (默认: 全部)
 * --id <number>          只处理指定ID
 * --regenerate           重新生成所有图片
 * --dry-run              只显示将要处理的记录，不实际生成
 * 
 * 示例:
 * npx tsx scripts/generate-cultural-knowledge-images.ts
 * npx tsx scripts/generate-cultural-knowledge-images.ts --batch-size 3 --limit 10
 * npx tsx scripts/generate-cultural-knowledge-images.ts --id 123
 * npx tsx scripts/generate-cultural-knowledge-images.ts --regenerate
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(envLocalPath)) {
  console.log('Loading .env.local...');
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  console.log('Loading .env...');
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠️ No .env or .env.local file found!');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env or .env.local');
  process.exit(1);
}

console.log(`Connecting to Supabase at: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options: Record<string, any> = {
    batchSize: 5,
    limit: null,
    id: null,
    regenerate: false,
    dryRun: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--batch-size':
        options.batchSize = parseInt(args[++i]) || 5;
        break;
      case '--limit':
        options.limit = parseInt(args[++i]) || null;
        break;
      case '--id':
        options.id = parseInt(args[++i]) || null;
        break;
      case '--regenerate':
        options.regenerate = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
    }
  }

  return options;
}

// 生成图片prompt
function generatePrompt(knowledge: any): string {
  const { title, category, tags } = knowledge;
  
  const keywords = tags?.join(', ') || '';
  const shortTitle = title?.split('：')[0] || title;
  
  const categoryPrompts: Record<string, string> = {
    '非遗传承': 'traditional Chinese intangible cultural heritage, master craftsmanship',
    '民间艺术': 'Chinese folk art, traditional patterns, vibrant colors',
    '传统工艺': 'traditional Chinese craftsmanship, handmade, exquisite details',
    '传统美食': 'traditional Chinese cuisine, appetizing food photography',
    '中药文化': 'traditional Chinese medicine, herbal pharmacy, historical',
    '陶瓷文化': 'Chinese porcelain, ceramic art, elegant craftsmanship',
    '酒文化': 'traditional Chinese liquor brewing, cultural heritage',
    '曲艺文化': 'Chinese traditional performing arts, folk entertainment',
    '服饰文化': 'traditional Chinese clothing, elegant fashion',
    '文房四宝': 'Chinese calligraphy tools, traditional stationery',
    '历史建筑': 'historic Chinese architecture, cultural landmark',
    '城市文化': 'Chinese urban culture, cityscape, local life',
    '民族文化': 'Chinese ethnic minority culture, traditional costume',
    '刺绣': 'Chinese embroidery, intricate needlework, silk thread',
    '剪纸': 'Chinese paper cutting, red paper art, folk patterns',
    '饮食文化': 'Chinese food culture, culinary tradition',
  };
  
  const categoryStyle = categoryPrompts[category] || 'traditional Chinese culture';
  
  const prompt = `${shortTitle}, ${categoryStyle}${keywords ? ', ' + keywords : ''}, high quality, detailed, cultural heritage, artistic, professional photography style`.trim();
  
  return prompt;
}

// 调用 Trae API 生成图片
async function generateImageWithTraeAPI(prompt: string, size: string = '1024x1024'): Promise<Blob | null> {
  try {
    // 使用代理URL - 需要确保本地服务器正在运行
    const proxyUrl = `http://localhost:3000/api/proxy/trae-api/api/ide/v1/text_to_image`;
    const params = new URLSearchParams({
      prompt: prompt,
      image_size: size
    });
    
    console.log(`  📡 Calling API: ${proxyUrl}?prompt=${prompt.substring(0, 50)}...`);
    
    const response = await fetch(`${proxyUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'image/*, */*',
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log(`  ✅ Image generated: ${(blob.size / 1024).toFixed(2)} KB`);
    return blob;
  } catch (error) {
    console.error('  ❌ Image generation failed:', error);
    return null;
  }
}

// 上传图片到 Storage
async function uploadImageToStorage(blob: Blob, knowledgeId: number): Promise<string | null> {
  try {
    const fileName = `${knowledgeId}.jpg`;
    const filePath = `cultural-knowledge/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('cultural-knowledge')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    
    const { data } = supabase.storage
      .from('cultural-knowledge')
      .getPublicUrl(filePath);
    
    console.log(`  ✅ Uploaded: ${data.publicUrl}`);
    return data.publicUrl;
  } catch (error) {
    console.error('  ❌ Upload failed:', error);
    return null;
  }
}

// 更新数据库状态
async function updateImageStatus(
  id: number,
  status: string,
  imageUrl?: string,
  prompt?: string
): Promise<void> {
  try {
    const updateData: Record<string, any> = {
      image_generation_status: status,
      updated_at: new Date().toISOString()
    };
    
    if (imageUrl) updateData.image_url = imageUrl;
    if (prompt) updateData.image_prompt = prompt;
    if (status === 'completed') updateData.image_generated_at = new Date().toISOString();
    
    const { error } = await supabase
      .from('cultural_knowledge')
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('  ❌ Failed to update status:', error);
  }
}

// 为单条记录生成图片
async function generateImageForKnowledge(knowledge: any, dryRun: boolean = false): Promise<boolean> {
  console.log(`\n📝 Processing: ${knowledge.title} (ID: ${knowledge.id})`);
  
  const prompt = generatePrompt(knowledge);
  console.log(`  🎨 Prompt: ${prompt}`);
  
  if (dryRun) {
    console.log('  ⏭️  Dry run - skipping generation');
    return true;
  }
  
  // 更新状态为生成中
  await updateImageStatus(knowledge.id, 'generating');
  
  // 生成图片
  const imageBlob = await generateImageWithTraeAPI(prompt);
  if (!imageBlob) {
    await updateImageStatus(knowledge.id, 'failed');
    return false;
  }
  
  // 上传图片
  const imageUrl = await uploadImageToStorage(imageBlob, knowledge.id);
  if (!imageUrl) {
    await updateImageStatus(knowledge.id, 'failed');
    return false;
  }
  
  // 更新完成状态
  await updateImageStatus(knowledge.id, 'completed', imageUrl, prompt);
  console.log(`  ✅ Completed!`);
  
  return true;
}

// 主函数
async function main() {
  const options = parseArgs();
  
  console.log('🚀 Cultural Knowledge Image Generator');
  console.log('=====================================');
  console.log(`Options:`, options);
  console.log('');
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No images will be generated\n');
  }
  
  try {
    let knowledgeList: any[] = [];
    
    // 获取需要处理的记录
    if (options.id) {
      // 处理指定ID
      const { data, error } = await supabase
        .from('cultural_knowledge')
        .select('*')
        .eq('id', options.id)
        .single();
      
      if (error || !data) {
        console.error(`❌ Knowledge with ID ${options.id} not found`);
        process.exit(1);
      }
      knowledgeList = [data];
    } else {
      // 获取待处理列表
      let query = supabase
        .from('cultural_knowledge')
        .select('*');
      
      if (!options.regenerate) {
        // 只获取未生成或失败的
        query = query.in('image_generation_status', ['pending', 'failed']);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });
      
      if (error) {
        console.error('❌ Failed to fetch knowledge list:', error.message);
        process.exit(1);
      }
      
      knowledgeList = data || [];
    }
    
    console.log(`📊 Found ${knowledgeList.length} records to process\n`);
    
    if (knowledgeList.length === 0) {
      console.log('✅ No records need processing');
      process.exit(0);
    }
    
    // 处理记录
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < knowledgeList.length; i++) {
      const knowledge = knowledgeList[i];
      console.log(`\n[${i + 1}/${knowledgeList.length}]`);
      
      const result = await generateImageForKnowledge(knowledge, options.dryRun);
      
      if (result) {
        success++;
      } else {
        failed++;
      }
      
      // 添加延迟避免请求过快
      if (!options.dryRun && i < knowledgeList.length - 1) {
        console.log('  ⏳ Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 输出统计
    console.log('\n=====================================');
    console.log('📈 Generation Summary');
    console.log('=====================================');
    console.log(`Total: ${knowledgeList.length}`);
    console.log(`✅ Success: ${success}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (options.dryRun) {
      console.log('\n🔍 This was a dry run. No images were actually generated.');
      console.log('   Run without --dry-run to generate images.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

main();
