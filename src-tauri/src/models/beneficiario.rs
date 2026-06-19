use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Beneficiario {
    pub id: i64,
    pub asociado_id: i64,
    pub primer_nombre: String,
    pub segundo_nombre: Option<String>,
    pub primer_apellido: String,
    pub segundo_apellido: Option<String>,
    pub documento: String,
    pub fecha_nacimiento: String,
    pub parentesco: String,
    pub sexo: String,
    pub fecha_afiliacion: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBeneficiarioRequest {
    pub primer_nombre: String,
    pub segundo_nombre: Option<String>,
    pub primer_apellido: String,
    pub segundo_apellido: Option<String>,
    pub documento: String,
    pub fecha_nacimiento: String,
    pub parentesco: String,
    pub sexo: String,
    pub fecha_afiliacion: String,
}
