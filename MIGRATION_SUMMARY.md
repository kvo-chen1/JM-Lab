# Supabase 数据迁移总结

## 📁 生成的文件

### 1. 表结构文件
- **`create_all_tables_full.sql`** - 完整的表结构定义（207个表）

### 2. 数据文件
- **`data_by_table_split/`** - 按表分割的 223 个 SQL 文件
- **`import_batches/`** - 按导入顺序整理的 69 个批次文件（推荐使用）

### 3. 导入脚本
- **`scripts/psql-import.mjs`** - 使用 psql 命令行自动导入（推荐）
- **`scripts/generate-import-batch.mjs`** - 生成批次文件的脚本

### 4. 文档
- **`import_batches/IMPORT_GUIDE.md`** - 详细的导入指南

## 🚀 推荐的导入方式

### 方式 1: 使用 psql 命令行（推荐，无大小限制）

```bash
# 1. 确保已安装 PostgreSQL 客户端
# 2. 运行自动导入脚本
node scripts/psql-import.mjs

# 3. 按提示输入 Supabase 连接信息：
#    - Host: db.xxxxx.supabase.co
#    - Database: postgres
#    - Port: 5432
#    - User: postgres
#    - Password: your-password
```

**优点：**
- ✅ 没有文件大小限制
- ✅ 自动按顺序导入所有文件
- ✅ 自动验证导入结果

### 方式 2: 使用 Supabase SQL Editor（手动）

```
1. 打开 Supabase Dashboard -> SQL Editor
2. 执行 create_all_tables_full.sql 创建表结构
3. 按顺序执行 import_batches/ 目录下的文件：
   - batch_001.sql
   - batch_002_users_v2_part01.sql
   - batch_003.sql
   - ...以此类推
```

**注意：**
- ⚠️ 部分文件超过 200KB，可能需要手动分割
- ⚠️ users 表中的 base64 图片数据已被清理

## 📊 数据统计

| 项目 | 数量 |
|------|------|
| 总表数 | 207 |
| 数据文件数 | 69 个批次文件 |
| users 数据 | 14 行（已清理图片） |
| 最大文件 | batch_015_021_audit_logs_part001_part09.sql (236 KB) |

## ⚠️ 已知问题

1. **users 表图片数据丢失**
   - 原因：base64 编码的图片数据太大（1.4MB），无法通过 SQL Editor 导入
   - 解决：已清理图片数据，保留其他所有字段

2. **部分文件超过 200KB**
   - 如果使用 SQL Editor，需要手动分割这些文件
   - 如果使用 psql，则无此限制

## 🔧 如果导入失败

### 检查连接信息
在 Supabase Dashboard -> Settings -> Database 中找到：
- Connection string
- Host
- Database name
- Port
- User
- Password

### 常见问题

1. **"connection refused"**
   - 检查网络连接
   - 确认 Supabase 项目处于活动状态

2. **"password authentication failed"**
   - 检查密码是否正确
   - 确认使用的是数据库密码，不是 API Key

3. **"relation already exists"**
   - 表已存在，可以跳过或删除后重新导入

## 📞 需要帮助？

如果遇到问题，请提供：
1. 错误信息截图
2. 失败的文件名
3. 使用的导入方式（psql 或 SQL Editor）

## ✅ 导入验证

导入完成后，执行以下 SQL 验证：

```sql
-- 查看所有表的数据量
SELECT 
  tablename,
  n_tup_ins as row_count
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_tup_ins DESC;

-- 检查关键表
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM works;
SELECT COUNT(*) FROM posts;
```

## 🎉 完成！

数据迁移完成后，你的新 Supabase 项目将包含旧项目的所有数据（除用户图片外）。
