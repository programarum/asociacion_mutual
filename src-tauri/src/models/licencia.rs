use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct Licencia {
    pub id: i64,
    pub machine_hash: String,
    pub license_key: String,
    pub fecha_activacion: String,
}

#[derive(Debug, Serialize)]
pub struct LicenseStatus {
    pub valid: bool,
    pub machine_id: String,
    pub needs_activation: bool,
}
