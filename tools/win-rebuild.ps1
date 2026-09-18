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

# git/progreso escribe avisos (CRLF, "From github...") por stderr; con Stop eso
# dispara NativeCommandError y aborta aunque el comando haya tenido exito.
function Invoke-Git {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArgs)
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $out = & git @GitArgs 2>&1
  $code = $LASTEXITCODE
  $ErrorActionPreference = $prev
  $out | ForEach-Object { Write-Host "   $_" }
  return $code
}

function Invoke-Pnpm {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$PnpmArgs)
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & pnpm @PnpmArgs 2>&1 | ForEach-Object { Write-Host "$_" }
  $code = $LASTEXITCODE
  $ErrorActionPreference = $prev
  return $code
}

# ---- 0) Pararse en la raíz del repo ----
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

# ---- 1) Git al día + descartar ediciones manuales rotas ----
Step "1/4  Git: pull + descartar edicion manual rota en Sidebar.tsx"
if ((Invoke-Git @("stash", "push", "--", "src/components/Sidebar.tsx")) -ne 0) {
  # sin cambios locales -> no hay nada que guardar, sigue normal
  Write-Host "   (sin cambios locales en Sidebar.tsx, ok)"
}
# si el remote es SSH (git@github) -> pasarlo a HTTPS (mata el cuelgue del pull)
$prev = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$sshRemote = git remote get-url origin 2>$null
$ErrorActionPreference = $prev
if ($sshRemote -like "git@github*") {
  git remote set-url origin https://github.com/programarum/asociacion_mutual.git
  Write-Host "   remote SSH -> HTTPS (auto-fix, pull ya no se cuelga)."
}
if ((Invoke-Git pull --rebase) -ne 0) {
  Write-Host "   X git pull fallo (conflictos locales?). Resolvelos en esta copia y vuelve a ejecutar." -ForegroundColor Red
  exit 1
}
Invoke-Git @("checkout", "--", "src/components/Sidebar.tsx") | Out-Null
Write-Host "   Sidebar.tsx restaurado a la version de git."

# ---- 2) Borrar BD local -> resiembra del semilla (schema/admin nuevos) ----
Step "2/4  BD: borrar la local para que la semilla nueva se copie"
# Tauri usa app_data_dir = %APPDATA% (Roaming); LOCALAPPDATA era la ruta erronea.
$dataDirs = @(
  (Join-Path $env:APPDATA "com.asociacionmutual.dev"),
  (Join-Path $env:LOCALAPPDATA "com.asociacionmutual.dev")
)
foreach ($dataDir in $dataDirs) {
  foreach ($f in @("mutual.sqlite", "mutual.sqlite-wal", "mutual.sqlite-shm")) {
    $db = Join-Path $dataDir $f
    if (Test-Path $db) {
      Remove-Item $db -Force
      Write-Host "   BD vieja borrada: $db"
    }
  }
}

# ---- 3) Typecheck — la barrera que faltaba (el 90% del problema) ----
Step "3/4  Typecheck (debe dar 0 errores)"
if ((Invoke-Pnpm typecheck) -ne 0) {
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
if ((Invoke-Pnpm tauri build) -ne 0) {
  Write-Host "   X FALLO EL BUILD" -ForegroundColor Red
  exit 1
}

$bundle = "src-tauri\target\release\bundle\nsis"
Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  LISTO. Instalador nuevo en:" -ForegroundColor Green
Get-ChildItem "$bundle\*.exe" | ForEach-Object { Write-Host "   $($_.FullName)" -ForegroundColor Green }
Write-Host "======================================================" -ForegroundColor Green
