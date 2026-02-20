# 个人开发者 OAuth 替代方案

没有企业资质时，可以使用以下替代方案实现类似功能。

## 方案对比

| 方案 | 难度 | 用户体验 | 适用场景 |
|------|------|----------|----------|
| GitHub/Google 登录 | ⭐ 简单 | ⭐⭐⭐ 好 | 技术类/国际化产品 |
| 微信小程序登录 | ⭐⭐ 中等 | ⭐⭐⭐⭐ 很好 | 国内用户为主 |
| 短信验证码登录 | ⭐ 简单 | ⭐⭐⭐ 好 | 通用方案（已支持） |
| 扫码登录（自建） | ⭐⭐⭐ 复杂 | ⭐⭐⭐⭐ 很好 | 有预算的个人开发者 |

## 推荐方案：GitHub + Google + 微信小程序

### 1. GitHub 登录（最简单）

**优点：**
- ✅ 个人开发者可直接使用
- ✅ 无需审核，即时生效
- ✅ 技术用户群体接受度高

**配置：**
```bash
GITHUB_CLIENT_ID=你的_client_id
GITHUB_CLIENT_SECRET=你的_client_secret
```

### 2. Google 登录

**优点：**
- ✅ 个人开发者可用
- ✅ 用户群体广泛
- ✅ 配置简单

**配置：**
```bash
GOOGLE_CLIENT_ID=你的_client_id
GOOGLE_CLIENT_SECRET=你的_client_secret
```

### 3. 微信小程序登录（需要小程序）

**优点：**
- ✅ 个人可注册小程序
- ✅ 用户体验好
- ✅ 国内用户普及率高

**限制：**
- 需要单独开发小程序
- 个人小程序有功能限制

## 微信小程序登录实现

### 小程序端代码

```javascript
// pages/login/login.js
Page({
  login() {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 发送 code 到后端
          wx.request({
            url: 'https://your-api.com/api/auth/wechat-miniprogram',
            method: 'POST',
            data: {
              code: res.code,
              userInfo: {} // 可选：用户信息
            },
            success: (response) => {
              // 保存 token
              wx.setStorageSync('token', response.data.token);
              wx.navigateBack();
            }
          });
        }
      }
    });
  }
});
```

### 后端实现

```javascript
// server/wechat-miniprogram.mjs
import crypto from 'crypto';

const MINIPROGRAM_APPID = process.env.WECHAT_MINIPROGRAM_APPID;
const MINIPROGRAM_SECRET = process.env.WECHAT_MINIPROGRAM_SECRET;

export async function handleMiniprogramLogin(code) {
  // 调用微信接口换取 openid
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${MINIPROGRAM_APPID}&secret=${MINIPROGRAM_SECRET}&js_code=${code}&grant_type=authorization_code`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.errcode) {
    throw new Error(data.errmsg);
  }
  
  const { openid, unionid, session_key } = data;
  
  // 查找或创建用户
  let user = await userDB.findByProviderId('wechat-miniprogram', unionid || openid);
  
  if (!user) {
    user = await userDB.createUser({
      username: `微信用户_${openid.slice(-8)}`,
      email: `${openid}@wechat.miniprogram`,
      provider: 'wechat-miniprogram',
      provider_id: unionid || openid,
      is_verified: true
    });
  }
  
  return user;
}
```

## 方案2：扫码登录（自建）

实现一个网页端的扫码登录功能：

1. 网页端显示二维码（包含临时 token）
2. 用户使用已登录的手机端扫描
3. 手机端确认登录
4. 网页端轮询登录状态，获取 token

**优点：**
- 完全自主可控
- 用户体验接近微信扫码

**缺点：**
- 需要用户先有一个已登录的设备
- 开发工作量较大

## 方案3：使用第三方登录服务

### Auth0
```bash
npm install @auth0/auth0-react
```

**优点：**
- 支持微信（通过合作伙伴）
- 支持手机号登录
- 免费额度足够小项目使用

**缺点：**
- 国内访问可能较慢
- 有使用成本

### Clerk
```bash
npm install @clerk/clerk-react
```

**优点：**
- 现代化 UI
- 支持多种登录方式
- 免费额度 generous

## 推荐配置（无企业资质）

```bash
# 必配 - 个人可用
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# 选配 - 有小程序时配置
WECHAT_MINIPROGRAM_APPID=xxx
WECHAT_MINIPROGRAM_SECRET=xxx
```

## UI 调整建议

没有微信/支付宝时，调整登录页面：

```tsx
// 只显示已配置的登录方式
const providers = [
  { name: 'github', color: 'from-gray-800 to-gray-600', icon: 'fa-github', label: 'GitHub' },
  { name: 'google', color: 'from-red-500 to-orange-400', icon: 'fa-google', label: 'Google' },
  // 微信支付宝只在配置后才显示
  ...(isWechatConfigured ? [{ name: 'wechat', color: 'from-green-500 to-teal-400', icon: 'fa-weixin', label: '微信' }] : []),
  ...(isAlipayConfigured ? [{ name: 'alipay', color: 'from-blue-500 to-blue-400', icon: 'fa-alipay', label: '支付宝' }] : []),
];
```

## 总结

| 你的情况 | 推荐方案 |
|---------|---------|
| 纯个人项目 | GitHub + Google |
| 有小程序 | GitHub + Google + 小程序 |
| 预算充足 | Auth0 / Clerk |
| 国内用户为主 | 优先小程序，或购买企业服务 |

**建议：**
1. 先实现 GitHub + Google（30分钟搞定）
2. 如果有精力，注册个人小程序（免费）
3. 等业务有收入后，再考虑企业资质
