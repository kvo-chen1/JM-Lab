# AI后台生成功能部署检查脚本
# 运行此脚本检查所有配置是否正确

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AI后台生成功能部署检查" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$hasError = $false

# 1. 检查 Supabase CLI
Write-Host "1. 检查 Supabase CLI..." -ForegroundColor Yellow
$supabaseVersion = supabase --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Supabase CLI 已安装: $supabaseVersion" -ForegroundColor Green
} else {
    Write-Host "   ✗ Supabase CLI 未安装" -ForegroundColor Red
    Write-Host "     请运行: npm install -g supabase" -ForegroundColor Gray
    $hasError = $true
}
Write-Host ""

# 2. 检查环境变量文件
Write-Host "2. 检查环境变量..." -ForegroundColor Yellow
$envFiles = @(".env", ".env.local")
$qwenKeyFound = $false

foreach ($file in $envFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match "QWEN_API_KEY") {
            Write-Host "   ✓ 在 $file 中找到 QWEN_API_KEY" -ForegroundColor Green
            $qwenKeyFound = $true
            
            # 检查是否是 VITE_ 前缀
            if ($content -match "VITE_QWEN_API_KEY") {
                Write-Host "   ⚠ 警告: 使用 VITE_QWEN_API_KEY 会暴露密钥到前端" -ForegroundColor Yellow
                Write-Host "     建议: 仅使用后端调用，移除 VITE_ 前缀" -ForegroundColor Gray
            }
        }
    }
}

if (-not $qwenKeyFound) {
    Write-Host "   ✗ 未找到 QWEN_API_KEY" -ForegroundColor Red
    $hasError = $true
}
Write-Host ""

# 3. 检查数据库迁移文件
Write-Host "3. 检查数据库迁移文件..." -ForegroundColor Yellow
$migrationFile = "supabase/migrations/20260219000004_create_generation_tasks.sql"
if (Test-Path $migrationFile) {
    Write-Host "   ✓ 迁移文件存在: $migrationFile" -ForegroundColor Green
} else {
    Write-Host "   ✗ 迁移文件缺失" -ForegroundColor Red
    $hasError = $true
}
Write-Host ""

# 4. 检查 Edge Function
Write-Host "4. 检查 Edge Function..." -ForegroundColor Yellow
$edgeFunctionFile = "supabase/functions/generate-image/index.ts"
if (Test-Path $edgeFunctionFile) {
    Write-Host "   ✓ Edge Function 存在: $edgeFunctionFile" -ForegroundColor Green
} else {
    Write-Host "   ✗ Edge Function 缺失" -ForegroundColor Red
    $hasError = $true
}
Write-Host ""

# 5. 检查前端服务
Write-Host "5. 检查前端服务..." -ForegroundColor Yellow
$serviceFile = "src/services/aiGenerationService.ts"
if (Test-Path $serviceFile) {
    $content = Get-Content $serviceFile -Raw
    if ($content -match "restoreActiveTasks") {
        Write-Host "   ✓ aiGenerationService 已更新支持后台生成" -ForegroundColor Green
    } else {
        Write-Host "   ✗ aiGenerationService 未更新" -ForegroundColor Red
        $hasError = $true
    }
} else {
    Write-Host "   ✗ aiGenerationService 不存在" -ForegroundColor Red
    $hasError = $true
}
Write-Host ""

# 6. 输出部署命令
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "部署步骤:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "步骤 1: 登录 Supabase" -ForegroundColor Yellow
Write-Host "  supabase login" -ForegroundColor White
Write-Host ""
Write-Host "步骤 2: 链接项目" -ForegroundColor Yellow
Write-Host "  supabase link --project-ref <your-project-ref>" -ForegroundColor White
Write-Host ""
Write-Host "步骤 3: 执行数据库迁移" -ForegroundColor Yellow
Write-Host "  supabase db push" -ForegroundColor White
Write-Host ""
Write-Host "步骤 4: 设置 Secrets" -ForegroundColor Yellow
Write-Host "  supabase secrets set QWEN_API_KEY=<your-api-key>" -ForegroundColor White
Write-Host ""
Write-Host "步骤 5: 部署 Edge Function" -ForegroundColor Yellow
Write-Host "  supabase functions deploy generate-image" -ForegroundColor White
Write-Host ""

# 7. 检查 Supabase 连接（如果配置了环境变量）
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "可选检查:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "VITE_SUPABASE_URL=(.+)") {
        $supabaseUrl = $matches[1]
        Write-Host "Supabase URL: $supabaseUrl" -ForegroundColor Gray
    }
}

Write-Host ""
if ($hasError) {
    Write-Host "⚠ 检查发现问题，请修复后再部署" -ForegroundColor Red
} else {
    Write-Host "✓ 所有检查通过，可以开始部署" -ForegroundColor Green
}
Write-Host ""
Write-Host "详细文档: docs/background-generation-setup.md" -ForegroundColor Gray
