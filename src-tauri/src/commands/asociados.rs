use crate::commands::auth::DbState;
use crate::commands::session::Session;
use crate::models::asociado::*;
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub fn list_asociados(
    search: Option<String>,
    db: State<'_, DbState>,
) -> Result<PaginatedResponse<Asociado>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut query = String::from(
        "SELECT id, codigo, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        documento, email, telefono, direccion, mes_actual, mese_pagados, gran_total,
        created_at, updated_at FROM asociados",
    );

    let mut count_query = String::from("SELECT COUNT(*) FROM asociados");

    if let Some(ref s) = search {
        let filter = format!(
            " WHERE codigo LIKE '%{}%' OR primer_nombre LIKE '%{}%' OR segundo_nombre LIKE '%{}%'
            OR primer_apellido LIKE '%{}%' OR segundo_apellido LIKE '%{}%'
            OR documento LIKE '%{}%' OR email LIKE '%{}%'",
            s, s, s, s, s, s, s
        );
        query.push_str(&filter);
        count_query.push_str(&filter);
    }

    query.push_str(" ORDER BY id DESC");

    let total: i64 = conn.query_row(&count_query, [], |row| row.get(0)).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let asociados = stmt
        .query_map([], |row| {
            Ok(Asociado {
                id: row.get(0)?,
                codigo: row.get(1)?,
                primer_nombre: row.get(2)?,
                segundo_nombre: row.get(3)?,
                primer_apellido: row.get(4)?,
                segundo_apellido: row.get(5)?,
                documento: row.get(6)?,
                email: row.get(7)?,
                telefono: row.get(8)?,
                direccion: row.get(9)?,
                mes_actual: row.get(10)?,
                mese_pagados: row.get(11)?,
                gran_total: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
                beneficiarios: None,
                cobertura: None,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(PaginatedResponse {
        data: asociados,
        total,
        per_page: total,
        current_page: 1,
        last_page: 1,
    })
}

#[tauri::command]
pub fn get_asociado(id: i64, db: State<'_, DbState>) -> Result<Asociado, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let asociado = conn.query_row(
        "SELECT id, codigo, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        documento, email, telefono, direccion, mes_actual, mese_pagados, gran_total,
        created_at, updated_at FROM asociados WHERE id = ?1",
        [id],
        |row| {
            Ok(Asociado {
                id: row.get(0)?,
                codigo: row.get(1)?,
                primer_nombre: row.get(2)?,
                segundo_nombre: row.get(3)?,
                primer_apellido: row.get(4)?,
                segundo_apellido: row.get(5)?,
                documento: row.get(6)?,
                email: row.get(7)?,
                telefono: row.get(8)?,
                direccion: row.get(9)?,
                mes_actual: row.get(10)?,
                mese_pagados: row.get(11)?,
                gran_total: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
                beneficiarios: None,
                cobertura: None,
            })
        },
    ).map_err(|e| e.to_string())?;

    Ok(asociado)
}

#[tauri::command]
pub fn create_asociado(
    codigo: String,
    primer_nombre: String,
    segundo_nombre: Option<String>,
    primer_apellido: String,
    segundo_apellido: Option<String>,
    documento: String,
    email: String,
    telefono: String,
    direccion: String,
    db: State<'_, DbState>,
) -> Result<Asociado, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO asociados (codigo, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        documento, email, telefono, direccion, mes_actual)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            codigo, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
            documento, email, telefono, direccion, chrono::Local::now().date_naive().to_string(),
        ],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    drop(conn);
    get_asociado(id, db)
}

#[tauri::command]
pub fn update_asociado(
    id: i64,
    codigo: Option<String>,
    primer_nombre: Option<String>,
    segundo_nombre: Option<String>,
    primer_apellido: Option<String>,
    segundo_apellido: Option<String>,
    documento: Option<String>,
    email: Option<String>,
    telefono: Option<String>,
    direccion: Option<String>,
    db: State<'_, DbState>,
) -> Result<Asociado, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    if let Some(v) = codigo { conn.execute("UPDATE asociados SET codigo = ?1 WHERE id = ?2", params![v, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = primer_nombre { conn.execute("UPDATE asociados SET primer_nombre = ?1 WHERE id = ?2", params![v, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = segundo_nombre { conn.execute("UPDATE asociados SET segundo_nombre = ?1 WHERE id = ?2", params![v, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = primer_apellido { conn.execute("UPDATE asociados SET primer_apellido = ?1 WHERE id = ?2", params![v, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = segundo_apellido { conn.execute("UPDATE asociados SET segundo_apellido = ?1 WHERE id = ?2", params![v, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = documento { conn.execute("UPDATE asociados SET documento = ?1 WHERE id = ?2", params![v, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = email { conn.execute("UPDATE asociados SET email = ?1 WHERE id = ?2", params![v, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = telefono { conn.execute("UPDATE asociados SET telefono = ?1 WHERE id = ?2", params![v, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = direccion { conn.execute("UPDATE asociados SET direccion = ?1 WHERE id = ?2", params![v, id]).map_err(|e| e.to_string())?; }

    drop(conn);
    get_asociado(id, db)
}

#[tauri::command]
pub fn delete_asociado(id: i64, db: State<'_, DbState>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM asociados WHERE id = ?1", [id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn transfer_and_delete(
    asociado_id: i64,
    beneficiario_id: i64,
    db: State<'_, DbState>,
) -> Result<Asociado, String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let asociado = tx.query_row(
        "SELECT codigo, email, telefono, direccion, mes_actual, mese_pagados, gran_total FROM asociados WHERE id = ?1",
        [asociado_id],
        |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, Option<String>>(6)?,
            ))
        },
    ).map_err(|e| e.to_string())?;

    let ben = tx.query_row(
        "SELECT primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, documento
         FROM beneficiarios WHERE id = ?1 AND asociado_id = ?2",
        params![beneficiario_id, asociado_id],
        |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, Option<String>>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, String>(4)?,
            ))
        },
    ).map_err(|_| "El beneficiario no pertenece a este asociado".to_string())?;

    tx.execute(
        "INSERT INTO asociados (codigo, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        documento, email, telefono, direccion, mes_actual, mese_pagados, gran_total)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![asociado.0, ben.0, ben.1, ben.2, ben.3, ben.4, asociado.1, asociado.2, asociado.3, asociado.4, asociado.5, asociado.6],
    ).map_err(|e| e.to_string())?;

    let nuevo_id = tx.last_insert_rowid();

    tx.execute(
        "UPDATE beneficiarios SET asociado_id = ?1 WHERE asociado_id = ?2 AND id != ?3",
        params![nuevo_id, asociado_id, beneficiario_id],
    ).map_err(|e| e.to_string())?;

    tx.execute("UPDATE pagos SET asociado_id = ?1 WHERE asociado_id = ?2", params![nuevo_id, asociado_id]).map_err(|e| e.to_string())?;
    tx.execute("UPDATE coberturas SET asociado_id = ?1 WHERE asociado_id = ?2", params![nuevo_id, asociado_id]).map_err(|e| e.to_string())?;

    tx.execute("DELETE FROM beneficiarios WHERE id = ?1", params![beneficiario_id]).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM asociados WHERE id = ?1", [asociado_id]).map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;
    drop(conn);

    get_asociado(nuevo_id, db)
}
