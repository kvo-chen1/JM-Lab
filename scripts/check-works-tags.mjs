/**
 * 检查作品标签数据
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWorksTags() {
  console.log('🔍 检查作品标签数据...\n');

  // 查询作品中的标签
  const { data: works, error } = await supabase
    .from('works')
    .select('id, title, tags, category')
    .limit(10);

  if (error) {
    console.error('查询失败:', error.message);
    return;
  }

  console.log(`找到 ${works?.length || 0} 个作品:\n`);
  
  works?.forEach((work, i) => {
    console.log(`${i + 1}. ${work.title || '无标题'}`);
    console.log(`   标签: ${JSON.stringify(work.tags)}`);
    console.log(`   分类: ${work.category}`);
    console.log('');
  });

  // 统计所有标签
  const allTags = new Set();
  works?.forEach(work => {
    if (work.tags) {
      if (Array.isArray(work.tags)) {
        work.tags.forEach(tag => allTags.add(tag));
      } else if (typeof work.tags === 'string') {
        allTags.add(work.tags);
      }
    }
    if (work.category) {
      allTags.add(work.category);
    }
  });

  console.log(`\n所有标签 (${allTags.size} 个):`);
  Array.from(allTags).forEach(tag => console.log(`  - ${tag}`));
}

checkWorksTags();
