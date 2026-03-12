import pg from 'pg';
import fs from 'fs';
import readline from 'readline';

const { Client } = pg;

const client = new Client({
  host: 'db.kizgwtrrsmkjeiddotup.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'csh200506207837',
  ssl: { rejectUnauthorized: false }
});

// 修复表结构
async function fixTableStructure() {
  console.log('修复表结构...');

  const alterStatements = [
    `ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS "position" jsonb;`,
    `ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;`,
    `ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS history jsonb DEFAULT '[]'::jsonb;`
  ];

  for (const sql of alterStatements) {
    try {
      await client.query(sql);
      console.log('✅ 执行成功:', sql.substring(0, 60) + '...');
    } catch (err) {
      console.log('❌ 执行失败:', err.message);
    }
  }
}

// 从 SQL 文件中提取 inspiration_nodes 数据
async function extractNodesData(sqlFile) {
  const fileStream = fs.createReadStream(sqlFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let inCopyBlock = false;
  const nodes = [];

  for await (const line of rl) {
    if (line.includes('COPY public.inspiration_nodes')) {
      inCopyBlock = true;
      continue;
    }

    if (line === '\\.' && inCopyBlock) {
      inCopyBlock = false;
      continue;
    }

    if (inCopyBlock && line.includes('\t')) {
      nodes.push(line);
    }
  }

  return nodes;
}

// 导入节点数据
async function importNodes(dataLines) {
  console.log(`\n准备导入 ${dataLines.length} 个节点...`);

  let imported = 0;
  let errors = 0;

  for (const line of dataLines) {
    const values = line.split('\t');

    // 解析数据
    const node = {
      id: values[0] || null,
      map_id: values[1] || null,
      parent_id: values[2] === '\\N' ? null : values[2],
      title: values[3] || '新节点',
      description: values[4] === '\\N' ? null : values[4],
      category: values[5] || 'inspiration',
      content: values[6] === '\\N' ? null : values[6],
      ai_prompt: values[7] === '\\N' ? null : values[7],
      ai_generated_content: values[8] === '\\N' ? null : values[8],
      user_note: values[9] === '\\N' ? null : values[9],
      tags: values[10] || '{}',
      style: values[11] === '\\N' ? null : values[11],
      brand_references: values[12] === '\\N' ? null : values[12],
      cultural_elements: values[13] === '\\N' ? null : values[13],
      ai_results: values[14] === '\\N' ? null : values[14],
      position: values[15] === '\\N' ? null : values[15],
      version: parseInt(values[16]) || 1,
      history: values[17] || '[]',
      created_at: values[18] || new Date().toISOString(),
      updated_at: values[19] || new Date().toISOString()
    };

    const sql = `
      INSERT INTO public.inspiration_nodes (
        id, map_id, parent_id, title, description, category, content,
        ai_prompt, ai_generated_content, user_note, tags, style,
        brand_references, cultural_elements, ai_results, "position",
        version, history, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (id) DO NOTHING
    `;

    try {
      await client.query(sql, [
        node.id, node.map_id, node.parent_id, node.title, node.description,
        node.category, node.content, node.ai_prompt, node.ai_generated_content,
        node.user_note, node.tags, node.style, node.brand_references,
        node.cultural_elements, node.ai_results, node.position,
        node.version, node.history, node.created_at, node.updated_at
      ]);
      imported++;

      if (imported % 50 === 0) {
        console.log(`  已导入 ${imported}/${dataLines.length}`);
      }
    } catch (err) {
      errors++;
      if (errors <= 3) {
        console.log(`  ❌ 导入失败:`, err.message);
      }
    }
  }

  return { imported, errors };
}

// 主函数
async function main() {
  console.log('========================================');
  console.log('修复表结构并导入节点数据');
  console.log('========================================\n');

  await client.connect();
  console.log('✅ 数据库连接成功\n');

  // 1. 修复表结构
  await fixTableStructure();

  // 2. 提取数据
  const sqlFile = 'c:\\git-repo\\sql_chunks_final\\backup_part007.sql';
  console.log(`\n从 ${sqlFile} 提取数据...`);
  const dataLines = await extractNodesData(sqlFile);
  console.log(`找到 ${dataLines.length} 个节点数据`);

  if (dataLines.length === 0) {
    console.log('❌ 没有找到节点数据');
    await client.end();
    return;
  }

  // 3. 导入数据
  const result = await importNodes(dataLines);

  // 4. 验证结果
  const countResult = await client.query('SELECT COUNT(*) FROM public.inspiration_nodes');
  const totalCount = countResult.rows[0].count;

  console.log('\n========================================');
  console.log('导入完成');
  console.log('========================================');
  console.log(`成功导入: ${result.imported} 个节点`);
  console.log(`失败: ${result.errors} 个节点`);
  console.log(`当前总数: ${totalCount} 个节点`);

  await client.end();
}

main().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
