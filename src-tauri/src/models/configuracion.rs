use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Configuracion {
    pub id: i64,
    pub cuota_mensual: f64,
    pub cuota_administracion: f64,
    #[serde(default)]
    pub nombre_empresa: String,
    #[serde(default)]
    pub ruc: String,
    #[serde(default)]
    pub direccion: String,
    #[serde(default)]
    pub telefono1: String,
    #[serde(default)]
    pub telefono2: String,
    #[serde(default)]
    pub whatsapp: String,
    #[serde(default)]
    pub email: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateConfiguracionRequest {
    pub cuota_mensual: f64,
    pub cuota_administracion: f64,
    pub nombre_empresa: String,
    pub ruc: String,
    pub direccion: String,
    pub telefono1: String,
    pub telefono2: String,
    pub whatsapp: String,
    pub email: String,
}
