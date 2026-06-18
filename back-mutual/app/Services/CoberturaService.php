<?php

namespace App\Services;

use App\Models\Asociado;
use App\Models\Cobertura;
use App\Models\Configuracion;
use App\Models\Pago;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CoberturaService
{
    /**
     * Calcula cuántos meses puede pagar un asociado sin pasar del 31/Dic del año en curso.
     */
    public function maxMesesPagables(Asociado $asociado): int
    {
        $hoy = Carbon::now()->startOfMonth();
        $limite = Carbon::now()->endOfYear(); // 31/Dic del año actual

        $cobertura = $asociado->cobertura;

        $base = $hoy->copy();

        if ($cobertura && $cobertura->mes_pagado_hasta) {
            $pagadoHasta = Carbon::parse($cobertura->mes_pagado_hasta)->startOfMonth();

            if ($pagadoHasta->greaterThanOrEqualTo($hoy)) {
                // Sigue vigente: extender desde el mes siguiente al último pagado
                $base = $pagadoHasta->copy()->addMonth()->startOfMonth();
            }
            // Si está moroso, base se mantiene en el mes actual
        }

        if ($base->greaterThan($limite)) {
            return 0;
        }

        // Meses disponibles incluye el mes base
        $mesesDisponibles = $base->diffInMonths($limite) + 1;

        return (int) min($mesesDisponibles, 12);
    }

    /**
     * Registra un pago de N meses validando el límite del año en curso.
     * Crea/actualiza la cobertura y sincroniza las columnas legacy del asociado.
     */
    public function registrarPago(Asociado $asociado, int $meses): Pago
    {
        $max = $this->maxMesesPagables($asociado);

        if ($meses < 1 || $meses > $max) {
            throw new \DomainException(
                "La cantidad de meses ({$meses}) no es válida. Máximo pagable: {$max}."
            );
        }

        $config = Configuracion::singleton();
        $cuotaMensual = (float) $config->cuota_mensual;
        $cuotaAdmin = (float) $config->cuota_administracion;
        $personas = 1 + $asociado->beneficiarios()->count();
        $montoPorMes = ($cuotaMensual * $personas) + $cuotaAdmin;
        $monto = $montoPorMes * $meses;

        return DB::transaction(function () use ($asociado, $meses, $monto) {
            $hoy = Carbon::now()->startOfMonth();
            $cobertura = $asociado->cobertura;

            // Determinar mes_desde
            $mesDesde = $hoy->copy();
            if ($cobertura && $cobertura->mes_pagado_hasta) {
                $pagadoHasta = Carbon::parse($cobertura->mes_pagado_hasta)->startOfMonth();
                if ($pagadoHasta->greaterThanOrEqualTo($hoy)) {
                    $mesDesde = $pagadoHasta->copy()->addMonth()->startOfMonth();
                }
            }

            // mes_hasta = último día del mes (mesDesde + (meses - 1))
            $mesHasta = $mesDesde->copy()->addMonths($meses - 1)->endOfMonth();

            $pago = $asociado->pagos()->create([
                'meses_pagados' => $meses,
                'monto' => $monto,
                'fecha_pago' => Carbon::today(),
                'mes_desde' => $mesDesde->toDateString(),
                'mes_hasta' => $mesHasta->toDateString(),
            ]);

            // Actualizar/crear cobertura
            if ($cobertura) {
                $cobertura->update([
                    'fecha_inicio' => $cobertura->fecha_inicio ?? Carbon::today(),
                    'mes_pagado_hasta' => $mesHasta->toDateString(),
                    'estado' => 'vigente',
                ]);
            } else {
                $asociado->cobertura()->create([
                    'fecha_inicio' => Carbon::today(),
                    'mes_pagado_hasta' => $mesHasta->toDateString(),
                    'estado' => 'vigente',
                ]);
            }

            // Sincronizar columnas legacy
            $totalMeses = (int) $asociado->pagos()->sum('meses_pagados');
            $granTotal = (float) $asociado->pagos()->sum('monto');

            $asociado->update([
                'mes_actual' => $mesHasta->toDateString(),
                'mese_pagados' => (string) $totalMeses,
                'gran_total' => (string) number_format($granTotal, 2, '.', ''),
            ]);

            return $pago;
        });
    }

    /**
     * Recalcula el estado (vigente/moroso) de una cobertura al comparar
     * mes_pagado_hasta con el mes calendario actual.
     */
    public function recalcularEstado(Cobertura $cobertura): string
    {
        if (!$cobertura->mes_pagado_hasta) {
            $estado = 'moroso';
        } else {
            $pagadoHasta = Carbon::parse($cobertura->mes_pagado_hasta)->startOfMonth();
            $hoy = Carbon::now()->startOfMonth();
            $estado = $pagadoHasta->greaterThanOrEqualTo($hoy) ? 'vigente' : 'moroso';
        }

        if ($cobertura->estado !== $estado) {
            $cobertura->update(['estado' => $estado]);
        }

        return $estado;
    }

    /**
     * Recorre todas las coberturas y actualiza su estado de morosidad.
     * Devuelve el número de coberturas que cambiaron de estado.
     */
    public function actualizarTodas(): int
    {
        $cambiadas = 0;
        foreach (Cobertura::all() as $cobertura) {
            $antes = $cobertura->estado;
            $this->recalcularEstado($cobertura);
            if ($cobertura->fresh()->estado !== $antes) {
                $cambiadas++;
            }
        }
        return $cambiadas;
    }
}
