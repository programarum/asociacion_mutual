<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fallecidos', function (Blueprint $table) {
            $table->id();
            $table->enum('tipo', ['asociado', 'beneficiario']);
            $table->string('primer_nombre');
            $table->string('segundo_nombre')->nullable();
            $table->string('primer_apellido');
            $table->string('segundo_apellido')->nullable();
            $table->string('documento');
            $table->date('fecha_fallecimiento');
            $table->date('fecha_afiliacion')->nullable();
            $table->unsignedBigInteger('asociado_origen_id')->nullable();
            $table->string('parentesco')->nullable();
            $table->string('sexo')->nullable();
            $table->json('datos_extras')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fallecidos');
    }
};
