import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb',
  ssl: { rejectUnauthorized: false }
});

async function createTable() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Neon database\n');

    // 创建 hot_themes 表
    await client.query(`
      CREATE TABLE IF NOT EXISTS hot_themes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        image_url TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created hot_themes table');

    // 插入一些示例数据
    await client.query(`
      INSERT INTO hot_themes (name, description, category, sort_order) VALUES
      ('天津文化', '探索天津独特的文化底蕴与历史传承', 'culture', 1),
      ('海河风光', '海河两岸的美丽风景与城市景观', 'scenery', 2),
      ('传统美食', '狗不理、耳朵眼炸糕等天津特色美食', 'food', 3),
      ('老字号品牌', '桂发祥、老美华等百年老字号', 'brand', 4),
      ('非遗技艺', '天津非物质文化遗产与传统工艺', 'heritage', 5)
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Inserted sample data into hot_themes');

    // 验证数据
    const res = await client.query('SELECT * FROM hot_themes ORDER BY sort_order;');
    console.log('\n📊 hot_themes data:');
    res.rows.forEach(row => {
      console.log(`   - ${row.name} (${row.category})`);
    });

    client.release();
    await pool.end();
    console.log('\n🎉 Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

createTable();
