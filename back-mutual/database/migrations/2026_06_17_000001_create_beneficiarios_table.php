<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('beneficiarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asociado_id')->constrained()->cascadeOnDelete();
            $table->string('primer_nombre');
            $table->string('segundo_nombre')->nullable();
            $table->string('primer_apellido');
            $table->string('segundo_apellido')->nullable();
            $table->string('documento');
            $table->date('fecha_nacimiento');
            $table->string('parentesco');
            $table->string('sexo');
            $table->date('fecha_afiliacion');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beneficiarios');
    }
};
