<?php

namespace App\Http\Controllers;

use App\Models\Asociado;
use App\Models\Beneficiario;
use App\Models\Fallecido;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FallecidoController extends Controller
{
    /**
     * Listado de fallecidos con buscador opcional.
     */
    public function index(Request $request)
    {
        $search = $request->query('search');

        $query = Fallecido::query()->orderByDesc('fecha_fallecimiento');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('primer_nombre', 'like', "%{$search}%")
                  ->orWhere('segundo_nombre', 'like', "%{$search}%")
                  ->orWhere('primer_apellido', 'like', "%{$search}%")
                  ->orWhere('segundo_apellido', 'like', "%{$search}%")
                  ->orWhere('documento', 'like', "%{$search}%");
            });
        }

        return $query->paginate();
    }

    /**
     * Marca un asociado como fallecido. Promociona un beneficiario a titular
     * (igual que transferAndDelete) y mueve el asociado a la tabla de fallecidos.
     */
    public function marcarAsociadoFallecido(Request $request, Asociado $asociado)
    {
        $validated = $request->validate([
            'beneficiario_id' => 'required|exists:beneficiarios,id',
            'fecha_fallecimiento' => 'required|date',
        ]);

        $beneficiario = Beneficiario::findOrFail($validated['beneficiario_id']);

        if ((int) $beneficiario->asociado_id !== (int) $asociado->id) {
            return response()->json([
                'message' => 'El beneficiario no pertenece a este asociado.',
            ], 422);
        }

        return DB::transaction(function () use ($asociado, $beneficiario, $validated) {
            // Guardar registro del asociado en fallecidos
            Fallecido::create([
                'tipo' => 'asociado',
                'primer_nombre' => $asociado->primer_nombre,
                'segundo_nombre' => $asociado->segundo_nombre,
                'primer_apellido' => $asociado->primer_apellido,
                'segundo_apellido' => $asociado->segundo_apellido,
                'documento' => $asociado->documento,
                'fecha_fallecimiento' => $validated['fecha_fallecimiento'],
                'fecha_afiliacion' => null,
                'asociado_origen_id' => $asociado->id,
                'datos_extras' => [
                    'email' => $asociado->email,
                    'telefono' => $asociado->telefono,
                    'direccion' => $asociado->direccion,
                    'codigo' => $asociado->codigo,
                    'mes_actual' => $asociado->mes_actual,
                    'mese_pagados' => $asociado->mese_pagados,
                    'gran_total' => $asociado->gran_total,
                ],
            ]);

            // Promocionar beneficiario a nuevo asociado titular
            $nuevoAsociado = Asociado::create([
                'codigo' => $asociado->codigo,
                'primer_nombre' => $beneficiario->primer_nombre,
                'segundo_nombre' => $beneficiario->segundo_nombre,
                'primer_apellido' => $beneficiario->primer_apellido,
                'segundo_apellido' => $beneficiario->segundo_apellido,
                'documento' => $beneficiario->documento,
                'email' => $asociado->email,
                'telefono' => $asociado->telefono,
                'direccion' => $asociado->direccion,
                'mes_actual' => $asociado->mes_actual,
                'mese_pagados' => $asociado->mese_pagados,
                'gran_total' => $asociado->gran_total,
            ]);

            // Reasignar los demás beneficiarios al nuevo asociado
            $asociado->beneficiarios()
                ->where('id', '!=', $beneficiario->id)
                ->update(['asociado_id' => $nuevoAsociado->id]);

            // Reasignar pagos y cobertura al nuevo asociado
            $asociado->pagos()->update(['asociado_id' => $nuevoAsociado->id]);
            $cobertura = $asociado->cobertura;
            if ($cobertura) {
                $cobertura->update(['asociado_id' => $nuevoAsociado->id]);
            }

            $beneficiario->delete();
            $asociado->delete();

            return response()->json([
                'message' => 'Asociado marcado como fallecido. Beneficiario promocionado a titular.',
                'asociado' => $nuevoAsociado->load(['beneficiarios', 'cobertura']),
            ], 200);
        });
    }

    /**
     * Marca un beneficiario como fallecido. Lo mueve a la tabla de fallecidos
     * y lo elimina de la tabla de beneficiarios.
     */
    public function marcarBeneficiarioFallecido(
        Request $request,
        Asociado $asociado,
        Beneficiario $beneficiario
    ) {
        $validated = $request->validate([
            'fecha_fallecimiento' => 'required|date',
        ]);

        if ((int) $beneficiario->asociado_id !== (int) $asociado->id) {
            return response()->json([
                'message' => 'El beneficiario no pertenece a este asociado.',
            ], 422);
        }

        return DB::transaction(function () use ($asociado, $beneficiario, $validated) {
            Fallecido::create([
                'tipo' => 'beneficiario',
                'primer_nombre' => $beneficiario->primer_nombre,
                'segundo_nombre' => $beneficiario->segundo_nombre,
                'primer_apellido' => $beneficiario->primer_apellido,
                'segundo_apellido' => $beneficiario->segundo_apellido,
                'documento' => $beneficiario->documento,
                'fecha_fallecimiento' => $validated['fecha_fallecimiento'],
                'fecha_afiliacion' => $beneficiario->fecha_afiliacion,
                'asociado_origen_id' => $asociado->id,
                'parentesco' => $beneficiario->parentesco,
                'sexo' => $beneficiario->sexo,
            ]);

            $beneficiario->delete();

            return response()->json([
                'message' => 'Beneficiario marcado como fallecido.',
            ], 200);
        });
    }
}
