<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BackupController extends Controller
{
    /**
     * Descarga una copia del archivo SQLite de la base de datos.
     */
    public function downloadSqlite()
    {
        $dbPath = database_path('database.sqlite');

        if (!file_exists($dbPath)) {
            return response()->json([
                'message' => 'No se encontró el archivo de base de datos SQLite.',
            ], 404);
        }

        $fecha = Carbon::now()->format('Y-m-d_His');
        $nombreArchivo = "backup_mutual_{$fecha}.sqlite";

        return response()->download($dbPath, $nombreArchivo, [
            'Content-Type' => 'application/octet-stream',
        ]);
    }

    /**
     * Genera y descarga un dump SQL de la base de datos.
     */
    public function downloadSql()
    {
        $fecha = Carbon::now()->format('Y-m-d_His');
        $nombreArchivo = "backup_mutual_{$fecha}.sql";

        $tablas = [
            'users',
            'asociados',
            'beneficiarios',
            'pagos',
            'coberturas',
            'configuracion',
            'fallecidos',
            'personal_access_tokens',
        ];

        $response = new StreamedResponse(function () use ($tablas) {
            $handle = fopen('php://output', 'w');

            fwrite($handle, "-- Backup Asociación Mutual\n");
            fwrite($handle, "-- Fecha: " . Carbon::now()->toDateTimeString() . "\n");
            fwrite($handle, "-- Motor: SQLite\n\n");
            fwrite($handle, "PRAGMA foreign_keys=OFF;\n\n");

            foreach ($tablas as $tabla) {
                $existe = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [$tabla]);
                if (empty($existe)) {
                    continue;
                }

                fwrite($handle, "-- Tabla: {$tabla}\n");
                fwrite($handle, "DROP TABLE IF EXISTS `{$tabla}`;\n");

                // Schema de creación
                $schema = DB::select("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", [$tabla]);
                if (!empty($schema) && isset($schema[0]->sql)) {
                    fwrite($handle, $schema[0]->sql . ";\n\n");
                }

                // Datos
                $filas = DB::table($tabla)->get();
                foreach ($filas as $fila) {
                    $columnas = array_keys((array) $fila);
                    $valores = array_map(function ($v) {
                        if ($v === null) {
                            return 'NULL';
                        }
                        return "'" . str_replace("'", "''", (string) $v) . "'";
                    }, array_values((array) $fila));

                    fwrite($handle, "INSERT INTO `{$tabla}` (`" . implode('`, `', $columnas) . "`) VALUES (" . implode(', ', $valores) . ");\n");
                }
                fwrite($handle, "\n");
            }

            fwrite($handle, "PRAGMA foreign_keys=ON;\n");
            fclose($handle);
        }, 200, [
            'Content-Type' => 'application/sql',
            'Content-Disposition' => 'attachment; filename="' . $nombreArchivo . '"',
        ]);

        return $response;
    }
}
