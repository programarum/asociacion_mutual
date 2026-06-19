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
