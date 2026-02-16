// 检查API返回的数据格式
import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';
import fs from 'fs';

const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const dbUrl = process.env.DATABASE_URL;

async function checkApiResponse() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // 模拟API查询
    const result = await client.query(`
      SELECT 
        id,
        title,
        description,
        start_date,
        end_date,
        location,
        organizer_id,
        requirements,
        rewards,
        visibility,
        status,
        registration_deadline,
        review_start_date,
        result_date,
        max_participants,
        created_at,
        updated_at,
        published_at,
        image_url,
        category,
        tags,
        platform_event_id,
        content,
        media,
        thumbnail_url,
        start_time,
        end_time,
        type,
        is_public,
        contact_name,
        contact_phone,
        contact_email,
        push_to_community,
        apply_for_recommendation,
        participants,
        current_participants,
        phase_status
      FROM events
      WHERE status = 'published'
      ORDER BY created_at DESC
    `);

    console.log('=== API返回的数据 ===\n');

    for (const row of result.rows) {
      console.log(`活动: ${row.title}`);
      console.log(`  start_date 类型: ${typeof row.start_date}, 值: ${row.start_date}`);
      console.log(`  end_date 类型: ${typeof row.end_date}, 值: ${row.end_date}`);
      console.log(`  start_time 类型: ${typeof row.start_time}, 值: ${row.start_time}`);
      console.log(`  end_time 类型: ${typeof row.end_time}, 值: ${row.end_time}`);

      // 检查start_date的值
      const startDateVal = row.start_date;
      console.log(`\n  start_date 分析:`);
      console.log(`    原始值: ${startDateVal}`);
      console.log(`    字符串长度: ${String(startDateVal).length}`);
      console.log(`    作为数字: ${Number(startDateVal)}`);
      console.log(`    作为Date: ${new Date(Number(startDateVal)).toISOString()}`);

      // 检查是否是字符串类型
      if (typeof startDateVal === 'string') {
        console.log(`    ⚠️ 注意: start_date 是字符串类型!`);
      }

      console.log('\n---\n');
    }

  } catch (err) {
    console.error('查询失败:', err.message);
  } finally {
    await client.end();
  }
}

checkApiResponse();
