#!/usr/bin/env node
/**
 * 修复 SQL 文件，删除 \restrict 行
 */

import fs from 'fs'
import path from 'path'

const sqlDir = 'sql_chunks'

console.log('==========================================')
console.log('   修复 SQL 文件')
console.log('==========================================\n')

// 获取所有 SQL 文件
const files = fs.readdirSync(sqlDir)
  .filter(f => f.endsWith('.sql'))
  .sort()

console.log(`找到 ${files.length} 个 SQL 文件\n`)

for (const file of files) {
  const filePath = path.join(sqlDir, file)
  let content = fs.readFileSync(filePath, 'utf-8')
  
  // 删除 \restrict 行
  const originalContent = content
  content = content.replace(/\\restrict.*\n/, '')
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`✅ 修复: ${file} (删除 \\restrict)`)
  } else {
    console.log(`⏭️  跳过: ${file} (无需修复)`)
  }
}

console.log('\n✅ 所有文件修复完成!')
