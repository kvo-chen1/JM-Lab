# IP 海报排版库图片安装说明

## 问题说明

IP 海报排版库组件已创建完成，但图片文件需要手动复制到 public 目录才能正常显示。

## 解决方案

### 方法一：使用 PowerShell 脚本（推荐）

1. 打开 PowerShell（以管理员身份运行）
2. 进入项目目录：
   ```powershell
   cd c:\git-repo
   ```
3. 运行复制脚本：
   ```powershell
   .\copy-ip-images.ps1
   ```

### 方法二：手动复制

1. 打开文件资源管理器
2. 导航到：`c:\git-repo\津小脉 IP`
3. 选中所有 8 张 PNG 图片文件
4. 复制（Ctrl+C）
5. 导航到：`c:\git-repo\public\images\jinxiaomi-ip`
6. 粘贴（Ctrl+V）

### 方法三：使用命令行

在 PowerShell 中执行以下命令：

```powershell
# 确保目标目录存在
New-Item -ItemType Directory -Force -Path "c:\git-repo\public\images\jinxiaomi-ip"

# 复制所有 PNG 文件
Copy-Item "c:\git-repo\津小脉 IP\*.png" -Destination "c:\git-repo\public\images\jinxiaomi-ip\" -Force
```

## 验证安装

复制完成后，检查以下文件是否存在：

- `c:\git-repo\public\images\jinxiaomi-ip\289a0978e1635838b6e3a4e111a51d5e.png`
- `c:\git-repo\public\images\jinxiaomi-ip\359c9b83b6029a90fded5b65d98b2aa5.png`
- `c:\git-repo\public\images\jinxiaomi-ip\46dc6794c38d5a2f437efdb99b20197a.png`
- `c:\git-repo\public\images\jinxiaomi-ip\63b44f3371b2a11cae4cb4d2366b3c16.png`
- `c:\git-repo\public\images\jinxiaomi-ip\6c0dc612fea269ea5d26968523f75830.png`
- `c:\git-repo\public\images\jinxiaomi-ip\78ee589621ea779e863a3b3146544c73.png`
- `c:\git-repo\public\images\jinxiaomi-ip\8be1c41fd813a03c983988cdeb59476f.png`
- `c:\git-repo\public\images\jinxiaomi-ip\c5dd16a47811114c3a47298d9f099c29.png`

## 刷新页面

图片复制完成后：

1. 刷新浏览器页面（Ctrl+F5 强制刷新）
2. 重新打开 IP 海报排版库
3. 图片应该正常显示了

## 故障排除

### 图片仍然无法显示

1. **检查文件路径**：确保图片已正确复制到 `public/images/jinxiaomi-ip/` 目录
2. **清除浏览器缓存**：按 Ctrl+Shift+Delete 清除缓存
3. **检查文件名**：确保文件名与代码中的路径完全匹配
4. **重启开发服务器**：如果使用 Vite，可能需要重启开发服务器

### 权限问题

如果遇到权限错误，请：

1. 以管理员身份运行 PowerShell
2. 确保目标目录有写入权限
3. 检查文件是否被其他程序占用

## 目录结构

```
c:\git-repo\
├── 津小脉 IP/                    # 源图片目录
│   ├── 289a0978e1635838b6e3a4e111a51d5e.png
│   ├── 359c9b83b6029a90fded5b65d98b2aa5.png
│   └── ... (共 8 张)
└── public/
    └── images/
        └── jinxiaomi-ip/         # 目标目录
            ├── 289a0978e1635838b6e3a4e111a51d5e.png
            ├── 359c9b83b6029a90fded5b65d98b2aa5.png
            └── ... (共 8 张)
```

## 注意事项

1. 图片文件较大，复制可能需要几秒钟
2. 确保在复制过程中不要关闭 PowerShell 窗口
3. 如果目标目录已存在同名文件，会被覆盖
4. 复制完成后建议验证文件数量和大小

## 联系支持

如果仍然遇到问题，请：

1. 检查浏览器控制台是否有错误信息
2. 查看网络请求是否成功加载图片
3. 确认开发服务器配置正确
