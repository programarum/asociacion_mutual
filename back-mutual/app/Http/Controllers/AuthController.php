<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Registrar un nuevo usuario
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Usuario registrado exitosamente',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Iniciar sesión
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Sesión iniciada exitosamente',
            'user' => $user,
            'token' => $token,
        ], 200);
    }

    /**
     * Obtener el usuario autenticado
     */
    public function user(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ], 200);
    }

    /**
     * Cerrar sesión
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada exitosamente',
        ], 200);
    }

    /**
     * Cerrar todas las sesiones
     */
    public function logoutAll(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Todas las sesiones han sido cerradas',
        ], 200);
    }

    /**
     * Actualizar perfil de usuario
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8|confirmed',
        ]);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }

        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }

        if (isset($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json([
            'message' => 'Perfil actualizado exitosamente',
            'user' => $user,
        ], 200);
    }

    /**
     * Obtener todos los usuarios (solo administrador)
     */
    public function getAllUsers(Request $request)
    {
        return User::paginate();
    }

    /**
     * Cambiar rol de un usuario (solo administrador)
     */
    public function changeUserRole(Request $request, User $user)
    {
        $validated = $request->validate([
            'role' => 'required|in:administrador,usuario',
        ]);

        $user->role = $validated['role'];
        $user->save();

        return response()->json([
            'message' => 'Rol actualizado exitosamente',
            'user' => $user,
        ], 200);
    }

    /**
     * Eliminar usuario (solo administrador)
     */
    public function deleteUser(Request $request, User $user)
    {
        // Prevenir que se elimine a sí mismo
        if ($request->user()->id === $user->id) {
            return response()->json([
                'message' => 'No puedes eliminar tu propia cuenta',
            ], 403);
        }

        $user->delete();

        return response()->json([
            'message' => 'Usuario eliminado exitosamente',
        ], 200);
    }
}
