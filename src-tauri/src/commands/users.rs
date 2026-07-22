use crate::commands::auth::DbState;
use crate::commands::session::Session;
use crate::models::asociado::PaginatedResponse;
use crate::models::user::User;
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub fn list_users(db: State<'_, DbState>, session: State<'_, Session>) -> Result<PaginatedResponse<User>, String> {
    if !session.is_admin() {
        return Err("No tienes permisos".to_string());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let total: i64 = conn.query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0)).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT id, name, email, role, created_at FROM users ORDER BY id").map_err(|e| e.to_string())?;
    let data = stmt.query_map([], |row| {
        Ok(User { id: row.get(0)?, name: row.get(1)?, email: row.get(2)?, role: row.get(3)?, created_at: row.get(4)? })
    }).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    Ok(PaginatedResponse { data, total, per_page: total, current_page: 1, last_page: 1 })
}

#[tauri::command]
pub fn change_user_role(user_id: i64, role: String, db: State<'_, DbState>, session: State<'_, Session>) -> Result<User, String> {
    if !session.is_admin() {
        return Err("No tienes permisos".to_string());
    }

    if role != "administrador" && role != "usuario" {
        return Err("Rol inválido".to_string());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("UPDATE users SET role = ?1 WHERE id = ?2", params![role, user_id]).map_err(|e| e.to_string())?;

    conn.query_row("SELECT id, name, email, role, created_at FROM users WHERE id = ?1", [user_id], |row| {
        Ok(User { id: row.get(0)?, name: row.get(1)?, email: row.get(2)?, role: row.get(3)?, created_at: row.get(4)? })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_user(user_id: i64, db: State<'_, DbState>, session: State<'_, Session>) -> Result<(), String> {
    if !session.is_admin() {
        return Err("No tienes permisos".to_string());
    }

    let current = session.get_user().ok_or("No autenticado")?;
    if current.id == user_id {
        return Err("No puedes eliminar tu propia cuenta".to_string());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM users WHERE id = ?1", [user_id]).map_err(|e| e.to_string())?;
    Ok(())
}