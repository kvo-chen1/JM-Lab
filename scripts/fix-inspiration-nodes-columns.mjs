/**
 * 修复 inspiration_nodes 表缺少的列
 */
import { getDB } from '../server/database.mjs'

async function fixInspirationNodesColumns() {
  console.log('[Fix] 开始修复 inspiration_nodes 表...')

  try {
    const db = await getDB()

    // 检查列是否存在
    const checkColumn = async (columnName) => {
      try {
        const result = await db.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'inspiration_nodes' AND column_name = $1
        `, [columnName])
        return result.rows.length > 0
      } catch (e) {
        console.error(`[Fix] 检查列 ${columnName} 失败:`, e.message)
        return false
      }
    }

    // 需要添加的列
    const columnsToAdd = [
      { name: 'ai_prompt', type: 'text' },
      { name: 'ai_generated_content', type: 'jsonb' },
      { name: 'user_note', type: 'text' },
      { name: 'brand_references', type: 'jsonb' },
      { name: 'cultural_elements', type: 'jsonb' },
      { name: 'ai_results', type: 'jsonb' }
    ]

    for (const col of columnsToAdd) {
      const exists = await checkColumn(col.name)
      if (!exists) {
        console.log(`[Fix] 添加列: ${col.name}`)
        try {
          await db.query(`ALTER TABLE inspiration_nodes ADD COLUMN ${col.name} ${col.type}`)
          console.log(`[Fix] 列 ${col.name} 添加成功`)
        } catch (e) {
          console.error(`[Fix] 添加列 ${col.name} 失败:`, e.message)
        }
      } else {
        console.log(`[Fix] 列 ${col.name} 已存在`)
      }
    }

    console.log('[Fix] inspiration_nodes 表修复完成')
  } catch (error) {
    console.error('[Fix] 修复失败:', error)
    process.exit(1)
  }
}

fixInspirationNodesColumns()
