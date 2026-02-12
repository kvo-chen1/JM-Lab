const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function checkEventMedia() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // 查询最近创建的活动
    const result = await client.query(`
      SELECT id, title, image_url, media, thumbnail_url
      FROM events
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('Recent events:');
    result.rows.forEach(event => {
      console.log('\nEvent:', event.title);
      console.log('  ID:', event.id);
      console.log('  image_url:', event.image_url);
      console.log('  media:', event.media);
      console.log('  thumbnail_url:', event.thumbnail_url);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkEventMedia();
