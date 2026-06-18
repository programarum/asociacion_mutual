<?php

namespace App\Http\Controllers;

use App\Models\Asociado;
use App\Services\CoberturaService;
use Illuminate\Http\Request;

class CoberturaController extends Controller
{
    public function __construct(private CoberturaService $service)
    {
    }

    public function show(Asociado $asociado)
    {
        $asociado->load('cobertura');
        $asociado->loadCount('beneficiarios');
        $maxMeses = $this->service->maxMesesPagables($asociado);

        // Recalcular estado on-demand
        $estado = 'moroso';
        if ($asociado->cobertura) {
            $estado = $this->service->recalcularEstado($asociado->cobertura);
        }

        $config = \App\Models\Configuracion::singleton();
        $cuotaMensual = (float) $config->cuota_mensual;
        $cuotaAdmin = (float) $config->cuota_administracion;
        $personas = 1 + $asociado->beneficiarios_count;
        $montoPorMes = ($cuotaMensual * $personas) + $cuotaAdmin;

        return response()->json([
            'cobertura' => $asociado->cobertura,
            'estado' => $estado,
            'max_meses_pagables' => $maxMeses,
            'cuota_mensual' => $cuotaMensual,
            'cuota_administracion' => $cuotaAdmin,
            'beneficiarios_count' => $asociado->beneficiarios_count,
            'personas' => $personas,
            'monto_por_mes' => $montoPorMes,
        ], 200);
    }

    public function morosos()
    {
        // Recalcular on-demand y devolver asociados morosos
        $this->service->actualizarTodas();

        $asociados = Asociado::whereHas('cobertura', function ($q) {
            $q->where('estado', 'moroso');
        })
            ->with('cobertura')
            ->paginate();

        return response()->json($asociados, 200);
    }
}
