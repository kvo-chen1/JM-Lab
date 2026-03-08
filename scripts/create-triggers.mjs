/**
 * 创建 IP 孵化中心表的触发器
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 
  process.env.NEON_DATABASE_URL || 
  process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error('错误: 未找到数据库连接字符串');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const triggers = [
  {
    table: 'ip_assets',
    function: `
      CREATE OR REPLACE FUNCTION update_ip_assets_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `,
    trigger: `
      DROP TRIGGER IF EXISTS trigger_ip_assets_updated_at ON ip_assets;
      CREATE TRIGGER trigger_ip_assets_updated_at
        BEFORE UPDATE ON ip_assets
        FOR EACH ROW
        EXECUTE FUNCTION update_ip_assets_updated_at();
    `
  },
  {
    table: 'ip_stages',
    function: `
      CREATE OR REPLACE FUNCTION update_ip_stages_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `,
    trigger: `
      DROP TRIGGER IF EXISTS trigger_ip_stages_updated_at ON ip_stages;
      CREATE TRIGGER trigger_ip_stages_updated_at
        BEFORE UPDATE ON ip_stages
        FOR EACH ROW
        EXECUTE FUNCTION update_ip_stages_updated_at();
    `
  },
  {
    table: 'ip_partnerships',
    function: `
      CREATE OR REPLACE FUNCTION update_ip_partnerships_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `,
    trigger: `
      DROP TRIGGER IF EXISTS trigger_ip_partnerships_updated_at ON ip_partnerships;
      CREATE TRIGGER trigger_ip_partnerships_updated_at
        BEFORE UPDATE ON ip_partnerships
        FOR EACH ROW
        EXECUTE FUNCTION update_ip_partnerships_updated_at();
    `
  },
  {
    table: 'commercial_opportunities',
    function: `
      CREATE OR REPLACE FUNCTION update_commercial_opportunities_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `,
    trigger: `
      DROP TRIGGER IF EXISTS trigger_commercial_opportunities_updated_at ON commercial_opportunities;
      CREATE TRIGGER trigger_commercial_opportunities_updated_at
        BEFORE UPDATE ON commercial_opportunities
        FOR EACH ROW
        EXECUTE FUNCTION update_commercial_opportunities_updated_at();
    `
  },
  {
    table: 'copyright_assets',
    function: `
      CREATE OR REPLACE FUNCTION update_copyright_assets_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `,
    trigger: `
      DROP TRIGGER IF EXISTS trigger_copyright_assets_updated_at ON copyright_assets;
      CREATE TRIGGER trigger_copyright_assets_updated_at
        BEFORE UPDATE ON copyright_assets
        FOR EACH ROW
        EXECUTE FUNCTION update_copyright_assets_updated_at();
    `
  }
];

async function createTriggers() {
  const client = await pool.connect();
  
  try {
    console.log('创建触发器...\n');
    
    for (const { table, function: funcSQL, trigger } of triggers) {
      try {
        // 创建函数
        await client.query(funcSQL);
        // 创建触发器
        await client.query(trigger);
        console.log(`✓ ${table}: 触发器创建成功`);
      } catch (error) {
        console.error(`✗ ${table}: ${error.message}`);
      }
    }
    
    console.log('\n完成!');
  } finally {
    client.release();
    await pool.end();
  }
}

createTriggers().catch(err => {
  console.error('失败:', err);
  process.exit(1);
});
