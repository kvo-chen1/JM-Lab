# API 文档

本文档详细描述了系统认证模块的 API 接口，包括请求参数、响应格式及错误码说明。

## 基础说明

- **Base URL**: `/api/auth`
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token (JWT)

## 1. 用户注册与登录

### 1.1 邮箱/密码注册
**POST** `/register`

**请求参数**:
```json
{
  "username": "example_user",
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "phone": "13800138000" // 可选
}
```

**响应示例**:
```json
{
  "code": 0,
  "message": "注册成功，验证邮件已发送...",
  "data": {
    "id": "uuid...",
    "username": "example_user",
    "email": "user@example.com",
    "token": "jwt_token...",
    "email_verified": false
  }
}
```

### 1.2 邮箱/密码登录
**POST** `/login`

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

### 1.3 手机号验证码登录/注册
**POST** `/login-phone`

如果手机号不存在，将自动注册新用户。

**请求参数**:
```json
{
  "phone": "13800138000",
  "code": "123456"
}
```

## 2. GitHub 第三方登录

### 2.1 获取授权地址
**GET** `/github/url`

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "url": "https://github.com/login/oauth/authorize?client_id=...&..."
  }
}
```
前端收到 URL 后应重定向用户。

### 2.2 GitHub 回调处理
**POST** `/github/callback`

**请求参数**:
```json
{
  "code": "github_auth_code_from_query_param"
}
```

**响应**: 登录成功并返回 JWT Token。

## 3. 验证码服务

### 3.1 发送短信验证码
**POST** `/send-sms-code`

**请求参数**:
```json
{
  "phone": "13800138000"
}
```
**限制**: 同一手机号 60 秒内只能发送一次。

### 3.2 发送邮箱验证码
**POST** `/send-email-code`

**请求参数**:
```json
{
  "email": "user@example.com"
}
```

## 4. 用户信息

### 4.1 获取当前用户信息
**GET** `/me`

**Header**: `Authorization: Bearer <token>`

## 错误码说明

| Code | 说明 | 处理建议 |
| :--- | :--- | :--- |
| 0 | 成功 | - |
| 400 | 请求参数错误 | 检查必填项格式 |
| 401 | 未授权/Token无效 | 跳转登录页 |
| 429 | 请求过于频繁 | 提示用户稍后重试 |
| 500 | 服务器内部错误 | 联系管理员 |
