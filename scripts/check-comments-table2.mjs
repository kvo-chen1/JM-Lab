#!/usr/bin/env node
/**
 * 检查 comments 表结构 - 直接查询
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('========================================');
console.log('🔍 检查 comments 表');
console.log('========================================\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTable() {
  try {
    // 查询表是否存在
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'comments' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (tablesError) {
      console.log('⚠️ 无法使用 RPC，直接查询数据...');
    } else {
      console.log('📋 comments 表结构:');
      console.log(tables);
    }

    // 直接查询数据查看字段
    console.log('\n📄 查询 comments 表数据:');
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .limit(2);

    if (error) {
      console.error('❌ 查询失败:', error.message);
    } else {
      console.log('   数据条数:', comments?.length || 0);
      if (comments && comments.length > 0) {
        comments.forEach((c, i) => {
          console.log(`\n   记录 ${i + 1}:`);
          console.log('   ', JSON.stringify(c, null, 2));
        });
      }
    }

    // 检查 posts 表
    console.log('\n📄 查询 posts 表数据:');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(1);

    if (postsError) {
      console.error('❌ 查询失败:', postsError.message);
    } else {
      console.log('   数据条数:', posts?.length || 0);
      if (posts && posts.length > 0) {
        console.log('   ', JSON.stringify(posts[0], null, 2));
      }
    }

    // 检查 works 表
    console.log('\n📄 查询 works 表数据:');
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('*')
      .limit(1);

    if (worksError) {
      console.error('❌ 查询失败:', worksError.message);
    } else {
      console.log('   数据条数:', works?.length || 0);
      if (works && works.length > 0) {
        console.log('   ', JSON.stringify(works[0], null, 2));
      }
    }

  } catch (err) {
    console.error('❌ 检查失败:', err.message);
  }
}

checkTable();
