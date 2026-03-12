// 修复余额数据
import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: 'db.kizgwtrrsmkjeiddotup.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'csh200506207837',
  ssl: { rejectUnauthorized: false }
});

async function fixBalanceData() {
  console.log('========================================');
  console.log('修复余额数据');
  console.log('========================================\n');

  await client.connect();
  console.log('✅ 数据库连接成功\n');

  const userId = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';

  try {
    // 1. 计算实际充值总额
    console.log('1. 计算实际充值总额...');
    const rechargeResult = await client.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM jinbi_records
      WHERE user_id = $1 AND type = 'purchase'
    `, [userId]);
    const totalRecharge = parseInt(rechargeResult.rows[0].total);
    console.log(`   充值总额: ${totalRecharge}`);

    // 2. 计算实际消费总额
    console.log('\n2. 计算实际消费总额...');
    const spendResult = await client.query(`
      SELECT COALESCE(SUM(ABS(amount)), 0) as total
      FROM jinbi_records
      WHERE user_id = $1 AND type = 'spend'
    `, [userId]);
    const totalSpend = parseInt(spendResult.rows[0].total);
    console.log(`   消费总额: ${totalSpend}`);

    // 3. 计算正确余额
    const correctBalance = totalRecharge - totalSpend;
    console.log(`\n3. 正确余额: ${correctBalance}`);

    // 4. 更新余额表
    console.log('\n4. 更新余额表...');
    const updateResult = await client.query(`
      UPDATE user_jinbi_balance
      SET 
        total_balance = $1,
        available_balance = $1,
        total_earned = $2,
        total_spent = $3,
        last_updated = NOW()
      WHERE user_id = $4
      RETURNING *
    `, [correctBalance, totalRecharge, totalSpend, userId]);

    if (updateResult.rowCount > 0) {
      console.log('✅ 余额表更新成功');
      console.log('   新余额:', updateResult.rows[0].total_balance);
      console.log('   总收入:', updateResult.rows[0].total_earned);
      console.log('   总消费:', updateResult.rows[0].total_spent);
    } else {
      console.log('⚠️ 没有找到该用户的余额记录，尝试插入新记录...');
      const insertResult = await client.query(`
        INSERT INTO user_jinbi_balance (
          user_id, total_balance, available_balance, 
          frozen_balance, total_earned, total_spent, last_updated
        ) VALUES ($1, $2, $2, 0, $3, $4, NOW())
        RETURNING *
      `, [userId, correctBalance, totalRecharge, totalSpend]);
      console.log('✅ 插入新记录成功');
      console.log('   余额:', insertResult.rows[0].total_balance);
    }

    console.log('\n========================================');
    console.log('✅ 修复完成');
    console.log('========================================');

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    await client.end();
  }
}

fixBalanceData();
