$old = 'http://localhost:3001'
$new = 'https://dungeon-surv-server-production.up.railway.app'
$dirs = @(
    'D:\GameProject\DungeonSurv\docs',
    'D:\GameProject\DungeonSurv\docs\en',
    'D:\GameProject\DungeonSurv\docs\ja',
    'D:\GameProject\DungeonSurv\docs\kr'
)
foreach ($dir in $dirs) {
    $file = Join-Path $dir 'index.html'
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match [regex]::Escape($old)) {
            $content = $content -replace [regex]::Escape($old), $new
            Set-Content -Path $file -Value $content -NoNewline
            Write-Host "Updated: $file"
        } else {
            Write-Host "Already updated or not found: $file"
        }
    }
}
