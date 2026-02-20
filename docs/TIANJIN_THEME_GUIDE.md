# 天津文化主题深化使用指南

> 文档版本：v1.0  
> 更新日期：2026-02-20  
> 适用平台：津脉智坊

---

## 快速开始

### 1. 引入主题样式

在项目的入口文件（如 `main.tsx` 或 `App.tsx`）中引入天津文化主题样式：

```typescript
// 引入天津文化主题深化版样式
import './styles/themes/tianjin-enhanced.css';
```

### 2. 使用主题组件

```typescript
import {
  TianjinCard,
  TianjinButton,
  TianjinBadge,
  TianjinIcon,
} from '../components/TianjinThemeComponents';

// 在你的组件中使用
function MyComponent() {
  return (
    <div className="tianjin-enhanced">
      <TianjinCard variant="haihe">
        <h3>海河文化</h3>
        <p>探索天津海河沿岸的历史文化</p>
        <TianjinBadge variant="jinmen">津门特色</TianjinBadge>
      </TianjinCard>
      
      <TianjinButton variant="haihe">
        了解更多
      </TianjinButton>
    </div>
  );
}
```

---

## 主题色彩系统

### 核心色彩

| 色彩名称 | 变量名 | 色值 | 应用场景 |
|---------|-------|------|---------|
| **海河蓝** | `--haihe-500` | `#1E5F8E` | 主色调、品牌标识 |
| **砖红** | `--brick-500` | `#A0522D` | 历史建筑、传统元素 |
| **泥人张红** | `--niren-500` | `#C21807` | 重要操作、强调色 |
| **杨柳青绿** | `--yangliuqing-500` | `#228B22` | 成功状态、自然主题 |
| **风筝魏蓝** | `--fengzheng-500` | `#87CEEB` | 信息提示、链接 |
| **桂发祥金** | `--guifaxiang-500` | `#C68E17` | VIP标识、会员等级 |
| **狗不理棕** | `--goubuli-500` | `#8B4513` | 暖色场景、美食主题 |

### 使用色彩变量

```css
.my-component {
  color: var(--haihe-500);
  background: var(--yangliuqing-100);
  border-color: var(--brick-300);
}
```

---

## 组件使用指南

### TianjinCard 卡片组件

#### 基础用法

```tsx
<TianjinCard variant="haihe">
  <h3>卡片标题</h3>
  <p>卡片内容</p>
</TianjinCard>
```

#### 变体类型

| 变体 | 描述 | 适用场景 |
|-----|------|---------|
| `haihe` | 海河波纹卡片 | 默认内容展示 |
| `brick` | 五大道砖墙卡片 | 历史文化内容 |
| `nianhua` | 杨柳青年画卡片 | 艺术文化内容 |
| `clay` | 泥人张泥塑卡片 | 传统工艺内容 |
| `kite` | 风筝魏轻盈卡片 | 创意轻盈内容 |
| `golden` | 桂发祥金贵卡片 | VIP/会员内容 |

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
|-----|------|-------|-----|
| `variant` | `string` | `'haihe'` | 卡片变体类型 |
| `className` | `string` | `''` | 自定义类名 |
| `onClick` | `function` | - | 点击事件 |
| `hoverable` | `boolean` | `true` | 是否启用悬停效果 |

---

### TianjinButton 按钮组件

#### 基础用法

```tsx
<TianjinButton variant="haihe" size="md">
  点击按钮
</TianjinButton>
```

#### 变体类型

| 变体 | 描述 | 适用场景 |
|-----|------|---------|
| `haihe` | 海河蓝按钮 | 主要操作 |
| `nirenzhang` | 泥人张红按钮 | 重要/危险操作 |
| `yangliuqing` | 杨柳青绿按钮 | 成功/确认操作 |
| `guifaxiang` | 桂发祥金按钮 | VIP/特殊操作 |

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
|-----|------|-------|-----|
| `variant` | `string` | `'haihe'` | 按钮变体类型 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 按钮尺寸 |
| `className` | `string` | `''` | 自定义类名 |
| `onClick` | `function` | - | 点击事件 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `loading` | `boolean` | `false` | 是否加载中 |
| `icon` | `ReactNode` | - | 图标元素 |

---

### TianjinBadge 徽章组件

#### 基础用法

```tsx
<TianjinBadge variant="jinmen">津门特色</TianjinBadge>
```

#### 变体类型

| 变体 | 描述 | 适用场景 |
|-----|------|---------|
| `laozihao` | 老字号徽章 | 中华老字号标识 |
| `feiyi` | 非遗徽章 | 非物质文化遗产标识 |
| `jinmen` | 津门特色徽章 | 天津特色内容标识 |
| `vip-gold` | VIP金徽章 | VIP/会员等级标识 |

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
|-----|------|-------|-----|
| `variant` | `string` | `'jinmen'` | 徽章变体类型 |
| `className` | `string` | `''` | 自定义类名 |
| `icon` | `ReactNode` | - | 自定义图标 |

---

### TianjinIcon 图标组件

#### 基础用法

```tsx
<TianjinIcon name="haihe" size={32} animated />
```

#### 图标类型

| 名称 | 描述 | 动画支持 |
|-----|------|---------|
| `haihe` | 海河波浪 | ❌ |
| `tianjin-eye` | 天津之眼 | ✅ |
| `nirenzhang` | 泥人张 | ❌ |
| `yangliuqing` | 杨柳青 | ❌ |
| `fengzheng` | 风筝魏 | ✅ |
| `guifaxiang` | 桂发祥 | ❌ |
| `goubuli` | 狗不理 | ❌ |

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
|-----|------|-------|-----|
| `name` | `string` | - | 图标名称（必填） |
| `size` | `number` | `24` | 图标尺寸 |
| `className` | `string` | `''` | 自定义类名 |
| `animated` | `boolean` | `false` | 是否启用动画 |

---

### 其他组件

#### TianjinDivider 分隔线

```tsx
<TianjinDivider variant="haihe" />
```

#### TianjinEyeDecoration 天津之眼装饰

```tsx
<TianjinEyeDecoration size={200} />
```

#### JinmenShowcase 津门特色展示

```tsx
<JinmenShowcase
  title="探索天津文化"
  description="天津是一座拥有600多年历史的文化名城"
  features={[
    { icon: <Palette />, text: '传统工艺' },
    { icon: <Award />, text: '老字号' },
  ]}
/>
```

#### LaozihaoShowcase 老字号展示

```tsx
<LaozihaoShowcase
  name="泥人张彩塑"
  category="泥人张"
  founded="清代道光年间"
  description="泥人张彩塑是天津传统民间艺术"
/>
```

---

## 传统纹样

### 可用纹样

| 纹样名称 | CSS变量 | 描述 |
|---------|---------|------|
| 云纹 | `--pattern-cloud` | 传统祥云图案 |
| 水波纹 | `--pattern-wave` | 海河波浪图案 |
| 砖墙纹 | `--pattern-brick` | 五大道砖墙纹理 |
| 回纹 | `--pattern-huiwen` | 传统回字纹 |
| 鱼鳞纹 | `--pattern-fishscale` | 传统鱼鳞图案 |

### 使用纹样

```css
.my-element {
  background: var(--pattern-wave);
  background-size: 40px 20px;
}
```

---

## 动效系统

### 可用动画

| 动画名称 | 类名 | 描述 |
|---------|------|------|
| 海河波浪 | `.animate-haihe-wave` | 波浪起伏动画 |
| 天津之眼旋转 | `.animate-tianjin-eye` | 摩天轮旋转动画 |
| 泥塑呼吸 | `.animate-clay-breathe` | 泥塑质感呼吸动画 |
| 风筝飘动 | `.animate-kite-float` | 风筝飘浮动画 |
| 金光闪烁 | `.animate-golden-shimmer` | 金色光泽动画 |
| 云纹飘动 | `.animate-cloud-drift` | 云纹流动动画 |

### 使用动画

```tsx
<div className="animate-haihe-wave">
  海河波浪动画内容
</div>
```

---

## 暗色模式

天津文化主题支持暗色模式，只需在父元素添加 `.dark` 类：

```tsx
<div className="tianjin-enhanced dark">
  {/* 暗色模式下的内容 */}
</div>
```

---

## 最佳实践

### 1. 主题包装

建议在应用根组件包裹主题类：

```tsx
function App() {
  const { theme } = useTheme();
  
  return (
    <div className={theme === 'tianjin-enhanced' ? 'tianjin-enhanced' : ''}>
      {/* 应用内容 */}
    </div>
  );
}
```

### 2. 响应式设计

主题已内置响应式适配，无需额外处理：

- 移动端自动增强对比度
- 触控友好的按钮尺寸（最小48px）
- 减少动画以节省电量

### 3. 无障碍支持

- 支持 `prefers-reduced-motion` 媒体查询
- 色彩对比度符合 WCAG AA 标准
- 所有交互元素支持键盘导航

### 4. 性能优化

- 使用 CSS 变量实现零运行时开销
- 动画使用 GPU 加速
- 按需加载组件

---

## 示例页面

查看完整的主题展示页面：

```bash
# 启动开发服务器
pnpm dev

# 访问主题展示页面
http://localhost:5173/tianjin-theme-demo
```

或查看代码：
- 展示页面：`src/pages/TianjinThemeDemo.tsx`
- 组件库：`src/components/TianjinThemeComponents.tsx`
- 样式文件：`src/styles/themes/tianjin-enhanced.css`

---

## 主题配置

主题已集成到系统主题配置中：

```typescript
// 在主题选择器中使用
import { themeConfig } from '../config/themeConfig';

// 天津文化主题深化版
const tianjinEnhancedTheme = themeConfig.find(
  t => t.value === 'tianjin-enhanced'
);
```

---

## 定制扩展

### 添加新的色彩

```css
.tianjin-enhanced {
  --my-custom-color: #FF6B6B;
}
```

### 创建新的卡片变体

```css
.tianjin-enhanced .card-custom {
  /* 自定义样式 */
}
```

### 扩展图标

```typescript
// 在 TianjinIcon 组件中添加
const iconConfigs = {
  // ... 现有图标
  myIcon: {
    color: '#FF6B6B',
    icon: <svg>...</svg>,
  },
};
```

---

## 故障排除

### 样式不生效

1. 确保已引入 `tianjin-enhanced.css`
2. 确保父元素有 `tianjin-enhanced` 类
3. 检查 CSS 变量是否正确定义

### 动画不工作

1. 检查是否启用了 `prefers-reduced-motion`
2. 确保动画类名拼写正确
3. 检查父元素是否设置了 `overflow: hidden`

### 图标不显示

1. 检查图标名称是否正确
2. 确保已导入 `TianjinIcon` 组件
3. 检查是否有 CSS 冲突

---

## 更新日志

### v1.0 (2026-02-20)

- ✨ 初始版本发布
- 🎨 6套天津文化色彩系统
- 🃏 6种特色卡片变体
- 🔘 4种特色按钮变体
- 🏷️ 4种特色徽章
- 🎭 7个文化图标
- 🌊 6种传统纹样
- ✨ 6种动效动画
- 🌙 暗色模式支持
- 📱 响应式适配

---

## 相关文档

- [UI/UX优化方案](./UI_UX_OPTIMIZATION_PLAN.md)
- [主题配置文档](../src/config/themeConfig.ts)
- [设计系统组件](../src/components/DesignSystem.tsx)

---

**维护团队**：津脉智坊前端团队  
**联系方式**：frontend@jinmaizhifang.com
