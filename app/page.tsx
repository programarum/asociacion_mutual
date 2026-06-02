"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Usuarios de ejemplo
  const demoUsers = [
    { email: "demo@mutual.com", password: "password123", role: "admin" },
    { email: "user@mutual.com", password: "password123", role: "user" },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simular delay de petición
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = demoUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      localStorage.setItem("authToken", "demo-token-" + Date.now());
      localStorage.setItem("userRole", user.role);
      router.push("/dashboard");
    } else {
      setError("Email o contraseña incorrectos");
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
                    placeholder="demo@mutual.com"
                    className="w-full pl-10 pr-4 py-2.5 text-neutral-950 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                    disabled={loading}
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
                    placeholder="password123"
                    className="w-full pl-10 pr-10 py-2.5 text-neutral-950 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition"
                    disabled={loading}
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
                disabled={loading}
                className="w-full bg-linear-to-r from-teal-600 to-teal-700 text-white font-semibold py-2.5 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-900 mb-3">📝 CREDENCIALES DE PRUEBA:</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-blue-800"><span className="font-semibold">Admin:</span></p>
                  <p className="text-xs text-blue-800 ml-2">
                    <span className="font-mono">demo@mutual.com</span> / <span className="font-mono">password123</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-800"><span className="font-semibold">Usuario:</span></p>
                  <p className="text-xs text-blue-800 ml-2">
                    <span className="font-mono">user@mutual.com</span> / <span className="font-mono">password123</span>
                  </p>
                </div>
              </div>
            </div>
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
