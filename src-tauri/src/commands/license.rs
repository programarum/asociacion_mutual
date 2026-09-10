use crate::commands::auth::DbState;
use crate::models::licencia::LicenseStatus;
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use sha2::{Digest, Sha256};
use std::fs;
use tauri::State;
#[cfg(target_os = "windows")]
use std::process::Command;

// Clave pública Ed25519 embebida en el binario (32 bytes).
// La clave privada NUNCA está aquí — solo el desarrollador la tiene.
const PUBLIC_KEY_BYTES: [u8; 32] = [
    0xbd, 0x21, 0xb1, 0x8d, 0x57, 0x3c, 0xaf, 0x68,
    0xde, 0x7f, 0x92, 0xe5, 0xb3, 0x0b, 0x13, 0x2d,
    0x3a, 0xf5, 0x9a, 0xb4, 0xc4, 0xb0, 0x43, 0x8d,
    0xff, 0xad, 0x0d, 0x28, 0xa0, 0xdc, 0x7e, 0xc3,
];

/// Obtiene el número de serie del disco duro principal (Windows).
#[cfg(target_os = "windows")]
fn get_disk_serial() -> Result<String, String> {
    powershell_serial().or_else(|_| wmic_serial())
}

/// Serial del disco vía PowerShell (Get-CimInstance). `wmic` está deprecado.
#[cfg(target_os = "windows")]
fn powershell_serial() -> Result<String, String> {
    let script = "Get-CimInstance Win32_DiskDrive | ForEach-Object { $_.SerialNumber.Trim() } | Where-Object { $_ -ne '' } | Select-Object -First 1";
    let output = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
        .output()
        .map_err(|e| format!("Error ejecutando PowerShell: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let serial = stdout
        .lines()
        .map(|l| l.trim().to_string())
        .find(|s| !s.is_empty())
        .unwrap_or_default();

    if serial.is_empty() {
        return Err("PowerShell no devolvió el serial del disco".to_string());
    }

    Ok(serial)
}

/// Serial del disco vía wmic (fallback para sistemas sin Get-CimInstance).
#[cfg(target_os = "windows")]
fn wmic_serial() -> Result<String, String> {
    let output = Command::new("wmic")
        .args(["diskdrive", "get", "serialnumber"])
        .output()
        .map_err(|e| format!("Error al obtener serial del disco (wmic): {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let serial = stdout
        .lines()
        .skip(1) // Saltar encabezado "SerialNumber"
        .find(|l| !l.trim().is_empty())
        .map(|l| l.trim().to_string())
        .unwrap_or_default();

    if serial.is_empty() {
        return Err("wmic no devolvió el serial del disco".to_string());
    }

    Ok(serial)
}

/// Obtiene un identificador estable de la máquina en sistemas no Windows
/// (dev en Linux): el machine-id del sistema.
#[cfg(not(target_os = "windows"))]
fn get_disk_serial() -> Result<String, String> {
    let id = fs::read_to_string("/etc/machine-id")
        .or_else(|_| fs::read_to_string("/var/lib/dbus/machine-id"))
        .map_err(|e| format!("No se pudo obtener el machine-id: {}", e))?;
    Ok(id.trim().to_string())
}

/// Calcula el machine_id: SHA-256 del serial del disco, en hex.
fn compute_machine_id(disk_serial: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(disk_serial.as_bytes());
    let result = hasher.finalize();
    result
        .iter()
        .map(|b| format!("{:02x}", b))
        .collect()
}

/// Convierte un string hex a bytes.
fn hex_to_bytes(hex: &str) -> Result<Vec<u8>, String> {
    if hex.len() % 2 != 0 {
        return Err("Hex string inválido: longitud impar".to_string());
    }
    (0..hex.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&hex[i..i + 2], 16).map_err(|e| format!("Hex inválido: {}", e)))
        .collect()
}

/// Verifica una firma Ed25519.
fn verify_signature(machine_id: &str, license_key_hex: &str) -> Result<bool, String> {
    let public_key =
        VerifyingKey::from_bytes(&PUBLIC_KEY_BYTES).map_err(|e| format!("Clave pública inválida: {}", e))?;

    let sig_bytes = hex_to_bytes(license_key_hex)?;
    if sig_bytes.len() != 64 {
        return Err("Firma inválida: debe tener 64 bytes".to_string());
    }
    let mut sig_array = [0u8; 64];
    sig_array.copy_from_slice(&sig_bytes);
    let signature = Signature::from_bytes(&sig_array);

    Ok(public_key.verify(machine_id.as_bytes(), &signature).is_ok())
}

/// Verifica el estado de la licencia actual.
#[tauri::command]
pub fn verify_license(db: State<'_, DbState>) -> Result<LicenseStatus, String> {
    // En builds para Linux se omite la verificación de licencia;
    // la licencia solo se exige en Windows.
    #[cfg(target_os = "linux")]
    {
        let machine_id = compute_machine_id(&get_disk_serial()?);
        return Ok(LicenseStatus {
            valid: true,
            machine_id,
            needs_activation: false,
        });
    }

    let disk_serial = get_disk_serial()?;
    let machine_id = compute_machine_id(&disk_serial);

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let result = conn.query_row(
        "SELECT machine_hash, license_key FROM licencia WHERE id = 1",
        [],
        |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
            ))
        },
    );

    match result {
        Ok((stored_hash, stored_key)) => {
            // Verificar que el machine_hash coincida con el disco actual
            if stored_hash != machine_id {
                return Ok(LicenseStatus {
                    valid: false,
                    machine_id,
                    needs_activation: true,
                });
            }
            // Verificar la firma
            let sig_valid = verify_signature(&machine_id, &stored_key)?;
            Ok(LicenseStatus {
                valid: sig_valid,
                machine_id,
                needs_activation: !sig_valid,
            })
        }
        Err(_) => {
            // No hay licencia en la BD
            Ok(LicenseStatus {
                valid: false,
                machine_id,
                needs_activation: true,
            })
        }
    }
}

/// Activa la licencia verificando la firma Ed25519.
#[tauri::command]
pub fn activate_license(license_key: String, db: State<'_, DbState>) -> Result<LicenseStatus, String> {
    let disk_serial = get_disk_serial()?;
    let machine_id = compute_machine_id(&disk_serial);

    // Verificar la firma
    let sig_valid = verify_signature(&machine_id, &license_key)?;
    if !sig_valid {
        return Err("La clave de licencia no es válida para este equipo".to_string());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // Verificar si ya existe un registro
    let existing: Option<i64> = conn
        .query_row("SELECT id FROM licencia WHERE id = 1", [], |row| row.get(0))
        .ok();

    let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    if existing.is_some() {
        conn.execute(
            "UPDATE licencia SET machine_hash = ?1, license_key = ?2, fecha_activacion = ?3 WHERE id = 1",
            rusqlite::params![machine_id, license_key, now],
        )
        .map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "INSERT INTO licencia (id, machine_hash, license_key, fecha_activacion) VALUES (1, ?1, ?2, ?3)",
            rusqlite::params![machine_id, license_key, now],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(LicenseStatus {
        valid: true,
        machine_id,
        needs_activation: false,
    })
}
