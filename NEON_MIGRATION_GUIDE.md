# Neon 数据库迁移指南

## 1. 在 Neon 控制台创建数据库

### 步骤 1: 登录 Neon 控制台
1. 访问 [Neon 控制台](https://console.neon.tech/)
2. 登录您的账户
3. 如果没有项目，点击 "New Project" 创建一个新项目

### 步骤 2: 创建数据库
1. 在项目页面，点击 "Databases" 选项卡
2. 点击 "New Database" 按钮
3. 输入数据库名称（例如：`neondb`）
4. 选择合适的计算资源和存储选项
5. 点击 "Create" 按钮

### 步骤 3: 获取连接信息
1. 在项目概览页面，找到 "Connection Details" 部分
2. 复制 "Non-pooling connection string"（推荐用于开发环境）
3. 复制 "Pooling connection string"（推荐用于生产环境）
4. 确保保存好用户名、密码和主机信息

## 2. 扩展兼容性分析

### Supabase 扩展在 Neon 中的兼容性：

| 扩展名称 | 版本 | Neon 兼容性 | 替代方案 |
|---------|------|------------|----------|
| supabase_vault | 0.3.1 | ❌ 不支持 | 使用 Neon 的加密功能或应用层加密 |
| vector | 0.8.0 | ✅ 支持（需手动安装） | 使用 Neon 的 `vector` 扩展 |
| pg_graphql | 1.5.11 | ✅ 支持（需手动安装） | 使用 Neon 的 `pg_graphql` 扩展 |

### 安装兼容的扩展：

1. 连接到 Neon 数据库
2. 执行以下 SQL 命令：
   ```sql
   -- 安装 vector 扩展
   CREATE EXTENSION IF NOT EXISTS vector;
   
   -- 安装 pg_graphql 扩展
   CREATE EXTENSION IF NOT EXISTS pg_graphql;
   ```

## 3. 修改数据库配置文件

### 更新 .env 文件
1. 打开 `d:\git-repo\.env` 文件
2. 更新以下环境变量：
   ```env
   # 本地开发使用 Neon 数据库
   POSTGRES_URL_NON_POOLING=postgres://[用户名]:[密码]@[主机]:5432/[数据库名]
   NEON_DATABASE_URL=postgres://[用户名]:[密码]@[主机]-pooler.[区域].aws.neon.tech/[数据库名]
   NEON_URL=postgres://[用户名]:[密码]@[主机]-pooler.[区域].aws.neon.tech/[数据库名]
   DATABASE_URL=postgres://[用户名]:[密码]@[主机]-pooler.[区域].aws.neon.tech/[数据库名]
   POSTGRES_URL=postgres://[用户名]:[密码]@[主机]-pooler.[区域].aws.neon.tech/[数据库名]
   ```

### 更新数据库配置代码
1. 打开 `d:\git-repo\server\database.mjs` 文件
2. 确保数据库连接配置正确处理 Neon 连接字符串
3. 确保 SSL 配置正确：
   ```javascript
   ssl: (connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')) ? {
     rejectUnauthorized: false // 允许自签名证书 (Neon 兼容性)
   } : false,
   ```

## 4. 测试数据库连接

### 运行测试脚本
1. 创建测试脚本 `test-neon-connection.mjs`：
   ```javascript
   import { Pool } from 'pg';
   
   // 使用环境变量中的连接字符串
   const connectionString = process.env.POSTGRES_URL_NON_POOLING;
   
   const pool = new Pool({
     connectionString,
     ssl: {
       rejectUnauthorized: false
     }
   });
   
   async function testConnection() {
     try {
       console.log('Testing Neon database connection...');
       const client = await pool.connect();
       console.log('Connected successfully!');
       
       const res = await client.query('SELECT 1');
       console.log('Query result:', res.rows);
       
       // 测试扩展
       const extensions = await client.query('SELECT * FROM pg_extension');
       console.log('Installed extensions:', extensions.rows.map(e => e.extname));
       
       client.release();
       await pool.end();
       console.log('Connection test completed successfully!');
     } catch (error) {
       console.error('Connection error:', error.message);
       console.error('Error details:', error);
       await pool.end();
     }
   }
   
   testConnection();
   ```

2. 运行测试脚本：
   ```bash
   node test-neon-connection.mjs
   ```

## 5. 完整迁移步骤

### 步骤 1: 准备源数据库
1. 在 Supabase 控制台中，创建数据库备份
2. 导出架构和数据

### 步骤 2: 导入数据到 Neon
1. 使用 Neon 的导入工具：
   - 访问 Neon 控制台
   - 选择您的项目
   - 点击 "Import Data" 选项
   - 按照提示上传备份文件或提供 Supabase 连接字符串

### 步骤 3: 验证迁移
1. 运行应用程序
2. 测试所有功能
3. 确保数据完整性

### 步骤 4: 切换生产环境
1. 更新生产环境的环境变量
2. 部署应用程序
3. 监控数据库性能

## 6. 故障排除

### 常见问题及解决方案：

1. **密码认证失败**
   - 检查连接字符串中的用户名和密码
   - 确保在 Neon 控制台中启用了密码认证

2. **扩展安装失败**
   - 确保使用的是 Neon 支持的扩展版本
   - 检查用户权限

3. **连接超时**
   - 检查网络连接
   - 确保 Neon 服务运行正常
   - 调整连接超时设置

4. **数据导入失败**
   - 检查源数据格式
   - 确保目标数据库有足够的存储空间
   - 分批次导入大型数据集

## 7. 性能优化

### Neon 特有优化：
1. 使用连接池减少连接开销
2. 利用 Neon 的自动缩放功能
3. 优化查询以减少冷启动时间
4. 使用 Neon 的分支功能进行测试和开发

## 8. 监控和维护

1. 在 Neon 控制台中监控数据库性能
2. 设置警报以检测异常
3. 定期备份数据库
4. 更新扩展到最新版本

---

## 总结

迁移到 Neon 数据库可以带来更好的性能、可扩展性和成本效益。通过遵循本指南，您可以顺利完成从 Supabase 到 Neon 的迁移，并确保所有功能正常运行。

如果遇到任何问题，请参考 [Neon 文档](https://neon.tech/docs) 或联系 Neon 支持团队。
