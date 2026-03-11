/**
 * 检查标签数据
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

async function checkTags() {
  console.log('🔍 检查标签数据...\n');

  // 查询所有标签
  const { data: tags, error } = await supabase
    .from('tags')
    .select('*')
    .limit(20);

  if (error) {
    console.error('查询失败:', error.message);
    return;
  }

  console.log(`找到 ${tags?.length || 0} 个标签:\n`);
  
  tags?.forEach((tag, i) => {
    console.log(`${i + 1}. ${tag.name}`);
    if (tag.display_name) console.log(`   显示名称: ${tag.display_name}`);
    if (tag.description) console.log(`   描述: ${tag.description}`);
    console.log('');
  });

  // 检查是否有 display_name 字段
  if (tags && tags.length > 0) {
    const hasDisplayName = tags.some(t => t.display_name);
    console.log(`是否有 display_name 字段: ${hasDisplayName ? '是' : '否'}`);
  }
}

checkTags();
