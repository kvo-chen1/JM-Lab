#!/usr/bin/env node
/**
 * 使用 pg 库直接连接 PostgreSQL 创建表
 */

import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// 使用 PgBouncer 事务模式的连接（端口 6543）
const connectionString = process.env.DATABASE_URL?.replace(':5432/', ':6543/') || 
  'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

console.log('\n========================================');
console.log('使用 pg 库创建模板互动表');
console.log('========================================\n');

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 1, // 限制最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const sql = `
-- 创建模板收藏表
CREATE TABLE IF NOT EXISTS template_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES tianjin_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, template_id)
);

-- 创建模板点赞表
CREATE TABLE IF NOT EXISTS template_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES tianjin_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, template_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_template_favorites_user_id ON template_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_template_favorites_template_id ON template_favorites(template_id);
CREATE INDEX IF NOT EXISTS idx_template_likes_user_id ON template_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_template_likes_template_id ON template_likes(template_id);

-- 启用 RLS (Row Level Security)
ALTER TABLE template_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_likes ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Users can view own favorites" ON template_favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON template_favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON template_favorites;
DROP POLICY IF EXISTS "Users can view own likes" ON template_likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON template_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON template_likes;

-- 创建 RLS 策略 - 用户只能查看自己的收藏
CREATE POLICY "Users can view own favorites" ON template_favorites
    FOR SELECT USING (auth.uid() = user_id);

-- 创建 RLS 策略 - 用户只能插入自己的收藏
CREATE POLICY "Users can insert own favorites" ON template_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建 RLS 策略 - 用户只能删除自己的收藏
CREATE POLICY "Users can delete own favorites" ON template_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- 创建 RLS 策略 - 用户只能查看自己的点赞
CREATE POLICY "Users can view own likes" ON template_likes
    FOR SELECT USING (auth.uid() = user_id);

-- 创建 RLS 策略 - 用户只能插入自己的点赞
CREATE POLICY "Users can insert own likes" ON template_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建 RLS 策略 - 用户只能删除自己的点赞
CREATE POLICY "Users can delete own likes" ON template_likes
    FOR DELETE USING (auth.uid() = user_id);
`;

async function createTables() {
  const client = await pool.connect();
  
  try {
    console.log('正在执行 SQL...\n');
    await client.query(sql);
    console.log('✅ SQL 执行成功！\n');
    
    // 验证表是否创建成功
    console.log('验证表是否创建成功...\n');
    
    const tables = ['template_favorites', 'template_likes'];
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`✅ ${table}: 表已创建`);
        
        // 获取表中的记录数
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`   当前记录数: ${countResult.rows[0].count}`);
      } else {
        console.log(`❌ ${table}: 表未创建`);
      }
    }
    
    console.log('\n========================================');
    console.log('🎉 所有表创建成功！');
    console.log('========================================');
    
  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    console.error('\n详细错误:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createTables();
