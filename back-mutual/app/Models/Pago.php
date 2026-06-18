<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pago extends Model
{
    protected $fillable = [
        'asociado_id',
        'meses_pagados',
        'monto',
        'fecha_pago',
        'mes_desde',
        'mes_hasta',
    ];

    protected $casts = [
        'meses_pagados' => 'integer',
        'monto' => 'decimal:2',
        'fecha_pago' => 'date',
        'mes_desde' => 'date',
        'mes_hasta' => 'date',
    ];

    public function asociado(): BelongsTo
    {
        return $this->belongsTo(Asociado::class);
    }
}
