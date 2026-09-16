**IMPORTANTE — UNA SOLA PC:** todo el flujo de publicación (GitHub CLI, generar la
clave de firma, build firmado y `win-publish`) ocurre en la **misma máquina donde
buildeás el instalador** (`front-mutual`). No hay equipo de publicación aparte ni CI
firma artefactos. La clave privada de firma se genera y guarda ÚNICAMENTE ahí
(fuera de git y de CI); la pública ya viaja en `tauri.conf.json`.

# Checklist de publicación y actualización

Flujo para publicar una versión firmada y que la app instalada se actualice sola, sin reinstalar desde cero.

## Requisitos (una sola vez, PC de publicación)

- Instalar GitHub CLI: `winget install GitHub.cli`
- Generar la clave de firma del updater:
  ```powershell
  pnpm tauri signer generate -w .tauri/mutual.key
  ```
- Guardar en un lugar seguro, FUERA de git (ej: USB):
  - la clave **privada** (la base64 con `=` del final)
  - la **contraseña** elegida
  > **NO RECUPERABLE:** si perdés la privada **no hay forma de recuperarla**. Lo único posible
  > es regenerar un par nuevo (`pnpm tauri signer generate -w .tauri/mutual.key`), actualizar la
  > **pública** en `tauri.conf.json` → `plugins.updater.pubkey` y volver a publicar.
  > La BD `mutual.sqlite` no se ve afectada por eso.
- La clave **pública** ya está configurada en `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`.
  No la cambies salvo que regeneres el par.

## Publicar una versión

1. Subir la versión del `Cargo.toml`/`package.json` (misma en ambos). Ej: `0.2.0`
2. Construir el instalador firmado (desde `front-mutual\`):
   ```powershell
   # Carga la clave DESDE el archivo .key (no pegues texto literal entre <>):
   $env:TAURI_SIGNING_PRIVATE_KEY = (Get-Content .tauri\mutual.key -Raw).Trim()
   # El password te lo pide el build; SI elegiste uno, ponelo aca (sin <>):
   $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<tu_pass_real_si_existe>"

   pnpm tauri build
   ```
   Genera `*-setup.exe` y su `.sig` en `src-tauri\target\release\bundle\nsis\`.
3. Publicar el release (sube instalador + `.sig` + `latest.json`):
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/win-publish.ps1 -Version 0.2.0 -Notes "Cambios"
   ```
4. Confirmar que el endpoint responde:
   ```
   https://github.com/programarum/asociacion_mutual/releases/latest/download/latest.json
   ```

## Cómo se actualiza la app (automático)

- Al arrancar, la app consulta `latest.json` (la BD SQLite no se toca).
- Si hay versión mayor y la firma es válida, muestra un banner.
- "Actualizar ahora" → `downloadAndInstall()` en segundo plano → `relaunch()`.
  La app reinicia sola con la versión nueva instalada en el lugar. Sin desinstalar.

## Salvedad (primer salto solamente)

La `0.1.0` instalada hoy NO tiene el módulo updater, por lo que el salto
`0.1.0 → 0.2.0` se hace instalando manualmente el `0.2.0-setup.exe` firmado.
A partir de `0.2.0` las actualizaciones (0.2.0 → 0.3.0, etc.) son automáticas
en todas las máquinas.
