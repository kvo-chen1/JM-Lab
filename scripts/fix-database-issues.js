import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
} else {
  dotenv.config();
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('Missing DATABASE_URL in environment variables');
  process.exit(1);
}

async function fixDatabase() {
  // Remove sslmode from connection string
  let connectionString = dbUrl;
  try {
    const urlObj = new URL(dbUrl);
    urlObj.searchParams.delete('sslmode');
    connectionString = urlObj.toString();
  } catch (e) {
    // ignore
  }

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('✅ 数据库连接成功\n');

    // 1. 修复 favorites 表结构
    console.log('🔧 修复 favorites 表结构...');
    console.log('=' .repeat(80));
    
    // 检查当前 favorites 表结构
    const checkFavorites = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'favorites' AND table_schema = 'public'
    `);
    
    console.log('当前 favorites 表结构:');
    for (const col of checkFavorites.rows) {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    }

    // 如果存在 tutorial_id 而不是 post_id，需要修复
    const hasTutorialId = checkFavorites.rows.some(c => c.column_name === 'tutorial_id');
    const hasPostId = checkFavorites.rows.some(c => c.column_name === 'post_id');
    
    if (hasTutorialId && !hasPostId) {
      console.log('\n⚠️  发现 favorites 表使用 tutorial_id 而不是 post_id');
      console.log('🔧 正在修复...');
      
      // 重命名列
      await client.query(`
        ALTER TABLE favorites 
        RENAME COLUMN tutorial_id TO post_id
      `);
      console.log('✅ 已将 tutorial_id 重命名为 post_id');
      
      // 删除旧的默认值和序列
      await client.query(`
        ALTER TABLE favorites 
        ALTER COLUMN id DROP DEFAULT
      `);
      
      // 删除关联的序列
      try {
        await client.query(`DROP SEQUENCE IF EXISTS favorites_id_seq CASCADE`);
        console.log('✅ 已删除旧序列');
      } catch (e) {
        // 忽略错误
      }
      
      // 修改 id 列类型为 UUID
      await client.query(`
        ALTER TABLE favorites 
        ALTER COLUMN id TYPE UUID 
        USING gen_random_uuid()
      `);
      
      // 设置新的默认值
      await client.query(`
        ALTER TABLE favorites 
        ALTER COLUMN id SET DEFAULT gen_random_uuid()
      `);
      console.log('✅ 已将 id 列类型改为 UUID');
      
      // 修改 created_at 类型为 timestamp with time zone
      await client.query(`
        ALTER TABLE favorites 
        ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE 
        USING to_timestamp(created_at / 1000.0)
      `);
      
      // 设置默认值
      await client.query(`
        ALTER TABLE favorites 
        ALTER COLUMN created_at SET DEFAULT NOW()
      `);
      console.log('✅ 已将 created_at 类型改为 TIMESTAMP WITH TIME ZONE');
      
      // 修改 post_id 类型为 UUID（如果 posts 表使用 UUID）
      const checkPosts = await client.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'id'
      `);
      
      if (checkPosts.rows.length > 0 && checkPosts.rows[0].data_type === 'uuid') {
        await client.query(`
          ALTER TABLE favorites 
          ALTER COLUMN post_id DROP NOT NULL
        `);
        
        await client.query(`
          ALTER TABLE favorites 
          ALTER COLUMN post_id TYPE UUID 
          USING NULL
        `);
        console.log('✅ 已将 post_id 类型改为 UUID');
      }
      
      // 添加外键约束
      try {
        await client.query(`
          ALTER TABLE favorites 
          ADD CONSTRAINT fk_favorites_post 
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        `);
        console.log('✅ 已添加外键约束 (post_id -> posts.id)');
      } catch (e) {
        console.log(`⚠️  添加外键约束失败: ${e.message}`);
      }
      
      console.log('\n✅ favorites 表修复完成！');
    } else {
      console.log('\n✅ favorites 表结构正常');
    }

    // 2. 清理旧表
    console.log('\n\n🧹 检查并清理旧表...');
    console.log('=' .repeat(80));
    
    const oldTables = ['messages_old', 'app_posts', 'app_community_members', 'app_replies'];
    
    for (const tableName of oldTables) {
      const checkTable = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1 AND table_schema = 'public'
        )
      `, [tableName]);
      
      if (checkTable.rows[0].exists) {
        // 检查表是否有数据
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const count = parseInt(countResult.rows[0].count);
        
        if (count === 0) {
          console.log(`\n🗑️  删除空表: ${tableName}`);
          await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
          console.log(`✅ 已删除: ${tableName}`);
        } else {
          console.log(`\n⚠️  表 ${tableName} 有 ${count} 行数据，保留未删除`);
        }
      } else {
        console.log(`✅ 表 ${tableName} 不存在`);
      }
    }

    // 3. 验证修复结果
    console.log('\n\n✅ 验证修复结果...');
    console.log('=' .repeat(80));
    
    // 检查 favorites 表
    const verifyFavorites = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'favorites' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\n修复后的 favorites 表结构:');
    for (const col of verifyFavorites.rows) {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.column_default ? '(有默认值)' : ''}`);
    }
    
    // 检查外键约束
    const verifyFK = await client.query(`
      SELECT 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'favorites'
    `);
    
    if (verifyFK.rows.length > 0) {
      console.log('\n✅ favorites 表外键约束:');
      for (const fk of verifyFK.rows) {
        console.log(`  - ${fk.column_name} -> ${fk.foreign_table_name}(${fk.foreign_column_name})`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ 数据库修复完成！');

  } catch (err) {
    console.error('❌ 数据库修复失败:', err.message);
    console.error(err);
  } finally {
    await client.end();
  }
}

fixDatabase().catch(err => {
  console.error('Unhandled error:', err);
});
