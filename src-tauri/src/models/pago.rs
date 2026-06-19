use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pago {
    pub id: i64,
    pub asociado_id: i64,
    pub meses_pagados: i64,
    pub monto: f64,
    pub fecha_pago: String,
    pub mes_desde: String,
    pub mes_hasta: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ComprobanteData {
    pub recibo_numero: i64,
    pub asociado: ComprobanteAsociado,
    pub beneficiarios: Vec<ComprobanteBeneficiario>,
    pub pago: ComprobantePago,
    pub configuracion: ComprobanteConfig,
    pub fecha_impresion: String,
}

#[derive(Debug, Serialize)]
pub struct ComprobanteAsociado {
    pub codigo: String,
    pub nombre_completo: String,
    pub documento: String,
}

#[derive(Debug, Serialize)]
pub struct ComprobanteBeneficiario {
    pub id: i64,
    pub nombre_completo: String,
    pub parentesco: String,
    pub documento: String,
}

#[derive(Debug, Serialize)]
pub struct ComprobantePago {
    pub id: i64,
    pub meses_pagados: i64,
    pub monto: f64,
    pub monto_formateado: String,
    pub monto_letras: String,
    pub fecha_pago: String,
    pub mes_desde: String,
    pub mes_hasta: String,
    pub meses_cubiertos: Vec<MesCubierto>,
}

#[derive(Debug, Serialize)]
pub struct MesCubierto {
    pub mes: String,
    pub ano: i64,
    pub label: String,
}

#[derive(Debug, Serialize)]
pub struct ComprobanteConfig {
    pub cuota_mensual: f64,
    pub cuota_administracion: f64,
}
