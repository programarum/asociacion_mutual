# Asociación Mutual El Rosario

Aplicación de escritorio para Windows para la gestión de una asociación mutual:
asociados, beneficiarios, cuotas/pagos, cobertura, fallecidos, usuarios y
licenciamiento por equipo.

## Stack

**Frontend** (Vite SPA, empaquetada dentro de Tauri):

- Vite 8 + React 19 + TypeScript
- React Router 7 + TanStack Query 5
- Tailwind CSS 4 + lucide-react

**Backend embebido** (Rust / Tauri 2):

- Tauri 2.11 + plugins (dialog, log, process)
- SQLite vía `rusqlite` (compilación "bundled", sin archivo .dll)
- `bcrypt` (hash de contraseñas), `chrono`, `ed25519-dalek` + `sha2` (licencias)

No existe API HTTP: el frontend invoca comandos Rust con `invoke` de
`@tauri-apps/api/core`.

## Requisitos

- Node.js 22 + pnpm 11 (`corepack enable` / `npm i -g pnpm`)
- Rust stable (rustup)
- **Linux dev**: paquetes GTK/WebKit (ver `scripts/dev-linux.sh`)
- **Windows build**: runner Windows (CI con `.github/workflows/build-windows.yml`).
  Tauri **no cross-compila** de Linux → Windows; el instalador se genera en CI o
  una máquina Windows.

## Comandos

```bash
pnpm install        # instalar dependencias
pnpm dev            # solo frontend (Vite, :5173)
pnpm tauri dev      # app de escritorio en modo dev
pnpm build          # build frontend (Vite → dist/)
pnpm tauri build    # build escritorio + instalador (en Windows)
pnpm test           # tests frontend (Vitest, una vez)
pnpm test:rust      # tests Rust (cargo test)
pnpm test:all       # ambos
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
```

## Base de datos

SQLite. La BD "semilla" vive en `src-tauri/resources/mutual.sqlite` y se copia al
directorio de datos de la app en el primer arranque (`src-tauri/src/db.rs`);
también existe `mutual.sqlite` en la raíz con datos de desarrollo.

Tablas principales: `users`, `asociados`, `beneficiarios`, `pagos`,
`coberturas`, `configuracion`, `fallecidos`, `licencia`.

## Licencias

Cada instalación queda vinculada a su hardware (hash SHA-256 del serial del
disco). El desarrollador firma el `machine_id` con la clave privada Ed25519
(`tools/license_tool.py` + `tools/.private_key`, **nunca se commitea la clave
privada**); la app verifica la firma con la clave pública embebida.

En builds para Linux la verificación se omite (no se exige licencia); la
licencia solo se exige en Windows (`src-tauri/src/commands/license.rs`).

## Build Windows (CI)

Ver `.github/workflows/build-windows.yml`:

- Runner `windows-latest`
- `pnpm install --frozen-lockfile` → `pnpm tauri build`
- Produce instalador **NSIS (.exe)** y **MSI** como artifacts

## Estructura

```
src/                  frontend SPA (pages, components, hooks, services, test)
src-tauri/            backend Rust: commands/, models/, services/, db.rs
src-tauri/resources/  mutual.sqlite (BD semilla empaquetada)
tools/                generador de licencias (license_tool.py)
.github/workflows/    CI para build Windows
scripts/              scripts de dev para Linux
plans/                histórico de planes de mejora
```