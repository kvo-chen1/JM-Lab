# 安装 PostgreSQL 17 客户端脚本
$ErrorActionPreference = "Stop"

Write-Host "=== PostgreSQL 17 客户端安装脚本 ===" -ForegroundColor Green

# 检查是否已安装 PostgreSQL 17
$pg17Path = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
if (Test-Path $pg17Path) {
    Write-Host "PostgreSQL 17 已安装！" -ForegroundColor Green
    & $pg17Path --version
    exit 0
}

# 定义下载链接和路径
$postgresVersion = "17.4-1"
$downloadUrl = "https://get.enterprisedb.com/postgresql/postgresql-${postgresVersion}-windows-x64-binaries.zip"
$downloadPath = "$env:TEMP\postgresql-17.zip"
$extractPath = "C:\postgresql17"

Write-Host "正在下载 PostgreSQL 17..." -ForegroundColor Yellow

try {
    # 下载文件
    Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath -UseBasicParsing
    Write-Host "下载完成！" -ForegroundColor Green

    # 如果目标目录存在，先删除
    if (Test-Path $extractPath) {
        Write-Host "清理旧目录..." -ForegroundColor Yellow
        Remove-Item -Path $extractPath -Recurse -Force
    }

    # 解压文件
    Write-Host "正在解压..." -ForegroundColor Yellow
    Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force
    Write-Host "解压完成！" -ForegroundColor Green

    # 清理下载文件
    Remove-Item -Path $downloadPath -Force

    # 验证安装
    $newPsqlPath = "$extractPath\pgsql\bin\psql.exe"
    if (Test-Path $newPsqlPath) {
        Write-Host "安装成功！" -ForegroundColor Green
        $version = & $newPsqlPath --version
        Write-Host $version -ForegroundColor Cyan
        Write-Host "新的 psql 路径: $newPsqlPath" -ForegroundColor Yellow
    } else {
        throw "安装失败：找不到 psql.exe"
    }
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
    Write-Host "安装失败，请手动下载安装。" -ForegroundColor Red
    exit 1
}
