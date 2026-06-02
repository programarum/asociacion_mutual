"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../services/api";
import { LogOut, ShieldAlert, User } from "lucide-react";
import { useRole } from "../../hooks/useRole";

export default function Dashboard() {
  const router = useRouter();
  const { role } = useRole();
  const [asociadosCount, setAsociadosCount] = useState(0);
  const [user, setUser] = useState({ name: "Usuario", email: "usuario@example.com" });

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    router.push("/");
  };

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
                <p className="font-semibold text-gray-800">{user.name}</p>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  {role === "admin" ? (
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
                onClick={handleLogout}
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
                  {/* <Users className="w-12 h-12 text-blue-500 opacity-20" /> */}
                </div>
              </div>
            </Link>
</div>

          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Bienvenido, {user.name}
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
