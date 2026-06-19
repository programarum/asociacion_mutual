import { useLocation } from "react-router-dom";
import { LogOut, ShieldAlert, User } from "lucide-react";
import { useRole } from "../hooks/useRole";
import { useAuth } from "../hooks/useAuth";

const TITULOS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/asociados": "Asociados",
  "/dashboard/usuarios": "Gestión de Usuarios",
  "/dashboard/setting": "Configuración",
  "/dashboard/fallecidos": "Fallecidos",
  "/dashboard/backup": "Copia de Seguridad",
};

export default function Navbar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { role } = useRole();
  const { user: authUser, logout } = useAuth();

  const titulo =
    TITULOS[pathname] ??
    (Object.keys(TITULOS)
      .filter((k) => pathname.startsWith(k) && k !== "/dashboard")
      .sort((a, b) => b.length - a.length)[0]
      ? TITULOS[
          Object.keys(TITULOS)
            .filter((k) => pathname.startsWith(k) && k !== "/dashboard")
            .sort((a, b) => b.length - a.length)[0]
        ]
      : "Dashboard");

  return (
    <nav className="bg-white shadow-md shrink-0">
      <div className="px-6 py-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{titulo}</h2>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="font-semibold text-gray-800">
              {authUser?.name ?? "Usuario"}
            </p>
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
  );
}
