/**
 * 检查参与者的状态值
 */
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('错误: 缺少 DATABASE_URL 环境变量');
  process.exit(1);
}

async function checkParticipantStatus() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('连接到 PostgreSQL...\n');
    await client.connect();

    console.log('查询 brand_task_participants 表...');
    const result = await client.query(`
      SELECT id, task_id, creator_id, status, applied_at 
      FROM public.brand_task_participants 
      LIMIT 10;
    `);

    if (result.rows.length === 0) {
      console.log('表中没有任何数据');
    } else {
      console.log(`找到 ${result.rows.length} 条记录:`);
      result.rows.forEach((row, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log('  ID:', row.id);
        console.log('  Task ID:', row.task_id);
        console.log('  Creator ID:', row.creator_id);
        console.log('  Status:', row.status); // 这里显示实际的状态值
        console.log('  Applied At:', row.applied_at);
      });
    }

  } catch (error: any) {
    console.error('查询失败:', error.message);
  } finally {
    await client.end();
  }
}

checkParticipantStatus();
