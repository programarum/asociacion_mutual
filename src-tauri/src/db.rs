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

    migrate(&conn)?;

    Ok(conn)
}

pub fn migrate(conn: &Connection) -> Result<(), String> {
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

    migrate_add_columns(
        conn,
        "configuracion",
        &[
            ("nombre_empresa", "TEXT NOT NULL DEFAULT ''"),
            ("ruc", "TEXT NOT NULL DEFAULT ''"),
            ("direccion", "TEXT NOT NULL DEFAULT ''"),
            ("telefono", "TEXT NOT NULL DEFAULT ''"),
            ("email", "TEXT NOT NULL DEFAULT ''"),
            ("telefono1", "TEXT NOT NULL DEFAULT ''"),
            ("telefono2", "TEXT NOT NULL DEFAULT ''"),
            ("whatsapp", "TEXT NOT NULL DEFAULT ''"),
        ],
    )?;

    conn.execute(
        "UPDATE configuracion SET telefono1 = telefono WHERE telefono1 = '' AND telefono <> ''",
        [],
    )
    .map_err(|e| format!("Error al migrar telefono a telefono1: {}", e))?;

    backfill_timestamps(conn)?;

    Ok(())
}

const BACKFILL_STATEMENTS: &[&str] = &[
    "UPDATE beneficiarios
        SET created_at = fecha_afiliacion
      WHERE created_at IS NULL AND fecha_afiliacion IS NOT NULL AND fecha_afiliacion <> ''",
    "UPDATE asociados
        SET created_at = (SELECT MIN(p.fecha_pago) FROM pagos p WHERE p.asociado_id = asociados.id)
      WHERE created_at IS NULL
        AND EXISTS (SELECT 1 FROM pagos p WHERE p.asociado_id = asociados.id AND p.fecha_pago IS NOT NULL AND p.fecha_pago <> '')",
    "UPDATE pagos
        SET created_at = fecha_pago
      WHERE created_at IS NULL AND fecha_pago IS NOT NULL AND fecha_pago <> ''",
    "UPDATE fallecidos
        SET created_at = COALESCE(NULLIF(fecha_fallecimiento, ''), NULLIF(fecha_afiliacion, ''))
      WHERE created_at IS NULL
        AND COALESCE(NULLIF(fecha_fallecimiento, ''), NULLIF(fecha_afiliacion, '')) IS NOT NULL",
    "UPDATE asociados SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL",
    "UPDATE beneficiarios SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL",
    "UPDATE pagos SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL",
    "UPDATE fallecidos SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL",
    "UPDATE users SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL",
];

fn backfill_timestamps(conn: &Connection) -> Result<(), String> {
    for sql in BACKFILL_STATEMENTS {
        let changed = conn
            .execute(sql, [])
            .map_err(|e| format!("Error en backfill de fechas: {}", e))?;
        if changed > 0 {
            log::info!("Backfill de fechas: {} filas actualizadas", changed);
        }
    }
    Ok(())
}

fn existing_columns(conn: &rusqlite::Connection, table: &str) -> Result<Vec<String>, String> {
    let mut stmt = conn
        .prepare(&format!("PRAGMA table_info({})", table))
        .map_err(|e| e.to_string())?;
    let cols = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(cols)
}

fn migrate_add_columns(
    conn: &rusqlite::Connection,
    table: &str,
    columns: &[(&str, &str)],
) -> Result<(), String> {
    let cols = existing_columns(conn, table)?;
    for (name, def) in columns {
        if !cols.iter().any(|c| c == name) {
            conn.execute(
                &format!("ALTER TABLE {} ADD COLUMN {} {}", table, name, def),
                [],
            )
            .map_err(|e| format!("Error al agregar columna {}.{}: {}", table, name, e))?;
            log::info!("Migración: agregada columna {}.{}", table, name);
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_old_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "CREATE TABLE configuracion (
                id INTEGER PRIMARY KEY, cuota_mensual REAL, cuota_administracion REAL,
                created_at TEXT, updated_at TEXT
            );
            CREATE TABLE asociados (
                id INTEGER PRIMARY KEY, codigo TEXT, created_at TEXT, updated_at TEXT
            );
            CREATE TABLE beneficiarios (
                id INTEGER PRIMARY KEY, asociado_id INTEGER, fecha_afiliacion TEXT,
                created_at TEXT, updated_at TEXT
            );
            CREATE TABLE pagos (
                id INTEGER PRIMARY KEY, asociado_id INTEGER, fecha_pago TEXT,
                created_at TEXT, updated_at TEXT
            );
            CREATE TABLE fallecidos (
                id INTEGER PRIMARY KEY, fecha_fallecimiento TEXT, fecha_afiliacion TEXT,
                created_at TEXT, updated_at TEXT
            );
            CREATE TABLE users (
                id INTEGER PRIMARY KEY, name TEXT, created_at TEXT, updated_at TEXT
            );
            INSERT INTO configuracion (id, cuota_mensual, cuota_administracion) VALUES (1, 4500, 1000);
            INSERT INTO asociados (id, codigo) VALUES (1, 'A001');
            INSERT INTO pagos (id, asociado_id, fecha_pago) VALUES (1, 1, '2026-03-15');
            INSERT INTO pagos (id, asociado_id, fecha_pago) VALUES (2, 1, '2026-01-10');
            INSERT INTO beneficiarios (id, asociado_id, fecha_afiliacion) VALUES (1, 1, '2026-02-01');
            INSERT INTO fallecidos (id, fecha_fallecimiento) VALUES (1, '2026-05-05');
            INSERT INTO users (id, name) VALUES (1, 'admin');"
        ).unwrap();
        conn
    }

    #[test]
    fn test_migrate_adds_columns_and_backfills_dates() {
        let conn = setup_old_db();
        migrate(&conn).unwrap();

        let cols = existing_columns(&conn, "configuracion").unwrap();
        for c in ["nombre_empresa", "telefono1", "telefono2", "whatsapp"] {
            assert!(cols.iter().any(|x| x == c), "falta columna {}", c);
        }

        // El pago mas antiguo del asociado se usa como created_at.
        let created: Option<String> = conn
            .query_row("SELECT created_at FROM asociados WHERE id=1", [], |r| r.get(0))
            .unwrap();
        assert_eq!(created.as_deref(), Some("2026-01-10"));
        let updated: Option<String> = conn
            .query_row("SELECT updated_at FROM asociados WHERE id=1", [], |r| r.get(0))
            .unwrap();
        assert_eq!(updated.as_deref(), Some("2026-01-10"));

        let ben_created: String = conn
            .query_row("SELECT created_at FROM beneficiarios WHERE id=1", [], |r| r.get(0))
            .unwrap();
        assert_eq!(ben_created, "2026-02-01");

        let fall_created: String = conn
            .query_row("SELECT created_at FROM fallecidos WHERE id=1", [], |r| r.get(0))
            .unwrap();
        assert_eq!(fall_created, "2026-05-05");

        // users sin origen de fecha queda NULL, no se inventa.
        let user_created: Option<String> = conn
            .query_row("SELECT created_at FROM users WHERE id=1", [], |r| r.get(0))
            .unwrap();
        assert_eq!(user_created, None);
    }

    #[test]
    fn test_migrate_idempotente() {
        let conn = setup_old_db();
        migrate(&conn).unwrap();
        migrate(&conn).unwrap();
        let created: Option<String> = conn
            .query_row("SELECT created_at FROM asociados WHERE id=1", [], |r| r.get(0))
            .unwrap();
        assert_eq!(created.as_deref(), Some("2026-01-10"));
    }
}
