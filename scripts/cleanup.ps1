# PowerShell Cleanup Script
Write-Host "🧹 Starting cleanup..." -ForegroundColor Green

# 1) Runtime- und Build-Artefakte entfernen (safe)
Write-Host "📦 Removing build artifacts..." -ForegroundColor Yellow
$artifacts = @(
    ".turbo",
    ".next", 
    ".vercel/output",
    "node_modules",
    "coverage",
    "dist",
    "out",
    ".cache"
)

foreach ($artifact in $artifacts) {
    if (Test-Path $artifact) {
        Remove-Item -Recurse -Force $artifact
        Write-Host "  Removed: $artifact" -ForegroundColor Gray
    }
}

# 2) Editor-/OS-Müll
Write-Host "🗑️ Removing OS/Editor files..." -ForegroundColor Yellow
Get-ChildItem -Recurse -Name ".DS_Store" -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Recurse -Name "Thumbs.db" -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Recurse -Name "*.log" -ErrorAction SilentlyContinue | Remove-Item -Force

# 3) Pnpm Store lokal aufräumen (optional)
Write-Host "📦 Cleaning pnpm store..." -ForegroundColor Yellow
try {
    pnpm store prune
} catch {
    Write-Host "  Pnpm store prune failed (optional)" -ForegroundColor Gray
}

Write-Host "✅ Cleanup done (Artefakte/Caches)." -ForegroundColor Green
