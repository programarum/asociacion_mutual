const UNIDADES: &[&str] = &[
    "", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
    "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete",
    "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés",
    "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho",
    "veintinueve",
];

const DECENAS: &[&str] = &[
    "", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta",
    "ochenta", "noventa",
];

const CENTENAS: &[&str] = &[
    "", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos",
    "seiscientos", "setecientos", "ochocientos", "novecientos",
];

pub fn convertir(numero: f64) -> String {
    let entero = numero as i64;
    let letras = convertir_entero(entero);
    let mut resultado = String::new();

    let mut chars = letras.chars();
    if let Some(first) = chars.next() {
        resultado.push(first.to_uppercase().next().unwrap());
        resultado.push_str(chars.as_str());
    } else {
        resultado = letras;
    }

    resultado.push_str(" pesos m/cte");
    resultado
}

fn convertir_entero(numero: i64) -> String {
    if numero == 0 {
        return "cero".to_string();
    }

    let mut partes: Vec<String> = Vec::new();
    let millones = numero / 1_000_000;
    let mut resto = numero % 1_000_000;

    if millones > 0 {
        if millones == 1 {
            partes.push("un millón".to_string());
        } else {
            partes.push(format!("{} millones", convertir_centenas(millones)));
        }
    }

    let miles = resto / 1000;
    resto = resto % 1000;

    if miles > 0 {
        if miles == 1 {
            partes.push("mil".to_string());
        } else {
            partes.push(format!("{} mil", convertir_centenas(miles)));
        }
    }

    if resto > 0 {
        partes.push(convertir_centenas(resto));
    }

    partes.join(" ")
}

fn convertir_centenas(numero: i64) -> String {
    if numero == 100 {
        return "cien".to_string();
    }

    if numero < 30 {
        return UNIDADES[numero as usize].to_string();
    }

    let centena = numero / 100;
    let resto = numero % 100;

    let mut partes: Vec<String> = Vec::new();

    if centena > 0 {
        partes.push(CENTENAS[centena as usize].to_string());
    }

    if resto > 0 {
        if resto < 30 {
            partes.push(UNIDADES[resto as usize].to_string());
        } else {
            let decena = resto / 10;
            let unidad = resto % 10;

            if unidad == 0 {
                partes.push(DECENAS[decena as usize].to_string());
            } else {
                partes.push(format!("{} y {}", DECENAS[decena as usize], UNIDADES[unidad as usize]));
            }
        }
    }

    partes.join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cero() {
        assert_eq!(convertir_entero(0), "cero");
    }

    #[test]
    fn test_unidades() {
        assert_eq!(convertir_entero(1), "uno");
        assert_eq!(convertir_entero(5), "cinco");
        assert_eq!(convertir_entero(9), "nueve");
    }

    #[test]
    fn test_del_10_al_29() {
        assert_eq!(convertir_entero(10), "diez");
        assert_eq!(convertir_entero(15), "quince");
        assert_eq!(convertir_entero(20), "veinte");
        assert_eq!(convertir_entero(21), "veintiuno");
        assert_eq!(convertir_entero(29), "veintinueve");
    }

    #[test]
    fn test_decenas() {
        assert_eq!(convertir_entero(30), "treinta");
        assert_eq!(convertir_entero(40), "cuarenta");
        assert_eq!(convertir_entero(99), "noventa y nueve");
        assert_eq!(convertir_entero(45), "cuarenta y cinco");
    }

    #[test]
    fn test_centenas() {
        assert_eq!(convertir_entero(100), "cien");
        assert_eq!(convertir_entero(101), "ciento uno");
        assert_eq!(convertir_entero(200), "doscientos");
        assert_eq!(convertir_entero(345), "trescientos cuarenta y cinco");
        assert_eq!(convertir_entero(999), "novecientos noventa y nueve");
    }

    #[test]
    fn test_miles() {
        assert_eq!(convertir_entero(1000), "mil");
        assert_eq!(convertir_entero(1001), "mil uno");
        assert_eq!(convertir_entero(1500), "mil quinientos");
        assert_eq!(convertir_entero(2025), "dos mil veinticinco");
        assert_eq!(convertir_entero(9999), "nueve mil novecientos noventa y nueve");
    }

    #[test]
    fn test_millones() {
        assert_eq!(convertir_entero(1_000_000), "un millón");
        assert_eq!(convertir_entero(1_000_001), "un millón uno");
        assert_eq!(convertir_entero(2_000_000), "dos millones");
        assert_eq!(convertir_entero(2_500_000), "dos millones quinientos mil");
        assert_eq!(
            convertir_entero(1_234_567),
            "un millón doscientos treinta y cuatro mil quinientos sesenta y siete"
        );
    }

    #[test]
    fn test_convertir() {
        let result = convertir(1234.56);
        assert!(result.starts_with("Mil"));
        assert!(result.contains("pesos m/cte"));
    }

    #[test]
    fn test_convertir_cero() {
        let result = convertir(0.0);
        assert_eq!(result, "Cero pesos m/cte");
    }
}
