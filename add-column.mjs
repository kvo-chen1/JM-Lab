import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env.local') });

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!connectionString) {
  console.error('错误: 找不到 DATABASE_URL 或 NEON_DATABASE_URL 环境变量');
  process.exit(1);
}

console.log('正在连接到数据库...');

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addColumn() {
  try {
    const client = await pool.connect();
    console.log('数据库连接成功！');

    // 检查列是否已存在
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'works' AND column_name = 'hidden_in_square'
    `);

    if (checkResult.rows.length > 0) {
      console.log('列 hidden_in_square 已存在，无需添加');
    } else {
      // 添加列
      await client.query(`
        ALTER TABLE works
        ADD COLUMN hidden_in_square BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ 成功添加 hidden_in_square 列到 works 表');
    }

    // 验证列是否存在
    const verifyResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'works' AND column_name = 'hidden_in_square'
    `);

    if (verifyResult.rows.length > 0) {
      console.log('\n列信息:');
      console.log(verifyResult.rows[0]);
    }

    client.release();
    console.log('\n完成！');
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addColumn();
