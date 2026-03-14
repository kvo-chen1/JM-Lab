# 津脉智坊 - UI 增强组件使用指南

## 📋 概述

本文档介绍如何使用 `ui-enhanced` 目录下的增强组件，这些组件提供了精美的动画效果和交互体验。

---

## 🎯 快速开始

### 1. 导入组件

```tsx
import {
  EnhancedButton,
  ToastProvider,
  useToast,
  EmptyState,
  ErrorState,
  Modal,
  PageTransition,
  SkeletonLoader,
  SkeletonCard,
  FormField,
  FloatingLabelInput
} from '@/components/ui-enhanced';
```

### 2. 引入样式

在你的主样式文件（如 `main.tsx` 或 `App.tsx`）中引入样式：

```tsx
import '@/styles/ui-enhanced.css';
```

### 3. 包裹应用（Toast）

在应用的根组件中添加 `ToastProvider`：

```tsx
import { ToastProvider } from '@/components/ui-enhanced';

function App() {
  return (
    <ToastProvider>
      {/* 你的应用内容 */}
    </ToastProvider>
  );
}
```

---

## 🧩 组件详细说明

### 1. EnhancedButton - 增强按钮

**特性：**
- 光泽动画效果
- 弹簧动画（悬停/点击）
- 渐变背景
- 加载状态
- 图标支持

**使用示例：**

```tsx
import { EnhancedButton } from '@/components/ui-enhanced';
import { Plus, Save } from 'lucide-react';

// 基础使用
<EnhancedButton>点击我</EnhancedButton>

// 主按钮
<EnhancedButton variant="primary">确认</EnhancedButton>

// 危险按钮
<EnhancedButton variant="danger">删除</EnhancedButton>

// 成功按钮
<EnhancedButton variant="success">保存</EnhancedButton>

// 带图标
<EnhancedButton leftIcon={<Plus size={16} />}>
  添加项目
</EnhancedButton>

// 加载状态
<EnhancedButton isLoading={isLoading}>
  {isLoading ? '保存中...' : '保存'}
</EnhancedButton>

// 不同尺寸
<EnhancedButton size="sm">小按钮</EnhancedButton>
<EnhancedButton size="md">默认</EnhancedButton>
<EnhancedButton size="lg">大按钮</EnhancedButton>
<EnhancedButton size="icon"><Save size={20} /></EnhancedButton>

// 全宽
<EnhancedButton fullWidth>提交</EnhancedButton>
```

### 2. Toast - 通知提示

**特性：**
- 四种类型（success/error/warning/info）
- 弹簧动画效果
- 自动关闭进度条
- 支持手动关闭

**使用示例：**

```tsx
import { useToast } from '@/components/ui-enhanced';

function MyComponent() {
  const { addToast } = useToast();

  const handleSuccess = () => {
    addToast({
      type: 'success',
      message: '操作成功！',
      duration: 3000 // 可选，默认 4000ms
    });
  };

  const handleError = () => {
    addToast({
      type: 'error',
      message: '操作失败，请重试'
    });
  };

  return (
    <div>
      <button onClick={handleSuccess}>成功提示</button>
      <button onClick={handleError}>错误提示</button>
    </div>
  );
}
```

### 3. EmptyState - 空状态

**特性：**
- 图标浮动动画
- 支持四种变体
- 操作按钮支持

**使用示例：**

```tsx
import { EmptyState } from '@/components/ui-enhanced';
import { FolderOpen, Plus } from 'lucide-react';
import { EnhancedButton } from '@/components/ui-enhanced';

// 基础使用
<EmptyState
  icon={<FolderOpen size={64} />}
  title="暂无内容"
  description="还没有创建任何项目，点击下方按钮开始吧"
  action={
    <EnhancedButton leftIcon={<Plus size={16} />}>
      创建项目
    </EnhancedButton>
  }
/>

// 不同变体
<EmptyState
  variant="warning"
  icon={<AlertTriangle size={64} />}
  title="权限不足"
  description="您没有权限访问此内容"
/>
```

### 4. ErrorState - 错误状态

**特性：**
- 图标摇晃动画
- 重试/关闭按钮
- 精美样式

**使用示例：**

```tsx
import { ErrorState } from '@/components/ui-enhanced';

<ErrorState
  error="网络连接失败，请检查您的网络设置"
  onRetry={() => console.log('重试')}
  onDismiss={() => console.log('关闭')}
/>
```

### 5. Modal - 模态框

**特性：**
- 背景模糊效果
- 弹簧动画
- 支持多种尺寸
- 关闭按钮/点击背景关闭

**使用示例：**

```tsx
import { useState } from 'react';
import { Modal } from '@/components/ui-enhanced';
import { EnhancedButton } from '@/components/ui-enhanced';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <EnhancedButton onClick={() => setIsOpen(true)}>
        打开模态框
      </EnhancedButton>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="编辑资料"
        size="lg"
      >
        <div className="space-y-4">
          {/* 模态框内容 */}
          <p>这是模态框的内容</p>
          
          <div className="flex justify-end gap-3">
            <EnhancedButton variant="ghost" onClick={() => setIsOpen(false)}>
              取消
            </EnhancedButton>
            <EnhancedButton onClick={() => setIsOpen(false)}>
              确认
            </EnhancedButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
```

### 6. PageTransition - 页面过渡

**特性：**
- 淡入上滑动画
- 列表项交错动画
- 滚动触发动画

**使用示例：**

```tsx
import { PageTransition, StaggeredList, RevealOnScroll } from '@/components/ui-enhanced';

// 页面过渡
function Page() {
  return (
    <PageTransition>
      <div>页面内容</div>
    </PageTransition>
  );
}

// 交错列表
const items = [1, 2, 3, 4, 5];
<StaggeredList
  items={items}
  renderItem={(item, index) => (
    <div key={index} className="p-4">Item {item}</div>
  )}
/>

// 滚动触发
<RevealOnScroll>
  <div>向下滚动我会出现</div>
</RevealOnScroll>

// 带延迟的滚动触发
<RevealOnScroll delay={0.2}>
  <div>延迟0.2秒出现</div>
</RevealOnScroll>
```

### 7. SkeletonLoader - 骨架屏加载

**特性：**
- 流光动画
- 多种变体
- 预制卡片/列表组件

**使用示例：**

```tsx
import { SkeletonLoader, SkeletonCard, SkeletonList } from '@/components/ui-enhanced';

// 基础使用
<SkeletonLoader variant="rect" width="200px" height="24px" />

// 多个加载项
<SkeletonLoader 
  variant="text" 
  count={3} 
  width="100%" 
  height="16px" 
/>

// 圆形（头像）
<SkeletonLoader variant="circle" width="48px" height="48px" />

// 预制卡片
<SkeletonCard hasImage={true} lines={3} />

// 预制列表
<SkeletonList count={5} />
```

### 8. FormField - 表单字段

**特性：**
- 验证状态动画
- 错误/成功图标
- 浮动标签输入

**使用示例：**

```tsx
import { useState } from 'react';
import { FormField, FloatingLabelInput } from '@/components/ui-enhanced';

function Form() {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const error = value.length < 3 ? '至少需要3个字符' : undefined;

  return (
    <div className="space-y-6">
      {/* 基础表单字段 */}
      <FormField
        label="用户名"
        error={error}
        touched={touched}
        hint="3-20个字符"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setTouched(true)}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </FormField>

      {/* 浮动标签输入 */}
      <FloatingLabelInput
        label="邮箱地址"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={error}
        touched={touched}
      />
    </div>
  );
}
```

---

## 🎨 工具类样式

### CSS 类名

```tsx
// 卡片悬停效果
<div className="card-enhanced">卡片内容</div>

// 边框发光
<div className="card-border-glow">带发光边框的卡片</div>

// 触摸涟漪
<button className="touch-ripple">点击我</button>

// 触摸目标尺寸
<button className="touch-target">符合44px标准</button>

// 微妙渐变
<div className="gradient-subtle">背景</div>

// 多层阴影
<div className="shadow-elevation-1">阴影1</div>
<div className="shadow-elevation-2">阴影2</div>
<div className="shadow-elevation-3">阴影3</div>

// 文字渐变
<span className="text-gradient-primary">渐变文字</span>

// 精致边框
<div className="border-subtle">微妙边框</div>
<div className="border-gradient">渐变边框</div>

// 智能分隔线
<hr className="divider-smart" />

// 自定义滚动条
<div className="custom-scrollbar overflow-auto">内容</div>

// 隐藏滚动条
<div className="scrollbar-hide overflow-auto">内容</div>
```

---

## 📱 完整示例

```tsx
import { useState, useEffect } from 'react';
import {
  ToastProvider,
  useToast,
  EnhancedButton,
  EmptyState,
  Modal,
  PageTransition,
  SkeletonCard,
  FormField,
  RevealOnScroll
} from '@/components/ui-enhanced';
import { Plus, FolderOpen, Search } from 'lucide-react';

function Content() {
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = () => {
    setIsModalOpen(true);
  };

  const handleSave = () => {
    setIsModalOpen(false);
    addToast({ type: 'success', message: '创建成功！' });
  };

  return (
    <PageTransition>
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">我的项目</h1>
        
        <div className="mb-8">
          <EnhancedButton 
            leftIcon={<Plus size={16} />}
            onClick={handleCreate}
          >
            新建项目
          </EnhancedButton>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            <EmptyState
              icon={<FolderOpen size={64} />}
              title="暂无项目"
              description="点击上方按钮创建您的第一个项目"
              action={
                <EnhancedButton leftIcon={<Plus size={16} />} onClick={handleCreate}>
                  创建项目
                </EnhancedButton>
              }
            />
            
            <RevealOnScroll className="mt-12">
              <div className="p-6 bg-gray-50 rounded-xl">
                <h2 className="text-xl font-semibold mb-4">提示</h2>
                <p>向下滚动可以看到更多内容</p>
              </div>
            </RevealOnScroll>
          </>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="新建项目"
        >
          <FormField label="项目名称" hint="输入项目名称">
            <input className="w-full px-4 py-2 border rounded-lg" placeholder="我的项目" />
          </FormField>
          
          <div className="flex justify-end gap-3 mt-6">
            <EnhancedButton variant="ghost" onClick={() => setIsModalOpen(false)}>
              取消
            </EnhancedButton>
            <EnhancedButton onClick={handleSave}>
              创建
            </EnhancedButton>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Content />
    </ToastProvider>
  );
}
```

---

## 🎯 最佳实践

1. **动画性能**：不要过度使用动画，保持简洁
2. **深色模式**：所有组件都支持深色模式
3. **无障碍**：确保关键操作有键盘导航支持
4. **响应式**：组件已内置响应式支持

---

## 📚 总结

这套UI增强组件提供了：
- ✨ 精美的微交互效果
- 🎨 统一的设计语言
- 📱 完整的响应式支持
- 🌙 深色模式支持
- 🚀 开箱即用的体验

开始使用它们来提升您的用户体验吧！
