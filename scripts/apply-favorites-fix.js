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

async function applyFix() {
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

    console.log('🔧 重建 favorites 表...');
    console.log('=' .repeat(80));

    // 检查当前 favorites 表是否有数据
    const countResult = await client.query('SELECT COUNT(*) as count FROM favorites');
    const count = parseInt(countResult.rows[0].count);
    console.log(`当前 favorites 表有 ${count} 行数据`);

    if (count > 0) {
      console.log('⚠️  警告: favorites 表有数据，重建将丢失数据！');
      console.log('如果需要保留数据，请手动迁移。');
    }

    // 检查 posts 表的 id 类型
    const postsTypeResult = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'id'
    `);
    const postsIdType = postsTypeResult.rows[0]?.data_type || 'integer';
    console.log(`\n📋 posts.id 类型: ${postsIdType}`);

    // 删除旧的外键约束
    console.log('\n🗑️  删除旧的外键约束...');
    try {
      await client.query(`
        ALTER TABLE favorites 
        DROP CONSTRAINT IF EXISTS favorites_user_id_fkey,
        DROP CONSTRAINT IF EXISTS favorites_post_id_fkey,
        DROP CONSTRAINT IF EXISTS fk_favorites_post,
        DROP CONSTRAINT IF EXISTS favorites_user_id_tutorial_id_key
      `);
      console.log('✅ 已删除旧的外键约束');
    } catch (e) {
      console.log('ℹ️  没有需要删除的外键约束');
    }

    // 删除旧的索引
    console.log('\n🗑️  删除旧的索引...');
    try {
      await client.query(`
        DROP INDEX IF EXISTS idx_favorites_user_id;
        DROP INDEX IF EXISTS idx_favorites_post_id;
        DROP INDEX IF EXISTS favorites_user_id_tutorial_id_key
      `);
      console.log('✅ 已删除旧的索引');
    } catch (e) {
      console.log('ℹ️  没有需要删除的索引');
    }

    // 删除旧的序列
    console.log('\n🗑️  删除旧的序列...');
    try {
      await client.query(`DROP SEQUENCE IF EXISTS favorites_id_seq CASCADE`);
      console.log('✅ 已删除旧的序列');
    } catch (e) {
      console.log('ℹ️  没有需要删除的序列');
    }

    // 根据 posts.id 类型创建新表
    console.log('\n🏗️  创建新的 favorites 表...');
    
    if (postsIdType === 'uuid') {
      await client.query(`
        CREATE TABLE favorites_new (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, post_id)
        )
      `);
    } else {
      // posts.id 是 integer
      await client.query(`
        CREATE TABLE favorites_new (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, post_id)
        )
      `);
    }
    console.log('✅ 已创建新表 favorites_new');

    // 删除旧表
    console.log('\n🗑️  删除旧表...');
    await client.query(`DROP TABLE favorites CASCADE`);
    console.log('✅ 已删除旧表');

    // 重命名新表
    console.log('\n🏷️  重命名新表...');
    await client.query(`ALTER TABLE favorites_new RENAME TO favorites`);
    console.log('✅ 已重命名为 favorites');

    // 创建索引
    console.log('\n📇 创建索引...');
    await client.query(`CREATE INDEX idx_favorites_user_id ON favorites(user_id)`);
    await client.query(`CREATE INDEX idx_favorites_post_id ON favorites(post_id)`);
    console.log('✅ 已创建索引');

    // 启用 RLS
    console.log('\n🔒 启用 RLS...');
    await client.query(`ALTER TABLE favorites ENABLE ROW LEVEL SECURITY`);
    console.log('✅ 已启用 RLS');

    // 创建 RLS 策略
    console.log('\n🛡️  创建 RLS 策略...');
    await client.query(`
      CREATE POLICY "Users can view their own favorites" 
          ON favorites FOR SELECT 
          USING (auth.uid() = user_id)
    `);
    await client.query(`
      CREATE POLICY "Users can insert their own favorites" 
          ON favorites FOR INSERT 
          WITH CHECK (auth.uid() = user_id)
    `);
    await client.query(`
      CREATE POLICY "Users can delete their own favorites" 
          ON favorites FOR DELETE 
          USING (auth.uid() = user_id)
    `);
    console.log('✅ 已创建 RLS 策略');

    // 验证结果
    console.log('\n\n✅ 验证修复结果...');
    console.log('=' .repeat(80));
    
    const verifyResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'favorites' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\n修复后的 favorites 表结构:');
    for (const col of verifyResult.rows) {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.column_default ? '(有默认值)' : ''}`);
    }

    // 检查外键约束
    const fkResult = await client.query(`
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
    
    if (fkResult.rows.length > 0) {
      console.log('\n✅ favorites 表外键约束:');
      for (const fk of fkResult.rows) {
        console.log(`  - ${fk.column_name} -> ${fk.foreign_table_name}(${fk.foreign_column_name})`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ favorites 表修复完成！');

  } catch (err) {
    console.error('❌ 修复失败:', err.message);
    console.error(err);
  } finally {
    await client.end();
  }
}

applyFix().catch(err => {
  console.error('Unhandled error:', err);
});
