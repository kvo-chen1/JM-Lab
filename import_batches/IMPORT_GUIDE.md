# Supabase 数据导入指南

## 📊 文件统计

共 **69 个 SQL 文件**，所有文件均已按正确顺序排列，大部分小于 200KB。

### ⚠️ 超大文件注意
以下文件超过 200KB，可能需要分批导入或在 Supabase SQL Editor 中分段执行：

| 文件名 | 大小 | 说明 |
|--------|------|------|
| batch_007_part01.sql | 199.35 KB | 接近限制 |
| batch_008_part01.sql | 198.69 KB | 接近限制 |
| batch_012_part01.sql | 199.94 KB | 接近限制 |
| batch_013_part01.sql | 200.00 KB | 刚好 200KB |
| batch_014_part01.sql | 199.94 KB | 接近限制 |
| batch_015_021_audit_logs_part001_part09.sql | 236.42 KB | 超出限制 |
| batch_015_021_audit_logs_part001_part10.sql | 236.42 KB | 超出限制 |
| ... (其他 audit_logs 文件) | 236.42 KB | 超出限制 |

## 🔧 导入步骤

### 步骤 1: 创建表结构
在 Supabase SQL Editor 中执行：
```sql
-- 打开 create_all_tables_full.sql 并执行
```

### 步骤 2: 按顺序导入数据文件

**重要：必须严格按照文件名顺序导入！**

#### 批次 1: 基础配置表 (batch_001.sql)
- achievement_configs, admin_roles, categories, creator_level_configs

#### 批次 2: 用户表 (batch_002_users_v2_part01.sql)
- users 表（已清理 base64 图片数据）

#### 批次 3-6: 用户相关表
- batch_003.sql 到 batch_006.sql

#### 批次 7-8: 内容表（注意：part01 文件较大）
- batch_007_part01.sql → batch_007_part02.sql → batch_007_part03.sql
- batch_008_part01.sql → batch_008_part02.sql → batch_008_part03.sql

#### 批次 9-11: 关联表
- batch_009.sql 到 batch_011.sql

#### 批次 12-14: 点赞数据（注意：part01 文件较大）
- batch_012_part01.sql → batch_012_part02.sql
- batch_013_part01.sql → batch_013_part02.sql
- batch_014_part01.sql → batch_014_part02.sql

#### 批次 15: 审计日志（34 个文件，part09+ 超出限制）
- batch_015_021_audit_logs_part001_part01.sql 到 part08.sql （安全）
- batch_015_021_audit_logs_part001_part09.sql 到 part34.sql （需要分割）

**对于超出的 audit_logs 文件，需要手动分割：**
```sql
-- 打开文件，找到中间的 \. 位置
-- 分成两部分执行
```

#### 批次 16-20: 其他表
- batch_016_part01.sql → part02.sql → part03.sql
- batch_017_part01.sql → part02.sql → part03.sql
- batch_018_part01.sql → part02.sql
- batch_019_part01.sql → part02.sql
- batch_020_part01.sql → part02.sql

### 步骤 3: 验证导入

导入完成后，执行以下 SQL 检查数据：

```sql
-- 检查用户表
SELECT COUNT(*) FROM users;

-- 检查作品表
SELECT COUNT(*) FROM works;

-- 检查所有表的数据量
SELECT 
  tablename,
  n_tup_ins as inserted_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_tup_ins DESC;
```

## ⚠️ 注意事项

1. **必须按顺序导入**，因为存在外键依赖关系
2. **users 表必须先导入**（batch_002），其他很多表依赖它
3. **如果导入失败**，检查错误信息后，可以单独重新导入该文件
4. **大文件导入**，如果 Supabase SQL Editor 提示 "Query is too large"，需要手动分割文件

## 🐛 常见问题

### 问题 1: "Query is too large to be run via the SQL Editor"
**解决**: 
- 对于接近 200KB 的文件，尝试直接执行，可能会成功
- 对于超过 200KB 的文件，需要手动分割：
  1. 打开 SQL 文件
  2. 找到文件中间的 `\.` 位置
  3. 将文件分成两部分，分别执行

### 问题 2: "foreign key constraint violation"
**解决**: 确保按顺序导入，先导入被引用的表（如 users）

### 问题 3: "duplicate key value violates unique constraint"
**解决**: 数据已存在，可以跳过或清空表后重新导入

### 问题 4: 图片数据丢失
**解决**: users 表中的 base64 图片数据已被清理（因为太大无法导入），这是预期的行为

## 📁 文件位置

- 表结构文件: `c:\git-repo\create_all_tables_full.sql`
- 数据导入文件: `c:\git-repo\import_batches\`
- 本指南: `c:\git-repo\import_batches\IMPORT_GUIDE.md`

## 🚀 快速开始

1. 打开 Supabase SQL Editor
2. 执行 `create_all_tables_full.sql`
3. 按顺序执行 `batch_001.sql` 到 `batch_020_part02.sql`
4. 对于超出大小限制的文件，手动分割后执行
5. 验证数据导入成功

## 📞 需要帮助？

如果遇到问题，请记录：
- 失败的文件名
- 错误信息
- 文件大小

然后寻求帮助或手动调整导入策略。
