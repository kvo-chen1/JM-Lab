const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres.kizgwtrrsmkjeiddotup:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=no-verify&pgbouncer=true',
  ssl: { rejectUnauthorized: false },
  max: 1
});

async function checkData() {
  // 检查商家 ID
  const merchantRes = await pool.query('SELECT id, store_name FROM merchants LIMIT 5');
  console.log('商家列表:');
  console.log(merchantRes.rows);

  if (merchantRes.rows.length > 0) {
    const merchantId = merchantRes.rows[0].id;
    console.log('\n检查商家 ' + merchantId + ' 的订单:');

    // 检查订单表结构
    const ordersRes = await pool.query('SELECT COUNT(*) as total FROM orders');
    console.log('订单总数:', ordersRes.rows[0].total);

    // 检查订单表中的 seller_id
    const sellerRes = await pool.query('SELECT DISTINCT seller_id FROM orders LIMIT 5');
    console.log('\n订单表中的 seller_id 列表:');
    console.log(sellerRes.rows);

    // 检查该商家的订单
    const merchantOrders = await pool.query('SELECT COUNT(*) as count FROM orders WHERE seller_id = $1', [merchantId]);
    console.log('\n该商家的订单数:', merchantOrders.rows[0].count);

    // 检查今日订单
    const todayOrders = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as sales 
      FROM orders 
      WHERE seller_id = $1 AND DATE(created_at) = CURRENT_DATE
    `, [merchantId]);
    console.log('\n今日订单数:', todayOrders.rows[0].count, '今日销售额:', todayOrders.rows[0].sales);
    
    // 检查所有订单的 seller_id 分布
    const allSellers = await pool.query(`
      SELECT seller_id, COUNT(*) as count 
      FROM orders 
      GROUP BY seller_id 
      ORDER BY count DESC 
      LIMIT 10
    `);
    console.log('\n订单 seller_id 分布:');
    console.log(allSellers.rows);
  }

  pool.end();
}

checkData().catch(err => {
  console.error('Error:', err.message);
  pool.end();
});
