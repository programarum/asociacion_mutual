<?php

namespace App\Console\Commands;

use App\Services\CoberturaService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('coberturas:actualizar')]
#[Description('Recalcula el estado de morosidad de todas las coberturas comparando mes_pagado_hasta con el mes actual.')]
class ActualizarCoberturas extends Command
{
    public function handle(CoberturaService $service)
    {
        $this->info('Actualizando estados de cobertura...');

        $cambiadas = $service->actualizarTodas();

        $this->info("Coberturas procesadas. {$cambiadas} cambiaron de estado.");

        return self::SUCCESS;
    }
}
