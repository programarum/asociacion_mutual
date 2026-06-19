use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Cobertura {
    pub id: i64,
    pub asociado_id: i64,
    pub fecha_inicio: Option<String>,
    pub mes_pagado_hasta: Option<String>,
    pub estado: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CoberturaResponse {
    pub cobertura: Option<Cobertura>,
    pub estado: String,
    pub max_meses_pagables: i64,
    pub cuota_mensual: f64,
    pub cuota_administracion: f64,
    pub beneficiarios_count: i64,
    pub personas: i64,
    pub monto_por_mes: f64,
}
