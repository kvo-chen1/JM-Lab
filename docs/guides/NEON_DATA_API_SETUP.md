# Neon Data API 正确配置指南

## 重要说明
您当前看到的是直接的PostgreSQL连接信息，但我们的项目使用的是**Neon Data API**（REST API方式），不是直接的PostgreSQL连接。请按照以下步骤获取正确的配置：

## 步骤1：获取Data API配置

1. 在Neon控制台左侧菜单中，点击 **Data API**
2. 如果还未启用，点击 **Enable Data API** 按钮
3. 启用后，您将看到：
   - **API Endpoint**: 类似 `https://ep-bold-flower-agmuls0b.apirest.c-2.eu-central-1.aws.neon.tech/neondb/rest/v1`
   - **API Key**: 点击 "Generate API Key" 创建密钥，妥善保存
   - **Database Name**: 默认为 `neondb`

## 步骤2：配置环境变量

### 本地.env文件
```env
DB_TYPE="neon_api"
NEON_API_ENDPOINT="您的Data API Endpoint"
NEON_API_KEY="您的API Key"
NEON_DB_NAME="neondb"
```

### Vercel环境变量
在Vercel控制台中添加：
- `DB_TYPE`: `neon_api`
- `NEON_API_ENDPOINT`: 您的Data API Endpoint
- `NEON_API_KEY`: 您的API Key
- `NEON_DB_NAME`: `neondb`

## 步骤3：不要使用直接的PostgreSQL连接

请不要使用您当前看到的PostgreSQL连接字符串（postgresql://...），因为：
1. 我们的项目已经实现了Neon Data API集成
2. Data API提供更好的Serverless兼容性
3. 避免了直接数据库连接的维护成本
4. 提供了更安全的API密钥认证机制

## 步骤4：验证配置

部署完成后，您可以：
1. 测试注册功能，查看数据是否存入Neon
2. 测试登录功能，验证用户数据读取
3. 在管理后台查看用户列表

## 常见问题

### 为什么使用Data API而不是直接PostgreSQL连接？
- 更好的Serverless兼容性
- 无需管理数据库连接池
- 更安全的API密钥认证
- 内置的监控和日志
- 自动的连接管理

### Data API收费吗？
- Neon的Data API包含在免费套餐中
- 有合理的免费额度
- 超出后按使用量计费

---

按照以上步骤配置后，您的项目将正确使用Neon Data API，实现完整的线上数据库功能。