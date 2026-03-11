import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  const client = await pool.connect();
  
  console.log('📊 测试控制台统计数据 API 逻辑:\n');
  
  try {
    // 获取总用户数
    const { rows: userCountRows } = await client.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(userCountRows[0]?.count || '0');
    console.log('✅ 总用户数:', totalUsers);
    
    // 获取作品总数
    const { rows: worksCountRows } = await client.query("SELECT COUNT(*) as count FROM works WHERE source = '津脉广场' OR source IS NULL");
    const totalWorks = parseInt(worksCountRows[0]?.count || '0');
    console.log('✅ 作品总数:', totalWorks);
    
    // 获取待审核数量
    const { rows: pendingRows } = await client.query("SELECT COUNT(*) as count FROM works WHERE status = 'pending' AND (source = '津脉广场' OR source IS NULL)");
    const pendingAudit = parseInt(pendingRows[0]?.count || '0');
    console.log('✅ 待审核数量:', pendingAudit);
    
    // 获取已采纳的活动数量
    const { rows: adoptedRows } = await client.query("SELECT COUNT(*) as count FROM events WHERE status = 'published'");
    const adopted = parseInt(adoptedRows[0]?.count || '0');
    console.log('✅ 已采纳活动:', adopted);
    
    // 计算趋势
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString();
    
    const { rows: lastMonthUserRows } = await client.query(
      'SELECT COUNT(*) as count FROM users WHERE created_at < $1',
      [lastMonthStr]
    );
    const lastMonthUsers = parseInt(lastMonthUserRows[0]?.count || '0');
    
    const userTrend = lastMonthUsers > 0
      ? Math.round(((totalUsers || 0) - lastMonthUsers) / lastMonthUsers * 100)
      : 0;
    console.log('✅ 用户增长趋势:', userTrend + '%');
    
    console.log('\n📈 API 应该返回的数据:');
    console.log(JSON.stringify({
      code: 0,
      message: '获取统计数据成功',
      data: {
        totalUsers,
        totalWorks,
        pendingAudit,
        adopted,
        userTrend,
        worksTrend: 0,
        pendingTrend: 0,
        adoptedTrend: 0
      }
    }, null, 2));
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

test();
