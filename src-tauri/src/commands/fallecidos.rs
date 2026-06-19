use crate::commands::auth::DbState;
use crate::commands::session::Session;
use crate::models::asociado::PaginatedResponse;
use crate::models::fallecido::*;
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub fn list_fallecidos(search: Option<String>, db: State<'_, DbState>) -> Result<PaginatedResponse<Fallecido>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut query = "SELECT id, tipo, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, documento, fecha_fallecimiento, fecha_afiliacion, asociado_origen_id, parentesco, sexo, datos_extras, created_at, updated_at FROM fallecidos".to_string();
    let mut count_q = "SELECT COUNT(*) FROM fallecidos".to_string();

    if let Some(ref s) = search {
        let f = format!(" WHERE primer_nombre LIKE '%{}%' OR segundo_nombre LIKE '%{}%' OR primer_apellido LIKE '%{}%' OR segundo_apellido LIKE '%{}%' OR documento LIKE '%{}%'", s, s, s, s, s);
        query.push_str(&f);
        count_q.push_str(&f);
    }
    query.push_str(" ORDER BY fecha_fallecimiento DESC");

    let total: i64 = conn.query_row(&count_q, [], |row| row.get(0)).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let data = stmt.query_map([], |row| {
        Ok(Fallecido {
            id: row.get(0)?, tipo: row.get(1)?, primer_nombre: row.get(2)?, segundo_nombre: row.get(3)?,
            primer_apellido: row.get(4)?, segundo_apellido: row.get(5)?, documento: row.get(6)?,
            fecha_fallecimiento: row.get(7)?, fecha_afiliacion: row.get(8)?, asociado_origen_id: row.get(9)?,
            parentesco: row.get(10)?, sexo: row.get(11)?, datos_extras: row.get(12)?,
            created_at: row.get(13)?, updated_at: row.get(14)?,
        })
    }).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    Ok(PaginatedResponse { data, total, per_page: total, current_page: 1, last_page: 1 })
}

#[tauri::command]
pub fn marcar_asociado_fallecido(
    asociado_id: i64,
    req: MarcarAsociadoFallecidoRequest,
    db: State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let asoc = tx.query_row(
        "SELECT codigo, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, documento, email, telefono, direccion, mes_actual, mese_pagados, gran_total FROM asociados WHERE id=?1",
        [asociado_id],
        |row| {
            Ok((
                row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, Option<String>>(2)?,
                row.get::<_, String>(3)?, row.get::<_, Option<String>>(4)?, row.get::<_, String>(5)?,
                row.get::<_, String>(6)?, row.get::<_, String>(7)?, row.get::<_, String>(8)?,
                row.get::<_, Option<String>>(9)?, row.get::<_, Option<String>>(10)?, row.get::<_, Option<String>>(11)?,
            ))
        },
    ).map_err(|e| e.to_string())?;

    let extras = serde_json::json!({
        "email": asoc.6, "telefono": asoc.7, "direccion": asoc.8, "codigo": asoc.0,
        "mes_actual": asoc.9, "mese_pagados": asoc.10, "gran_total": asoc.11
    }).to_string();

    tx.execute(
        "INSERT INTO fallecidos (tipo, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, documento, fecha_fallecimiento, asociado_origen_id, datos_extras)
        VALUES ('asociado', ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![asoc.1, asoc.2, asoc.3, asoc.4, asoc.5, req.fecha_fallecimiento, asociado_id, extras],
    ).map_err(|e| e.to_string())?;

    let ben = tx.query_row(
        "SELECT primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, documento FROM beneficiarios WHERE id=?1 AND asociado_id=?2",
        params![req.beneficiario_id, asociado_id],
        |row| Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?, row.get::<_, String>(2)?, row.get::<_, Option<String>>(3)?, row.get::<_, String>(4)?)),
    ).map_err(|_| "El beneficiario no pertenece a este asociado".to_string())?;

    tx.execute(
        "INSERT INTO asociados (codigo, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, documento, email, telefono, direccion, mes_actual, mese_pagados, gran_total)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![asoc.0, ben.0, ben.1, ben.2, ben.3, ben.4, asoc.6, asoc.7, asoc.8, asoc.9, asoc.10, asoc.11],
    ).map_err(|e| e.to_string())?;

    let nuevo_id = tx.last_insert_rowid();
    tx.execute("UPDATE beneficiarios SET asociado_id=?1 WHERE asociado_id=?2 AND id!=?3", params![nuevo_id, asociado_id, req.beneficiario_id]).map_err(|e| e.to_string())?;
    tx.execute("UPDATE pagos SET asociado_id=?1 WHERE asociado_id=?2", params![nuevo_id, asociado_id]).map_err(|e| e.to_string())?;
    tx.execute("UPDATE coberturas SET asociado_id=?1 WHERE asociado_id=?2", params![nuevo_id, asociado_id]).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM beneficiarios WHERE id=?1", params![req.beneficiario_id]).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM asociados WHERE id=?1", [asociado_id]).map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(serde_json::json!({ "message": "Asociado marcado como fallecido. Beneficiario promocionado." }))
}

#[tauri::command]
pub fn marcar_beneficiario_fallecido(
    asociado_id: i64,
    beneficiario_id: i64,
    req: MarcarBeneficiarioFallecidoRequest,
    db: State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let ben = conn.query_row(
        "SELECT primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, documento, fecha_afiliacion, parentesco, sexo
         FROM beneficiarios WHERE id=?1 AND asociado_id=?2",
        params![beneficiario_id, asociado_id],
        |row| Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?, row.get::<_, String>(2)?, row.get::<_, Option<String>>(3)?, row.get::<_, String>(4)?, row.get::<_, Option<String>>(5)?, row.get::<_, String>(6)?, row.get::<_, String>(7)?)),
    ).map_err(|_| "El beneficiario no pertenece a este asociado".to_string())?;

    conn.execute(
        "INSERT INTO fallecidos (tipo, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, documento, fecha_fallecimiento, fecha_afiliacion, asociado_origen_id, parentesco, sexo)
        VALUES ('beneficiario', ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![ben.0, ben.1, ben.2, ben.3, ben.4, req.fecha_fallecimiento, ben.5, asociado_id, ben.6, ben.7],
    ).map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM beneficiarios WHERE id=?1", params![beneficiario_id]).map_err(|e| e.to_string())?;

    Ok(serde_json::json!({ "message": "Beneficiario marcado como fallecido." }))
}
