pub mod user;
pub mod asociado;
pub mod beneficiario;
pub mod pago;
pub mod cobertura;
pub mod fallecido;
pub mod configuracion;
pub mod licencia;

pub use beneficiario::Beneficiario;
pub use cobertura::Cobertura;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_asociado_serialize_deserialize() {
        let json = r#"{
            "id": 1,
            "codigo": "A001",
            "primer_nombre": "Juan",
            "segundo_nombre": "Carlos",
            "primer_apellido": "Pérez",
            "segundo_apellido": null,
            "documento": "12345678",
            "email": "juan@test.com",
            "telefono": "555-1234",
            "direccion": "Calle 123",
            "mes_actual": "2026-01",
            "mese_pagados": "6",
            "gran_total": "1500.00",
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": null
        }"#;
        let a: asociado::Asociado = serde_json::from_str(json).unwrap();
        assert_eq!(a.id, 1);
        assert_eq!(a.codigo, "A001");
        assert_eq!(a.primer_nombre, "Juan");
        assert_eq!(a.segundo_nombre, Some("Carlos".to_string()));
        assert_eq!(a.primer_apellido, "Pérez");
        assert_eq!(a.documento, "12345678");
        assert_eq!(a.email, "juan@test.com");
        assert_eq!(a.gran_total, Some("1500.00".to_string()));

        let serialized = serde_json::to_string(&a).unwrap();
        assert!(serialized.contains("\"codigo\":\"A001\""));
    }

    #[test]
    fn test_user_serialize_deserialize() {
        let json = r#"{"id":1,"name":"Admin","email":"admin@test.com","role":"administrador"}"#;
        let u: user::User = serde_json::from_str(json).unwrap();
        assert_eq!(u.id, 1);
        assert_eq!(u.name, "Admin");
        assert_eq!(u.role, "administrador");
        assert!(u.created_at.is_none());
    }

    #[test]
    fn test_beneficiario_serialize_deserialize() {
        let json = r#"{
            "id": 1,
            "asociado_id": 1,
            "primer_nombre": "Ana",
            "primer_apellido": "García",
            "documento": "87654321",
            "fecha_nacimiento": "1990-05-15",
            "parentesco": "conyuge",
            "sexo": "femenino",
            "fecha_afiliacion": "2026-01-01"
        }"#;
        let b: beneficiario::Beneficiario = serde_json::from_str(json).unwrap();
        assert_eq!(b.id, 1);
        assert_eq!(b.primer_nombre, "Ana");
        assert_eq!(b.parentesco, "conyuge");
        assert_eq!(b.segundo_nombre, None);
        assert_eq!(b.segundo_apellido, None);
    }

    #[test]
    fn test_cobertura_serialize_deserialize() {
        let json = r#"{"id":1,"asociado_id":1,"fecha_inicio":"2026-01-01","mes_pagado_hasta":"2026-06-01","estado":"vigente"}"#;
        let c: cobertura::Cobertura = serde_json::from_str(json).unwrap();
        assert_eq!(c.id, 1);
        assert_eq!(c.estado, "vigente");
        assert_eq!(c.mes_pagado_hasta, Some("2026-06-01".to_string()));
    }

    #[test]
    fn test_configuracion_serialize_deserialize() {
        let json = r#"{"id":1,"cuota_mensual":150.50,"cuota_administracion":25.00}"#;
        let c: configuracion::Configuracion = serde_json::from_str(json).unwrap();
        assert_eq!(c.id, 1);
        assert!((c.cuota_mensual - 150.50).abs() < f64::EPSILON);
        assert!((c.cuota_administracion - 25.00).abs() < f64::EPSILON);
    }

    #[test]
    fn test_pago_serialize_deserialize() {
        let json = r#"{"id":1,"asociado_id":1,"meses_pagados":3,"monto":450.0,"fecha_pago":"2026-06-15","mes_desde":"2026-06-01","mes_hasta":"2026-08-31"}"#;
        let p: pago::Pago = serde_json::from_str(json).unwrap();
        assert_eq!(p.id, 1);
        assert_eq!(p.meses_pagados, 3);
        assert!((p.monto - 450.0).abs() < f64::EPSILON);
        assert_eq!(p.mes_desde, "2026-06-01");
        assert!(p.created_at.is_none());
    }

    #[test]
    fn test_fallecido_serialize_deserialize() {
        let json = r#"{"id":1,"tipo":"asociado","primer_nombre":"Juan","primer_apellido":"Pérez","documento":"12345678","fecha_fallecimiento":"2026-06-01"}"#;
        let f: fallecido::Fallecido = serde_json::from_str(json).unwrap();
        assert_eq!(f.id, 1);
        assert_eq!(f.tipo, "asociado");
        assert_eq!(f.primer_nombre, "Juan");
        assert!(f.datos_extras.is_none());
    }

    #[test]
    fn test_licencia_serialize_deserialize() {
        let json = r#"{"id":1,"machine_hash":"abc123","license_key":"LIC-XXXX-YYYY","fecha_activacion":"2026-01-01T00:00:00Z"}"#;
        let l: licencia::Licencia = serde_json::from_str(json).unwrap();
        assert_eq!(l.id, 1);
        assert_eq!(l.machine_hash, "abc123");
        assert_eq!(l.license_key, "LIC-XXXX-YYYY");
    }

    #[test]
    fn test_paginated_response() {
        let json = r#"{"data":[],"total":0,"per_page":10,"current_page":1,"last_page":0}"#;
        let pr: asociado::PaginatedResponse<asociado::Asociado> = serde_json::from_str(json).unwrap();
        assert_eq!(pr.total, 0);
        assert_eq!(pr.per_page, 10);
        assert_eq!(pr.current_page, 1);
        assert!(pr.data.is_empty());
    }
}
