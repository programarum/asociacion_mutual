use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Configuracion {
    pub id: i64,
    pub cuota_mensual: f64,
    pub cuota_administracion: f64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateConfiguracionRequest {
    pub cuota_mensual: f64,
    pub cuota_administracion: f64,
}
