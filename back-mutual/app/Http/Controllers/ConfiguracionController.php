<?php

namespace App\Http\Controllers;

use App\Models\Configuracion;
use Illuminate\Http\Request;

class ConfiguracionController extends Controller
{
    public function show()
    {
        return response()->json(Configuracion::singleton(), 200);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'cuota_mensual' => 'required|numeric|min:0',
            'cuota_administracion' => 'required|numeric|min:0',
        ]);

        $config = Configuracion::singleton();
        $config->update([
            'cuota_mensual' => $validated['cuota_mensual'],
            'cuota_administracion' => $validated['cuota_administracion'],
        ]);

        return response()->json($config, 200);
    }
}
