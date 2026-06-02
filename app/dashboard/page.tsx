"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../services/api";
import { LogOut, ShieldAlert, User } from "lucide-react";
import { useRole } from "../../hooks/useRole";
import { useAuth } from "../../hooks/useAuth";

export default function Dashboard() {
  const { role } = useRole();
  const { user: authUser, logout } = useAuth();
  const [asociadosCount, setAsociadosCount] = useState(0);

  useEffect(() => {
    const fetchAsociadosCount = async () => {
      try {
        const response = await api.get("/asociados");
        setAsociadosCount(response.data.length);
      } catch (error) {
        console.error("Error fetching asociados:", error);
      }
    };

    fetchAsociadosCount();
  }, []);

  return (
    <>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <nav className="bg-white shadow-md">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold text-gray-800">{authUser?.name ?? "Usuario"}</p>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  {role === "administrador" ? (
                    <>
                      <ShieldAlert className="w-3 h-3" />
                      <span>Administrador</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3" />
                      <span>Usuario</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Card: Asociados */}
            <Link href="/dashboard/asociados">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Asociados</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {asociadosCount}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
</div>

          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Bienvenido, {authUser?.name ?? "Usuario"}
            </h3>
            <p className="text-gray-600">
              Aquí puedes gestionar toda la información de tu asociación mutual.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
