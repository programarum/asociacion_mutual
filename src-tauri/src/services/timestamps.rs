pub fn ahora_sql() -> String {
    chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ahora_sql_formato() {
        let ts = ahora_sql();
        assert_eq!(ts.len(), 19);
        assert_eq!(&ts[4..5], "-");
        assert_eq!(&ts[10..11], " ");
        chrono::NaiveDateTime::parse_from_str(&ts, "%Y-%m-%d %H:%M:%S").unwrap();
    }
}
