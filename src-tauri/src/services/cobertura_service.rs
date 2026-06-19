use crate::models::configuracion::Configuracion;
use crate::models::cobertura::{Cobertura, CoberturaResponse};
use rusqlite::{params, Connection};
use chrono::{NaiveDate, Datelike};

pub struct CoberturaService;

impl CoberturaService {
    pub fn get_configuracion(conn: &Connection) -> Result<Configuracion, String> {
        match conn.query_row(
            "SELECT id, cuota_mensual, cuota_administracion FROM configuracion WHERE id = 1",
            [],
            |row| {
                Ok(Configuracion {
                    id: row.get(0)?,
                    cuota_mensual: row.get(1)?,
                    cuota_administracion: row.get(2)?,
                })
            },
        ) {
            Ok(c) => Ok(c),
            Err(_) => {
                conn.execute(
                    "INSERT INTO configuracion (id, cuota_mensual, cuota_administracion) VALUES (1, 0, 0)",
                    [],
                ).map_err(|e| e.to_string())?;
                Ok(Configuracion {
                    id: 1,
                    cuota_mensual: 0.0,
                    cuota_administracion: 0.0,
                })
            }
        }
    }

    pub fn max_meses_pagables(conn: &Connection, asociado_id: i64) -> Result<i64, String> {
        let hoy = chrono::Local::now().date_naive();
        let fin_anio = NaiveDate::from_ymd_opt(hoy.year(), 12, 31).unwrap();

        let cobertura = Self::get_cobertura(conn, asociado_id).map_err(|e| e.to_string())?;

        let mut base = hoy;

        if let Some(cob) = &cobertura {
            if let Some(ref mph) = cob.mes_pagado_hasta {
                if let Ok(pagado_hasta) = NaiveDate::parse_from_str(mph, "%Y-%m-%d") {
                    if pagado_hasta >= hoy {
                        let next = pagado_hasta + chrono::Duration::days(1);
                        let next_month = NaiveDate::from_ymd_opt(
                            next.year() + if next.month() == 12 { 1 } else { 0 },
                            if next.month() == 12 { 1 } else { next.month() + 1 },
                            1,
                        ).unwrap();
                        base = next_month;
                    }
                }
            }
        }

        if base > fin_anio {
            return Ok(0);
        }

        let meses = (fin_anio.year() - base.year()) * 12 + fin_anio.month() as i32 - base.month() as i32 + 1;
        Ok(std::cmp::min(meses as i64, 12))
    }

    pub fn get_cobertura(conn: &Connection, asociado_id: i64) -> Result<Option<Cobertura>, String> {
        let result = conn.query_row(
            "SELECT id, asociado_id, fecha_inicio, mes_pagado_hasta, estado, created_at, updated_at
             FROM coberturas WHERE asociado_id = ?1",
            [asociado_id],
            |row| {
                Ok(Cobertura {
                    id: row.get(0)?,
                    asociado_id: row.get(1)?,
                    fecha_inicio: row.get(2)?,
                    mes_pagado_hasta: row.get(3)?,
                    estado: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            },
        );

        match result {
            Ok(c) => Ok(Some(c)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    pub fn recalcular_estado(conn: &Connection, asociado_id: i64) -> Result<String, String> {
        let cobertura = Self::get_cobertura(conn, asociado_id).map_err(|e| e.to_string())?;
        let hoy = chrono::Local::now().date_naive();

        let estado = match cobertura {
            Some(ref cob) if cob.mes_pagado_hasta.is_some() => {
                let mph = NaiveDate::parse_from_str(cob.mes_pagado_hasta.as_ref().unwrap(), "%Y-%m-%d")
                    .map_err(|e| e.to_string()).map_err(|e| e.to_string())?;
                if mph >= hoy {
                    "vigente"
                } else {
                    "moroso"
                }
            }
            _ => "moroso",
        };

        if let Some(cob) = &cobertura {
            if cob.estado != estado {
                conn.execute(
                    "UPDATE coberturas SET estado = ?1 WHERE asociado_id = ?2",
                    params![estado, asociado_id],
                ).map_err(|e| e.to_string())?;
            }
        }

        Ok(estado.to_string())
    }

    pub fn registrar_pago(
        conn: &Connection,
        asociado_id: i64,
        meses: i64,
    ) -> Result<crate::models::pago::Pago, String> {
        let max = Self::max_meses_pagables(conn, asociado_id).map_err(|e| e.to_string())?;

        if meses < 1 || meses > max {
            return Err(format!("La cantidad de meses ({}) no es válida. Máximo pagable: {}", meses, max));
        }

        let config = Self::get_configuracion(conn).map_err(|e| e.to_string())?;
        let ben_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM beneficiarios WHERE asociado_id = ?1",
                [asociado_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string()).map_err(|e| e.to_string())?;

        let personas = 1 + ben_count;
        let monto_por_mes = (config.cuota_mensual * personas as f64) + config.cuota_administracion;
        let monto = monto_por_mes * meses as f64;

        let hoy = chrono::Local::now().date_naive();

        let cobertura = Self::get_cobertura(conn, asociado_id).map_err(|e| e.to_string())?;

        let mut mes_desde = hoy;
        if let Some(cob) = &cobertura {
            if let Some(ref mph) = cob.mes_pagado_hasta {
                if let Ok(pagado_hasta) = NaiveDate::parse_from_str(mph, "%Y-%m-%d") {
                    if pagado_hasta >= hoy {
                        let next = pagado_hasta + chrono::Duration::days(1);
                        mes_desde = NaiveDate::from_ymd_opt(
                            next.year() + if next.month() == 12 { 1 } else { 0 },
                            if next.month() == 12 { 1 } else { next.month() + 1 },
                            1,
                        ).unwrap();
                    }
                }
            }
        }

        let mes_hasta = {
            let mut d = mes_desde;
            for _ in 0..(meses - 1) {
                let next = d + chrono::Duration::days(1);
                d = NaiveDate::from_ymd_opt(
                    next.year() + if next.month() == 12 { 1 } else { 0 },
                    if next.month() == 12 { 1 } else { next.month() + 1 },
                    1,
                ).unwrap();
            }
            let next_month = d + chrono::Duration::days(1);
            NaiveDate::from_ymd_opt(
                next_month.year() + if next_month.month() == 12 { 1 } else { 0 },
                if next_month.month() == 12 { 1 } else { next_month.month() + 1 },
                1,
            ).unwrap() - chrono::Duration::days(1)
        };

        conn.execute(
            "INSERT INTO pagos (asociado_id, meses_pagados, monto, fecha_pago, mes_desde, mes_hasta)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                asociado_id,
                meses,
                monto,
                hoy.to_string(),
                mes_desde.to_string(),
                mes_hasta.to_string(),
            ],
        ).map_err(|e| e.to_string())?;

        let pago_id = conn.last_insert_rowid();

        if cobertura.is_some() {
            conn.execute(
                "UPDATE coberturas SET mes_pagado_hasta = ?1, estado = 'vigente' WHERE asociado_id = ?2",
                params![mes_hasta.to_string(), asociado_id],
            ).map_err(|e| e.to_string())?;
        } else {
            conn.execute(
                "INSERT INTO coberturas (asociado_id, fecha_inicio, mes_pagado_hasta, estado)
                 VALUES (?1, ?2, ?3, 'vigente')",
                params![asociado_id, hoy.to_string(), mes_hasta.to_string()],
            ).map_err(|e| e.to_string())?;
        }

        let total_meses: i64 = conn
            .query_row(
                "SELECT COALESCE(SUM(meses_pagados), 0) FROM pagos WHERE asociado_id = ?1",
                [asociado_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string()).map_err(|e| e.to_string())?;

        let gran_total: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE asociado_id = ?1",
                [asociado_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string()).map_err(|e| e.to_string())?;

        conn.execute(
            "UPDATE asociados SET mes_actual = ?1, mese_pagados = ?2, gran_total = ?3 WHERE id = ?4",
            params![
                mes_hasta.to_string(),
                total_meses.to_string(),
                format!("{:.2}", gran_total),
                asociado_id,
            ],
        ).map_err(|e| e.to_string())?;

        Ok(crate::models::pago::Pago {
            id: pago_id,
            asociado_id,
            meses_pagados: meses,
            monto,
            fecha_pago: hoy.to_string(),
            mes_desde: mes_desde.to_string(),
            mes_hasta: mes_hasta.to_string(),
            created_at: Some(chrono::Utc::now().to_rfc3339()),
            updated_at: Some(chrono::Utc::now().to_rfc3339()),
        })
    }

    pub fn get_cobertura_response(
        conn: &Connection,
        asociado_id: i64,
    ) -> Result<CoberturaResponse, String> {
        let cobertura = Self::get_cobertura(conn, asociado_id).map_err(|e| e.to_string())?;
        let estado = Self::recalcular_estado(conn, asociado_id).map_err(|e| e.to_string())?;
        let max_meses = Self::max_meses_pagables(conn, asociado_id).map_err(|e| e.to_string())?;
        let config = Self::get_configuracion(conn).map_err(|e| e.to_string())?;

        let ben_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM beneficiarios WHERE asociado_id = ?1",
                [asociado_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string()).map_err(|e| e.to_string())?;

        let personas = 1 + ben_count;
        let monto_por_mes = (config.cuota_mensual * personas as f64) + config.cuota_administracion;

        Ok(CoberturaResponse {
            cobertura,
            estado,
            max_meses_pagables: max_meses,
            cuota_mensual: config.cuota_mensual,
            cuota_administracion: config.cuota_administracion,
            beneficiarios_count: ben_count,
            personas,
            monto_por_mes,
        })
    }
}

