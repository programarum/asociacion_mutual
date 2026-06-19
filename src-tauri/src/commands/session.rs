use crate::models::user::*;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

/// Estado de sesión en memoria. Persiste mientras la app está abierta.
pub struct Session {
    pub user: Mutex<Option<User>>,
}

impl Session {
    pub fn new() -> Self {
        Self {
            user: Mutex::new(None),
        }
    }

    pub fn get_user(&self) -> Option<User> {
        self.user.lock().ok()?.clone()
    }

    pub fn set_user(&self, user: User) {
        if let Ok(mut guard) = self.user.lock() {
            *guard = Some(user);
        }
    }

    pub fn clear(&self) {
        if let Ok(mut guard) = self.user.lock() {
            *guard = None;
        }
    }

    pub fn is_admin(&self) -> bool {
        self.get_user().map(|u| u.role == "administrador").unwrap_or(false)
    }
}
