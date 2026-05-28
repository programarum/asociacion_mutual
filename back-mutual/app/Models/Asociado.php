<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
