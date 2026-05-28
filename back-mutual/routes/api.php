<?php

use App\Http\Controllers\AsociadoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::apiResource('asociados', AsociadoController::class);
