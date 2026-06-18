<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Asociado extends Model
{
    protected $fillable = [
        'codigo',
        'primer_nombre',
        'segundo_nombre',
        'primer_apellido',
        'segundo_apellido',
        'documento',
        'email',
        'telefono',
        'direccion',
        'mes_actual',
        'mese_pagados',
        'gran_total'
    ];

    public function beneficiarios(): HasMany
    {
        return $this->hasMany(Beneficiario::class);
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class);
    }

    public function cobertura(): HasOne
    {
        return $this->hasOne(Cobertura::class);
    }
}
