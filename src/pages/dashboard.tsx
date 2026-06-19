import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useAsociados } from "../hooks/useAsociados";

export default function Dashboard() {
  const { data } = useAsociados();
  const asociadosCount = data?.total ?? 0;

  const { data: morososData } = useQuery({
    queryKey: ["morosos"],
    queryFn: async () => {
      return await invoke<{ total: number }>("list_morosos");
    },
  });
  const morososCount = morososData?.total ?? 0;

  return (
    <>
      {/* Content Area */}
      <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Card: Asociados */}
            <Link to="/dashboard/asociados">
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

            {/* Card: Morosos */}
            <Link to="/dashboard/asociados">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Asociados Morosos
                    </p>
                    <p
                      className={`text-3xl font-bold mt-2 ${
                        morososCount > 0 ? "text-red-600" : "text-gray-800"
                      }`}
                    >
                      {morososCount}
                    </p>
                  </div>
                  <AlertTriangle
                    className={`w-8 h-8 ${
                      morososCount > 0 ? "text-red-500" : "text-gray-300"
                    }`}
                  />
                </div>
              </div>
            </Link>
</div>

          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Bienvenido
            </h3>
            <p className="text-gray-600">
              Aquí puedes gestionar toda la información de tu asociación mutual.
            </p>
          </div>
        </main>
    </>
  );
}
