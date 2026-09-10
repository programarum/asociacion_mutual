#!/usr/bin/env bash
set -euo pipefail

# Entorno de desarrollo de front-mutual en Linux.
# Verifica prerequisitos, instala dependencias y levanta la app de escritorio.

export PATH="$HOME/.local/share/pnpm/bin:$PATH"

echo "==> Verificando herramientas básicas..."
for cmd in node pnpm cargo rustc; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[ERROR] Falta '$cmd'. Instálalo antes de continuar."
    exit 1
  fi
done
echo "    node $(node -v) | pnpm $(pnpm -v) | rustc $(rustc -V | cut -d' ' -f2)"

OS_ID="$(. /etc/os-release 2>/dev/null && echo "${ID:-unknown}")" || OS_ID="unknown"
NEEDS=
case "$OS_ID" in
  debian|ubuntu)
    for pkg in libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev \
      libssl-dev libayatana-appindicator3-dev librsvg2-dev; do
      dpkg -s "$pkg" >/dev/null 2>&1 || NEEDS="$pkg $NEEDS"
    done
    ;;
  fedora|centos|rhel|rocky|almalinux)
    for pkg in webkit2gtk4.1-devel gcc-c++ curl wget file libXdo-devel \
      openssl-devel libappindicator-gtk3-devel librsvg2-devel; do
      rpm -q "$pkg" >/dev/null 2>&1 || NEEDS="$pkg $NEEDS"
    done
    ;;
  arch|manjaro)
    for pkg in webkit2gtk-4.1 base-devel curl wget file libxdo openssl \
      libappindicator-gtk3 librsvg; do
      pacman -Q "$pkg" >/dev/null 2>&1 || NEEDS="$pkg $NEEDS"
    done
    ;;
  *)
    echo "==> Distro '$OS_ID' no reconocida; salta chequeo de paquetes GTK/WebKit."
    ;;
esac

if [ -n "$NEEDS" ]; then
  echo "[ERROR] Faltan dependencias del sistema para Tauri:"
  echo "        $NEEDS"
  echo ""
  echo "        En Debian/Ubuntu instala con:"
  echo "        sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev pkg-config"
  echo ""
  exit 1
fi

echo "==> Instalando dependencias del proyecto..."
CI=true pnpm install --no-frozen-lockfile

echo "==> Levantando app de escritorio (dev)..."
echo "    La verificación de licencia se omite en builds de desarrollo fuera de Windows."
exec pnpm tauri dev