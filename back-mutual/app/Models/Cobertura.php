<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cobertura extends Model
{
    protected $fillable = [
        'asociado_id',
        'fecha_inicio',
        'mes_pagado_hasta',
        'estado',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'mes_pagado_hasta' => 'date',
    ];

    public function asociado(): BelongsTo
    {
        return $this->belongsTo(Asociado::class);
    }
}
