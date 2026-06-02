<?php

use App\Http\Controllers\AsociadoController;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Rutas públicas de autenticación
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas (requieren autenticación con Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // Rutas de administrador
    Route::middleware('role:administrador')->group(function () {
        Route::get('/users', [AuthController::class, 'getAllUsers']);
        Route::put('/users/{user}/role', [AuthController::class, 'changeUserRole']);
        Route::delete('/users/{user}', [AuthController::class, 'deleteUser']);
    });
});

// Rutas de Asociados (mantienen su funcionalidad)
Route::apiResource('asociados', AsociadoController::class);
