<?php

namespace App\Http\Controllers;

use App\Models\Asociado;
use App\Models\Beneficiario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AsociadoController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');

        $query = Asociado::with(['beneficiarios', 'cobertura']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('codigo', 'like', "%{$search}%")
                  ->orWhere('primer_nombre', 'like', "%{$search}%")
                  ->orWhere('segundo_nombre', 'like', "%{$search}%")
                  ->orWhere('primer_apellido', 'like', "%{$search}%")
                  ->orWhere('segundo_apellido', 'like', "%{$search}%")
                  ->orWhere('documento', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return $query->paginate();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|unique:asociados,codigo',
            'primer_nombre' => 'required|string|max:255',
            'segundo_nombre' => 'nullable|string|max:255',
            'primer_apellido' => 'required|string|max:255',
            'segundo_apellido' => 'nullable|string|max:255',
            'documento' => 'required|string|unique:asociados,documento',
            'email' => 'required|email|unique:asociados,email',
            'telefono' => 'required|string|max:255',
            'direccion' => 'required|string|max:255',
            'mes_actual' => 'nullable|date',
            'mese_pagados' => 'nullable|string',
            'gran_total' => 'nullable|string',
        ]);

        $asociado = Asociado::create($validated);
        return response()->json($asociado, 201);
    }

    public function show(Asociado $asociado)
    {
        return $asociado->load(['beneficiarios', 'cobertura']);
    }

    public function update(Request $request, Asociado $asociado)
    {
        $validated = $request->validate([
            'codigo' => 'sometimes|string|unique:asociados,codigo,' . $asociado->id,
            'primer_nombre' => 'sometimes|string|max:255',
            'segundo_nombre' => 'nullable|string|max:255',
            'primer_apellido' => 'sometimes|string|max:255',
            'segundo_apellido' => 'nullable|string|max:255',
            'documento' => 'sometimes|string|unique:asociados,documento,' . $asociado->id,
            'email' => 'sometimes|email|unique:asociados,email,' . $asociado->id,
            'telefono' => 'sometimes|string|max:255',
            'direccion' => 'sometimes|string|max:255',
            'mes_actual' => 'nullable|date',
            'mese_pagados' => 'nullable|string',
            'gran_total' => 'nullable|string',
        ]);

        $asociado->update($validated);
        return response()->json($asociado, 200);
    }

    public function destroy(Asociado $asociado)
    {
        $asociado->delete();
        return response()->json(null, 204);
    }

    /**
     * Promociona un beneficiario a asociado y elimina el asociado anterior.
     * El beneficiario seleccionado hereda los datos de contacto y pago del
     * asociado anterior, y se elimina de la tabla de beneficiarios.
     */
    public function transferAndDelete(Request $request, Asociado $asociado)
    {
        $validated = $request->validate([
            'beneficiario_id' => 'required|exists:beneficiarios,id',
        ]);

        $beneficiario = Beneficiario::findOrFail($validated['beneficiario_id']);

        if ((int) $beneficiario->asociado_id !== (int) $asociado->id) {
            return response()->json([
                'message' => 'El beneficiario no pertenece a este asociado.',
            ], 422);
        }

        return DB::transaction(function () use ($asociado, $beneficiario) {
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

            $beneficiario->delete();
            $asociado->delete();

            return response()->json([
                'message' => 'Beneficiario promocionado y asociado anterior eliminado.',
                'asociado' => $nuevoAsociado->load('beneficiarios'),
            ], 200);
        });
    }
}
