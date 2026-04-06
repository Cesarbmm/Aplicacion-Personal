param(
    [string]$TargetTriple = "x86_64-pc-windows-msvc"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $root "frontend\src-tauri\binaries"
$entry = Join-Path $root "api_sidecar.py"
$name = "bapp-api-$TargetTriple"

python -m PyInstaller `
  --noconfirm `
  --onefile `
  --name $name `
  --distpath $outputDir `
  $entry

Write-Host "Sidecar generado en $outputDir\$name.exe"
