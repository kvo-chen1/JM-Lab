# 支付系统配置指南

## 概述

本指南将帮助您配置真实的微信支付和支付宝支付功能。

## 系统架构

```
用户 -> 前端支付页面 -> 创建订单API -> 微信支付/支付宝 -> 生成二维码
                                      |
                                      v
                              用户扫码支付
                                      |
                                      v
                              支付平台回调 -> 更新订单状态 -> 开通会员
```

## 配置步骤

### 一、微信支付配置

#### 1. 申请微信支付商户号

1. 访问 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 注册并申请成为商户
3. 完成企业资质认证（需要营业执照）
4. 获取商户号（MCHID）

#### 2. 配置API密钥和证书

1. 登录商户平台 -> 账户中心 -> API安全
2. 设置API v3密钥（32位随机字符串）
3. 下载API证书（包含私钥和证书序列号）

#### 3. 配置回调地址

1. 在商户平台配置支付回调URL
2. 回调地址必须是HTTPS且公网可访问
3. 例如：`https://your-domain.com/api/payment/webhook/wechat`

#### 4. 配置环境变量

在 `.env.local` 文件中添加：

```env
WECHAT_APPID=wx_your_appid_here
WECHAT_MCHID=1234567890
WECHAT_APIV3_KEY=YourAPIv3KeyHere
WECHAT_CERT_SERIAL_NO=YourCertSerialNo
WECHAT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----
WECHAT_NOTIFY_URL=https://your-domain.com/api/payment/webhook/wechat
```

**注意**：私钥需要将所有换行符替换为 `\n`

---

### 二、支付宝配置

#### 1. 创建支付宝应用

1. 访问 [支付宝开放平台](https://open.alipay.com/)
2. 登录并进入控制台
3. 创建应用（选择"网页&移动应用"）
4. 添加"当面付"能力

#### 2. 配置密钥

1. 在应用详情页 -> 开发设置 -> 接口加签方式
2. 选择"公钥"模式
3. 生成RSA2密钥对（可使用支付宝密钥工具）
4. 上传公钥到支付宝平台
5. 保存私钥

#### 3. 配置环境变量

```env
ALIPAY_APPID=2024xxxxxxxxxxxx
ALIPAY_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAx0G8e...\n-----END RSA PRIVATE KEY-----
ALIPAY_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
ALIPAY_NOTIFY_URL=https://your-domain.com/api/payment/webhook/alipay
ALIPAY_RETURN_URL=https://your-domain.com/membership/payment/success
```

---

### 三、回调地址配置

#### 1. 本地开发测试

如果在本地开发，需要使用内网穿透工具：

**方案A：使用 ngrok**
```bash
# 安装 ngrok
npm install -g ngrok

# 启动内网穿透（假设本地服务运行在3022端口）
ngrok http 3022

# 获取公网地址，如 https://xxxx.ngrok-free.app
# 将回调地址配置为 https://xxxx.ngrok-free.app/api/payment/webhook/wechat
```

**方案B：使用花生壳/Natapp等**

#### 2. 生产环境

确保您的域名：
- 使用HTTPS协议
- 已备案（国内服务器）
- 防火墙允许外部访问

---

### 四、沙箱环境测试

#### 支付宝沙箱

1. 访问 [支付宝沙箱环境](https://open.alipay.com/develop/sandbox/app)
2. 使用沙箱应用的APPID
3. 修改网关地址：`https://openapi.alipaydev.com/gateway.do`
4. 使用沙箱账号登录 [沙箱版支付宝APP](https://open.alipay.com/develop/sandbox/tool)

#### 微信支付沙箱

微信支付沙箱较为复杂，建议使用真实金额0.01元进行测试。

---

### 五、测试支付流程

1. **启动开发服务器**
   ```bash
   pnpm dev
   ```

2. **访问支付页面**
   - 进入会员中心
   - 选择套餐
   - 点击支付

3. **扫码支付**
   - 使用微信/支付宝扫描二维码
   - 完成支付

4. **验证结果**
   - 检查订单状态是否更新为"completed"
   - 检查用户会员等级是否更新

---

### 六、常见问题

#### Q1: 微信支付提示"商户号未开通Native支付"

A: 需要在商户平台开通Native支付产品：
- 登录商户平台 -> 产品中心 -> Native支付 -> 申请开通

#### Q2: 支付宝提示" insufficient isv permissions"

A: 需要在应用中添加"当面付"能力：
- 开放平台 -> 应用详情 -> 能力列表 -> 添加能力 -> 当面付

#### Q3: 回调没有触发

A: 检查以下几点：
- 回调地址是否公网可访问
- 是否使用HTTPS
- 防火墙是否放行
- 查看服务器日志确认是否收到请求

#### Q4: 签名验证失败

A: 
- 检查密钥是否正确
- 检查是否有额外的空格或换行符
- 确认使用的是RSA2签名方式

---

### 七、安全注意事项

1. **密钥管理**
   - 不要将私钥提交到代码仓库
   - 使用环境变量存储敏感信息
   - 定期更换API密钥

2. **回调验证**
   - 必须验证回调签名
   - 检查订单金额是否匹配
   - 防止重复处理同一订单

3. **HTTPS强制**
   - 生产环境必须使用HTTPS
   - 配置HSTS头
   - 使用TLS 1.2+

---

### 八、API接口说明

#### 创建支付订单
```http
POST /api/payment/create
Content-Type: application/json
Authorization: Bearer {token}

{
  "plan": "premium",
  "amount": 99,
  "paymentMethod": "wechat",
  "period": "monthly"
}
```

#### 查询支付状态
```http
GET /api/payment/status/{orderId}
Authorization: Bearer {token}
```

#### 获取支付配置状态
```http
GET /api/payment/config
```

---

### 九、相关文件

- `server/services/realPaymentService.mjs` - 支付服务核心逻辑
- `server/routes/payment.mjs` - 支付API路由
- `src/pages/MembershipPayment.tsx` - 支付页面
- `.env.payment.example` - 环境变量示例

---

### 十、技术支持

- 微信支付文档：https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml
- 支付宝文档：https://opendocs.alipay.com/
