<?php

namespace App\Http\Controllers;

use App\Models\Asociado;
use App\Models\Beneficiario;
use Illuminate\Http\Request;

class BeneficiarioController extends Controller
{
    public function index(Asociado $asociado)
    {
        return $asociado->beneficiarios()->paginate();
    }

    public function store(Request $request, Asociado $asociado)
    {
        $validated = $request->validate([
            'primer_nombre' => 'required|string|max:255',
            'segundo_nombre' => 'nullable|string|max:255',
            'primer_apellido' => 'required|string|max:255',
            'segundo_apellido' => 'nullable|string|max:255',
            'documento' => 'required|string|max:255',
            'fecha_nacimiento' => 'required|date',
            'parentesco' => 'required|string|max:255',
            'sexo' => 'required|string|max:1',
            'fecha_afiliacion' => 'required|date',
        ]);

        $beneficiario = $asociado->beneficiarios()->create($validated);
        return response()->json($beneficiario, 201);
    }

    public function show(Asociado $asociado, Beneficiario $beneficiario)
    {
        return $beneficiario;
    }

    public function update(Request $request, Asociado $asociado, Beneficiario $beneficiario)
    {
        $validated = $request->validate([
            'primer_nombre' => 'sometimes|string|max:255',
            'segundo_nombre' => 'nullable|string|max:255',
            'primer_apellido' => 'sometimes|string|max:255',
            'segundo_apellido' => 'nullable|string|max:255',
            'documento' => 'sometimes|string|max:255',
            'fecha_nacimiento' => 'sometimes|date',
            'parentesco' => 'sometimes|string|max:255',
            'sexo' => 'sometimes|string|max:1',
            'fecha_afiliacion' => 'sometimes|date',
        ]);

        $beneficiario->update($validated);
        return response()->json($beneficiario, 200);
    }

    public function destroy(Asociado $asociado, Beneficiario $beneficiario)
    {
        $beneficiario->delete();
        return response()->json(null, 204);
    }
}
