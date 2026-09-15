param(
  [Parameter(Mandatory = $true)][string]$Version,
  [string]$Notes = ""
)

$ErrorActionPreference = "Stop"

$bundle = "src-tauri\target\release\bundle"
$exe = Get-ChildItem "$bundle\nsis\*-setup.exe" -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
$msi = Get-ChildItem "$bundle\msi\*.msi" -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $exe) {
  throw "No se encontro el instalador NSIS. Ejecuta primero: pnpm tauri build"
}

$exeName = $exe.Name
$latest = [ordered]@{
  version = $Version
  url     = "https://github.com/programarum/asociacion_mutual/releases/download/v$Version/$exeName"
  notes   = $Notes
} | ConvertTo-Json

$latestPath = Join-Path $exe.Directory.FullName "latest.json"
$latest | Out-File -FilePath $latestPath -Encoding utf8 -Force
Write-Host "latest.json generado en $latestPath"
Write-Host "  -> la app lee: .../releases/latest/download/latest.json (nombre fijo)"

if (Get-Command gh -ErrorAction SilentlyContinue) {
  $assets = @($exe.FullName, $latestPath)
  if ($msi) { $assets += $msi.FullName }
  gh release create "v$Version" $assets --title "v$Version" --notes $Notes --repo programarum/asociacion_mutual
  Write-Host "Release v$Version publicada."
} else {
  Write-Host "gh (GitHub CLI) no esta instalado. Subilo manualmente en GitHub Releases:"
  Write-Host "  - $($exe.FullName)"
  if ($msi) { Write-Host "  - $($msi.FullName)" }
  Write-Host "  - $latestPath"
}