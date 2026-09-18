# AGENTS.md

## Stack

- Frontend: Vite + React 19 + TypeScript + React Router 7 + TanStack Query + Tailwind CSS 4.
- Backend embebido: Rust (Tauri 2) + SQLite (rusqlite).
- El frontend llama al backend con `invoke` de `@tauri-apps/api/core`. No existe API HTTP.

## Comandos

- Dev web: `pnpm dev` (Vite en :5173)
- Dev desktop: `pnpm tauri dev`
- Build: `pnpm build` (Vite → `dist/`)
- Tests: `pnpm test` (Vitest), `pnpm test:rust` (cargo test), `pnpm test:all`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Sync semilla: `pnpm db:sync-seed` (copia la BD de dev de app_data_dir a `src-tauri/resources/mutual.sqlite`; commitear y pushear para que el build la incluya)

## Estructura clave

- `src/` — frontend SPA: `pages/`, `components/`, `hooks/`, `services/`, `test/`
- `src-tauri/src/commands/` — comandos Rust ("backend")
- `src-tauri/src/services/` — lógica pura (cobertura, número a letras)
- `src-tauri/resources/mutual.sqlite` — BD semilla (se copia al primer arranque a app_data_dir)
- `src-tauri/src/db.rs` — init de SQLite

## Convenciones

- No agregar comentarios salvo que se pidan.
- Data fetching con hooks de TanStack Query en `src/hooks/`.
- Servicios Tauri (AuthService) en `src/services/`.
- Tests junto al código como `*.test.{ts,tsx}`.
- Instalador Windows se genera vía CI: `.github/workflows/build-windows.yml` (Tauri no cross-compila desde Linux).