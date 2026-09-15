#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Uso: $0 <x.y.z>   (ej: $0 0.2.0)"
  exit 1
}

[[ $# -lt 1 ]] && usage
NEW="$1"
[[ "$NEW" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || usage

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

sed -i -E 's/"version":\s*"[^"]*"/"version": "'"$NEW"'"/' src-tauri/tauri.conf.json 2>/dev/null
sed -i -E 's/"version":\s*"[^"]*"/"version": "'"$NEW"'"/' package.json 2>/dev/null
sed -i -E 's/^(version\s*=\s*)"[^"]*"/\1"'"$NEW"'"/' src-tauri/Cargo.toml 2>/dev/null

echo "✔ Versión actualizada a $NEW en tauri.conf.json, package.json, src-tauri/Cargo.toml"
echo ""
echo "Siguientes pasos:"
echo "  1. Commit:   git add -A && git commit -m \"v$NEW\""
echo "  2. Tag:      git tag v$NEW && git push origin v$NEW"
echo "  3. Build Windows (PC Windows): pnpm install --frozen-lockfile && pnpm tauri build"
echo "  4. Publicar (PC Windows):      .\\scripts\\win-publish.ps1 -Version $NEW -Notes \"<notas>\""
