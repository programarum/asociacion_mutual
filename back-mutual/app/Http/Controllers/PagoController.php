<?php

namespace App\Http\Controllers;

use App\Helpers\NumeroALetras;
use App\Models\Asociado;
use App\Models\Configuracion;
use App\Models\Pago;
use App\Services\CoberturaService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PagoController extends Controller
{
    public function __construct(private CoberturaService $service)
    {
    }

    public function index(Asociado $asociado)
    {
        return $asociado->pagos()->orderByDesc('fecha_pago')->paginate();
    }

    public function store(Request $request, Asociado $asociado)
    {
        $validated = $request->validate([
            'meses' => 'required|integer|min:1|max:12',
        ]);

        try {
            $pago = $this->service->registrarPago($asociado, $validated['meses']);
            return response()->json($pago, 201);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Genera los datos del comprobante de pago para impresión.
     */
    public function comprobante(Asociado $asociado, Pago $pago)
    {
        if ((int) $pago->asociado_id !== (int) $asociado->id) {
            return response()->json([
                'message' => 'El pago no pertenece a este asociado.',
            ], 422);
        }

        $asociado->load('beneficiarios');
        $config = Configuracion::singleton();

        $monto = (float) $pago->monto;
        $montoLetras = NumeroALetras::convertir($monto);

        // Generar nombres de los meses que cubre el pago
        $mesesCubiertos = [];
        $mesDesde = Carbon::parse($pago->mes_desde)->startOfMonth();
        $nombresMeses = [
            1 => 'Ene', 2 => 'Feb', 3 => 'Mar', 4 => 'Abr', 5 => 'May', 6 => 'Jun',
            7 => 'Jul', 8 => 'Ago', 9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Dic',
        ];

        for ($i = 0; $i < $pago->meses_pagados; $i++) {
            $fecha = $mesDesde->copy()->addMonths($i);
            $mesesCubiertos[] = [
                'mes' => $nombresMeses[(int) $fecha->month],
                'año' => (int) $fecha->year,
                'label' => $nombresMeses[(int) $fecha->month] . ' ' . $fecha->year,
            ];
        }

        return response()->json([
            'recibo_numero' => $pago->id,
            'asociado' => [
                'codigo' => $asociado->codigo,
                'nombre_completo' => trim(
                    $asociado->primer_nombre . ' ' .
                    ($asociado->segundo_nombre ?? '') . ' ' .
                    $asociado->primer_apellido . ' ' .
                    ($asociado->segundo_apellido ?? '')
                ),
                'documento' => $asociado->documento,
            ],
            'beneficiarios' => $asociado->beneficiarios->map(function ($b) {
                return [
                    'id' => $b->id,
                    'nombre_completo' => trim(
                        $b->primer_nombre . ' ' .
                        ($b->segundo_nombre ?? '') . ' ' .
                        $b->primer_apellido . ' ' .
                        ($b->segundo_apellido ?? '')
                    ),
                    'parentesco' => $b->parentesco,
                    'documento' => $b->documento,
                ];
            }),
            'pago' => [
                'id' => $pago->id,
                'meses_pagados' => $pago->meses_pagados,
                'monto' => $monto,
                'monto_formateado' => '$' . number_format($monto, 2, ',', '.'),
                'monto_letras' => $montoLetras,
                'fecha_pago' => $pago->fecha_pago->toDateString(),
                'mes_desde' => $pago->mes_desde->toDateString(),
                'mes_hasta' => $pago->mes_hasta->toDateString(),
                'meses_cubiertos' => $mesesCubiertos,
            ],
            'configuracion' => [
                'cuota_mensual' => (float) $config->cuota_mensual,
                'cuota_administracion' => (float) $config->cuota_administracion,
            ],
            'fecha_impresion' => Carbon::now()->toDateString(),
        ], 200);
    }
}
