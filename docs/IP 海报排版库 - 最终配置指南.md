# IP 海报排版库 - 最终配置指南

## 🎯 问题根源

由于 Trae IDE 的 sandbox 环境限制，无法直接访问 `c:\git-repo\津小脉 IP` 目录中的图片文件。

## ✅ 解决方案（按推荐顺序）

### 方案 1：在您的本地环境中使用（推荐）

**IP 海报排版库的所有代码已经完成**，您只需要在本地环境中：

1. **确保图片文件存在**
   ```
   c:\git-repo\津小脉 IP\
   ├── 289a0978e1635838b6e3a4e111a51d5e.png
   ├── 359c9b83b6029a90fded5b65d98b2aa5.png
   └── ... (共 8 张)
   ```

2. **重启开发服务器**
   ```bash
   # 停止当前服务器（Ctrl+C）
   npm run dev
   ```

3. **访问测试页面**
   打开浏览器访问：`http://localhost:3005/test-ip-images.html`
   
   这个页面会显示所有 8 张图片，如果图片加载失败，说明需要配置 Vite。

4. **如果图片无法显示，执行以下命令**：
   ```powershell
   # 以管理员身份运行 PowerShell
   cd c:\git-repo
   
   # 创建符号链接（推荐）
   New-Item -ItemType SymbolicLink -Path "c:\git-repo\public\津小脉 IP" -Target "c:\git-repo\津小脉 IP" -Force
   
   # 或者复制图片
   Copy-Item "c:\git-repo\津小脉 IP\*.png" -Destination "c:\git-repo\public\images\jinxiaomi-ip\" -Force
   ```

### 方案 2：使用在线占位图片（临时方案）

如果您只是想看效果，可以暂时使用在线图片。

修改 `src/data/ipPosterLayouts.ts`：

```typescript
{
  id: 'jxm-001',
  name: '国潮风尚·雪豹小吉',
  thumbnail: 'https://via.placeholder.com/400x600/C02C38/FFFFFF?text=国潮风尚', // 占位图
  // ...
}
```

### 方案 3：使用本地上传的图片

在 Agent 页面中，您可以：
1. 点击"上传参考"按钮
2. 选择本地的津小脉 IP 图片
3. 系统会自动使用您上传的图片

## 📝 代码说明

### 已完成的文件

1. **类型定义**: `src/types/ipPosterLayout.ts` ✅
2. **数据配置**: `src/data/ipPosterLayouts.ts` ✅
3. **服务层**: `src/services/ipPosterService.ts` ✅
4. **排版库组件**: `src/pages/agent/components/IPPosterLibrary.tsx` ✅
5. **排版选择器**: `src/pages/agent/components/IPPosterSelector.tsx` ✅
6. **集成到 ChatPanel**: `src/pages/agent/components/ChatPanel.tsx` ✅
7. **Vite 配置**: `vite.config.ts` ✅

### 图片路径配置

当前配置的路径：
```typescript
thumbnail: '/津小脉 IP/289a0978e1635838b6e3a4e111a51d5e.png'
```

这个路径在 Vite 开发服务器中会被解析为：
```
http://localhost:3005/津小脉 IP/289a0978e1635838b6e3a4e111a51d5e.png
```

## 🔧 故障排除步骤

### 步骤 1：检查文件是否存在
```powershell
Get-ChildItem "c:\git-repo\津小脉 IP\*.png"
```

应该看到 8 个 PNG 文件。

### 步骤 2：检查 Vite 配置
确保 `vite.config.ts` 包含：
```typescript
fs: {
  allow: [
    __dirname,
    path.join(__dirname, '津小脉 IP'),
  ],
}
```

### 步骤 3：测试图片 URL
在浏览器中直接访问：
```
http://localhost:3005/津小脉 IP/289a0978e1635838b6e3a4e111a51d5e.png
```

### 步骤 4：查看浏览器控制台
按 F12 打开开发者工具，查看：
- Console 标签的错误信息
- Network 标签的图片请求状态

### 步骤 5：清除缓存
```
Ctrl + Shift + Delete
```
或者强制刷新：
```
Ctrl + F5
```

## 🎨 使用示例

### 在 Agent 中使用排版库

1. 打开 Agent 页面
2. 点击底部工具栏的"排版库"按钮
3. 浏览或搜索排版
4. 点击选择的排版
5. 输入框会自动插入 `@排版名`
6. 继续描述您的需求

### 代码中使用

```typescript
import { ipPosterService } from '@/services/ipPosterService';

// 获取所有排版
const layouts = ipPosterService.getAllLayouts();

// 获取特定分类
const guochaoLayouts = ipPosterService.getLayoutsByCategory('guochao');

// 搜索排版
const results = ipPosterService.searchLayouts('国潮');
```

## 📊 功能清单

- ✅ 8 个专业排版布局
- ✅ 分类筛选（全部、国潮风、游戏风、博物馆风、经典款、现代风）
- ✅ 搜索功能（按名称、描述、标签）
- ✅ 收藏功能（保存到 localStorage）
- ✅ 主题支持（深色/浅色）
- ✅ 响应式设计
- ✅ 流畅动画
- ✅ 集成到 Agent 对话

## 🚀 下一步

1. **在您的本地环境中重启开发服务器**
2. **访问测试页面验证图片**
3. **打开 Agent 页面使用排版库**

如果还有问题，请告诉我具体的错误信息！
