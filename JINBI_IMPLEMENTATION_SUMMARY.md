# 津币会员体系升级实施总结

## 已完成的工作

### 一、数据库层

1. **创建津币相关表** (`create_jinbi_tables.sql`)
   - `user_jinbi_balance` - 用户津币余额表
   - `jinbi_records` - 津币记录表
   - `jinbi_consumption_details` - 津币消费明细表
   - `jinbi_packages` - 津币套餐表
   - `membership_jinbi_config` - 会员津币配置表
   - `service_pricing` - 服务计费标准表

2. **修改现有表**
   - `users` 表添加津币相关字段
   - `membership_orders` 表添加津币赠送字段

### 二、后端服务层

1. **津币服务** (`src/services/jinbiService.ts`)
   - 余额查询与管理
   - 津币消费（带事务）
   - 津币发放
   - 消费记录查询
   - 余额检查
   - 服务计费标准查询

2. **服务端路由** (`server/routes/jinbi.mjs`)
   - GET `/api/jinbi/balance` - 获取余额
   - GET `/api/jinbi/records` - 获取记录
   - POST `/api/jinbi/consume` - 消费津币
   - POST `/api/jinbi/grant` - 发放津币
   - GET `/api/jinbi/packages` - 获取套餐
   - GET `/api/jinbi/pricing` - 获取计费标准
   - GET `/api/jinbi/stats` - 获取统计

3. **会员服务升级** (`src/services/membershipService.ts`)
   - 添加 `grantMembershipJinbi` 方法
   - 会员升级时自动发放津币
   - 支持月付/季付/年付不同倍数的津币奖励

### 三、前端Hook和组件

1. **津币Hook** (`src/hooks/useJinbi.ts`)
   - 余额管理
   - 记录查询
   - 消费操作
   - 自动刷新
   - 事件监听

2. **津币余额组件** (`src/components/jinbi/JinbiBalance.tsx`)
   - 显示当前余额
   - 显示本月统计
   - 快捷充值入口

3. **津币不足弹窗** (`src/components/jinbi/JinbiInsufficientModal.tsx`)
   - 余额不足提示
   - 引导充值
   - 引导升级会员

4. **津币消费指示器** (`src/components/jinbi/JinbiCostIndicator.tsx`)
   - 显示服务消耗
   - 余额检查
   - 余额不足提示

### 四、页面实现

1. **津币管理页面** (`src/pages/JinbiManagement.tsx`)
   - 津币总览
   - 收支记录
   - 充值套餐
   - 快捷入口

2. **会员中心升级** (`src/pages/Membership.tsx`)
   - 集成津币统计
   - 右侧栏显示津币月度统计

3. **津小脉Agent计费集成** (`src/pages/create/agent/components/ChatPanel.tsx`)
   - 发送消息前检查津币余额
   - 消费津币（10津币/轮）
   - 显示津币余额和消费提示
   - 余额不足弹窗引导

## 津币计费标准

| 服务类型 | 基础消耗 | 说明 |
|----------|----------|------|
| 津小脉Agent对话 | 10津币/轮 | 每轮对话消耗 |
| 图像生成-标准 | 50津币/张 | 1024x1024 |
| 图像生成-HD | 100津币/张 | 2048x2048 |
| 图像生成-超清 | 200津币/张 | 4096x4096 |
| 视频生成-5秒 | 200津币/个 | 720p |
| 视频生成-10秒 | 400津币/个 | 1080p |
| 视频生成-30秒 | 1000津币/个 | 1080p |
| 文案生成 | 20津币/次 | 单次生成 |
| 音频生成 | 100津币/次 | 30秒内 |
| 高清导出 | 50津币/次 | 去除水印 |
| 超清导出 | 100津币/次 | 4K导出 |

## 会员等级与津币

| 等级 | 月付价格 | 每月津币 | 并发数 | 存储空间 | 消费折扣 |
|------|----------|----------|--------|----------|----------|
| Free | ¥0 | 0 | 1 | 1GB | 无折扣 |
| Base | ¥29 | 1000 | 3 | 10GB | 95折 |
| Pro | ¥99 | 3000 | 5 | 50GB | 9折 |
| Star | ¥199 | 8000 | 10 | 200GB | 85折 |
| VIP | ¥399 | 20000 | 20 | 无限 | 8折 |

## 津币获取途径

1. **会员赠送** - 每月根据会员等级自动发放
2. **每日签到** - 连续签到奖励递增
3. **任务奖励** - 完成平台任务
4. **邀请好友** - 好友注册并消费后奖励
5. **活动赠送** - 平台活动、节日福利
6. **直接购买** - 津币充值包

## 后续建议

### 需要继续完成的工作

1. **图像/视频生成计费集成**
   - 在图像生成页面添加津币检查
   - 在视频生成页面添加津币检查
   - 根据分辨率/时长计算费用

2. **文案/音频生成计费集成**
   - 在文案生成页面添加津币检查
   - 在音频生成页面添加津币检查

3. **导出功能计费集成**
   - 高清导出扣费
   - 超清导出扣费

4. **支付集成**
   - 津币充值支付流程
   - 支付回调处理

5. **签到系统升级**
   - 签到发放津币
   - 连续签到奖励

6. **任务系统升级**
   - 任务奖励发放津币

### 测试建议

1. 测试津币消费流程
2. 测试余额不足处理
3. 测试会员升级津币发放
4. 测试并发消费场景
5. 测试充值流程

## 文件清单

### 新建文件
- `create_jinbi_tables.sql` - 数据库表创建脚本
- `src/services/jinbiService.ts` - 津币服务
- `server/routes/jinbi.mjs` - 服务端路由
- `src/hooks/useJinbi.ts` - 津币Hook
- `src/components/jinbi/JinbiBalance.tsx` - 津币余额组件
- `src/components/jinbi/JinbiInsufficientModal.tsx` - 津币不足弹窗
- `src/components/jinbi/JinbiCostIndicator.tsx` - 津币消费指示器
- `src/pages/JinbiManagement.tsx` - 津币管理页面

### 修改文件
- `src/services/membershipService.ts` - 添加津币发放逻辑
- `src/pages/Membership.tsx` - 集成津币统计
- `src/components/membership/RightSidebar.tsx` - 添加津币统计展示
- `src/pages/create/agent/components/ChatPanel.tsx` - 集成津币计费

## 注意事项

1. 匿名用户（未登录）不扣除津币
2. 津币消费使用事务保证数据一致性
3. 会员升级时按月/季/年不同倍数发放津币
4. 购买的津币永久有效，赠送的津币有有效期
