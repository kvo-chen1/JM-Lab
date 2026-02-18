#!/usr/bin/env node
/**
 * 应用活动收藏和点赞表迁移
 * 创建 event_bookmarks 和 event_likes 表
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase 配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ppjtpotdciecawnvilff.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('错误: 请设置 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  console.error('示例: set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('========================================');
  console.log('应用活动收藏和点赞表迁移');
  console.log('========================================\n');

  try {
    // 读取 SQL 文件
    const sqlFilePath = path.join(__dirname, 'apply_event_bookmarks_likes.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf-8');

    console.log('正在执行 SQL 迁移...\n');

    // 执行 SQL
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('迁移失败:', error.message);
      
      // 尝试直接执行
      console.log('\n尝试直接创建表...');
      
      // 创建 event_bookmarks 表
      const { error: bookmarksError } = await supabase
        .from('event_bookmarks')
        .select('count')
        .limit(1);
      
      if (bookmarksError && bookmarksError.code === '42P01') {
        console.log('event_bookmarks 表不存在，尝试创建...');
        
        // 使用 REST API 创建表
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
          },
          body: JSON.stringify({
            query: `
              CREATE TABLE IF NOT EXISTS public.event_bookmarks (
                user_id INTEGER NOT NULL,
                event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (user_id, event_id)
              );
            `
          })
        });
        
        if (!response.ok) {
          console.error('创建 event_bookmarks 表失败:', await response.text());
        } else {
          console.log('✓ event_bookmarks 表创建成功');
        }
      } else {
        console.log('✓ event_bookmarks 表已存在');
      }
      
      // 创建 event_likes 表
      const { error: likesError } = await supabase
        .from('event_likes')
        .select('count')
        .limit(1);
      
      if (likesError && likesError.code === '42P01') {
        console.log('event_likes 表不存在，尝试创建...');
        
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
          },
          body: JSON.stringify({
            query: `
              CREATE TABLE IF NOT EXISTS public.event_likes (
                user_id INTEGER NOT NULL,
                event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (user_id, event_id)
              );
            `
          })
        });
        
        if (!response.ok) {
          console.error('创建 event_likes 表失败:', await response.text());
        } else {
          console.log('✓ event_likes 表创建成功');
        }
      } else {
        console.log('✓ event_likes 表已存在');
      }
    } else {
      console.log('✓ 迁移成功完成！\n');
    }

    // 验证表是否创建成功
    console.log('验证表...');
    
    const { error: bookmarksCheckError } = await supabase
      .from('event_bookmarks')
      .select('count')
      .limit(1);
    
    if (bookmarksCheckError && bookmarksCheckError.code === '42P01') {
      console.error('✗ event_bookmarks 表创建失败');
    } else {
      console.log('✓ event_bookmarks 表已就绪');
    }
    
    const { error: likesCheckError } = await supabase
      .from('event_likes')
      .select('count')
      .limit(1);
    
    if (likesCheckError && likesCheckError.code === '42P01') {
      console.error('✗ event_likes 表创建失败');
    } else {
      console.log('✓ event_likes 表已就绪');
    }

    console.log('\n========================================');
    console.log('迁移完成！');
    console.log('========================================');

  } catch (error) {
    console.error('执行迁移时出错:', error);
    process.exit(1);
  }
}

applyMigration();
