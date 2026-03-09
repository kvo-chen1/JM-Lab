#!/usr/bin/env node
/**
 * 从 backup_part001.sql 中提取 public schema 的数据
 */

import fs from 'fs'

const inputFile = 'sql_chunks_final/backup_part001.sql'
const outputFile = 'part001_public_data.sql'

console.log('==========================================')
console.log('   提取 public schema 数据')
console.log('==========================================\n')

if (!fs.existsSync(inputFile)) {
  console.error('❌ 错误: 找不到文件', inputFile)
  process.exit(1)
}

const content = fs.readFileSync(inputFile, 'utf-8')
const lines = content.split('\n')

console.log(`📄 原文件: ${inputFile}`)
console.log(`📊 总行数: ${lines.length}`)

// 提取 public schema 的 COPY 数据
let outputLines = []
let inCopyBlock = false
let currentTable = ''

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  
  // 检测 COPY 语句开始
  if (line.startsWith('COPY public.')) {
    inCopyBlock = true
    currentTable = line.match(/COPY public\.(\w+)/)?.[1] || ''
    outputLines.push(line)
    console.log(`📤 提取表: ${currentTable}`)
    continue
  }
  
  // 检测 COPY 语句结束
  if (line === '\\.' && inCopyBlock) {
    inCopyBlock = false
    outputLines.push(line)
    outputLines.push('') // 空行
    continue
  }
  
  // 在 COPY 块内，保存数据行
  if (inCopyBlock) {
    outputLines.push(line)
  }
}

// 写入文件
const outputContent = outputLines.join('\n')
fs.writeFileSync(outputFile, outputContent, 'utf-8')

console.log(`\n✅ 提取完成: ${outputFile}`)
console.log(`📊 输出行数: ${outputLines.length}`)
console.log('\n💡 使用说明:')
console.log('   在 Supabase SQL Editor 中执行此文件导入数据')
