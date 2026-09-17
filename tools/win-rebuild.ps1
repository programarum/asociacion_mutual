#!/usr/bin/env pwsh
# ============================================================
# win-rebuild.ps1 — Build firmado en 1 clic (PC Windows de build)
#
# Repara SOLA e intencionalmente lo que rompió el build hoy:
#   1. Descarta ediciones manuales rotas en Sidebar.tsx (git checkout)
#   2. Borra la BD local vieja -> fuerza resiembra del semilla nuevo
#   3. Typecheck (aborta si falla) -> nunca más binario con código roto
#   4. Build firmado (TAURI_SIGNING_PRIVATE_KEY)
#
# USO (PowerShell):  powershell -ExecutionPolicy Bypass -File tools\win-rebuild.ps1
# ============================================================
$ErrorActionPreference = "Stop"

function Step($title) { Write-Host "`n=== $title ===" -ForegroundColor Cyan }

# ---- 0) Pararse en la raíz del repo ----
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

# ---- 1) Git al día + descartar ediciones manuales rotas ----
Step "1/4  Git: pull + descartar edicion manual rota en Sidebar.tsx"
git stash push -- src/components/Sidebar.tsx 2>$null
if ($LASTEXITCODE -ne 0) {
  # sin cambios locales -> no hay nada que guardar, sigue normal
  Write-Host "   (sin cambios locales en Sidebar.tsx, ok)"
}
git pull --rebase 2>&1 | Out-Host
git checkout -- src/components/Sidebar.tsx 2>$null
Write-Host "   Sidebar.tsx restaurado a la version de git."

# ---- 2) Borrar BD local -> resiembra del semilla (schema/admin nuevos) ----
Step "2/4  BD: borrar la local para que la semilla nueva se copie"
$dataDir = Join-Path $env:LOCALAPPDATA "com.asociacionmutual.dev"
$db = Join-Path $dataDir "mutual.sqlite"
if (Test-Path $db) {
  Remove-Item $db -Force
  Write-Host "   BD vieja borrada: $db"
} else {
  Write-Host "   ($db no existia, nada que borrar)"
}

# ---- 3) Typecheck — la barrera que faltaba (el 90% del problema) ----
Step "3/4  Typecheck (debe dar 0 errores)"
pnpm typecheck
if ($LASTEXITCODE -ne 0) {
  Write-Host "   X FALLO EL TYPECHECK — el build NO continua. " -ForegroundColor Red
  Write-Host "   El error de arriba es una EDICION MANUAL rota. " -ForegroundColor Red
  Write-Host "   Corrigelo o hace git checkout -- del archivo afectado." -ForegroundColor Red
  exit 1
}
Write-Host "   Typecheck OK (0 errores)."

# ---- 4) Build firmado ----
Step "4/4  Build firmado (genera el setup.exe + .sig)"
$keyPath = Join-Path $repoRoot ".tauri\mutual.key"
if (-not (Test-Path $keyPath)) {
  Write-Host "   X No existe .tauri\mutual.key (la clave de firma) — no se puede firmar." -ForegroundColor Red
  exit 1
}
$env:TAURI_SIGNING_PRIVATE_KEY = (Get-Content $keyPath -Raw).Trim()
pnpm tauri build
if ($LASTEXITCODE -ne 0) {
  Write-Host "   X FALLO EL BUILD" -ForegroundColor Red
  exit 1
}

$bundle = "src-tauri\target\release\bundle\nsis"
Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  LISTO. Instalador nuevo en:" -ForegroundColor Green
Get-ChildItem "$bundle\*.exe" | ForEach-Object { Write-Host "   $($_.FullName)" -ForegroundColor Green }
Write-Host "======================================================" -ForegroundColor Green
