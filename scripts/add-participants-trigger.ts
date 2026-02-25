/**
 * 创建触发器自动更新 brand_tasks.current_participants
 */
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('错误: 缺少 DATABASE_URL 环境变量');
  process.exit(1);
}

async function addTrigger() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('连接到 PostgreSQL...\n');
    await client.connect();

    console.log('1. 创建触发器函数...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_task_participants_count()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          UPDATE public.brand_tasks
          SET current_participants = current_participants + 1
          WHERE id = NEW.task_id;
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          UPDATE public.brand_tasks
          SET current_participants = current_participants - 1
          WHERE id = OLD.task_id;
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('   ✓ 触发器函数已创建');

    console.log('\n2. 删除旧触发器（如果存在）...');
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_task_participants ON public.brand_task_participants;
    `);
    console.log('   ✓ 旧触发器已删除');

    console.log('\n3. 创建新触发器...');
    await client.query(`
      CREATE TRIGGER trigger_update_task_participants
      AFTER INSERT OR DELETE ON public.brand_task_participants
      FOR EACH ROW
      EXECUTE FUNCTION update_task_participants_count();
    `);
    console.log('   ✓ 触发器已创建');

    console.log('\n4. 同步现有数据...');
    await client.query(`
      UPDATE public.brand_tasks bt
      SET current_participants = (
        SELECT COUNT(*)
        FROM public.brand_task_participants btp
        WHERE btp.task_id = bt.id
      );
    `);
    console.log('   ✓ 数据已同步');

    console.log('\n✓ 触发器创建完成！');
    console.log('现在申请参与任务后，品牌方页面会正确显示参与人数。');

  } catch (error: any) {
    console.error('\n✗ 创建失败:', error.message);
  } finally {
    await client.end();
  }
}

addTrigger();
