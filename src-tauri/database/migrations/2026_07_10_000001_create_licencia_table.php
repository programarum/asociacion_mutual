<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('licencia', function (Blueprint $table) {
            $table->id();
            $table->text('machine_hash');
            $table->text('license_key');
            $table->datetime('fecha_activacion');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('licencia');
    }
};
