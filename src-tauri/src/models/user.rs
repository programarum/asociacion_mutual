#![allow(dead_code)]

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: i64,
    pub name: String,
    pub email: String,
    pub role: String,
    pub created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub user: User,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    pub current_password: String,
    pub name: Option<String>,
    pub email: Option<String>,
    pub password: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub name: String,
    pub email: String,
    pub password: String,
}
