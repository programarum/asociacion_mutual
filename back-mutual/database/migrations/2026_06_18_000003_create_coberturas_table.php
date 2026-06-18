<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coberturas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asociado_id')->unique()->constrained()->cascadeOnDelete();
            $table->date('fecha_inicio')->nullable();
            $table->date('mes_pagado_hasta')->nullable();
            $table->enum('estado', ['vigente', 'moroso'])->default('moroso');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coberturas');
    }
};
