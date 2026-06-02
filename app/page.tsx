"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, WifiOff, Loader2, CheckCircle2 } from "lucide-react";
import AuthService from "../services/AuthService";
import api from "../services/api";

type ServerStatus = "checking" | "online" | "offline";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus>("checking");

  // Verificar conexión al servidor al iniciar
  useEffect(() => {
    // Si ya está autenticado, redirigir al dashboard
    if (AuthService.isAuthenticated()) {
      router.push("/dashboard");
      return;
    }

    checkServer();
  }, [router]);

  const checkServer = async () => {
    setServerStatus("checking");
    try {
      await api.get("/asociados", { timeout: 5000 });
      setServerStatus("online");
    } catch (err: unknown) {
      const error = err as { code?: string; response?: { status: number } };
      // Si el servidor responde (aunque sea un error 401/403), está online
      if (error.response) {
        setServerStatus("online");
      } else {
        setServerStatus("offline");
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await AuthService.login({ email, password });
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { code?: string; response?: { data?: { message?: string }; status?: number } };
      if (error.code === "ERR_NETWORK") {
        setError("No se pudo conectar al servidor.");
        setServerStatus("offline");
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Email o contraseña incorrectos");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-stone-900 via-slate-800 to-stone-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card Login */}
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-teal-600 to-teal-700 px-8 py-12 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Mutual</h1>
            <p className="text-blue-100">Asociación Mutual</p>
          </div>

          {/* Server Status Banner */}
          {serverStatus === "checking" && (
            <div className="px-8 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              <p className="text-sm text-blue-700">Verificando conexión al servidor...</p>
            </div>
          )}
          {/* {serverStatus === "online" && (
            <div className="px-8 py-3 bg-green-50 border-b border-green-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <p className="text-sm text-green-700">Servidor conectado</p>
            </div>
          )} */}
          {serverStatus === "offline" && (
            <div className="px-8 py-3 bg-red-50 border-b border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <WifiOff className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-700 font-medium">Servidor no disponible</p>
              </div>
              <p className="text-xs text-red-600">
                No se pudo conectar al servidor. Verifique que esté en ejecución.
              </p>
              <button
                onClick={checkServer}
                className="mt-2 text-xs text-red-700 font-semibold hover:text-red-900 underline transition-colors"
              >
                Reintentar conexión
              </button>
            </div>
          )}

          {/* Form */}
          <div className="px-8 py-10">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 text-neutral-950 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                    disabled={loading || serverStatus === "offline"}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-neutral-950 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition"
                    disabled={loading || serverStatus === "offline"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || serverStatus === "offline"}
                className="w-full bg-linear-to-r from-teal-600 to-teal-700 text-white font-semibold py-2.5 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              © 2026 Asociación Mutual. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
