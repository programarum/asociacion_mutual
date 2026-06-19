use crate::commands::auth::DbState;
use crate::models::asociado::{Asociado, PaginatedResponse};
use crate::models::cobertura::CoberturaResponse;
use crate::services::cobertura_service::CoberturaService;
use tauri::State;

#[tauri::command]
pub fn get_cobertura(asociado_id: i64, db: State<'_, DbState>) -> Result<CoberturaResponse, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    CoberturaService::get_cobertura_response(&conn, asociado_id)
}

#[tauri::command]
pub fn list_morosos(db: State<'_, DbState>) -> Result<PaginatedResponse<Asociado>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT a.id, a.codigo, a.primer_nombre, a.segundo_nombre, a.primer_apellido, a.segundo_apellido,
        a.documento, a.email, a.telefono, a.direccion, a.mes_actual, a.mese_pagados, a.gran_total,
        a.created_at, a.updated_at
        FROM asociados a
        INNER JOIN coberturas c ON c.asociado_id = a.id AND c.estado = 'moroso'
        ORDER BY a.id DESC"
    ).map_err(|e| e.to_string())?;

    let data = stmt.query_map([], |row| {
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
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;

    let total = data.len() as i64;
    Ok(PaginatedResponse { data, total, per_page: total, current_page: 1, last_page: 1 })
}
