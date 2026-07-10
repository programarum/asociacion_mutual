mod db;
mod models;
mod commands;
mod services;

use commands::auth::DbState;
use commands::session::Session;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let conn = db::init_db(app.handle())?;
            app.manage(DbState(Mutex::new(conn)));
            app.manage(Session::new());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth
            commands::auth::login,
            commands::auth::get_current_user,
            commands::auth::logout,
            commands::auth::register,
            commands::auth::update_profile,
            // Asociados
            commands::asociados::list_asociados,
            commands::asociados::get_asociado,
            commands::asociados::create_asociado,
            commands::asociados::update_asociado,
            commands::asociados::delete_asociado,
            commands::asociados::transfer_and_delete,
            // Beneficiarios
            commands::beneficiarios::list_beneficiarios,
            commands::beneficiarios::create_beneficiario,
            commands::beneficiarios::update_beneficiario,
            commands::beneficiarios::delete_beneficiario,
            // Pagos
            commands::pagos::list_pagos,
            commands::pagos::create_pago,
            commands::pagos::get_comprobante,
            // Cobertura
            commands::cobertura::get_cobertura,
            commands::cobertura::list_morosos,
            // Fallecidos
            commands::fallecidos::list_fallecidos,
            commands::fallecidos::marcar_asociado_fallecido,
            commands::fallecidos::marcar_beneficiario_fallecido,
            // Configuracion
            commands::configuracion::get_configuracion,
            commands::configuracion::update_configuracion,
            // Users
            commands::users::list_users,
            commands::users::change_user_role,
            commands::users::delete_user,
            // Backup
            commands::backup::export_sqlite,
            commands::backup::export_sql,
            // License
            commands::license::verify_license,
            commands::license::activate_license,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
