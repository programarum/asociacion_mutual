#!/usr/bin/env python3
"""
Herramienta para generar claves de licencia Ed25519.
Solo para uso del desarrollador/administrador.

Uso:
  python license_tool.py keygen          # Generar nuevo keypair
  python license_tool.py sign <machine_id> <private_key_hex>  # Firmar machine_id
"""

import sys
import os
import hashlib

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
except ImportError:
    print("ERROR: Se requiere la librería 'cryptography'.")
    print("Instalar con: pip install cryptography")
    sys.exit(1)


def keygen():
    """Genera un nuevo keypair Ed25519."""
    private_key = Ed25519PrivateKey.generate()
    private_bytes = private_key.private_bytes_raw()
    public_bytes = private_key.public_key().public_bytes_raw()

    print("=" * 60)
    print("KEYPAIR ED25519 GENERADO")
    print("=" * 60)
    print()
    print("PRIVATE_KEY (guardar de forma segura, NO compartir):")
    print(f"  {private_bytes.hex()}")
    print()
    print("PUBLIC_KEY (copiar al código Rust en license.rs):")
    print(f"  {public_bytes.hex()}")
    print()
    print("Rust byte array:")
    byte_str = ", ".join(f"0x{b:02x}" for b in public_bytes)
    print(f"  [{byte_str}]")
    print()
    print("=" * 60)
    print("IMPORTANTE: Guardar PRIVATE_KEY en un lugar seguro.")
    print("Nunca compartir la clave privada.")
    print("=" * 60)


def sign(machine_id: str, private_key_hex: str):
    """Firma un machine_id con la clave privada."""
    try:
        private_bytes = bytes.fromhex(private_key_hex)
        if len(private_bytes) != 32:
            print(f"ERROR: La clave privada debe tener 32 bytes (64 hex chars). Tiene {len(private_bytes)} bytes.")
            sys.exit(1)

        private_key = Ed25519PrivateKey.from_private_bytes(private_bytes)
        signature = private_key.sign(machine_id.encode("utf-8"))

        print("=" * 60)
        print("LICENCIA GENERADA")
        print("=" * 60)
        print()
        print(f"Machine ID: {machine_id}")
        print(f"License Key: {signature.hex()}")
        print()
        print("Entregar esta License Key al usuario para activar la app.")
        print("=" * 60)

        # Guardar en archivo para fácil acceso
        output_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "license_output.txt")
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("=" * 60 + "\n")
            f.write("LICENCIA GENERADA\n")
            f.write("=" * 60 + "\n\n")
            f.write(f"Machine ID: {machine_id}\n")
            f.write(f"License Key: {signature.hex()}\n\n")
            f.write("Entregar esta License Key al usuario para activar la app.\n")
            f.write("=" * 60 + "\n")
        print(f"\nLicencia guardada en: {output_file}")
    except Exception as e:
        print(f"ERROR al firmar: {e}")
        sys.exit(1)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "keygen":
        keygen()
    elif command == "sign":
        if len(sys.argv) != 4:
            print("Uso: python license_tool.py sign <machine_id> <private_key_hex>")
            sys.exit(1)
        sign(sys.argv[2], sys.argv[3])
    else:
        print(f"Comando desconocido: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
