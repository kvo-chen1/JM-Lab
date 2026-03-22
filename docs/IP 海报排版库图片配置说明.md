# IP 海报排版库 - 图片配置说明

## 问题说明

IP 海报排版库组件已经创建完成，代码中引用的图片路径为 `/津小脉 IP/*.png`。

由于 Vite 的安全限制和开发服务器配置，需要确保图片能够被正确访问。

## 解决方案

### 方案一：使用已配置的 fs.allow（推荐）

我已经更新了 `vite.config.ts`，添加了 `fs.allow` 配置，允许访问 `津小脉 IP` 目录。

**现在可以直接访问图片，无需复制！**

图片路径配置：
```typescript
thumbnail: '/津小脉 IP/289a0978e1635838b6e3a4e111a51d5e.png'
```

访问 URL：`http://localhost:3005/津小脉 IP/289a0978e1635838b6e3a4e111a51d5e.png`

### 方案二：手动复制到 public 目录

如果方案一不起作用，可以手动复制图片到 public 目录：

```powershell
# PowerShell 命令
Copy-Item "c:\git-repo\津小脉 IP\*.png" -Destination "c:\git-repo\public\images\jinxiaomi-ip\" -Force
```

然后修改 `src/data/ipPosterLayouts.ts` 中的路径：

```typescript
thumbnail: '/images/jinxiaomi-ip/289a0978e1635838b6e3a4e111a51d5e.png'
```

### 方案三：使用符号链接（需要管理员权限）

```powershell
# 以管理员身份运行 PowerShell
New-Item -ItemType SymbolicLink -Path "c:\git-repo\public\津小脉 IP" -Target "c:\git-repo\津小脉 IP"
```

## 验证配置

1. 启动开发服务器：`npm run dev`
2. 打开浏览器访问：`http://localhost:3005`
3. 点击 Agent 页面底部的"排版库"按钮
4. 检查图片是否正常显示

## 故障排除

### 图片仍然无法显示

1. **检查浏览器控制台**
   - 按 F12 打开开发者工具
   - 查看 Console 和 Network 标签
   - 确认图片请求的 URL 是否正确

2. **检查文件权限**
   - 确保 `津小脉 IP` 目录有读取权限
   - 尝试以管理员身份运行 VS Code 和浏览器

3. **清除缓存**
   - 按 Ctrl+Shift+Delete 清除浏览器缓存
   - 或者使用 Ctrl+F5 强制刷新

4. **重启开发服务器**
   ```bash
   # 停止服务器（Ctrl+C）
   # 重新启动
   npm run dev
   ```

### 使用替代方案

如果以上方案都不可行，可以暂时使用 Unsplash 占位图片：

```typescript
thumbnail: 'https://images.unsplash.com/photo-1582739501019-5c4aa6e949d9?w=400&h=600&fit=crop'
```

## 生产环境部署

在生产环境中，建议将图片复制到 `public/images/jinxiaomi-ip/` 目录，并更新构建脚本：

```json
{
  "scripts": {
    "build": "npm run copy-images && vite build",
    "copy-images": "node scripts/copy-images.js"
  }
}
```

## 联系支持

如果仍然遇到问题，请提供：
1. 浏览器控制台的错误信息
2. Network 标签中的图片请求 URL
3. 开发服务器的日志
