use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Fallecido {
    pub id: i64,
    pub tipo: String,
    pub primer_nombre: String,
    pub segundo_nombre: Option<String>,
    pub primer_apellido: String,
    pub segundo_apellido: Option<String>,
    pub documento: String,
    pub fecha_fallecimiento: String,
    pub fecha_afiliacion: Option<String>,
    pub asociado_origen_id: Option<i64>,
    pub parentesco: Option<String>,
    pub sexo: Option<String>,
    pub datos_extras: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct MarcarAsociadoFallecidoRequest {
    pub beneficiario_id: i64,
    pub fecha_fallecimiento: String,
}

#[derive(Debug, Deserialize)]
pub struct MarcarBeneficiarioFallecidoRequest {
    pub fecha_fallecimiento: String,
}
