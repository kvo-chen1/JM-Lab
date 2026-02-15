# 品牌向导草稿自动保存与恢复功能

## 功能概述

品牌向导现已实现完整的草稿自动保存与恢复机制，确保用户在创作过程中的数据不会丢失，并支持跨页面状态保持。

## 已实现功能

### 1. 自动保存机制 ✅

**文件**: [`workflowContext.tsx`](src/contexts/workflowContext.tsx)

- **自动保存间隔**: 30秒
- **触发条件**: 状态变化且有品牌选择时
- **存储位置**: localStorage + Supabase (云端同步)
- **状态检测**: 实时检测是否有未保存的更改 (isDirty)

```typescript
// 自动保存逻辑
useEffect(() => {
  const hasChanges = JSON.stringify(state) !== JSON.stringify(lastStateRef.current);
  if (hasChanges && state.brandName) {
    setIsDirty(true);
    // 30秒后自动保存
    autoSaveTimerRef.current = setTimeout(() => {
      saveToDrafts(state.currentStep || 1);
    }, 30000);
  }
}, [state]);
```

### 2. 草稿存储服务 ✅

**文件**: [`brandWizardDraftService.ts`](src/services/brandWizardDraftService.ts)

支持以下操作：
- `getAllDrafts()` - 获取所有草稿（本地+云端合并）
- `saveDraft()` - 保存草稿
- `saveWorkflowState()` - 快速保存工作流状态
- `loadDraft()` - 加载草稿
- `deleteDraft()` - 删除草稿
- `searchDrafts()` - 搜索草稿

**存储策略**:
- 本地: localStorage (`brand_wizard_drafts`)
- 云端: Supabase (`brand_wizard_drafts` 表)
- 自动同步: 登录用户自动同步到云端

### 3. 草稿恢复功能 ✅

**文件**: [`Wizard.tsx`](src/pages/Wizard.tsx)

支持两种恢复方式：

#### A. URL参数恢复
```
/wizard?draft={draftId}
```
从草稿箱点击草稿时，通过URL参数加载指定草稿。

#### B. 本地状态自动恢复
当用户重新打开品牌向导时，自动检测并恢复上次未完成的编辑状态。

### 4. 用户体验优化 ✅

#### 草稿恢复提示弹窗
- 显示草稿来源（URL加载/本地恢复）
- 展示品牌名称、当前步骤、完成进度
- 显示最后保存时间
- 提供"继续编辑"和"放弃草稿"两个选项

#### 自动保存状态指示器
位于底部导航栏，显示三种状态：
- 🟡 **有未保存更改**: 黄色提示，带呼吸动画
- 🟢 **已保存**: 绿色提示，显示上次保存时间
- ⚪ **等待保存**: 灰色提示，草稿将自动保存

#### 手动保存按钮
底部导航栏提供"保存草稿"按钮，支持即时保存。

### 5. 草稿箱管理 ✅

**文件**: [`Drafts.tsx`](src/pages/Drafts.tsx)

功能特性：
- 分类筛选: 全部、收藏、AI写作、品牌向导、活动提交
- 搜索功能: 按名称、品牌、内容搜索
- 排序选项: 最新修改、最早创建、名称排序
- 视图切换: 网格/列表视图
- 草稿操作: 加载、删除、导出

## 数据流图

```
用户操作
    ↓
WorkflowContext (状态管理)
    ↓
自动保存检测 (30秒间隔)
    ↓
brandWizardDraftService
    ├──→ localStorage (本地存储)
    └──→ Supabase (云端同步)
    ↓
草稿恢复
    ├──→ URL参数: /wizard?draft={id}
    └──→ 本地状态: 自动检测恢复
```

## 使用说明

### 对于用户

1. **自动保存**: 创作过程中系统每30秒自动保存进度
2. **手动保存**: 点击底部"保存草稿"按钮即时保存
3. **恢复草稿**: 
   - 从草稿箱点击草稿自动恢复
   - 重新进入品牌向导时自动提示恢复
4. **放弃草稿**: 在恢复提示中选择"放弃草稿"可重新开始

### 对于开发者

1. **状态管理**: 使用 `useWorkflow()` hook 访问状态和方法
2. **保存草稿**: 调用 `saveToDrafts(currentStep)`
3. **加载草稿**: 调用 `loadFromDraft(draftId)`
4. **重置状态**: 调用 `reset()` 清除当前状态

## 技术细节

### localStorage Keys
- `workflow_current_state` - 当前工作流状态
- `workflow_current_step` - 当前步骤
- `brand_wizard_drafts` - 草稿列表

### 数据库表
```sql
brand_wizard_drafts:
  - id: string (PK)
  - user_id: uuid (FK)
  - title: string
  - brand_name: string
  - brand_id: string
  - current_step: int
  - data: jsonb
  - thumbnail: string
  - created_at: timestamp
  - updated_at: timestamp
```

## 未来优化建议

1. **增量保存**: 只保存变化的部分，减少存储空间
2. **版本历史**: 支持查看和恢复草稿的历史版本
3. **冲突解决**: 处理本地和云端草稿的冲突
4. **草稿预览**: 在草稿箱中显示草稿的缩略图预览
5. **定时备份**: 在关键操作节点自动创建备份点

## 相关文件

- [`src/pages/Wizard.tsx`](src/pages/Wizard.tsx) - 品牌向导主页面
- [`src/contexts/workflowContext.tsx`](src/contexts/workflowContext.tsx) - 工作流状态管理
- [`src/services/brandWizardDraftService.ts`](src/services/brandWizardDraftService.ts) - 草稿服务
- [`src/pages/Drafts.tsx`](src/pages/Drafts.tsx) - 草稿箱页面
- [`supabase/migrations/20260219000002_create_brand_wizard_drafts.sql`](supabase/migrations/20260219000002_create_brand_wizard_drafts.sql) - 数据库迁移
