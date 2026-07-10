use rusqlite::Connection;
use std::fs;
use tauri::{AppHandle, Manager};

/// Inicializa la base de datos SQLite. En el primer inicio, copia mutual.sqlite
/// desde los recursos empaquetados al directorio de datos de la aplicación.
pub fn init_db(app: &AppHandle) -> Result<Connection, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("No se pudo obtener app_data_dir: {}", e))?;

    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("No se pudo crear app_data_dir: {}", e))?;

    let db_path = app_data_dir.join("mutual.sqlite");

    if !db_path.exists() {
        let resource_path = app
            .path()
            .resolve("resources/mutual.sqlite", tauri::path::BaseDirectory::Resource)
            .map_err(|e| format!("No se pudo resolver recurso mutual.sqlite: {}", e))?;

        fs::copy(&resource_path, &db_path)
            .map_err(|e| format!("No se pudo copiar mutual.sqlite: {}", e))?;

        log::info!("BD copiada a: {:?}", db_path);
    }

    let conn = Connection::open(&db_path)
        .map_err(|e| format!("No se pudo abrir SQLite: {}", e))?;

    conn.execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|e| format!("Error al habilitar foreign_keys: {}", e))?;

    // Crear tabla de licencia si no existe (para BDs que ya existían antes de la feature de licencia)
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS licencia (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            machine_hash TEXT NOT NULL,
            license_key TEXT NOT NULL,
            fecha_activacion DATETIME NOT NULL,
            created_at DATETIME,
            updated_at DATETIME
        );"
    ).map_err(|e| format!("Error al crear tabla licencia: {}", e))?;

    Ok(conn)
}
