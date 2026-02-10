#!/usr/bin/env node
/**
 * 检查并创建模板相关表
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
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// 使用 PgBouncer 事务模式
const connectionString = process.env.DATABASE_URL?.replace(':5432/', ':6543/') || 
  'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

console.log('\n========================================');
console.log('检查并创建模板相关表');
console.log('========================================\n');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function checkAndCreateTables() {
  const client = await pool.connect();
  
  try {
    // 1. 检查现有表
    console.log('1. 检查现有表...\n');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('现有表:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    const existingTables = tablesResult.rows.map(r => r.table_name);
    
    // 2. 检查 tianjin_templates 表
    const hasTianjinTemplates = existingTables.includes('tianjin_templates');
    console.log(`\n  tianjin_templates 表: ${hasTianjinTemplates ? '✅ 存在' : '❌ 不存在'}`);
    
    // 3. 检查 template_likes 表
    const hasTemplateLikes = existingTables.includes('template_likes');
    console.log(`  template_likes 表: ${hasTemplateLikes ? '✅ 存在' : '❌ 不存在'}`);
    
    // 4. 检查 template_favorites 表
    const hasTemplateFavorites = existingTables.includes('template_favorites');
    console.log(`  template_favorites 表: ${hasTemplateFavorites ? '✅ 存在' : '❌ 不存在'}`);
    
    // 5. 创建缺失的表
    console.log('\n\n2. 创建缺失的表...\n');
    
    // 创建 tianjin_templates 表（如果不存在）
    if (!hasTianjinTemplates) {
      console.log('创建 tianjin_templates 表...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS tianjin_templates (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          thumbnail VARCHAR(500),
          category VARCHAR(100),
          tags TEXT[],
          usage_count INTEGER DEFAULT 0,
          likes_count INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('  ✅ tianjin_templates 表创建成功');
    }
    
    // 创建 template_likes 表（如果不存在）
    if (!hasTemplateLikes) {
      console.log('创建 template_likes 表...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS template_likes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          template_id INTEGER NOT NULL REFERENCES tianjin_templates(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, template_id)
        );
      `);
      
      // 创建索引
      await client.query(`CREATE INDEX IF NOT EXISTS idx_template_likes_user_id ON template_likes(user_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_template_likes_template_id ON template_likes(template_id);`);
      
      // 启用 RLS
      await client.query(`ALTER TABLE template_likes ENABLE ROW LEVEL SECURITY;`);
      
      // 创建 RLS 策略
      await client.query(`
        CREATE POLICY "Users can view own likes" ON template_likes
          FOR SELECT USING (auth.uid() = user_id);
      `);
      await client.query(`
        CREATE POLICY "Users can insert own likes" ON template_likes
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      `);
      await client.query(`
        CREATE POLICY "Users can delete own likes" ON template_likes
          FOR DELETE USING (auth.uid() = user_id);
      `);
      
      console.log('  ✅ template_likes 表创建成功');
    }
    
    // 创建 template_favorites 表（如果不存在）
    if (!hasTemplateFavorites) {
      console.log('创建 template_favorites 表...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS template_favorites (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          template_id INTEGER NOT NULL REFERENCES tianjin_templates(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, template_id)
        );
      `);
      
      // 创建索引
      await client.query(`CREATE INDEX IF NOT EXISTS idx_template_favorites_user_id ON template_favorites(user_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_template_favorites_template_id ON template_favorites(template_id);`);
      
      // 启用 RLS
      await client.query(`ALTER TABLE template_favorites ENABLE ROW LEVEL SECURITY;`);
      
      // 创建 RLS 策略
      await client.query(`
        CREATE POLICY "Users can view own favorites" ON template_favorites
          FOR SELECT USING (auth.uid() = user_id);
      `);
      await client.query(`
        CREATE POLICY "Users can insert own favorites" ON template_favorites
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      `);
      await client.query(`
        CREATE POLICY "Users can delete own favorites" ON template_favorites
          FOR DELETE USING (auth.uid() = user_id);
      `);
      
      console.log('  ✅ template_favorites 表创建成功');
    }
    
    // 6. 验证所有表
    console.log('\n\n3. 验证所有表...\n');
    const verifyResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('tianjin_templates', 'template_likes', 'template_favorites')
      ORDER BY table_name;
    `);
    
    verifyResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}: 已创建`);
    });
    
    console.log('\n========================================');
    console.log('🎉 所有表创建成功！');
    console.log('========================================');
    
  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAndCreateTables();
