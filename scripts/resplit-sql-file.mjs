#!/usr/bin/env node
/**
 * 重新分割 SQL 文件，保留正确的换行符
 */

import fs from 'fs'
import path from 'path'

const inputFile = 'backup.sql'
const outputDir = 'sql_chunks_fixed'
const linesPerFile = 5000

console.log('==========================================')
console.log('   重新分割 SQL 文件')
console.log('==========================================\n')

if (!fs.existsSync(inputFile)) {
  console.error('❌ 错误: 找不到文件', inputFile)
  process.exit(1)
}

// 创建输出目录
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// 读取文件（保留原始换行符）
const content = fs.readFileSync(inputFile, 'utf-8')
const lines = content.split('\n')

console.log(`📄 原文件: ${inputFile}`)
console.log(`📊 总行数: ${lines.length}`)
console.log(`📦 每文件行数: ${linesPerFile}`)

// 分割文件
let fileIndex = 1
let currentLines = []
let totalFiles = 0

// 添加文件头（前 20 行是设置和注释）
const headerLines = lines.slice(0, 20)

for (let i = 20; i < lines.length; i++) {
  currentLines.push(lines[i])
  
  if (currentLines.length >= linesPerFile || i === lines.length - 1) {
    const outputFile = path.join(outputDir, `backup_part${String(fileIndex).padStart(3, '0')}.sql`)
    const fileContent = [...headerLines, ...currentLines].join('\n')
    fs.writeFileSync(outputFile, fileContent, 'utf-8')
    
    console.log(`✅ 创建: ${outputFile} (${currentLines.length + headerLines.length} 行)`)
    
    currentLines = []
    fileIndex++
    totalFiles++
  }
}

console.log(`\n📦 总共分割成 ${totalFiles} 个文件`)
console.log(`📁 输出目录: ${outputDir}`)
console.log('\n💡 使用说明:')
console.log('   1. 按顺序执行每个 SQL 文件 (part001, part002, ...)')
console.log('   2. 在 Supabase SQL Editor 中逐个上传执行')
console.log('   3. 或者使用 psql 命令行工具执行')
