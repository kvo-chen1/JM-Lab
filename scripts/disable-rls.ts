/**
 * 临时禁用 brand_tasks 表的 RLS
 */
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('错误: 缺少 DATABASE_URL 环境变量');
  process.exit(1);
}

async function disableRLS() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('连接到 PostgreSQL...\n');
    await client.connect();

    console.log('禁用 brand_tasks 表的 RLS...');
    await client.query('ALTER TABLE public.brand_tasks DISABLE ROW LEVEL SECURITY;');
    console.log('✓ RLS 已禁用');
    console.log('现在可以创建任务了，请测试后记得重新启用 RLS');

  } catch (error: any) {
    console.error('✗ 禁用失败:', error.message);
  } finally {
    await client.end();
  }
}

disableRLS();
