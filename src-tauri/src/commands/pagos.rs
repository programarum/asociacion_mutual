use crate::commands::auth::DbState;
use crate::models::asociado::PaginatedResponse;
use crate::models::pago::*;
use crate::services::cobertura_service::CoberturaService;
use crate::services::numero_a_letras;
use chrono::{NaiveDate, Datelike};
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub fn list_pagos(asociado_id: i64, db: State<'_, DbState>) -> Result<PaginatedResponse<Pago>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let total: i64 = conn.query_row("SELECT COUNT(*) FROM pagos WHERE asociado_id=?1", [asociado_id], |row| row.get(0)).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, asociado_id, meses_pagados, monto, fecha_pago, mes_desde, mes_hasta, created_at, updated_at
        FROM pagos WHERE asociado_id=?1 ORDER BY fecha_pago DESC"
    ).map_err(|e| e.to_string())?;

    let data = stmt.query_map([asociado_id], |row| {
        Ok(Pago {
            id: row.get(0)?, asociado_id: row.get(1)?, meses_pagados: row.get(2)?,
            monto: row.get(3)?, fecha_pago: row.get(4)?, mes_desde: row.get(5)?,
            mes_hasta: row.get(6)?, created_at: row.get(7)?, updated_at: row.get(8)?,
        })
    }).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    Ok(PaginatedResponse { data, total, per_page: total, current_page: 1, last_page: 1 })
}

#[tauri::command]
pub fn create_pago(asociado_id: i64, meses: i64, db: State<'_, DbState>) -> Result<Pago, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    CoberturaService::registrar_pago(&conn, asociado_id, meses)
}

#[tauri::command]
pub fn get_comprobante(asociado_id: i64, pago_id: i64, db: State<'_, DbState>) -> Result<ComprobanteData, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let asociado = conn.query_row(
        "SELECT codigo, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, documento FROM asociados WHERE id=?1",
        [asociado_id],
        |row| {
            Ok((
                row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, Option<String>>(2)?,
                row.get::<_, String>(3)?, row.get::<_, Option<String>>(4)?, row.get::<_, String>(5)?,
            ))
        },
    ).map_err(|e| e.to_string())?;

    let pago = conn.query_row(
        "SELECT id, meses_pagados, monto, fecha_pago, mes_desde, mes_hasta FROM pagos WHERE id=?1 AND asociado_id=?2",
        params![pago_id, asociado_id],
        |row| {
            Ok((
                row.get::<_, i64>(0)?, row.get::<_, i64>(1)?, row.get::<_, f64>(2)?,
                row.get::<_, String>(3)?, row.get::<_, String>(4)?, row.get::<_, String>(5)?,
            ))
        },
    ).map_err(|_| "El pago no pertenece a este asociado".to_string())?;

    let config = CoberturaService::get_configuracion(&conn)?;

    let nombre_completo = format!("{} {} {} {}",
        asociado.1, asociado.2.unwrap_or_default(), asociado.3, asociado.4.unwrap_or_default())
        .split_whitespace().collect::<Vec<_>>().join(" ");

    let mut ben_stmt = conn.prepare("SELECT id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, parentesco, documento FROM beneficiarios WHERE asociado_id=?1")
        .map_err(|e| e.to_string())?;
    let beneficiarios = ben_stmt.query_map([asociado_id], |row| {
        let n = format!("{} {} {} {}", row.get::<_, String>(1)?, row.get::<_, Option<String>>(2)?.unwrap_or_default(), row.get::<_, String>(3)?, row.get::<_, Option<String>>(4)?.unwrap_or_default())
            .split_whitespace().collect::<Vec<_>>().join(" ");
        Ok(ComprobanteBeneficiario { id: row.get(0)?, nombre_completo: n, parentesco: row.get(5)?, documento: row.get(6)? })
    }).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    let monto_letras = numero_a_letras::convertir(pago.2);
    let monto_formateado = format!("${}", format!("{:.2}", pago.2).replace('.', ","));

    let meses_nombres = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    let mut meses_cubiertos = Vec::new();
    if let Ok(mes_desde) = NaiveDate::parse_from_str(&pago.4, "%Y-%m-%d") {
        for i in 0..pago.1 {
            let (y, m) = if mes_desde.month() as i64 + i > 12 {
                (mes_desde.year() as i64 + (mes_desde.month() as i64 + i - 1) / 12, ((mes_desde.month() as i64 + i - 1) % 12) + 1)
            } else {
                (mes_desde.year() as i64, mes_desde.month() as i64 + i)
            };
            let m_idx = m as usize;
            meses_cubiertos.push(MesCubierto {
                mes: meses_nombres[m_idx].to_string(),
                ano: y,
                label: format!("{} {}", meses_nombres[m_idx], y),
            });
        }
    }

    Ok(ComprobanteData {
        recibo_numero: pago.0,
        asociado: ComprobanteAsociado { codigo: asociado.0, nombre_completo, documento: asociado.5 },
        beneficiarios,
        pago: ComprobantePago {
            id: pago.0, meses_pagados: pago.1, monto: pago.2, monto_formateado, monto_letras,
            fecha_pago: pago.3, mes_desde: pago.4, mes_hasta: pago.5, meses_cubiertos,
        },
        configuracion: ComprobanteConfig { cuota_mensual: config.cuota_mensual, cuota_administracion: config.cuota_administracion },
        fecha_impresion: chrono::Local::now().date_naive().to_string(),
    })
}
