use crate::commands::auth::DbState;
use crate::commands::session::Session;
use crate::models::configuracion::*;
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub fn get_configuracion(db: State<'_, DbState>) -> Result<Configuracion, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::services::cobertura_service::CoberturaService::get_configuracion(&conn)
}

#[tauri::command]
pub fn update_configuracion(
    req: UpdateConfiguracionRequest,
    db: State<'_, DbState>,
    session: State<'_, Session>,
) -> Result<Configuracion, String> {
    if !session.is_admin() {
        return Err("No tienes permisos para realizar esta acción".to_string());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE configuracion SET cuota_mensual = ?1, cuota_administracion = ?2,
            nombre_empresa = ?3, ruc = ?4, direccion = ?5,
            telefono1 = ?6, telefono2 = ?7, whatsapp = ?8, email = ?9,
            updated_at = ?10
         WHERE id = 1",
        params![req.cuota_mensual, req.cuota_administracion, req.nombre_empresa, req.ruc, req.direccion, req.telefono1, req.telefono2, req.whatsapp, req.email, crate::services::timestamps::ahora_sql()],
    ).map_err(|e| e.to_string())?;

    crate::services::cobertura_service::CoberturaService::get_configuracion(&conn)
}
