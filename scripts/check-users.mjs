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

async function checkUsers() {
  console.log('========================================');
  console.log('检查用户数据');
  console.log('========================================\n');

  await client.connect();

  try {
    // 检查 users 表
    const usersResult = await client.query('SELECT id, email FROM users LIMIT 5');
    console.log('users 表中的用户:');
    usersResult.rows.forEach(u => {
      console.log(`  - ${u.id}: ${u.email}`);
    });

    // 检查 user_jinbi_balance 表的外键约束
    const fkResult = await client.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'user_jinbi_balance';
    `);

    console.log('\nuser_jinbi_balance 表的外键约束:');
    fkResult.rows.forEach(fk => {
      console.log(`  - ${fk.constraint_name}: ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });

  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    await client.end();
  }
}

checkUsers();
