#!/usr/bin/env node

/**
 * 迁移文件语法验证脚本
 * 用于验证Supabase迁移文件的SQL语法正确性
 */

import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

// 简单的SQL语法验证规则
const sqlSyntaxRules = [
  // 检查基本语法结构
  { regex: /^--.*$/m, description: '注释行' },
  { regex: /CREATE\s+(TABLE|INDEX|FUNCTION|TRIGGER|VIEW|TYPE)/i, description: '创建语句' },
  { regex: /ALTER\s+(TABLE|COLUMN|INDEX|FUNCTION)/i, description: '修改语句' },
  { regex: /DROP\s+(TABLE|INDEX|FUNCTION|TRIGGER|VIEW|TYPE)/i, description: '删除语句' },
  { regex: /SELECT\s+.*?FROM/i, description: '查询语句' },
  { regex: /INSERT\s+INTO/i, description: '插入语句' },
  { regex: /UPDATE\s+.*?SET/i, description: '更新语句' },
  { regex: /DELETE\s+FROM/i, description: '删除语句' },
  { regex: /DO\s+\$\$|END\s+\$\$/i, description: 'DO块' },
  { regex: /\$\$\s+LANGUAGE\s+(plpgsql|sql)/i, description: '语言声明' },
  { regex: /ON\s+CONFLICT/i, description: '冲突处理' },
  { regex: /IF\s+EXISTS|IF\s+NOT\s+EXISTS/i, description: '条件检查' },
  { regex: /FOREIGN\s+KEY/i, description: '外键约束' },
  { regex: /UNIQUE/i, description: '唯一约束' },
  { regex: /PRIMARY\s+KEY/i, description: '主键约束' },
  { regex: /REFERENCES/i, description: '引用约束' },
  { regex: /CHECK/i, description: '检查约束' },
  { regex: /DEFAULT/i, description: '默认值' },
  { regex: /NOT\s+NULL/i, description: '非空约束' },
  { regex: /SERIAL|UUID|VARCHAR|TEXT|INTEGER|FLOAT|BOOLEAN|TIMESTAMP/i, description: '数据类型' },
  { regex: /USING\s+GIN|USING\s+BTREE/i, description: '索引类型' },
  { regex: /PARTITION\s+OF/i, description: '分区表' },
  { regex: /FOR\s+VALUES\s+FROM/i, description: '分区范围' },
  { regex: /RETURNS\s+(VOID|TABLE|SETOF)/i, description: '函数返回类型' },
  { regex: /DECLARE|BEGIN|END/i, description: 'PL/pgSQL块' },
  { regex: /CASE|WHEN|THEN|ELSE|END/i, description: 'CASE语句' },
  { regex: /LOOP|EXIT|CONTINUE/i, description: '循环语句' },
  { regex: /RAISE/i, description: '错误处理' },
  { regex: /EXCEPTION/i, description: '异常处理' },
  { regex: /EXECUTE/i, description: '动态SQL' },
  { regex: /FORMAT/i, description: '格式化函数' },
  { regex: /COALESCE|GREATEST|LEAST/i, description: '函数' },
  { regex: /ARRAY|UNNEST/i, description: '数组操作' },
  { regex: /JSONB/i, description: 'JSON操作' },
  { regex: /CURRENT_TIMESTAMP|NOW/i, description: '时间函数' },
  { regex: /INTERVAL/i, description: '时间间隔' },
  { regex: /TO_CHAR|DATE_TRUNC/i, description: '日期函数' },
  { regex: /GENERATE_SERIES/i, description: '序列生成' }
];

// 检查文件是否包含有效的SQL语句
function isValidSqlFile(content) {
  // 跳过空文件
  if (!content.trim()) {
    return { valid: false, reason: '文件为空' };
  }

  // 检查是否包含至少一个有效的SQL语句模式
  const hasValidStatement = sqlSyntaxRules.some(rule => rule.regex.test(content));
  
  if (!hasValidStatement) {
    return { valid: false, reason: '未找到有效的SQL语句模式' };
  }

  // 检查基本的语法结构
  const basicChecks = [
    // 检查分号结尾
    { check: /;\s*$/m.test(content), reason: '文件应以分号结尾' },
    // 检查括号匹配
    { check: (content.match(/\(/g) || []).length === (content.match(/\)/g) || []).length, reason: '括号不匹配' },
    // 检查引号匹配
    { check: (content.match(/'/g) || []).length % 2 === 0, reason: '单引号不匹配' },
    { check: (content.match(/"/g) || []).length % 2 === 0, reason: '双引号不匹配' }
  ];

  const failedChecks = basicChecks.filter(check => !check.check);
  if (failedChecks.length > 0) {
    return { 
      valid: false, 
      reason: failedChecks.map(check => check.reason).join(', ') 
    };
  }

  return { valid: true };
}

// 验证所有迁移文件
function validateAllMigrations() {
  const supabaseDir = resolve(process.cwd(), 'supabase');
  const migrationsDir = resolve(supabaseDir, 'migrations');
  
  console.log('=== 迁移文件语法验证 ===\n');

  try {
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`找到 ${migrationFiles.length} 个迁移文件\n`);

    let validCount = 0;
    let invalidCount = 0;

    for (const file of migrationFiles) {
      const filePath = resolve(migrationsDir, file);
      const content = readFileSync(filePath, 'utf-8');
      const validation = isValidSqlFile(content);

      if (validation.valid) {
        console.log(`✓ ${file} - 语法有效`);
        validCount++;
      } else {
        console.log(`✗ ${file} - 语法无效: ${validation.reason}`);
        invalidCount++;
      }
    }

    console.log(`\n=== 验证结果 ===`);
    console.log(`总文件数: ${migrationFiles.length}`);
    console.log(`有效文件: ${validCount}`);
    console.log(`无效文件: ${invalidCount}`);

    if (invalidCount === 0) {
      console.log('\n🎉 所有迁移文件语法验证通过！');
      console.log('\n下一步建议:');
      console.log('1. 运行部署脚本将迁移应用到线上数据库');
      console.log('2. 使用 Supabase Studio 验证数据库状态');
      console.log('3. 运行应用测试确保功能正常');
      process.exit(0);
    } else {
      console.log(`\n❌ 发现 ${invalidCount} 个无效迁移文件，请检查并修复`);
      process.exit(1);
    }

  } catch (error) {
    console.error('验证过程中出错:', error.message);
    process.exit(1);
  }
}

// 运行验证
validateAllMigrations();
