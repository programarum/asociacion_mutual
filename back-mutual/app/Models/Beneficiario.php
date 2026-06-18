<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Beneficiario extends Model
{
    protected $fillable = [
        'asociado_id',
        'primer_nombre',
        'segundo_nombre',
        'primer_apellido',
        'segundo_apellido',
        'documento',
        'fecha_nacimiento',
        'parentesco',
        'sexo',
        'fecha_afiliacion',
    ];

    public function asociado()
    {
        return $this->belongsTo(Asociado::class);
    }
}
