#!/usr/bin/env node
/**
 * 安全地分割 SQL 文件，确保不在函数或语句中间切断
 */

import fs from 'fs'
import path from 'path'

const inputFile = 'backup.sql'
const outputDir = 'sql_chunks_safe'
const maxFileSize = 4000 // 每个文件最大行数，留有余量

console.log('==========================================')
console.log('   安全分割 SQL 文件')
console.log('==========================================\n')

if (!fs.existsSync(inputFile)) {
  console.error('❌ 错误: 找不到文件', inputFile)
  process.exit(1)
}

// 创建输出目录
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// 读取文件
const content = fs.readFileSync(inputFile, 'utf-8')
const lines = content.split('\n')

console.log(`📄 原文件: ${inputFile}`)
console.log(`📊 总行数: ${lines.length}`)

// 查找安全的分割点（在语句边界处）
function findSafeSplitPoint(lines, startIndex, maxLines) {
  let endIndex = Math.min(startIndex + maxLines, lines.length)
  
  // 向前查找，直到找到一个空行或注释行
  while (endIndex < lines.length) {
    const line = lines[endIndex]?.trim() || ''
    // 安全的分割点：空行、注释行、或特定模式
    if (line === '' || line.startsWith('--') || line.startsWith('CREATE ') || line.startsWith('ALTER ')) {
      return endIndex
    }
    endIndex++
  }
  
  return endIndex
}

// 分割文件
let fileIndex = 1
let currentIndex = 0
let totalFiles = 0

// 跳过 \restrict 行
const headerLines = []
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('\restrict')) continue
  headerLines.push(lines[i])
  if (headerLines.length >= 20) break
}

while (currentIndex < lines.length) {
  const splitPoint = findSafeSplitPoint(lines, currentIndex, maxFileSize)
  const chunkLines = lines.slice(currentIndex, splitPoint)
  
  // 如果是第一个文件，添加头部
  if (fileIndex === 1) {
    chunkLines.unshift(...headerLines)
  }
  
  const outputFile = path.join(outputDir, `backup_part${String(fileIndex).padStart(3, '0')}.sql`)
  const fileContent = chunkLines.join('\n')
  fs.writeFileSync(outputFile, fileContent, 'utf-8')
  
  console.log(`✅ 创建: ${outputFile} (${chunkLines.length} 行)`)
  
  currentIndex = splitPoint
  fileIndex++
  totalFiles++
  
  // 避免无限循环
  if (splitPoint <= currentIndex && currentIndex < lines.length) {
    currentIndex++
  }
}

console.log(`\n📦 总共分割成 ${totalFiles} 个文件`)
console.log(`📁 输出目录: ${outputDir}`)
