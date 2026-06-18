<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Configuracion extends Model
{
    protected $table = 'configuracion';

    protected $fillable = [
        'cuota_mensual',
        'cuota_administracion',
    ];

    protected $casts = [
        'cuota_mensual' => 'decimal:2',
        'cuota_administracion' => 'decimal:2',
    ];

    /**
     * Devuelve la fila única de configuración, creándola si no existe.
     */
    public static function singleton(): self
    {
        return self::firstOrCreate(
            ['id' => 1],
            ['cuota_mensual' => 0, 'cuota_administracion' => 0]
        );
    }
}
