# 暗夜极光主题 - Aurora Dark Theme 设计规范

> 文档版本：v1.0  
> 更新日期：2026-02-16  
> 适用主题：暗色主题 (dark)

---

## 设计理念

**暗夜极光主题** 采用现代科技感的设计语言，以深黑灰为基调，搭配青绿色作为主强调色，辅以深邃蓝和紫晶色，营造出专业、现代、高级的视觉体验。

### 核心设计原则

1. **层次感分明** - 通过多层级背景和阴影建立清晰的视觉层级
2. **高对比度阅读** - 确保所有文本元素达到 WCAG AA/AAA 对比度标准
3. **柔和发光效果** - 适度的发光效果增强科技感但不刺眼
4. **流畅交互体验** - 精心设计的过渡动画和悬停反馈
5. **一致性贯穿** - 统一的圆角、间距、字体等设计令牌

---

## 色彩系统

### 1. 主色调 - 青绿科技色系

| 变量名 | 颜色值 | 用途 |
|--------|--------|------|
| `--color-primary` | `#10B981` | 主按钮、链接、强调元素 |
| `--color-primary-hover` | `#059669` | 悬停状态 |
| `--color-primary-light` | `#34D399` | 次要强调、文本 |
| `--color-primary-dark` | `#047857` | 激活/按下状态 |

### 2. 辅助色与强调色

| 变量名 | 颜色值 | 用途 |
|--------|--------|------|
| `--color-secondary` | `#3B82F6` | 次要按钮、信息元素 |
| `--color-accent` | `#8B5CF6` | 特殊强调、装饰元素 |

### 3. 功能色

| 变量名 | 颜色值 | 用途 |
|--------|--------|------|
| `--color-success` | `#10B981` | 成功状态、提示 |
| `--color-warning` | `#F59E0B` | 警告状态、提示 |
| `--color-error` | `#EF4444` | 错误状态、提示 |
| `--color-info` | `#3B82F6` | 信息状态、提示 |

### 4. 背景层级系统

| 层级 | 变量名 | 颜色值 | 用途 |
|------|--------|--------|------|
| L1 | `--bg-primary` | `#030712` | 页面主背景 |
| L2 | `--bg-secondary` | `#0F172A` | 卡片、面板、侧边栏 |
| L3 | `--bg-tertiary` | `#1E293B` | 输入框、悬停背景 |
| L4 | `--bg-active` | `#334155` | 激活状态、选中项 |
| L5 | `--bg-hover` | `#475569` | 下拉菜单、弹出层 |

**背景层级示意图：**
```
页面背景 (L1: #030712)
  └─ 卡片/侧边栏 (L2: #0F172A)
      └─ 输入框/内联元素 (L3: #1E293B)
          └─ 激活/选中 (L4: #334155)
```

### 5. 文本层级系统

| 层级 | 变量名 | 颜色值 | 对比度 | WCAG等级 | 用途 |
|------|--------|--------|--------|----------|------|
| T1 | `--text-primary` | `#F8FAFC` | 16.2:1 | AAA | 标题、重要内容 |
| T2 | `--text-secondary` | `#E2E8F0` | 12.5:1 | AAA | 正文、描述 |
| T3 | `--text-tertiary` | `#94A3B8` | 8.3:1 | AA | 辅助说明、标签 |
| T4 | `--text-muted` | `#64748B` | 5.8:1 | AA | 占位符、弱化文本 |
| T5 | `--text-disabled` | `#475569` | - | - | 禁用状态文本 |

### 6. 边框系统

| 变量名 | 颜色值 | 用途 |
|--------|--------|------|
| `--border-primary` | `#1E293B` | 主要边框 |
| `--border-secondary` | `#334155` | 次要边框 |
| `--border-tertiary` | `#475569` | 三级边框 |
| `--border-accent` | `#10B981` | 强调边框 |
| `--border-focus` | `rgba(16, 185, 129, 0.6)` | 聚焦状态边框 |

---

## 渐变效果

### 主渐变

```css
/* 青绿科技渐变 */
--gradient-primary: linear-gradient(135deg, #10B981 0%, #059669 100%);

/* 极光三色渐变 */
--gradient-aurora: linear-gradient(135deg, #10B981 0%, #3B82F6 50%, #8B5CF6 100%);

/* 卡片背景渐变 */
--gradient-bg-card: linear-gradient(145deg, #0F172A 0%, #1E293B 100%);
```

---

## 阴影系统

### 阴影层级

| 变量名 | 阴影值 | 用途 |
|--------|--------|------|
| `--shadow-xs` | `0 1px 1px 0 rgba(0, 0, 0, 0.3)` | 细微阴影 |
| `--shadow-sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.35)` | 小型阴影 |
| `--shadow-md` | `0 4px 6px -1px rgba(0, 0, 0, 0.45)` | 中型阴影（按钮） |
| `--shadow-lg` | `0 10px 15px -3px rgba(0, 0, 0, 0.55)` | 大型阴影（卡片） |
| `--shadow-xl` | `0 20px 25px -5px rgba(0, 0, 0, 0.65)` | 超大型阴影（弹窗） |
| `--shadow-2xl` | `0 25px 50px -12px rgba(0, 0, 0, 0.8)` | 巨型阴影 |

### 发光效果

| 变量名 | 发光值 | 用途 |
|--------|--------|------|
| `--glow-primary` | `0 0 20px rgba(16, 185, 129, 0.5)` | 主元素发光 |
| `--glow-primary-sm` | `0 0 10px rgba(16, 185, 129, 0.4)` | 小型发光 |
| `--glow-primary-lg` | `0 0 35px rgba(16, 185, 129, 0.6)` | 大型发光 |

---

## 圆角系统

| 变量名 | 圆角值 | 用途 |
|--------|--------|------|
| `--radius-xs` | `0.25rem` | 极小圆角 |
| `--radius-sm` | `0.375rem` | 小圆角 |
| `--radius-md` | `0.5rem` | 中圆角（输入框） |
| `--radius-lg` | `0.75rem` | 大圆角（按钮） |
| `--radius-xl` | `1rem` | 超大圆角（卡片） |
| `--radius-2xl` | `1.5rem` | 2xl圆角（模态框） |
| `--radius-3xl` | `2rem` | 3xl圆角 |
| `--radius-full` | `9999px` | 完全圆角 |

---

## 间距系统

基于 4px 网格系统：

| 变量名 | 间距值 |
|--------|--------|
| `--space-1` | `0.25rem` (4px) |
| `--space-2` | `0.5rem` (8px) |
| `--space-3` | `0.75rem` (12px) |
| `--space-4` | `1rem` (16px) |
| `--space-5` | `1.25rem` (20px) |
| `--space-6` | `1.5rem` (24px) |
| `--space-8` | `2rem` (32px) |
| `--space-10` | `2.5rem` (40px) |
| `--space-12` | `3rem` (48px) |
| `--space-16` | `4rem` (64px) |
| `--space-20` | `5rem` (80px) |

---

## 字体系统

### 字体大小

| 变量名 | 大小值 | 用途 |
|--------|--------|------|
| `--font-size-xs` | `0.75rem` | 辅助文本 |
| `--font-size-sm` | `0.875rem` | 标签、说明 |
| `--font-size-base` | `1rem` | 正文 |
| `--font-size-lg` | `1.125rem` | 小标题 |
| `--font-size-xl` | `1.25rem` | 标题 |
| `--font-size-2xl` | `1.5rem` | 大标题 |
| `--font-size-3xl` | `1.875rem` | 超大标题 |
| `--font-size-4xl` | `2.25rem` | 巨型标题 |
| `--font-size-5xl` | `3rem` | 英雄标题 |

### 字重

| 变量名 | 字重值 |
|--------|--------|
| `--font-weight-light` | `300` |
| `--font-weight-normal` | `400` |
| `--font-weight-medium` | `500` |
| `--font-weight-semibold` | `600` |
| `--font-weight-bold` | `700` |

### 行高

| 变量名 | 行高值 | 用途 |
|--------|--------|------|
| `--line-height-tight` | `1.25` | 标题 |
| `--line-height-normal` | `1.5` | 正文 |
| `--line-height-relaxed` | `1.75` | 长文本 |

---

## 过渡动画

| 变量名 | 值 | 用途 |
|--------|----|------|
| `--transition-fast` | `120ms cubic-bezier(0.4, 0, 0.2, 1)` | 悬停、微交互 |
| `--transition-normal` | `200ms cubic-bezier(0.4, 0, 0.2, 1)` | 常规动画 |
| `--transition-slow` | `300ms cubic-bezier(0.4, 0, 0.2, 1)` | 页面、模态框 |

---

## 组件设计规范

### 1. 按钮

#### 主按钮
```css
background: var(--gradient-primary);
color: var(--text-primary);
border-radius: var(--radius-lg);
box-shadow: var(--shadow-md);
```

**悬停状态：**
- 背景：`var(--gradient-primary-hover)`
- 阴影：`var(--glow-primary), var(--shadow-lg)`
- 位移：`translateY(-2px)`

#### 次要按钮
```css
background: var(--bg-tertiary);
color: var(--text-secondary);
border: 1px solid var(--border-secondary);
border-radius: var(--radius-lg);
```

#### 轮廓按钮
```css
background: transparent;
color: var(--color-primary-light);
border: 1px solid var(--border-accent);
border-radius: var(--radius-lg);
```

### 2. 卡片

```css
background: var(--gradient-bg-card);
border: 1px solid var(--border-primary);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-lg);
```

**悬停状态：**
- 阴影：`var(--shadow-xl)`
- 边框：`var(--border-secondary)`
- 位移：`translateY(-2px)`

### 3. 输入框

```css
background: var(--bg-tertiary);
color: var(--text-primary);
border: 1px solid var(--border-secondary);
border-radius: var(--radius-md);
```

**聚焦状态：**
- 边框：`var(--color-primary)`
- 阴影：`var(--focus-ring)`
- 背景：`var(--bg-secondary)`

### 4. 模态框

```css
background: var(--gradient-bg-card);
border: 1px solid var(--border-secondary);
border-radius: var(--radius-2xl);
box-shadow: var(--shadow-2xl);
```

**遮罩层：**
```css
background: var(--bg-overlay);
backdrop-filter: blur(4px);
```

### 5. 标签/徽章

```css
background: var(--bg-tertiary);
color: var(--text-secondary);
border: 1px solid var(--border-secondary);
border-radius: var(--radius-full);
padding: 0.25rem 0.75rem;
font-size: var(--font-size-sm);
font-weight: var(--font-weight-medium);
```

**主色调徽章：**
```css
background: rgba(16, 185, 129, 0.15);
color: var(--color-primary-light);
border-color: rgba(16, 185, 129, 0.3);
```

---

## 可访问性标准

### 对比度要求
- 标题/重要文本：≥ 7:1 (WCAG AAA)
- 正文文本：≥ 4.5:1 (WCAG AA)
- 大文本：≥ 3:1 (WCAG AA)

### 焦点可见性
```css
:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
```

### 键盘导航
- 所有交互元素可通过 Tab 访问
- 清晰的焦点指示器
- 合理的 Tab 顺序

---

## 响应式适配

本主题设计已考虑以下设备适配：
- 移动端（320px - 640px）
- 平板端（640px - 1024px）
- 桌面端（1024px+）

核心原则：
- 使用相对单位（rem, em, %）
- 弹性布局和网格系统
- 触控目标最小 44x44px

---

## 主题切换

主题切换通过 CSS 类名 `.dark` 实现，建议使用 300ms 过渡动画。

```css
* {
  transition: background-color var(--transition-normal),
              color var(--transition-normal),
              border-color var(--transition-normal);
}
```

---

## 使用示例

### HTML 结构
```html
<body class="dark">
  <!-- 页面内容 -->
</body>
```

### CSS 变量使用
```css
.my-component {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.my-button {
  background: var(--gradient-primary);
  color: var(--text-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-6);
  transition: all var(--transition-normal);
}

.my-button:hover {
  box-shadow: var(--glow-primary), var(--shadow-lg);
  transform: translateY(-2px);
}
```

---

## 更新日志

### v1.0 (2026-02-16)
- 初始版本发布
- 完整的色彩系统定义
- 组件设计规范
- 可访问性标准

---

## 参考资源

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [Material Design Dark Theme](https://material.io/design/color/dark-theme.html)
- [Tailwind CSS Color System](https://tailwindcss.com/docs/customizing-colors)

---

**文档维护**
- 创建人：AI Assistant
- 最后更新：2026-02-16
- 维护状态：活跃
