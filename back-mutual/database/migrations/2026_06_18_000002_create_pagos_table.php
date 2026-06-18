<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asociado_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('meses_pagados');
            $table->decimal('monto', 10, 2);
            $table->date('fecha_pago');
            $table->date('mes_desde');
            $table->date('mes_hasta');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos');
    }
};
