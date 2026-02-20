# 个人收款码支付配置指南

## 概述

个人收款码支付方案适合没有企业资质的个人开发者。用户通过扫描您的个人微信/支付宝收款码完成支付，然后提交支付凭证，您审核后手动开通会员。

## 流程图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  选择套餐   │ --> │  选择支付方式 │ --> │  创建订单   │
└─────────────┘     └─────────────┘     └─────────────┘
                                                │
                                                v
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  审核开通   │ <-- │  提交凭证   │ <-- │  扫码支付   │
│  会员       │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 配置步骤

### 第一步：获取个人收款码

#### 微信收款码

1. 打开微信 -> 我 -> 服务 -> 收付款
2. 选择"二维码收款"
3. 保存收款码图片
4. 将图片上传到图床或CDN（如：七牛云、阿里云OSS、GitHub等）
5. 获取图片URL

#### 支付宝收款码

1. 打开支付宝 -> 首页 -> 收钱
2. 保存收款码图片
3. 将图片上传到图床或CDN
4. 获取图片URL

### 第二步：配置环境变量

复制 `.env.personal-payment.example` 为 `.env.local`，并填入您的配置：

```env
# 微信支付
PERSONAL_WECHAT_ENABLED=true
PERSONAL_WECHAT_QR_CODE=https://your-cdn.com/wechat-qr.png
PERSONAL_WECHAT_NAME=张三
PERSONAL_WECHAT_ACCOUNT=wxid_xxx

# 支付宝
PERSONAL_ALIPAY_ENABLED=true
PERSONAL_ALIPAY_QR_CODE=https://your-cdn.com/alipay-qr.png
PERSONAL_ALIPAY_NAME=张三
PERSONAL_ALIPAY_ACCOUNT=138****8888

# 管理员通知
ADMIN_EMAIL=your-email@example.com
```

### 第三步：配置路由

在 `src/App.tsx` 或其他路由配置文件中添加个人支付页面路由：

```tsx
import PersonalPayment from '@/pages/PersonalPayment';

// 在路由配置中添加
<Route path="/membership/payment/personal" element={<PersonalPayment />} />
```

### 第四步：修改会员中心跳转

修改会员中心的支付按钮，使其跳转到个人支付页面：

```tsx
// 在 MembershipCenter.tsx 或相关文件中
const handlePayment = (plan: string) => {
  navigate('/membership/payment/personal', { 
    state: { plan, renew: false } 
  });
};
```

## 使用流程

### 用户端

1. **选择套餐**：用户在会员中心选择要购买的套餐
2. **选择支付方式**：选择微信或支付宝
3. **创建订单**：系统生成唯一订单和支付识别码
4. **扫码支付**：用户扫描二维码完成支付
5. **提交凭证**：用户填写支付订单号或上传支付截图
6. **等待审核**：等待管理员审核
7. **开通会员**：审核通过后自动开通会员

### 管理员端

1. **接收通知**：有新支付时系统会发送通知（邮件/短信等）
2. **查看订单**：访问管理后台查看待审核订单
3. **核对支付**：在微信/支付宝账单中核对支付记录
4. **审核订单**：
   - 通过：调用API `POST /api/payment/admin/verify` 开通会员
   - 拒绝：填写拒绝原因

## API接口

### 创建订单
```http
POST /api/payment/personal/create
Content-Type: application/json
Authorization: Bearer {token}

{
  "plan": "premium",
  "amount": 99,
  "paymentMethod": "wechat",
  "period": "monthly"
}
```

### 提交支付凭证
```http
POST /api/payment/personal/submit-proof
Content-Type: application/json
Authorization: Bearer {token}

{
  "orderId": "ORD-xxx",
  "transactionId": "微信支付订单号",
  "screenshotUrl": "截图URL",
  "payerName": "付款人姓名",
  "notes": "备注"
}
```

### 管理员审核订单
```http
POST /api/payment/admin/verify
Content-Type: application/json
Authorization: Bearer {token}

{
  "orderId": "ORD-xxx",
  "verified": true,
  "notes": "审核通过"
}
```

### 获取待审核订单
```http
GET /api/payment/admin/pending?page=1&limit=20
Authorization: Bearer {token}
```

## 图片上传

支付截图会上传到 Supabase Storage。需要创建存储桶：

```sql
-- 创建存储桶
insert into storage.buckets (id, name, public) 
values ('payments', 'payments', true);

-- 设置存储桶权限
create policy "Allow authenticated uploads" on storage.objects
  for insert to authenticated with check (bucket_id = 'payments');

create policy "Allow public read" on storage.objects
  for select to anon using (bucket_id = 'payments');
```

## 数据库表

系统使用现有的 `membership_orders` 表，会自动添加以下字段：

- `payment_type`: 'personal_qr' 标识为个人收款码支付
- `payment_code`: 支付识别码
- `payment_proof`: 支付凭证（JSON格式）
- `payer_info`: 付款人信息
- `verified_by`: 审核人ID
- `verified_at`: 审核时间

## 注意事项

### 安全性

1. **收款码保护**：不要将收款码暴露在公开场合
2. **金额核对**：审核时务必核对支付金额与订单金额一致
3. **识别码匹配**：建议要求用户在支付备注中填写识别码

### 用户体验

1. **响应时间**：尽量在24小时内完成审核
2. **通知机制**：审核通过后及时通知用户
3. **客服支持**：提供客服渠道处理支付问题

### 合规性

1. **税务问题**：个人收款达到一定金额可能需要申报税务
2. **退款处理**：需要手动处理退款请求
3. **交易限额**：个人收款码可能有单日/单笔限额

## 替代方案

如果个人收款码不适合您，可以考虑：

1. **Stripe**：支持国际信用卡，需要香港公司
2. **PayPal**：国际支付，个人可用
3. **Paddle**：适合SaaS的支付平台
4. **企业支付**：注册公司后申请微信/支付宝商户号

## 常见问题

### Q: 用户支付后没有提交凭证怎么办？

A: 系统会在订单创建时发送通知给您，您也可以定期查看待审核订单。如果用户长时间未提交，可以主动联系用户。

### Q: 如何防止用户伪造支付凭证？

A: 
- 要求用户填写支付订单号（在微信/支付宝账单中可查）
- 要求上传支付截图
- 您在收款记录中核对
- 使用支付识别码进行匹配

### Q: 可以自动审核吗？

A: 个人收款码无法自动回调，但可以通过以下方式半自动化：
- 接入微信支付/支付宝的账单查询API
- 使用RPA工具自动抓取账单
- 设置关键词提醒

### Q: 退款怎么处理？

A: 个人收款码需要手动退款：
1. 用户申请退款
2. 您通过微信/支付宝手动转账退款
3. 在后台标记订单为已退款
