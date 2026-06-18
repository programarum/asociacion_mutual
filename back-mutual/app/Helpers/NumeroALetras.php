<?php

namespace App\Helpers;

/**
 * Convierte un número a su representación en letras (español, formato colombiano).
 * Ejemplo: 19000 -> "Diecinueve mil pesos m/cte"
 */
class NumeroALetras
{
    private static array $unidades = [
        '', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
        'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete',
        'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés',
        'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho',
        'veintinueve',
    ];

    private static array $decenas = [
        '', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta',
        'ochenta', 'noventa',
    ];

    private static array $centenas = [
        '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
        'seiscientos', 'setecientos', 'ochocientos', 'novecientos',
    ];

    public static function convertir(float $numero, string $moneda = 'pesos m/cte'): string
    {
        $entero = (int) floor($numero);
        $centavos = (int) round(($numero - $entero) * 100);

        $letras = self::convertirEntero($entero);
        $resultado = ucfirst($letras) . ' ' . $moneda;

        return $resultado;
    }

    private static function convertirEntero(int $numero): string
    {
        if ($numero === 0) {
            return 'cero';
        }

        if ($numero < 0) {
            return 'menos ' . self::convertirEntero(abs($numero));
        }

        $partes = [];
        $millones = (int) floor($numero / 1000000);
        $resto = $numero % 1000000;

        if ($millones > 0) {
            if ($millones === 1) {
                $partes[] = 'un millón';
            } else {
                $partes[] = self::convertirCentenas($millones) . ' millones';
            }
        }

        $miles = (int) floor($resto / 1000);
        $resto = $resto % 1000;

        if ($miles > 0) {
            if ($miles === 1) {
                $partes[] = 'mil';
            } else {
                $partes[] = self::convertirCentenas($miles) . ' mil';
            }
        }

        if ($resto > 0) {
            $partes[] = self::convertirCentenas($resto);
        }

        return implode(' ', $partes);
    }

    private static function convertirCentenas(int $numero): string
    {
        if ($numero === 100) {
            return 'cien';
        }

        if ($numero < 30) {
            return self::$unidades[$numero];
        }

        $centena = (int) floor($numero / 100);
        $resto = $numero % 100;

        $partes = [];

        if ($centena > 0) {
            $partes[] = self::$centenas[$centena];
        }

        if ($resto > 0) {
            if ($resto < 30) {
                $partes[] = self::$unidades[$resto];
            } else {
                $decena = (int) floor($resto / 10);
                $unidad = $resto % 10;

                if ($unidad === 0) {
                    $partes[] = self::$decenas[$decena];
                } else {
                    $partes[] = self::$decenas[$decena] . ' y ' . self::$unidades[$unidad];
                }
            }
        }

        return implode(' ', $partes);
    }
}
