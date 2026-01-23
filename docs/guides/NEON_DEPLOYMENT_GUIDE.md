# Neon Data API 创建与部署指南

## 1. 在Neon控制台创建Data API

### 步骤1：登录Neon控制台
1. 访问 [Neon控制台](https://console.neon.tech/)
2. 使用您的GitHub或Email账号登录

### 步骤2：创建或选择项目
1. 如果您还没有Neon项目，点击"Create Project"创建新项目
2. 如果已有项目，选择您想要使用的项目

### 步骤3：启用Data API
1. 在项目 dashboard 中，点击左侧菜单的"Settings"
2. 选择"Data API"选项卡
3. 点击"Enable Data API"按钮
4. 系统会为您生成一个API密钥，请妥善保存

### 步骤4：获取连接信息
1. 在"Data API"页面，您可以看到：
   - **API Endpoint**: 例如 `https://ep-bold-flower-agmuls0b.apirest.c-2.eu-central-1.aws.neon.tech/neondb/rest/v1`
   - **Database Name**: 默认为 `neondb`
   - **API Key**: 您刚才生成的密钥

## 2. 配置项目环境变量

### 步骤1：更新本地.env文件（用于测试）
```env
# Database Configuration
DB_TYPE="neon_api"
NEON_API_ENDPOINT="您的Neon API Endpoint"
NEON_API_KEY="您的Neon API Key"
NEON_DB_NAME="neondb"

# JWT Configuration
JWT_SECRET="my-secret-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# CORS Configuration
CORS_ALLOW_ORIGIN="*"
```

### 步骤2：配置Vercel环境变量
1. 登录 [Vercel控制台](https://vercel.com/)
2. 选择您的项目
3. 点击"Settings" > "Environment Variables"
4. 添加以下环境变量：
   - `DB_TYPE`: `neon_api`
   - `NEON_API_ENDPOINT`: 您的Neon API Endpoint
   - `NEON_API_KEY`: 您的Neon API Key
   - `NEON_DB_NAME`: `neondb`
   - `JWT_SECRET`: 安全的JWT密钥
   - `JWT_EXPIRES_IN`: `7d`
   - `CORS_ALLOW_ORIGIN`: `*`

## 3. GitHub → Vercel 部署流程

### 步骤1：确保代码已提交到GitHub
1. 检查本地代码状态：
   ```bash
git status
   ```
2. 提交所有更改：
   ```bash
git add .
git commit -m "完成Neon Data API集成"
   ```
3. 推送到GitHub：
   ```bash
git push origin main
   ```

### 步骤2：Vercel自动部署
1. Vercel会自动检测GitHub仓库的更改
2. 开始构建和部署流程
3. 您可以在Vercel控制台的"Deployments"页面查看部署状态

### 步骤3：验证部署
1. 部署完成后，访问Vercel提供的域名
2. 测试注册功能，确保数据能正确存储到Neon数据库
3. 测试登录功能，确保能正确读取用户数据
4. 访问管理后台，查看用户列表

## 4. 数据库迁移说明

### 首次部署到Neon时
当您首次使用Neon数据库时，系统会自动：
1. 创建必要的表结构（users, favorites, video_tasks）
2. 初始化索引和约束
3. 支持完整的用户注册、登录和数据管理功能

### 数据迁移（可选）
如果您需要将本地SQLite数据迁移到Neon：
1. 导出本地SQLite数据
2. 在Neon控制台使用SQL编辑器导入数据
3. 或使用Neon的数据导入工具

## 5. 常见问题排查

### 问题1：连接失败
- 检查NEON_API_ENDPOINT是否正确
- 检查NEON_API_KEY是否有效
- 确保Neon项目处于活跃状态

### 问题2：注册失败
- 检查用户表结构是否包含age和tags字段
- 查看Vercel部署日志获取详细错误信息
- 确保JWT_SECRET已正确配置

### 问题3：登录后无法获取用户信息
- 检查JWT令牌是否包含完整的用户数据
- 确保API端点返回完整的用户信息

## 6. 监控与维护

### 查看Neon日志
1. 登录Neon控制台
2. 点击左侧菜单的"Logs"
3. 查看数据库操作日志和API请求日志

### 监控Vercel部署
1. 登录Vercel控制台
2. 查看项目的"Analytics"和"Speed Insights"
3. 检查"Functions"日志获取API执行详情

## 7. 安全建议

1. 定期更换JWT_SECRET
2. 不要将API密钥提交到代码仓库
3. 启用Neon的IP访问控制
4. 定期备份Neon数据库
5. 监控异常登录尝试

---

通过以上步骤，您的项目将成功部署到Vercel并使用Neon Data API作为数据库。用户可以正常注册、登录，您可以在管理后台查看所有用户数据。