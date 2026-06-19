use crate::commands::session::Session;
use crate::models::user::*;
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;

pub struct DbState(pub Mutex<Connection>);

#[tauri::command]
pub fn login(
    email: String,
    password: String,
    db: State<'_, DbState>,
    session: State<'_, Session>,
) -> Result<LoginResponse, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let user = conn
        .query_row(
            "SELECT id, name, email, role, created_at FROM users WHERE email = ?1",
            [&email],
            |row| {
                Ok(User {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    email: row.get(2)?,
                    role: row.get(3)?,
                    created_at: row.get(4)?,
                })
            },
        )
        .map_err(|_| "Credenciales incorrectas".to_string())?;

    let hash: String = conn
        .query_row(
            "SELECT password FROM users WHERE email = ?1",
            [&email],
            |row| row.get(0),
        )
        .map_err(|_| "Credenciales incorrectas".to_string())?;

    if !bcrypt::verify(&password, &hash).map_err(|e| e.to_string())? {
        return Err("Credenciales incorrectas".to_string());
    }

    session.set_user(user.clone());

    Ok(LoginResponse { user })
}

#[tauri::command]
pub fn get_current_user(session: State<'_, Session>) -> Result<Option<User>, String> {
    Ok(session.get_user())
}

#[tauri::command]
pub fn logout(session: State<'_, Session>) -> Result<(), String> {
    session.clear();
    Ok(())
}

#[tauri::command]
pub fn register(
    name: String,
    email: String,
    password: String,
    db: State<'_, DbState>,
    session: State<'_, Session>,
) -> Result<User, String> {
    if !session.is_admin() {
        return Err("No tienes permisos para realizar esta acción".to_string());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let existing: Option<i64> = conn
        .query_row(
            "SELECT id FROM users WHERE email = ?1",
            [&email],
            |row| row.get(0),
        )
        .ok();

    if existing.is_some() {
        return Err("Ya existe un usuario con este email".to_string());
    }

    let hash = bcrypt::hash(&password, 12).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO users (name, email, password, role) VALUES (?1, ?2, ?3, 'usuario')",
        rusqlite::params![&name, &email, &hash],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(User {
        id,
        name,
        email,
        role: "usuario".to_string(),
        created_at: Some(chrono::Utc::now().to_rfc3339()),
    })
}

#[tauri::command]
pub fn update_profile(
    current_password: String,
    name: Option<String>,
    email: Option<String>,
    password: Option<String>,
    db: State<'_, DbState>,
    session: State<'_, Session>,
) -> Result<User, String> {
    let user = session.get_user().ok_or("No autenticado")?;

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let hash: String = conn
        .query_row(
            "SELECT password FROM users WHERE id = ?1",
            [user.id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if !bcrypt::verify(&current_password, &hash).map_err(|e| e.to_string())? {
        return Err("La contraseña actual es incorrecta".to_string());
    }

    if let Some(ref n) = name {
        conn.execute("UPDATE users SET name = ?1 WHERE id = ?2", rusqlite::params![n, user.id])
            .map_err(|e| e.to_string())?;
    }

    if let Some(ref e) = email {
        conn.execute("UPDATE users SET email = ?1 WHERE id = ?2", rusqlite::params![e, user.id])
            .map_err(|e| e.to_string())?;
    }

    if let Some(ref p) = password {
        let new_hash = bcrypt::hash(p, 12).map_err(|e| e.to_string())?;
        conn.execute("UPDATE users SET password = ?1 WHERE id = ?2", rusqlite::params![new_hash, user.id])
            .map_err(|e| e.to_string())?;
    }

    let updated = conn
        .query_row(
            "SELECT id, name, email, role, created_at FROM users WHERE id = ?1",
            [user.id],
            |row| {
                Ok(User {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    email: row.get(2)?,
                    role: row.get(3)?,
                    created_at: row.get(4)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    session.set_user(updated.clone());

    Ok(updated)
}
