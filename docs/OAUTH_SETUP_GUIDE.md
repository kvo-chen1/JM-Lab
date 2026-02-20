# OAuth 第三方登录配置指南

本文档介绍如何配置微信、支付宝、GitHub 和 Google 第三方登录功能。

## 目录

- [快速开始](#快速开始)
- [微信登录配置](#微信登录配置)
- [支付宝登录配置](#支付宝登录配置)
- [GitHub 登录配置](#github-登录配置)
- [Google 登录配置](#google-登录配置)
- [数据库配置](#数据库配置)
- [常见问题](#常见问题)

## 快速开始

1. 复制 `.env.example` 为 `.env.local`
2. 根据需要配置相应的 OAuth 提供商
3. 重启开发服务器

```bash
cp .env.example .env.local
```

## 微信登录配置

### 1. 注册微信开放平台账号

访问 [微信开放平台](https://open.weixin.qq.com/) 注册开发者账号。

### 2. 创建网站应用

1. 进入「管理中心」→「网站应用」
2. 点击「创建网站应用」
3. 填写应用信息：
   - 应用名称
   - 应用简介
   - 应用官网
   - 应用图标（28×28 和 108×108）

### 3. 配置授权回调域

在应用详情页设置「授权回调域」：
- 开发环境: `localhost`
- 生产环境: `your-domain.com`

### 4. 获取 AppID 和 AppSecret

审核通过后，在应用详情页获取：
- AppID
- AppSecret（仅显示一次，请妥善保存）

### 5. 配置环境变量

```bash
WECHAT_APPID=wx1234567890abcdef
WECHAT_APPSECRET=your_app_secret_here
```

### 注意事项

- 微信登录需要企业资质认证
- 个人开发者无法申请网站应用
- 审核周期通常为 1-7 个工作日
- 需要填写完整的隐私政策链接

## 支付宝登录配置

### 1. 注册支付宝开放平台账号

访问 [支付宝开放平台](https://open.alipay.com/) 注册开发者账号。

### 2. 创建应用

1. 进入「控制台」→「应用」
2. 点击「创建应用」→「网页应用」
3. 填写应用信息

### 3. 配置应用

在应用详情页：
1. 添加「支付宝登录」功能
2. 设置「授权回调地址」
3. 配置「应用公钥」和「应用私钥」

### 4. 生成密钥对

使用支付宝密钥工具生成 RSA2 密钥对：

```bash
# 下载密钥工具
# https://opendocs.alipay.com/common/02kipk

# 生成密钥对
openssl genrsa -out app_private_key.pem 2048
openssl rsa -in app_private_key.pem -pubout -out app_public_key.pem
```

### 5. 配置环境变量

```bash
ALIPAY_APPID=2024XXXXXXXXXXXX
ALIPAY_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----
ALIPAY_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----
```

### 注意事项

- 支付宝登录需要企业资质
- 私钥必须妥善保管，不要泄露
- 生产环境需要使用正式环境密钥

## GitHub 登录配置

### 1. 注册 OAuth App

1. 登录 GitHub
2. 进入 Settings → Developer settings → OAuth Apps
3. 点击「New OAuth App」

### 2. 填写应用信息

- **Application name**: 你的应用名称
- **Homepage URL**: `http://localhost:5173`
- **Authorization callback URL**: `http://localhost:5173/oauth/callback/github`

### 3. 获取 Client ID 和 Client Secret

创建后获取：
- Client ID
- Client Secret（生成后只显示一次）

### 4. 配置环境变量

```bash
GITHUB_CLIENT_ID=Ov23lixxxxxxxxxxxx
GITHUB_CLIENT_SECRET=your_client_secret_here
```

### 注意事项

- GitHub OAuth 支持个人开发者
- 不需要审核，配置即时生效
- 支持多回调地址配置

## Google 登录配置

### 1. 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目

### 2. 启用 Google+ API

1. 进入「API 和服务」→「库」
2. 搜索并启用「Google+ API」

### 3. 配置 OAuth 同意屏幕

1. 进入「API 和服务」→「OAuth 同意屏幕」
2. 选择用户类型（外部或内部）
3. 填写应用信息：
   - 应用名称
   - 用户支持邮箱
   - 应用域名
   - 开发者联系信息

### 4. 创建 OAuth 客户端 ID

1. 进入「凭据」→「创建凭据」→「OAuth 客户端 ID」
2. 选择应用类型：Web 应用
3. 配置授权重定向 URI：
   - `http://localhost:5173/oauth/callback/google`
   - `https://your-domain.com/oauth/callback/google`

### 5. 获取客户端凭据

创建后获取：
- 客户端 ID
- 客户端密钥

### 6. 配置环境变量

```bash
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/callback/google
```

### 注意事项

- Google OAuth 支持个人开发者
- 外部应用需要审核才能发布
- 测试期间可以添加测试用户

## 数据库配置

OAuth 登录需要以下数据库字段，已包含在 `database-schema.sql` 中：

```sql
-- OAuth 相关字段
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS provider VARCHAR(50),
  ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS supabase_uid UUID;

-- OAuth 相关索引
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider_id);
CREATE INDEX IF NOT EXISTS idx_users_provider_provider_id ON users(provider, provider_id);
```

运行迁移：

```bash
# 使用 psql 执行
psql $DATABASE_URL -f database-schema.sql
```

## 完整环境变量示例

```bash
# ==========================================
# OAuth 第三方登录配置
# ==========================================

# 微信登录
WECHAT_APPID=wx1234567890abcdef
WECHAT_APPSECRET=your_wechat_appsecret

# 支付宝登录
ALIPAY_APPID=2024XXXXXXXXXXXX
ALIPAY_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
ALIPAY_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----

# GitHub 登录
GITHUB_CLIENT_ID=Ov23lixxxxxxxxxxxx
GITHUB_CLIENT_SECRET=your_github_secret

# Google 登录
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/callback/google

# 应用基础 URL
VITE_APP_URL=http://localhost:5173
```

## 常见问题

### Q: 微信登录提示 "Scope 参数错误或没有 Scope 权限"

A: 确保你的应用已经通过微信审核，并且开通了网站应用登录权限。

### Q: 支付宝登录提示 "缺少必要参数"

A: 检查 ALIPAY_PRIVATE_KEY 格式是否正确，需要包含完整的 PEM 格式（包括 BEGIN/END 标记）。

### Q: GitHub 登录提示 "redirect_uri_mismatch"

A: 确保 GitHub OAuth App 中配置的回调地址与代码中的 redirect_uri 完全一致，包括协议和端口。

### Q: Google 登录提示 "Error 400: redirect_uri_mismatch"

A: 在 Google Cloud Console 的凭据页面，确保已添加正确的授权重定向 URI。

### Q: 登录后用户没有正确关联

A: 检查数据库中 provider 和 provider_id 字段是否正确存储，以及索引是否正确创建。

### Q: 如何测试 OAuth 登录？

A: 建议按以下顺序测试：
1. 先测试 GitHub（最简单，无需审核）
2. 再测试 Google（需要配置但无需审核）
3. 最后测试微信和支付宝（需要企业资质和审核）

## 安全建议

1. **不要提交密钥到代码仓库**
   - 使用 `.env.local` 存储密钥
   - 将 `.env.local` 添加到 `.gitignore`

2. **使用 HTTPS**
   - 生产环境必须使用 HTTPS
   - 微信和支付宝要求 HTTPS 回调地址

3. **验证 State 参数**
   - 代码已自动验证 state 防止 CSRF 攻击
   - 不要禁用此验证

4. **定期轮换密钥**
   - 建议每 3-6 个月轮换一次密钥
   - 发现泄露立即重置

## 技术支持

如有问题，请查看：
- [微信开放平台文档](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html)
- [支付宝开放平台文档](https://opendocs.alipay.com/support/01rawn)
- [GitHub OAuth 文档](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Google OAuth 文档](https://developers.google.com/identity/protocols/oauth2)
