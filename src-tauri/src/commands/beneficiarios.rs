use crate::commands::auth::DbState;
use crate::models::asociado::PaginatedResponse;
use crate::models::beneficiario::*;
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub fn list_beneficiarios(asociado_id: i64, db: State<'_, DbState>) -> Result<PaginatedResponse<Beneficiario>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let total: i64 = conn.query_row("SELECT COUNT(*) FROM beneficiarios WHERE asociado_id = ?1", [asociado_id], |row| row.get(0)).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, asociado_id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        documento, fecha_nacimiento, parentesco, sexo, fecha_afiliacion, created_at, updated_at
        FROM beneficiarios WHERE asociado_id = ?1 ORDER BY id"
    ).map_err(|e| e.to_string())?;

    let data = stmt.query_map([asociado_id], |row| {
        Ok(Beneficiario {
            id: row.get(0)?, asociado_id: row.get(1)?, primer_nombre: row.get(2)?,
            segundo_nombre: row.get(3)?, primer_apellido: row.get(4)?, segundo_apellido: row.get(5)?,
            documento: row.get(6)?, fecha_nacimiento: row.get(7)?, parentesco: row.get(8)?,
            sexo: row.get(9)?, fecha_afiliacion: row.get(10)?, created_at: row.get(11)?, updated_at: row.get(12)?,
        })
    }).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    Ok(PaginatedResponse { data, total, per_page: total, current_page: 1, last_page: 1 })
}

#[tauri::command]
pub fn create_beneficiario(asociado_id: i64, req: CreateBeneficiarioRequest, db: State<'_, DbState>) -> Result<Beneficiario, String> {
    let id = {
        let conn = db.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO beneficiarios (asociado_id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, documento, fecha_nacimiento, parentesco, sexo, fecha_afiliacion)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![asociado_id, req.primer_nombre, req.segundo_nombre, req.primer_apellido, req.segundo_apellido, req.documento, req.fecha_nacimiento, req.parentesco, req.sexo, req.fecha_afiliacion],
        ).map_err(|e| e.to_string())?;
        conn.last_insert_rowid()
    };
    list_beneficiarios(asociado_id, db)?.data.into_iter().find(|b| b.id == id).ok_or("Error al crear".to_string())
}

#[tauri::command]
pub fn update_beneficiario(asociado_id: i64, id: i64, req: CreateBeneficiarioRequest, db: State<'_, DbState>) -> Result<Beneficiario, String> {
    {
        let conn = db.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE beneficiarios SET primer_nombre=?1, segundo_nombre=?2, primer_apellido=?3, segundo_apellido=?4, documento=?5, fecha_nacimiento=?6, parentesco=?7, sexo=?8, fecha_afiliacion=?9 WHERE id=?10 AND asociado_id=?11",
            params![req.primer_nombre, req.segundo_nombre, req.primer_apellido, req.segundo_apellido, req.documento, req.fecha_nacimiento, req.parentesco, req.sexo, req.fecha_afiliacion, id, asociado_id],
        ).map_err(|e| e.to_string())?;
    }
    list_beneficiarios(asociado_id, db)?.data.into_iter().find(|b| b.id == id).ok_or("No encontrado".to_string())
}

#[tauri::command]
pub fn delete_beneficiario(asociado_id: i64, id: i64, db: State<'_, DbState>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM beneficiarios WHERE id=?1 AND asociado_id=?2", params![id, asociado_id]).map_err(|e| e.to_string())?;
    Ok(())
}
