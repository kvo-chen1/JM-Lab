# Trae CN 性能优化完全指南

## 🔍 诊断结果

根据系统检测，发现以下问题：

| 项目 | 状态 | 详情 |
|------|------|------|
| CPU | ✅ 良好 | Intel Core Ultra 5 125H |
| 内存使用 | ⚠️ 偏高 | Trae CN 占用约 3.7GB |
| C盘空间 | ⚠️ 紧张 | 剩余 34% (170GB/500GB) |

---

## 🚀 立即优化方案

### 1. 清理 C 盘空间

C 盘空间不足会严重影响系统性能：

```powershell
# 清理临时文件
Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue

# 清理 Windows 临时文件
Remove-Item -Path "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue

# 运行磁盘清理
cleanmgr /sagerun:1
```

### 2. Trae 内存优化设置

在 Trae 中打开设置 (`Ctrl + ,`)，搜索并修改以下配置：

```json
{
  // 限制 TypeScript 内存使用
  "typescript.tsserver.maxTsServerMemory": 3072,
  
  // 限制搜索线程数
  "search.followSymlinks": false,
  "search.useIgnoreFiles": true,
  "search.useGlobalIgnoreFiles": true,
  
  // 禁用不必要的功能
  "telemetry.enableTelemetry": false,
  "telemetry.enableCrashReporter": false,
  
  // 文件监视优化
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/build/**": true,
    "**/.next/**": true
  },
  
  // 搜索排除
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.git": true,
    "**/.next": true,
    "**/coverage": true
  }
}
```

### 3. 禁用不常用扩展

按 `Ctrl + Shift + X` 打开扩展面板，禁用以下类型扩展：

- ❌ 不常用的主题扩展（保留 1-2 个即可）
- ❌ 重复的代码格式化工具
- ❌ 不常用的代码片段扩展
- ❌ 调试工具（非开发时禁用）

**推荐保留的核心扩展：**
- ESLint / Prettier（代码规范）
- TypeScript 相关
- Git 相关

### 4. 项目级优化

在当前项目中创建工作区设置 `.vscode/settings.json`：

```json
{
  // 排除大文件夹
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.next": true,
    "**/coverage": true,
    "**/.nuxt": true,
    "**/.output": true
  },
  
  // TypeScript 优化
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "typescript.suggest.autoImports": false,
  
  // 禁用不必要的编辑器功能
  "editor.minimap.enabled": false,
  "editor.renderWhitespace": "none",
  "editor.renderControlCharacters": false,
  "editor.smoothScrolling": false,
  "editor.cursorSmoothCaretAnimation": "off"
}
```

---

## 🔧 高级优化

### 5. 调整 Trae 启动参数

创建 Trae 快捷方式，添加启动参数：

```
"C:\Users\你的用户名\AppData\Local\Trae\Trae.exe" 
  --max-memory=4096 
  --disable-gpu-vsync 
  --disable-background-timer-throttling
```

### 6. Windows 系统优化

```powershell
# 设置高性能电源计划
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c

# 禁用不必要的启动项
# 打开任务管理器 -> 启动选项卡，禁用不需要的启动程序
```

### 7. 清理项目依赖

```bash
# 清理 node_modules 并重新安装
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# 或者使用 pnpm 的存储清理
pnpm store prune
```

---

## 📊 监控建议

定期监控以下指标：

1. **Trae CN 内存使用**：任务管理器中应保持在 2GB 以下
2. **C 盘剩余空间**：建议保持在 50GB 以上
3. **系统内存占用**：总内存使用不超过 80%

---

## 🆘 如果仍然卡顿

如果以上优化后仍然卡顿，考虑：

1. **升级硬件**：
   - 内存升级到 32GB
   - C 盘更换为更大容量的 SSD

2. **使用轻量级替代方案**：
   - 开发时关闭 Trae 的 AI 功能
   - 使用 VS Code 代替 Trae CN
   - 大型项目使用 Vim/Neovim

3. **分批打开文件**：
   - 不要一次性打开整个项目
   - 使用工作区功能，按模块打开

---

## ✅ 优化检查清单

- [ ] C 盘清理完成，剩余空间 > 50GB
- [ ] Trae 设置已优化
- [ ] 不常用扩展已禁用
- [ ] 项目 `.vscode/settings.json` 已配置
- [ ] node_modules 已清理重装
- [ ] 系统电源计划设置为高性能
- [ ] 启动项已优化

---

*最后更新：2026-03-07*
