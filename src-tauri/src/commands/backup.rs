use crate::commands::session::Session;
use std::fs;
use tauri::{AppHandle, Manager, State};

#[tauri::command]
pub fn export_sqlite(app: AppHandle, session: State<'_, Session>) -> Result<String, String> {
    if !session.is_admin() {
        return Err("No tienes permisos".to_string());
    }

    let db_path = app.path().app_data_dir()
        .map_err(|e| e.to_string())?
        .join("mutual.sqlite");

    if !db_path.exists() {
        return Err("No se encontró el archivo de base de datos".to_string());
    }

    let backup_path = app.path().download_dir()
        .map_err(|e| e.to_string())?
        .join(format!("backup_mutual_{}.sqlite", chrono::Local::now().format("%Y-%m-%d_%H%M%S")));

    fs::copy(&db_path, &backup_path).map_err(|e| e.to_string())?;

    Ok(backup_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn export_sql(app: AppHandle, session: State<'_, Session>, db: State<'_, crate::commands::auth::DbState>) -> Result<String, String> {
    if !session.is_admin() {
        return Err("No tienes permisos".to_string());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let tablas = ["users", "asociados", "beneficiarios", "pagos", "coberturas", "configuracion", "fallecidos"];
    let mut sql = String::new();
    sql.push_str("-- Backup Asociación Mutual\n");
    sql.push_str(&format!("-- Fecha: {}\n\n", chrono::Local::now().to_rfc3339()));
    sql.push_str("PRAGMA foreign_keys=OFF;\n\n");

    for tabla in &tablas {
        let existe: Option<String> = conn.query_row(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name=?1",
            [tabla],
            |row| row.get(0),
        ).ok();

        if let Some(schema) = existe {
            sql.push_str(&format!("-- Tabla: {}\n", tabla));
            sql.push_str(&format!("DROP TABLE IF EXISTS `{}`;\n", tabla));
            sql.push_str(&schema);
            sql.push_str(";\n\n");

            let mut stmt = conn.prepare(&format!("SELECT * FROM {}", tabla)).map_err(|e| e.to_string())?;
            let col_count = stmt.column_count();
            let col_names: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();

            let rows = stmt.query_map([], |row| {
                let mut vals = Vec::new();
                for i in 0..col_count {
                    let val: rusqlite::Result<String> = row.get_ref(i).map(|v| match v {
                        rusqlite::types::ValueRef::Null => "NULL".to_string(),
                        rusqlite::types::ValueRef::Integer(n) => n.to_string(),
                        rusqlite::types::ValueRef::Real(f) => f.to_string(),
                        rusqlite::types::ValueRef::Text(t) => format!("'{}'", String::from_utf8_lossy(t).replace("'", "''")),
                        rusqlite::types::ValueRef::Blob(b) => format!("'{}'", String::from_utf8_lossy(b).replace("'", "''")),
                    });
                    vals.push(val.unwrap_or_else(|_| "NULL".to_string()));
                }
                Ok(vals)
            }).map_err(|e| e.to_string())?;

            for row in rows {
                let vals = row.map_err(|e| e.to_string())?;
                sql.push_str(&format!("INSERT INTO `{}` (`{}`) VALUES ({});\n", tabla, col_names.join("`, `"), vals.join(", ")));
            }
            sql.push('\n');
        }
    }

    sql.push_str("PRAGMA foreign_keys=ON;\n");

    let backup_path = app.path().download_dir()
        .map_err(|e| e.to_string())?
        .join(format!("backup_mutual_{}.sql", chrono::Local::now().format("%Y-%m-%d_%H%M%S")));

    fs::write(&backup_path, sql).map_err(|e| e.to_string())?;

    Ok(backup_path.to_string_lossy().to_string())
}
