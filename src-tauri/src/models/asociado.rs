use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Asociado {
    pub id: i64,
    pub codigo: String,
    pub primer_nombre: String,
    pub segundo_nombre: Option<String>,
    pub primer_apellido: String,
    pub segundo_apellido: Option<String>,
    pub documento: String,
    pub email: String,
    pub telefono: String,
    pub direccion: String,
    pub mes_actual: Option<String>,
    pub mese_pagados: Option<String>,
    pub gran_total: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub beneficiarios: Option<Vec<crate::models::Beneficiario>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cobertura: Option<crate::models::Cobertura>,
}

#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub total: i64,
    pub per_page: i64,
    pub current_page: i64,
    pub last_page: i64,
}
