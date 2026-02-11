# 签到问题诊断

## 问题描述
用户签到时出现两个消息：
1. ✅ 绿色消息："获得 15 积分！连续签到 3 天，获得 15 积分（含 10 额外奖励）"
2. ❌ 红色消息："添加积分失败"

## 分析

### 成功消息来源
绿色消息来自 `useSupabasePoints.ts` 中的 `checkin` 函数（第 434-438 行）：
```typescript
if (result.success) {
  toast.success(
    bonusPoints > 0
      ? `🎉 连续签到 ${consecutiveDays} 天！获得 ${totalPoints} 积分`
      : `✅ 签到成功！获得 ${totalPoints} 积分`
  );
  // ...
}
```

### 失败消息来源
红色消息 "添加积分失败" 来自 `useSupabasePoints.ts` 中的 `addPoints` 函数（第 318 行）：
```typescript
if (result.success) {
  toast.success(`成功获得 ${points} 积分！`);
  // ...
} else {
  toast.error(result.error || '添加积分失败');  // <-- 这里
  return false;
}
```

## 可能的原因

1. **重复调用**：页面中有两个不同的组件同时调用了积分添加功能
   - `checkin` 函数内部调用 `supabasePointsService.addPoints`（成功）
   - 另一个地方调用 `addPoints` 函数（失败）

2. **并发问题**：用户快速点击签到按钮，导致并发请求

3. **数据库限制**：
   - 积分限制（每日上限）
   - 重复记录检查

## 建议检查

1. 检查浏览器控制台是否有其他错误信息
2. 检查 Network 标签页是否有多个 `update_user_points_balance` RPC 调用
3. 检查是否同时打开了 Dashboard 和 Checkin 页面

## 修复建议

### 方案 1：添加防抖处理
在 `useSupabasePoints.ts` 的 `checkin` 函数中添加防抖：

```typescript
const checkin = useCallback(async () => {
  // 防止重复提交
  if (isLoading) return { success: false };
  
  // ... 原有代码
}, [userId, checkinRecords, refreshCheckinStatus, refreshBalance, isLoading]);
```

### 方案 2：统一错误处理
修改 `checkin` 函数，在调用 `addPoints` 失败时不抛出错误，而是记录日志：

```typescript
// 添加积分
const result = await supabasePointsService.addPoints(
  userId,
  totalPoints,
  '每日签到',
  'daily',
  // ...
);

if (result.success) {
  // ... 成功处理
} else {
  // 不抛出错误，只记录日志
  console.error('添加积分失败:', result.error);
  // 签到记录已创建，所以仍然返回成功
  return { success: true, points: totalPoints, consecutiveDays };
}
```

### 方案 3：检查数据库限制
检查 `update_user_points_balance` RPC 函数是否有以下限制：
- 每日积分上限
- 重复签到检查
- 用户积分余额表是否存在

## 需要用户协助

请提供以下信息：
1. 浏览器控制台（F12）的错误日志
2. Network 标签页中 `update_user_points_balance` 的调用情况
3. 是否同时打开了多个标签页
