#!/usr/bin/env bash
set -euo pipefail

# Copia la BD de desarrollo (app_data_dir) a la semilla empaquetada
# src-tauri/resources/mutual.sqlite, para que el build de Windows
# lleve los datos actuales. Ejecutar con la app de dev cerrada.

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

DEV_DB="$HOME/.local/share/com.asociacionmutual.dev/mutual.sqlite"
SEED_DB="src-tauri/resources/mutual.sqlite"

command -v sqlite3 >/dev/null 2>&1 || { echo "[ERROR] Falta sqlite3 en el PATH."; exit 1; }
[[ -f "$DEV_DB" ]] || { echo "[ERROR] No existe la BD de dev: $DEV_DB"; exit 1; }

if [[ -f "$DEV_DB-wal" ]] && [[ -s "$DEV_DB-wal" ]] && pgrep -f "tauri|front-mutual|target/debug" >/dev/null 2>&1; then
  echo "[ERROR] Hay datos sin volcar (WAL no vacio) y la app parece estar abierta. Closure la app de dev y reintenta."
  exit 1
fi

echo "==> BD dev: $DEV_DB"
echo "    Semilla (antes):"
sqlite3 "file:$SEED_DB?mode=ro" "SELECT '      users: '||COUNT(*) FROM users; SELECT '      asociados: '||COUNT(*) FROM asociados; SELECT '      empresa: '||nombre_empresa||' | '||COALESCE(ruc,'-') FROM configuracion WHERE id=1;" 2>/dev/null || echo "      (semilla ilegible, se sobrescribe)"

sqlite3 "$DEV_DB" "PRAGMA wal_checkpoint(TRUNCATE);" >/dev/null

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
cp "$DEV_DB" "$TMP"

lic=$(sqlite3 "$TMP" "SELECT COUNT(*) FROM licencia;")
if [[ "$lic" -gt 0 ]]; then
  sqlite3 "$TMP" "DELETE FROM licencia;"
  echo "==> Limpiadas $lic fila(s) de licencia de la semilla."
fi
sqlite3 "$TMP" "VACUUM;"

cp "$TMP" "$SEED_DB"

echo "==> Semilla actualizada: $SEED_DB"
echo "    Semilla (ahora):"
sqlite3 "file:$SEED_DB?mode=ro" "SELECT '      users: '||COUNT(*) FROM users; SELECT '      asociados: '||COUNT(*) FROM asociados; SELECT '      empresa: '||nombre_empresa||' | '||COALESCE(ruc,'-') FROM configuracion WHERE id=1;"

case "$(git remote get-url origin 2>/dev/null || true)" in
  https://github.com/programarum/asociacion_mutual.git|git@github.com:programarum/asociacion_mutual.git)
    echo ""
    echo "Siguientes pasos (para que el build de Windows/CI la vea):"
    echo "  git add $SEED_DB && git commit -m \"semilla: sync desde dev\" && git push"
    ;;
esac
