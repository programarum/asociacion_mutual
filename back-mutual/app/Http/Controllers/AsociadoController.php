<?php

namespace App\Http\Controllers;

use App\Models\Asociado;
use Illuminate\Http\Request;

class AsociadoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Asociado::all();
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $asociado = Asociado::create($request->all());
        return response()->json($asociado, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Asociado $asociado)
    {
        return $asociado;
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Asociado $asociado)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Asociado $asociado)
    {
        $asociado->update($request->all());
        return response()->json($asociado, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Asociado $asociado)
    {
        $asociado->delete();
        return response()->json();
    }
}
