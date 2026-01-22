import pg from 'pg';
import dotenv from 'dotenv';

// 加载环境变量，优先加载.env.local
dotenv.config({ path: '.env.local' });
dotenv.config();

const { Client } = pg;

async function checkMigrations() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    ssl: false
  });

  try {
    console.log('连接到Supabase数据库...');
    await client.connect();
    console.log('连接成功！\n');

    // 检查迁移表是否存在
    const tableExistsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'supabase_migrations' 
        AND    table_name   = 'schema_migrations'
      );
    `);

    const tableExists = tableExistsResult.rows[0].exists;
    
    if (tableExists) {
      console.log('迁移表存在，当前已应用的迁移：');
      const migrationsResult = await client.query(`
        SELECT * FROM supabase_migrations.schema_migrations 
        ORDER BY id DESC;
      `);
      
      if (migrationsResult.rows.length > 0) {
        console.log('已应用的迁移列表：');
        migrationsResult.rows.forEach(migration => {
          console.log(`- ${migration.id} (${migration.applied_at})`);
        });
      } else {
        console.log('还没有应用任何迁移。');
      }
    } else {
      console.log('迁移表不存在，可能需要初始化迁移系统。');
    }

    // 检查我们的新迁移文件对应的功能是否已经存在
    console.log('\n检查新实现的功能：');
    
    // 1. 检查分区表
    console.log('\n1. 检查登录日志分区表：');
    const partitionsResult = await client.query(`
      SELECT inhrelid::regclass::text as partition_name
      FROM pg_inherits 
      WHERE inhparent = 'login_logs_partitioned'::regclass;
    `);
    
    if (partitionsResult.rows.length > 0) {
      console.log('已创建的分区：');
      partitionsResult.rows.forEach(partition => {
        console.log(`- ${partition.partition_name}`);
      });
    } else {
      console.log('还没有创建任何分区表。');
    }

    // 2. 检查用户兴趣标签表
    console.log('\n2. 检查用户兴趣标签表：');
    const userInterestTagsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public' 
        AND    table_name   = 'user_interest_tags'
      );
    `);
    console.log(userInterestTagsResult.rows[0].exists ? '✓ 用户兴趣标签表已存在' : '✗ 用户兴趣标签表不存在');

    // 3. 检查数据质量检查相关表
    console.log('\n3. 检查数据质量检查相关表：');
    const dataQualityResult = await client.query(`
      SELECT 
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'data_quality_rules') as rules_exists,
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'data_quality_results') as results_exists
    `);
    console.log(dataQualityResult.rows[0].rules_exists ? '✓ 数据质量规则表已存在' : '✗ 数据质量规则表不存在');
    console.log(dataQualityResult.rows[0].results_exists ? '✓ 数据质量结果表已存在' : '✗ 数据质量结果表不存在');

    // 4. 检查备份相关表
    console.log('\n4. 检查备份相关表：');
    const backupResult = await client.query(`
      SELECT 
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'backup_configs') as configs_exists,
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'backup_logs') as logs_exists
    `);
    console.log(backupResult.rows[0].configs_exists ? '✓ 备份配置表已存在' : '✗ 备份配置表不存在');
    console.log(backupResult.rows[0].logs_exists ? '✓ 备份日志表已存在' : '✗ 备份日志表不存在');

    // 5. 检查物化视图
    console.log('\n5. 检查物化视图：');
    const matviewResult = await client.query(`
      SELECT matviewname FROM pg_matviews WHERE matviewname = 'mv_trending_works';
    `);
    console.log(matviewResult.rows.length > 0 ? '✓ 热门作品物化视图已存在' : '✗ 热门作品物化视图不存在');

    console.log('\n迁移状态检查完成！');
  } catch (error) {
    console.error('检查迁移时出错：', error);
  } finally {
    await client.end();
  }
}

checkMigrations();
