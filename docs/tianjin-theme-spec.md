# 天津城市特色主题设计规范

## 概述

**主题名称**：津门雅韵 (Tianjin Theme)  
**设计理念**：古今交融、中西合璧  
**设计灵感**：海河蓝、历史砖红、活力金黄、生态翠绿、现代银白

---

## 一、色彩系统

### 1.1 核心色彩定义

#### 主色调 - 海河蓝 (Haihe Blue)
| 格式 | 色值 |
|------|------|
| HEX | #1E5F8E |
| RGB | 30, 95, 142 |
| CMYK | 79, 33, 0, 44 |

**文化内涵**：取自海河水的深蓝色调，体现天津作为港口城市的开放与包容，同时象征城市天际线的现代感。

#### 辅助色1 - 历史砖红 (Brick Red)
| 格式 | 色值 |
|------|------|
| HEX | #A0522D |
| RGB | 160, 82, 45 |
| CMYK | 0, 49, 72, 37 |

**文化内涵**：源自五大道历史建筑的砖红色，体现天津近代历史底蕴和租界建筑特色。

#### 辅助色2 - 活力金黄 (Vibrant Gold)
| 格式 | 色值 |
|------|------|
| HEX | #D4A84B |
| RGB | 212, 168, 75 |
| CMYK | 0, 21, 65, 17 |

**文化内涵**：象征天津的商业繁荣和活力，呼应"九河下梢"的黄金水道地位。

#### 辅助色3 - 生态翠绿 (Eco Green)
| 格式 | 色值 |
|------|------|
| HEX | #4A9B5E |
| RGB | 74, 155, 94 |
| CMYK | 52, 0, 39, 39 |

**文化内涵**：代表天津城市绿化和生态环境，体现"绿色天津"发展理念。

#### 辅助色4 - 现代银白 (Modern Silver)
| 格式 | 色值 |
|------|------|
| HEX | #C0C5CE |
| RGB | 192, 197, 206 |
| CMYK | 7, 4, 0, 19 |

**文化内涵**：展现天津现代都市风貌，如天津之眼、津塔等现代地标建筑。

### 1.2 中性色系列

#### 白色系列
| 名称 | HEX | 用途 |
|------|-----|------|
| 纯白 | #FFFFFF | 卡片背景 |
| 乳白 | #F8F6F3 | 主背景 |
| 米白 | #F0EDE8 | 第三层背景 |

#### 灰色系列
| 名称 | HEX | 用途 |
|------|-----|------|
| 浅灰 | #E8E5E0 | 边框、分隔线 |
| 中灰 | #9A9590 | 次要文字 |
| 深灰 | #4A4744 | 主要文字 |

#### 黑色系列
| 名称 | HEX | 用途 |
|------|-----|------|
| 炭黑 | #2C2A28 | 标题文字（夜间模式） |
| 墨黑 | #1A1918 | 深色背景（夜间模式） |

---

## 二、老字号元素融合

### 2.1 天津代表性老字号色彩提取

| 老字号 | 品牌色 | HEX | 应用建议 |
|--------|--------|-----|----------|
| 狗不理包子 | 暖棕 | #8B4513 | 强调色、按钮hover状态 |
| 耳朵眼炸糕 | 金黄 | #FFD700 | 高亮元素、成功状态 |
| 桂发祥麻花 | 焦糖 | #C68E17 | 警告提示、特殊标记 |
| 泥人张 | 朱砂红 | #C21807 | 主按钮、重要操作 |
| 杨柳青年画 | 翠绿 | #228B22 | 成功状态、生态元素 |
| 风筝魏 | 天蓝 | #87CEEB | 信息提示、链接色 |

### 2.2 老字号色彩基因融入方案

```css
/* 泥人张红 - 重要操作 */
--brand-nirenzhang: #C21807;

/* 杨柳青绿 - 成功状态 */
--brand-yangliuqing: #228B22;

/* 风筝魏蓝 - 信息提示 */
--brand-fengzhengwei: #87CEEB;

/* 桂发祥金 - VIP标识 */
--brand-guifaxiang: #C68E17;

/* 狗不理棕 - 暖色装饰 */
--brand-goubuli: #8B4513;
```

---

## 三、平台适配规范

### 3.1 移动端适配
- 主色调饱和度提高10%，确保小屏幕可读性
- 按钮尺寸最小44x44px，符合触控标准
- 文字对比度≥4.5:1，符合WCAG AA标准

### 3.2 桌面端适配
- 色彩层次更丰富，支持更多视觉层次
- 支持hover状态的色彩变化
- 更大的色彩渐变区域

### 3.3 色值规范表

| 用途 | 移动端HEX | 桌面端HEX | WCAG等级 |
|------|-----------|-----------|----------|
| 主文字 | #0F0E0D | #1A1918 | AAA |
| 次文字 | #6B6660 | #4A4744 | AA |
| 辅助文字 | #9A9590 | #7A756F | AA |
| 禁用文字 | #C5C0BA | #B5B0AA | - |
| 主按钮 | #2471A8 | #1E5F8E | AA |
| 次按钮 | #B8623A | #A0522D | AA |

---

## 四、应用场景规划

### 4.1 日常模式 (Daily Mode)

```css
--bg-primary: #F8F6F3;
--bg-secondary: #FFFFFF;
--color-primary: #1E5F8E;
--color-secondary: #A0522D;
```

### 4.2 节日模式 (Festival Mode)

```css
--bg-primary: #FFF8E7;
--bg-secondary: #FFFAF0;
--color-primary: #C68E17;
--color-secondary: #D4A84B;
--gradient-primary: linear-gradient(135deg, #FFF8E7 0%, #FFFAF0 50%, #FFEFD5 100%);
```

### 4.3 夜间模式 (Night Mode)

```css
--bg-primary: #1A1918;
--bg-secondary: #2C2A28;
--text-primary: #F0EDE8;
--color-primary: #4A90B8;
--glow-primary: 0 0 20px rgba(74, 144, 184, 0.4);
```

---

## 五、文化内涵解读

### 5.1 海河蓝 - 城市血脉
海河是天津的母亲河，蓝色象征着开放、包容和连接。选择深邃的海河蓝作为主色调，既体现了天津作为港口城市的海洋文化，又象征着城市与世界的紧密联系。

### 5.2 历史砖红 - 近代记忆
五大道的红砖建筑是天津近代历史的见证。砖红色传达出历史的厚重感和文化的传承，让现代设计充满历史温度。

### 5.3 活力金黄 - 商业繁荣
天津自古就是商业重镇，金黄色象征着财富、繁荣和机遇。这一色彩体现了天津人敢为人先、开拓进取的商业精神。

### 5.4 生态翠绿 - 绿色未来
翠绿色代表天津对生态文明建设的追求，体现了"绿水青山就是金山银山"的发展理念，展现城市的可持续发展愿景。

### 5.5 现代银白 - 都市风貌
银白色象征着天津现代化都市的简洁、高效和未来感，如天津之眼、津塔等现代地标所展现的都市魅力。

---

## 六、CSS变量参考

### 6.1 色彩变量

```css
/* 核心色彩 */
--color-primary: #1E5F8E;           /* 海河蓝 */
--color-secondary: #A0522D;         /* 历史砖红 */
--color-accent: #D4A84B;            /* 活力金黄 */
--color-success: #4A9B5E;           /* 生态翠绿 */
--color-neutral: #C0C5CE;           /* 现代银白 */

/* 老字号色彩 */
--brand-nirenzhang: #C21807;        /* 泥人张红 */
--brand-yangliuqing: #228B22;       /* 杨柳青绿 */
--brand-fengzhengwei: #87CEEB;      /* 风筝魏蓝 */
--brand-guifaxiang: #C68E17;        /* 桂发祥金 */
--brand-goubuli: #8B4513;           /* 狗不理棕 */
```

### 6.2 背景变量

```css
--bg-primary: #F8F6F3;
--bg-secondary: #FFFFFF;
--bg-tertiary: #F0EDE8;
--bg-hover: #E8E5E0;
--bg-active: #DCD8D2;
--bg-muted: #F5F3F0;
```

### 6.3 文字变量

```css
--text-primary: #1A1918;
--text-secondary: #4A4744;
--text-tertiary: #7A756F;
--text-muted: #9A9590;
--text-inverse: #FFFFFF;
```

### 6.4 渐变变量

```css
--gradient-primary: linear-gradient(135deg, #F8F6F3 0%, #FFFFFF 50%, #F0EDE8 100%);
--gradient-secondary: linear-gradient(135deg, #FFFFFF 0%, #F8F6F3 100%);
--gradient-accent: linear-gradient(135deg, #1E5F8E 0%, #4A90B8 100%);
--gradient-warm: linear-gradient(135deg, #A0522D 0%, #C17A54 100%);
--gradient-gold: linear-gradient(135deg, #D4A84B 0%, #E8C878 50%, #C68E17 100%);
--gradient-eco: linear-gradient(135deg, #4A9B5E 0%, #6BB87E 100%);
```

---

## 七、使用示例

### 7.1 基础用法

```html
<!-- 启用天津主题 -->
<html class="tianjin">
  <body>
    <div class="card">
      <h1>天津主题卡片</h1>
      <button class="primary">主按钮</button>
      <button class="secondary">次按钮</button>
      <button class="vip">VIP按钮</button>
    </div>
  </body>
</html>
```

### 7.2 React组件中使用

```tsx
import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme('tianjin')}>
      切换到天津主题
    </button>
  );
}
```

### 7.3 自定义样式

```css
.my-custom-component {
  background: var(--gradient-primary);
  color: var(--text-primary);
  border: 2px solid var(--color-primary);
  box-shadow: var(--shadow-md);
}

.my-custom-component:hover {
  box-shadow: var(--shadow-lg), var(--glow-primary);
}
```

---

## 八、WCAG可访问性合规

### 8.1 对比度标准

| 元素组合 | 对比度 | 等级 |
|----------|--------|------|
| 主文字 (#1A1918) / 背景 (#F8F6F3) | 15.2:1 | AAA |
| 次文字 (#4A4744) / 背景 (#FFFFFF) | 9.1:1 | AAA |
| 主按钮 (#1E5F8E) / 背景 (#FFFFFF) | 5.8:1 | AA |
| 次按钮 (#A0522D) / 背景 (#FFFFFF) | 5.2:1 | AA |

### 8.2 无障碍支持

- 支持键盘导航
- 支持屏幕阅读器
- 支持高对比度模式
- 支持色彩反转

---

## 九、版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0.0 | 2026-02-13 | 初始版本，包含完整的天津城市特色主题系统 |

---

## 十、参考资源

- [天津城市形象设计指南](https://example.com/tianjin-brand)
- [WCAG 2.1 色彩对比度标准](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [天津老字号品牌官网](https://example.com/tianjin-brands)

---

*本规范由设计团队维护，如有问题请联系设计负责人。*
