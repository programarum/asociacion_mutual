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

# Firma del artefacto. Tauri v2 la genera con createUpdaterArtifacts=true,
# llamada <instalador>.sig (firma ed25519 del updater).
$sigPath = "$($exe.FullName).sig"
if (-not (Test-Path $sigPath)) {
  throw "No existe $sigPath. Ejecuta el build con createUpdaterArtifacts=true " +
    "y TAURI_SIGNING_PRIVATE_KEY definida."
}
$signature = (Get-Content $sigPath -Raw).Trim()

$version = $Version.TrimStart("v")
$base = "https://github.com/programarum/asociacion_mutual/releases/download/v$version"

# Formato v2 del plugin updater de Tauri (lo que check() del frontend consume)
$latest = [ordered]@{
  version  = $version
  notes    = $Notes
  pub_date = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  platforms = [ordered]@{
    "windows-x86_64" = [ordered]@{
      url       = "$base/$exeName"
      signature = $signature
    }
  }
}

$latestPath = Join-Path $exe.Directory.FullName "latest.json"
$latest | ConvertTo-Json -Depth 6 | Out-File -FilePath $latestPath -Encoding utf8 -Force
Write-Host "latest.json generado en $latestPath"

$assets = @($exe.FullName, "$($exe.FullName).sig", $latestPath)
if ($msi) {
  $assets += $msi.FullName
  $msiSig = "$($msi.FullName).sig"
  if (Test-Path $msiSig) { $assets += $msiSig }
}

if (Get-Command gh -ErrorAction SilentlyContinue) {
  gh release create "v$version" $assets --title "v$version" --notes $Notes --repo programarum/asociacion_mutual
  Write-Host "Release v$version publicada."
} else {
  Write-Host "gh (GitHub CLI) no esta instalado. Subi manualmente en GitHub Releases:"
  $assets | ForEach-Object { Write-Host "  - $_" }
}
