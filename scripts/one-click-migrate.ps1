# Supabase 一键迁移脚本
# 使用方法: .\scripts\one-click-migrate.ps1

Write-Host "🚀 Supabase 一键迁移工具" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# 检查是否安装了 psql
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "❌ 错误: 未找到 psql 命令" -ForegroundColor Red
    Write-Host "   请先安装 PostgreSQL 客户端:" -ForegroundColor Yellow
    Write-Host "   https://www.postgresql.org/download/windows/" -ForegroundColor Blue
    exit 1
}

Write-Host "✅ 已找到 psql" -ForegroundColor Green
Write-Host ""

# 获取源数据库信息
Write-Host "【源数据库】旧 Supabase 项目:" -ForegroundColor Yellow
$sourceHost = Read-Host "Host (如: db.xxxxx.supabase.co)"
$sourceDb = Read-Host "Database (默认: postgres)"
if (-not $sourceDb) { $sourceDb = "postgres" }
$sourcePort = Read-Host "Port (默认: 5432)"
if (-not $sourcePort) { $sourcePort = "5432" }
$sourceUser = Read-Host "User (如: postgres)"
$sourcePass = Read-Host "Password" -AsSecureString
$sourcePassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sourcePass))

Write-Host ""
Write-Host "【目标数据库】新 Supabase 项目:" -ForegroundColor Yellow
$targetHost = Read-Host "Host (如: db.yyyyy.supabase.co)"
$targetDb = Read-Host "Database (默认: postgres)"
if (-not $targetDb) { $targetDb = "postgres" }
$targetPort = Read-Host "Port (默认: 5432)"
if (-not $targetPort) { $targetPort = "5432" }
$targetUser = Read-Host "User (如: postgres)"
$targetPass = Read-Host "Password" -AsSecureString
$targetPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($targetPass))

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📝 迁移计划:" -ForegroundColor Cyan
Write-Host "   从: $sourceHost" -ForegroundColor White
Write-Host "   到: $targetHost" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  警告: 这将覆盖目标数据库中的数据!" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "确认开始迁移? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ 已取消" -ForegroundColor Red
    exit 0
}

# 设置环境变量
$env:PGPASSWORD = $sourcePassPlain

# 步骤 1: 导出表结构
Write-Host ""
Write-Host "📦 步骤 1/4: 导出表结构..." -ForegroundColor Yellow
$schemaFile = "migration_schema_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
try {
    pg_dump -h $sourceHost -p $sourcePort -U $sourceUser -d $sourceDb `
        --schema=public --schema-only --no-owner --no-privileges `
        -f $schemaFile
    Write-Host "✅ 表结构导出完成: $schemaFile" -ForegroundColor Green
} catch {
    Write-Host "❌ 导出失败: $_" -ForegroundColor Red
    exit 1
}

# 步骤 2: 导出数据
Write-Host ""
Write-Host "📦 步骤 2/4: 导出数据..." -ForegroundColor Yellow
$dataFile = "migration_data_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
try {
    pg_dump -h $sourceHost -p $sourcePort -U $sourceUser -d $sourceDb `
        --schema=public --data-only --no-owner --no-privileges `
        -f $dataFile
    $fileSize = (Get-Item $dataFile).Length / 1MB
    Write-Host "✅ 数据导出完成: $dataFile ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
} catch {
    Write-Host "❌ 导出失败: $_" -ForegroundColor Red
    exit 1
}

# 步骤 3: 在目标数据库创建表结构
Write-Host ""
Write-Host "📦 步骤 3/4: 在目标数据库创建表结构..." -ForegroundColor Yellow
$env:PGPASSWORD = $targetPassPlain
try {
    psql -h $targetHost -p $targetPort -U $targetUser -d $targetDb -f $schemaFile
    Write-Host "✅ 表结构创建完成" -ForegroundColor Green
} catch {
    Write-Host "❌ 创建失败: $_" -ForegroundColor Red
    Write-Host "   尝试继续导入数据..." -ForegroundColor Yellow
}

# 步骤 4: 导入数据
Write-Host ""
Write-Host "📦 步骤 4/4: 导入数据..." -ForegroundColor Yellow
try {
    psql -h $targetHost -p $targetPort -U $targetUser -d $targetDb -f $dataFile
    Write-Host "✅ 数据导入完成" -ForegroundColor Green
} catch {
    Write-Host "❌ 导入失败: $_" -ForegroundColor Red
    Write-Host "   你可以手动执行 $dataFile 文件" -ForegroundColor Yellow
}

# 清理
Write-Host ""
Write-Host "🧹 清理临时文件..." -ForegroundColor Yellow
Remove-Item $schemaFile -ErrorAction SilentlyContinue
Remove-Item $dataFile -ErrorAction SilentlyContinue

# 验证
Write-Host ""
Write-Host "📊 验证数据..." -ForegroundColor Yellow
try {
    $result = psql -h $targetHost -p $targetPort -U $targetUser -d $targetDb `
        -c "SELECT tablename, n_tup_ins FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY n_tup_ins DESC LIMIT 10;"
    Write-Host $result
} catch {
    Write-Host "⚠️  无法获取统计数据" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🎉 迁移完成!" -ForegroundColor Green
Write-Host ""
Write-Host "提示:" -ForegroundColor Cyan
Write-Host "   - 如果某些表导入失败，可以单独重新导入" -ForegroundColor White
Write-Host "   - 检查 Supabase Dashboard 确认数据已迁移" -ForegroundColor White
Write-Host ""
