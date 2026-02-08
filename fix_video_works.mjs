// 修复视频作品的 type 和 video_url
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixVideoWorks() {
  const client = await pool.connect();
  
  try {
    console.log('修复视频作品数据...\n');
    
    // 1. 查找可能是视频的作品（thumbnail 包含 .mp4 或视频相关关键词）
    const { rows } = await client.query(`
      SELECT id, title, thumbnail, type, video_url
      FROM works
      WHERE thumbnail LIKE '%.mp4%' 
         OR thumbnail LIKE '%video%'
         OR title LIKE '%视频%'
         OR title ~ '^[0-9]+$'
    `);
    
    console.log(`找到 ${rows.length} 个可能是视频的作品:\n`);
    
    rows.forEach((work, index) => {
      console.log(`${index + 1}. ${work.title}`);
      console.log(`   ID: ${work.id}`);
      console.log(`   Current Type: ${work.type}`);
      console.log(`   Thumbnail: ${work.thumbnail}`);
      console.log('');
    });
    
    // 2. 修复这些作品的 type 和 video_url
    let fixedCount = 0;
    for (const work of rows) {
      // 从 thumbnail 中提取视频 URL（如果是本地上传的视频）
      let videoUrl = null;
      
      // 如果 thumbnail 是视频 URL，将其作为 video_url
      if (work.thumbnail && work.thumbnail.includes('.mp4')) {
        videoUrl = work.thumbnail;
      }
      
      // 更新作品的 type 和 video_url
      const result = await client.query(`
        UPDATE works
        SET type = 'video',
            video_url = COALESCE($1, video_url)
        WHERE id = $2
      `, [videoUrl, work.id]);
      
      if (result.rowCount > 0) {
        fixedCount++;
        console.log(`✅ 修复: ${work.title} -> type: video, video_url: ${videoUrl || 'NULL'}`);
      }
    }
    
    console.log(`\n✅ 共修复 ${fixedCount} 个视频作品`);
    
    // 3. 显示修复后的统计
    const { rows: stats } = await client.query(`
      SELECT type, COUNT(*) as count
      FROM works
      GROUP BY type
    `);
    
    console.log('\n修复后的类型统计:');
    stats.forEach(stat => {
      console.log(`  ${stat.type || 'NULL'}: ${stat.count}`);
    });
    
  } catch (error) {
    console.error('修复失败:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixVideoWorks();
