<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fallecido extends Model
{
    protected $fillable = [
        'tipo',
        'primer_nombre',
        'segundo_nombre',
        'primer_apellido',
        'segundo_apellido',
        'documento',
        'fecha_fallecimiento',
        'fecha_afiliacion',
        'asociado_origen_id',
        'parentesco',
        'sexo',
        'datos_extras',
    ];

    protected $casts = [
        'fecha_fallecimiento' => 'date',
        'fecha_afiliacion' => 'date',
        'datos_extras' => 'array',
    ];
}
