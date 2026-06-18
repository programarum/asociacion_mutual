<?php

use App\Http\Controllers\AsociadoController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\BeneficiarioController;
use App\Http\Controllers\CoberturaController;
use App\Http\Controllers\ConfiguracionController;
use App\Http\Controllers\FallecidoController;
use App\Http\Controllers\PagoController;
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

        // Copias de seguridad
        Route::get('/backup/sqlite', [BackupController::class, 'downloadSqlite']);
        Route::get('/backup/sql', [BackupController::class, 'downloadSql']);
    });
});

// Configuración global (cuota mensual)
Route::get('/configuracion', [ConfiguracionController::class, 'show']);
Route::put('/configuracion', [ConfiguracionController::class, 'update']);

// Rutas de Asociados
Route::apiResource('asociados', AsociadoController::class);

// Promocionar beneficiario a asociado y eliminar el asociado anterior
Route::post('/asociados/{asociado}/transfer', [AsociadoController::class, 'transferAndDelete']);

// Beneficiarios anidados a asociados
Route::apiResource('asociados.beneficiarios', BeneficiarioController::class);

// Pagos de un asociado
Route::get('/asociados/{asociado}/pagos', [PagoController::class, 'index']);
Route::post('/asociados/{asociado}/pagos', [PagoController::class, 'store']);
Route::get('/asociados/{asociado}/pagos/{pago}/comprobante', [PagoController::class, 'comprobante']);

// Cobertura de un asociado
Route::get('/asociados/{asociado}/cobertura', [CoberturaController::class, 'show']);

// Listado global de morosos
Route::get('/coberturas/morosos', [CoberturaController::class, 'morosos']);

// Fallecidos
Route::get('/fallecidos', [FallecidoController::class, 'index']);
Route::post('/asociados/{asociado}/fallecer', [FallecidoController::class, 'marcarAsociadoFallecido']);
Route::post('/asociados/{asociado}/beneficiarios/{beneficiario}/fallecer', [FallecidoController::class, 'marcarBeneficiarioFallecido']);
