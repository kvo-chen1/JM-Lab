# IP 海报排版库使用指南

## 概述

IP 海报排版库是一个用于管理和选择 IP 海报排版布局的功能模块，类似于风格库，专注于提供多种专业的海报排版模板。

## 功能特性

### 1. 排版库主组件（IPPosterLibrary）

- **网格展示**：以卡片网格形式展示所有排版布局
- **分类筛选**：支持按分类筛选（全部、国潮风、游戏风、博物馆风、经典款、现代风）
- **搜索功能**：支持按名称、描述、标签搜索排版
- **收藏功能**：支持收藏喜欢的排版，方便快速访问
- **预览功能**：鼠标悬停可预览排版缩略图
- **主题支持**：完美支持深色/浅色主题

### 2. 排版选择器组件（IPPosterSelector）

- **简洁展示**：在 Agent 对话中快速展示推荐的排版选项
- **快速选择**：点击即可选择排版布局
- **视觉反馈**：清晰显示当前选中的排版

## 使用方法

### 在 Agent 对话中使用

1. **打开排版库**
   - 在 Agent 对话界面底部，点击"排版库"按钮
   - 排版库面板会从右侧滑出

2. **浏览排版**
   - 使用顶部分类标签筛选不同类型的排版
   - 使用搜索框搜索特定排版
   - 点击"收藏"标签查看已收藏的排版

3. **选择排版**
   - 点击任意排版卡片即可选择
   - 选中的排版会自动在输入框中插入 `@排版名`
   - 系统会显示成功提示

4. **收藏排版**
   - 点击排版卡片左上角的心形图标
   - 收藏的排版可以在"收藏"标签中快速找到

### 在代码中使用

#### 导入组件

```typescript
import { IPPosterLibrary, IPPosterSelector } from '@/pages/agent/components';
```

#### 使用 IPPosterLibrary

```tsx
<IPPosterLibrary
  onLayoutSelect={(layout) => {
    console.log('选中的排版:', layout);
    // 处理排版选择逻辑
  }}
  onClose={() => setShowLibrary(false)}
  currentLayoutId={selectedLayoutId}
/>
```

#### 使用 IPPosterSelector

```tsx
<IPPosterSelector
  selectedLayoutId={selectedLayoutId}
  onSelect={(layout) => {
    console.log('选中的排版:', layout);
    // 处理排版选择逻辑
  }}
/>
```

## 数据结构

### IPPosterLayout

```typescript
interface IPPosterLayout {
  id: string;              // 排版唯一标识
  name: string;            // 排版名称
  description: string;     // 排版描述
  thumbnail: string;       // 缩略图路径
  imagePath: string;       // 完整图片路径
  category: string[];      // 分类标签
  tags: string[];          // 标签
  width?: number;          // 宽度（像素）
  height?: number;         // 高度（像素）
  aspectRatio?: string;    // 宽高比
  usage?: string;          // 使用场景说明
}
```

## 可用的排版布局

目前提供 8 种专业排版布局：

1. **国潮风尚·雪豹小吉** - 传统文化元素与现代设计融合
2. **游戏风·瓦当神韵** - 暗色背景，霓虹发光效果
3. **博物馆风·釉趣横生** - 深色优雅，展品式展示
4. **经典展示·津小脉** - 主视觉大图 + 三视图 + 表情包
5. **清新简约·海河之夜** - 清新色调，简洁布局
6. **创意拼贴·天津印象** - 创意拼贴，多元素组合
7. **时尚潮流·都市脉动** - 时尚现代，大胆用色
8. **文化传承·津门韵味** - 传统文化，精致细节

## 自定义排版

### 添加新排版

编辑 `src/data/ipPosterLayouts.ts` 文件，添加新的排版配置：

```typescript
{
  id: 'jxm-009',
  name: '新排版名称',
  description: '排版描述',
  thumbnail: '/images/jinxiaomi-ip/thumbnail.png',
  imagePath: '/images/jinxiaomi-ip/full.png',
  category: ['guochao', 'modern'],
  tags: ['标签 1', '标签 2'],
  width: 1200,
  height: 2000,
  aspectRatio: '3:5',
  usage: '适用场景说明'
}
```

### 添加新分类

编辑 `src/data/ipPosterLayouts.ts` 中的 `IP_POSTER_CATEGORIES` 数组：

```typescript
export const IP_POSTER_CATEGORIES = [
  { id: 'all', name: '全部', icon: 'grid' },
  { id: 'guochao', name: '国潮风', icon: 'landmark' },
  // 添加新分类
  { id: 'new-category', name: '新分类', icon: 'star' },
];
```

## 服务层 API

### ipPosterService

```typescript
import { ipPosterService } from '@/services/ipPosterService';

// 获取所有排版
const allLayouts = ipPosterService.getAllLayouts();

// 根据 ID 获取排版
const layout = ipPosterService.getLayoutById('jxm-001');

// 根据分类获取排版
const guochaoLayouts = ipPosterService.getLayoutsByCategory('guochao');

// 搜索排版
const results = ipPosterService.searchLayouts('国潮');

// 获取收藏
const favorites = ipPosterService.getFavoriteLayouts();

// 切换收藏
const isFavorite = ipPosterService.toggleFavorite('jxm-001');

// 获取所有分类
const categories = ipPosterService.getAllCategories();

// 获取所有标签
const tags = ipPosterService.getAllTags();
```

## 技术细节

### 图片路径

排版图片存储在 `public/images/jinxiaomi-ip/` 目录下，使用相对路径访问。

### 本地存储

收藏数据保存在 `localStorage` 中，键名为 `ipPosterFavorites`。

### 响应式设计

组件使用 Tailwind CSS 的响应式网格系统：
- 移动端：单列展示
- 平板端：双列展示
- 桌面端：根据面板宽度自适应

### 动画效果

使用 Framer Motion 实现流畅的动画效果：
- 卡片进入动画
- 悬停缩放效果
- 面板滑入/滑出动画

## 最佳实践

1. **性能优化**
   - 图片使用懒加载（`loading="lazy"`）
   - 使用错误处理确保图片加载失败时显示占位图

2. **用户体验**
   - 提供清晰的视觉反馈
   - 支持键盘导航
   - 加载状态提示

3. **可访问性**
   - 所有图片都有 alt 文本
   - 按钮有清晰的标签
   - 支持屏幕阅读器

## 故障排除

### 图片无法加载

检查：
1. 图片文件是否存在于 `public/images/jinxiaomi-ip/` 目录
2. 路径是否正确
3. 文件名是否匹配

### 组件不显示

检查：
1. 是否正确导入组件
2. 父容器是否有足够的高度
3. 主题配置是否正确

### 收藏功能失效

检查：
1. localStorage 是否可用
2. 浏览器是否允许存储数据
3. 清除缓存后重试

## 更新日志

### v1.0.0 (2026-03-21)
- ✨ 初始版本发布
- ✨ 支持 8 种专业排版布局
- ✨ 分类筛选和搜索功能
- ✨ 收藏功能
- ✨ 集成到 Agent 对话

## 未来计划

- [ ] 支持自定义排版创建
- [ ] 支持排版预览大图
- [ ] 添加更多排版模板
- [ ] 支持排版组合使用
- [ ] 导出排版为 PDF/PNG

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个功能！

## 许可证

MIT License
