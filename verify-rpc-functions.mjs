#!/usr/bin/env node
/**
 * 验证 RPC 函数是否正确创建
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '.env.local'), override: true });

const databaseUrl = process.env.POSTGRES_URL_NON_POOLING || 
                   process.env.DATABASE_URL || 
                   process.env.NEON_DATABASE_URL ||
                   process.env.NEON_URL;

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('✅ 数据库连接成功\n');
    
    // 检查 RPC 函数
    const functionsToCheck = [
      'get_user_ip_stats',
      'create_ip_asset_with_stages',
      'update_stage_completion',
      'get_active_promoted_works',
      'get_alert_stats'
    ];
    
    console.log('📋 检查 RPC 函数:\n');
    
    for (const funcName of functionsToCheck) {
      const result = await client.query(`
        SELECT 
          p.proname as function_name,
          pg_get_function_identity_arguments(p.oid) as arguments,
          pg_get_function_result(p.oid) as return_type
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.proname = $1
      `, [funcName]);
      
      if (result.rows.length > 0) {
        const func = result.rows[0];
        console.log(`✅ ${func.function_name}`);
        console.log(`   参数: ${func.arguments || '无'}`);
        console.log(`   返回: ${func.return_type}\n`);
      } else {
        console.log(`❌ ${funcName} - 未找到\n`);
      }
    }
    
    // 检查表
    const tablesToCheck = [
      'ip_assets',
      'ip_stages',
      'ip_partnerships'
    ];
    
    console.log('📋 检查表:\n');
    
    for (const tableName of tablesToCheck) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        ) as exists
      `, [tableName]);
      
      if (result.rows[0].exists) {
        // 获取列信息
        const columns = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        console.log(`✅ ${tableName}`);
        console.log(`   列: ${columns.rows.map(c => c.column_name).join(', ')}\n`);
      } else {
        console.log(`❌ ${tableName} - 未找到\n`);
      }
    }
    
    // 测试 get_user_ip_stats 函数
    console.log('🧪 测试 get_user_ip_stats 函数:\n');
    try {
      const testResult = await client.query(`
        SELECT * FROM get_user_ip_stats($1)
      `, ['00000000-0000-0000-0000-000000000000']);
      
      console.log('✅ 函数调用成功');
      console.log('   返回结果:', testResult.rows[0]);
    } catch (error) {
      console.log('❌ 函数调用失败:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  } finally {
    await client.end();
  }
}

main();
