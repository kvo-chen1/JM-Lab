// 导入 inspiration_nodes 数据
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as readline from 'readline'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// 从 SQL 文件中提取 inspiration_nodes 数据
async function extractNodesData(sqlFile: string): Promise<any[]> {
  const fileStream = fs.createReadStream(sqlFile)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  let inCopyBlock = false
  const nodes: any[] = []
  const columns = [
    'id', 'map_id', 'parent_id', 'title', 'description', 'category', 'content',
    'ai_prompt', 'ai_generated_content', 'user_note', 'tags', 'style',
    'brand_references', 'cultural_elements', 'ai_results', 'position',
    'version', 'history', 'created_at', 'updated_at'
  ]

  for await (const line of rl) {
    // 检测 COPY 语句开始
    if (line.includes('COPY public.inspiration_nodes')) {
      inCopyBlock = true
      continue
    }

    // 检测 COPY 语句结束
    if (line === '\\.' && inCopyBlock) {
      inCopyBlock = false
      continue
    }

    // 解析数据行
    if (inCopyBlock && line.includes('\t')) {
      const values = line.split('\t')
      const node: any = {}

      columns.forEach((col, index) => {
        let value = values[index]

        // 处理 null
        if (value === '\\N' || value === 'NULL' || value === '') {
          node[col] = null
          return
        }

        // 处理 JSON 字段
        if (['content', 'style', 'brand_references', 'cultural_elements', 'ai_results', 'position', 'history', 'tags'].includes(col)) {
          try {
            // 处理 PostgreSQL 数组格式
            if (value.startsWith('{') && value.endsWith('}')) {
              // 数组格式，保持原样
              node[col] = value
            } else {
              node[col] = JSON.parse(value)
            }
          } catch {
            node[col] = value
          }
        } else if (col === 'version') {
          node[col] = parseInt(value) || 1
        } else {
          node[col] = value
        }
      })

      nodes.push(node)
    }
  }

  return nodes
}

// 批量插入数据
async function importNodes(nodes: any[]) {
  console.log(`准备导入 ${nodes.length} 个节点...`)

  // 分批导入，每批 100 条
  const batchSize = 100
  let imported = 0
  let errors = 0

  for (let i = 0; i < nodes.length; i += batchSize) {
    const batch = nodes.slice(i, i + batchSize)

    try {
      const { data, error } = await supabase
        .from('inspiration_nodes')
        .upsert(batch, { onConflict: 'id' })

      if (error) {
        console.error(`批次 ${i / batchSize + 1} 导入失败:`, error.message)
        errors += batch.length
      } else {
        imported += batch.length
        console.log(`✅ 已导入 ${imported}/${nodes.length} 个节点`)
      }
    } catch (err: any) {
      console.error(`批次 ${i / batchSize + 1} 异常:`, err.message)
      errors += batch.length
    }
  }

  return { imported, errors }
}

// 主函数
async function main() {
  console.log('========================================')
  console.log('导入 inspiration_nodes 数据')
  console.log('========================================\n')

  // 检查当前节点数量
  const { count: beforeCount, error: countError } = await supabase
    .from('inspiration_nodes')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('❌ 无法获取当前节点数量:', countError.message)
    return
  }

  console.log(`当前节点数量: ${beforeCount || 0}`)

  // 提取数据
  const sqlFile = 'c:\\git-repo\\sql_chunks_final\\backup_part007.sql'
  console.log(`\n正在从 ${sqlFile} 提取数据...`)

  const nodes = await extractNodesData(sqlFile)
  console.log(`找到 ${nodes.length} 个节点数据`)

  if (nodes.length === 0) {
    console.log('❌ 没有找到节点数据')
    return
  }

  // 显示前几个节点
  console.log('\n前 3 个节点预览:')
  nodes.slice(0, 3).forEach((node, index) => {
    console.log(`  ${index + 1}. ${node.title} (ID: ${node.id}, MapID: ${node.map_id})`)
  })

  // 导入数据
  console.log('\n开始导入...')
  const result = await importNodes(nodes)

  // 验证导入结果
  const { count: afterCount, error: afterError } = await supabase
    .from('inspiration_nodes')
    .select('*', { count: 'exact', head: true })

  console.log('\n========================================')
  console.log('导入完成')
  console.log('========================================')
  console.log(`成功导入: ${result.imported} 个节点`)
  console.log(`失败: ${result.errors} 个节点`)
  console.log(`导入前: ${beforeCount || 0} 个节点`)
  console.log(`导入后: ${afterCount || 0} 个节点`)

  if (result.errors > 0) {
    console.log('\n⚠️ 部分节点导入失败，请检查日志')
  } else {
    console.log('\n✅ 所有节点导入成功！')
  }
}

main().catch(console.error)
