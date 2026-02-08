// 检查数据库中的视频数据
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkVideoData() {
  const client = await pool.connect();
  
  try {
    console.log('检查数据库中的视频数据...\n');
    
    // 1. 获取所有视频类型的作品
    const { rows } = await client.query(`
      SELECT id, title, type, video_url, thumbnail, creator_id, created_at
      FROM works
      WHERE type = 'video'
      ORDER BY created_at DESC
    `);
    
    console.log(`找到 ${rows.length} 个视频作品:\n`);
    
    rows.forEach((work, index) => {
      console.log(`${index + 1}. ${work.title}`);
      console.log(`   ID: ${work.id}`);
      console.log(`   Type: ${work.type}`);
      console.log(`   Video URL: ${work.video_url || 'NULL'}`);
      console.log(`   Thumbnail: ${work.thumbnail || 'NULL'}`);
      console.log(`   Creator ID: ${work.creator_id}`);
      console.log('');
    });
    
    // 2. 检查 video_url 为空的视频作品
    const { rows: emptyVideoUrl } = await client.query(`
      SELECT id, title, type, video_url, thumbnail
      FROM works
      WHERE type = 'video' AND (video_url IS NULL OR video_url = '')
    `);
    
    console.log(`\n⚠️  Video URL 为空的视频作品: ${emptyVideoUrl.length} 个`);
    emptyVideoUrl.forEach(work => {
      console.log(`   - ${work.title} (${work.id})`);
    });
    
  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkVideoData();
